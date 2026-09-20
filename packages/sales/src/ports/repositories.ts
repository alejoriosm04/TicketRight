import type { FechaHora, UUID } from "@ticketright/shared-kernel";

import type { Localidad } from "../domain/inventory.js";
import type { Pago } from "../domain/payment.js";
import type { Reserva } from "../domain/reservation.js";
import type { CompraEnCurso } from "../application/purchase.js";
import type { Discrepancia } from "../domain/discrepancy.js";

export interface RepositorioDeLocalidades {
  obtenerParaActualizar(localidadId: UUID): Promise<Localidad>;
  guardar(localidad: Localidad): Promise<void>;
}

export interface RepositorioDeReservas {
  obtener(reservaId: UUID): Promise<Reserva>;
  guardar(reserva: Reserva): Promise<void>;
  vencidasA(ahora: FechaHora): Promise<readonly Reserva[]>;
}

export interface RepositorioDePagos {
  obtener(pagoId: UUID): Promise<Pago>;
  porClaveIdempotencia(clave: string): Promise<Pago | undefined>;
  porReserva(reservaId: UUID): Promise<Pago | undefined>;
  guardar(pago: Pago): Promise<void>;
}

export interface RepositorioDeCompras {
  obtener(compraId: UUID): Promise<CompraEnCurso>;
  porReserva(reservaId: UUID): Promise<CompraEnCurso | undefined>;
  porPago(pagoId: UUID): Promise<CompraEnCurso | undefined>;
  guardar(compra: CompraEnCurso): Promise<void>;
}

export interface RepositorioDeDiscrepancias {
  guardar(discrepancia: Discrepancia): Promise<void>;
  abiertasPorPago(pagoId: UUID): Promise<readonly Discrepancia[]>;
}
