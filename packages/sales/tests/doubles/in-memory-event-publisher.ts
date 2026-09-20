import type { EventoDeDominio, PublicadorDeEventos } from "../../src/index.js";

export class InMemoryEventPublisher implements PublicadorDeEventos {
  readonly eventos: EventoDeDominio[] = [];

  async publicar(evento: EventoDeDominio): Promise<void> {
    this.eventos.push(evento);
  }

  porNombre(nombre: string): readonly EventoDeDominio[] {
    return this.eventos.filter((evento) => evento.nombre() === nombre);
  }
}
