# Coherencia entre el modelamiento y la implementación

> Auditoría del **22 de septiembre de 2026**. Contrasta el diseño de la Entrega 2
> (guía oficial, en [`../02-modelamiento/`](../02-modelamiento/README.md)) con el código
> implementado, para el criterio 6 de la [rúbrica](rubrica.md) (coherencia, hasta −10 %).
> Complementa el mapeo ADR→código de [`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md).

El diseño manda (regla del `AGENTS.md`). Donde la implementación difiere, aquí se dice **qué**
difiere, **por qué** y si es una **desviación deliberada** (con su justificación) o una
**deuda** por cerrar. No se ocultan diferencias: eso es lo que penaliza el criterio 6.

## 1. Veredicto rápido

| Área | Coherencia | Nota |
|---|---|---|
| Flujo de compra (diagrama de secuencia) | 🟢 Alta | Los 5 pasos de la SAGA están implementados en el orquestador y las rutas |
| Límites transaccionales `[COMMIT]` (AD-003) | 🟢 Corregido | No existían y había sobreventa; corregido el 22 sep (ver §7) |
| Frontera de contextos y emisión (AD-008) | 🟢 Exacta | `Boleta` en `entitlements`, emisión por `EmisorDeBoletas` de `shared-kernel` |
| Reglas de negocio R1–R14 | 🟢 Alta | Los 21 casos del plan de pruebas en verde cubren las reglas |
| Infraestructura (ADR / arq. de implementación) | 🟢 Alta (piloto) | Homólogos locales documentados; AWS es diseño, no despliegue |
| Observabilidad | 🟢 Alta | Las 3+3 métricas de la rúbrica y el catálogo del diseño instrumentados |
| Riqueza del dominio por contexto | 🟢 Alta | `event-catalog` ya implementa `Evento`/`Recinto`/`Promotor` como dominio; **12/12 raíces con código** (ver §3) |
| Detalles de fidelidad del diagrama | 🟡 Menor | Orden de dos mensajes y algún parámetro difieren (ver §4) |

## 2. Lo que coincide con el diseño

- **Contextos acotados.** Existen los cinco paquetes del modelo: `event-catalog`,
  `admission-identity`, `sales`, `entitlements`, `shared-kernel`
  ([AD-005](../decisiones/0005-estilo-de-arquitectura.md), tabla de contextos del
  [modelo de dominio](../02-modelamiento/modelo-de-dominio.md)).
- **SAGA de compra.** `OrquestadorDeCompra`
  ([`purchase.ts`](../../../packages/sales/src/application/purchase.ts)) implementa los cinco
  pasos del [diagrama de secuencia](../02-modelamiento/diagrama-de-secuencia.md): reservar
  (admisión → `obtenerParaActualizar` → `Localidad.reservar` → `Reserva.crear` → compra
  `reservada`), iniciar pago (202 + `PagoSolicitado`), confirmar (verifica firma, idempotencia
  de webhook repetido, `PagoConfirmado`), emitir (`Localidad.vender` + `Boleta.emitir` +
  `Reserva.confirmar`, con `Discrepancia` si no cierra) y vencer reservas (worker idempotente
  que nunca toca un pago confirmado).
- **Frontera de emisión (AD-008).** `Boleta` y su agregado viven en
  [`entitlements`](../../../packages/entitlements/src/domain/ticket.ts); el orquestador de
  `sales` **nunca importa** `entitlements`: depende del puerto `EmisorDeBoletas`
  ([`ticket-issuance.ts`](../../../packages/shared-kernel/src/ticket-issuance.ts)) y el cruce
  ocurre en el adaptador
  [`EmisorDeBoletasPostgres`](../../../apps/ventas/src/adapters/postgres/ticket-issuer.ts).
- **Autoridad del aforo (AD-003).** La localidad decide el aforo en PostgreSQL; Redis solo
  autoriza a intentar. Verificado en `inventory.ts` y `waiting-room-redis.ts`.
- **Infraestructura.** Redis para la fila (AD-006), Kafka para el bus con outbox→relay→DLQ
  (AD-002), borde de seguridad y cuentas con rol (AD-004), KEDA por lag. El mapeo AWS→piloto
  está en [`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md).

## 3. Contexto «Oferta de eventos»: dominio implementado, gestión acotada

El [modelo de dominio](../02-modelamiento/modelo-de-dominio.md) define en *Oferta de eventos*
las raíces **Promotor**, **Recinto**, **Evento** (y los VO `Convenio`, `ReglasVenta`,
`ReglasReventa`, `Cancelacion`). Estos **ya están implementados** en el paquete
[`event-catalog`](../../../packages/event-catalog/src/domain/) (antes estaba vacío):

