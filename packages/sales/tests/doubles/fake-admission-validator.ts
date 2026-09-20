import { nuevoId, type UUID } from "@ticketright/shared-kernel";

import type { ValidadorDeAdmision } from "../../src/index.js";

export class FakeAdmissionValidator implements ValidadorDeAdmision {
  turnoId: UUID = nuevoId();
  rechaza = false;

  async validar(_token: string, _fanId: UUID): Promise<UUID> {
    if (this.rechaza) {
      throw new Error("El turno no es válido");
    }
    return this.turnoId;
  }
}
