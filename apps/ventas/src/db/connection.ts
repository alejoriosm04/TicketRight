import pg from "pg";

import type { Consultable, ResultadoDeConsulta } from "./pool.js";

export function crearPool(databaseUrl: string): pg.Pool & Consultable {
  // Timeouts acotados: si PostgreSQL no responde, las operaciones fallan de forma
  // controlada en vez de colgarse indefinidamente. Es la defensa que IF-03 comprueba
  // (rechazo temporal controlado ante indisponibilidad de la base).
  return new pg.Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS ?? 4000),
    // statement_timeout lo hace cumplir el servidor; query_timeout es del lado del cliente
    // y cubre el caso en que el servidor está congelado o incomunicado y no puede responder
    // (IF-03). Así una operación contra una base caída falla acotada en vez de colgarse.
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS ?? 5000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS ?? 5000),
  }) as unknown as pg.Pool & Consultable;
}

export async function enTransaccion<T>(
  pool: pg.Pool,
  operacion: (cliente: Consultable) => Promise<T>,
): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query("begin");
    const resultado = await operacion(cliente as unknown as Consultable);
    await cliente.query("commit");
    return resultado;
  } catch (error) {
    await cliente.query("rollback");
    throw error;
  } finally {
    cliente.release();
  }
}

export type { ResultadoDeConsulta };
