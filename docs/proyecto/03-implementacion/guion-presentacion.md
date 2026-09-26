# Guion completo de la presentación — TicketRight (Entrega 3)

> Orden de la sustentación: **(1)** arquitectura e implementación (componentes, patrones,
> tecnologías) → **(2)** demo sin tráfico: una venta en vivo con métricas → **(3)** demo con
> tráfico: el dashboard en movimiento → **(4)** inyección de fallos → **(5)** autoevaluación.
> Este documento es la hoja de ruta; los detalles finos están en los guiones específicos de cada
> parte (aplicación, fallos) y en la explicación de la implementación.

## Antes de empezar (montaje, no se muestra)

- Codespace encendido, en `main` actualizado (`git checkout main && git pull`).
- Tener listas las pestañas: **`/app`** (puerto 3000) y **Grafana** (puerto 3001, `admin`/`admin`,
  tablero *TicketRight — Venta y recaudo*). Prometheus (9090) opcional para las alertas.
- Terminal abierta en la raíz del repo.
- Repartir quién habla cada parte.

---

# Parte 1 · Arquitectura e implementación (≈ 6-8 min)

**Objetivo:** que se entienda *qué* construimos, *por qué así* y *con qué*. Aún no se toca la
demo.

## 1.1 El problema y las garantías

TicketRight vende boletas cuando **miles de personas llegan al mismo tiempo**. Todo el diseño
existe para proteger tres garantías que el negocio no negocia:

1. **No vender por encima del aforo** (integridad del aforo).
2. **No cobrar sin entregar la boleta**, o compensar (confiabilidad dinero–boleta).
3. **Una boleta, un solo dueño válido a la vez** (unicidad de titularidad).

> Frase: «No hicimos una tienda de boletas; hicimos el mecanismo que mantiene aforo, dinero y
> titularidad correctos bajo una avalancha.»

## 1.2 El estilo de arquitectura (híbrido y por qué)

No un solo estilo para todo: cada uno donde su fortaleza resuelve el problema.

| Estilo | Para qué | Atributo que sostiene |
|---|---|---|
| **Núcleo transaccional** (PostgreSQL) | Aforo, dinero, titularidad: sin aproximaciones | Integridad, confiabilidad |
| **Event-Driven** (Kafka) | Al confirmar el pago, varios reaccionan sin acoplarse | Confiabilidad, escalabilidad |
| **Space-Based bajo demanda** (Redis) | Absorber la multitud fuera del núcleo | Disponibilidad, rendimiento |
| **CQRS** | Las lecturas (catálogo) no compiten con las compras | Rendimiento |

## 1.3 Componentes (qué corre y a qué equivale)

| Componente | Rol | Equivalente de nube (diseño) |
|---|---|---|
| App de ventas (Node/Fastify) | Orquesta la compra y expone las APIs | EKS |
| PostgreSQL | Fuente de verdad del inventario | Aurora |
| Redis | Sala de espera / fila | ElastiCache |
| Kafka | Bus de eventos durable | MSK |
| Prometheus + Grafana + Tempo + Loki + Alloy | Observabilidad | — |

> Aclaración honesta: corremos un **piloto local con equivalentes** (JWT propio en vez de
> Cognito, AES-256-GCM en vez de KMS, minikube en vez de EKS). La táctica y la garantía son las
> mismas; lo que no reproducimos es la robustez de nube. Está documentado pieza por pieza.

## 1.4 Contextos y arquitectura hexagonal

Monorepo TypeScript con **un paquete por contexto acotado** + un núcleo compartido:

- `event-catalog` (oferta de eventos), `admission-identity` (fila e identidad),
  `sales` (venta y recaudo + la SAGA), `entitlements` (boletas), `shared-kernel` (tipos comunes).
- Dentro de cada uno, **hexágono**: `domain` (reglas), `application` (orquestador), `ports`
  (interfaces), `adapters` (PostgreSQL, Kafka, JWT).
