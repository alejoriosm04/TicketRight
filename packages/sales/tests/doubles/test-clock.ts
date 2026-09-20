import type { FechaHora } from "@ticketright/shared-kernel";

export class TestClock {
  constructor(private actual: FechaHora) {}

  ahora(): FechaHora {
    return this.actual;
  }

  avanzarA(instante: FechaHora): void {
    this.actual = instante;
  }
}
