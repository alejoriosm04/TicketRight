import { Dinero, type FechaHora, type UUID } from "@ticketright/shared-kernel";
import {
  Aforo,
  CompraEnCurso,
  DesglosePrecio,
  Devolucion,
  Discrepancia,
  ItemReserva,
  Localidad,
  OrigenPago,
  Pago,
  Reserva,
  Silla,
  type EstadoDevolucion,
  type EstadoPago,
  type EstadoReserva,
  type EstadoSilla,
  type MedioPago,
  type MotivoDevolucion,
  type PasoDeCompra,
  type RepositorioDeCompras,
  type RepositorioDeDiscrepancias,
  type RepositorioDeLocalidades,
  type RepositorioDePagos,
  type RepositorioDeReservas,
  type ResolucionDiscrepancia,
  type TipoDiscrepancia,
  type TipoLocalidad,
  type TipoOrigenPago,
} from "@ticketright/sales";

import type { Consultable } from "../../db/pool.js";

type Fila = Record<string, unknown>;

function fecha(valor: unknown): FechaHora {
  return new Date(valor as string);
}

function fechaOpcional(valor: unknown): FechaHora | undefined {
  return valor === null || valor === undefined ? undefined : new Date(valor as string);
}

function textoOpcional(valor: unknown): string | undefined {
  return valor === null || valor === undefined ? undefined : String(valor);
}

function desglose(fila: Fila): DesglosePrecio {
  const moneda = String(fila.moneda);
  return new DesglosePrecio(
    Dinero.de(Number(fila.valor_nominal_centavos), moneda),
    Dinero.de(Number(fila.cargo_servicio_centavos), moneda),
    Dinero.de(Number(fila.contribucion_parafiscal_centavos), moneda),
  );
}

async function cargarReserva(db: Consultable, fila: Fila): Promise<Reserva> {
  const items = (
    await db.query("select * from items_reserva where reserva_id = $1 order by item_id", [
      fila.reserva_id,
    ])
  ).rows.map(
    (item) =>
      new ItemReserva(
        String(item.item_id),
        String(item.localidad_id),
        textoOpcional(item.silla_id),
        Number(item.cantidad),
        desglose(item),
      ),
  );
  return Reserva.rehidratar(
    String(fila.reserva_id),
    String(fila.fan_id),
    String(fila.turno_id),
    fila.estado as EstadoReserva,
    fecha(fila.creada_en),
    fecha(fila.vence_en),
    items,
  );
}

export class RepositorioPostgresDeLocalidades implements RepositorioDeLocalidades {
  constructor(private readonly db: Consultable) {}

  async obtenerParaActualizar(localidadId: UUID): Promise<Localidad> {
    const { rows } = await this.db.query(
      "select * from localidades where localidad_id = $1 for update",
      [localidadId],
    );
    const fila = rows[0];
    if (!fila) {
      throw new Error(`No existe la localidad ${localidadId}`);
    }
    const sillas = (
      await this.db.query(
        "select * from sillas where localidad_id = $1 order by fila, numero",
        [localidadId],
      )
    ).rows.map(
      (silla) =>
        new Silla(String(silla.silla_id), String(silla.fila), String(silla.numero), silla.estado as EstadoSilla),
    );
    return Localidad.rehidratar(
      String(fila.localidad_id),
      String(fila.evento_id),
      fila.tipo as TipoLocalidad,
      new Aforo(
        Number(fila.aforo_autorizado),
        Number(fila.aforo_reservado),
        Number(fila.aforo_vendido),
      ),
      Dinero.de(Number(fila.precio_centavos), String(fila.moneda)),
      sillas,
    );
  }

  async guardar(localidad: Localidad): Promise<void> {
    await this.db.query(
      "update localidades set aforo_reservado = $2, aforo_vendido = $3 where localidad_id = $1",
      [localidad.localidadId, localidad.aforo.reservado, localidad.aforo.vendido],
    );
    for (const silla of localidad.sillasActuales) {
      await this.db.query("update sillas set estado = $2 where silla_id = $1", [
        silla.sillaId,
        silla.estado,
      ]);
    }
  }
}

export class RepositorioPostgresDeReservas implements RepositorioDeReservas {
  constructor(private readonly db: Consultable) {}

  async obtener(reservaId: UUID): Promise<Reserva> {
    // Bloquea la fila para que el vencimiento y el pago no avancen la misma reserva a la vez.
    const { rows } = await this.db.query(
      "select * from reservas where reserva_id = $1 for update",
      [reservaId],
    );
    const fila = rows[0];
    if (!fila) {
      throw new Error(`No existe la reserva ${reservaId}`);
    }
    return cargarReserva(this.db, fila);
  }

