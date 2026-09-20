import type { EventoDeDominio, PublicadorDeEventos } from "@ticketright/sales";

import type { Consultable } from "../db/pool.js";

export class PublicadorDeEventosOutbox implements PublicadorDeEventos {
  constructor(private readonly db: Consultable) {}

  async publicar(evento: EventoDeDominio): Promise<void> {
    await this.db.query(
      `insert into outbox (evento_id, tipo, payload, ocurrido_en, clave_idempotencia)
       values ($1, $2, $3, $4, $5)
       on conflict (evento_id) do nothing`,
      [
        evento.eventoId,
        evento.nombre(),
        JSON.stringify(evento),
        evento.ocurridoEn,
        evento.claveIdempotencia,
      ],
    );
  }
}

export class RelayDeOutbox {
  private temporizador: NodeJS.Timeout | undefined;

  constructor(
    private readonly db: Consultable,
    private readonly intervaloMs = 5000,
  ) {}

  iniciar(): void {
    this.temporizador = setInterval(() => {
      void this.despachar();
    }, this.intervaloMs);
  }

  detener(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
  }

  async despachar(): Promise<number> {
    const { rows } = await this.db.query(
      `update outbox set publicado_en = now()
       where evento_id in (
         select evento_id from outbox where publicado_en is null order by ocurrido_en limit 50 for update skip locked
       )
       returning evento_id, tipo`,
    );
    if (rows.length > 0) {
      console.log(`outbox: ${rows.length} evento(s) marcados como publicados`);
    }
    return rows.length;
  }
}
