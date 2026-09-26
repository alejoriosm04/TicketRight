# Pruebas de carga — los cuatro escenarios de la volumetría

> Ejecución de los escenarios de la [volumetría](../02-modelamiento/volumetria.md#escenarios-de-prueba)
> (nominal, pico, estrés y resistencia) con **k6** contra la aplicación real. Primera campaña:
> **22 de septiembre de 2026**, en el ambiente local. El arnés está en [`load/`](../../../load/).

## Contenido

| Sección | Qué responde |
|---|---|
| [Cómo se traduce la volumetría a la prueba](#cómo-se-traduce-la-volumetría-a-la-prueba) | ¿Qué hace cada fan virtual, cómo se escala y qué se mide? |
| [Diferencias con el diseño](#diferencias-con-el-diseño) | ¿Dónde la prueba no es literal al diseño, y por qué? |
| [Resultados de la campaña local](#resultados-de-la-campaña-local) | ¿Qué salió en cada escenario? |
| [Lectura de los resultados](#lectura-de-los-resultados) | ¿Qué demuestran para la defensa y qué no? |
| [Cómo correrlo](#cómo-correrlo) | ¿Cómo se repite, en local o en Codespaces? |
| [Pendientes](#pendientes) | ¿Qué falta para cerrar los escenarios? |

## Cómo se traduce la volumetría a la prueba

**Cada iteración de k6 es un fan distinto** que recorre la venta real, igual que en la
plataforma web: consulta el catálogo, entra a la fila, consulta su posición cada ~3 s hasta
que lo admiten, reserva con el JWT de la fila, paga y espera su boleta. Nada de la prueba
entra por una puerta trasera: pasa por el borde de seguridad, la fila, la unidad de trabajo y
la pasarela simulada.

| Parámetro de la volumetría | En la prueba |
|---|---|
| 30.000 fans en 60 s | `ESCALA × 30.000` fans que **llegan** dentro de 60 s (modelo abierto: siguen llegando aunque el sistema se demore) |
| 5.000 boletas | Una localidad de carga con `ESCALA × 5.000` de aforo: se conserva la proporción de **6 fans por boleta** |
| 1,4 boletas por fan `[S]` | 60 % pide una boleta y 40 % pide dos |
| 15 % de abandono de reserva `[S]` | 15 % reserva y no paga; el worker libera la reserva al vencer (R3) |
| Consulta de posición cada 10–15 s `[S]` | Cada ~3 s (configurable con `CONSULTA_FILA_S`): más presión de lectura que la del diseño |
| Perfil operativo (AD-006) | k6 entra como operación y pone el perfil `pico` (admisión de 15 turnos/s) o `cotidiano` en el escenario nominal |

**Qué se mide.** Los umbrales de k6 son los de los atributos:

| Umbral | Atributo |
|---|---|
| Posición en la fila P95 < 1 s | A-10 |
| Reserva P95 < 2 s y error técnico < 1 % | A-10 |
| Solicitudes fallidas (5xx o sin respuesta) < 0,1 % | A-9 |
| ≥ 99 % de los pagos iniciados llegan a un estado final | A-6 |

Al terminar, [`inventario.mjs`](../../../load/inventario.mjs) revisa en PostgreSQL lo que
ninguna respuesta HTTP puede probar: **cero sobreventa** (A-2), que el contador de la
localidad coincide con las reservas y las boletas reales y que **ningún turno compró dos
veces**.

## Diferencias con el diseño

- **`constant-arrival-rate` en vez de `ramping-vus`.** El plan de la entrega proponía
  `ramping-vus`, pero con usuarios virtuales cerrados cada fan espera al anterior, y la carga
  de la volumetría es de **llegadas**: 30.000 personas que llegan en un minuto, se demore o no
  el sistema. Un ejecutor de tasa de llegada reproduce eso.
- **Escalado.** La campaña local corre a `ESCALA=0.05`: 1.500 fans por 250 boletas. La
  proporción y la tasa de admisión son las del diseño; el volumen absoluto no. La corrida a
  escala mayor va en Codespaces.
- **Sin precalentamiento de 30 min.** El perfil `pico` se activa al empezar; en el piloto no
  hay capacidad que escalar antes de la apertura (KEDA vive en el despliegue con minikube).
- **Resistencia acotada.** El diseño pide sostener el pico tres horas. Una ola de pico
  sostenida tres horas haría crecer la fila sin límite: nadie llega a comprar lo que ya se
  agotó en el primer minuto. La prueba sostiene en cambio **una llegada continua de 12 fans/s**
  (80 % de la admisión del perfil `pico`) durante `DURACION`, que ejercita lo mismo que busca
  el diseño: fugas de memoria, conexiones y deriva entre el contador y los hechos.

## Resultados de la campaña local

Ambiente: portátil del equipo (WSL, 4 GB de RAM), PostgreSQL y Prometheus en `docker
compose`, la app en un solo proceso con **la fila en memoria y sin Kafka**, k6 v2.3 por
Docker. Es la medida de un ambiente pequeño, no la del piloto completo. Los resúmenes de k6 y
los informes de inventario están en [`load/resultados/`](../../../load/resultados/).

| Escenario | Carga | Admitidos | Espera en fila P95 | Posición P95 / P99 | Reserva P95 / P99 | Boletas | Sobreventa | Umbrales |
|---|---|---|---|---|---|---|---|---|
| Nominal (2 min) | 50 fans explorando + 1 compra/min | 3 | — | 3,6 ms | 18 ms | 4 | **0** | ✅ |
| Pico | 1.500 fans en 60 s, 250 boletas | 1.502 a 14,5/s | 39,6 s | 2,4 ms / 51 ms | 32 ms / 488 ms | 222 | **0** | ✅ |
| Estrés ×1,5 | 2.250 fans en 60 s, 250 boletas | 2.251 a 14,6/s | 1 min 28 s | 5,0 ms / **1,02 s** | 35 ms / 365 ms | 214 | **0** | ✅ |
| Resistencia (3 min) | 12 fans/s sostenidos | 2.160 a 11,8/s | 3,5 s | 3,2 ms / 3,8 ms | 11 ms / 17 ms | 214 | **0** | ✅ |

En las cuatro corridas: **0 errores técnicos**, **100 % de los pagos iniciados llegaron a
boleta**, el contador de la localidad **coincide** con las reservas y boletas reales y
**ningún turno compró dos veces**. Las boletas que faltan para llegar a 250 son las de las
reservas abandonadas, que siguen vigentes hasta vencer.

## Lectura de los resultados

- **La fila hace su trabajo (AD-006).** En pico y estrés llegan 25 y 37 fans por segundo,
  pero entran al núcleo 14,5–14,6 por segundo: la tasa del perfil `pico`. La multitud se queda
  esperando en la fila y PostgreSQL ve una carga plana; por eso la reserva sigue en P95 de
  ~35 ms mientras la espera en la fila crece de 40 s a casi 1,5 min.
- **Cero sobreventa bajo competencia real (AD-003, A-2).** En pico, 1.325 fans admitidos se
  quedaron sin boleta, rechazados por aforo; ninguno la obtuvo de más. Es la garantía que
  faltaba antes de la
  [corrección del 22 de septiembre](coherencia-implementacion.md#7-hallazgo-posterior-sobreventa-por-falta-de-transacciones),
  cuando 100 reservas simultáneas sobre 50 cupos se aceptaban todas. (Esta campaña no se
  corrió sobre la versión anterior; la comparación es con esa reproducción.)
- **El primer síntoma de degradación está en la fila, no en la base.** En estrés ×1,5 la
  consulta de posición llega a **P99 de 1,02 s** (el P95 sigue en 5 ms). Es la fila en
  memoria de un solo proceso, que recorre todos los turnos en cada consulta; con Redis
  (`zrank`) ese costo no crece igual. Es la señal a vigilar en la corrida con Redis.
- **Lo que se cede.** La espera en la fila crece lineal con la multitud: con ×1,5 un fan
  espera hasta 1,5 min. Es el costo aceptado en AD-006: esperar en orden en vez de competir
  contra la base.

## Cómo correrlo

La app tiene que estar arriba. El guion **resiembra la base** (borra reservas, pagos y
boletas), crea la localidad de carga, corre k6 (binario local o imagen `grafana/k6` por
Docker) y verifica el inventario:

```bash
./load/correr.sh pico                                  # 1.500 fans (ESCALA=0.05)
ESCALA=0.1 ./load/correr.sh pico                       # 3.000 fans por 500 boletas
ESCALA=0.05 MULTIPLICADOR=1.5 ./load/correr.sh estres
ESCALA=0.05 MULTIPLICADOR=2 ./load/correr.sh estres
DURACION=5m ./load/correr.sh nominal
DURACION=30m ./load/correr.sh resistencia
```

En **Codespaces**, primero `bash deploy/arranque-compose.sh` (queda la app con Redis y Kafka)
y luego los mismos comandos. Con Grafana abierto en «Last 15 minutes» se ven la fila, las
reservas y la latencia moverse durante la corrida: son las capturas para la evidencia.

## Pendientes

- ✅ La campaña se repitió en Codespaces con Redis y Kafka, con capturas de Grafana, y está en
  las evidencias del video. `PENDIENTE: registrar aquí sus cifras.`
- `PENDIENTE: A-7 (costo por boleta ≤ COP $150) no se mide aquí: requiere el costo real de la infraestructura del escenario.`
- `PENDIENTE: el multiplicador de quiebre que pide la volumetría; a ×1,5 local solo aparece la señal en la fila.`