  async guardar(reserva: Reserva): Promise<void> {
    await this.db.query(
      `insert into reservas (reserva_id, fan_id, turno_id, estado, creada_en, vence_en, total_centavos)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (reserva_id) do update set estado = excluded.estado`,
      [
        reserva.reservaId,
        reserva.fanId,
        reserva.turnoId,
        reserva.estado,
        reserva.creadaEn,
        reserva.venceEn,
        reserva.total().valorCentavos,
      ],
    );
    for (const item of reserva.items) {
      await this.db.query(
        `insert into items_reserva (item_id, reserva_id, localidad_id, silla_id, cantidad,
           valor_nominal_centavos, cargo_servicio_centavos, contribucion_parafiscal_centavos, moneda)
         values ($1, $2, $3, $4, $5, $6, $7, $8, 'COP')
         on conflict (item_id) do nothing`,
        [
          item.itemId,
          reserva.reservaId,
          item.localidadId,
          item.sillaId,
          item.cantidad,
          item.precio.valorNominal.valorCentavos,
          item.precio.cargoServicio.valorCentavos,
          item.precio.contribucionParafiscal.valorCentavos,
        ],
      );
    }
  }

  async vencidasA(ahora: FechaHora): Promise<readonly Reserva[]> {
    const { rows } = await this.db.query(
      `select * from reservas
       where estado in ('vigente', 'enPago') and vence_en <= $1
       order by vence_en`,
      [ahora],
    );
    const reservas: Reserva[] = [];
    for (const fila of rows) {
      reservas.push(await cargarReserva(this.db, fila));
    }
    return reservas;
  }
}

async function cargarPago(db: Consultable, fila: Fila): Promise<Pago> {
  const devoluciones = (
    await db.query("select * from devoluciones where pago_id = $1 order by solicitada_en", [
      fila.pago_id,
    ])
  ).rows.map(
    (devolucion) =>
      Devolucion.rehidratar(
        String(devolucion.devolucion_id),
        textoOpcional(devolucion.boleta_id),
        devolucion.motivo as MotivoDevolucion,
        Dinero.de(Number(devolucion.monto_centavos), String(devolucion.moneda)),
        devolucion.estado as EstadoDevolucion,
        fecha(devolucion.solicitada_en),
        fechaOpcional(devolucion.resuelta_en),
      ),
  );
  return Pago.rehidratar(
    String(fila.pago_id),
    new OrigenPago(fila.origen_tipo as TipoOrigenPago, String(fila.origen_id)),
    Dinero.de(Number(fila.monto_centavos), String(fila.moneda)),
    fila.medio as MedioPago,
    fila.estado as EstadoPago,
    String(fila.clave_idempotencia),
    textoOpcional(fila.referencia_externa),
    fecha(fila.iniciado_en),
    fechaOpcional(fila.confirmado_en),
    devoluciones,
  );
}

export class RepositorioPostgresDePagos implements RepositorioDePagos {
  constructor(private readonly db: Consultable) {}

  async obtener(pagoId: UUID): Promise<Pago> {
    // Bloquea la fila: dentro de una unidad de trabajo, dos webhooks simultáneos del mismo
    // pago se atienden uno tras otro y solo uno ve la confirmación como nueva (A-1).
    const { rows } = await this.db.query("select * from pagos where pago_id = $1 for update", [
      pagoId,
    ]);
    const fila = rows[0];
    if (!fila) {
      throw new Error(`No existe el pago ${pagoId}`);
    }
    return cargarPago(this.db, fila);
  }

  async porClaveIdempotencia(clave: string): Promise<Pago | undefined> {
    const { rows } = await this.db.query(
      "select * from pagos where clave_idempotencia = $1",
      [clave],
    );
    const fila = rows[0];
    return fila ? cargarPago(this.db, fila) : undefined;
  }

  async porReserva(reservaId: UUID): Promise<Pago | undefined> {
    const { rows } = await this.db.query(
      "select * from pagos where origen_tipo = 'reserva' and origen_id = $1 order by iniciado_en desc limit 1",
      [reservaId],
    );
    const fila = rows[0];
    return fila ? cargarPago(this.db, fila) : undefined;
  }

