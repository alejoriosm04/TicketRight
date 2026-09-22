import {
  Duracion,
  nuevoId,
  type BoletaEmitida,
  type EmisorDeBoletas,
  type FechaHora,
  type IdOpaco,
  type UUID,
} from "@ticketright/shared-kernel";

import { PagoConfirmado, PagoSolicitado } from "../domain/events.js";
import { Discrepancia, type ResolucionDiscrepancia, type TipoDiscrepancia } from "../domain/discrepancy.js";
import { FirmaDeWebhookInvalida, OrigenDePagoInvalido } from "../domain/errors.js";
import { Localidad } from "../domain/inventory.js";
import { OrigenPago, Pago } from "../domain/payment.js";
import { CalculadoraDePrecio } from "../domain/pricing.js";
import { ItemReserva, Reserva } from "../domain/reservation.js";
import type {
  RepositorioDeCompras,
  RepositorioDeDiscrepancias,
  RepositorioDeLocalidades,
  RepositorioDePagos,
  RepositorioDeReservas,
} from "../ports/repositories.js";
import type {
  PasarelaDePago,
  PublicadorDeEventos,
  UnidadDeTrabajo,
  ValidadorDeAdmision,
} from "../ports/services.js";
import type { ConfirmarPago, CrearReserva, IniciarPago } from "./commands.js";

export type PasoDeCompra =
  | "reservada"
  | "pagoSolicitado"
  | "pagoConfirmado"
  | "emitida"
  | "enConciliacion"
  | "compensada";

export class CompraEnCurso {
  private pagoIdActual: UUID | undefined;
  private intentosActuales = 0;
  private actualizado: FechaHora;

  constructor(
    readonly compraId: UUID,
    readonly reservaId: UUID,
    readonly fanId: UUID,
    readonly identidadRef: IdOpaco,
    private pasoActual: PasoDeCompra,
    actualizadoEn: FechaHora,
    pagoId?: UUID,
    intentos = 0,
  ) {
    this.actualizado = actualizadoEn;
    this.pagoIdActual = pagoId;
    this.intentosActuales = intentos;
  }

  get id(): UUID {
    return this.compraId;
  }

  get pagoId(): UUID | undefined {
    return this.pagoIdActual;
  }

  get paso(): PasoDeCompra {
    return this.pasoActual;
  }

  get intentos(): number {
    return this.intentosActuales;
  }

  get actualizadoEn(): FechaHora {
    return this.actualizado;
  }

  asignarPago(pagoId: UUID): void {
    this.pagoIdActual = pagoId;
  }

  avanzar(paso: PasoDeCompra, en: FechaHora): void {
    this.pasoActual = paso;
    this.actualizado = en;
  }

  registrarIntento(en: FechaHora): number {
    this.intentosActuales += 1;
    this.actualizado = en;
    return this.intentosActuales;
  }
}

export interface DependenciasDelOrquestador {
  admision: ValidadorDeAdmision;
  localidades: RepositorioDeLocalidades;
  reservas: RepositorioDeReservas;
  pagos: RepositorioDePagos;
  compras: RepositorioDeCompras;
  discrepancias: RepositorioDeDiscrepancias;
  eventos: PublicadorDeEventos;
  pasarela: PasarelaDePago;
  emisor: EmisorDeBoletas;
  precios: CalculadoraDePrecio;
  vigenciaReserva: Duracion;
  maxIntentosEmision: number;
  /** Sin unidad de trabajo (dobles en memoria) cada paso corre tal cual. */
  unidadDeTrabajo?: UnidadDeTrabajo;
}

const SIN_TRANSACCION: UnidadDeTrabajo = { ejecutar: (trabajo) => trabajo() };

export class OrquestadorDeCompra {
  private readonly transaccion: UnidadDeTrabajo;

  constructor(private readonly deps: DependenciasDelOrquestador) {
    this.transaccion = deps.unidadDeTrabajo ?? SIN_TRANSACCION;
  }

  async reservar(cmd: CrearReserva, ahora: FechaHora): Promise<CompraEnCurso> {
    // 1.1–1.5: validar el turno y bloquear la localidad hasta el COMMIT (R1, R2). El turno se
    // gasta en la misma transacción: si la reserva se rechaza, vuelve a quedar disponible.
    return this.transaccion.ejecutar(async () => {
      const turnoId = await this.deps.admision.validar(cmd.tokenAdmision, cmd.fanId);
      const localidad = await this.deps.localidades.obtenerParaActualizar(cmd.localidadId);
      localidad.reservar(cmd.cantidad, cmd.sillaIds);
      const items = this.armarItems(localidad, cmd);
      await this.deps.localidades.guardar(localidad);
      const reserva = Reserva.crear(cmd.fanId, turnoId, items, ahora, this.deps.vigenciaReserva);
      await this.deps.reservas.guardar(reserva);
      const compra = new CompraEnCurso(
        nuevoId(),
        reserva.id,
        cmd.fanId,
        cmd.identidadRef,
        "reservada",
        ahora,
      );
      await this.deps.compras.guardar(compra);
      return compra;
    });
  }

