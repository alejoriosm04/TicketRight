# TicketRight

Plataforma de venta de boletería para eventos de alta demanda. La tesis del proyecto no es
«no sobrevender» —eso lo resuelve un candado— sino **no romper nunca la correspondencia
entre el dinero y el derecho a entrar**, con una pasarela de pagos que se demora, responde
tarde y responde dos veces.

**Equipo:** Alejo · Lina · Quinnie
**Curso:** Arquitecturas Avanzadas de Software — Universidad EAFIT, septiembre 2026

**Entrega activa: Entrega 3 — Implementación · Sustentación · Simulación · Defensa**
(sábado 26 de septiembre de 2026, 30%). El estado vivo está en [`ESTADO.md`](ESTADO.md).

## Este repositorio

| Ruta | Qué contiene |
|---|---|
| `apps/ventas/` | La aplicación de la demo: API Fastify + PostgreSQL + outbox + pasarela simulada |
| `packages/` | El código: un paquete por contexto acotado —hexagonal— más `shared-kernel` |
| `docs/` | La base de conocimiento importada de `aas`: caso de negocio (Entrega 1), modelamiento (Entrega 2) y el material del curso digitalizado. Es la fuente de verdad y se publica como [wiki](https://github.com/alejoriosm04/TicketRight/wiki) |
| `docs/proyecto/decisiones/` | Los ADR: el material con el que se defiende la Entrega 3 |
| `docs/proyecto/02-modelamiento/` | Los diseños que la implementación convierte en código |
| `tools/` | `publish-wiki.py`: publica `docs/` como wiki |
| `docs/herramientas/` | Verificador de enlaces y utilidades de los entregables |
| `docker-compose.yml` | Ambiente local: PostgreSQL, Redis y Kafka |

El código es un monorepo de npm workspaces con TypeScript y Vitest
([AD-007](docs/proyecto/decisiones/0007-stack-de-implementacion.md), ✅ aceptado):

```bash
npm install                                    # dependencias
npm test                                       # pruebas (Vitest)
npm run typecheck                              # tipos estrictos
cp .env.example .env && docker compose up -d   # PostgreSQL, Redis y Kafka locales
```

## Cómo navegar

- **Personas:** la [wiki del proyecto](https://github.com/alejoriosm04/TicketRight/wiki).
- **Agentes de IA:** [`AGENTS.md`](AGENTS.md) y [`ESTADO.md`](ESTADO.md).
- **La bitácora del diseño (hasta la Entrega 2):** [`docs/ESTADO.md`](docs/ESTADO.md).

## Documentos clave

| Documento | Qué responde |
|---|---|
| [Atributos de calidad](docs/proyecto/01-caso-de-negocio/atributos-de-calidad.md) | Los 12 compromisos numéricos del negocio |
| [Los cinco ADR](docs/proyecto/decisiones/README.md) | Las decisiones de arquitectura y sus sacrificios |
| [Arquitectura de referencia](docs/proyecto/02-modelamiento/arquitectura-de-referencia.md) | Capas, patrones y responsabilidades, sin marcas |
| [Arquitectura de implementación](docs/proyecto/02-modelamiento/arquitectura-de-implementacion.md) | La topología AWS, integraciones, IaC y costos |
| [Plan de pruebas](docs/proyecto/02-modelamiento/plan-de-pruebas.md) · [Volumetría](docs/proyecto/02-modelamiento/volumetria.md) · [Observabilidad](docs/proyecto/02-modelamiento/observabilidad.md) · [Inyección de fallos](docs/proyecto/02-modelamiento/inyeccion-de-fallos.md) | Lo que la Entrega 3 debe ejecutar y demostrar |