- Regla: el dominio **no conoce infraestructura** y un contexto **no importa a otro**. La boleta
  se emite cruzando el puerto `EmisorDeBoletas` → *modificabilidad*.

## 1.5 Patrones implementados (lo que evalúa el criterio 4)

**De arquitectura:** hexagonal, bounded contexts, **SAGA orquestada**, **outbox transaccional**,
CQRS, **Space-Based**, **back pressure**, autoescalado por lag (KEDA).

**De diseño:** repository, **idempotencia**, domain events, value objects, factory method,
**timeouts acotados**, unidad de trabajo, circuit breaker (parcial).

> Regla de oro para defender cualquiera: **negocio → atributo de calidad → decisión (ADR) →
> táctica en el código.** Ej.: «la pasarela puede confirmar dos veces → no puede haber doble
> cobro (confiabilidad) → SAGA con idempotencia → `Pago.registrarConfirmacion` devuelve `false`
> en la repetición.»

*(Detalle completo en `explicacion-implementacion.md`.)*

---

# Parte 2 · Demo sin tráfico: una venta con métricas (≈ 6-8 min)

**Objetivo:** mostrar la aplicación funcionando y cómo **una** compra mueve las métricas desde 0.

## 2.1 Levantar limpio

```bash
bash deploy/arranque-demo-limpia.sh
```

Termina en `<- API arriba (modo demo: sin sonda, métricas en 0)`. Deja las métricas en 0 y sin la
sonda automática: el tablero solo cambia con lo que hagamos.

Preparar pantalla: `/app` y Grafana lado a lado; en Grafana rango **Last 15 minutes**, refresco
**5s**. Mostrar que arranca en 0: *Dinero vendido, Ventas realizadas, Boletas emitidas,
Sobreventa* = 0.

## 2.2 Recorrer una compra en `/app` y señalar el tablero

Hay ~5-10 s de retraso entre la acción y el panel (Prometheus raspa cada 5s). Se avisa.

| Paso en `/app` | Qué explicar (por detrás) | Panel que se mueve |
|---|---|---|
| Buscar y abrir un evento | El catálogo es lectura sobre PostgreSQL (CQRS) | — |
| «Ver entradas» → fila | Entra a la fila en Redis; al admitir, un JWT firmado de un solo uso | *Personas en la fila*, *Comprando ahora* |
| Elegir localidad + **Reservar** | Transacción con bloqueo de fila (`FOR UPDATE`): cero sobreventa | *Embudo* (reservas); *Boletas disponibles* empieza a bajar |
| Ver el **temporizador 10:00** | La reserva vence sola; un worker libera el cupo | — |
| Datos del titular | Mínimo de boleta nominal; PII cifrada (AES-256-GCM) | — |
| **Pagar** | SAGA: pago → webhook → confirmado; eventos por outbox a Kafka | *Pagos procesándose ahora*, *Ventas realizadas* |
| Boleta con QR | La boleta se emite por el puerto `EmisorDeBoletas` | *Boletas emitidas*, *Dinero vendido* |
| Todo el rato | La garantía se mantiene | *Sobreventa = 0*, *Discrepancias = 0* |

## 2.3 Vistas internas (roles)

Salir de la cuenta y entrar como **promotor** (menú Promotor: ventas y ocupación) y como
**operación** (menú Operación: discrepancias y perfil operativo). En Operación, cambiar el perfil
a **Pico** y explicar el back pressure (sube/baja cuántos fans admite la fila por segundo).
Dejarlo en **Cotidiano**.

*(Detalle en `guion-demo-aplicacion.md`.)*

---

# Parte 3 · Demo con tráfico: el dashboard en movimiento (≈ 4-5 min)

**Objetivo:** mostrar el sistema bajo carga y la observabilidad completa.

## 3.1 Lanzar tráfico

