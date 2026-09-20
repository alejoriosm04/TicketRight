import type { UUID } from "@ticketright/shared-kernel";
import type { ValidadorDeAdmision } from "@ticketright/sales";

export class ValidadorDeAdmisionDeDemostracion implements ValidadorDeAdmision {
  async validar(token: string, _fanId: UUID): Promise<UUID> {
    if (!token.startsWith("turno:")) {
      throw new Error("Token de admisión inválido; usa «turno:<uuid>» en la demo");
    }
    const turnoId = token.slice("turno:".length);
    if (turnoId.length === 0) {
      throw new Error("El token de admisión no trae turno");
    }
    return turnoId;
  }
}
