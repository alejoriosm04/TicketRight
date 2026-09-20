import { nuevoId, type FechaHora, type UUID } from "@ticketright/shared-kernel";

import { TransicionInvalida } from "./errors.js";

export type TipoDiscrepancia =
  | "cobroSinBoleta"
  | "boletaSinCobro"
  | "inventarioDuplicado"
  | "devolucionSinAnulacion"
  | "respuestaTardiaPasarela";
export type ResolucionDiscrepancia =
  | "emisionCompletada"
  | "devolucionEjecutada"
  | "boletaAnulada"
  | "sinAccion";

export class Discrepancia {
  private constructor(
    readonly discrepanciaId: UUID,
    readonly tipo: TipoDiscrepancia,
    readonly pagoId: UUID,
    readonly boletaId: UUID | undefined,
    readonly detectadaEn: FechaHora,
    private resuelta: FechaHora | undefined,
    private resolucionActual: ResolucionDiscrepancia | undefined,
  ) {}

  static abrir(tipo: TipoDiscrepancia, pagoId: UUID, detectadaEn: FechaHora): Discrepancia {
    return new Discrepancia(nuevoId(), tipo, pagoId, undefined, detectadaEn, undefined, undefined);
  }

  static rehidratar(
    discrepanciaId: UUID,
    tipo: TipoDiscrepancia,
    pagoId: UUID,
    boletaId: UUID | undefined,
    detectadaEn: FechaHora,
    resuelta: FechaHora | undefined,
    resolucion: ResolucionDiscrepancia | undefined,
  ): Discrepancia {
    return new Discrepancia(discrepanciaId, tipo, pagoId, boletaId, detectadaEn, resuelta, resolucion);
  }

  get id(): UUID {
    return this.discrepanciaId;
  }

  get estaAbierta(): boolean {
    return this.resuelta === undefined;
  }

  get resueltaEn(): FechaHora | undefined {
    return this.resuelta;
  }

  get resolucion(): ResolucionDiscrepancia | undefined {
    return this.resolucionActual;
  }

  resolver(resolucion: ResolucionDiscrepancia, en: FechaHora): void {
    if (!this.estaAbierta) {
      throw new TransicionInvalida("R14", `La discrepancia ${this.discrepanciaId} ya está resuelta`);
    }
    this.resolucionActual = resolucion;
    this.resuelta = en;
  }
}
