# Patrones utilizados en TicketRight

> Criterio 4 de la [rúbrica del Entregable 3](rubrica.md): identificar los patrones,
> justificarlos, relacionarlos con los atributos de calidad y mostrar la evidencia en el
> código y en la documentación. Insumo de clase:
> [patrones de diseño](../../curso/clase-05-06.md#diapositiva-48--proyecto-integrador-patrones-de-diseño),
> [idempotencia](../../curso/clase-05-06.md#diapositiva-50--qué-es-la-idempotencia),
> [back pressure](../../curso/clase-05-06.md#diapositiva-51--funcionamiento-del-patrón-back-pressure)
> y [circuit breaker](../../curso/clase-05-06.md#diapositiva-52--funcionamiento-del-patrón-circuit-breaker).

Estados: ✅ implementado y probado · 🟡 diseñado, pendiente en los adaptadores · ⚪ no aplica.

## Patrones de arquitectura

| Patrón | Para qué | Dónde está la evidencia | Atributos | Estado |
|---|---|---|---|---|
| **Ports & Adapters (hexagonal)** | Aislar dominio y aplicación de la infraestructura; el dominio no conoce HTTP, PostgreSQL ni Kafka | [`diagrama de clases`](../02-modelamiento/diagrama-de-clases.md#capas-y-patrones) · `packages/sales/src/{domain,application,ports}` · [AD-007](../decisiones/0007-stack-de-implementacion.md) | A-12 · mantenibilidad · testeabilidad | ✅ |
| **Bounded Contexts + Anti-Corruption Layer** | Separar los cuatro contextos del modelo; la emisión cruza por un contrato en vez de compartir el agregado | [`modelo de dominio`](../02-modelamiento/modelo-de-dominio.md#contextos-acotados) · `packages/*` · `packages/shared-kernel/src/ticket-issuance.ts` · [AD-008](../decisiones/0008-boleta-en-derecho-de-asistencia.md) | A-12 · evolución independiente | ✅ |
| **SAGA orquestada** | Coordinar reserva → pago → emisión → compensación cuando la pasarela es externa y ambigua | [`OrquestadorDeCompra`](../../../packages/sales/src/application/purchase.ts) · [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) · [diagrama de secuencia](../02-modelamiento/diagrama-de-secuencia.md) | A-1 · resiliencia | ✅ |
| **Outbox transaccional** | Publicar hechos durables en la misma transacción del estado de negocio | [`PublicadorDeEventosOutbox`](../../../apps/ventas/src/adapters/outbox.ts) · [`RelayDeOutboxKafka`](../../../apps/ventas/src/adapters/kafka.ts) · [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) | A-1 · consistencia | ✅ |
| **CQRS** | Separar lecturas de la autoridad transaccional; proyecciones reconstruibles | PostgreSQL (comando) + Redis (fila) + proyección de eventos (`eventos_consumidos`) · [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md) | A-10 · escalabilidad | ✅ |
| **Back pressure / válvula de admisión** | Frenar la entrada antes de ahogar el núcleo transaccional; la fila Space-Based como regulador | [`SalaDeEsperaRedis`](../../../apps/ventas/src/adapters/waiting-room-redis.ts) · [`GestorDePerfiles`](../../../apps/ventas/src/adapters/operational-profiles.ts) · [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) | A-6 · A-9 · resiliencia | ✅ |
| **Space-Based (fila en memoria distribuida)** | Absorber la multitud fuera de PostgreSQL; la proyección de fila en Redis, reconstruible desde el registro durable | [`SalaDeEsperaRedis`](../../../apps/ventas/src/adapters/waiting-room-redis.ts) (llaves `fila:{evento}:{turno}`) · [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) | A-4 · A-9 · escalabilidad | ✅ |
| **Autoescalado por lag (KEDA)** | Escalar consumidores según el trabajo pendiente del bus, no por CPU | [`ScaledObject`](../../../deploy/k8s/40-keda-scaledobject.yaml) con el escalador de Kafka sobre el lag del grupo `ventas-proyecciones` (el mismo que el tablero muestra como `ticketright_consumer_lag`) · [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) | A-6 · escalabilidad | ✅ |

## Patrones de diseño de software

| Patrón | Para qué | Dónde está la evidencia | Atributos | Estado |
|---|---|---|---|---|
| **Unidad de trabajo** | Que cada paso de la SAGA confirme junto o no confirme: el bloqueo de la localidad dura hasta el `COMMIT` y el evento del outbox sale con su estado | Puerto [`UnidadDeTrabajo`](../../../packages/sales/src/ports/services.ts) · adaptador [`BaseTransaccional`](../../../apps/ventas/src/db/connection.ts) · [`concurrencia-aforo.test.ts`](../../../apps/ventas/tests/concurrencia-aforo.test.ts) · [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md) | A-2 · A-1 · consistencia | ✅ (22 sep) |
| **Repository** | Ocultar la persistencia detrás de un puerto por agregado y poder probar el dominio sin base de datos | [`repositories.ts`](../../../packages/sales/src/ports/repositories.ts) · dobles en `packages/sales/tests/doubles/` | testeabilidad · A-12 | ✅ |
| **Idempotencia** | Un webhook repetido produce el mismo resultado: un solo cobro, una sola boleta | [`Pago.registrarConfirmacion`](../../../packages/sales/src/domain/payment.ts) · UT-09 en el [plan de pruebas](../02-modelamiento/plan-de-pruebas.md) | A-1 · confiabilidad | ✅ |
| **Domain Events (Observer)** | Publicar hechos confirmados para que emisión, proyecciones y auditoría reaccionen sin acoplar al emisor | [`events.ts`](../../../packages/sales/src/domain/events.ts) · [`PublicadorDeEventos`](../../../packages/sales/src/ports/services.ts) | desacoplamiento · A-1 | ✅ |
| **Value Objects** | Hacer imposibles los valores inválidos y calcular sin efectos colaterales | [`Dinero` y `Porcentaje`](../../../packages/shared-kernel/src/money.ts) · [`Aforo`](../../../packages/sales/src/domain/inventory.ts) · [`DesglosePrecio`](../../../packages/sales/src/domain/pricing.ts) | corrección · R13 | ✅ |
| **Factory Method** | Única forma de construir un agregado válido; las reglas se verifican al nacer | `Reserva.crear` en [`reservation.ts`](../../../packages/sales/src/domain/reservation.ts) · `Pago.iniciar` · `Discrepancia.abrir` · `Boleta.emitir` | invariantes R1–R14 | ✅ |
| **Domain Service** | Sacar del agregado la política que no le pertenece | [`CalculadoraDePrecio`](../../../packages/sales/src/domain/pricing.ts) · [diagrama de clases](../02-modelamiento/diagrama-de-clases.md#precio-desglose-y-calculadora) | A-12 · R13 | ✅ |
| **Adapter** | Traducir el mundo externo al lenguaje del dominio | [`PasarelaSimulada`](../../../apps/ventas/src/adapters/simulated-gateway.ts) · [`ValidadorJwtDeAdmision`](../../../apps/ventas/src/adapters/jwt-admission.ts) · [`EmisorDeBoletasPostgres`](../../../apps/ventas/src/adapters/postgres/ticket-issuer.ts) | A-4 · A-12 | ✅ |
| **Timeouts acotados** | Que una dependencia caída (PostgreSQL, pasarela) falle rápido y controlado, no cuelgue el servicio | [`crearPool`](../../../apps/ventas/src/db/connection.ts) (`query_timeout`) · verificado en [IF-03](bitacora-de-fallos.md) | A-1 · A-6 · resiliencia | ✅ |
| **JWT firmado / token de admisión** | Autorizar el checkout con un permiso corto, firmado y de un solo uso lógico | [`admission-token.ts`](../../../apps/ventas/src/security/admission-token.ts) · [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) | A-11 · seguridad | ✅ |
| **Rate limiting (token bucket) + detección de bots** | Frenar el abuso en el borde antes de que consuma el núcleo | [`edge-gateway.ts`](../../../apps/ventas/src/security/edge-gateway.ts) · [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) | A-9 · A-11 · seguridad | ✅ |
| **Cifrado de datos personales** | Hacer ilegible la PII en reposo; el resto del sistema usa ids opacos | [`crypto-utils.ts`](../../../apps/ventas/src/security/crypto-utils.ts) (AES-256-GCM, homólogo KMS) · [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) | A-11 · privacidad | ✅ |
| **Circuit breaker** | Evitar fallas en cascada cuando la pasarela está lenta o caída | Reintentos acotados y compensación en el [`OrquestadorDeCompra`](../../../packages/sales/src/application/purchase.ts); el disyuntor completo con umbral de apertura queda como deuda | A-1 · resiliencia | 🟡 |

## Patrones que no aplicamos, y por qué

| Patrón de la clase 5-6 | Por qué no está | Cuándo aplicaría |
|---|---|---|
| **Strangler fig** | TicketRight es un sistema nuevo: no hay monolito que estrangular | Si se migrara un sistema de boletería existente |
| **Branch by abstraction** | Se usa para cambiar una implementación con el sistema en producción; aquí no hay legado | Si se reemplazara la pasarela o el motor de inventario en caliente |
| **Parallel run (ejecución en sombra)** | Requiere dos implementaciones completas para comparar resultados | Para validar un cambio de motor de precios o de inventario |

*Fitness functions:* la [cláusula de coherencia](../../curso/clase-05-06.md#diapositiva-12--fitness-functions-definición)
se materializa en el CI (`npm run typecheck` + `npm test` en cada push) y en las alertas de
observabilidad; es la forma concreta de proteger A-12 entre entregas.

## Cómo defender este catálogo

Para cada patrón de las tablas: qué problema resolvía, qué alternativa simple se descartó y
qué atributo de calidad lo justifica. La fuente son los ADR de
[`../decisiones/`](../decisiones/README.md); el detalle de cada patrón de la clase está en las
diapositivas 47 a 52 de [`clase-05-06.md`](../../curso/clase-05-06.md).
