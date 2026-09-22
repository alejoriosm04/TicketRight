import { randomUUID } from "node:crypto";

/**
 * Sala de espera de demostración. Modela la fila de admisión (AD-006: la fila como
 * válvula de back pressure que regula la entrada al núcleo transaccional) de forma
 * suficiente para la demo: la gente entra, espera, y un admisor la deja pasar a una
 * tasa configurable. Cada admisión emite un token `turno:<uuid>` que el validador de
 * admisión de ventas ya acepta.
 *
 * En producción esto vive en el contexto admission-identity con la fila en Redis
 * (Space-Based); aquí es en memoria porque la demo corre en un solo proceso.
 */

export type EstadoTurnoDemo = "enEspera" | "admitido" | "usado" | "vencido";

export interface TurnoDemo {
  turnoId: string;
  fanId: string;
  eventoId: string;
  estado: EstadoTurnoDemo;
  ingresoEn: number;
  admitidoEn?: number;
  ultimaActividad: number;
}

export interface EstadoDeFila {
  posicion: number;
  estado: EstadoTurnoDemo;
  turnoId: string;
  token?: string;
  personasDelante: number;
}

export interface OpcionesDeSalaDeEspera {
  /** Cuántos turnos se admiten en cada tic del admisor. */
  admitidosPorTic: number;
  /** Cada cuánto corre el admisor. */
  intervaloAdmisionMs: number;
  /** Vigencia de un turno admitido antes de vencer. */
  vigenciaTurnoMs: number;
  /** Ventana para considerar a alguien "sesión activa". */
  ventanaSesionMs: number;
}

/**
 * Firma el token de admisión (AD-004). Recibe el fanId opaco, el evento y el jti (turnoId)
 * y devuelve el JWT firmado. Si no se inyecta, se usa el token plano `turno:<uuid>` (demo).
 */
export type FirmarTokenAdmision = (subOpaco: string, eventId: string, jti: string) => string;

export const OPCIONES_SALA_POR_DEFECTO: OpcionesDeSalaDeEspera = {
  admitidosPorTic: 25,
  intervaloAdmisionMs: 1000,
  vigenciaTurnoMs: 5 * 60 * 1000,
  ventanaSesionMs: 5 * 60 * 1000,
};

export interface ResumenDeFila {
  enEspera: number;
  admitidos: number;
  sesionesActivas: number;
}

/**
 * Contrato de la fila de admisión. Lo cumplen la implementación en memoria (para pruebas
 * y arranque sin Redis) y la implementación sobre Redis (fila Space-Based, AD-006). Los
 * métodos son asíncronos porque Redis lo es; la app no distingue cuál está detrás.
 */
export interface Fila {
  iniciar(): void;
  detener(): void;
  entrar(fanId: string): Promise<TurnoDemo>;
  estado(turnoId: string): Promise<EstadoDeFila | undefined>;
  marcarUsado(turnoId: string): Promise<void>;
  resumen(): Promise<ResumenDeFila>;
  /** Ajusta la tasa de admisión (turnos por tic); la usa el gestor de perfiles (AD-006). */
  ajustarTasa(admitidosPorTic: number): void;
}

export class SalaDeEspera implements Fila {
  private readonly turnos = new Map<string, TurnoDemo>();
  private readonly orden: string[] = [];
  private admisor: NodeJS.Timeout | undefined;
  private tasaAdmision: number;

  constructor(
    private readonly eventoId: string,
    private readonly opciones: OpcionesDeSalaDeEspera = OPCIONES_SALA_POR_DEFECTO,
    private readonly alAdmitir?: (turno: TurnoDemo) => void,
    private readonly firmarToken?: FirmarTokenAdmision,
  ) {
    this.tasaAdmision = opciones.admitidosPorTic;
  }

  ajustarTasa(admitidosPorTic: number): void {
    this.tasaAdmision = Math.max(0, admitidosPorTic);
  }

  iniciar(): void {
    this.admisor = setInterval(() => this.admitirLote(), this.opciones.intervaloAdmisionMs);
  }

