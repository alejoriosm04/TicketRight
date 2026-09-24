/**
 * Excepciones del contexto Oferta de eventos. Cada una cita la regla o invariante del
 * modelo de dominio que protege, para que el mensaje sea rastreable en la defensa.
 */
export class ExcepcionDeCatalogo extends Error {
  constructor(
    readonly regla: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** R1: la suma de aforos de las localidades no puede superar el aforo del recinto. */
export class AforoDelRecintoExcedido extends ExcepcionDeCatalogo {
  constructor(recintoId: string, solicitado: number, maximo: number) {
    super("R1", `El aforo total ${solicitado} supera el máximo del recinto ${recintoId} (${maximo}).`);
  }
}

/** Transición de estado no permitida en el ciclo de vida del evento o del convenio. */
export class TransicionDeEventoInvalida extends ExcepcionDeCatalogo {
  constructor(desde: string, hacia: string) {
    super("EstadoEvento", `Un evento en estado ${desde} no puede pasar a ${hacia}.`);
  }
}

export class ConvenioNoVigente extends ExcepcionDeCatalogo {
  constructor(mensaje = "El convenio no está firmado y vigente para la fecha indicada.") {
    super("Convenio", mensaje);
  }
}
