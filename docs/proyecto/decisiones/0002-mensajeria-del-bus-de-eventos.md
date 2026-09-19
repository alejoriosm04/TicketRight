# AD-002 — SAGA orquestada con eventos durables para pago y emisión

**Fecha:** 2026-09-16 · **Estado:** ✅ Aceptado
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** integración
**Relacionados:** [AD-005](0005-estilo-de-arquitectura.md) ·
[AD-003](0003-consistencia-por-tipo-de-inventario.md) ·
[AD-004](0004-datos-personales-almacenamiento-y-acceso.md)

> **Decisión en palabras simples:** una compra no puede ser una sola transacción porque la
> pasarela está fuera de TicketRight. Un coordinador durable recordará en qué paso va cada
> venta y decidirá si continúa, reintenta o compensa; Kafka conservará y distribuirá los
> hechos para que una falla no haga olvidar el trabajo.

## 1. Decisión arquitectónica

El proceso `reserva → pago → emisión → notificación` se implementará como una **SAGA
orquestada**. El orquestador formará parte del servicio de ventas en la primera versión y
guardará su estado en PostgreSQL; no se incorporará inicialmente una plataforma adicional
como Temporal o AWS Step Functions. Esta elección reduce infraestructura sin distribuir la
lógica monetaria entre consumidores difíciles de seguir.

El flujo será:

1. El orquestador solicita al núcleo la reserva durable definida en
   [AD-003](0003-consistencia-por-tipo-de-inventario.md).
2. Confirmada la reserva, crea la orden y publica `PagoSolicitado` con una clave de
   idempotencia. La conexión web responde “pago en proceso”; no permanece abierta esperando
   todos los pasos.
3. Un worker llama a la pasarela. La respuesta o webhook se autentica y se registra antes de
   ordenar la transición siguiente. Mensajes repetidos producen el mismo resultado.
4. Con `PagoConfirmado`, el orquestador ordena emitir la boleta. Si la emisión falla, se
   reintenta y se escala a conciliación; **no se libera una reserva como si el pago nunca
   hubiera existido**.
5. Con pago rechazado o reserva vencida sin confirmación, ejecuta la compensación de liberar
   inventario.
6. Si existe dinero confirmado sin boleta al acercarse al límite de 15 minutos, activa
   conciliación y la compensación aprobada por el negocio —por ejemplo, devolución más
   cancelación— dejando evidencia completa.

La integración usará:

- **Outbox transaccional en PostgreSQL:** el estado de negocio y el evento se confirman en
  la misma transacción local. Un relay o CDC publica después el outbox.
- **Apache Kafka o servicio compatible administrado:** distribuye eventos con partición por
  `venta_id` o `orden_id` para conservar el orden relevante de cada compra y permitir
  relectura durante la retención operativa.
- **Entrega al menos una vez:** no se prometerá “exactamente una vez” de extremo a extremo.
  Productores y consumidores usarán `event_id`, claves de idempotencia y transiciones
  condicionales.
- **DLQ o almacén de eventos no procesables:** después de reintentos acotados, un mensaje
  queda visible para diagnóstico y reproceso controlado.
- **Coreografía solo para efectos secundarios:** notificaciones, analítica y proyecciones
  reaccionarán a eventos porque su fallo no decide dinero, aforo o titularidad.

Kafka tendrá una retención operativa por definir —`[S]` entre 7 y 30 días—. La historia
completa de cada venta se conservará 24 meses en el modelo durable de ventas y en un archivo de auditoría; no se
pagará retención de 24 meses en el clúster sin comparar el costo.

### Comportamiento según la demanda

La SAGA no se activa únicamente durante un pico: protege la correspondencia dinero–boleta
en **todas** las ventas. Lo que cambia es la capacidad, no la garantía.

- En el perfil **cotidiano**, Ventas, el outbox, el bus y al menos un consumidor de pago y
  conciliación permanecen disponibles con capacidad mínima. Notificaciones, analítica y
  reconstrucción de proyecciones pueden escalar a cero si su tiempo de arranque no amenaza
  el cierre automático de discrepancias en máximo 15 minutos.
- En **preparación**, se levantan y verifican consumidores adicionales, conexiones con la
  pasarela, DLQ, alarmas y capacidad del bus antes de admitir la venta masiva.
- En **pico**, KEDA puede aumentar consumidores donde existan particiones y trabajo útil,
  pero la cantidad nunca superará los límites de la pasarela ni la capacidad del núcleo.
- En **recuperación**, no se reduce el bus ni la SAGA hasta que el *lag* y las ventas en
  estados intermedios estén en cero; cualquier elemento de DLQ debe quedar reprocesado o
  escalado explícitamente a operación.

Así, la zona Event-Driven conserva un tamaño cotidiano económico y crece durante la ventana;
no se reemplaza por una cadena síncrona cuando baja la demanda, porque el riesgo de una
respuesta tardía de la pasarela existe aunque haya un solo comprador.

## 2. Identificador único

AD-002

## 3. Problema o asunto

