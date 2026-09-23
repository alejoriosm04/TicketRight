# Estado del repositorio — TicketRight

> Archivo vivo. Quien avance algo, lo actualiza.
> Última actualización: **2026-09-22**. Este archivo registra el estado del **repositorio de
> código** y de la **Entrega 3**. La bitácora del proyecto y del curso hasta la Entrega 2
> está en [`docs/ESTADO.md`](docs/ESTADO.md).

## Dónde vamos

**Semana 3 de 4.** La Entrega 1 (caso de negocio) se entregó el 12 de septiembre y la
Entrega 2 (modelamiento) cerró con sus once entregables de diseño. **Entrega activa:
Entrega 3 — Implementación · Sustentación · Simulación · Defensa**, el **sábado 26 de
septiembre de 2026** (30%).

El diseño ya está hecho: **no hay que rediseñar, hay que implementar lo diseñado y
demostrarlo**. Los diseños que esta entrega convierte en realidad están en
[`docs/proyecto/02-modelamiento/`](docs/proyecto/02-modelamiento/README.md).

## La Entrega 3

La rúbrica completa llegó con las clases 5 y 6
([`rubrica.md`](docs/proyecto/03-implementacion/rubrica.md)); el plan de trabajo está en el
[README de la entrega](docs/proyecto/03-implementacion/README.md):