- `Recinto` con `aforoMaximo` y la verificación de **R1** (la suma de aforos de localidades no
  supera el techo del recinto) — [`venue.ts`](../../../packages/event-catalog/src/domain/venue.ts).
- `Promotor` + `Convenio` (con vigencia y firma) — [`promoter.ts`](../../../packages/event-catalog/src/domain/promoter.ts).
- `Evento` con su ciclo de vida `borrador → publicado → enVenta → ventaCerrada → realizado`
  (+ rama `cancelado`), `PerfilDemanda` (`cotidiano`/`masivo`) y los VO `ReglasVenta`,
  `ReglasReventa`, `Cancelacion` — [`event.ts`](../../../packages/event-catalog/src/domain/event.ts).

Con esto, **las 12 raíces de agregado del modelo tienen código** (la 13.ª conceptual,
`Identidad`, se mantiene deliberadamente como `IdOpaco` por AD-004). Hay pruebas en
[`event-catalog/tests`](../../../packages/event-catalog/tests/).

- **Lo que sigue acotado (deliberado):** la *gestión* del catálogo por el promotor (alta de
  eventos y recintos, edición de convenios) no tiene aún capa de aplicación/adaptadores ni UI;
  el catálogo que consume la plataforma sigue siendo una **lectura CQRS** sobre las tablas
  `eventos`/`localidades` ([`routes.ts`](../../../apps/ventas/src/http/routes.ts), `GET /catalogo`).
  El dominio existe y protege sus reglas; falta el flujo de administración, fuera del escenario
  de la demo y de los 21 casos de prueba.
- **Clasificación:** el hueco de raíces sin código **quedó cerrado**; la gestión del catálogo
  es deuda acotada y declarada.

Igualmente, `admission-identity` y `entitlements` tienen **solo la capa `domain`** poblada;
sus `application/ports/adapters` están vacíos y los adaptadores reales (fila en Redis, emisor
de boletas) viven en el *composition root* `apps/ventas`. Es un patrón válido de raíz de
composición, pero difiere de la lectura literal de «hexágono completo dentro de cada paquete».

## 4. Diferencias menores de fidelidad al diagrama

Ninguna cambia el comportamiento verificado por las pruebas; se registran por honestidad.

1. **Orden de dos mensajes en la emisión.** El diagrama pone `Localidad.vender` (4.1) antes de
   `Boleta.emitir` (4.2). El código emite la boleta y luego marca la venta, por ítem, en la
   misma unidad de trabajo (`emitirBoletas` en `purchase.ts`). El resultado transaccional es el
   mismo; solo cambia el orden de dos llamadas dentro de la transacción.
2. **`limiteA1` (15 min).** El diagrama de clases parametriza la conciliación por una duración
   `limiteA1`. El orquestador la aproxima por `maxIntentosEmision` (reintentos acotados) y la
   discrepancia `cobroSinBoleta`; la métrica `ticketright_oldest_discrepancy_age_seconds`
   vigila el umbral de 15 min. Mismo objetivo (A-1), parametrización distinta.
3. **Firma de `Boleta.emitir`.** El diagrama la define como `emitir(item, pago, titular)`; la
   implementación usa un DTO `DatosDeEmision` (shared-kernel). Es el ajuste que **AD-008**
   anticipa para no acoplar `sales` con `entitlements`, ya registrado.
4. **Límites transaccionales.** El orquestador marca cada `[COMMIT]` del diagrama con el
   puerto `UnidadDeTrabajo` y el adaptador `BaseTransaccional` hace `BEGIN`/`COMMIT`. Esta
   auditoría decía antes que los adaptadores ya lo resolvían; no era así, y se corrigió (§7).
   El puerto es una pieza nueva frente a las 39 clases del diagrama: realiza el `Transaccion`
   que el diagrama ya nombra en los adaptadores. La emisión confirma aparte del pago (4.4
   separado de 3.3), así que un fallo al emitir abre la conciliación sin deshacer el cobro.
