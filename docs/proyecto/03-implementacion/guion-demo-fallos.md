# Guion de la demo de inyección de fallos — Entrega 3

> Para tener al lado mientras se expone. Muestra los **4 experimentos** en vivo: pasarela
> repetida (IF-01), reinicio del coordinador (IF-02), PostgreSQL caído (IF-03) y saturación de
> CPU (IF-05). Cada uno sigue el ciclo del método científico: **estado estable → perturbación →
> medición → recuperación → veredicto (APROBADO/FALLIDO)**.

## Qué es esto, en una frase (para abrir)

Inyección de fallos = **romper el sistema a propósito, de forma controlada, para comprobar que
se comporta como prometimos**. No esperamos a que el fallo ocurra en producción: lo provocamos
en un ambiente seguro y medimos. Si el sistema aguanta, tenemos evidencia; si no, encontramos el
defecto antes que el cliente.

**Nota de fidelidad (por si preguntan):** el diseño proponía Chaos Mesh sobre Kubernetes; el
profesor aceptó un equivalente local. Reprodujimos cada tipo de fallo con `docker compose`:
pausar un contenedor ≈ NetworkChaos, limitar CPU ≈ StressChaos, reiniciar el proceso ≈ PodChaos.
Mismo estímulo, otra herramienta.

## Preparación (antes de empezar a exponer)

Deja esto listo y **no lo muestres**; es el montaje.

```bash
# 1. Todo levantado (infra + app)
bash deploy/arranque-compose.sh          # termina en "{"ok":true} <- API arriba"

# 2. Confirma el nombre del contenedor de PostgreSQL (se usa en IF-03 e IF-05)
docker ps --format '{{.Names}}' | grep postgres    # debe decir: ticketright-postgres-1

# 3. Carpeta para guardar evidencias de la corrida
mkdir -p evidencias
```

**Ventanas en pantalla:** dos terminales (una para el tráfico, otra para los experimentos) y una
pestaña de **Grafana** (`/d/ticketright-ventas`, rango **Last 5 minutes**, refresco **5s**).

**Genera tráfico de fondo** en una terminal, para que los tableros no estén vacíos (déjalo
corriendo salvo donde se indique lo contrario):

```bash
node apps/ventas/scripts/trafico-demo.mjs
```

> Ojo: el tráfico de demo y algunos experimentos usan el mismo "fan". Si un experimento se queja
> de «Demasiadas solicitudes» (429), **pausa el tráfico** (Ctrl+C) mientras lo corres y reanúdalo
> después.

---

## Orden recomendado

Van de menos a más aparatoso. Los dos primeros no tocan Docker; los dos últimos sí.

1. **IF-01** (pasarela repetida) — el más simple y determinista.
2. **IF-02** (reinicio del coordinador) — muestra durabilidad.
3. **IF-03** (PostgreSQL caído) — **el estrella**, encontró un defecto real.
4. **IF-05** (saturación de CPU) — degradación controlada.

---

## IF-01 · La pasarela responde tarde y repite la confirmación

**Qué demuestra:** una pasarela real reenvía la confirmación varias veces; nosotros emitimos
**una sola** boleta. Es el patrón de **idempotencia**.

**Comando (una sola terminal, sin tocar Docker):**

```bash
node chaos/if-01-pasarela-tardia-repetida.mjs | tee evidencias/if-01.txt
```

**Qué decir mientras corre:**
- «Hago una compra de 2 boletas y, en vez de confirmar el pago una vez, **reenvío el mismo
  webhook 3 veces seguidas y luego 5 veces al mismo tiempo**, que es como llegan los reintentos
  de una pasarela real.»
- «Fíjense en la verificación: la compra queda en **emitida con exactamente 2 boletas**, no 4 ni
  10; **cero discrepancias, cero sobreventa**.»

**Qué señalar en pantalla:** la salida `RESULTADO IF-01: APROBADO` y la línea `boletas de la
compra: 2`. En Grafana, el panel de **pagos por estado** (una sola confirmación).

**Frase de cierre:** «Antes de tener la unidad de trabajo transaccional, esos 5 webhooks
simultáneos llegaban a emitir 7 boletas. Lo detectamos con esta prueba y lo corregimos.»

---

## IF-02 · Se reinicia el coordinador con pagos en curso

**Qué demuestra:** si el proceso se cae con pagos a medias, las compras **no se pierden**, porque
el estado vive en PostgreSQL, no en la memoria del proceso.

**Tiene 3 momentos. Comandos:**

```bash
# 1) Dejar 5 pagos en curso (solicitados, sin confirmar)
node chaos/if-02-reinicio-coordinador.mjs preparar | tee evidencias/if-02-preparar.txt

# 2) EL FALLO: matar y reiniciar el proceso de la app
pkill -f "tsx src/main.ts"
nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &
sleep 8

# 3) Tras el reinicio, confirmar y comprobar que las 5 compras sobrevivieron
node chaos/if-02-reinicio-coordinador.mjs verificar | tee evidencias/if-02-verificar.txt
```

**Qué decir:**
- (tras `preparar`) «Dejo 5 compras con el pago solicitado pero sin confirmar.»
- (tras el `pkill`) «Ahora **mato el proceso** de la aplicación, como si el servidor se cayera en
  pleno pico.»
- (tras `verificar`) «El proceso reinició y las **5 compras siguen ahí** y terminan en boleta
  emitida. Confirmo el webhook dos veces a propósito: la idempotencia hace que repetir dé el
  mismo resultado.»