| # | Criterio | Peso | Estado |
|---|---|---|---|
| 1 | Aplicación funcionando | **40%** | 🟢 App Fastify + PostgreSQL + Redis (fila) + Kafka (bus) + seguridad de borde, corriendo en Codespaces; despliegue k8s/KEDA en `deploy/`. Falta video |
| 2 | Observabilidad | **20%** | 🟢 Plataforma implementada (OTel + Alloy + Prometheus + Tempo + Loki + Grafana); las 14 métricas del diseño instrumentadas, tablero y 4 alertas |
| 3 | Simulación y análisis de fallos | **30%** | 🟢 Los 4 escenarios (IF-01, IF-02, IF-03, IF-05) ejecutados y aprobados; bitácora en [`bitacora-de-fallos.md`](docs/proyecto/03-implementacion/bitacora-de-fallos.md). IF-03 halló y corrigió una debilidad real |
| 4 | Patrones utilizados | **10%** | ✅ Catálogo en [`patrones.md`](docs/proyecto/03-implementacion/patrones.md), con Outbox/CQRS/Space-Based/KEDA/seguridad implementados |
| 5 | Autoevaluación | **+10%** | ⚪ Por escribir al cierre |
| 6 | Coherencia | **-10%** | 🟢 **22 sep: se halló y corrigió sobreventa por falta de transacciones** ([§7 de la auditoría](docs/proyecto/03-implementacion/coherencia-implementacion.md#7-hallazgo-posterior-sobreventa-por-falta-de-transacciones)). Mapeo ADR→implementación en [`fidelidad-arquitectonica.md`](docs/proyecto/03-implementacion/fidelidad-arquitectonica.md); 21 casos, cobertura en CI y diagramas al día. Auditoría de coherencia 22 sep: ver [`coherencia-implementacion.md`](docs/proyecto/03-implementacion/coherencia-implementacion.md) |

La **defensa** se apoya en los ADR: para cada decisión visible en la demo hay que responder
qué atributo de calidad la justifica y qué se sacrificó a cambio
([`docs/proyecto/decisiones/`](docs/proyecto/decisiones/README.md)).

**Ambiente de la demo:** local con **k3d o minikube** (el mínimo es el ambiente local; AWS es
opcional si alcanza el tiempo). Para las corridas se propone **k6 con `ramping-vus`** y, para
dar accesos sin despliegue público, **Tailscale** ([plan por criterios](docs/proyecto/03-implementacion/README.md)).

## Lo que hay que sacar

De los entregables de diseño a la ejecución. **El orden importa**: primero el esqueleto y el
caso de uso principal, y encima de eso pruebas, carga, observabilidad y fallos.

| # | Criterio | Insumo ya escrito | Qué falta |
|---|---|---|---|
| 1 | Aplicación funcionando (40%) | [AD-007](docs/proyecto/decisiones/0007-stack-de-implementacion.md): TypeScript/Node · [arquitectura hexagonal](docs/proyecto/02-modelamiento/diagrama-de-clases.md) · [caso de uso](docs/proyecto/02-modelamiento/diagrama-de-secuencia.md) | 🟢 API Fastify + PostgreSQL + outbox + pasarela simulada + sala de espera en `apps/ventas`; compra completa, webhook repetido y rechazo verificados en local. `PENDIENTE: clúster k3d/minikube y video demo` |
| 2 | Pruebas y coherencia | [Plan de pruebas](docs/proyecto/02-modelamiento/plan-de-pruebas.md): 21 casos UT sobre las reglas R1–R14 | ✅ Los 21 casos escritos y en verde (38 pruebas; cobertura ~77,7% sentencias), más 5 pruebas de integración contra PostgreSQL real (concurrencia sobre el aforo, webhooks simultáneos y turno de un solo uso), que el CI corre con PostgreSQL de servicio. El CI corre `test:coverage` y **anexa el reporte como artefacto** ([`verificacion.yml`](.github/workflows/verificacion.yml)) |
| 3 | Observabilidad (20%) | [Observabilidad](docs/proyecto/02-modelamiento/observabilidad.md): métricas, tableros y alertas | 🟢 Implementada: plataforma completa (OTel + Alloy + Prometheus + Tempo + Loki + Grafana), las 14 métricas del diseño instrumentadas + complementos de ticketera, tablero de 5 secciones y 4 alertas. Ver [`observability/README.md`](observability/README.md). `PENDIENTE: capturas y video` |
| 4 | Simulación de fallos (30%) | [Inyección de fallos](docs/proyecto/02-modelamiento/inyeccion-de-fallos.md): IF-01, IF-02, IF-03 e IF-05 elegidos | 🟢 Los 4 ejecutados y aprobados con el arnés de `chaos/`, y **repetidos el 22 sep** con la métrica de sobreventa real y webhooks simultáneos; bitácora en [`bitacora-de-fallos.md`](docs/proyecto/03-implementacion/bitacora-de-fallos.md). `PENDIENTE: capturas del tablero durante cada fallo para el video` |
| 5 | Carga | [Volumetría](docs/proyecto/02-modelamiento/volumetria.md): nominal, pico, estrés y resistencia; 30.000 usuarios en 60 s contra 5.000 boletas | 🟢 Arnés k6 en [`load/`](load/) y primera campaña local (22 sep): los 4 escenarios con umbrales cumplidos y **0 sobreventa**, a escala 0,05. Ver [`pruebas-de-carga.md`](docs/proyecto/03-implementacion/pruebas-de-carga.md). `PENDIENTE: campaña en Codespaces con Redis y Kafka, estrés ×2 y capturas` |
| 6 | Patrones (10%) | [Patrones utilizados](docs/proyecto/03-implementacion/patrones.md) | Revisar contra la demo y añadir capturas |
| 7 | Prototipo / plataforma web | [Prototipo](docs/proyecto/02-modelamiento/prototipo/index.html): 16 pantallas, tres roles | 🟢 Además del prototipo estático hay una **plataforma web funcional** en `/app` conectada a las APIs (catálogo, fila, reserva, pago, boleta, promotor, operación) |
| 8 | Defensa y autoevaluación | [Los ADR](docs/proyecto/decisiones/README.md) · [tipos de deuda técnica](docs/curso/clase-05-06.md) | Repasar trazabilidad atributo → decisión → sacrificio; escribir la autoevaluación |

## Pendientes y preguntas abiertas

- **Evidencias en Codespaces** (video, capturas de Grafana, alerta, los 4 fallos y la carga con
  Redis y Kafka): paso a paso en
  [`guia-codespaces.md`](docs/proyecto/03-implementacion/guia-codespaces.md).

- `PENDIENTE: la diapositiva 46 trae una nota manuscrita «¿Máximo?»; preguntar al profesor si la nota del entregable tiene tope.`
- `PENDIENTE: formato y duración del video demo; el ambiente será local con k3d o minikube, así que también hay que confirmar si la demo en video y los accesos por Tailscale son suficientes.`
- `PENDIENTE: ratificar los doce umbrales de` [`atributos-de-calidad.md`](docs/proyecto/01-caso-de-negocio/atributos-de-calidad.md).
- `PENDIENTE: la nota y la retroalimentación de la Entrega 1.`
- `PENDIENTE: la nota de la Entrega 2, entregada por Teams el 19 de septiembre.`
- `PENDIENTE: verificar disponibilidad de dominio y marca de «TicketRight».`

## Organización del repositorio

**Incremento 5 — plataforma web funcional (22 de septiembre):** sobre el prototipo se
construyó una plataforma tipo ticketera en `/app` (SPA en
[`prototipo/`](docs/proyecto/02-modelamiento/prototipo/)) conectada a las APIs reales:
catálogo con búsqueda en tiempo real (`/catalogo?q=`), fila (Redis), reserva con temporizador,
pago (SAGA) y emisión de boleta, más las vistas de Promotor y Operación. Se añadió el contexto
de **cuentas de fan** (homólogo de Cognito, AD-004) con registro/ingreso, PII cifrada
(AES-256-GCM), sesión JWT y **rol** (`cliente`/`promotor`/`operacion`) que autoriza las vistas
internas; el catálogo se resembró con ocho eventos de entretenimiento en recintos con
distribución de localidades propia (estadio, arena, coliseo, teatro, festival), en admisión
general. El detalle está en
[`fidelidad-arquitectonica.md`](docs/proyecto/03-implementacion/fidelidad-arquitectonica.md).

El **19 de septiembre de 2026** la documentación del repositorio `aas` se importó a
[`docs/`](docs/README.md) y se publicó como
[wiki](https://github.com/alejoriosm04/TicketRight/wiki). Al importar se recuperó la carpeta
`proyecto/01-caso-de-negocio/ideas/` —las cuatro ideas originales—, que estaba borrada por
accidente y dejaba 25 enlaces rotos; los tres avisos de importación están en
[`docs/README.md`](docs/README.md), [`docs/ESTADO.md`](docs/ESTADO.md) y
[`docs/AGENTS.md`](docs/AGENTS.md).

La **decisión de stack** quedó registrada como
[AD-007](docs/proyecto/decisiones/0007-stack-de-implementacion.md) —TypeScript sobre
Node.js con Vitest, **aceptada el 20 de septiembre de 2026**— y el esqueleto está en
`packages/`: cuatro contextos hexagonales con nombre en inglés —`event-catalog`,
`admission-identity`, `sales` y `entitlements`— más `shared-kernel`, ambiente local en
`docker-compose.yml` y CI en `.github/workflows/`. Sigue el código de los veintiún casos.

La **frontera entre contextos** quedó registrada como
[AD-008](docs/proyecto/decisiones/0008-boleta-en-derecho-de-asistencia.md): `Boleta` vive en
`@ticketright/entitlements` y la emisión viaja por el puerto `EmisorDeBoletas`; `Localidad`,
`Reserva`, `Pago` y `Discrepancia` viven en `@ticketright/sales`. Los veintiún casos del plan
de pruebas están implementados con los cuatro dobles y en verde. Las vistas del diagrama de
clases y del diagrama de secuencia se regeneraron con el puerto `EmisorDeBoletas` y la
anotación de contextos, sin cambiar los 39/37/38 presentados; Archify quedó vendorizada en
`tools/archify/`. `PENDIENTE: anexar el reporte de cobertura al paquete de la Entrega 3.`

El **20 de septiembre** se importó el material de las clases 5 y 6
([`docs/curso/clase-05-06.md`](docs/curso/clase-05-06.md), fuente
[`material/2026-09-18-19-clase-05-06.pdf`](docs/curso/material/2026-09-18-19-clase-05-06.pdf)) y la
rúbrica del Entregable 3 quedó en
[`docs/proyecto/03-implementacion/rubrica.md`](docs/proyecto/03-implementacion/rubrica.md),
con el plan por criterios en el README de la entrega y el catálogo de patrones en
[`patrones.md`](docs/proyecto/03-implementacion/patrones.md).

**Incremento 1 de la aplicación (20 de septiembre):** `apps/ventas` compone Fastify +
PostgreSQL con los repositorios, el outbox transaccional y la pasarela simulada; el guion
`npm run e2e -w @ticketright/ventas` ejecuta la compra completa contra la base real, y los
perfiles `repetida` (idempotencia) y `rechaza` (compensación) quedaron verificados. El puerto
local de PostgreSQL es **5433** para no chocar con otros proyectos del equipo.

**Incremento 2 — observabilidad y sala de espera (21 de septiembre):** se implementó la
plataforma de observabilidad completa del diseño —OpenTelemetry, Grafana Alloy (puerta OTLP),
Prometheus, Tempo, Loki y Grafana— con las tres señales correlacionadas por `trace_id`. La
app expone las **14 métricas del catálogo de** [`observabilidad.md`](docs/proyecto/02-modelamiento/observabilidad.md)
más complementos de ticketera (embudo, aforo por tribuna, reparto del dinero, HTTP RED,
conexiones de PostgreSQL). Se añadió una **sala de espera** de demostración (fila de admisión,
AD-006) con endpoints `/fila/entrar` y `/fila/:turnoId`. El tablero de Grafana
tiene cinco secciones y hay cuatro alertas ligadas a atributos. Detalle y catálogo en
[`observability/README.md`](observability/README.md). Las métricas añadidas sobre el diseño
quedan documentadas ahí como complemento, sin sustituir ninguna del entregable.

**Incremento 3 — inyección de fallos (21 de septiembre):** se ejecutaron los cuatro
experimentos del catálogo (IF-01 pasarela repetida, IF-02 reinicio del coordinador, IF-03
PostgreSQL no disponible, IF-05 saturación de CPU) con un arnés en [`chaos/`](chaos/) y
mecanismos equivalentes a Chaos Mesh sobre `docker compose`, midiendo con la observabilidad ya
montada. Los cuatro quedaron **aprobados**; la bitácora está en
[`bitacora-de-fallos.md`](docs/proyecto/03-implementacion/bitacora-de-fallos.md). IF-03 reveló
una debilidad real —el servicio se colgaba y podía caerse ante una base congelada— que se
corrigió con timeouts acotados en el pool (`query_timeout`), un relay de outbox tolerante a
fallos y una red de seguridad `unhandledRejection`, y se verificó repitiendo el experimento.

**Incremento 4 — fidelidad a la arquitectura (22 de septiembre):** para acercar la
implementación a los ADR y a la arquitectura de referencia/implementación se conectaron las
dependencias reales y los homólogos locales de los servicios AWS: **Redis** para la fila
Space-Based (AD-006, llaves `fila:{evento}:{turno}`), **Kafka** para el bus de eventos
(AD-002, relay de outbox → `ventas.v1.eventos`, consumidor idempotente con DLQ), el **borde de
seguridad** (AD-004: token bucket + detección de bots, JWT de admisión firmado, cifrado
AES-GCM de PII, auditoría append-only), el **portal estático** en `/portal` (homólogo
S3+CloudFront) y el **gestor de perfiles operativos** (homólogo EventBridge Scheduler). El
despliegue de fidelidad vive en [`deploy/`](deploy/README.md): **minikube + KEDA** (escala por
lag de Kafka) y un devcontainer para **GitHub Codespaces**, donde el arranque completo quedó
verificado (Redis, Kafka, observabilidad, recorrido con JWT firmado y tráfico visible en
Grafana). El mapeo completo ADR→implementación y lo que quedó fuera de alcance está en
[`fidelidad-arquitectonica.md`](docs/proyecto/03-implementacion/fidelidad-arquitectonica.md).
El piloto se corre en Codespaces porque las máquinas locales del equipo no tienen RAM
suficiente para todo el stack.

**Incremento 6 — integridad transaccional (22 de septiembre):** al preparar las pruebas de
carga se encontró que la aplicación **no abría transacciones**: el `FOR UPDATE` de la
localidad se soltaba al terminar la sentencia y cien reservas simultáneas sobre cincuenta
cupos se aceptaban todas; cinco webhooks simultáneos de un pago emitían siete boletas. Nada
lo había detectado: UT-04 corre en memoria, IF-01 reenvía webhooks en serie y la métrica
`ticketright_oversell_total` nunca se incrementaba. Se corrigió con una **unidad de trabajo**
por cada `[COMMIT]` del diagrama de secuencia (puerto `UnidadDeTrabajo`, adaptador
`BaseTransaccional`), bloqueo de pagos y reservas, admisión solo con el JWT de la fila (el
token `turno:<uuid>` inventado ya no compra), **turno de un solo uso y ligado al fan** y la
métrica de sobreventa calculada desde las tablas. Lo verifican cinco pruebas de integración
contra PostgreSQL en el CI. Con el arnés de `chaos/` al día se **repitieron los cuatro
experimentos**, todos aprobados; IF-05 no corría desde que llegó el borde de seguridad.
Detalle y evidencia en el
[§7 de la auditoría de coherencia](docs/proyecto/03-implementacion/coherencia-implementacion.md#7-hallazgo-posterior-sobreventa-por-falta-de-transacciones)
y en la [segunda campaña de la bitácora](docs/proyecto/03-implementacion/bitacora-de-fallos.md#segunda-campaña--22-de-septiembre).

**Incremento 7 — pruebas de carga (22 de septiembre):** arnés k6 en [`load/`](load/) para
los cuatro escenarios de la volumetría. Cada fan virtual recorre la venta real (fila, JWT,
reserva, pago y boleta), con la carga escalada y la proporción de 6 fans por boleta. Al
terminar se verifica en PostgreSQL que no hubo sobreventa ni turnos reutilizados. La primera
campaña local cumplió todos los umbrales. En pico y estrés la fila admite 14,5 fans/s
mientras llegan 25–37, y la reserva se mantiene en P95 ~35 ms. El primer síntoma de
degradación es la consulta de posición de la fila en memoria (P99 1,02 s a ×1,5). Detalle en
[`pruebas-de-carga.md`](docs/proyecto/03-implementacion/pruebas-de-carga.md).

## Tablero

| # | Entrega | Peso | Fecha | Estado |
|---|---|---|---|---|
| 1 | Caso de negocio | 20% | sáb 12 sep 2026 | ✅ Entregada. Falta la nota |
| 2 | Modelamiento de la solución | 30% | sáb 19 sep 2026, 3 p.m. | ✅ **Entregada** por Teams. Falta la nota |
| 3 | Implementación, sustentación y defensa | 30% | **sáb 26 sep 2026** | 🟢 **En curso.** App funcional (Fastify + PostgreSQL + Redis + Kafka + seguridad de borde + plataforma web `/app`), observabilidad y 4 fallos ejecutados; faltan video, cobertura en CI y autoevaluación |
