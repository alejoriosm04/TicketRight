import {
  Dinero,
  nuevoId,
  type FechaHora,
  type UUID,
} from "@ticketright/shared-kernel";

import { diasHabilesTranscurridos } from "./business-calendar.js";
import {
  OrigenDePagoInvalido,
  PlazoDeRetractoVencido,
  TransicionInvalida,
} from "./errors.js";

export type TipoOrigenPago = "reserva" | "reventa";
export type MedioPago = "tarjeta" | "pse" | "billetera";
export type EstadoPago =
  | "iniciado"
  | "pendientePasarela"
  | "confirmado"
  | "rechazado"
  | "enConciliacion"
  | "devueltoParcial"
  | "devueltoTotal";
export type MotivoDevolucion =
  | "retracto"
  | "cancelacionEvento"
  | "modificacionEvento"
  | "anulacionPorFraude"
  | "compensacionPorFallo";
export type EstadoDevolucion = "solicitada" | "aprobada" | "rechazada" | "ejecutada";

export const PLAZO_DE_RETRACTO_EN_DIAS_HABILES = 5;

export class OrigenPago {
  constructor(
    readonly tipo: TipoOrigenPago,
    readonly referenciaId: UUID,
  ) {}
}

export class Pago {
  private constructor(
    readonly pagoId: UUID,
    readonly origen: OrigenPago,
    readonly monto: Dinero,
    readonly medio: MedioPago,
    private estadoActual: EstadoPago,
    readonly claveIdempotencia: string,
    private referencia: string | undefined,
    readonly iniciadoEn: FechaHora,
    private confirmado: FechaHora | undefined,
    private readonly devolucionesActuales: Devolucion[] = [],
  ) {}

  static iniciar(
    origen: OrigenPago,
    monto: Dinero,
    medio: MedioPago,
    claveIdempotencia: string,
    iniciadoEn: FechaHora,
  ): Pago {
    if (monto.esCero || monto.esNegativo) {
      throw new OrigenDePagoInvalido("Un pago no puede iniciarse sin monto");
    }
    return new Pago(
      nuevoId(),
      origen,
      monto,
      medio,
      "iniciado",
      claveIdempotencia,
      undefined,
      iniciadoEn,
      undefined,
    );
  }

  static rehidratar(
    pagoId: UUID,
    origen: OrigenPago,
    monto: Dinero,
    medio: MedioPago,
    estado: EstadoPago,
    claveIdempotencia: string,
    referencia: string | undefined,
    iniciadoEn: FechaHora,
    confirmado: FechaHora | undefined,
    devoluciones: readonly Devolucion[] = [],
  ): Pago {
    return new Pago(
      pagoId,
      origen,
      monto,
      medio,
      estado,
      claveIdempotencia,
      referencia,
      iniciadoEn,
      confirmado,
      [...devoluciones],
    );
  }

  get id(): UUID {
    return this.pagoId;
  }

  get estado(): EstadoPago {
    return this.estadoActual;
  }

  get referenciaExterna(): string | undefined {
    return this.referencia;
  }

  get confirmadoEn(): FechaHora | undefined {
    return this.confirmado;
  }

  get devoluciones(): readonly Devolucion[] {
    return this.devolucionesActuales;
  }

  marcarPendientePasarela(): void {
    if (this.estadoActual === "iniciado") {
      this.estadoActual = "pendientePasarela";
    }
  }

  registrarConfirmacion(referenciaExterna: string, en: FechaHora): boolean {
    if (this.estadoActual === "confirmado") {
      return false;
    }
    if (this.estadoActual !== "iniciado" && this.estadoActual !== "pendientePasarela") {
      throw new TransicionInvalida("R5", `Un pago ${this.estadoActual} no puede confirmarse`);
    }
    this.estadoActual = "confirmado";
    this.referencia = referenciaExterna;
    this.confirmado = en;
    return true;
  }

  registrarRechazo(motivo: string): void {
    if (this.estadoActual === "rechazado") {
      return;
    }
    if (this.estadoActual === "confirmado") {
      throw new TransicionInvalida("R5", `Un pago confirmado no puede rechazarse (${motivo})`);
    }
    this.estadoActual = "rechazado";
    this.confirmado = undefined;
  }

  marcarEnConciliacion(): void {
    this.estadoActual = "enConciliacion";
  }

  estaConfirmado(): boolean {
    return this.estadoActual === "confirmado";
  }

  agregarDevolucion(devolucion: Devolucion): void {
    this.devolucionesActuales.push(devolucion);
  }
}

export class Devolucion {
  private constructor(
    readonly devolucionId: UUID,
    readonly boletaId: UUID | undefined,
    readonly motivo: MotivoDevolucion,
    readonly monto: Dinero,
    private estadoActual: EstadoDevolucion,
    readonly solicitadaEn: FechaHora,
    private resuelta: FechaHora | undefined,
  ) {}

  static solicitarRetracto(
    boletaId: UUID | undefined,
    monto: Dinero,
    compraEn: FechaHora,
    solicitadaEn: FechaHora,
  ): Devolucion {
    const devolucion = new Devolucion(
      nuevoId(),
      boletaId,
      "retracto",
      monto,
      "solicitada",
      solicitadaEn,
      undefined,
    );
    const transcurridos = diasHabilesTranscurridos(compraEn, solicitadaEn);
    if (transcurridos > PLAZO_DE_RETRACTO_EN_DIAS_HABILES) {
      throw new PlazoDeRetractoVencido(devolucion.devolucionId, transcurridos);
    }
    return devolucion;
  }

  static solicitarPorCancelacion(
    boletaId: UUID | undefined,
    monto: Dinero,
    solicitadaEn: FechaHora,
  ): Devolucion {
    return new Devolucion(nuevoId(), boletaId, "cancelacionEvento", monto, "solicitada", solicitadaEn, undefined);
  }

  static rehidratar(
    devolucionId: UUID,
    boletaId: UUID | undefined,
    motivo: MotivoDevolucion,
    monto: Dinero,
    estado: EstadoDevolucion,
    solicitadaEn: FechaHora,
    resuelta: FechaHora | undefined,
  ): Devolucion {
    return new Devolucion(devolucionId, boletaId, motivo, monto, estado, solicitadaEn, resuelta);
  }

  get id(): UUID {
    return this.devolucionId;
  }

  get estado(): EstadoDevolucion {
    return this.estadoActual;
  }

  get resueltaEn(): FechaHora | undefined {
    return this.resuelta;
  }

  aprobar(en: FechaHora): void {
    if (this.estadoActual !== "solicitada") {
      throw new TransicionInvalida("R10", `Una devolución ${this.estadoActual} no puede aprobarse`);
    }
    this.estadoActual = "aprobada";
    this.resuelta = en;
  }

  ejecutar(en: FechaHora): void {
    if (this.estadoActual !== "aprobada") {
      throw new TransicionInvalida("R10", `Una devolución ${this.estadoActual} no puede ejecutarse`);
    }
    this.estadoActual = "ejecutada";
    this.resuelta = en;
  }

  rechazar(en: FechaHora): void {
    if (this.estadoActual !== "solicitada") {
      throw new TransicionInvalida("R10", `Una devolución ${this.estadoActual} no puede rechazarse`);
    }
    this.estadoActual = "rechazada";
    this.resuelta = en;
  }
}