5. **Reintentos con backoff y circuit breaker.** El disyuntor completo es deuda declarada en
   [`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md).

## 5. Estado de las evidencias de la rúbrica

| Criterio | Estado | Evidencia / pendiente |
|---|---|---|
| 1 · Aplicación (40 %) | 🟢 | App + plataforma web `/app`; **pendiente** el video demo |
| 2 · Observabilidad (20 %) | 🟢 | 3+3 métricas instrumentadas, tablero y **15 alertas** ligadas a atributos; **pendiente** capturas/video |
| 3 · Fallos (30 %) | 🟢 | IF-01/02/03/05 aprobados; **pendiente** capturas del tablero por fallo |
| 4 · Patrones (10 %) | 🟢 | [`patrones.md`](patrones.md); **pendiente** capturas de código |
| 5 · Autoevaluación (+10 %) | 🟢 | Escrita en [`autoevaluacion.md`](autoevaluacion.md) |
| 6 · Coherencia (−10 %) | 🟢 | Este documento + `fidelidad-arquitectonica.md`; cobertura en CI; 12/12 raíces con código |

## 6. Acciones tomadas en esta auditoría

- **CI con cobertura.** [`verificacion.yml`](../../../.github/workflows/verificacion.yml) ahora
  corre `test:coverage` y **anexa el reporte** como artefacto (cierra el ítem del checklist de
  coherencia «los 21 casos corren en CI y el reporte de cobertura está anexo»).
- **`ESTADO.md` sincronizado.** Se corrigió la inconsistencia del tablero (decía «sin empezar
  el código») y se registró el incremento de la plataforma web. La documentación ahora refleja
  el estado real (evita el descuento del criterio 6 por documentación desfasada).
- **Reserva vencida en la UI (R3).** El backend ya rechaza el pago de una reserva vencida
  (`Reserva.marcarEnPago` → `ReservaVencida` → 409) y el worker libera el inventario. Se
  alineó el front: al llegar el temporizador a 0 —o si el backend responde 409— la plataforma
  bloquea el pago, avisa y libera la reserva, en vez de dejar «Pagar».
- **Datos del titular según AD-004.** El checkout captura **nombre, documento, correo y
  teléfono** —el mínimo que AD-004 fija para la boleta nominal—. No se pide **dirección**:
  AD-004 prohíbe PII sin finalidad documentada, y el agregado `Identidad` del
  [modelo de dominio](../02-modelamiento/modelo-de-dominio.md) solo modela nombre, documento y
  correo; el teléfono se usa como contacto de la boleta nominal (AD-004), no se añade como
  campo persistente del agregado. Se quitó de la UI el texto sobre el cifrado AES-256-GCM.
- **Contexto «Oferta de eventos» implementado.** Se creó el dominio de `event-catalog`
  (`Evento`, `Recinto`, `Promotor` + VOs), con la regla R1 del recinto y pruebas. Cierra la
  brecha de raíces del modelo sin código (ver §3): **12/12 raíces implementadas**.
- **Alertas ampliadas.** [`alerts.yml`](../../../observability/prometheus/alerts.yml) pasó de
  4 a **15 reglas**, cubriendo las alertas del diseño (latencia de reserva P95, DLQ/lag,
  recorrido crítico, servicio caído, saturación de CPU/pool, telemetría incompleta, conversión
  de pagos, costo por boleta), cada una con su atributo y severidad. La única del diseño no
  implementada es «réplicas de Kubernetes por debajo de lo esperado», propia de la topología de
  producción (el piloto corre single-node).
- **Autoevaluación escrita** en [`autoevaluacion.md`](autoevaluacion.md).

## 7. Hallazgo posterior: sobreventa por falta de transacciones

> **22 de septiembre de 2026**, al preparar las pruebas de carga. Es un **defecto**, no una
> deuda deliberada: contradecía [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md)
> y los `[COMMIT]` del [diagrama de secuencia](../02-modelamiento/diagrama-de-secuencia.md).

**Qué pasaba.** Cien fans reservaban una boleta cada uno, al mismo tiempo, en una localidad
de cincuenta cupos: se aceptaban **las cien reservas** y el contador `aforo_reservado` quedaba
en **1**. Cinco webhooks simultáneos del mismo pago de una boleta emitían **siete boletas**.

**Por qué.** La aplicación no abría transacciones en ninguna parte. El repositorio hacía
`SELECT … FOR UPDATE` directo sobre el pool, en *autocommit*, y PostgreSQL soltaba el bloqueo
al terminar esa sentencia. Cada solicitud leía el mismo contador, restaba en memoria y
escribía encima de la anterior (actualización perdida). El `CHECK (reservado + vendido <=
autorizado)` no lo veía, porque el contador quedaba por **debajo** de la realidad. Con el pago
pasaba lo mismo: varios webhooks leían el pago como pendiente y cada uno emitía. En
`connection.ts` ya existía un `enTransaccion` que nunca se conectó.

**Por qué no lo detectó nada antes.**

| Defensa | Por qué no lo vio |
|---|---|
| UT-04 («cien solicitudes sobre la misma silla») | Corre contra dobles en memoria que sí serializan; nunca toca PostgreSQL |
| IF-01 (webhook repetido) | Reenvía los webhooks **uno tras otro**, no a la vez |
| Métrica `ticketright_oversell_total` | Nunca se incrementaba: se inicializaba en 0 y ningún código la tocaba. El criterio «0 sobreventa» de IF-01/02/03 no comprobaba nada |
| Token de admisión | El validador aceptaba cualquier `turno:<uuid>` inventado, así que la fila no frenaba a quien la saltara |

**Corrección.**

- **Unidad de trabajo.** Puerto `UnidadDeTrabajo` en `sales` y adaptador `BaseTransaccional`
  en `apps/ventas`, que propaga el cliente de la transacción a repositorios, outbox y emisor.
  El orquestador abre una transacción en cada `[COMMIT]` del diagrama: reservar (1.5),
  iniciar pago (2.3), confirmar pago (3.3), cada intento de emisión (4.4), compensar (5.2) y
  cada reserva que vence.
- **Bloqueos.** El repositorio de pagos y el de reservas leen con `FOR UPDATE`, así que dos
  webhooks del mismo pago se atienden uno tras otro.
- **Admisión.** El validador solo acepta el JWT que firma la fila; un token inventado
  responde **401** (antes, 500). Se borró `demo-admission.ts`, que ya no se usaba.
- **Métrica de sobreventa.** El colector la calcula desde los hechos: unidades en reservas
  vivas más boletas válidas, contra el aforo autorizado de cada localidad.

**Verificación.**

| Prueba | Antes | Después |
|---|---|---|
| 100 reservas simultáneas, 50 cupos ([`concurrencia-aforo.test.ts`](../../../apps/ventas/tests/concurrencia-aforo.test.ts)) | 100 aceptadas | 50 aceptadas, 50 `AforoExcedido`; contador = 50 = unidades reservadas |
| 5 webhooks simultáneos de un pago de 1 boleta (misma prueba) | 7 boletas | 1 boleta; aforo vendido = 1 |
| Recorrido real: 100 fans admitidos por la fila con JWT, reservando a la vez | — | 50 `201`, 50 `409` |
| Token `turno:<uuid>` inventado | 201 (compraba) | 401 |
| Sobreventa forzada a mano (aforo 40 con 50 reservadas) | métrica en 0 | `ticketright_oversell_total{localidad="Repro"} 10` |
| El mismo JWT de la fila usado 5 veces a la vez (misma prueba) | 5 reservas | 1 reserva, 4 rechazos |
| El JWT de un fan usado por otro (misma prueba) | reservaba | rechazado |
| Reserva rechazada por aforo, y luego otra localidad con el mismo turno | — | el rechazo no gasta el turno |

La prueba de integración corre en el CI contra un PostgreSQL de servicio. Sin la corrección,
falla: se comprobó quitando la unidad de trabajo.

**Lo que se cedió.** Las reservas sobre una misma localidad se serializan en el bloqueo de
su fila: es el costo que AD-003 ya aceptó a cambio de cero sobreventa, y el que las pruebas
de carga van a medir. Iniciar el pago sostiene la transacción mientras se llama a la
pasarela; con la pasarela simulada es inmediato, pero con una real habría que partir ese paso
en dos.

IF-03 cambió un número: con PostgreSQL congelado, la reserva ahora se rechaza en **~4 s**
en vez de ~2 s, porque la transacción espera primero una conexión del pool
(`PG_CONNECT_TIMEOUT_MS`, 4 s). Sigue siendo un rechazo acotado.

**Cerrado en el mismo cambio.**

- **Turno de un solo uso y ligado al fan**, como piden AD-004, AD-006 y la relación
  Turno → Reserva `1:0..1` del modelo de dominio. El validador registra el `jti` en
  `turnos_usados` dentro de la transacción de la reserva: si la reserva se rechaza por aforo,
  el rollback devuelve el turno. El `sub` del JWT debe ser el fan que reserva. La fila marca
  el turno como `usado` y la plataforma web olvida el token al reservar.
- **Arnés de fallos al día.** `chaos/lib.mjs` resuelve las tribunas por nombre desde el
  catálogo (y las guarda para la fase con PostgreSQL en pausa). IF-01 agrega los webhooks
  simultáneos. IF-05 usa ocho fans distintos: con uno solo, el borde de seguridad lo retaba
  como bot desde el incremento 4 y el experimento ya no pasaba.
- **Campaña repetida** el 22 de septiembre: los cuatro experimentos aprobados con la métrica
  de sobreventa real ([bitácora](bitacora-de-fallos.md#segunda-campaña--22-de-septiembre)).
