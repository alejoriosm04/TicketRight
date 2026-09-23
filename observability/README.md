# Observabilidad de TicketRight — Entrega 3, criterio 2

Implementación real de la plataforma de observabilidad diseñada en la Entrega 2
([observabilidad.md](../docs/proyecto/02-modelamiento/observabilidad.md)): las **tres señales**
—métricas, trazas y logs— correlacionadas, con la misma pila de herramientas que definimos.

La telemetría vive en la capa de composición (`apps/ventas`), no en el dominio: el hexágono
publica hechos y la app los mide. Así el dominio no conoce Prometheus ni OpenTelemetry
(coherente con [AD-007](../docs/proyecto/decisiones/0007-stack-de-implementacion.md)).

## La plataforma (igual que en el diseño)

| Rol | Herramienta | En la demo |
|---|---|---|
| Instrumentación | **OpenTelemetry SDK** | `apps/ventas/src/observability/tracing.ts` — auto-instrumenta HTTP y PostgreSQL, propaga `trace_id` |
| Puerta OTLP y recolección | **Grafana Alloy** | Recibe trazas por OTLP (4318/4317) y lee el archivo de logs; reparte a Tempo y Loki |
| Métricas | **Prometheus** | Raspa `/metrics` de la app cada 5 s |
| Trazas | **Grafana Tempo** | Recorrido admisión → reserva → pago → emisión por `trace_id` |
| Logs | **Grafana Loki** | Logs JSON con el esquema del diseño; enlazan a su traza |
| Visualización y alertas | **Grafana** | Tablero de ticketera + 4 reglas de alerta |

```
App (OTel SDK) ──OTLP──►  Alloy ──► Tempo (trazas)
   │  /metrics                 └──► Loki  (logs)
   └──scrape── Prometheus (métricas)
                    Tempo · Loki · Prometheus ──► Grafana
```

## Arranque

```bash
docker compose up -d postgres prometheus grafana tempo loki alloy
npm run db:migrate -w @ticketright/ventas
npm run db:seed -w @ticketright/ventas
npm run dev -w @ticketright/ventas                 # API + /metrics en :3000
node apps/ventas/scripts/recorrido-con-fila.mjs    # un recorrido completo con fila
node apps/ventas/scripts/trafico-demo.mjs          # tráfico continuo para la demo
```

| Servicio | URL | Notas |
|---|---|---|
| Métricas de la app | http://localhost:3000/metrics | Exposición Prometheus |
| Tablero | http://localhost:3001/d/ticketright-ventas | `admin`/`admin`; lectura anónima |
| Prometheus | http://localhost:9090 | Objetivos y alertas |
| Tempo | http://localhost:3200 | Trazas (se consultan desde Grafana) |
| Loki | http://localhost:3100 | Logs (se consultan desde Grafana) |
| Alloy | http://localhost:12345 | Estado de la tubería |

## El recinto de la demo

El seed modela un recinto con cuatro tribunas con nombre legible (como un estadio o
coliseo), para que los tableros se lean en lenguaje de ticketera: **Oriental** ($320.000,
800), **Occidental** ($280.000, 900), **Sur** ($150.000, 1650) y **Norte** ($150.000,
1650). Suman **5.000 boletas**, alineado con el escenario de pico de la
[volumetría](../docs/proyecto/02-modelamiento/volumetria.md). El nombre de la tribuna es la
etiqueta `localidad` de las métricas de aforo.

## Catálogo de métricas implementadas

### Las 14 métricas del diseño (todas implementadas)

Estas son las variables del catálogo de
[observabilidad.md](../docs/proyecto/02-modelamiento/observabilidad.md); se implementan con
su nombre exacto.