Una transacción ACID de PostgreSQL no puede incluir a una pasarela externa. El tercero puede
aprobar un cobro y perderse la respuesta, enviar el webhook dos veces, contestar después del
timeout o permanecer indisponible. En cualquiera de esos casos, “falló la petición HTTP” no
significa “falló el pago”. Repetir a ciegas puede cobrar dos veces; liberar el asiento puede
vender una boleta ya pagada; esperar bloquea conexiones durante el pico.

Una cadena totalmente síncrona es fácil de leer, pero acopla la disponibilidad de la venta a
la de todos los participantes. Una coreografía pura desacopla, pero reparte la lógica de
compensación entre servicios y dificulta responder “qué falta para terminar esta venta”. El
sistema necesita aislamiento de fallos **y** un responsable explícito del proceso monetario.

Las fuerzas son:

- **Confiabilidad entre pago y boleta:** discrepancias dinero–boleta en cero al cierre y resolución automática en máximo
  15 minutos.
- **Liberación de reservas abandonadas:** liberar inventario no pagado en máximo diez minutos.
- **Degradación controlada:** completar al menos 99% de los pagos iniciados bajo saturación.
- **Trazabilidad de la venta:** reconstruir reserva, respuesta de pasarela, emisión y sus marcas de tiempo durante
  24 meses.
- **Costo y capacidad del equipo:** mantener el costo de infraestructura en máximo COP $150
  por boleta vendida; Kafka y un motor de flujos separado pueden ser
  técnicamente válidos, pero su costo y operación deben justificarse.

Eventos durables, control de flujo, reintentos, DLQ, observabilidad e idempotencia permiten
aislar pagos e inventario de tareas secundarias. Se añade un coordinador porque dinero e
inventario requieren una secuencia conocida y compensaciones visibles.

## 4. Supuestos

- `[S]` La pasarela soportará claves de idempotencia y webhooks autenticados. Debe verificarse
  antes de contratarla.
- `[S]` La pasarela puede responder tarde, repetido o fuera de orden. Es escenario de prueba;
  su frecuencia real no está medida.
