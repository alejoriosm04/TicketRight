# ADP-003 — SAGA orquestada para reserva, pago y emisión

**Fecha:** 2026-09-14 · **Estado:** 🟣 Antecedente consolidado en
[AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md)
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** integración

> **Decisión en palabras simples:** una compra no es una sola transacción porque la
> pasarela está fuera de TicketRight. Un orquestador recordará en qué paso va cada venta y
> decidirá si continúa, reintenta o compensa.

## 1. Decisión arquitectónica

El flujo crítico `reserva → pago → emisión` se implementará como una **SAGA orquestada**:

1. El orquestador solicita una reserva durable al núcleo de inventario.
2. Si la reserva existe, crea la orden y solicita el pago de forma asíncrona con una clave
   de idempotencia.
3. Al recibir la respuesta o webhook, registra el resultado antes de ordenar el siguiente
   paso.
4. Si el pago fue confirmado, ordena emitir la boleta. Una falla de emisión se reintenta;
   no libera el inventario como si el pago nunca hubiera ocurrido.
5. Si el pago fue rechazado o la reserva vence antes de una confirmación, ordena liberar el
   inventario.
6. Si existe cobro confirmado y la boleta no puede emitirse dentro del límite de A-1, pasa a
   conciliación y ejecuta la compensación aprobada por el negocio —por ejemplo, devolución y
   cancelación— dejando trazabilidad completa.

El orquestador conserva el estado de la SAGA; un log de eventos conserva los hechos y
permite reanudar consumidores. Notificaciones, analítica y actualización de proyecciones sí
pueden reaccionar por **coreografía**, porque su falla no decide dinero ni inventario.

La publicación de eventos usará **outbox transaccional** para que el cambio de estado y el
evento se confirmen juntos. La entrega será al menos una vez y todos los consumidores serán
idempotentes.

## 2. Identificador único

ADP-003

## 3. Problema o asunto

PostgreSQL puede confirmar una reserva, pero no puede incluir a una pasarela externa dentro
de la misma transacción local. La respuesta del tercero puede tardar, perderse o llegar dos
veces. Si cada servicio reacciona sin un dueño del proceso, será difícil responder una
pregunta básica de negocio: “¿este fan pagó y qué falta para entregarle la boleta?”.

Una cadena síncrona es fácil de seguir, pero propaga la lentitud del tercero. Una coreografía
pura desacopla, pero distribuye el conocimiento del flujo entre muchos consumidores. El
negocio necesita aislamiento de fallos sin perder control sobre una operación monetaria.

La decisión responde principalmente a:

- **A-1:** cero discrepancias abiertas al cierre y resolución automática en máximo 15
  minutos.
- **A-5:** liberar una reserva no pagada en máximo 10 minutos.
- **A-6:** proteger pagos en curso durante saturación.
- **A-8:** reconstruir reserva, respuesta de pasarela, emisión y sus tiempos.

## 4. Supuestos

- `[S]` La pasarela puede responder tarde o duplicar una confirmación. Es el escenario de
  prueba del proyecto; su frecuencia real no está medida.
