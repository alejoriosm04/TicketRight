export class InMemoryStore<T> {
  private readonly items = new Map<string, T>();
  private cola: Promise<unknown> = Promise.resolve();

  guardar(id: string, item: T): void {
    this.items.set(id, item);
  }

  obtener(id: string): T | undefined {
    return this.items.get(id);
  }

  async conTransaccion<R>(id: string, operacion: (item: T) => R | Promise<R>): Promise<R> {
    const anterior = this.cola;
    let liberar: () => void = () => {};
    this.cola = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    await anterior;
    try {
      const item = this.items.get(id);
      if (item === undefined) {
        throw new Error(`No existe el recurso ${id}`);
      }
      return await operacion(item);
    } finally {
      liberar();
    }
  }
}
