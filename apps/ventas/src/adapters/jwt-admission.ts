import type { UUID } from "@ticketright/shared-kernel";
import type { ValidadorDeAdmision } from "@ticketright/sales";

import type { Consultable } from "../db/pool.js";
import { tokensRechazados } from "../observability/metrics.js";
import { ValidadorDeTokenAdmision } from "../security/admission-token.js";

/**
 * Validador de admisión que verifica el JWT firmado (AD-004). Sustituye al stub de
 * demostración por la validación real de firma, emisor, audiencia, evento y expiración.
 * Solo acepta el JWT que emite la fila: el token plano `turno:<uuid>` se dejó de aceptar
 * porque cualquiera podía inventarlo y comprar sin pasar por la fila (AD-006).
 *
 * El token va ligado al fan que entró a la fila (`sub`) y es de un solo uso (AD-004,
 * AD-006; Turno → Reserva es 1:0..1): al validarlo se registra su `jti` en `turnos_usados`.
 * El orquestador llama a `validar` dentro de la transacción de la reserva, así que si la
 * reserva se rechaza (aforo agotado) el rollback devuelve el turno y el fan puede intentar
 * otra localidad; si la reserva se confirma, el turno queda gastado.
 * Devuelve el `turnoId` (jti) para que la reserva quede ligada al turno.
 */
/** Token ausente, inventado, vencido o de otro evento: la ruta lo responde con 401. */
export class TokenDeAdmisionInvalido extends Error {}

export class ValidadorJwtDeAdmision implements ValidadorDeAdmision {
  constructor(
    private readonly validador: ValidadorDeTokenAdmision,
    private readonly eventoId: string,
    private readonly db: Consultable,
  ) {}

  async validar(token: string, fanId: UUID): Promise<UUID> {
    const resultado = this.validador.validar(token, this.eventoId);
    if (!resultado.valido) {
      this.rechazar(resultado.motivo);
    }
    const { sub, jti } = resultado.contenido;
    if (sub !== fanId) {
      this.rechazar("otro_fan");
    }
    const { rows } = await this.db.query(
      `insert into turnos_usados (turno_id, fan_id) values ($1, $2)
       on conflict (turno_id) do nothing returning turno_id`,
      [jti, fanId],
    );
    if (rows.length === 0) {
      this.rechazar("usado");
    }
    return jti;
  }

  private rechazar(motivo: string): never {
    tokensRechazados.inc({ motivo });
    throw new TokenDeAdmisionInvalido(`Token de admisión inválido: ${motivo}`);
  }
}
