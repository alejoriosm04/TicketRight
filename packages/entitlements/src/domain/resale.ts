import {
  Dinero,
  nuevoId,
  type FechaHora,
  type Porcentaje,
  type RangoFecha,
  type UUID,
} from "@ticketright/shared-kernel";

import { TransicionInvalida } from "./errors.js";

export type EstadoReventa = "publicada" | "vendida" | "retirada" | "vencida";

export class ReglasDeReventa {
  constructor(
    readonly precioMaximo: Dinero,
    readonly comision: Porcentaje,
    readonly ventana: RangoFecha,
  ) {}

  ventanaIncluye(fecha: FechaHora): boolean {
    return (
      fecha.getTime() >= this.ventana.inicio.getTime() &&
      fecha.getTime() <= this.ventana.fin.getTime()
    );
  }
}

export class Reventa {
  private estadoActual: EstadoReventa;
  private comprador: UUID | undefined;
  private pago: UUID | undefined;

  constructor(
    readonly reventaId: UUID,
    readonly titularVendedorId: UUID,
    readonly precio: Dinero,
    readonly comision: Dinero,
    estado: EstadoReventa,
    readonly publicadaEn: FechaHora,
  ) {
    this.estadoActual = estado;
  }

  static publicar(
    titularVendedorId: UUID,
    precio: Dinero,
    comision: Dinero,
    publicadaEn: FechaHora,
  ): Reventa {
    return new Reventa(nuevoId(), titularVendedorId, precio, comision, "publicada", publicadaEn);
  }

  get estado(): EstadoReventa {
    return this.estadoActual;
  }

  get fanCompradorId(): UUID | undefined {
    return this.comprador;
  }

  get pagoId(): UUID | undefined {
    return this.pago;
  }

  vender(fanCompradorId: UUID, pagoId: UUID): void {
    if (this.estadoActual !== "publicada") {
      throw new TransicionInvalida("R9", `La reventa ${this.reventaId} no está publicada`);
    }
    this.estadoActual = "vendida";
    this.comprador = fanCompradorId;
    this.pago = pagoId;
  }

  retirar(): void {
    if (this.estadoActual !== "publicada") {
      throw new TransicionInvalida("R9", `La reventa ${this.reventaId} no está publicada`);
    }
    this.estadoActual = "retirada";
  }
}
