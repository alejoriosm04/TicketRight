import type { UUID } from "@ticketright/shared-kernel";
import type { ValidadorDeAdmision } from "@ticketright/sales";

import { tokensRechazados } from "../observability/metrics.js";
import { ValidadorDeTokenAdmision } from "../security/admission-token.js";

/**
 * Validador de admisión que verifica el JWT firmado (AD-004). Sustituye al stub de
 * demostración por la validación real de firma, emisor, audiencia, evento y expiración.
 * Solo acepta el JWT que emite la fila: el token plano `turno:<uuid>` se dejó de aceptar
 * porque cualquiera podía inventarlo y comprar sin pasar por la fila (AD-006).
 * Devuelve el `turnoId` (jti) para que la reserva quede ligada al turno.
 */
/** Token ausente, inventado, vencido o de otro evento: la ruta lo responde con 401. */
export class TokenDeAdmisionInvalido extends Error {}

export class ValidadorJwtDeAdmision implements ValidadorDeAdmision {
  constructor(
    private readonly validador: ValidadorDeTokenAdmision,
    private readonly eventoId: string,
  ) {}

  async validar(token: string, _fanId: UUID): Promise<UUID> {
    const resultado = this.validador.validar(token, this.eventoId);
    if (!resultado.valido) {
      tokensRechazados.inc({ motivo: resultado.motivo });
      throw new TokenDeAdmisionInvalido(`Token de admisión inválido: ${resultado.motivo}`);
    }
    return resultado.contenido.jti;
  }
}
