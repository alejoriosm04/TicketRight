# Demo de inyección de fallos — cómo ejecutar los 4 experimentos

Inyección de fallos: **provocar un fallo de forma controlada y medir si el sistema responde como
se diseñó**. Cada experimento sigue el ciclo **estado estable → perturbación → medición →
recuperación → veredicto (APROBADO/FALLIDO)**.

Se ejecutan cuatro, de tipos distintos:

| Experimento | Tipo de fallo | Qué verifica |
|---|---|---|
| IF-01 | Tercero (pasarela) | El webhook repetido produce una sola boleta (idempotencia) |
| IF-02 | Proceso | Reiniciar la app no pierde compras (estado durable en PostgreSQL) |
| IF-03 | Red / datos | Con la base caída se rechaza con orden y no hay sobreventa |
| IF-05 | Recursos | Con CPU saturada el sistema se degrada, no colapsa |

> Nota de fidelidad: el diseño proponía Chaos Mesh sobre Kubernetes; el profesor aceptó un
> equivalente local. Se reproduce cada tipo con `docker compose`: `docker pause` ≈ NetworkChaos,
> `docker update --cpus` ≈ StressChaos, reiniciar el proceso ≈ PodChaos.

## Preparación

```bash
# Infraestructura + app
bash deploy/arranque-compose.sh                       # termina en "{"ok":true} <- API arriba"

# Confirmar el nombre del contenedor de PostgreSQL (usado en IF-03 e IF-05)
docker ps --format '{{.Names}}' | grep postgres      # esperado: ticketright-postgres-1

# Carpeta de evidencias
mkdir -p evidencias
```

- Tener abierto **Grafana** (`/d/ticketright-ventas`, rango *Last 5 minutes*, refresco *5s*).
- Opcional: tráfico de fondo para que los tableros no estén vacíos:
  `node apps/ventas/scripts/trafico-demo.mjs` (si un experimento da error 429, pausarlo con
  Ctrl+C mientras corre).

---

## IF-01 · La pasarela responde tarde y repite la confirmación

**Verifica:** aunque el webhook de confirmación llegue varias veces (3 seguidas y 5 simultáneas),
se emite una sola vez. Es el patrón de **idempotencia**.

```bash
node chaos/if-01-pasarela-tardia-repetida.mjs | tee evidencias/if-01.txt
```

**Qué observar:** la compra queda en `emitida` con **2 boletas** (no 4 ni 10), **0 discrepancias**
y **0 sobreventa**. Termina en `RESULTADO IF-01: APROBADO`. En Grafana: panel de pagos por estado
(una sola confirmación).

---

## IF-02 · Reinicio del coordinador con pagos en curso

**Verifica:** si el proceso se reinicia con pagos a medias, las compras no se pierden porque el
estado vive en PostgreSQL, no en la memoria del proceso.

```bash
# 1) Dejar 5 pagos solicitados sin confirmar
node chaos/if-02-reinicio-coordinador.mjs preparar | tee evidencias/if-02-preparar.txt

# 2) Perturbación: reiniciar el proceso de la app
pkill -f "tsx src/main.ts"
nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &
sleep 8

# 3) Confirmar y verificar que las 5 compras sobrevivieron
node chaos/if-02-reinicio-coordinador.mjs verificar | tee evidencias/if-02-verificar.txt
```

**Qué observar:** las 5 compras quedan en `paso=emitida boletas=2`, **0 discrepancias**,
**0 sobreventa**. Termina en `RESULTADO IF-02: APROBADO`. En Grafana se ve el hueco del reinicio
(las métricas de proceso vuelven a cero; el negocio persiste en la base).

---

## IF-03 · PostgreSQL deja de responder

**Verifica:** con la base (autoridad del aforo) caída, las reservas se rechazan de forma
controlada, no se confirma ninguna sin base, no hay sobreventa, y el sistema se recupera al
restaurar.

```bash
# 1) Estado estable (compra de control)
node chaos/if-03-postgres-no-disponible.mjs estable | tee evidencias/if-03-estable.txt

# 2) Perturbación: congelar PostgreSQL
docker pause ticketright-postgres-1

# 3) Intentar reservar con la base congelada y medir
node chaos/if-03-postgres-no-disponible.mjs durante | tee evidencias/if-03-durante.txt
#    (capturar Grafana aquí: errores de reserva y latencia subiendo)

# 4) Restaurar y verificar recuperación
docker unpause ticketright-postgres-1
node chaos/if-03-postgres-no-disponible.mjs recuperar | tee evidencias/if-03-recuperar.txt
```

**Qué observar:** durante el fallo, **4/4 reservas rechazadas** en ~4 s (no se cuelga),
**0 confirmadas sin base**, **0 sobreventa**. Al recuperar, una compra nueva queda `emitida`.
Termina en `RESULTADO IF-03: APROBADO`.

**Hallazgo:** la primera versión se colgaba con la base congelada. Se corrigió con timeouts
acotados en las consultas (`query_timeout`) y se reverificó. Es el ejemplo del ciclo romper →
corregir → volver a probar.

---

## IF-05 · Saturación de CPU en la base

**Verifica:** con la CPU de la base restringida, la latencia sube pero las compras se completan y
no hay pérdida de integridad. Es **degradación controlada**.

```bash
# 1) Estable: 8 compras concurrentes
node chaos/if-05-saturacion-cpu.mjs estable | tee evidencias/if-05-estable.txt

# 2) Perturbación: dejar la base con el 10% de un núcleo
docker update --cpus 0.1 ticketright-postgres-1

# 3) Otras 8 compras y medir latencia
node chaos/if-05-saturacion-cpu.mjs durante | tee evidencias/if-05-durante.txt
#    (capturar Grafana aquí: P95 de reserva subiendo)

# 4) Restaurar la CPU y verificar
docker update --cpus 4 ticketright-postgres-1
node chaos/if-05-saturacion-cpu.mjs recuperar | tee evidencias/if-05-recuperar.txt
```

**Qué observar:** durante el fallo la **latencia (P95) sube**, pero las compras se completan
(≥ 75%), con **0 sobreventa** y **0 discrepancias**. Al restaurar vuelve a la línea base. Termina
en `RESULTADO IF-05: APROBADO`.

> `docker update --cpus 0` no quita el límite; hay que fijar un valor alto (`--cpus 4`) para
> restaurar.

---

## Resumen

Los cuatro experimentos cubren tipos de fallo distintos (tercero, proceso, red/datos, recursos).
En todos se mantienen las garantías del negocio: **cero sobreventa** y **cero dinero sin boleta**.

## Si algo falla durante la corrida

| Síntoma | Solución |
|---|---|
| Error 429 «Demasiadas solicitudes» | Pausar el tráfico de demo (Ctrl+C) y repetir el experimento |
| Todo lento tras IF-03/IF-05 | `docker unpause ticketright-postgres-1` y `docker update --cpus 4 ticketright-postgres-1` |
| La app no responde tras IF-02 | Relanzar `nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &` |

El análisis completo (hipótesis, resultado y aprendizaje de cada experimento) está en la bitácora
de fallos. Los scripts están en `chaos/`.
