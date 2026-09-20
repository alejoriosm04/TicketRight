import type { FechaHora, UUID } from "@ticketright/shared-kernel";

export abstract class ExcepcionDeDominio extends Error {
  protected constructor(
    readonly regla: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class TurnoVencido extends ExcepcionDeDominio {
  constructor(
    readonly turnoId: UUID,
    readonly venceEn: FechaHora,
  ) {
    super("R6", `El turno ${turnoId} venció en ${venceEn.toISOString()}`);
  }
}

export class TurnoDeOtroFan extends ExcepcionDeDominio {
  constructor(readonly turnoId: UUID) {
    super("R6", `El turno ${turnoId} no pertenece a ese fan`);
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

export class ConsentimientoNoVigente extends ExcepcionDeDominio {
  constructor(
    readonly finalidad: string,
    readonly fanId: UUID,
  ) {
    super("R11", `El fan ${fanId} no tiene consentimiento vigente para ${finalidad}`);
  }
}
