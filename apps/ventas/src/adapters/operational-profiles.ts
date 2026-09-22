import { perfilOperativo } from "../observability/metrics.js";

/**
 * Gestor de perfiles operativos (AD-006). Homólogo local de EventBridge Scheduler + la
 * máquina de estados de perfiles: cotidiano, preparación, pico, recuperación y emergencia.
 * Al cambiar de perfil ajusta la tasa de admisión de la fila (back pressure) y expone el
 * perfil actual como métrica. En producción el calendario del evento dispara las
 * transiciones (precalentamiento T−N, apertura, cierre); aquí se puede programar o forzar.
 *
 * No cambia endpoints, contratos de token ni reglas de inventario al pasar de un perfil a
 * otro (AD-006): solo cambia la capacidad y el ritmo de admisión.
 */
export type PerfilOperativo = "cotidiano" | "preparacion" | "pico" | "recuperacion" | "emergencia";

const CODIGO: Record<PerfilOperativo, number> = {
  cotidiano: 0,
  preparacion: 1,
  pico: 2,
  recuperacion: 3,
  emergencia: 4,
};

/** Parámetros de admisión por perfil: cuántos turnos admite la fila por tic. */
export interface AjustesDePerfil {
  admitidosPorTic: number;
  descripcion: string;
}

const AJUSTES: Record<PerfilOperativo, AjustesDePerfil> = {
  // Cotidiano: paso directo, admite rápido porque no hay multitud.
  cotidiano: { admitidosPorTic: 50, descripcion: "paso directo; capacidad mínima" },
  // Preparación: se cierra temporalmente la apertura mientras se precalienta.
  preparacion: { admitidosPorTic: 0, descripcion: "precalentando; admisión cerrada" },
  // Pico: fila obligatoria, admisión regulada por la capacidad segura del núcleo.
  pico: { admitidosPorTic: 15, descripcion: "fila obligatoria; admisión regulada (back pressure)" },
  // Recuperación: no entran nuevos; se drena el trabajo en curso.
  recuperacion: { admitidosPorTic: 0, descripcion: "no ingresan nuevos; drenando trabajo" },
  // Emergencia: prioriza proteger pagos; corta admisión y prepara fila.
  emergencia: { admitidosPorTic: 3, descripcion: "protege pagos; admisión mínima" },
};

export class GestorDePerfiles {
  private perfil: PerfilOperativo = "cotidiano";
  private readonly programados: NodeJS.Timeout[] = [];

  constructor(private readonly aplicarTasa: (admitidosPorTic: number) => void) {
    this.aplicar();
  }

  get actual(): PerfilOperativo {
    return this.perfil;
  }

  get ajustes(): AjustesDePerfil {
    return AJUSTES[this.perfil];
  }

  /** Cambia el perfil y aplica sus ajustes (tasa de admisión + métrica). */
  cambiarA(perfil: PerfilOperativo): void {
    this.perfil = perfil;
    this.aplicar();
    console.log(`perfil operativo → ${perfil} (${AJUSTES[perfil].descripcion})`);
  }

  private aplicar(): void {
    perfilOperativo.set(CODIGO[this.perfil]);
    this.aplicarTasa(AJUSTES[this.perfil].admitidosPorTic);
  }

  /**
   * Programa una ventana de venta como haría EventBridge Scheduler: precalienta (preparación)
   * en T−precalentamientoMs, abre (pico) en T=apertura, y a las durataMs cierra a
   * recuperación y luego vuelve a cotidiano. Los tiempos son relativos para la demo.
   */
  programarVentana(precalentamientoMs: number, duracionPicoMs: number, drenajeMs: number): void {
    this.limpiarProgramados();
    this.cambiarA("preparacion");
    this.programados.push(setTimeout(() => this.cambiarA("pico"), precalentamientoMs));
    this.programados.push(
      setTimeout(() => this.cambiarA("recuperacion"), precalentamientoMs + duracionPicoMs),
    );
    this.programados.push(
      setTimeout(() => this.cambiarA("cotidiano"), precalentamientoMs + duracionPicoMs + drenajeMs),
    );
  }

  private limpiarProgramados(): void {
    for (const t of this.programados) clearTimeout(t);
    this.programados.length = 0;
  }

  detener(): void {
    this.limpiarProgramados();
  }
}
