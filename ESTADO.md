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

Según el [syllabus](docs/curso/syllabus.md) y el
[README de la entrega](docs/proyecto/03-implementacion/README.md):

| Frente | Qué es | Estado |
|---|---|---|
| Implementación | El código y la plataforma funcionando | ⚪ PENDIENTE |
| Sustentación | Presentar la solución | ⚪ PENDIENTE |
| Simulación | `PENDIENTE: confirmar qué se espera` | ❓ |
| Defensa | Sostener las decisiones ante preguntas | 🟡 Material listo: los cinco ADR |

La **defensa** se apoya en los ADR: para cada decisión visible en la demo hay que responder
qué atributo de calidad la justifica y qué se sacrificó a cambio
([`docs/proyecto/decisiones/`](docs/proyecto/decisiones/README.md)).

## Lo que hay que sacar

De los entregables de diseño a la ejecución. **El orden importa**: primero el esqueleto y el
caso de uso principal, y encima de eso pruebas, carga, observabilidad y fallos.

| # | Frente | Insumo ya escrito | Qué falta |
|---|---|---|---|
| 1 | Estructura del código | [AD-007](docs/proyecto/decisiones/0007-stack-de-implementacion.md): TypeScript/Node · [arquitectura hexagonal](docs/proyecto/02-modelamiento/diagrama-de-clases.md) | ✅ Esqueleto en `packages/` con nombres en inglés (convención en AD-007) |
| 2 | Caso de uso principal: *comprar en la ventana de alta demanda* | [Diagrama de clases](docs/proyecto/02-modelamiento/diagrama-de-clases.md) (39 clases) y [de secuencia](docs/proyecto/02-modelamiento/diagrama-de-secuencia.md) (38 mensajes, errores y compensaciones) | 🟡 Dominio y SAGA implementados con los dobles de prueba; `PENDIENTE: adaptadores reales (HTTP, PostgreSQL, outbox, pasarela), despliegue y demo` |
| 3 | Pruebas | [Plan de pruebas](docs/proyecto/02-modelamiento/plan-de-pruebas.md): 21 casos UT sobre las reglas R1–R14 | ✅ Los 21 casos están escritos y en verde (38 pruebas; cobertura 78,25% sentencias). `PENDIENTE: reporte por commit y corrida en CI` |
| 4 | Carga | [Volumetría](docs/proyecto/02-modelamiento/volumetria.md): nominal, pico, estrés y resistencia; 30.000 usuarios en 60 s contra 5.000 boletas | Corridas y resultados |
| 5 | Observabilidad | [Observabilidad](docs/proyecto/02-modelamiento/observabilidad.md): métricas doradas, tableros, alertas y responsables | Instrumentar y demostrar con datos reales |
| 6 | Inyección de fallos | [Inyección de fallos](docs/proyecto/02-modelamiento/inyeccion-de-fallos.md): Chaos Mesh, catálogo e hipótesis | Módulo funcionando y bitácora |
| 7 | Prototipo | [Prototipo](docs/proyecto/02-modelamiento/prototipo/index.html): 16 pantallas, tres roles | `PENDIENTE: redesplegar en Netlify con los cambios del 18 sep` |
| 8 | Defensa | [Los ADR](docs/proyecto/decisiones/README.md) | Repasar trazabilidad atributo → decisión → sacrificio |

## Pendientes y preguntas abiertas

- `PENDIENTE: confirmar qué se espera de «simulación» y el formato de la sustentación.`
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
de pruebas están implementados con los cuatro dobles y en verde. `PENDIENTE: regenerar los
artefactos del diagrama de clases con el ajuste de puertos y anexar el reporte de cobertura.`

## Tablero

| # | Entrega | Peso | Fecha | Estado |
|---|---|---|---|---|
| 1 | Caso de negocio | 20% | sáb 12 sep 2026 | ✅ Entregada. Falta la nota |
| 2 | Modelamiento de la solución | 30% | sáb 19 sep 2026, 3 p.m. | ✅ Diseño completo; `PENDIENTE: subida a Teams` |
| 3 | Implementación, sustentación y defensa | 30% | **sáb 26 sep 2026** | ⚪ **Activa.** Sin empezar el código |
