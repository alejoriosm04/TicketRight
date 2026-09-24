import {
  dentroDelRango,
  nuevoId,
  type FechaHora,
  type NIT,
  type Porcentaje,
  type RangoFecha,
  type UUID,
} from "@ticketright/shared-kernel";

import { ConvenioNoVigente } from "./errors.js";

/** `permanente` declara el parafiscal con el IVA; `ocasional`, 5 días hábiles tras el evento. */
export type TipoProductor = "permanente" | "ocasional";

export type EstadoConvenio = "borrador" | "firmado" | "vencido";

/**
 * Convenio (VO). Condiciones comerciales firmadas con el promotor: el cargo por servicio
 * (fuente de `DesglosePrecio.cargoServicio`) y la comisión de reventa por defecto, con su
 * vigencia. Inmutable: cualquier cambio produce otro convenio.
 */
export class Convenio {
  constructor(
    readonly cargoServicio: Porcentaje,
    readonly comisionReventa: Porcentaje,
    readonly vigencia: RangoFecha,
    readonly estado: EstadoConvenio,
  ) {}

  /** Vigente = firmado y la fecha cae dentro de la vigencia. */
  estaVigente(en: FechaHora): boolean {
    return this.estado === "firmado" && dentroDelRango(en, this.vigencia);
  }

  exigirVigente(en: FechaHora): void {
    if (!this.estaVigente(en)) {
      throw new ConvenioNoVigente();
    }
  }

  firmar(): Convenio {
    return new Convenio(this.cargoServicio, this.comisionReventa, this.vigencia, "firmado");
  }
}

/**
 * Promotor (RAÍZ). Persona jurídica responsable de organizar y comercializar eventos.
 * `tipoProductor` fija el plazo del parafiscal (Ley 1493). Referencia su `Convenio` vigente,
 * fuente del cargo por servicio y de la comisión de reventa por defecto.
 */
export class Promotor {
  private constructor(
    readonly promotorId: UUID,
    readonly nombreLegal: string,
    readonly nit: NIT,
    readonly tipoProductor: TipoProductor,
    private convenioActual: Convenio,
  ) {}

  static crear(
    nombreLegal: string,
    nit: NIT,
    tipoProductor: TipoProductor,
    convenio: Convenio,
    promotorId: UUID = nuevoId(),
  ): Promotor {
    return new Promotor(promotorId, nombreLegal, nit, tipoProductor, convenio);
  }

  get convenio(): Convenio {
    return this.convenioActual;
  }

  /** Actualiza el convenio (p. ej., al firmar uno nuevo). El anterior queda reemplazado. */
  actualizarConvenio(convenio: Convenio): void {
    this.convenioActual = convenio;
  }

  exigirConvenioVigente(en: FechaHora): void {
    this.convenioActual.exigirVigente(en);
  }
}
