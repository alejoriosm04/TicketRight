import type { UUID } from "@ticketright/shared-kernel";
import type { EmisorDeBoletas } from "@ticketright/shared-kernel";

import type { Pago } from "../domain/payment.js";
import type { EventoDeDominio } from "../domain/events.js";
import type { ConfirmarPago } from "../application/commands.js";

export interface PublicadorDeEventos {
  publicar(evento: EventoDeDominio): Promise<void>;
}

export interface ValidadorDeAdmision {
  validar(token: string, fanId: UUID): Promise<UUID>;
}

export interface PasarelaDePago {
  cobrar(pago: Pago, tokenTarjeta: string): Promise<void>;
  verificarFirma(cmd: ConfirmarPago): Promise<boolean>;
}

export type { EmisorDeBoletas };
