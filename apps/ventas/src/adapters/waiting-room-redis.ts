import { randomUUID } from "node:crypto";

import { Redis } from "ioredis";

import type {
  EstadoDeFila,
  EstadoTurnoDemo,
  Fila,
  FirmarTokenAdmision,
  OpcionesDeSalaDeEspera,
  ResumenDeFila,
  TurnoDemo,
} from "./waiting-room.js";
import { OPCIONES_SALA_POR_DEFECTO } from "./waiting-room.js";

/**
 * Fila de admisión sobre Redis (implementación de la zona Space-Based de AD-006 y de la
 * proyección operativa de AD-003). En producción es Amazon ElastiCache for Redis.
 *
 * Estructuras (llaves versionadas como fija el diseño, `fila:{evento}:...`):
 * - `fila:{evento}:{turno}`  hash con el estado durable del turno (ingreso, estado, admisión…).
 * - `fila:{evento}:orden`    sorted set por `ingresoEn` → determina la posición (orden de llegada).
 * - `fila:{evento}:espera`   sorted set con los turnos aún en espera (candidatos a admisión).
 *
 * Redis acelera la vista y admite por lotes, pero **no decide aforo**: eso queda en
 * PostgreSQL (AD-003). El registro del turno es durable en Redis y reconstruible.
 */
export class SalaDeEsperaRedis implements Fila {
  private readonly redis: Redis;
  private admisor: NodeJS.Timeout | undefined;
  private tasaAdmision: number;

  constructor(
    private readonly eventoId: string,
    redisUrl: string,
    private readonly opciones: OpcionesDeSalaDeEspera = OPCIONES_SALA_POR_DEFECTO,
    private readonly alAdmitir?: (turno: TurnoDemo) => void,
    private readonly firmarToken?: FirmarTokenAdmision,
  ) {
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 2, lazyConnect: false });
    this.tasaAdmision = opciones.admitidosPorTic;
  }

  ajustarTasa(admitidosPorTic: number): void {
    this.tasaAdmision = Math.max(0, admitidosPorTic);
  }

  private claveTurno(turnoId: string): string {
    return `fila:${this.eventoId}:${turnoId}`;
  }
  private get claveOrden(): string {
    return `fila:${this.eventoId}:orden`;
  }
  private get claveEspera(): string {
    return `fila:${this.eventoId}:espera`;
  }

  iniciar(): void {
    this.admisor = setInterval(() => {
      this.admitirLote().catch((error) => {
        console.error("sala de espera Redis: fallo al admitir lote", error?.message ?? error);
      });
    }, this.opciones.intervaloAdmisionMs);
  }

  detener(): void {
    if (this.admisor) {
      clearInterval(this.admisor);
      this.admisor = undefined;
    }
    void this.redis.quit();
  }

  async entrar(fanId: string, ahora = Date.now()): Promise<TurnoDemo> {
    const turno: TurnoDemo = {
      turnoId: randomUUID(),
      fanId,
      eventoId: this.eventoId,
      estado: "enEspera",
      ingresoEn: ahora,
      ultimaActividad: ahora,
    };
    const pipe = this.redis.multi();
    pipe.hset(this.claveTurno(turno.turnoId), {
      turnoId: turno.turnoId,
      fanId: turno.fanId,
      eventoId: turno.eventoId,
      estado: turno.estado,
      ingresoEn: String(turno.ingresoEn),
      ultimaActividad: String(turno.ultimaActividad),
    });
    pipe.zadd(this.claveOrden, ahora, turno.turnoId);
    pipe.zadd(this.claveEspera, ahora, turno.turnoId);
    await pipe.exec();
    return turno;
  }

  async estado(turnoId: string, ahora = Date.now()): Promise<EstadoDeFila | undefined> {
    const datos = await this.redis.hgetall(this.claveTurno(turnoId));
    if (!datos || !datos.estado) {
      return undefined;
    }
    await this.redis.hset(this.claveTurno(turnoId), "ultimaActividad", String(ahora));
    const estado = datos.estado as EstadoTurnoDemo;
    // Posición = cuántos turnos en espera llegaron antes (rango en el sorted set de espera).
    let posicion = 0;
    let personasDelante = 0;
    if (estado === "enEspera") {
      const rango = await this.redis.zrank(this.claveEspera, turnoId);
      personasDelante = rango === null ? 0 : rango;
      posicion = personasDelante + 1;
    }
    const resultado: EstadoDeFila = { turnoId, estado, posicion, personasDelante };
    if (estado === "admitido") {
      resultado.token = this.firmarToken
        ? this.firmarToken(datos.fanId ?? "", this.eventoId, turnoId)
        : `turno:${turnoId}`;
    }
    return resultado;
  }

  async marcarUsado(turnoId: string, ahora = Date.now()): Promise<void> {
    const estado = await this.redis.hget(this.claveTurno(turnoId), "estado");
    if (estado === "admitido") {
      await this.redis.hset(this.claveTurno(turnoId), "estado", "usado", "ultimaActividad", String(ahora));
    }
  }

  /** Admite el siguiente lote de turnos en espera, respetando el orden de llegada. */
  async admitirLote(ahora = Date.now()): Promise<TurnoDemo[]> {
    if (this.tasaAdmision <= 0) {
      return []; // admisión cerrada (perfil preparación/recuperación)
    }
    const ids = await this.redis.zrange(this.claveEspera, "0", String(this.tasaAdmision - 1));
    const admitidos: TurnoDemo[] = [];
    for (const turnoId of ids) {
      // Sale de la cola de espera y pasa a admitido de forma atómica por turno.
      const removido = await this.redis.zrem(this.claveEspera, turnoId);
      if (removido === 0) {
        continue; // otro tic ya lo tomó
      }
      await this.redis.hset(
        this.claveTurno(turnoId),
        "estado",
        "admitido",
        "admitidoEn",
        String(ahora),
        "ultimaActividad",
        String(ahora),
      );
      const datos = await this.redis.hgetall(this.claveTurno(turnoId));
      const turno: TurnoDemo = {
        turnoId,
        fanId: datos.fanId ?? "",
        eventoId: this.eventoId,
        estado: "admitido",
        ingresoEn: Number(datos.ingresoEn ?? ahora),
        admitidoEn: ahora,
        ultimaActividad: ahora,
      };
      admitidos.push(turno);
      this.alAdmitir?.(turno);
    }
    return admitidos;
  }

  async resumen(ahora = Date.now()): Promise<ResumenDeFila> {
    const enEspera = await this.redis.zcard(this.claveEspera);
    // Admitidos y sesiones activas: se recorren los turnos del evento por su índice de orden.
    const ids = await this.redis.zrange(this.claveOrden, "0", "-1");
    let admitidos = 0;
    let sesionesActivas = 0;
    for (const turnoId of ids) {
      const datos = await this.redis.hgetall(this.claveTurno(turnoId));
      if (!datos.estado) continue;
      const estado = datos.estado as EstadoTurnoDemo;
      if (estado === "admitido") admitidos += 1;
      const reciente = ahora - Number(datos.ultimaActividad ?? 0) <= this.opciones.ventanaSesionMs;
      const sigueEnLaVenta = estado === "enEspera" || estado === "admitido";
      if (reciente && sigueEnLaVenta) sesionesActivas += 1;
    }
    return { enEspera, admitidos, sesionesActivas };
  }
}
