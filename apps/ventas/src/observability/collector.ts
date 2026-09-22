import type { Fila } from "../adapters/waiting-room.js";
import type { Consultable } from "../db/pool.js";
import {
  aforoPorEstado,
  conexionesPostgres,
  costoInfraPorBoleta,
  discrepanciasAbiertas,
  edadDiscrepanciaMasAntigua,
  pagosEnCurso,
  personasAdmitidas,
  personasEnFila,
  reservasVencidasSinLiberar,
  sesionesActivas,
  sobreventas,
} from "./metrics.js";

/** Estadísticas de conexiones que expone el pool de node-postgres. */
export interface EstadisticasDePool {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

/**
 * Refresca periódicamente los gauges que se calculan a partir del estado durable en
 * PostgreSQL (la autoridad transaccional) y de la saturación del pool. Un gauge refleja
 * un estado presente, así que conviene recalcularlo desde la fuente de verdad en lugar de
 * mantener un acumulado en memoria que podría desincronizarse tras un reinicio.
 */
export class ColectorDeGauges {
  private temporizador: NodeJS.Timeout | undefined;

  private readonly costoInfraHoraCop: number;

  // Exceso ya contado por localidad: el contador solo sube cuando el exceso crece.
  private readonly excesoContado = new Map<string, number>();

  constructor(
    private readonly db: Consultable,
    private readonly pool?: EstadisticasDePool,
    private readonly sala?: Fila,
    private readonly eventoId = "demo",
    private readonly intervaloMs = 5000,
  ) {
    // Costo de infraestructura por hora [S] para la demo; configurable por ambiente.
    this.costoInfraHoraCop = Number(process.env.INFRA_COSTO_HORA_COP ?? 90000);
  }

  iniciar(): void {
    void this.refrescar();
    this.temporizador = setInterval(() => {
      void this.refrescar();
    }, this.intervaloMs);
  }

  detener(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
  }

  async refrescar(): Promise<void> {
    this.refrescarPool();
    try {
      await this.refrescarFila();
      await this.refrescarDiscrepancias();
      await this.refrescarReservasVencidas();
      await this.refrescarInventario();
      await this.detectarSobreventa();
      await this.refrescarPagosEnCurso();
      await this.refrescarCostoPorBoleta();
    } catch (error) {
      console.error("colector de gauges: no pudo consultar PostgreSQL", error);
    }
  }

  private async refrescarCostoPorBoleta(): Promise<void> {
    // Costo de infraestructura por boleta = costo por hora / boletas vendidas en la última hora.
    // Vigila la viabilidad económica bajo carga (meta ≤ COP $150). A-7.
    const { rows } = await this.db.query(
      `select count(*)::int as vendidas
       from boletas
       where emitida_en >= now() - interval '1 hour'`,
    );
    const vendidas = Number(rows[0]?.vendidas ?? 0);
    costoInfraPorBoleta.set(vendidas > 0 ? Math.round(this.costoInfraHoraCop / vendidas) : 0);
  }

  private async refrescarFila(): Promise<void> {
    if (!this.sala) {
      return;
    }
    const resumen = await this.sala.resumen();
    personasEnFila.set({ evento: this.eventoId }, resumen.enEspera);
    personasAdmitidas.set({ evento: this.eventoId }, resumen.admitidos);
    sesionesActivas.set(resumen.sesionesActivas);
  }

  private async refrescarPagosEnCurso(): Promise<void> {
    const { rows } = await this.db.query(
      `select count(*)::int as en_curso
       from pagos
       where estado in ('iniciado', 'pendientePasarela')`,
    );
    const fila = rows[0] ?? {};
    pagosEnCurso.set(Number(fila.en_curso ?? 0));
  }

  private refrescarPool(): void {
    if (!this.pool) {
      return;
    }
    conexionesPostgres.set({ state: "total" }, this.pool.totalCount);
    conexionesPostgres.set({ state: "idle" }, this.pool.idleCount);
    conexionesPostgres.set({ state: "waiting" }, this.pool.waitingCount);
  }

  private async refrescarDiscrepancias(): Promise<void> {
    const { rows } = await this.db.query(
      `select count(*)::int as abiertas,
              coalesce(extract(epoch from (now() - min(detectada_en))), 0)::float as edad_segundos
       from discrepancias
       where resuelta_en is null`,
    );
    const fila = rows[0] ?? {};
    discrepanciasAbiertas.set(Number(fila.abiertas ?? 0));
    edadDiscrepanciaMasAntigua.set(Number(fila.edad_segundos ?? 0));
  }

  private async refrescarReservasVencidas(): Promise<void> {
    const { rows } = await this.db.query(
      `select count(*)::int as vencidas
       from reservas
       where estado in ('vigente', 'enPago') and vence_en <= now()`,
    );
    const fila = rows[0] ?? {};
    reservasVencidasSinLiberar.set(Number(fila.vencidas ?? 0));
  }

  /**
   * Sobreventa (A-2) medida desde los hechos y no desde los contadores de la localidad:
   * unidades en reservas vivas más boletas válidas, contra el aforo autorizado. Si el
   * contador `aforo_reservado` se desincroniza (una actualización perdida), esta cuenta
   * independiente lo delata; comparar el contador consigo mismo nunca lo haría.
   */
  private async detectarSobreventa(): Promise<void> {
    const { rows } = await this.db.query(
      `select l.localidad_id, coalesce(l.nombre, l.localidad_id::text) as nombre,
              l.aforo_autorizado,
              (select coalesce(sum(i.cantidad), 0) from items_reserva i
                 join reservas r on r.reserva_id = i.reserva_id
               where i.localidad_id = l.localidad_id and r.estado in ('vigente', 'enPago'))
            + (select count(*) from boletas b
               where b.localidad_id = l.localidad_id and b.estado <> 'anulada') as comprometido
       from localidades l`,
    );
    for (const fila of rows) {
      const id = String(fila.localidad_id);
      const exceso = Math.max(0, Number(fila.comprometido) - Number(fila.aforo_autorizado));
      const contado = this.excesoContado.get(id) ?? 0;
      if (exceso > contado) {
        sobreventas.inc({ localidad: String(fila.nombre) }, exceso - contado);
        this.excesoContado.set(id, exceso);
      }
    }
  }

  private async refrescarInventario(): Promise<void> {
    // Se reinicia el gauge para que refleje solo las localidades actuales; si una
    // localidad deja de existir, sus series no quedan "pegadas" en memoria.
    aforoPorEstado.reset();
    const { rows } = await this.db.query(
      `select localidad_id, coalesce(nombre, localidad_id::text) as nombre, tipo,
              aforo_autorizado, aforo_reservado, aforo_vendido
       from localidades`,
    );
    for (const fila of rows) {
      // Se usa el nombre legible (Oriental, Occidental, Sur, Norte) como etiqueta,
      // no el UUID, para que el tablero sea entendible. El conjunto es pequeño y fijo,
      // así que la cardinalidad se mantiene controlada.
      const localidad = String(fila.nombre);
      const tipo = String(fila.tipo);
      const autorizado = Number(fila.aforo_autorizado);
      const reservado = Number(fila.aforo_reservado);
      const vendido = Number(fila.aforo_vendido);
      const disponible = autorizado - reservado - vendido;
      aforoPorEstado.set({ localidad, tipo, state: "autorizado" }, autorizado);
      aforoPorEstado.set({ localidad, tipo, state: "reservado" }, reservado);
      aforoPorEstado.set({ localidad, tipo, state: "vendido" }, vendido);
      aforoPorEstado.set({ localidad, tipo, state: "disponible" }, disponible);
    }
  }
}