  async iniciarPago(cmd: IniciarPago, ahora: FechaHora): Promise<Pago> {
    // 2.1–2.3 en una transacción: el webhook que llegue antes del COMMIT espera el bloqueo
    // del pago en vez de leerlo a medio escribir.
    return this.transaccion.ejecutar(() => this.iniciarPagoEnTransaccion(cmd, ahora));
  }

  private async iniciarPagoEnTransaccion(cmd: IniciarPago, ahora: FechaHora): Promise<Pago> {
    const compra = await this.deps.compras.obtener(cmd.compraId);
    const reserva = await this.deps.reservas.obtener(compra.reservaId);
    reserva.marcarEnPago(ahora);
    await this.deps.reservas.guardar(reserva);
    const pago = Pago.iniciar(
      new OrigenPago("reserva", reserva.id),
      reserva.total(),
      cmd.medio,
      cmd.claveIdempotencia,
      ahora,
    );
    await this.deps.pagos.guardar(pago);
    await this.deps.pasarela.cobrar(pago, cmd.tokenTarjeta);
    pago.marcarPendientePasarela();
    await this.deps.pagos.guardar(pago);
    await this.deps.eventos.publicar(
      new PagoSolicitado(pago.id, pago.monto, ahora, pago.claveIdempotencia),
    );
    compra.asignarPago(pago.id);
    compra.avanzar("pagoSolicitado", ahora);
    await this.deps.compras.guardar(compra);
    return pago;
  }

  async confirmarPago(cmd: ConfirmarPago, ahora: FechaHora): Promise<void> {
    const firmaValida = await this.deps.pasarela.verificarFirma(cmd);
    if (!firmaValida) {
      throw new FirmaDeWebhookInvalida();
    }
    // 3.3: confirmar el pago es su propio COMMIT; la emisión (4.4) va aparte para que un
    // fallo al emitir no deshaga el cobro confirmado, sino que abra la conciliación (A-1).
    const compraId = await this.transaccion.ejecutar(async () => {
      const pago = await this.deps.pagos.obtener(cmd.pagoId);
      if (!cmd.aprobado) {
        pago.registrarRechazo("La pasarela rechazó el cobro");
        await this.deps.pagos.guardar(pago);
        await this.compensarPorRechazo(pago, ahora);
        return undefined;
      }
      const nuevaConfirmacion = pago.registrarConfirmacion(cmd.referenciaExterna, ahora);
      if (!nuevaConfirmacion) {
        return undefined;
      }
      await this.deps.pagos.guardar(pago);
      await this.deps.eventos.publicar(
        new PagoConfirmado(pago.id, cmd.referenciaExterna, ahora, pago.claveIdempotencia),
      );
      const compra = await this.deps.compras.porPago(pago.id);
      if (!compra) {
        return undefined;
      }
      compra.avanzar("pagoConfirmado", ahora);
      await this.deps.compras.guardar(compra);
      return compra.id;
    });
    if (compraId) {
      await this.emitir(compraId, ahora);
    }
  }

  async emitir(compraId: UUID, ahora: FechaHora): Promise<readonly BoletaEmitida[]> {
    const compra = await this.deps.compras.obtener(compraId);
    if (!compra.pagoId) {
      throw new OrigenDePagoInvalido("La compra no tiene un pago iniciado");
    }
    const pagoId = compra.pagoId;
    for (let intento = 1; intento <= this.deps.maxIntentosEmision; intento += 1) {
      try {
        // 4.1–4.4: cada intento es una transacción; si falla, el rollback no deja boletas
        // a medias y el siguiente intento parte del estado confirmado.
        return await this.transaccion.ejecutar(async () => {
          const vigente = await this.deps.compras.obtener(compraId);
          const pago = await this.deps.pagos.obtener(pagoId);
          const reserva = await this.deps.reservas.obtener(vigente.reservaId);
          const emitidas = await this.emitirBoletas(vigente, reserva, pago);
          reserva.confirmar();
          await this.deps.reservas.guardar(reserva);
          await this.resolverDiscrepanciasDe(pago.id, "emisionCompletada", ahora);
          vigente.avanzar("emitida", ahora);
          await this.deps.compras.guardar(vigente);
          return emitidas;
        });
      } catch {
        compra.registrarIntento(ahora);
      }
    }
    await this.transaccion.ejecutar(async () => {
      const pago = await this.deps.pagos.obtener(pagoId);
      await this.abrirDiscrepanciaSiNoExiste(pago, "cobroSinBoleta", ahora);
      compra.avanzar("enConciliacion", ahora);
      await this.deps.compras.guardar(compra);
    });
    return [];
  }

  async compensar(compraId: UUID, motivo: string, ahora: FechaHora): Promise<void> {
    // 5.2: liberar el inventario y cancelar la reserva confirman juntos.
    await this.transaccion.ejecutar(() => this.compensarEnTransaccion(compraId, ahora));
  }