En **otra terminal** (dejar la app corriendo):

```bash
node apps/ventas/scripts/trafico-demo.mjs
```

Mete gente a la fila y completa compras sin parar (`compras=... rechazos=...`). **Ctrl+C** para
detener.

## 3.2 Qué mostrar en Grafana (esperar 1-2 min a que tome forma)

- **Resumen de la venta:** Dinero vendido, Ventas realizadas y Boletas emitidas subiendo;
  *Sobreventa = 0*.
- **Sala de espera y fila:** *Personas en fila vs admitidas* — la fila crece y las admisiones
  suben a ritmo constante (la válvula de admisión, back pressure).
- **Negocio y recinto:** los contadores (Personas en la fila, Comprando ahora, Boletas
  disponibles bajando) y la ocupación por tribuna llenándose.
- **Diagnóstico técnico:** latencia de reserva, solicitudes por ruta, conexiones a PostgreSQL.
- **Registros y trazas:** abrir una traza de una compra y seguir su recorrido (correlación por
  identificador).

## 3.3 Cerrar

Detener el tráfico con **Ctrl+C**. Explicar: «Las señales de negocio y las técnicas están
conectadas; desde una alerta se navega a la métrica, la traza y los logs de esa compra.»

---

# Parte 4 · Inyección de fallos (≈ 8-10 min)

**Objetivo:** provocar fallos controlados y mostrar que las garantías se mantienen. Cada uno:
estado estable → perturbación → medición → recuperación → **APROBADO/FALLIDO**.

> Nota: el diseño proponía Chaos Mesh; el profesor aceptó equivalente local con `docker compose`
> (`docker pause` ≈ NetworkChaos, `docker update --cpus` ≈ StressChaos, reinicio del proceso ≈
> PodChaos). Confirmar el contenedor: `docker ps --format '{{.Names}}' | grep postgres`
> (→ `ticketright-postgres-1`).

## IF-01 · Pasarela repetida (idempotencia)

```bash
node chaos/if-01-pasarela-tardia-repetida.mjs | tee evidencias/if-01.txt
```
Reenvía el mismo webhook 3 y 5 veces. **Observar:** compra `emitida` con **2 boletas** (no más),
`Sobreventa=0`, `Discrepancias=0`. Grafana: *Pagos por estado* cuenta una sola confirmación.

## IF-02 · Reinicio del coordinador (durabilidad)

```bash
node chaos/if-02-reinicio-coordinador.mjs preparar | tee evidencias/if-02-preparar.txt
pkill -f "tsx src/main.ts"
nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &
sleep 8
node chaos/if-02-reinicio-coordinador.mjs verificar | tee evidencias/if-02-verificar.txt
```
**Observar:** las 5 compras sobreviven al reinicio (`emitida`, 2 boletas), `Sobreventa=0`. En
Grafana se ve el hueco del reinicio. El estado vive en PostgreSQL, no en el proceso.

## IF-03 · PostgreSQL caído (el estrella)

```bash
node chaos/if-03-postgres-no-disponible.mjs estable | tee evidencias/if-03-estable.txt
docker pause ticketright-postgres-1
node chaos/if-03-postgres-no-disponible.mjs durante | tee evidencias/if-03-durante.txt
#  << capturar Grafana aquí: latencia y errores de reserva subiendo, Sobreventa=0 >>
docker unpause ticketright-postgres-1
node chaos/if-03-postgres-no-disponible.mjs recuperar | tee evidencias/if-03-recuperar.txt
```
**Observar:** 4/4 reservas rechazadas en ~4 s (no se cuelga), 0 confirmadas sin base,
`Sobreventa=0`; al recuperar, compra nueva `emitida`. **Contar el hallazgo:** la primera versión
se colgaba; la inyección lo encontró, se corrigió con timeouts acotados y se reverificó.

## IF-05 · Saturación de CPU (degradación controlada)

