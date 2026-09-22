import type { Consultable } from "../db/pool.js";

/**
 * Registro de auditoría append-only (AD-004: "cada acceso declarará rol y finalidad y
 * quedará auditado"; A-8: reconstruir el 100% de las ventas). Homólogo local de AWS
 * CloudTrail: en producción los accesos y cambios quedan en CloudTrail; aquí en una tabla
 * de solo-inserción. No contiene datos personales, solo identificadores opacos y metadatos.
 */
export class RegistroDeAuditoria {
  constructor(private readonly db: Consultable) {}

  async inicializar(): Promise<void> {
    await this.db.query(
      `create table if not exists auditoria (
         id bigserial primary key,
         ocurrido_en timestamptz not null default now(),
         actor text not null,
         rol text not null,
         accion text not null,
         finalidad text not null,
         recurso text,
         detalle jsonb
       )`,
    );
  }

  /** Registra un acceso o cambio con rol y finalidad; nunca datos personales. */
  async registrar(entrada: {
    actor: string;
    rol: string;
    accion: string;
    finalidad: string;
    recurso?: string;
    detalle?: Record<string, unknown>;
  }): Promise<void> {
    await this.db.query(
      `insert into auditoria (actor, rol, accion, finalidad, recurso, detalle)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        entrada.actor,
        entrada.rol,
        entrada.accion,
        entrada.finalidad,
        entrada.recurso ?? null,
        entrada.detalle ? JSON.stringify(entrada.detalle) : null,
      ],
    );
  }
}