| Métrica | Qué mide | Atributo |
|---|---|---|
| `ticketright_sales_amount_total{currency}` | Dinero confirmado (solo pagos confirmados) | OKR-3 · A-1 |
| `ticketright_open_discrepancies` | Pagos cobrados sin boleta ni compensación | A-1 |
| `ticketright_oldest_discrepancy_age_seconds` | Antigüedad de la discrepancia más vieja (meta ≤ 900 s) | A-1 |
| `ticketright_oversell_total{localidad}` | Boletas por encima del aforo (meta cero) | A-2 |
| `ticketright_invalid_ownership_total` | Boletas con más de una titularidad activa (meta cero) | A-3 |
| `ticketright_payments_total{state}` | Pagos por estado final | A-6 |
| `ticketright_ticket_state_transitions_total{state}` | Boletas por estado (emitida, transferida…) | OKR-2 |
| `ticketright_overdue_reservations` | Reservas vencidas que aún retienen inventario | A-5 |
| `ticketright_active_sale_sessions` | Personas conectadas ahora (en fila o comprando, activas ≤ 5 min) | — |
| `ticketright_queue_position_duration_seconds` | Tiempo de consulta de posición en fila (meta P95 ≤ 1 s) | A-10 |
| `ticketright_queue_policy_violations_total` | Turnos fuera del orden de la política (meta cero) | A-4 |
| `ticketright_reservation_duration_seconds` | Latencia de reserva P50/P95/P99 (meta P95 ≤ 2 s) | A-10 |
| `ticketright_critical_journey_checks_total{result}` | Recorridos sintéticos del camino crítico (disponibilidad ≥ 99,9%) | A-9 |
| `ticketright_infrastructure_cost_per_ticket_cop` | Costo de infraestructura por boleta vendida (meta ≤ COP $150) | A-7 |

### Métricas añadidas para completar la vista de ticketera

Se agregaron sobre el diseño para dar la magnitud de clientes, el embudo y el acuerdo con la
promotora. No sustituyen ninguna del diseño; lo complementan.

| Métrica | Qué mide | Atributo |
|---|---|---|
| `ticketright_seat_capacity{localidad,tipo,state}` | Aforo por tribuna: autorizado, reservado, vendido y disponible | A-2 |
| `ticketright_tickets_sold_total{localidad}` | Boletas vendidas (pago confirmado) por tribuna | OKR-3 |
| `ticketright_sales_breakdown_total{component}` | Reparto del dinero: nominal (promotora), cargo de servicio (ticketera), parafiscal (impuesto) | OKR-3 |
| `ticketright_reservations_total{result}` | Reservas creadas (numerador/denominador del embudo) | — |
| `ticketright_payments_started_total` | Pagos iniciados (denominador de la conversión) | A-6 |
| `ticketright_payments_in_flight` | Pagos procesándose ahora mismo (esperando la pasarela) | A-1 · A-6 |
| `ticketright_issuance_duration_seconds` | Latencia de la emisión (cierre de la SAGA) | A-1 |
| `ticketright_queue_waiting{evento}` | Turnos en espera en la fila | A-4 · A-6 |
| `ticketright_queue_admitted{evento}` | Turnos admitidos que ya pueden comprar | A-6 |
| `ticketright_queue_entries_total{evento}` | Ingresos a la fila | — |
| `ticketright_queue_admissions_total{evento}` | Admisiones concedidas (tasa de admisión) | A-6 |
| `ticketright_reservation_errors_total{kind}` | Errores de reserva por tipo (tasa técnica < 1%) | A-10 |
| `ticketright_http_requests_total{method,route,status}` | Tráfico HTTP por ruta y estado (método RED) | — |
| `ticketright_http_request_duration_seconds{method,route}` | Latencia HTTP por ruta | A-10 |
| `ticketright_pg_pool_connections{state}` | Conexiones del pool de PostgreSQL | A-6 |
| `ticketright_process_*` | CPU, memoria, event loop del proceso (por defecto de Node/OTel) | A-6 · A-9 |

La sonda sintética (`synthetic-probe.ts`) ejecuta el recorrido completo cada 60 s y alimenta
`critical_journey_checks_total`. El costo por boleta se calcula en el colector dividiendo un
costo por hora configurable (`INFRA_COSTO_HORA_COP`) entre las boletas de la última hora.

