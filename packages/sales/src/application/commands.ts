import type { IdOpaco, UUID } from "@ticketright/shared-kernel";

import type { MedioPago } from "../domain/payment.js";

export interface CrearReserva {
  fanId: UUID;
  identidadRef: IdOpaco;
  tokenAdmision: string;
  localidadId: UUID;
  cantidad: number;
  sillaIds: readonly UUID[];
}

export interface IniciarPago {
  compraId: UUID;
  medio: MedioPago;
  tokenTarjeta: string;
  claveIdempotencia: string;
}

export interface ConfirmarPago {
  pagoId: UUID;
  referenciaExterna: string;
  aprobado: boolean;
  firma: string;
}
