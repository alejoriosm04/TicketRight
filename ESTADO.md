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
| 1 | Aplicación funcionando | **40%** | 🟡 Dominio y SAGA en verde; faltan adaptadores reales y despliegue |
| 2 | Observabilidad | **20%** | 🟡 Diseño completo; falta instrumentar 3 métricas de negocio + 3 técnicas |
| 3 | Simulación y análisis de fallos | **30%** | 🟡 4 escenarios elegidos del catálogo; falta ejecutarlos y bitacorar |
| 4 | Patrones utilizados | **10%** | ✅ Catálogo en [`patrones.md`](docs/proyecto/03-implementacion/patrones.md) |
| 5 | Autoevaluación | **+10%** | ⚪ Por escribir al cierre |
| 6 | Coherencia | **-10%** | 🟢 21 casos ejecutados y diagramas reconciliados; mantener al día |

La **defensa** se apoya en los ADR: para cada decisión visible en la demo hay que responder
qué atributo de calidad la justifica y qué se sacrificó a cambio
([`docs/proyecto/decisiones/`](docs/proyecto/decisiones/README.md)).

## Lo que hay que sacar

De los entregables de diseño a la ejecución. **El orden importa**: primero el esqueleto y el
caso de uso principal, y encima de eso pruebas, carga, observabilidad y fallos.

| # | Criterio | Insumo ya escrito | Qué falta |
|---|---|---|---|
| 1 | Aplicación funcionando (40%) | [AD-007](docs/proyecto/decisiones/0007-stack-de-implementacion.md): TypeScript/Node · [arquitectura hexagonal](docs/proyecto/02-modelamiento/diagrama-de-clases.md) · [caso de uso](docs/proyecto/02-modelamiento/diagrama-de-secuencia.md) | 🟡 Dominio y SAGA implementados con los dobles; `PENDIENTE: adaptadores reales (HTTP, PostgreSQL, outbox, pasarela), ambiente de demo y video` |
| 2 | Pruebas y coherencia | [Plan de pruebas](docs/proyecto/02-modelamiento/plan-de-pruebas.md): 21 casos UT sobre las reglas R1–R14 | ✅ Los 21 casos están escritos y en verde (38 pruebas; cobertura 78,25% sentencias). `PENDIENTE: reporte por commit y corrida en CI` |
| 3 | Observabilidad (20%) | [Observabilidad](docs/proyecto/02-modelamiento/observabilidad.md): las 6 métricas de la entrega, tableros y alertas | Instrumentar y demostrar con datos reales |
| 4 | Simulación de fallos (30%) | [Inyección de fallos](docs/proyecto/02-modelamiento/inyeccion-de-fallos.md): IF-01, IF-02, IF-03 e IF-05 elegidos | Ejecutar los 4 escenarios y escribir la bitácora |
| 5 | Carga | [Volumetría](docs/proyecto/02-modelamiento/volumetria.md): nominal, pico, estrés y resistencia; 30.000 usuarios en 60 s contra 5.000 boletas | Corridas y resultados |
| 6 | Patrones (10%) | [Patrones utilizados](docs/proyecto/03-implementacion/patrones.md) | Revisar contra la demo y añadir capturas |
| 7 | Prototipo | [Prototipo](docs/proyecto/02-modelamiento/prototipo/index.html): 16 pantallas, tres roles | `PENDIENTE: redesplegar en Netlify con los cambios del 18 sep` |
| 8 | Defensa y autoevaluación | [Los ADR](docs/proyecto/decisiones/README.md) · [tipos de deuda técnica](docs/curso/clase-05-06.md) | Repasar trazabilidad atributo → decisión → sacrificio; escribir la autoevaluación |

## Pendientes y preguntas abiertas

- `PENDIENTE: la diapositiva 46 trae una nota manuscrita «¿Máximo?»; preguntar al profesor si la nota del entregable tiene tope.`
- `PENDIENTE: formato y duración del video demo; si basta un ambiente local con demo en video o espera accesos a un despliegue.`
- `PENDIENTE: ratificar los doce umbrales de` [`atributos-de-calidad.md`](docs/proyecto/01-caso-de-negocio/atributos-de-calidad.md).
- `PENDIENTE: la nota y la retroalimentación de la Entrega 1.`
- `PENDIENTE: confirmar que el paquete de la Entrega 2 quedó subido a Teams` — el paquete
  quedó armado en `aas/exportaciones/entrega-02-modelamiento/`.
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
[`material/2026-09-19-clase-05-06.pdf`](docs/curso/material/2026-09-19-clase-05-06.pdf)) y la
rúbrica del Entregable 3 quedó en
[`docs/proyecto/03-implementacion/rubrica.md`](docs/proyecto/03-implementacion/rubrica.md),
con el plan por criterios en el README de la entrega y el catálogo de patrones en
[`patrones.md`](docs/proyecto/03-implementacion/patrones.md).

## Tablero

| # | Entrega | Peso | Fecha | Estado |
|---|---|---|---|---|
| 1 | Caso de negocio | 20% | sáb 12 sep 2026 | ✅ Entregada. Falta la nota |
| 2 | Modelamiento de la solución | 30% | sáb 19 sep 2026, 3 p.m. | ✅ Diseño completo; `PENDIENTE: subida a Teams` |
| 3 | Implementación, sustentación y defensa | 30% | **sáb 26 sep 2026** | ⚪ **Activa.** Sin empezar el código |
