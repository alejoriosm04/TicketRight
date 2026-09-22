# Estado del repositorio — TicketRight

> Archivo vivo. Quien avance algo, lo actualiza.
> Última actualización: **2026-09-19**. Este archivo registra el estado del **repositorio de
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
| 1 | Aplicación funcionando | **40%** | 🟢 Dominio, SAGA y app Fastify + PostgreSQL corriendo en local con sala de espera; falta despliegue en clúster y video |
| 2 | Observabilidad | **20%** | 🟢 Plataforma implementada (OTel + Alloy + Prometheus + Tempo + Loki + Grafana); las 14 métricas del diseño instrumentadas, tablero y 4 alertas |
| 3 | Simulación y análisis de fallos | **30%** | 🟢 Los 4 escenarios (IF-01, IF-02, IF-03, IF-05) ejecutados y aprobados; bitácora en [`bitacora-de-fallos.md`](docs/proyecto/03-implementacion/bitacora-de-fallos.md). IF-03 halló y corrigió una debilidad real |
| 4 | Patrones utilizados | **10%** | ✅ Catálogo en [`patrones.md`](docs/proyecto/03-implementacion/patrones.md) |
| 5 | Autoevaluación | **+10%** | ⚪ Por escribir al cierre |
| 6 | Coherencia | **-10%** | 🟢 21 casos ejecutados y diagramas reconciliados; mantener al día |

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
| 2 | Pruebas y coherencia | [Plan de pruebas](docs/proyecto/02-modelamiento/plan-de-pruebas.md): 21 casos UT sobre las reglas R1–R14 | ✅ Los 21 casos están escritos y en verde (38 pruebas; cobertura 78,25% sentencias). `PENDIENTE: reporte por commit y corrida en CI` |
| 3 | Observabilidad (20%) | [Observabilidad](docs/proyecto/02-modelamiento/observabilidad.md): métricas, tableros y alertas | 🟢 Implementada: plataforma completa (OTel + Alloy + Prometheus + Tempo + Loki + Grafana), las 14 métricas del diseño instrumentadas + complementos de ticketera, tablero de 5 secciones y 4 alertas. Ver [`observability/README.md`](observability/README.md). `PENDIENTE: capturas y video` |
| 4 | Simulación de fallos (30%) | [Inyección de fallos](docs/proyecto/02-modelamiento/inyeccion-de-fallos.md): IF-01, IF-02, IF-03 e IF-05 elegidos | 🟢 Los 4 ejecutados y aprobados con el arnés de `chaos/`; bitácora en [`bitacora-de-fallos.md`](docs/proyecto/03-implementacion/bitacora-de-fallos.md). `PENDIENTE: capturas del tablero durante cada fallo para el video` |
| 5 | Carga | [Volumetría](docs/proyecto/02-modelamiento/volumetria.md): nominal, pico, estrés y resistencia; 30.000 usuarios en 60 s contra 5.000 boletas | Corridas y resultados |
| 6 | Patrones (10%) | [Patrones utilizados](docs/proyecto/03-implementacion/patrones.md) | Revisar contra la demo y añadir capturas |
| 7 | Prototipo | [Prototipo](docs/proyecto/02-modelamiento/prototipo/index.html): 16 pantallas, tres roles | `PENDIENTE: redesplegar en Netlify con los cambios del 18 sep` |
| 8 | Defensa y autoevaluación | [Los ADR](docs/proyecto/decisiones/README.md) · [tipos de deuda técnica](docs/curso/clase-05-06.md) | Repasar trazabilidad atributo → decisión → sacrificio; escribir la autoevaluación |

## Pendientes y preguntas abiertas

- `PENDIENTE: la diapositiva 46 trae una nota manuscrita «¿Máximo?»; preguntar al profesor si la nota del entregable tiene tope.`
- `PENDIENTE: formato y duración del video demo; el ambiente será local con k3d o minikube, así que también hay que confirmar si la demo en video y los accesos por Tailscale son suficientes.`
- `PENDIENTE: ratificar los doce umbrales de` [`atributos-de-calidad.md`](docs/proyecto/01-caso-de-negocio/atributos-de-calidad.md).
- `PENDIENTE: la nota y la retroalimentación de la Entrega 1.`
- `PENDIENTE: la nota de la Entrega 2, entregada por Teams el 19 de septiembre.`
- `PENDIENTE: verificar disponibilidad de dominio y marca de «TicketRight».`

## Organización del repositorio

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
AD-006) con endpoints `/fila/entrar` y `/fila/:turnoId`, y el seed modela un recinto de cuatro
tribunas con nombre (Oriental, Occidental, Sur, Norte; 5.000 boletas). El tablero de Grafana
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

## Tablero

| # | Entrega | Peso | Fecha | Estado |
|---|---|---|---|---|
| 1 | Caso de negocio | 20% | sáb 12 sep 2026 | ✅ Entregada. Falta la nota |
| 2 | Modelamiento de la solución | 30% | sáb 19 sep 2026, 3 p.m. | ✅ **Entregada** por Teams. Falta la nota |
| 3 | Implementación, sustentación y defensa | 30% | **sáb 26 sep 2026** | ⚪ **Activa.** Sin empezar el código |
