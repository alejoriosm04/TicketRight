import {
  Dinero,
  nuevoId,
  type FechaHora,
  type RangoFecha,
  type UUID,
} from "@ticketright/shared-kernel";

import type { Discrepancia } from "./discrepancy.js";
import { LiquidacionConDiscrepanciasAbiertas, TransicionInvalida } from "./errors.js";

export type TipoMovimiento = "venta" | "devolucion" | "reventa" | "parafiscal" | "participacion" | "ajuste";
export type EstadoLiquidacion = "abierta" | "enConciliacion" | "cerrada" | "desembolsada";

export class Movimiento {
  constructor(
    readonly movimientoId: UUID,
    readonly tipo: TipoMovimiento,
    readonly origenId: UUID,
    readonly monto: Dinero,
    readonly conciliadoEn: FechaHora,
  ) {}

  static deVenta(origenId: UUID, monto: Dinero, conciliadoEn: FechaHora): Movimiento {
    return new Movimiento(nuevoId(), "venta", origenId, monto, conciliadoEn);
  }

  static deDevolucion(origenId: UUID, monto: Dinero, conciliadoEn: FechaHora): Movimiento {
    return new Movimiento(nuevoId(), "devolucion", origenId, monto, conciliadoEn);
  }

  static parafiscal(origenId: UUID, monto: Dinero, conciliadoEn: FechaHora): Movimiento {
    return new Movimiento(nuevoId(), "parafiscal", origenId, monto, conciliadoEn);
  }

  static participacion(origenId: UUID, monto: Dinero, conciliadoEn: FechaHora): Movimiento {
    return new Movimiento(nuevoId(), "participacion", origenId, monto, conciliadoEn);
  }

  static ajuste(origenId: UUID, monto: Dinero, conciliadoEn: FechaHora): Movimiento {
    return new Movimiento(nuevoId(), "ajuste", origenId, monto, conciliadoEn);
  }
}

export class Liquidacion {
  private brutoActual = Dinero.cero();
  private parafiscalActual = Dinero.cero();
  private participacionesActuales = Dinero.cero();
  private devolucionesActuales = Dinero.cero();

  private constructor(
    readonly liquidacionId: UUID,
    readonly promotorId: UUID,
    readonly periodo: RangoFecha,
    private estadoActual: EstadoLiquidacion,
    private readonly movimientosActuales: Movimiento[] = [],
  ) {}

  static abrir(promotorId: UUID, periodo: RangoFecha): Liquidacion {
    return new Liquidacion(nuevoId(), promotorId, periodo, "abierta");
  }

  get id(): UUID {
    return this.liquidacionId;
  }

  get estado(): EstadoLiquidacion {
    return this.estadoActual;
  }

  get movimientos(): readonly Movimiento[] {
    return this.movimientosActuales;
  }

  get bruto(): Dinero {
    return this.brutoActual;
  }

  get parafiscalRecaudado(): Dinero {
    return this.parafiscalActual;
  }

  get participaciones(): Dinero {
    return this.participacionesActuales;
  }

  get devoluciones(): Dinero {
    return this.devolucionesActuales;
  }

  get neto(): Dinero {
    return this.brutoActual
      .sumar(this.parafiscalActual)
      .sumar(this.participacionesActuales)
      .restar(this.devolucionesActuales);
  }

  agregarMovimiento(movimiento: Movimiento): void {
    if (this.estadoActual !== "abierta" && this.estadoActual !== "enConciliacion") {
      throw new TransicionInvalida("R12", `La liquidación ${this.liquidacionId} está ${this.estadoActual}`);
    }
    this.movimientosActuales.push(movimiento);
    switch (movimiento.tipo) {
      case "venta":
      case "reventa":
        this.brutoActual = this.brutoActual.sumar(movimiento.monto);
        return;
      case "parafiscal":
        this.parafiscalActual = this.parafiscalActual.sumar(movimiento.monto);
        return;
      case "participacion":
        this.participacionesActuales = this.participacionesActuales.sumar(movimiento.monto);
        return;
      case "devolucion":
        this.devolucionesActuales = this.devolucionesActuales.sumar(movimiento.monto);
        return;
      case "ajuste":
        this.participacionesActuales = this.participacionesActuales.sumar(movimiento.monto);
        return;
    }
  }

  cerrar(discrepanciasDeSusPagos: readonly Discrepancia[]): void {
    const abiertas = discrepanciasDeSusPagos.filter((discrepancia) => discrepancia.estaAbierta);
    if (abiertas.length > 0) {
      this.estadoActual = "enConciliacion";
      throw new LiquidacionConDiscrepanciasAbiertas(this.liquidacionId);
    }
    this.estadoActual = "cerrada";
  }
}
