import { nuevoId, type FechaHora, type IdOpaco, type UUID } from "@ticketright/shared-kernel";

import { ConsentimientoNoVigente, TransicionInvalida } from "./errors.js";

export type EstadoFan = "activo" | "suspendido";
export type FinalidadTratamiento = "emision" | "notificacion" | "transferenciaAlPromotor" | "marketing";

export class Consentimiento {
  private revocado: FechaHora | undefined;

  constructor(
    readonly consentimientoId: UUID,
    readonly finalidad: FinalidadTratamiento,
    readonly otorgadoEn: FechaHora,
    revocadoEn?: FechaHora,
  ) {
    this.revocado = revocadoEn;
  }

  get revocadoEn(): FechaHora | undefined {
    return this.revocado;
  }

  get vigente(): boolean {
    return this.revocado === undefined;
  }

  revocar(en: FechaHora): void {
    if (!this.vigente) {
      throw new TransicionInvalida("R11", `El consentimiento ${this.consentimientoId} ya fue revocado`);
    }
    this.revocado = en;
  }
}

export class Fan {
  private readonly consentimientosActuales: Consentimiento[] = [];
  private denegados = 0;
  private estadoActual: EstadoFan;

  constructor(
    readonly fanId: UUID,
    readonly identidadRef: IdOpaco,
    estado: EstadoFan = "activo",
  ) {
    this.estadoActual = estado;
  }

  get estado(): EstadoFan {
    return this.estadoActual;
  }

  get consentimientos(): readonly Consentimiento[] {
    return this.consentimientosActuales;
  }

  get intentosDenegados(): number {
    return this.denegados;
  }

  otorgarConsentimiento(finalidad: FinalidadTratamiento, en: FechaHora): Consentimiento {
    const consentimiento = new Consentimiento(nuevoId(), finalidad, en);
    this.consentimientosActuales.push(consentimiento);
    return consentimiento;
  }

  revocarConsentimiento(finalidad: FinalidadTratamiento, en: FechaHora): void {
    const vigente = this.consentimientoVigente(finalidad);
    if (!vigente) {
      throw new ConsentimientoNoVigente(finalidad, this.fanId);
    }
    vigente.revocar(en);
  }

  consentimientoVigente(finalidad: FinalidadTratamiento): Consentimiento | undefined {
    return [...this.consentimientosActuales]
      .reverse()
      .find((consentimiento) => consentimiento.finalidad === finalidad && consentimiento.vigente);
  }

  tieneConsentimiento(finalidad: FinalidadTratamiento): boolean {
    return this.consentimientoVigente(finalidad) !== undefined;
  }

  autorizarCompartirDatos(finalidad: FinalidadTratamiento): void {
    if (!this.tieneConsentimiento(finalidad)) {
      this.denegados += 1;
      throw new ConsentimientoNoVigente(finalidad, this.fanId);
    }
  }
}
