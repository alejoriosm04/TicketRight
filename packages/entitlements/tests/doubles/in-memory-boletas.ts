import type { Boleta } from "../../src/index.js";

export class InMemoryBoletas {
  private readonly items = new Map<string, Boleta>();
  private cola: Promise<unknown> = Promise.resolve();

  guardar(boleta: Boleta): void {
    this.items.set(boleta.boletaId, boleta);
  }

  obtener(boletaId: string): Boleta | undefined {
    return this.items.get(boletaId);
  }

  async conTransaccion<R>(boletaId: string, operacion: (boleta: Boleta) => R | Promise<R>): Promise<R> {
    const anterior = this.cola;
    let liberar: () => void = () => {};
    this.cola = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    await anterior;
    try {
      const boleta = this.items.get(boletaId);
      if (!boleta) {
        throw new Error(`No existe la boleta ${boletaId}`);
      }
      return await operacion(boleta);
    } finally {
      liberar();
    }
  }
}
