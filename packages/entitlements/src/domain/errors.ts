import type { UUID } from "@ticketright/shared-kernel";

export abstract class ExcepcionDeDominio extends Error {
  protected constructor(
    readonly regla: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class TitularidadNoVigente extends ExcepcionDeDominio {
  constructor(readonly titularidadId: UUID) {
    super("R7/R8", `La titularidad ${titularidadId} ya no está activa`);
  }
}

export class BoletaAnulada extends ExcepcionDeDominio {
  constructor(readonly boletaId: UUID) {
    super("R10", `La boleta ${boletaId} está anulada`);
  }
}

export class ReventaNoPermitida extends ExcepcionDeDominio {
  constructor(mensaje: string) {
    super("R9", mensaje);
  }
}

export class PrecioDeReventaExcedido extends ExcepcionDeDominio {
  constructor(mensaje: string) {
    super("R9", mensaje);
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
