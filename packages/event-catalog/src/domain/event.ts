import {
  dentroDelRango,
  nuevoId,
  type Dinero,
  type FechaHora,
  type Porcentaje,
  type RangoFecha,
  type UUID,
} from "@ticketright/shared-kernel";

import { TransicionDeEventoInvalida } from "./errors.js";

export type EstadoEvento =
  | "borrador"
  | "publicado"
  | "enVenta"
  | "ventaCerrada"
  | "realizado"
  | "cancelado";

/** `masivo` abre la venta con fila visible (AD-005/AD-006); `cotidiano`, paso directo. */
export type PerfilDemanda = "cotidiano" | "masivo";

/**
 * Reglas de reventa (VO). Solo existen si el promotor habilita la reventa; son los límites
 * que R9 hace cumplir. Si el evento no fija la comisión, se copia de `Convenio.comisionReventa`.
 */
export class ReglasReventa {
  constructor(
    readonly precioMaximo: Dinero,
    readonly comision: Porcentaje,
    readonly ventana: RangoFecha,
  ) {}

  ventanaIncluye(en: FechaHora): boolean {
    return dentroDelRango(en, this.ventana);
  }
}

/**
 * Reglas de venta (VO). Condiciones publicadas que aplican a todas las boletas del evento.
 * `limitePorFan` impide el acaparamiento.
 */
export class ReglasVenta {
  constructor(
    readonly inicioVenta: FechaHora,
    readonly finVenta: FechaHora,
    readonly limitePorFan: number,
    readonly transferenciaPermitida: boolean,
    readonly reventa?: ReglasReventa,
  ) {
    if (finVenta.getTime() < inicioVenta.getTime()) {
      throw new TransicionDeEventoInvalida("reglasVenta", "finVenta anterior a inicioVenta");
    }
    if (!Number.isInteger(limitePorFan) || limitePorFan <= 0) {
      throw new TransicionDeEventoInvalida("reglasVenta", "limitePorFan debe ser un entero positivo");
    }
  }

  ventaAbierta(en: FechaHora): boolean {
    return dentroDelRango(en, { inicio: this.inicioVenta, fin: this.finVenta });
  }
}

/**
 * Cancelación (VO). Registro de la cancelación o modificación del evento. `informadoSicEn`
 * evidencia el deber de informar el mecanismo de devolución a la SIC en 3 días hábiles.
 */
export class Cancelacion {
  constructor(
    readonly declaradaEn: FechaHora,
    readonly mecanismoDevolucion: string,
    readonly informadoSicEn?: FechaHora,
  ) {}
}

/**
 * Evento (RAÍZ, contexto Oferta de eventos). Define la oferta comercial y su ciclo de vida
 * (borrador → publicado → enVenta → ventaCerrada → realizado), con la rama de cancelación.
 * `perfilDemanda` decide si la venta abre con fila visible (AD-005). El evento referencia al
 * promotor y al recinto por identificador; no los contiene (agregados propios).
 */
export class Evento {
  private constructor(
    readonly eventoId: UUID,
    readonly promotorId: UUID,
    readonly recintoId: UUID,
    readonly nombre: string,
    readonly inicio: FechaHora,
    private estadoActual: EstadoEvento,
    readonly perfilDemanda: PerfilDemanda,
    private reglas: ReglasVenta,
    private cancelacionActual?: Cancelacion,
  ) {}

  static crear(
    promotorId: UUID,
    recintoId: UUID,
    nombre: string,
    inicio: FechaHora,
    perfilDemanda: PerfilDemanda,
    reglasVenta: ReglasVenta,
    eventoId: UUID = nuevoId(),
  ): Evento {
    return new Evento(eventoId, promotorId, recintoId, nombre, inicio, "borrador", perfilDemanda, reglasVenta);
  }

  static rehidratar(
    eventoId: UUID,
    promotorId: UUID,
    recintoId: UUID,
    nombre: string,
    inicio: FechaHora,
    estado: EstadoEvento,
    perfilDemanda: PerfilDemanda,
    reglasVenta: ReglasVenta,
    cancelacion?: Cancelacion,
  ): Evento {
    return new Evento(eventoId, promotorId, recintoId, nombre, inicio, estado, perfilDemanda, reglasVenta, cancelacion);
  }

  get estado(): EstadoEvento {
    return this.estadoActual;
  }

  get reglasVenta(): ReglasVenta {
    return this.reglas;
  }

  get cancelacion(): Cancelacion | undefined {
    return this.cancelacionActual;
  }

  /** ¿La venta con fila visible? (masivo → filaVisible; cotidiano → paso directo). */
  get abreConFilaVisible(): boolean {
    return this.perfilDemanda === "masivo";
  }

  publicar(): void {
    if (this.estadoActual !== "borrador") {
      throw new TransicionDeEventoInvalida(this.estadoActual, "publicado");
    }
    this.estadoActual = "publicado";
  }

  abrirVenta(): void {
    if (this.estadoActual !== "publicado") {
      throw new TransicionDeEventoInvalida(this.estadoActual, "enVenta");
    }
    this.estadoActual = "enVenta";
  }

  cerrarVenta(): void {
    if (this.estadoActual !== "enVenta") {
      throw new TransicionDeEventoInvalida(this.estadoActual, "ventaCerrada");
    }
    this.estadoActual = "ventaCerrada";
  }

  marcarRealizado(): void {
    if (this.estadoActual !== "ventaCerrada" && this.estadoActual !== "enVenta") {
      throw new TransicionDeEventoInvalida(this.estadoActual, "realizado");
    }
    this.estadoActual = "realizado";
  }

  /** Un evento realizado o ya cancelado no puede cancelarse. */
  cancelar(cancelacion: Cancelacion): void {
    if (this.estadoActual === "realizado" || this.estadoActual === "cancelado") {
      throw new TransicionDeEventoInvalida(this.estadoActual, "cancelado");
    }
    this.estadoActual = "cancelado";
    this.cancelacionActual = cancelacion;
  }

  /** ¿Está la venta abierta ahora? Requiere estado enVenta y estar dentro de la ventana. */
  ventaDisponible(en: FechaHora): boolean {
    return this.estadoActual === "enVenta" && this.reglas.ventaAbierta(en);
  }
}
