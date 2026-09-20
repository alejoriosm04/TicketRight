import type { ConfirmarPago, Pago, PasarelaDePago } from "../../src/index.js";

export class FakePaymentGateway implements PasarelaDePago {
  firmaValida = true;
  readonly cobros: Pago[] = [];

  async cobrar(pago: Pago): Promise<void> {
    this.cobros.push(pago);
  }

  async verificarFirma(_cmd: ConfirmarPago): Promise<boolean> {
    return this.firmaValida;
  }
}
