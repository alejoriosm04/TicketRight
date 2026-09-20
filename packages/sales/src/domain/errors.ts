import type { FechaHora, UUID } from "@ticketright/shared-kernel";

export abstract class ExcepcionDeDominio extends Error {
  protected constructor(
    readonly regla: string,
    readonly mensaje: string,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class AforoExcedido extends ExcepcionDeDominio {
  constructor(
    readonly localidadId: UUID,
    readonly solicitado: number,
    readonly disponible: number,
    mensaje: string,
  ) {
    super("R1/R2", mensaje);
  }
}

export class ReservaVencida extends ExcepcionDeDominio {
  constructor(
    readonly reservaId: UUID,
    readonly vencioEn: FechaHora,
  ) {
    super("R3", `La reserva ${reservaId} venció en ${vencioEn.toISOString()}`);
  }
}

export class TransicionInvalida extends ExcepcionDeDominio {
  constructor(
    regla: string,
    mensaje: string,
  ) {
    super(regla, mensaje);
  }
}

export class OrigenDePagoInvalido extends ExcepcionDeDominio {
  constructor(mensaje: string) {
    super("R4", mensaje);
  }
}

export class PlazoDeRetractoVencido extends ExcepcionDeDominio {
  constructor(
    readonly devolucionId: UUID,
    readonly diasHabiles: number,
  ) {
    super("R10", `El retracto de la devolución ${devolucionId} llegó tras ${diasHabiles} días hábiles`);
  }
}

export class LiquidacionConDiscrepanciasAbiertas extends ExcepcionDeDominio {
  constructor(readonly liquidacionId: UUID) {
    super("R12/R14", `La liquidación ${liquidacionId} tiene discrepancias abiertas`);
  }
}

export class FirmaDeWebhookInvalida extends ExcepcionDeDominio {
  constructor() {
    super("R4/AD-004", "La firma del webhook no es válida");
  }
}
