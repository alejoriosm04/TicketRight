# Guía de Codespaces para sacar las evidencias de la Entrega 3

> Paso a paso para levantar TicketRight en GitHub Codespaces, entender qué pasa por detrás y
> capturar el video, las capturas y los resultados que faltan antes del **sábado 26 de
> septiembre de 2026**. Escrita el 22 de septiembre; tiempo total aproximado: **3 horas**.

## Contenido

| Sección | Qué responde |
|---|---|
| [Qué vas a lograr](#qué-vas-a-lograr) | ¿Qué evidencias salen de esta guía y para qué criterio? |
| [Antes de empezar](#antes-de-empezar) | ¿Qué revisar antes de gastar cuota? |
| [Paso 1 · Crear el codespace](#paso-1--crear-el-codespace-5-min) | ¿Cómo se crea la máquina? |
| [Paso 2 · Levantar todo](#paso-2--levantar-todo-5-min) | ¿Cómo se arranca el stack y cómo sé que quedó bien? |
| [Paso 3 · Puertos y piezas](#paso-3--abrir-los-puertos-y-reconocer-cada-pieza-5-min) | ¿Dónde está la app, Grafana y Prometheus? |
| [Paso 4 · Compra y video](#paso-4--recorrido-de-compra-y-video-demo-20-min) | ¿Qué se graba y qué pasa por detrás de cada pantalla? |
| [Paso 5 · Tablero y trazas](#paso-5--tablero-trazas-y-logs-con-tráfico-20-min) | ¿Cómo se capturan las evidencias de observabilidad? |
| [Paso 6 · Alerta](#paso-6--disparar-una-alerta-a-propósito-10-min) | ¿Cómo se dispara una alerta a propósito? |
| [Paso 7 · Los 4 fallos](#paso-7--los-4-experimentos-de-fallos-40-min) | ¿Cómo se repiten IF-01, IF-02, IF-03 e IF-05? |
| [Paso 8 · Carga con k6](#paso-8--pruebas-de-carga-con-k6-6090-min) | ¿Qué corridas de carga hay que hacer? |
| [Paso 9 · Subir evidencias](#paso-9--guardar-las-evidencias-y-subirlas-por-pr-15-min) | ¿Dónde quedan y cómo se suben? |
| [Paso 10 · Apagar](#paso-10--apagar-el-codespace-1-min) | ¿Cómo dejo de gastar cuota? |
| [Lista de chequeo](#lista-de-chequeo-de-evidencias) | ¿Me falta algo? |
| [Si algo falla](#si-algo-falla) | ¿Cómo resuelvo los problemas conocidos? |

## Qué vas a lograr

Al terminar tendrás todas las evidencias que faltan para la Entrega 3. Cada paso explica qué
pasa por detrás, para que puedas defenderlo.

| Evidencia | Criterio de la [rúbrica](rubrica.md) | Paso |
|---|---|---|
| Recorrido de compra grabado (video demo) | 1 · Aplicación funcionando (40 %) | Paso 4 |
| Capturas del tablero de Grafana con tráfico, una traza y logs | 2 · Observabilidad (20 %) | Paso 5 |
| Captura de una alerta disparada | 2 · Observabilidad (20 %) | Paso 6 |
| Capturas del tablero durante cada uno de los 4 fallos | 3 · Simulación y fallos (30 %) | Paso 7 |
| Resultados de k6 con Redis y Kafka, más capturas del pico | Volumetría (apoya criterios 1 y 3) | Paso 8 |

Todo lo que se captura aquí va después a `docs/proyecto/03-implementacion/evidencias/` por un
PR y, tras el merge, a la wiki (Paso 9).

## Antes de empezar

Revisa estas tres cosas antes de crear el codespace para no perder horas de cuota.

- [ ] **Cuota de Codespaces.** El devcontainer pide una máquina de 4 núcleos y 16 GB, que
  gasta horas más rápido que la básica. Revisa tu saldo en GitHub → *Settings → Billing and
  licensing → Usage*.
- [ ] **`main` al día.** Todo lo de esta guía está en `main` desde el PR #16. No trabajes sobre
  una rama vieja.
- [ ] **Captura y grabación.** En Windows: `Win + Shift + S` para capturas y la Herramienta de
  recortes (o `Win + Alt + R` con la barra de juegos) para grabar pantalla.

**Regla de oro:** cada vez que algo cambie en pantalla por una acción tuya, toma la captura
*antes* de pasar al siguiente comando. Las fases con fallo duran segundos.

## Paso 1 · Crear el codespace (5 min)

El codespace es una máquina Linux en la nube con Docker y Node 24 ya instalados; ahí corre
todo el stack que el portátil no aguanta.

1. Abre `github.com/alejoriosm04/TicketRight`.
2. Botón verde **Code → pestaña Codespaces → «…» → New with options**.
3. Elige **Branch: `main`** y **Machine type: 4-core**. Crea el codespace.
4. Espera a que abra VS Code en el navegador. Al crearse corre `npm install` solo (el
   `postCreateCommand` del [devcontainer](../../../.devcontainer/devcontainer.json)); tarda
   2–3 minutos.
5. Abre una terminal (menú **☰ → Terminal → New Terminal**) y comprueba:

```bash
node --version          # v24.x
docker --version        # debe responder sin error
git log --oneline -1    # el último merge de main
```

Si `git log` no muestra el merge del PR #16, corre `git pull`.

## Paso 2 · Levantar todo (5 min)

Un solo comando levanta la infraestructura, prepara la base y deja la app corriendo.

```bash
bash deploy/arranque-compose.sh
```

| Etapa del [script](../../../deploy/arranque-compose.sh) | Qué levanta | Homologa a (AWS) |
|---|---|---|
| 3/5 infraestructura | PostgreSQL 18, Redis 7, Kafka, Prometheus, Grafana, Tempo, Loki, Alloy | Aurora, ElastiCache, MSK y la plataforma de observabilidad |
| 4/5 migración y semilla | Esquema, 8 eventos y las 3 cuentas demo | — |
| 5/5 aplicación | La API de ventas en el puerto 3000, en segundo plano | Los servicios en EKS |

**Cómo saber que quedó bien:** al final debe imprimir `{"ok":true} <- API arriba`. Luego
confirma que la app usó Redis y Kafka, no los respaldos en memoria:

```bash
grep -E "fila de admisión|bus de eventos" observability/logs/ventas-run.log
# esperado: "fila de admisión en Redis (...)" y "bus de eventos en Kafka (...)"
docker compose ps       # los 8 servicios en estado running
```

Si ves «relay de outbox solo-PostgreSQL», Kafka no estaba listo a tiempo: ve a
[Si algo falla](#si-algo-falla).

## Paso 3 · Abrir los puertos y reconocer cada pieza (5 min)

Todo se abre desde la pestaña **PORTS** del panel inferior de VS Code: clic en el globo de
cada puerto. La URL tiene la forma `https://<nombre-del-codespace>-<puerto>.app.github.dev`.

| Puerto | Qué es | Ruta a agregar | Acceso |
|---|---|---|---|
| 3000 | Plataforma web de compra | `/app` | Cuentas demo (abajo) |
| 3000 | Prototipo navegable de la Entrega 2 | `/portal/` | Libre |
| 3001 | Grafana: tablero, trazas y logs | `/d/ticketright-ventas` | `admin` / `admin` |
| 9090 | Prometheus: métricas y alertas | `/alerts` | Libre |

Cuentas de la plataforma: `cliente@ticketright.co` / `cliente123`,
`promotor@ticketright.co` / `promotor123`, `operacion@ticketright.co` / `operacion123`.

Los puertos son **privados**: solo tú los ves. Para que el profesor entre, clic derecho sobre
el puerto → **Port Visibility → Public**, y vuelve a ponerlo privado al terminar.

**Ten abiertas tres pestañas desde ya:** `/app`, Grafana y Prometheus `/alerts`. Las vas a
alternar en todos los pasos.

## Paso 4 · Recorrido de compra y video demo (20 min)

Este recorrido es el video del criterio 1: una compra completa de principio a fin. **Empieza a
grabar antes del primer clic** y narra lo que pasa por detrás con la columna de la derecha.

| # | Pantalla | Qué haces | Qué pasa por detrás | Decisión |
|---|---|---|---|---|
| 1 | Inicio | Busca «bogota» y abre un evento | El catálogo es una lectura sobre PostgreSQL, separada de la escritura (CQRS) | [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md) |
| 2 | Detalle del evento | Clic en **Ver entradas** | Todavía no se pide cuenta: mirar es libre | — |
| 3 | Fila | Espera | Entras a la fila en Redis; admite por lotes y entrega un JWT firmado, de un solo uso y atado a ti | [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md), [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) |
| 4 | Elige tu localidad | Elige localidad en el mapa o la lista, 2 boletas | Aquí no se reserva nada aún | — |
| 5 | Reservar | Clic en **Reservar**; ingresa como `cliente` | Una transacción bloquea la fila de la localidad (`FOR UPDATE`) hasta el COMMIT: cero sobreventa | AD-003 |
| 6 | Tu reserva | Mira el temporizador de 10:00 | La reserva vence sola; un worker libera el cupo | R3 |
| 7 | Datos del titular | Llena nombre, documento, correo y teléfono | Datos mínimos de la boleta nominal. En esta versión se quedan en el navegador; la PII cifrada (AES-256-GCM) es la de las cuentas | AD-004 |
| 8 | Pago | Clic en **Pagar** | SAGA: pago solicitado → webhook de la pasarela → pago confirmado; eventos por el outbox a Kafka | [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) |
| 9 | Tus boletas | Muestra el QR | La boleta se emite en su propio contexto por el puerto `EmisorDeBoletas` | [AD-008](../decisiones/0008-boleta-en-derecho-de-asistencia.md) |

Cierra el video con las vistas internas: sal de la cuenta, entra como `promotor` (menú
**Promotor**: ventas y ocupación) y luego como `operacion` (menú **Operación**: discrepancias y
perfil operativo). En Operación, cambia el perfil a **Pico** y explícalo: sube o baja cuántos
fans admite la fila por segundo (back pressure, AD-006). Déjalo de nuevo en **Cotidiano**.

**Capturas de este paso:** la pantalla 3 (fila), la 9 (boleta con QR) y el panel del promotor.

## Paso 5 · Tablero, trazas y logs con tráfico (20 min)

Un tablero vacío no demuestra nada: primero se genera tráfico constante y después se captura.

1. Abre una **segunda terminal** («+» en el panel de terminales) y deja corriendo el tráfico de
   demo. Mete gente a la fila y completa compras sin parar:

    ```bash
    node apps/ventas/scripts/trafico-demo.mjs
    ```

2. En Grafana abre `/d/ticketright-ventas`. Arriba a la derecha pon el rango en **Last 15
   minutes** y el refresco en **5s**.
3. Espera 3 minutos a que las gráficas tengan forma y captura cada sección:

| Sección del tablero | Qué debe verse | Qué explica |
|---|---|---|
| Resumen de la venta | Dinero vendido subiendo, sobreventa en 0 | Las 3 métricas de negocio de la rúbrica y A-2 |
| Sala de espera y fila | Personas en fila contra admitidas | La fila como válvula (AD-006) |
| Negocio y recinto | Embudo y boletas por tribuna | Del ingreso a la boleta |
| Diagnóstico técnico | Latencia de reserva, HTTP por ruta, conexiones a PostgreSQL | Las 3 métricas técnicas de la rúbrica |
| Registros y trazas | Logs en vivo de Loki | La correlación por `trace_id` |

4. **Captura de una traza:** en *Registros y trazas*, abre una línea de log de `crear_reserva`
   y sigue su enlace a Tempo por `trace_id`. Captura la traza completa: se ven la solicitud
   HTTP y cada consulta a PostgreSQL dentro de la transacción.
5. Detén el tráfico con `Ctrl + C` en esa terminal cuando termines.

El detalle de métricas, tablero y alertas está en
[`observability/README.md`](../../../observability/README.md).

## Paso 6 · Disparar una alerta a propósito (10 min)

La app se reinicia sin reintentos de emisión: cada pago confirmado queda como «cobro sin
boleta», abre una discrepancia y la alerta de A-1 se dispara. Probado en local el 22 de
septiembre.

1. Reinicia la app en ese modo y haz una compra:

    ```bash
    pkill -f "tsx src/main.ts"
    MAX_INTENTOS_EMISION=0 nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &
    sleep 8
    npm run e2e -w @ticketright/ventas
    ```

    El e2e termina con `la compra quedó en enConciliacion`. **Es lo esperado**, no un error.

2. Abre Prometheus `/alerts`. A los ~10 s `DiscrepanciasAbiertas` pasa a **FIRING**:
   **captura**. Al minuto se suma `DiscrepanciaAbiertaProlongada`: **captura** también.
3. En `/app`, entra como `operacion` y abre **Operación**: debe decir que hay 1 pago
   confirmado sin boleta. **Captura**: es la misma alerta vista desde el negocio.
4. Vuelve a la normalidad (la semilla borra la discrepancia):

    ```bash
    pkill -f "tsx src/main.ts"
    npm run db:seed -w @ticketright/ventas
    nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &
    ```

Qué defiendes con esto: el dinero cobrado sin boleta nunca pasa en silencio. Queda en
conciliación, se ve en el tablero y dispara una alerta (A-1).

## Paso 7 · Los 4 experimentos de fallos (40 min)

Cada experimento imprime su foto de métricas y termina en **APROBADO** o **FALLIDO**. La
salida se guarda con `tee` como evidencia, y el tablero se captura justo al terminar la fase
con el fallo activo. Las hipótesis vienen del
[catálogo de inyección de fallos](../02-modelamiento/inyeccion-de-fallos.md).

**Preparación (una vez):**

```bash
mkdir -p evidencias
docker ps --format '{{.Names}}' | grep postgres   # debe decir ticketright-postgres-1
```

Si el nombre es otro, cámbialo en los comandos de IF-03 e IF-05. En Grafana pon el rango en
**Last 5 minutes** y el refresco en **5s**.

### IF-01 · La pasarela repite la confirmación

Hipótesis: aunque el mismo webhook llegue 3 veces seguidas y luego 5 veces a la vez, se emite
una sola vez (A-1).

```bash
node chaos/if-01-pasarela-tardia-repetida.mjs | tee evidencias/if-01.txt
```

**Captura:** la salida de la terminal (fase 1 y fase 2 con 2 boletas cada una) y el panel de
pagos por estado.

### IF-02 · Se reinicia el coordinador con pagos en curso

Hipótesis: el estado vive en PostgreSQL, no en el proceso; tras reiniciar, las 5 compras
terminan bien y sin duplicar.

```bash
node chaos/if-02-reinicio-coordinador.mjs preparar | tee evidencias/if-02-preparar.txt
pkill -f "tsx src/main.ts"          # ← el fallo: se cae el coordinador
nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &
node chaos/if-02-reinicio-coordinador.mjs verificar | tee evidencias/if-02-verificar.txt
```

**Captura:** la salida de `verificar` (5 compras en `emitida`) y el tablero con el hueco del
reinicio. Las métricas del proceso vuelven a cero; es normal, porque el negocio vive en la
base.

### IF-03 · PostgreSQL deja de responder

Hipótesis: ninguna reserva se confirma sin base; se rechazan de forma acotada y el sistema se
recupera solo.

```bash
node chaos/if-03-postgres-no-disponible.mjs estable | tee evidencias/if-03-estable.txt
docker pause ticketright-postgres-1      # ← el fallo
node chaos/if-03-postgres-no-disponible.mjs durante | tee evidencias/if-03-durante.txt
```

**Captura aquí, antes de reanudar:** el tablero con los errores HTTP y la latencia de reserva.
La fase dura ~20 s (4 intentos rechazados en ~4 s cada uno).

```bash
docker unpause ticketright-postgres-1
node chaos/if-03-postgres-no-disponible.mjs recuperar | tee evidencias/if-03-recuperar.txt
```

### IF-05 · La base se queda sin CPU

Hipótesis: sube la latencia pero las compras en curso se completan (degradación, no caída).

```bash
node chaos/if-05-saturacion-cpu.mjs estable | tee evidencias/if-05-estable.txt
docker update --cpus 0.1 ticketright-postgres-1   # ← el fallo
node chaos/if-05-saturacion-cpu.mjs durante | tee evidencias/if-05-durante.txt
```

**Captura aquí:** el panel de latencia de reserva (P95) subiendo. Luego restaura:

```bash
docker update --cpus 4 ticketright-postgres-1
node chaos/if-05-saturacion-cpu.mjs recuperar | tee evidencias/if-05-recuperar.txt
```

Referencia: en la campaña local del 22 de septiembre los 4 salieron aprobados
([bitácora de fallos](bitacora-de-fallos.md#segunda-campaña--22-de-septiembre)). Si alguno sale
FALLIDO en Codespaces, guárdalo igual: también es un resultado para la bitácora.

## Paso 8 · Pruebas de carga con k6 (60–90 min)

La [campaña local](pruebas-de-carga.md#resultados-de-la-campaña-local) corrió sin Redis ni
Kafka; aquí se repite con el stack completo, que es la medida que vale para la defensa. k6 no
hay que instalarlo: el script usa la imagen `grafana/k6` por Docker.

Cada corrida **resiembra la base** (borra compras y boletas), crea una localidad de carga con
aforo escalado, lanza la ola de fans y al final verifica en PostgreSQL que no hubo sobreventa.
Asegúrate de que la app esté en modo normal (Paso 6, punto 4).

| # | Comando | Carga | Duración |
|---|---|---|---|
| 1 | `./load/correr.sh pico \| tee evidencias/k6-pico-005.txt` | 1.500 fans en 60 s por 250 boletas | 3 min |
| 2 | `ESCALA=0.1 ./load/correr.sh pico \| tee evidencias/k6-pico-01.txt` | 3.000 fans por 500 boletas | 5 min |
| 3 | `MULTIPLICADOR=1.5 ./load/correr.sh estres \| tee evidencias/k6-estres-15.txt` | 2.250 fans | 4 min |
| 4 | `MULTIPLICADOR=2 ./load/correr.sh estres \| tee evidencias/k6-estres-2.txt` | 3.000 fans | 5 min |
| 5 | `DURACION=5m ./load/correr.sh nominal \| tee evidencias/k6-nominal.txt` | 50 fans explorando + 1 compra/min | 6 min |
| 6 | `DURACION=30m ./load/correr.sh resistencia \| tee evidencias/k6-resistencia.txt` | 12 fans/s sostenidos | 32 min |

**Durante la corrida 1 (pico), en Grafana con rango Last 15 minutes, captura:**

- *Sala de espera y fila*: personas en fila creciendo mientras las admitidas suben a ritmo
  fijo (~15 por segundo). Es la imagen que demuestra AD-006.
- *Diagnóstico técnico*: latencia de reserva plana aunque la fila crezca.
- *Negocio y recinto*: la localidad «Prueba de carga (k6)» llenándose hasta agotarse.

**Al final de cada corrida** la terminal debe decir `umbrales de k6: cumplidos` e
`inventario (A-2): sin sobreventa`. Si un umbral falla, no lo repitas para que salga verde:
anótalo, porque es el punto de quiebre que pide la
[volumetría](../02-modelamiento/volumetria.md#escenarios-de-prueba). Los JSON de resultados
quedan en `load/resultados/`.

## Paso 9 · Guardar las evidencias y subirlas por PR (15 min)

Las capturas quedan en tu computador y las salidas de terminal en el codespace. Todo termina
en `docs/proyecto/03-implementacion/evidencias/`, por un PR, porque `main` está protegido.

1. **Nombra las capturas** así antes de subirlas, para que la bitácora pueda enlazarlas:
   `<paso>-<qué>.png`, por ejemplo `05-tablero-resumen.png`, `06-alerta-firing.png`,
   `07-if-03-durante.png`, `08-k6-pico-fila.png`.
2. En VS Code del codespace, crea la carpeta `docs/proyecto/03-implementacion/evidencias/` y
   **arrastra las capturas** desde el Explorador de Windows al panel de archivos.
3. En la terminal, mueve las salidas y abre el PR:

    ```bash
    git checkout -b evidencias-entrega-3
    mv evidencias/*.txt docs/proyecto/03-implementacion/evidencias/
    git add docs/proyecto/03-implementacion/evidencias load/resultados
    git commit -m "agrega las evidencias de Codespaces: observabilidad, fallos y carga"
    git push -u origin evidencias-entrega-3
    gh pr create --fill
    ```

4. **El video no va al repo:** GitHub rechaza archivos de más de 100 MB. Súbelo a Drive o a
   YouTube como no listado y pega el enlace en el PR.
5. Tras el merge se actualizan la [bitácora de fallos](bitacora-de-fallos.md) y
   [`pruebas-de-carga.md`](pruebas-de-carga.md) con los números y las capturas de Codespaces,
   y se republica la wiki.

## Paso 10 · Apagar el codespace (1 min)

Un codespace encendido sigue gastando cuota aunque cierres la pestaña, hasta que se suspende
solo por inactividad (30 min por defecto).

1. Confirma que el PR del Paso 9 quedó creado (`gh pr view --web`).
2. En `github.com/codespaces`, en tu codespace: **«…» → Stop codespace**.
3. No lo borres hasta que el PR tenga merge: si falta una captura, lo vuelves a encender y
   todo sigue ahí (base, imágenes de Docker, carpeta `evidencias/`).

## Lista de chequeo de evidencias

Si todo está marcado, no falta nada de lo que depende de Codespaces.

**Aplicación (criterio 1)**

- [ ] Video del recorrido completo, con promotor y operación (enlace en el PR)
- [ ] `04-fila.png`, `04-boleta-qr.png`, `04-promotor.png`

**Observabilidad (criterio 2)**

- [ ] Las 5 secciones del tablero con tráfico (`05-tablero-*.png`)
- [ ] Una traza completa en Tempo (`05-traza.png`)
- [ ] Alerta en FIRING (`06-alerta-firing.png`) y la vista de Operación
  (`06-operacion-discrepancia.png`)

**Fallos (criterio 3)**

- [ ] IF-01: `if-01.txt` + captura
- [ ] IF-02: `if-02-preparar.txt`, `if-02-verificar.txt` + captura
- [ ] IF-03: `if-03-estable.txt`, `if-03-durante.txt`, `if-03-recuperar.txt` + captura durante
  la pausa
- [ ] IF-05: `if-05-estable.txt`, `if-05-durante.txt`, `if-05-recuperar.txt` + captura de la
  latencia

**Carga (volumetría)**

- [ ] Las 6 corridas `k6-*.txt` y sus JSON en `load/resultados/`
- [ ] Capturas del pico: fila, latencia y localidad agotada (`08-k6-*.png`)

**Cierre**

- [ ] PR `evidencias-entrega-3` creado
- [ ] Codespace detenido

## Si algo falla

Los problemas más probables, con la causa y lo que los resuelve.

| Síntoma | Causa | Solución |
|---|---|---|
| El log dice «relay de outbox solo-PostgreSQL» | Kafka tardó más de 15 s en quedar listo | Espera 30 s y reinicia la app: `pkill -f "tsx src/main.ts"` y el `nohup npm run dev …` del Paso 6 |
| Tras reencender el codespace nada responde | Al detenerlo se apagan contenedores y app | `docker compose up -d postgres redis kafka prometheus grafana tempo loki alloy` y luego el `nohup npm run dev …` |
| En `/app` sale «Verificación requerida» o «Demasiadas solicitudes» | La web y `trafico-demo.mjs` usan el mismo fan de demo; el borde de seguridad los cuenta juntos (AD-004) | Detén el tráfico de demo (`Ctrl + C`) mientras grabas o navegas |
| La fila nunca te admite | El perfil operativo quedó en Preparación o Recuperación (admiten 0) | Entra como `operacion` y pon el perfil en **Cotidiano** |
| Grafana con paneles vacíos | Prometheus no alcanza la app | Prometheus `/targets`: `ticketright-ventas` debe estar UP; si no, revisa `curl localhost:3000/health` |
| Todo va lento después de IF-03 o IF-05 | PostgreSQL quedó en pausa o con 0,1 CPU | `docker unpause ticketright-postgres-1` y `docker update --cpus 4 ticketright-postgres-1` |
| k6 dice «la app no responde» | La app no está corriendo o quedó con `MAX_INTENTOS_EMISION=0` | Paso 6, punto 4 |
| `git push` rechazado | Estás en `main`, que está protegido | `git checkout -b evidencias-entrega-3` y vuelve a hacer el push |

Si algo no está en la tabla, copia el mensaje de error completo y el comando que lo produjo, y
compártelo con el equipo.