**Qué señalar:** `RESULTADO IF-02: APROBADO` y las 5 líneas `paso=emitida boletas=2`. En Grafana
se ve el **hueco del reinicio** (las métricas del proceso vuelven a cero: es normal, porque el
negocio vive en la base, no en el proceso).

---

## IF-03 · PostgreSQL deja de responder  ⭐ (el estrella)

**Qué demuestra:** si la base —autoridad del aforo— se cae, el sistema **rechaza rápido y con
orden**, nunca vende sin base, y se recupera solo. Y **este experimento encontró un defecto real.**

**Tiene 3 fases con perturbación de Docker en medio. Comandos:**

```bash
# 1) Estado estable: una compra de control
node chaos/if-03-postgres-no-disponible.mjs estable | tee evidencias/if-03-estable.txt

# 2) EL FALLO: congelar PostgreSQL
docker pause ticketright-postgres-1

# 3) Con la base congelada, intentar reservar y medir
node chaos/if-03-postgres-no-disponible.mjs durante | tee evidencias/if-03-durante.txt
#    >>> AQUÍ captura Grafana: errores de reserva y latencia subiendo <<<

# 4) Restaurar y comprobar recuperación
docker unpause ticketright-postgres-1
node chaos/if-03-postgres-no-disponible.mjs recuperar | tee evidencias/if-03-recuperar.txt
```

**Qué decir:**
- (estable) «Todo normal, una compra de control queda emitida.»
- (pause) «**Acabo de congelar la base de datos.**»
- (durante) «Las **4 reservas se rechazan de forma controlada en ~4 segundos**, no se cuelgan;
  **cero confirmadas sin base, cero sobreventa**.»
- (recuperar) «Descongelo la base y una compra nueva vuelve a completarse: **se recupera solo**.»

**Qué señalar en Grafana (durante):** el panel de **latencia de reserva** y **errores** subiendo,
mientras **sobreventa sigue en 0**.

**Frase de cierre (la más importante de toda la demo):** «La **primera vez** que hicimos este
experimento, el servicio **se colgaba**: las consultas a la base congelada se quedaban esperando
para siempre. Era un defecto real que no sabíamos que teníamos. La inyección de fallos hizo su
trabajo: lo encontró. Le pusimos un **límite de tiempo a las consultas** para que fallen rápido, y
**repetimos el experimento**. Eso es la ingeniería del caos: romper, aprender, corregir y
verificar.»

---

## IF-05 · Saturación de CPU en la base

**Qué demuestra:** bajo presión de CPU el sistema se pone **lento pero no se cae** ni pierde
integridad. Es **degradación controlada**.

**Tiene 3 fases con perturbación de Docker. Comandos:**

```bash
# 1) Estable: 8 compras concurrentes, todas deben completarse
node chaos/if-05-saturacion-cpu.mjs estable | tee evidencias/if-05-estable.txt

# 2) EL FALLO: dejar a PostgreSQL con el 10% de un núcleo
docker update --cpus 0.1 ticketright-postgres-1

# 3) Con la base ahogada, otras 8 compras y medir latencia
node chaos/if-05-saturacion-cpu.mjs durante | tee evidencias/if-05-durante.txt
#    >>> AQUÍ captura Grafana: latencia de reserva (P95) subiendo <<<

# 4) Restaurar la CPU y comprobar recuperación
docker update --cpus 4 ticketright-postgres-1
node chaos/if-05-saturacion-cpu.mjs recuperar | tee evidencias/if-05-recuperar.txt
```

**Qué decir:**
- (estable) «8 compras en paralelo, todas se completan rápido.»
- (update 0.1) «Le dejo a la base **apenas el 10% de un núcleo**.»
- (durante) «La **latencia sube** —se pone lento, lo esperado—, pero las compras **se siguen
  completando** y **no hay sobreventa ni discrepancias**. Degrada, no colapsa.»
- (update 4 + recuperar) «Restauro la CPU y vuelve a la velocidad normal.»

**Qué señalar en Grafana:** el panel de **P95 de reserva** subiendo durante la fase y bajando al
restaurar.

> **Importante:** `docker update --cpus 0` **no** quita el límite; hay que fijar un valor alto
> (`--cpus 4`) para restaurar. Si no, la base queda ahogada para el resto de la demo.

---

## Cierre de la sección de fallos

«Cubrimos **cuatro tipos de fallo distintos**: un tercero que falla (la pasarela), un proceso que
se cae, la red/datos (la base), y los recursos (CPU). En los cuatro, las garantías del negocio se
mantuvieron: **cero sobreventa y cero dinero sin boleta**. Y lo más valioso: la inyección de
fallos no fue para lucir un sistema perfecto, sino para **encontrar debilidades** — IF-03
encontró una real y la corregimos.»

## Si algo sale mal en vivo (plan B)

| Síntoma | Qué hacer |
|---|---|
| Un experimento dice «Demasiadas solicitudes» (429) | Pausa el tráfico de demo (Ctrl+C) y vuelve a correrlo |
| Tras IF-03/IF-05 todo va lento | `docker unpause ticketright-postgres-1` y `docker update --cpus 4 ticketright-postgres-1` |
| La app no responde tras IF-02 | Relanza `nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &` |
| No hay tiempo para los 4 en vivo | Muestra IF-01 e IF-03 en vivo y las capturas/salidas `.txt` de IF-02 e IF-05 |

## Referencia

El análisis completo de cada experimento (hipótesis, resultado, aprendizaje) está en la bitácora
de fallos. Los scripts viven en `chaos/`.
