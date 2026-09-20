import pg from "pg";

import type { Consultable, ResultadoDeConsulta } from "./pool.js";

export function crearPool(databaseUrl: string): pg.Pool & Consultable {
  return new pg.Pool({ connectionString: databaseUrl }) as unknown as pg.Pool & Consultable;
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
