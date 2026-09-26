# TicketRight

Plataforma de venta de boletería para eventos de alta demanda. La tesis del proyecto no es
«no sobrevender» —eso lo resuelve un candado— sino **no romper nunca la correspondencia
entre el dinero y el derecho a entrar**, con una pasarela de pagos que se demora, responde
tarde y responde dos veces.

**Equipo:** Alejo · Lina · Quinnie
**Curso:** Arquitecturas Avanzadas de Software — Universidad EAFIT, septiembre 2026

**Entrega activa: Entrega 3 — Implementación · Sustentación · Simulación · Defensa**
(sábado 26 de septiembre de 2026, 30%). El estado vivo está en [`ESTADO.md`](ESTADO.md).

**Presentación y video:** https://statuesque-valkyrie-5daa13.netlify.app — la simulación y el análisis de los cuatro fallos y de la
carga, con el video de la campaña completa.

## Este repositorio

| Ruta | Qué contiene |
|---|---|
| `apps/ventas/` | La aplicación: API Fastify sobre PostgreSQL, Redis y Kafka, borde de seguridad y plataforma web `/app` |
| `packages/` | El código: un paquete por contexto acotado —hexagonal— más `shared-kernel` |
| `observability/` | OpenTelemetry, Alloy, Prometheus (15 alertas), Tempo, Loki y el tablero de Grafana |
| `deploy/` | Arranque con `docker compose` o en minikube con KEDA; devcontainer para Codespaces |
| `chaos/` | Arnés de los cuatro experimentos de inyección de fallos |
| `load/` | Pruebas de carga con k6 y sus resultados |
| `docs/` | La base de conocimiento importada de `aas`: caso de negocio (Entrega 1), modelamiento (Entrega 2) y el material del curso digitalizado. Es la fuente de verdad y se publica como [wiki](https://github.com/alejoriosm04/TicketRight/wiki) |
| `docs/proyecto/decisiones/` | Los ADR: el material con el que se defiende la Entrega 3 |
| `docs/proyecto/02-modelamiento/` | Los diseños que la implementación convierte en código, con sus diagramas de Archify (`.json` fuente y `.html`) |
| `docs/proyecto/03-implementacion/` | La Entrega 3: rúbrica, coherencia, fidelidad, patrones, fallos, carga y autoevaluación |
| `tools/` | `publish-wiki.py` publica `docs/` como wiki; `archify/` regenera y valida los diagramas |
| `docs/herramientas/` | Verificador de enlaces y utilidades de los entregables |
| `docker-compose.yml` | Ambiente local: PostgreSQL, Redis, Kafka y la plataforma de observabilidad |

El código es un monorepo de npm workspaces con TypeScript y Vitest
([AD-007](docs/proyecto/decisiones/0007-stack-de-implementacion.md), ✅ aceptado):

```bash
npm install                                    # dependencias
npm test                                       # pruebas (Vitest)
npm run typecheck                              # tipos estrictos
cp .env.example .env && docker compose up -d   # PostgreSQL, Redis, Kafka y observabilidad
```

## Cómo navegar

- **Personas:** la [wiki del proyecto](https://github.com/alejoriosm04/TicketRight/wiki).
- **Agentes de IA:** [`AGENTS.md`](AGENTS.md) y [`ESTADO.md`](ESTADO.md).
- **La bitácora del diseño (hasta la Entrega 2):** [`docs/ESTADO.md`](docs/ESTADO.md).

## Documentos clave

| Documento | Qué responde |
|---|---|
| [Atributos de calidad](docs/proyecto/01-caso-de-negocio/atributos-de-calidad.md) | Los 12 compromisos numéricos del negocio |
| [Los ADR](docs/proyecto/decisiones/README.md) | Las cinco decisiones de arquitectura (AD-002 a AD-006), el stack (AD-007) y la frontera de `Boleta` (AD-008), con sus sacrificios |
| [Arquitectura de referencia](docs/proyecto/02-modelamiento/arquitectura-de-referencia.md) | Capas, patrones y responsabilidades, sin marcas |
| [Arquitectura de implementación](docs/proyecto/02-modelamiento/arquitectura-de-implementacion.md) | La topología AWS, integraciones, IaC y costos |
| [Plan de pruebas](docs/proyecto/02-modelamiento/plan-de-pruebas.md) · [Volumetría](docs/proyecto/02-modelamiento/volumetria.md) · [Observabilidad](docs/proyecto/02-modelamiento/observabilidad.md) · [Inyección de fallos](docs/proyecto/02-modelamiento/inyeccion-de-fallos.md) | Lo que la Entrega 3 debe ejecutar y demostrar |
| [Entrega 3](docs/proyecto/03-implementacion/README.md) | Qué se implementó, con qué evidencia y qué quedó fuera |
| [Coherencia](docs/proyecto/03-implementacion/coherencia-implementacion.md) · [Fidelidad a los ADR](docs/proyecto/03-implementacion/fidelidad-arquitectonica.md) | Dónde el código sigue al diseño y dónde difiere, y por qué |
