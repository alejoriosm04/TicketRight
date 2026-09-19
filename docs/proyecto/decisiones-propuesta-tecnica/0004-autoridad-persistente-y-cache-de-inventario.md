# ADP-004 — CQRS con PostgreSQL como autoridad y proyecciones de lectura

**Fecha:** 2026-09-14 · **Estado:** 🟣 Antecedente consolidado en
[AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md)
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** datos

> **Decisión en palabras simples:** PostgreSQL responde “quién tiene la boleta”; Redis y
> OpenSearch responden rápido “qué parece disponible” y “qué eventos puedo buscar”. Si las
> respuestas difieren, manda PostgreSQL.

## 1. Decisión arquitectónica

Se propone aplicar **CQRS** separando el modelo que cambia el negocio del modelo que sirve
consultas:

### Modelo de comandos — fuente de verdad

PostgreSQL almacenará eventos, localidades, sillas, reservas, órdenes, pagos, boletas y
titularidad.

- Para una **silla numerada**, una restricción impedirá más de una reserva activa sobre la
  misma combinación de evento y silla.
- Para una **localidad general**, una operación atómica impedirá que la suma de cupos
  vendidos y reservados supere el aforo autorizado.
- Cada reserva tendrá `expires_at` y un estado durable. El pago solo empezará después de
  confirmar esta reserva.
- La estrategia concreta de concurrencia —restricción única, bloqueo de fila, control
  optimista o aislamiento serializable— se elegirá mediante prueba de carga.

### Modelo de consultas — proyecciones reconstruibles

- **Redis**, como parte de la zona Space-Based, conservará estado de fila, tokens,
  disponibilidad aproximada y, si las pruebas lo justifican, un bloqueo breve previo a
  PostgreSQL. Bitmaps pueden representar de forma compacta una fila de sillas, pero no
  transferir propiedad ni emitir una boleta.
- **OpenSearch** indexará catálogo, artistas, ciudades y eventos. No decidirá inventario.
- **CDC u outbox** publicará cambios confirmados para actualizar Redis y OpenSearch.

### Limpieza de reservas

La reserva se trata como un **arrendamiento temporal** (*lease*), no como un simple lock de
Redis. Un worker consulta `expires_at` en PostgreSQL y libera reservas vencidas cuyo pago no
esté confirmado. Una notificación TTL de Redis puede despertarlo antes, pero nunca será la
única garantía de liberación.

## 2. Identificador único

ADP-004

## 3. Problema o asunto

Durante el pico, miles de personas consultan mapas y disponibilidad. Llevar cada lectura a
la misma base que confirma reservas puede quitar capacidad a las operaciones que protegen
dinero y aforo. Sin embargo, convertir Redis en la autoridad introduce un riesgo mayor: una
expiración perdida, un failover o una divergencia con PostgreSQL podría liberar una silla
pagada o mantener bloqueado inventario vendible.

CQRS descarga las lecturas, pero acepta que las proyecciones se actualicen después. El
trade-off es rendimiento frente a precisión inmediata de la pantalla.

## 4. Supuestos

- `[V]` A-2 exige cero boletas sobre el aforo y A-3 cero titulares válidos simultáneos.
  Fuente: [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md).
