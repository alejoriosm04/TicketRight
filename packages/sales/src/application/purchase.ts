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
import type { PasarelaDePago, PublicadorDeEventos, ValidadorDeAdmision } from "../ports/services.js";
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
}

export class OrquestadorDeCompra {
  constructor(private readonly deps: DependenciasDelOrquestador) {}

  async reservar(cmd: CrearReserva, ahora: FechaHora): Promise<CompraEnCurso> {
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
  }

  async iniciarPago(cmd: IniciarPago, ahora: FechaHora): Promise<Pago> {
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
    const pago = await this.deps.pagos.obtener(cmd.pagoId);
    if (!cmd.aprobado) {
      pago.registrarRechazo("La pasarela rechazó el cobro");
      await this.deps.pagos.guardar(pago);
      await this.compensarPorRechazo(pago, ahora);
      return;
    }
    const nuevaConfirmacion = pago.registrarConfirmacion(cmd.referenciaExterna, ahora);
    if (!nuevaConfirmacion) {
      return;
    }
    await this.deps.pagos.guardar(pago);
    await this.deps.eventos.publicar(
      new PagoConfirmado(pago.id, cmd.referenciaExterna, ahora, pago.claveIdempotencia),
    );
    const compra = await this.deps.compras.porPago(pago.id);
    if (compra) {
      compra.avanzar("pagoConfirmado", ahora);
      await this.deps.compras.guardar(compra);
      await this.emitir(compra.id, ahora);
    }
  }

  async emitir(compraId: UUID, ahora: FechaHora): Promise<readonly BoletaEmitida[]> {
    const compra = await this.deps.compras.obtener(compraId);
    if (!compra.pagoId) {
      throw new OrigenDePagoInvalido("La compra no tiene un pago iniciado");
    }
    const pago = await this.deps.pagos.obtener(compra.pagoId);
    const reserva = await this.deps.reservas.obtener(compra.reservaId);
    for (let intento = 1; intento <= this.deps.maxIntentosEmision; intento += 1) {
      try {
        const emitidas = await this.emitirBoletas(compra, reserva, pago);
        reserva.confirmar();
        await this.deps.reservas.guardar(reserva);
        await this.resolverDiscrepanciasDe(pago.id, "emisionCompletada", ahora);
        compra.avanzar("emitida", ahora);
        await this.deps.compras.guardar(compra);
        return emitidas;
      } catch {
        compra.registrarIntento(ahora);
      }
    }
    await this.abrirDiscrepanciaSiNoExiste(pago, "cobroSinBoleta", ahora);
    compra.avanzar("enConciliacion", ahora);
    await this.deps.compras.guardar(compra);
    return [];
  }

  async compensar(compraId: UUID, motivo: string, ahora: FechaHora): Promise<void> {
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
    for (const reserva of vencidas) {
      const pago = await this.deps.pagos.porReserva(reserva.id);
      if (pago?.estaConfirmado()) {
        continue;
      }
      await this.liberarInventario(reserva);
      reserva.vencer();
      await this.deps.reservas.guardar(reserva);
      liberadas += 1;
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