  async guardar(pago: Pago): Promise<void> {
    await this.db.query(
      `insert into pagos (pago_id, origen_tipo, origen_id, monto_centavos, moneda, medio, estado,
         clave_idempotencia, referencia_externa, iniciado_en, confirmado_en)
       values ($1, $2, $3, $4, 'COP', $5, $6, $7, $8, $9, $10)
       on conflict (pago_id) do update set estado = excluded.estado,
         referencia_externa = excluded.referencia_externa,
         confirmado_en = excluded.confirmado_en`,
      [
        pago.pagoId,
        pago.origen.tipo,
        pago.origen.referenciaId,
        pago.monto.valorCentavos,
        pago.medio,
        pago.estado,
        pago.claveIdempotencia,
        pago.referenciaExterna,
        pago.iniciadoEn,
        pago.confirmadoEn,
      ],
    );
    for (const devolucion of pago.devoluciones) {
      await this.db.query(
        `insert into devoluciones (devolucion_id, pago_id, boleta_id, motivo, monto_centavos, moneda, estado, solicitada_en, resuelta_en)
         values ($1, $2, $3, $4, $5, 'COP', $6, $7, $8)
         on conflict (devolucion_id) do update set estado = excluded.estado, resuelta_en = excluded.resuelta_en`,
        [
          devolucion.devolucionId,
          pago.pagoId,
          devolucion.boletaId,
          devolucion.motivo,
          devolucion.monto.valorCentavos,
          devolucion.estado,
          devolucion.solicitadaEn,
          devolucion.resueltaEn,
        ],
      );
    }
  }
}

export class RepositorioPostgresDeCompras implements RepositorioDeCompras {
  constructor(private readonly db: Consultable) {}

  async obtener(compraId: UUID): Promise<CompraEnCurso> {
    const { rows } = await this.db.query("select * from compras where compra_id = $1", [compraId]);
    const fila = rows[0];
    if (!fila) {
      throw new Error(`No existe la compra ${compraId}`);
    }
    return this.desdeFila(fila);
  }

  async porReserva(reservaId: UUID): Promise<CompraEnCurso | undefined> {
    const { rows } = await this.db.query("select * from compras where reserva_id = $1", [
      reservaId,
    ]);
    const fila = rows[0];
    return fila ? this.desdeFila(fila) : undefined;
  }

  async porPago(pagoId: UUID): Promise<CompraEnCurso | undefined> {
    const { rows } = await this.db.query("select * from compras where pago_id = $1", [pagoId]);
    const fila = rows[0];
    return fila ? this.desdeFila(fila) : undefined;
  }

  async guardar(compra: CompraEnCurso): Promise<void> {
    await this.db.query(
      `insert into compras (compra_id, reserva_id, fan_id, identidad_ref, pago_id, paso, intentos, actualizado_en)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (compra_id) do update set pago_id = excluded.pago_id, paso = excluded.paso,
         intentos = excluded.intentos, actualizado_en = excluded.actualizado_en`,
      [
        compra.compraId,
        compra.reservaId,
        compra.fanId,
        compra.identidadRef,
        compra.pagoId,
        compra.paso,
        compra.intentos,
        compra.actualizadoEn,
      ],
    );
  }

  private desdeFila(fila: Fila): CompraEnCurso {
    return new CompraEnCurso(
      String(fila.compra_id),
      String(fila.reserva_id),
      String(fila.fan_id),
      String(fila.identidad_ref),
      fila.paso as PasoDeCompra,
      fecha(fila.actualizado_en),
      textoOpcional(fila.pago_id),
      Number(fila.intentos),
    );
  }
}

function discrepanciaDesdeFila(fila: Fila): Discrepancia {
  return Discrepancia.rehidratar(
    String(fila.discrepancia_id),
    fila.tipo as TipoDiscrepancia,
    String(fila.pago_id),
    textoOpcional(fila.boleta_id),
    fecha(fila.detectada_en),
    fechaOpcional(fila.resuelta_en),
    (fila.resolucion ?? undefined) as ResolucionDiscrepancia | undefined,
  );
}

export class RepositorioPostgresDeDiscrepancias implements RepositorioDeDiscrepancias {
  constructor(private readonly db: Consultable) {}

  async guardar(discrepancia: Discrepancia): Promise<void> {
    await this.db.query(
      `insert into discrepancias (discrepancia_id, tipo, pago_id, boleta_id, detectada_en, resuelta_en, resolucion)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (discrepancia_id) do update set resuelta_en = excluded.resuelta_en, resolucion = excluded.resolucion`,
      [
        discrepancia.discrepanciaId,
        discrepancia.tipo,
        discrepancia.pagoId,
        discrepancia.boletaId,
        discrepancia.detectadaEn,
        discrepancia.resueltaEn,
        discrepancia.resolucion,
      ],
    );
  }

  async abiertasPorPago(pagoId: UUID): Promise<readonly Discrepancia[]> {
    const { rows } = await this.db.query(
      "select * from discrepancias where pago_id = $1 and resuelta_en is null order by detectada_en",
      [pagoId],
    );
    return rows.map(discrepanciaDesdeFila);
  }
}
