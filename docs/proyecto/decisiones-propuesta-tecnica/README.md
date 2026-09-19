# ADR de la propuesta tecnológica de alta concurrencia

Esta carpeta conserva el **análisis técnico previo** con el que se exploró la arquitectura,
construido en este orden:

1. necesidades y restricciones del [caso de negocio](../01-caso-de-negocio/caso-de-negocio-corporativo.md);
2. atributos medibles [A-1 a A-9](../01-caso-de-negocio/atributos-de-calidad.md);
3. estilos, patrones y trade-offs explicados en `curso/` y en los originales de
   `curso/material/`; y
4. el planteamiento técnico recibido el 14 de septiembre como guía de implementación, no
   como fuente de requisitos ni como arquitectura ya elegida.

Sus identificadores usan el prefijo **ADP** —*decisión de la propuesta*— para no confundirse
con los ADR oficiales. La información útil ya fue consolidada el 14 de septiembre en
[`../decisiones/`](../decisiones/README.md), que es la fuente vigente para el entregable. Los
ADP permanecen como antecedente y no se suman al máximo de cinco exigido por el profesor.

## Cómo leer esta propuesta

Los cinco ADR siguen los ocho elementos de la [plantilla del
profesor](../decisiones/README.md#formato-los-ocho-elementos-del-profesor) y cubren las cinco
dimensiones que premia la [rúbrica](../02-modelamiento/rubrica.md#2-adr--architectural-decision-record).
Todos están en estado **Propuesta**: describen un diseño posible, no infraestructura ya
construida ni capacidades demostradas.

## Cómo se describía la arquitectura en esta exploración

La denominación usada durante esta exploración fue:

> **Arquitectura híbrida Space-Based y Event-Driven, con servicios de dominio, núcleo
> transaccional y CQRS.**

La formulación oficial vigente quedó más precisa: **“arquitectura híbrida Event-Driven con
Space-Based bajo demanda, núcleo transaccional y CQRS”**. Consulte
[AD-005](../decisiones/0005-estilo-de-arquitectura.md). El ajuste aclara que la operación
cotidiana no mantiene una grilla Space-Based dimensionada para el pico.

Es una descripción, no el nombre de un producto. Sigue la distinción que hace la clase
entre **estilo** —la organización global— y **patrón** —una solución reusable dentro de ese
estilo— ([clase 3-4, §§5-6](../../curso/clase-03-04.md#5-relación-estilo--patrón-style--pattern)).

| Nivel | Qué usamos | Para qué lo usamos |
|---|---|---|
| Estilo Space-Based, aplicado al camino caliente | Estado distribuido en memoria y workers paralelos para fila, tokens y disponibilidad aproximada | Absorber la concurrencia masiva antes de que llegue al núcleo |
| Estilo Event-Driven | Eventos durables para pago, emisión, conciliación y efectos secundarios | Aislar fallos y reanudar trabajo sin mantener bloqueada una solicitud web |
| Servicios de dominio | Componentes de grano grueso para admisión, inventario, venta y emisión | Separar solo lo que necesita escalar o fallar de forma independiente |
| Núcleo transaccional | PostgreSQL como autoridad de inventario, pagos y boletas | Conservar consistencia fuerte donde el negocio no tolera aproximaciones |
| Patrón CQRS | Modelo de comandos en PostgreSQL y proyecciones de consulta en Redis/OpenSearch | Evitar que búsquedas y mapas compitan con reservas y pagos |
| Patrón de admisión | Sala de espera y salida a tasa controlada | Proteger el checkout y hacer auditable la política de fila |
| SAGA orquestada | Reserva → pago → emisión → compensación | Coordinar la venta sin una transacción distribuida con la pasarela |
| Táctica de caché | CDN y Redis | Descargar contenido estático y lecturas frecuentes |
| Táctica de expiración | Reserva durable con `expires_at`; TTL como señal rápida | Liberar inventario sin depender de una sesión o notificación efímera |

Space-Based se aplica **selectivamente**: absorbe la multitud, pero no posee la boleta. El
diseño **no se llamará “arquitectura transaccional fragmentada”** porque PostgreSQL no
está dividido en *shards*. Particionar topics o usar Redis Cluster no equivale a fragmentar
la fuente transaccional. Tampoco se llamará “puramente reactiva”: reservar inventario sigue
siendo un comando síncrono y transaccional.

| ID | Decisión | Dimensión | Estado |
|---|---|---|---|
| ADP-001 | [Arquitectura híbrida Space-Based y Event-Driven](0001-arquitectura-compuesta-para-alta-concurrencia.md) | Estructura | 🟣 Antecedente consolidado en AD-005 |
| ADP-002 | [Protección en el borde y zona Space-Based de admisión](0002-proteccion-y-control-de-admision-en-el-borde.md) | Transversal | 🟣 Antecedente consolidado en AD-004 y AD-006 |
| ADP-003 | [SAGA orquestada para reserva, pago y emisión](0003-procesamiento-asincrono-de-la-venta.md) | Integración | 🟣 Antecedente consolidado en AD-002 |
| ADP-004 | [CQRS con PostgreSQL como autoridad y proyecciones de lectura](0004-autoridad-persistente-y-cache-de-inventario.md) | Datos | 🟣 Antecedente consolidado en AD-003 |
| ADP-005 | [Despliegue multi-zona con escalado programado y reactivo](0005-despliegue-elastico-en-contenedores.md) | Despliegue | 🟣 Antecedente consolidado en AD-006 |

### Cómo se consolidó en los ADR oficiales

| Propuesta | ADR oficial que incorporó el análisis |
|---|---|
| ADP-001 | [AD-005](../decisiones/0005-estilo-de-arquitectura.md): combina Space-Based en el camino caliente, Event-Driven después de la reserva y un núcleo transaccional |
| ADP-002 | [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) incorporó borde, bots y token; [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) incorporó fila y control de admisión |
| ADP-003 | [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md): SAGA orquestada para el flujo crítico y coreografía para efectos secundarios |
| ADP-004 | [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md): reglas por tipo de inventario, PostgreSQL como autoridad y proyecciones CQRS |
| ADP-005 | [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md): precalentamiento, KEDA y escalado multi-zona con límites |

## Trazabilidad con el viaje de una solicitud

| Paso | Componente conceptual | Implementación candidata | ADR |
|---|---|---|---|
| 1 | CDN, firewall, detección de bots, gateway y limitación de tasa | CloudFront, AWS WAF, servicio especializado de bots y API Gateway o Kong | ADP-002 |
| 2 | Zona Space-Based de sala de espera, estado temporal y admisión controlada | Stream de entrada, Redis Cluster y workers paralelos | ADP-002 |
| 3 | Servicios por dominio y contratos internos | Contenedores, Kubernetes, HTTP o gRPC donde una llamada síncrona corta esté justificada | ADP-001 · ADP-005 |
| 4 | Disponibilidad rápida y reserva con vencimiento | Proyección Space-Based en Redis; la reserva durable permanece en PostgreSQL | ADP-004 |
| 5 | Persistencia transaccional y modelos de lectura | PostgreSQL/Aurora, CDC, OpenSearch y Redis | ADP-004 |
| 6 | SAGA de venta y efectos secundarios | Orquestador, log de eventos, workers, webhooks y servicio de notificaciones | ADP-003 |

## Ajustes hechos al planteamiento inicial

- **Kafka no se trata como una cola FIFO global.** Solo conserva orden dentro de una
  partición, como indica su [documentación oficial](https://kafka.apache.org/documentation/).
  La equidad de la fila requiere una secuencia de admisión explícita y reconstruible.
- **Redis no es la fuente legal del inventario.** Acelera consultas y reservas, mientras
  PostgreSQL conserva la reserva durable y la emisión definitiva.
- **Las notificaciones de expiración de Redis no garantizan una liberación.** Usan Pub/Sub,
  que es *fire and forget* según la [documentación de Redis](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/).
  Se usan como señal rápida; un proceso basado en `expires_at` en PostgreSQL asegura la
  recuperación.
- **KEDA no predice.** Su escalador de Kafka reacciona al retraso del consumidor según la
  [documentación oficial](https://keda.sh/docs/latest/scalers/apache-kafka/). Por eso se
  combina con precalentamiento programado antes de la venta.
- **No se adopta una arquitectura políglota por defecto.** Go, Rust, Java o TypeScript se
  elegirán por competencia del equipo y mediciones. Tres personas no deberían operar varios
  lenguajes sin una ganancia demostrada.
- **El estado individual de la fila no se publica como un archivo estático compartido.** La
  CDN puede servir frontend y datos públicos del evento; la posición y el token de cada fan
  requieren una consulta autenticada a Redis o una respuesta privada correctamente firmada
  y no cacheable entre usuarios.
- **El QR dinámico y la sincronización sin conexión no entran en estos ADR.** El alcance del
  proyecto deja el control de acceso en la puerta como una integración externa; la emisión
  solo debe producir una boleta verificable y un contrato para ese sistema.
- Las cifras de millones de solicitudes, 500 usuarios por instancia, cinco solicitudes por
  segundo y tres minutos de token son `[S]` hasta medirlas contra la volumetría oficial del
  proyecto: **30.000 usuarios en 60 segundos contra 5.000 boletas**.

## Fuentes comunes

- [Caso de negocio entregado](../01-caso-de-negocio/caso-de-negocio-corporativo.md)
- [Atributos de calidad A-1 a A-9](../01-caso-de-negocio/atributos-de-calidad.md)
- [Alcance del sistema](../01-caso-de-negocio/alcance.md)
- [Estilos event-driven, microservicios y space-based](../../curso/clase-03-04.md#12-estilo-event-driven-basado-en-eventos)
- [Arquitecturas compuestas — MASA](../../curso/clase-03-04.md#19-arquitecturas-compuestas-masa)
- [Arquitectura de referencia frente a implementación](../../curso/clase-03-04-transcripcion.md#8-arquitectura-de-referencia-vs-arquitectura-de-implementación)

`PENDIENTE: el equipo debe comparar esta propuesta con los ADR oficiales y elegir una sola
línea coherente antes de diligenciar el Excel del profesor.`
