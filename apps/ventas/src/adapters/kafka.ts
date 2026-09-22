import { Kafka, logLevel, type Consumer, type Producer } from "kafkajs";

import { lagConsumidor, eventosPublicados, eventosConsumidos, eventosEnDlq } from "../observability/metrics.js";
import type { Consultable } from "../db/pool.js";

/**
 * Integración con Apache Kafka (AD-002). En producción es Amazon MSK; aquí es Kafka en
 * contenedor. El relay del outbox publica los eventos ya durables al topic versionado
 * `ventas.v1.eventos`, particionado por `venta_id`, con `event_id` como clave de
 * idempotencia. Un consumidor idempotente los procesa (proyección/auditoría) con reintentos
 * acotados y cola de no procesables (DLQ). Entrega "al menos una vez".
 */
export const TOPIC_EVENTOS = "ventas.v1.eventos";
export const TOPIC_DLQ = "ventas.v1.dlq";
const GRUPO_CONSUMIDOR = "ventas-proyecciones";

export function crearKafka(brokers: string): Kafka {
  return new Kafka({
    clientId: "ticketright-ventas",
    brokers: brokers.split(","),
    logLevel: logLevel.NOTHING,
    retry: { retries: 5, initialRetryTime: 300 },
  });
}

/**
 * Relay del outbox hacia Kafka. Lee filas no publicadas de la tabla `outbox` (que se
 * escribió en la misma transacción del estado de negocio) y las publica a Kafka; solo
 * entonces marca `publicado_en`. Si la publicación falla, se reintenta en el siguiente tic
 * (el outbox es durable). Reemplaza al relay que solo marcaba la tabla como publicada.
 */
export class RelayDeOutboxKafka {
  private productor: Producer;
  private temporizador: NodeJS.Timeout | undefined;
  private conectado = false;

  constructor(
    private readonly db: Consultable,
    kafka: Kafka,
    private readonly intervaloMs = 2000,
  ) {
    this.productor = kafka.producer({ idempotent: true, maxInFlightRequests: 1 });
  }

  async iniciar(): Promise<void> {
    await this.productor.connect();
    this.conectado = true;
    this.temporizador = setInterval(() => {
      this.despachar().catch((error) =>
        console.error("relay outbox→kafka: fallo (se reintenta)", error?.message ?? error),
      );
    }, this.intervaloMs);
  }

  async detener(): Promise<void> {
    if (this.temporizador) clearInterval(this.temporizador);
    if (this.conectado) await this.productor.disconnect();
  }

  async despachar(): Promise<number> {
    // Toma un lote de eventos aún no publicados, en orden de ocurrencia.
    const { rows } = await this.db.query(
      `select evento_id, tipo, payload, ocurrido_en, clave_idempotencia
       from outbox where publicado_en is null order by ocurrido_en limit 100`,
    );
    if (rows.length === 0) return 0;
    for (const fila of rows) {
      const payload = typeof fila.payload === "string" ? fila.payload : JSON.stringify(fila.payload);
      const ventaId = extraerVentaId(fila.payload);
      await this.productor.send({
        topic: TOPIC_EVENTOS,
        messages: [
          {
            key: ventaId, // partición por venta_id: conserva el orden por compra
            value: payload,
            headers: {
              event_id: String(fila.evento_id),
              tipo: String(fila.tipo),
              clave_idempotencia: String(fila.clave_idempotencia ?? ""),
            },
          },
        ],
      });
      await this.db.query("update outbox set publicado_en = now() where evento_id = $1", [fila.evento_id]);
      eventosPublicados.inc({ tipo: String(fila.tipo) });
    }
    return rows.length;
  }
}

/**
 * Consumidor idempotente de los eventos de venta. Materializa una proyección de auditoría
 * (tabla `eventos_consumidos`) que además sirve de guarda de idempotencia: un `event_id` ya
 * visto no se procesa dos veces. Tras reintentos fallidos, el evento va a la DLQ.
 */
export class ConsumidorDeEventos {
  private consumidor: Consumer;
  private productorDlq: Producer;
  private corriendo = false;

  constructor(
    private readonly db: Consultable,
    private readonly kafka: Kafka,
  ) {
    this.consumidor = kafka.consumer({ groupId: GRUPO_CONSUMIDOR });
    this.productorDlq = kafka.producer();
  }

  async iniciar(): Promise<void> {
    await this.db.query(
      `create table if not exists eventos_consumidos (
         event_id uuid primary key,
         tipo text not null,
         consumido_en timestamptz not null default now()
       )`,
    );
    // Crear los topics antes de suscribir para evitar UNKNOWN_TOPIC_OR_PARTITION.
    const admin = this.kafka.admin();
    await admin.connect();
    await admin.createTopics({
      waitForLeaders: true,
      topics: [
        { topic: TOPIC_EVENTOS, numPartitions: 3 },
        { topic: TOPIC_DLQ, numPartitions: 1 },
      ],
    });
    await admin.disconnect();
    await this.consumidor.connect();
    await this.productorDlq.connect();
    await this.consumidor.subscribe({ topic: TOPIC_EVENTOS, fromBeginning: true });
    this.corriendo = true;
    await this.consumidor.run({
      eachMessage: async ({ message }) => {
        const eventId = message.headers?.event_id?.toString() ?? "";
        const tipo = message.headers?.tipo?.toString() ?? "desconocido";
        try {
          // Idempotencia: si ya se consumió este event_id, no se reprocesa.
          const insertado = await this.db.query(
            `insert into eventos_consumidos (event_id, tipo) values ($1, $2)
             on conflict (event_id) do nothing returning event_id`,
            [eventId, tipo],
          );
          if (insertado.rows.length > 0) {
            eventosConsumidos.inc({ tipo });
          }
        } catch (error) {
          // Tras el fallo, el evento va a la DLQ con evidencia para reproceso controlado.
          await this.productorDlq.send({
            topic: TOPIC_DLQ,
            messages: [{ key: eventId, value: message.value, headers: message.headers ?? {} }],
          });
          eventosEnDlq.inc({ tipo });
          console.error("consumidor: evento enviado a DLQ", eventId, error);
        }
      },
    });
  }

  /** Publica el lag del grupo consumidor como métrica (señal de escalado de KEDA, AD-006). */
  async publicarLag(): Promise<void> {
    if (!this.corriendo) return;
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      const offsets = await admin.fetchTopicOffsets(TOPIC_EVENTOS);
      const grupo = await admin.fetchOffsets({ groupId: GRUPO_CONSUMIDOR, topics: [TOPIC_EVENTOS] });
      let lag = 0;
      const porParticion = new Map(
        grupo[0]?.partitions.map((p) => [p.partition, Number(p.offset)]) ?? [],
      );
      for (const p of offsets) {
        const consumido = porParticion.get(p.partition) ?? 0;
        const fin = Number(p.offset);
        lag += Math.max(0, fin - (consumido < 0 ? 0 : consumido));
      }
      lagConsumidor.set({ grupo: GRUPO_CONSUMIDOR }, lag);
      await admin.disconnect();
    } catch {
      /* la telemetría no debe tumbar la app */
    }
  }

  async detener(): Promise<void> {
    if (this.corriendo) {
      await this.consumidor.disconnect();
      await this.productorDlq.disconnect();
    }
  }
}

/** Extrae el venta_id/agregado del payload para particionar; cae a event_id si no hay. */
function extraerVentaId(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    return String(p.ventaId ?? p.pagoId ?? p.reservaId ?? p.compraId ?? p.eventoId ?? "sin-clave");
  }
  return "sin-clave";
}
