# Demo de la aplicación — cómo ejecutarla paso a paso

Guía para mostrar la aplicación funcionando y cómo cambian las métricas. La idea es **dos
momentos**:

1. **Arranque limpio (sin tráfico):** métricas en 0. Se compra en vivo y se ve cada panel subir.
2. **Arranque con tráfico:** se llena el tablero con muchas compras para ver la fila y el pico.

## Puertos (dónde corre cada cosa)

En Codespaces: pestaña **PORTS** → clic en el globo del puerto → agregar la ruta a la URL.

| Puerto | Qué es | Ruta a abrir |
|---|---|---|
| 3000 | Aplicación | `/app` (plataforma) · `/health` (ver si está viva) · `/metrics` |
| 3001 | Grafana (tableros) | login `admin` / `admin` → tablero `TicketRight — Venta y recaudo` |
| 9090 | Prometheus (métricas + alertas) | `/alerts` |

Cuentas de la plataforma: `cliente@ticketright.co` / `cliente123`,
`promotor@ticketright.co` / `promotor123`, `operacion@ticketright.co` / `operacion123`.

---

## Momento 1 · Arranque limpio, para comprar en vivo

Deja las métricas en 0 y sin la sonda automática, así el tablero **solo cambia con lo que compras
tú**.

```bash
bash deploy/arranque-demo-limpia.sh
```

Termina en `<- API arriba (modo demo: sin sonda, métricas en 0)`.

**Preparar la pantalla:**
- Abrir **`/app`** (puerto 3000) y **Grafana** (puerto 3001) lado a lado.
- En Grafana: rango **Last 15 minutes**, refresco **5s**.
- Verificar que arranca en 0: *Dinero vendido = 0*, *Sobreventa = 0*, *Discrepancias = 0*.

**Comprar en vivo y observar el tablero** (hay ~5-10 s de retraso entre la acción y el panel):

| Paso en `/app` | Panel de Grafana que se mueve |
|---|---|
| Buscar un evento y abrirlo | — (es lectura del catálogo) |
| "Ver entradas" → entrar a la fila | *Personas en fila vs admitidas*, *Ritmo de la fila* |
| Elegir localidad y **Reservar** | *Embudo de la venta* (sube "reservas") |
| **Pagar** | *Pagos procesándose ahora* (sube y baja), *Embudo* (pagos iniciados → confirmados) |
| Boleta emitida | *Dinero vendido*, *Boletas vendidas por tribuna*, *Ocupación del recinto*, *Embudo* (boletas emitidas) |
| Todo el rato | *Sobreventa = 0* y *Discrepancias = 0* (verde) |

**Vistas internas** (para cerrar): salir de la cuenta, entrar como **promotor** (menú Promotor:
ventas y ocupación) y como **operación** (menú Operación: discrepancias y perfil operativo).

> Consejo: una sola compra mueve poco los contadores grandes. Para que se note, hacer 2-3
> compras seguidas.

---

## Momento 2 · Arranque con tráfico, para ver el pico

Genera muchas compras y mucha gente en la fila, para ver el tablero "vivo" (fila creciendo,
embudo llenándose, dinero subiendo).

**Opción recomendada — dejar la app como está y solo lanzar el tráfico en otra terminal:**

```bash
node apps/ventas/scripts/trafico-demo.mjs
```

Esto mete gente a la fila y completa compras sin parar. En la terminal se ve `compras=... rechazos=...`.
**Para detenerlo: Ctrl+C** en esa terminal.

**Qué observar en Grafana con el tráfico corriendo:**
- *Personas en fila vs admitidas* → la fila **crece** y las admisiones suben a ritmo constante
  (la válvula de admisión en acción).
- *Embudo de la venta* → reservas → pagos → boletas subiendo juntas.
- *Dinero vendido por minuto* → ritmo de ingresos.
- *Ocupación del recinto por tribuna* → las tribunas llenándose.
- *Sobreventa* → sigue en **0** aunque haya mucha concurrencia.

**Alternativa — arranque normal con la sonda de disponibilidad activa** (1 compra de prueba por
minuto, sin tráfico masivo): es el arranque de siempre.

```bash
pkill -f "tsx src/main.ts"
bash deploy/arranque-compose.sh
```

---

## Resumen de los dos scripts

| Script | Qué hace | Cuándo usarlo |
|---|---|---|
| `deploy/arranque-demo-limpia.sh` | Métricas en 0, **sin** sonda | Mostrar las métricas subir comprando en vivo |
| `deploy/arranque-compose.sh` | Arranque normal, **con** sonda de disponibilidad | Arranque estándar del proyecto |
| `node apps/ventas/scripts/trafico-demo.mjs` | Genera tráfico continuo (Ctrl+C para parar) | Llenar el tablero para ver el pico |

## Volver a dejar todo en 0

```bash
pkill -f "tsx src/main.ts"          # apaga la app (y el tráfico si estaba en ella)
bash deploy/arranque-demo-limpia.sh # resiembra y arranca limpio otra vez
```

(si el tráfico corre en otra terminal, primero Ctrl+C allí).

## Si algo falla

| Síntoma | Solución |
|---|---|
| `/app` dice «Demasiadas solicitudes» (429) mientras navegas | El tráfico y tu navegación comparten el mismo fan; pausa el tráfico (Ctrl+C) mientras muestras la app |
| La fila nunca admite | Entra como `operacion` y pon el perfil en **Cotidiano** |
| Grafana con paneles vacíos | El rango debe ser corto (Last 15 min) y `curl localhost:3000/health` debe responder |
