# Bitácora de inyección de fallos — Entrega 3, criterio 3

Ejecución real de los cuatro experimentos elegidos del
[catálogo de inyección de fallos](../02-modelamiento/inyeccion-de-fallos.md) (IF-01, IF-02,
IF-03 e IF-05), con la [observabilidad](../02-modelamiento/observabilidad.md) ya instrumentada
como sistema de medición. Cada experimento sigue el
[ciclo del diseño](../02-modelamiento/inyeccion-de-fallos.md#ciclo-de-un-experimento) y usa el
[formato de bitácora](../02-modelamiento/inyeccion-de-fallos.md#evidencia-y-criterios-de-aceptación).

## Ambiente y mecanismo

El diseño propone **Chaos Mesh sobre Kubernetes**; el profesor aceptó un ambiente local o
simulado ([transcripción §16](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación)).
La campaña se ejecutó sobre el ambiente local de `docker compose` con mecanismos equivalentes,
sin modificar el código de negocio:

| Perturbación del diseño | Equivalente local ejecutado |
|---|---|
| `NetworkChaos` / pasarela tardía y duplicada | Reenvío del mismo webhook con la misma clave de idempotencia |
| `PodChaos` sobre el coordinador SAGA | Reinicio del proceso de `apps/ventas` con pagos en curso |
| `NetworkChaos` sobre PostgreSQL | `docker pause` del contenedor de PostgreSQL |
| `StressChaos` de CPU | `docker update --cpus 0.1` sobre el contenedor de PostgreSQL |

El arnés vive en [`chaos/`](../../../chaos/): un script por experimento más `lib.mjs`
(consultas a Prometheus, recorrido de compra y foto de métricas). Cada corrida imprime la foto
de métricas antes, durante y después, y decide **aprobado/fallido** según la hipótesis.

> **Nota de versión.** Fecha de la campaña: 21 de septiembre de 2026. Versión: incremento 2 de
> `apps/ventas`. Las métricas de Prometheus se reinician cuando se reinicia el proceso (IF-02);
> esto es correcto porque el estado de negocio vive en PostgreSQL, no en el proceso.

> **Corrección del 22 de septiembre.** El criterio «0 sobreventa» de IF-01, IF-02 e IF-03 se
> midió con `ticketright_oversell_total`, que en esa versión **nunca se incrementaba**: valía 0
> pasara lo que pasara. Además, IF-01 reenvió los webhooks uno tras otro; enviados **a la
> vez**, un pago de una boleta emitía siete. Ambas cosas quedaron corregidas y documentadas en
> el [hallazgo de sobreventa](coherencia-implementacion.md#7-hallazgo-posterior-sobreventa-por-falta-de-transacciones);
> los demás criterios de cada experimento se sostienen. La campaña se repitió completa ese
> mismo día: ver la [segunda campaña](#segunda-campaña--22-de-septiembre).

---

## IF-01 — La pasarela responde tarde y repite la confirmación

| Campo | Contenido |
|---|---|
| **Identificación** | IF-01 · 21 sep 2026 · ambiente local · tipo: tercero/negocio |
| **Hipótesis** | Aunque el webhook llegue varias veces con la misma clave de idempotencia, se conserva **una sola** intención de pago y **una sola** emisión; la compra termina en boleta emitida sin cobro ni boleta duplicada. |
| **Perturbación** | Tras solicitar el pago, se reenvía **tres veces** el mismo webhook de confirmación (misma referencia y clave). Equivale a la respuesta duplicada de la pasarela. |
| **Resultado** | **APROBADO.** Los tres webhooks devolvieron `200`; la compra quedó en `emitida` con **exactamente 2 boletas**, pago `confirmado`, **0 discrepancias**, **0 sobreventa**. |
| **Evidencia** | `chaos/if-01-pasarela-tardia-repetida.mjs`; verificación por-compra (2 boletas, no 4 ni 6); métricas `ticketright_payments_total{state="confirmado"}`, `ticketright_open_discrepancies=0`, `ticketright_oversell_total=0`. |
| **Aprendizaje** | La idempotencia de `Pago.registrarConfirmacion` (una segunda confirmación no genera nueva transición) sostiene el atributo **A-1** bajo webhook repetido, tal como diseñó la SAGA. |
| **Acción** | Ninguna correctiva; la defensa funciona. Se conserva el script como prueba de regresión. |
| **Repetición** | Reproducible ejecutando el script; resultado estable. |

---

## IF-02 — Reinicio del coordinador de pago durante el procesamiento

| Campo | Contenido |
|---|---|
| **Identificación** | IF-02 · 21 sep 2026 · ambiente local · tipo: proceso |
| **Hipótesis** | Si el proceso que coordina la SAGA se reinicia con pagos en curso, el estado durable (PostgreSQL + outbox) permite retomar sin perder el pago ni duplicar el efecto monetario o la emisión. |
| **Perturbación** | Se crean **5 compras** con el pago solicitado pero sin confirmar (in-flight), se **reinicia el proceso** de `apps/ventas` y, tras el reinicio, se confirma cada webhook **dos veces**. |
| **Resultado** | **APROBADO.** Las 5 compras **sobrevivieron al reinicio**; cada una terminó en `emitida` con 2 boletas, **0 discrepancias**, **0 sobreventa**, pese al webhook doble. |
| **Evidencia** | `chaos/if-02-reinicio-coordinador.mjs` (fases `preparar`/`verificar`, estado en `chaos/estado-if02.json`); verificación por-compra tras el reinicio. |
| **Aprendizaje** | El estado de negocio es **durable en PostgreSQL**, no en memoria: el reinicio no pierde pagos ni compras. La idempotencia absorbe la reentrega. Sostiene **A-1** y la SAGA de [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md). |
| **Acción** | Ninguna correctiva. |
| **Repetición** | Reproducible con las dos fases alrededor de un reinicio del proceso. |

---

## IF-03 — PostgreSQL deja de estar disponible para nuevas reservas

| Campo | Contenido |
|---|---|
| **Identificación** | IF-03 · 21 sep 2026 · ambiente local · tipo: red/datos |
| **Hipótesis** | Si inventario pierde acceso a PostgreSQL, **ninguna reserva se confirma** sin transacción durable; el sistema responde con rechazo controlado y **sin sobreventa**, y se recupera al restaurar la base. |
| **Perturbación** | `docker pause ticketright-postgres-1`. Con la base congelada se intentan **4 reservas**; luego `docker unpause` y una compra de recuperación. |
| **Resultado** | **APROBADO.** Durante el fallo: **4/4 reservas rechazadas** de forma controlada (`500` en ~2 s por el timeout acotado), **0 confirmadas sin base**, **0 sobreventa**. Tras restaurar: compra nueva `emitida`. |
| **Evidencia** | `chaos/if-03-postgres-no-disponible.mjs` (fases `estable`/`durante`/`recuperar`); `ticketright_reservation_errors_total` sube durante el fallo, `ticketright_oversell_total=0`. |
| **Aprendizaje (debilidad encontrada)** | La primera corrida **colgó el servicio**: sin timeout de cliente, las consultas a una base congelada se bloqueaban, y un rechazo no atendido del relay de outbox **tumbaba el proceso**. Es exactamente el tipo de hallazgo que busca la inyección de fallos. |
| **Acción (correctiva, aplicada)** | 1) Timeouts acotados en el pool de PostgreSQL (`connectionTimeoutMillis`, `statement_timeout` y **`query_timeout` de cliente**, este último necesario porque un servidor congelado no puede hacer cumplir `statement_timeout`). 2) El relay de outbox ahora captura errores y **reintenta en el siguiente tic** en vez de propagar el fallo. 3) Red de seguridad `unhandledRejection` en `main.ts`. Archivos: `apps/ventas/src/db/connection.ts`, `.../adapters/outbox.ts`, `.../main.ts`. |
| **Repetición** | Tras las correcciones, el experimento se repitió y **aprobó**: rechazo acotado en ~2 s, sin colgar el servicio, con recuperación limpia. |

---

## IF-05 — Saturación de CPU en un componente crítico

| Campo | Contenido |
|---|---|
| **Identificación** | IF-05 · 21 sep 2026 · ambiente local · tipo: recursos |
| **Hipótesis** | Bajo presión de CPU aumenta la latencia, pero las compras en curso **conservan su tasa de finalización** (degradación controlada, no caída) y el sistema vuelve a la línea base al retirar la presión, sin sobreventa. |
| **Perturbación** | `docker update --cpus 0.1 ticketright-postgres-1` (se restringe la CPU de la autoridad de inventario) mientras se ejecuta un lote de **8 compras concurrentes**. |
| **Resultado** | **APROBADO.** Línea base: 8/8 en 1,6 s, P95 de reserva **0,049 s**. Durante la saturación: **8/8 compras completadas**, P95 subió a **~4,7 s** (degradación esperada), **0 sobreventa**, **0 discrepancias**. Recuperación: 8/8 tras restaurar la CPU. |
| **Evidencia** | `chaos/if-05-saturacion-cpu.mjs` (fases `estable`/`durante`/`recuperar`); `ticketright_reservation_duration_seconds` (P95) y finalización de compras. |
| **Aprendizaje** | La saturación se manifiesta como **latencia**, no como pérdida de integridad: el aforo y la correspondencia dinero–boleta se conservan bajo presión (A-2, A-1). Sostiene la degradación controlada de **A-6**. |
| **Acción (operativa)** | En Docker Desktop, `docker update --cpus 0` **no** quita el límite; hay que fijar un valor alto para restaurar. Documentado en el arnés para evitar dejar la base ahogada tras el experimento. |
| **Repetición** | Reproducible; resultado estable tras restaurar la CPU. |

---

## Segunda campaña — 22 de septiembre

Se repitieron los cuatro experimentos sobre la versión con **unidad de trabajo**, **turno de
un solo uso** y **métrica de sobreventa calculada desde las tablas**. Ambiente: `docker
compose` local con PostgreSQL y Prometheus, fila en memoria. Cambios al arnés:

- `lib.mjs` resuelve las tribunas por nombre desde el catálogo; el seed del incremento 5 ya
  no crea los ids fijos `2222…` y el arnés no corría.
- La foto final de cada experimento espera dos ciclos de medición (11 s): el colector y
  Prometheus tardan hasta 10 s en reflejar la sobreventa.
- IF-01 agrega una **fase 2**: el mismo webhook cinco veces **a la vez**.
- IF-05 usa ocho fans distintos. Con un solo fan, el borde de seguridad del incremento 4 lo
  retaba como bot (429) y el lote terminaba **0/8 incluso en la línea base**: el experimento
  dejó de funcionar el día que se agregó el borde y nadie lo había vuelto a correr.

| Experimento | Resultado | Lo medido |
|---|---|---|
| IF-01 | ✅ Aprobado | Fase 1 (3 webhooks en serie): 2 boletas, 0 discrepancias. Fase 2 (5 webhooks simultáneos, cinco `200`): 2 boletas, 0 discrepancias. Sobreventa 0. Antes de la corrección, la fase 2 emitía de más (1 boleta pedida → 7 emitidas en la prueba de integración) |
| IF-02 | ✅ Aprobado | 5 pagos en curso; tras el reinicio las 5 compras terminaron en `emitida` con 2 boletas cada una, 0 discrepancias, sobreventa 0 |
| IF-03 | ✅ Aprobado | Con PostgreSQL en pausa: 4/4 reservas rechazadas (`500` en **~4,0 s**, antes ~2 s: la transacción espera primero una conexión del pool), 0 confirmadas, sobreventa 0. Al reanudar, la compra de control termina en `emitida` |
| IF-05 | ✅ Aprobado | Línea base 8/8 en 1,4 s (P95 de reserva 0,09 s); con la CPU de PostgreSQL en 0,1: 8/8 en 4,8 s (P95 0,38 s); al restaurar, 8/8 en 2,1 s. Sobreventa 0, discrepancias 0 |

`PENDIENTE: capturas del tablero de Grafana durante cada fallo para el video; esta campaña corrió sin Grafana por la memoria de la máquina local.`

## Resumen de la campaña

| Experimento | Tipo | Resultado | Invariante conservada |
|---|---|---|---|
| IF-01 | Tercero / negocio | ✅ Aprobado | Una sola boleta y un solo cobro con webhook repetido (A-1) |
| IF-02 | Proceso | ✅ Aprobado | Estado durable sobrevive al reinicio, sin duplicar (A-1) |
| IF-03 | Red / datos | ✅ Aprobado (con corrección) | Cero confirmaciones sin base; rechazo acotado; cero sobreventa (A-2) |
| IF-05 | Recursos | ✅ Aprobado | Degradación por latencia, no por pérdida de integridad (A-6) |

Los cuatro experimentos cubren **tipos de fallo diferentes** (tercero, proceso, red/datos y
recursos), como pide la rúbrica. El más valioso para la defensa es **IF-03**: la inyección de
fallos cumplió su propósito real —encontrar una debilidad (el servicio se colgaba y podía
caerse ante una base congelada) y **corregirla**, verificando la mejora con una segunda
ejecución—, que es justo el ciclo de la [ingeniería del caos](../02-modelamiento/inyeccion-de-fallos.md#ciclo-de-un-experimento).

## Cómo reproducir

```bash
docker compose up -d postgres prometheus grafana tempo loki alloy
npm run db:migrate -w @ticketright/ventas && npm run db:seed -w @ticketright/ventas
npm run dev -w @ticketright/ventas           # en otra terminal

node chaos/if-01-pasarela-tardia-repetida.mjs
node chaos/if-02-reinicio-coordinador.mjs preparar   # reiniciar el proceso; luego:
node chaos/if-02-reinicio-coordinador.mjs verificar
# IF-03: node ... estable → docker pause → node ... durante → docker unpause → node ... recuperar
# IF-05: node ... estable → docker update --cpus 0.1 → node ... durante → docker update --cpus 4 → node ... recuperar
```
