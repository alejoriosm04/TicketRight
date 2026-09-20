import {
  Dinero,
  Duracion,
  nuevoId,
  type FechaHora,
  type UUID,
} from "@ticketright/shared-kernel";

import { ReservaVencida, TransicionInvalida } from "./errors.js";
import type { DesglosePrecio } from "./pricing.js";

export type EstadoReserva = "vigente" | "enPago" | "confirmada" | "vencida" | "cancelada";

export class ItemReserva {
  constructor(
    readonly itemId: UUID,
    readonly localidadId: UUID,
    readonly sillaId: UUID | undefined,
    readonly cantidad: number,
    readonly precio: DesglosePrecio,
  ) {}

  subtotal(): Dinero {
    return this.precio.total();
  }
}

export class Reserva {
  private constructor(
    readonly reservaId: UUID,
    readonly fanId: UUID,
    readonly turnoId: UUID,
    private estadoActual: EstadoReserva,
    readonly creadaEn: FechaHora,
    readonly venceEn: FechaHora,
    readonly items: readonly ItemReserva[],
  ) {}

  static crear(
    fanId: UUID,
    turnoId: UUID,
    items: readonly ItemReserva[],
    creadaEn: FechaHora,
    vigencia: Duracion,
  ): Reserva {
    if (items.length === 0) {
      throw new TransicionInvalida("R13", "Una reserva no puede quedar sin ítems");
    }
    return new Reserva(
      nuevoId(),
      fanId,
      turnoId,
      "vigente",
      creadaEn,
      vigencia.sumarA(creadaEn),
      items,
    );
  }

  get id(): UUID {
    return this.reservaId;
  }

  get estado(): EstadoReserva {
    return this.estadoActual;
  }

  total(): Dinero {
    return this.items
      .map((item) => item.subtotal())
      .reduce((acumulado, subtotal) => acumulado.sumar(subtotal), Dinero.cero());
  }

  estaVigente(ahora: FechaHora): boolean {
    const retiene = this.estadoActual === "vigente" || this.estadoActual === "enPago";
    return retiene && ahora.getTime() < this.venceEn.getTime();
  }

  marcarEnPago(ahora: FechaHora): void {
    if (!this.estaVigente(ahora)) {
      throw new ReservaVencida(this.reservaId, this.venceEn);
    }
    this.estadoActual = "enPago";
  }

  confirmar(): void {
    if (this.estadoActual !== "vigente" && this.estadoActual !== "enPago") {
      throw new TransicionInvalida("R5", `La reserva ${this.reservaId} no puede confirmarse desde ${this.estadoActual}`);
    }
    this.estadoActual = "confirmada";
  }

  vencer(): void {
    if (this.estadoActual !== "vigente" && this.estadoActual !== "enPago") {
      throw new TransicionInvalida("R3", `La reserva ${this.reservaId} no puede vencer desde ${this.estadoActual}`);
    }
    this.estadoActual = "vencida";
  }

  cancelar(): void {
    if (this.estadoActual === "confirmada" || this.estadoActual === "cancelada") {
      throw new TransicionInvalida("R4", `La reserva ${this.reservaId} no puede cancelarse desde ${this.estadoActual}`);
    }
    this.estadoActual = "cancelada";
  }
}