  private async compensarEnTransaccion(compraId: UUID, ahora: FechaHora): Promise<void> {
    const compra = await this.deps.compras.obtener(compraId);
    const reserva = await this.deps.reservas.obtener(compra.reservaId);
    const pago = compra.pagoId ? await this.deps.pagos.obtener(compra.pagoId) : undefined;
    if (pago?.estaConfirmado()) {
      await this.abrirDiscrepanciaSiNoExiste(pago, "cobroSinBoleta", ahora);
      compra.avanzar("enConciliacion", ahora);
    } else {
      await this.liberarInventario(reserva);
      reserva.cancelar();
      await this.deps.reservas.guardar(reserva);
      compra.avanzar("compensada", ahora);
    }
    await this.deps.compras.guardar(compra);
  }

  async vencerReservasExpiradas(ahora: FechaHora): Promise<number> {
    const vencidas = await this.deps.reservas.vencidasA(ahora);
    let liberadas = 0;
    for (const candidata of vencidas) {
      // Una transacción por reserva: se relee con bloqueo porque un pago pudo avanzarla
      // entre la consulta de vencidas y este punto.
      const libero = await this.transaccion.ejecutar(async () => {
        const reserva = await this.deps.reservas.obtener(candidata.id);
        if (reserva.estado !== "vigente" && reserva.estado !== "enPago") {
          return false;
        }
        const pago = await this.deps.pagos.porReserva(reserva.id);
        if (pago?.estaConfirmado()) {
          return false;
        }
        await this.liberarInventario(reserva);
        reserva.vencer();
        await this.deps.reservas.guardar(reserva);
        return true;
      });
      if (libero) {
        liberadas += 1;
      }
    }
    return liberadas;
  }

  private armarItems(localidad: Localidad, cmd: CrearReserva): readonly ItemReserva[] {
    if (localidad.tipo === "numerada") {
      return cmd.sillaIds.map(
        (sillaId) =>
          new ItemReserva(
            nuevoId(),
            localidad.localidadId,
            sillaId,
            1,
            this.deps.precios.desglosar(localidad.precioNominal(), 1),
          ),
      );
    }
    return [
      new ItemReserva(
        nuevoId(),
        localidad.localidadId,
        undefined,
        cmd.cantidad,
        this.deps.precios.desglosar(localidad.precioNominal(), cmd.cantidad),
      ),
    ];
  }

  private async emitirBoletas(
    compra: CompraEnCurso,
    reserva: Reserva,
    pago: Pago,
  ): Promise<readonly BoletaEmitida[]> {
    const emitidas: BoletaEmitida[] = [];
    for (const item of reserva.items) {
      const localidad = await this.deps.localidades.obtenerParaActualizar(item.localidadId);
      for (let unidad = 0; unidad < item.cantidad; unidad += 1) {
        emitidas.push(
          await this.deps.emisor.emitir({
            eventoId: localidad.eventoId,
            localidadId: item.localidadId,
            ...(item.sillaId === undefined ? {} : { sillaId: item.sillaId }),
            pagoId: pago.id,
            fanId: compra.fanId,
            identidadRef: compra.identidadRef,
            precioNominal: localidad.precioNominal(),
          }),
        );
      }
      localidad.vender(item.cantidad, item.sillaId === undefined ? [] : [item.sillaId]);
      await this.deps.localidades.guardar(localidad);
    }
    return emitidas;
  }

  private async liberarInventario(reserva: Reserva): Promise<void> {
    for (const item of reserva.items) {
      const localidad = await this.deps.localidades.obtenerParaActualizar(item.localidadId);
      localidad.liberar(item.cantidad, item.sillaId === undefined ? [] : [item.sillaId]);
      await this.deps.localidades.guardar(localidad);
    }
  }

  private async compensarPorRechazo(pago: Pago, ahora: FechaHora): Promise<void> {
    const reserva = await this.deps.reservas.obtener(pago.origen.referenciaId);
    await this.liberarInventario(reserva);
    reserva.cancelar();
    await this.deps.reservas.guardar(reserva);
    const compra = await this.deps.compras.porPago(pago.id);
    if (compra) {
      compra.avanzar("compensada", ahora);
      await this.deps.compras.guardar(compra);
    }
  }

  private async abrirDiscrepanciaSiNoExiste(
    pago: Pago,
    tipo: TipoDiscrepancia,
    ahora: FechaHora,
  ): Promise<Discrepancia> {
    const abiertas = await this.deps.discrepancias.abiertasPorPago(pago.id);
    const existente = abiertas[0];
    if (existente) {
      return existente;
    }
    const discrepancia = Discrepancia.abrir(tipo, pago.id, ahora);
    await this.deps.discrepancias.guardar(discrepancia);
    return discrepancia;
  }

  private async resolverDiscrepanciasDe(
    pagoId: UUID,
    resolucion: ResolucionDiscrepancia,
    ahora: FechaHora,
  ): Promise<void> {
    const abiertas = await this.deps.discrepancias.abiertasPorPago(pagoId);
    for (const discrepancia of abiertas) {
      discrepancia.resolver(resolucion, ahora);
      await this.deps.discrepancias.guardar(discrepancia);
    }
  }
}
