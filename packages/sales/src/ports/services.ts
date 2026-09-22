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

/**
 * Límite transaccional de un paso de la SAGA: lo que corre dentro de `ejecutar` se confirma
 * junto o no se confirma (cada `[COMMIT]` del diagrama de secuencia, AD-003). El adaptador
 * PostgreSQL lo realiza con `BEGIN`/`COMMIT`; sin él, el bloqueo `FOR UPDATE` de la
 * localidad se suelta al terminar la consulta y dos reservas simultáneas pisan el aforo.
 */
export interface UnidadDeTrabajo {
  ejecutar<T>(trabajo: () => Promise<T>): Promise<T>;
}

export type { EmisorDeBoletas };