- `[V]` TicketRight depende de una pasarela externa y debe conciliar recaudos. Fuente:
  [caso de negocio, §1.4](../01-caso-de-negocio/caso-de-negocio-corporativo.md#14-dependencias-principales).
- `[S]` Un orquestador implementado dentro del servicio de ventas es suficiente para el flujo
  inicial; Temporal o Step Functions se reevaluarán si crecen la cantidad y duración de
  procesos.
- `[S]` Kafka administrado permite mantener el costo de infraestructura en máximo COP $150
  por boleta vendida. `PENDIENTE: comparar Kafka administrado,
  RabbitMQ administrado y outbox sin broker con la volumetría real.`
- `[S]` El costo mínimo del bus y del consumidor crítico es aceptable fuera de las ventanas
  masivas. Debe incluirse en el costo fijo mensual, no esconderse en el costo del pico.
- `[S]` La compensación definitiva ante cobro sin emisión será aprobada por negocio y
  validada contra las reglas de retracto y devolución.

## 5. Alternativas

Se comparan **consistencia observable, tolerancia al tercero, facilidad de seguimiento,
reproducción, costo y operabilidad**.

| # | Alternativa | A favor | En contra y sacrificio |
|---|---|---|---|
| 1 | **Cadena síncrona reserva–pasarela–emisión** | Flujo lineal, menos infraestructura y respuesta inmediata cuando todo funciona | Retiene recursos, propaga la lentitud y deja un resultado ambiguo ante timeout. No existe rollback ACID sobre la pasarela |
| 2 | **Transacción distribuida de dos fases** | Intenta una confirmación única entre participantes | La pasarela externa no participa en 2PC; aumenta acoplamiento y bloqueos. No es aplicable al sistema real |
| 3 | **SAGA coreografiada con Kafka** | Servicios autónomos y sin coordinador central; buena extensión de consumidores | La secuencia, timeouts y compensaciones quedan repartidos. Es difícil reconstruir qué servicio debía actuar y evitar ciclos de eventos |
| 4 | **SAGA en una plataforma de workflows administrada** | Estado durable, temporizadores, reintentos y visualización incorporados | Nuevo proveedor, costo y curva de aprendizaje para un único flujo crítico; riesgo de acoplamiento tecnológico |
| 5 | **SAGA orquestada dentro de Ventas + outbox + Kafka; coreografía para efectos no críticos** | Un dueño visible del proceso y sus compensaciones; reproducción e independencia para consumidores; evita otra plataforma inicial | El servicio de ventas debe ser altamente disponible y no convertirse en “servicio dios”; exige Kafka, estados, idempotencia y observabilidad |

## 6. Decisión

Adoptaremos la **alternativa 5**.

La coreografía se conservará para proyecciones, notificaciones y analítica. El flujo crítico
será orquestado porque cerrar cualquier discrepancia dinero–boleta en máximo 15 minutos
exige saber exactamente qué transición falta y quién ordena la
compensación. Si el volumen de procesos, temporizadores o reglas supera la capacidad del
orquestador propio, se abrirá un ADR posterior para evaluar Temporal o Step Functions.

Kafka se elige sobre RabbitMQ para los eventos de venta porque la relectura y los múltiples
consumidores independientes aportan a recuperación y auditoría. RabbitMQ sigue siendo una
alternativa válida para comandos de trabajo y TTL, pero usar ambos desde el inicio excedería
la capacidad operativa sin una necesidad demostrada.

## 7. Justificación

| Necesidad | Respuesta de la decisión |
|---|---|
| **Dinero y boleta: cero discrepancias al cierre y resolución en ≤ 15 min** | El orquestador conserva el caso abierto, reintenta la emisión y activa conciliación antes de compensar |
| **Reserva abandonada: liberación en ≤ 10 min** | Un temporizador durable libera solo reservas sin pago confirmado; no depende de una llave Redis |
| **Pagos iniciados: finalización ≥ 99% bajo saturación** | La pasarela y los efectos secundarios no retienen conexiones ni capacidad del inventario |
| **Venta reconstruible durante 24 meses** | Cada transición tiene evento, estado, fecha, correlación y causación; la auditoría conserva 24 meses |
| **Seguridad y privacidad** | Los webhooks se autentican, las repeticiones se rechazan y los eventos usan identificadores opacos sin datos personales |
| **Operabilidad** | La lógica crítica está en un servicio conocido y no en una plataforma adicional; las vistas de estado facilitan soporte |
| **Operación cotidiana** | Mantiene la misma garantía con pocos consumidores; solo las capacidades no críticas pueden bajar a cero |

La decisión no promete atomicidad instantánea entre sistemas que no comparten transacción.
Promete algo verificable: cada venta estará en un estado conocido, podrá reanudarse y tendrá
un camino explícito para terminar o compensarse dentro del límite. Esa formulación reconoce
el trade-off real en vez de ocultarlo con “consistencia eventual”.

**Precio aceptado:** durante algunos segundos o minutos puede existir dinero confirmado con
emisión pendiente. Se acepta ese estado intermedio porque queda visible y se corrige; no se
acepta un estado desconocido ni una compensación silenciosa.

## 8. Implicaciones

### Consecuencias positivas

- Un timeout HTTP deja de ser una decisión sobre el dinero.
- Notificaciones o analítica pueden caer sin revertir una venta válida.
- Los eventos repetidos no duplican cobros, reservas ni boletas si se cumple la idempotencia.
- Soporte puede consultar el estado y la transición pendiente de cada venta.

### Consecuencias negativas, riesgos y deuda asumida

- Aparecen estados intermedios: `reservada`, `pago_pendiente`, `pagada`,
  `emision_pendiente`, `emitida`, `compensacion_pendiente`, `compensada` y `fallida`.
- El orquestador puede crecer demasiado; deberá coordinar, no absorber reglas de cada dominio.
- Kafka, outbox, DLQ y trazas distribuidas aumentan operación y pruebas.
- La retención de Kafka no sustituye la auditoría de 24 meses; se debe operar un archivo
  durable y verificable.
- Se asume deuda en herramientas de reproceso seguro y panel de conciliación.
- Mantener un bus durable para ventas cotidianas tiene un costo base; sustituirlo por un
  flujo síncrono fuera del pico crearía dos comportamientos y duplicaría las pruebas.

### Contratos, seguridad y pruebas

- Todo mensaje tendrá `event_id`, `venta_id`, `tipo`, `version`, `occurred_at`,
  `correlation_id` y `causation_id`; llevará identificadores opacos, no datos personales.
- Los webhooks verificarán firma, fecha y protección contra repetición.
- Los reintentos tendrán *backoff*, máximo y *circuit breaker*; agotarlos enviará el caso a
  DLQ sin perder su estado durable.
- Se probarán webhook duplicado, respuesta tardía, caída después de cobrar, caída antes de
  publicar el evento, emisión indisponible y reproceso de DLQ.
- La observabilidad medirá ventas por estado, edad de la discrepancia más antigua, tiempo de
  SAGA, reintentos, DLQ e incumplimientos de 15 minutos.
- Las pruebas cubrirán el mismo flujo en perfil cotidiano, pico y recuperación para demostrar
  que cambiar la capacidad no cambia la semántica de la venta.

**Costo de reversión:** alto después de que pago, emisión y conciliación dependan de estos
contratos; medio antes de implementar consumidores.
**Revisar si:** quedan discrepancias abiertas al cierre o alguna tarda más de 15 minutos en
resolverse; el orquestador concentra demasiadas reglas; el costo base
de Kafka fuera del pico rompe el modelo financiero; o una plataforma de workflows o un
servicio de eventos administrado reduce incidentes y costo total sin cambiar los contratos.

---

**Fuentes:** [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[dependencias](../01-caso-de-negocio/caso-de-negocio-corporativo.md#14-dependencias-principales) ·
[trazabilidad](../01-caso-de-negocio/caso-de-negocio.md#6-trazabilidad) ·
[rúbrica ADR](../02-modelamiento/rubrica.md#2-adr--architectural-decision-record).