```bash
node chaos/if-05-saturacion-cpu.mjs estable | tee evidencias/if-05-estable.txt
docker update --cpus 0.1 ticketright-postgres-1
node chaos/if-05-saturacion-cpu.mjs durante | tee evidencias/if-05-durante.txt
#  << capturar Grafana aquí: latencia de reserva (P95) subiendo >>
docker update --cpus 4 ticketright-postgres-1
node chaos/if-05-saturacion-cpu.mjs recuperar | tee evidencias/if-05-recuperar.txt
```
**Observar:** la latencia sube pero las compras se completan (≥ 75%), `Sobreventa=0`,
`Discrepancias=0`. Se degrada, no colapsa. (`--cpus 0` no restaura; usar `--cpus 4`.)

## Cierre de fallos

«Cuatro tipos distintos (tercero, proceso, red/datos, recursos). En todos, las garantías del
negocio se mantuvieron. IF-03 encontró una debilidad real y la corregimos: ese es el valor de la
inyección de fallos.»

*(Detalle en `guion-demo-fallos.md`; análisis completo en la bitácora de fallos. En Grafana, qué
panel mira cada fallo, más abajo.)*

### Qué panel mira cada fallo (referencia rápida)

| Fallo | Panel que se agita | El panel que NO se mueve (el punto) |
|---|---|---|
| IF-01 | Pagos por estado (+1 confirmación) | Sobreventa = 0 |
| IF-02 | CPU/memoria y solicitudes (hueco del reinicio) | Sobreventa = 0; el embudo continúa |
| IF-03 | Latencia de reserva ↑, errores ↑, conexiones PG ↑ | **Sobreventa = 0** |
| IF-05 | Latencia de reserva (P95) ↑ y luego baja | Sobreventa = 0; el embudo continúa |

---

# Parte 5 · Autoevaluación (≈ 3-4 min)

**Objetivo:** reflexión honesta, en términos de atributos de calidad.

Puntos a decir (leer/resumir de `autoevaluacion.md`):

- **Modelamiento vs. implementación:** el modelo es el norte (la solución completa y correcta);
  implementar fue priorizar con criterio qué construir primero y hasta dónde, sin sacrificar las
  garantías no negociables.
- **Qué quedó:** implementado y probado (núcleo transaccional, SAGA, outbox, CQRS, fila, hexágono,
  observabilidad); equivalente de piloto (Cognito, KMS, EKS…); y no incluido a conciencia
  (reventa sin flujo, nube robusta, OpenSearch, circuit breaker completo).
- **Aprendizajes clave:** los atributos de calidad se derivan del negocio y del modelo financiero;
  las decisiones de arquitectura (ADR) nacen de los atributos de calidad.
- **Mejoras a partir del feedback:** proyecciones más realistas y foco en un núcleo probado.
- **Frase de cierre:** «Lo que funciona, funciona de verdad y está probado; lo que no incluimos,
  está dicho y justificado.»

---

# Cierre y volver a limpio (después de exponer)

```bash
# detener el tráfico si sigue (Ctrl+C en su terminal)
pkill -f "tsx src/main.ts"
docker unpause ticketright-postgres-1 2>/dev/null || true
docker update --cpus 4 ticketright-postgres-1 2>/dev/null || true
```

Si algo se rompe en vivo: la app no responde → relanzar el `nohup npm run dev ...`; todo lento →
`docker unpause` y `docker update --cpus 4`; error 429 en `/app` → detener el tráfico de demo.

# Documentos de apoyo

- `explicacion-implementacion.md` — el detalle técnico de la Parte 1.
- `guion-demo-aplicacion.md` — el detalle de las Partes 2 y 3.
- `guion-demo-fallos.md` — el detalle de la Parte 4.
- `autoevaluacion.md` — el contenido de la Parte 5.
- `coherencia-implementacion.md` y `fidelidad-arquitectonica.md` — respaldo para preguntas.