## Trazas y logs correlacionados

- Cada solicitud genera una **traza** (Tempo) con los spans de HTTP y las consultas a
  PostgreSQL. Desde una traza en Grafana se salta a sus logs (`tracesToLogs`).
- Cada **log** (Loki) sale en JSON con el esquema del diseño (`service`, `operation`,
  `event_type`, `outcome`, `trace_id`, `span_id`). Desde un log se salta a su traza
  (`derivedFields` → `TraceID`).
- Transiciones de negocio registradas como hechos con nombre estable: `ingreso_a_fila`,
  `reserva_creada`, `pago_solicitado`, `pago_confirmado`, `pago_rechazado`.

## Alertas

`prometheus/alerts.yml` define cuatro reglas ligadas a atributos: discrepancia prolongada
(A-1), discrepancias abiertas (A-1), sobreventa (A-2) y reservas vencidas (A-5). Se ven en
http://localhost:9090/alerts. Para **dispararlas en vivo**, arrancar la app sin reintentos
de emisión: cada pago confirmado queda como «cobro sin boleta» y abre una discrepancia.

```bash
MAX_INTENTOS_EMISION=0 npm run dev -w @ticketright/ventas
npm run e2e -w @ticketright/ventas   # termina en enConciliacion, es lo esperado
```

`DiscrepanciasAbiertas` pasa a *firing* a los ~10 s y `DiscrepanciaAbiertaProlongada` al
minuto. Con `PASARELA_PERFIL=repetida` ya no se dispara nada: el webhook repetido es
idempotente y no abre discrepancias. Para volver a la normalidad, reinicia la app sin la
variable y resiembra (`npm run db:seed -w @ticketright/ventas`).

## El tablero

Un solo tablero con cinco secciones y títulos en lenguaje de ticketera:

1. **Resumen de la venta** — dinero vendido, personas conectadas ahora, pagos procesándose, conversión, discrepancias, sobreventa.
2. **Sala de espera y fila** — personas en fila vs admitidas, ritmo de la fila, latencia de posición, disponibilidad del recorrido crítico.
3. **Negocio y recinto** — embudo, boletas disponibles por tribuna, ocupación %, boletas vendidas por tribuna, reparto del dinero, boleta promedio, dinero por minuto.
4. **Diagnóstico técnico** — latencia de reserva, HTTP por ruta, conexiones a la base, CPU/memoria, pagos por estado, costo por boleta, latencia de emisión.
5. **Registros y trazas** — dos paneles de logs de Loki (toda la actividad, y solo errores/advertencias), enlazados a Tempo.

Cada localidad aparece con su nombre (Oriental, Occidental, Sur, Norte), no con el UUID. El
colector reinicia el gauge de aforo en cada refresco para que una localidad retirada no deje
series colgadas.

## Dónde vive la instrumentación

```
apps/ventas/src/observability/
  tracing.ts          Arranque de OpenTelemetry (trazas, auto-instrumentación HTTP/pg)
  logger.ts           Logger JSON (pino) con el esquema del diseño y trace_id
  metrics.ts          Registro de todas las métricas Prometheus
  collector.ts        Recalcula gauges desde PostgreSQL y la sala de espera cada 5 s
  synthetic-probe.ts  Sonda del recorrido crítico (A-9)
apps/ventas/src/adapters/waiting-room.ts   Sala de espera / fila de admisión (AD-006)
```

## Estructura del stack

```
observability/
  prometheus/{prometheus.yml, alerts.yml}
  tempo/tempo.yml
  loki/loki.yml
  alloy/config.alloy
  grafana/
    provisioning/datasources/  (Prometheus, Tempo, Loki con correlación)
    provisioning/dashboards/
    dashboards/ticketright.json
  logs/                        (ventas.log; lo recoge Alloy)
```