- `[V]` El material de clase presenta CQRS como separación entre lectura optimizada y
  escritura segura. Fuente: [clase 3-4, §3](../../curso/clase-03-04.md#3-patrones-de-arquitectura).
- `[S]` Redis y OpenSearch reducirán suficiente carga de PostgreSQL para justificar su costo
  y complejidad. Debe medirse.
- `[S]` Un contador atómico por localidad general soportará la carga. Los lotes de AD-003
  oficial solo se incorporarán si la prueba demuestra contención.
- `[S]` La demora de las proyecciones será aceptable para el fan si la reserva vuelve a
  validar el inventario y explica claramente un rechazo.
- `[V]` Las notificaciones de Redis usan Pub/Sub y pueden perderse si el consumidor está
  desconectado. Fuente: [documentación oficial de Redis](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/).
- `[V]` PostgreSQL puede abortar transacciones serializables y exige repetir la transacción
  completa. Fuente: [documentación oficial de PostgreSQL](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html).

## 5. Alternativas

| # | Alternativa | A favor | En contra |
|---|---|---|---|
| 1 | **Un solo modelo en PostgreSQL para comandos y consultas** | Una fuente, datos actuales y menor complejidad | Búsquedas, mapas y polling compiten con reservas y pagos durante el pico |
| 2 | **Redis como autoridad del inventario durante la venta** | Operaciones rápidas y estructuras compactas en memoria | Durabilidad, failover, expiraciones y sincronización pasan a formar parte del invariante legal |
| 3 | **CQRS: PostgreSQL como autoridad; Redis y OpenSearch como proyecciones** | Aísla lecturas, conserva verdad durable y permite reconstruir cachés | Duplica modelos, acepta lecturas atrasadas y exige reconciliación |
| 4 | **Base distribuida fuertemente consistente como única autoridad** | Puede escalar escrituras sin modelos duplicados para inventario | Mayor costo, tecnología nueva para el equipo y complejidad no justificada por unas cinco ventas por segundo estimadas |

## 6. Decisión

Se propone la **alternativa 3**. Es la frontera de datos de la arquitectura híbrida:
Space-Based atiende lecturas y estado temporal; PostgreSQL conserva la decisión durable.

No se propone *sharding* inicial de PostgreSQL. Particionar eventos por `evento_id` o usar
Redis Cluster no convierte la base transaccional en fragmentada. Si una prueba futura
demuestra que PostgreSQL es el cuello de botella, se escribirá una nueva decisión con la
clave de partición, la estrategia de rebalanceo y sus consecuencias.

## 7. Justificación

| Necesidad del negocio | Respuesta de la decisión |
|---|---|
| No exceder el aforo | Solo una transacción confirmada por PostgreSQL cambia inventario válido |
| Evitar dos dueños de una silla | Restricción de unicidad y estado durable de la reserva |
| Liberar en máximo 10 minutos | `expires_at` y un worker durable funcionan aunque se pierda la señal de Redis |
| Soportar consultas masivas | Redis y OpenSearch atienden lecturas sin bloquear el modelo de comandos |
| Reconstruir una venta | Los cambios confirmados alimentan eventos y proyecciones reproducibles |

El curso presenta CQRS como un patrón para optimizar consultas sin debilitar la escritura.
También muestra space-based como fuerte en rendimiento y concurrencia, pero con el mayor
costo. La decisión toma la táctica útil —estado distribuido en memoria— sin entregar a esa
capa la autoridad sobre el aforo y el dinero.

**Qué se sacrifica:**

- Una silla puede aparecer libre en la proyección y ser rechazada al reservar.
- Redis, OpenSearch y el proceso de proyección agregan costo y operación.
- Se necesitan reconciliación, invalidación y una forma de reconstruir cada proyección.
- Una transacción serializable o un bloqueo puede abortar y requerir reintentos.

## 8. Implicaciones

- El contrato de consulta indicará que la disponibilidad es orientativa; el comando de
  reserva entrega la respuesta definitiva.
- Ningún pago comenzará con una reserva existente solo en Redis.
- La expiración será una transición de estado idempotente, no el borrado silencioso de una
  llave.
- CDC o outbox fluirá en una sola dirección: del modelo de comandos a las proyecciones.
- Redis y OpenSearch se podrán reconstruir sin modificar PostgreSQL.
- Las pruebas cubrirán pérdida de Redis, proyección atrasada, expiración perdida, doble
  reserva, aborto serializable y recuperación completa.
- **Deuda asumida:** datos duplicados y consistencia eventual de consultas.
- **Costo de reversión:** medio mientras las proyecciones sean descartables; alto si reciben
  reglas exclusivas del negocio.
- **Revisar si:** PostgreSQL solo cumple A-6 y A-7, el retraso de proyección perjudica la
  conversión o el contador general demuestra contención y exige lotes.

---

**Fuentes de clase:** [CQRS](../../curso/clase-03-04.md#3-patrones-de-arquitectura) ·
[space-based](../../curso/clase-03-04.md#14-estilo-space-based-architecture) ·
[atributos y tácticas](../../curso/fundamentos-arquitectura.md#5-atributos-de-calidad-y-tácticas) ·
[trade-offs](../../curso/fundamentos-arquitectura.md#3-trade-offs).

**Fuentes del negocio:** [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[aforo verificado](../01-caso-de-negocio/validaciones.md#aforo-y-evento-masivo) ·
[alcance](../01-caso-de-negocio/alcance.md).

**Fuentes técnicas:** [notificaciones de Redis](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/) ·
[fallos de serialización en PostgreSQL](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html).
