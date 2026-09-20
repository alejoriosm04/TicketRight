import { nuevoId, type BoletaEmitida, type DatosDeEmision, type EmisorDeBoletas } from "@ticketright/shared-kernel";

export class FakeTicketIssuer implements EmisorDeBoletas {
  fallosRestantes = 0;
  readonly emitidas: DatosDeEmision[] = [];

  async emitir(datos: DatosDeEmision): Promise<BoletaEmitida> {
    if (this.fallosRestantes > 0) {
      this.fallosRestantes -= 1;
      throw new Error("El servicio de emisión no está disponible");
    }
    this.emitidas.push(datos);
    return { boletaId: nuevoId(), codigo: `BOLETA-${this.emitidas.length}`, version: 1 };
  }
}
