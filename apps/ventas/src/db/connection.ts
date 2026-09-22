import { AsyncLocalStorage } from "node:async_hooks";

import pg from "pg";

import type { UnidadDeTrabajo } from "@ticketright/sales";

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

/**
 * Unidad de trabajo sobre PostgreSQL (el `Transaccion` de los adaptadores en el diagrama de
 * clases). Los repositorios consultan a través de ella: dentro de `ejecutar` todas sus
 * consultas van por el mismo cliente, entre `BEGIN` y `COMMIT`, así que el `FOR UPDATE` de
 * la localidad sostiene el bloqueo hasta el final del paso (AD-003). Fuera de `ejecutar`
 * cada consulta va directo al pool, como antes.
 */
export class BaseTransaccional implements Consultable, UnidadDeTrabajo {
  private readonly clienteActual = new AsyncLocalStorage<pg.PoolClient>();

  constructor(private readonly pool: pg.Pool) {}

  query(sql: string, parametros?: readonly unknown[]): Promise<ResultadoDeConsulta> {
    const cliente = this.clienteActual.getStore();
    return (cliente ?? this.pool).query(sql, parametros as unknown[]);
  }

  async ejecutar<T>(trabajo: () => Promise<T>): Promise<T> {
    // Un paso anidado se une a la transacción que ya está abierta.
    if (this.clienteActual.getStore()) {
      return trabajo();
    }
    const cliente = await this.pool.connect();
    let clienteRoto: Error | undefined;
    try {
      await cliente.query("begin");
      const resultado = await this.clienteActual.run(cliente, trabajo);
      await cliente.query("commit");
      return resultado;
    } catch (error) {
      // Si ni el rollback responde (base congelada, IF-03), la conexión se descarta.
      await cliente.query("rollback").catch((fallo: Error) => {
        clienteRoto = fallo;
      });
      throw error;
    } finally {
      cliente.release(clienteRoto);
    }
  }
}

export type { ResultadoDeConsulta };
