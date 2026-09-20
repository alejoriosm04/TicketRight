export class Dinero {
  private constructor(
    private readonly centavos: number,
    readonly moneda: string,
  ) {
    if (!Number.isInteger(centavos)) {
      throw new Error("Dinero se expresa en centavos enteros");
    }
  }

  static de(centavos: number, moneda = "COP"): Dinero {
    return new Dinero(Math.round(centavos), moneda);
  }

  static pesos(pesos: number, moneda = "COP"): Dinero {
    return new Dinero(Math.round(pesos * 100), moneda);
  }

  static cero(moneda = "COP"): Dinero {
    return new Dinero(0, moneda);
  }

  get valorCentavos(): number {
    return this.centavos;
  }

  get enPesos(): number {
    return this.centavos / 100;
  }

  get esCero(): boolean {
    return this.centavos === 0;
  }

  get esNegativo(): boolean {
    return this.centavos < 0;
  }

  sumar(otro: Dinero): Dinero {
    return new Dinero(this.centavos + this.exigirMoneda(otro).centavos, this.moneda);
  }

  restar(otro: Dinero): Dinero {
    return new Dinero(this.centavos - this.exigirMoneda(otro).centavos, this.moneda);
  }

  multiplicarPor(cantidad: number): Dinero {
    return new Dinero(this.centavos * cantidad, this.moneda);
  }

  aplicar(porcentaje: Porcentaje): Dinero {
    return new Dinero(Math.round(this.centavos * porcentaje.fraccion), this.moneda);
  }

  igualA(otro: Dinero): boolean {
    return this.centavos === this.exigirMoneda(otro).centavos;
  }

  mayorQue(otro: Dinero): boolean {
    return this.centavos > this.exigirMoneda(otro).centavos;
  }

  mayorOIgualQue(otro: Dinero): boolean {
    return this.centavos >= this.exigirMoneda(otro).centavos;
  }

  menorQue(otro: Dinero): boolean {
    return this.centavos < this.exigirMoneda(otro).centavos;
  }

  toString(): string {
    return `${this.moneda} ${this.enPesos.toFixed(2)}`;
  }

  private exigirMoneda(otro: Dinero): Dinero {
    if (otro.moneda !== this.moneda) {
      throw new Error(`Monedas distintas: ${this.moneda} y ${otro.moneda}`);
    }
    return otro;
  }
}

export class Porcentaje {
  private constructor(readonly fraccion: number) {}

  static de(valor: number): Porcentaje {
    return new Porcentaje(valor / 100);
  }

  aplicarA(dinero: Dinero): Dinero {
    return dinero.aplicar(this);
  }

  toString(): string {
    return `${(this.fraccion * 100).toFixed(2)}%`;
  }
}
