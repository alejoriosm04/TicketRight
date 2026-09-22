import type { UUID } from "@ticketright/shared-kernel";
import type { ValidadorDeAdmision } from "@ticketright/sales";

import { tokensRechazados } from "../observability/metrics.js";
import { ValidadorDeTokenAdmision } from "../security/admission-token.js";

/**
 * Validador de admisión que verifica el JWT firmado (AD-004). Sustituye al stub de
 * demostración por la validación real de firma, emisor, audiencia, evento y expiración.
 * Acepta también el token plano `turno:<uuid>` como compatibilidad hacia atrás para pruebas.
 * Devuelve el `turnoId` (jti) para que la reserva quede ligada al turno.
 */
export class ValidadorJwtDeAdmision implements ValidadorDeAdmision {
  constructor(
    private readonly validador: ValidadorDeTokenAdmision,
    private readonly eventoId: string,
  ) {}

  async validar(token: string, _fanId: UUID): Promise<UUID> {
    // Compatibilidad: token plano de demostración.
    if (token.startsWith("turno:")) {
      const turnoId = token.slice("turno:".length);
      if (turnoId.length === 0) {
        tokensRechazados.inc({ motivo: "vacio" });
        throw new Error("El token de admisión no trae turno");
      }
      return turnoId;
    }
    // Token JWT firmado (camino real).
    const resultado = this.validador.validar(token, this.eventoId);
    if (!resultado.valido) {
      tokensRechazados.inc({ motivo: resultado.motivo });
      throw new Error(`Token de admisión inválido: ${resultado.motivo}`);
    }
    return resultado.contenido.jti;
  }
}