  detener(): void {
    if (this.admisor) {
      clearInterval(this.admisor);
      this.admisor = undefined;
    }
  }

  /** Alguien entra a la fila. Idempotente por clave (misma clave, mismo turno). */
  async entrar(fanId: string, ahora = Date.now()): Promise<TurnoDemo> {
    const turno: TurnoDemo = {
      turnoId: randomUUID(),
      fanId,
      eventoId: this.eventoId,
      estado: "enEspera",
      ingresoEn: ahora,
      ultimaActividad: ahora,
    };
    this.turnos.set(turno.turnoId, turno);
    this.orden.push(turno.turnoId);
    return turno;
  }

  /** Consulta el estado y la posición aproximada de un turno. */
  async estado(turnoId: string, ahora = Date.now()): Promise<EstadoDeFila | undefined> {
    const turno = this.turnos.get(turnoId);
    if (!turno) {
      return undefined;
    }
    turno.ultimaActividad = ahora;
    const enEspera = this.orden.filter((id) => this.turnos.get(id)?.estado === "enEspera");
    const posicion = enEspera.indexOf(turnoId);
    const resultado: EstadoDeFila = {
      turnoId,
      estado: turno.estado,
      posicion: posicion >= 0 ? posicion + 1 : 0,
      personasDelante: posicion >= 0 ? posicion : 0,
    };
    if (turno.estado === "admitido") {
      resultado.token = this.firmarToken
        ? this.firmarToken(turno.fanId, this.eventoId, turno.turnoId)
        : `turno:${turno.turnoId}`;
    }
    return resultado;
  }

  /** Marca que un turno se usó para comprar (sale de la fila admitida). */
  async marcarUsado(turnoId: string, ahora = Date.now()): Promise<void> {
    const turno = this.turnos.get(turnoId);
    if (turno && turno.estado === "admitido") {
      turno.estado = "usado";
      turno.ultimaActividad = ahora;
    }
  }

  /** Admite el siguiente lote según la política; devuelve los turnos admitidos. */
  admitirLote(ahora = Date.now()): TurnoDemo[] {
    this.vencerExpirados(ahora);
    const admitidos: TurnoDemo[] = [];
    for (const id of this.orden) {
      if (admitidos.length >= this.tasaAdmision) {
        break;
      }
      const turno = this.turnos.get(id);
      if (turno && turno.estado === "enEspera") {
        turno.estado = "admitido";
        turno.admitidoEn = ahora;
        turno.ultimaActividad = ahora;
        admitidos.push(turno);
        this.alAdmitir?.(turno);
      }
    }
    return admitidos;
  }

  /**
   * Cifras para las métricas:
   * - enEspera: turnos esperando su admisión.
   * - admitidos: turnos admitidos que aún pueden comprar.
   * - sesionesActivas: turnos que interactuaron (entraron o consultaron) en la ventana
   *   reciente y todavía no terminaron su compra; representa "personas conectadas ahora".
   */
  async resumen(ahora = Date.now()): Promise<ResumenDeFila> {
    let enEspera = 0;
    let admitidos = 0;
    let sesionesActivas = 0;
    for (const turno of this.turnos.values()) {
      if (turno.estado === "enEspera") {
        enEspera += 1;
      } else if (turno.estado === "admitido") {
        admitidos += 1;
      }
      const reciente = ahora - turno.ultimaActividad <= this.opciones.ventanaSesionMs;
      const sigueEnLaVenta = turno.estado === "enEspera" || turno.estado === "admitido";
      if (reciente && sigueEnLaVenta) {
        sesionesActivas += 1;
      }
    }
    return { enEspera, admitidos, sesionesActivas };
  }

  private vencerExpirados(ahora: number): void {
    for (const turno of this.turnos.values()) {
      if (turno.estado === "admitido" && turno.admitidoEn !== undefined) {
        if (ahora - turno.admitidoEn > this.opciones.vigenciaTurnoMs) {
          turno.estado = "vencido";
        }
      }
    }
  }
}