- `[S]` La pasarela seleccionada soportará webhooks autenticados y claves de idempotencia.
- `[V]` El estilo event-driven favorece escalabilidad, tolerancia a fallos y rendimiento,
  pero tiene baja simplicidad y mayor costo. Fuente: [clase 3-4, §12](../../curso/clase-03-04.md#12-estilo-event-driven-basado-en-eventos).
- `[V]` El material de fundamentos reconoce la SAGA con compensación como mecanismo para
  preservar atributos dentro de un margen conocido. Fuente:
  [`fundamentos-arquitectura.md`](../../curso/fundamentos-arquitectura.md#qué-es-y-qué-no-es-un-principio).
- `[S]` El equipo podrá operar un orquestador y un log de eventos sin exceder el plazo.
- `[S]` La compensación final ante cobro sin emisión debe ser aprobada por negocio y cumplir
  las reglas de devolución.

## 5. Alternativas

| # | Alternativa | A favor | En contra |
|---|---|---|---|
| 1 | **Transacción síncrona de extremo a extremo** | Flujo lineal y respuesta inmediata cuando todo funciona | No existe una transacción ACID con la pasarela; retiene conexiones y deja resultados ambiguos ante timeout |
| 2 | **Transacción distribuida de dos fases** | Busca una confirmación única entre participantes | La pasarela no participa en el protocolo y se aumenta el acoplamiento; no es una alternativa aplicable al tercero real |
| 3 | **SAGA coreografiada:** cada servicio reacciona al evento anterior | Menor control central y alta autonomía de consumidores | La lógica del proceso y de compensación queda repartida; es más difícil saber qué paso falta y evitar ciclos de eventos |
| 4 | **SAGA orquestada para el flujo crítico y coreografía para efectos secundarios** | Un dueño explícito decide reintentos y compensaciones; los consumidores no críticos siguen desacoplados | El orquestador puede concentrar lógica y debe replicarse; agrega estados, timeouts y operación |

## 6. Decisión

Se propone la **alternativa 4**.

La SAGA no garantiza que todos los pasos ocurran al mismo tiempo. Garantiza que cada venta
tenga un estado conocido y un camino definido para completarse o compensarse. La elección
concreta de Kafka, RabbitMQ o un servicio administrado se decidirá después de verificar
reproducción, orden, costo y capacidad del equipo.

## 7. Justificación

| Necesidad del negocio | Respuesta de la decisión |
|---|---|
| Cobro confirmado sin boleta | El orquestador conserva el caso abierto, reintenta emisión y activa conciliación antes de compensar |
| Respuesta duplicada | La clave de idempotencia y el estado de la SAGA evitan repetir el cobro o la emisión |
| Reserva vencida sin pago | Una orden explícita libera el inventario y deja evidencia del motivo |
| Servicio de notificaciones caído | La venta termina; el consumidor retoma el evento después sin afectar dinero ni inventario |
| Auditoría y reclamos | Cada transición queda fechada y correlacionada con la misma venta |

**Qué se sacrifica:**

- El fan puede ver temporalmente “pago en proceso” o “emisión pendiente”.
- El equipo debe diseñar reintentos, timeouts, idempotencia y compensaciones.
- El orquestador requiere alta disponibilidad y puede convertirse en un servicio demasiado
  grande si absorbe reglas que pertenecen al dominio.
- Depurar una SAGA requiere trazas distribuidas y una vista clara de su estado.

## 8. Implicaciones

- Estados mínimos: `reservada`, `pago_pendiente`, `pagada`, `emision_pendiente`, `emitida`,
  `compensacion_pendiente`, `compensada` y `fallida`.
- No se liberará una silla solo porque expiró una llave de Redis; primero se consultará el
  estado durable de reserva y pago.
- Los webhooks se autenticarán y podrán llegar repetidos o fuera de orden.
- Cada mensaje tendrá `event_id`, `venta_id`, versión, fecha, causación y correlación.
- Habrá reintentos limitados, circuit breaker y almacenamiento de eventos no procesables.
- La observabilidad medirá ventas por estado, edad de la discrepancia más antigua y tiempo
  completo de la SAGA.
- **Deuda asumida:** estados intermedios, compensaciones y operación del orquestador.
- **Costo de reversión:** alto una vez que pago y emisión dependan de sus contratos.
- **Revisar si:** la prueba no cierra discrepancias en 15 minutos, el orquestador concentra
  demasiada lógica o un flujo más simple satisface el alcance.

---

**Fuentes de clase:** [event-driven](../../curso/clase-03-04.md#12-estilo-event-driven-basado-en-eventos) ·
[ejemplo de pagos orientados a eventos](../../curso/clase-03-04.md#17-ejercicios-prácticos) ·
[SAGA como mecanismo de compensación](../../curso/fundamentos-arquitectura.md#qué-es-y-qué-no-es-un-principio) ·
[mensajería Kafka frente a RabbitMQ](../../curso/mensajeria-pubsub.md).

**Fuentes del negocio:** [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[dependencias](../01-caso-de-negocio/caso-de-negocio-corporativo.md#14-dependencias-principales) ·
[trazabilidad](../01-caso-de-negocio/caso-de-negocio.md#6-trazabilidad).
