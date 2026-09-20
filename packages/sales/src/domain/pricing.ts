import { Dinero, type Porcentaje } from "@ticketright/shared-kernel";

export class DesglosePrecio {
  constructor(
    readonly valorNominal: Dinero,
    readonly cargoServicio: Dinero,
    readonly contribucionParafiscal: Dinero,
  ) {}

  total(): Dinero {
    return this.valorNominal.sumar(this.cargoServicio).sumar(this.contribucionParafiscal);
  }
}

export class CalculadoraDePrecio {
  constructor(
    readonly cargoServicio: Porcentaje,
    readonly tasaParafiscal: Porcentaje,
    readonly umbralParafiscal: Dinero,
  ) {}

  desglosar(nominal: Dinero, cantidad = 1): DesglosePrecio {
    const parafiscal = nominal.mayorOIgualQue(this.umbralParafiscal)
      ? nominal.aplicar(this.tasaParafiscal)
      : Dinero.cero(nominal.moneda);
    return new DesglosePrecio(
      nominal.multiplicarPor(cantidad),
      nominal.aplicar(this.cargoServicio).multiplicarPor(cantidad),
      parafiscal.multiplicarPor(cantidad),
    );
  }
}
