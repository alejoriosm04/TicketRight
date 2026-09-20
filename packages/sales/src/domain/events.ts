import { nuevoId, type FechaHora } from "@ticketright/shared-kernel";

import type { Dinero } from "@ticketright/shared-kernel";
import type { UUID } from "@ticketright/shared-kernel";

export abstract class EventoDeDominio {
  protected constructor(
    readonly eventoId: UUID,
    readonly ocurridoEn: FechaHora,
    readonly claveIdempotencia: string,
  ) {}

  abstract nombre(): string;
}

export class PagoSolicitado extends EventoDeDominio {
  constructor(
    readonly pagoId: UUID,
    readonly monto: Dinero,
    ocurridoEn: FechaHora,
    claveIdempotencia: string,
  ) {
    super(nuevoId(), ocurridoEn, claveIdempotencia);
  }

  nombre(): string {
    return "PagoSolicitado";
  }
}

export class PagoConfirmado extends EventoDeDominio {
  constructor(
    readonly pagoId: UUID,
    readonly referenciaExterna: string,
    ocurridoEn: FechaHora,
    claveIdempotencia: string,
  ) {
    super(nuevoId(), ocurridoEn, claveIdempotencia);
  }

  nombre(): string {
    return "PagoConfirmado";
  }
}
