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
| Frontera de contextos y emisión (AD-008) | 🟢 Exacta | `Boleta` en `entitlements`, emisión por `EmisorDeBoletas` de `shared-kernel` |
| Reglas de negocio R1–R14 | 🟢 Alta | Los 21 casos del plan de pruebas en verde cubren las reglas |
| Infraestructura (ADR / arq. de implementación) | 🟢 Alta (piloto) | Homólogos locales documentados; AWS es diseño, no despliegue |
| Observabilidad | 🟢 Alta | Las 3+3 métricas de la rúbrica y el catálogo del diseño instrumentados |
| Riqueza del dominio por contexto | 🟡 Parcial | `event-catalog` se resuelve como lectura SQL, no como dominio (ver §3) |
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

## 3. Diferencia principal: el contexto «Oferta de eventos»

El [modelo de dominio](../02-modelamiento/modelo-de-dominio.md) define en *Oferta de eventos*
las raíces **Promotor**, **Recinto**, **Evento** (y `Convenio`, `ReglasVenta`, `ReglasReventa`,
`Cancelacion`). En la implementación, el paquete `event-catalog` está **vacío de dominio**: el
catálogo se resuelve como **lectura SQL directa** sobre las tablas `eventos` y `localidades` en
[`routes.ts`](../../../apps/ventas/src/http/routes.ts) (endpoint `GET /catalogo`), y el
`eventoId` de la demo se inyecta como configuración.

- **Por qué.** El caso de uso central de la Entrega 3 —y de la demo— es la **venta bajo alta
  demanda** (turno → reserva → pago → emisión), que vive en `sales`, `admission-identity` y
  `entitlements`. La *gestión* del catálogo (alta de promotores, convenios, recintos) no está
  en el escenario de la demo ni en los 21 casos del plan de pruebas.
- **Consecuencia.** El catálogo funciona como **proyección de lectura (CQRS)**, coherente con
  el estilo, pero sin agregados de dominio. Faltan 3 de las 12 raíces del modelo como código
  de dominio: `Promotor`, `Recinto`, `Evento`.
- **Clasificación:** deuda técnica **deliberada** y acotada. Cierre propuesto: modelar el
  agregado `Evento`/`Recinto` en `event-catalog` si se requiere el alta de catálogo por
  promotor; hoy el valor está en el camino de venta.

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
4. **Límites transaccionales y reintentos con backoff/circuit-breaker.** Los `COMMIT` atómicos
   y el `FOR UPDATE` del diagrama son responsabilidad de los **adaptadores** (repositorios y
   outbox transaccional en `apps/ventas`), no del orquestador; el disyuntor completo es deuda
   declarada en [`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md).

## 5. Estado de las evidencias de la rúbrica

| Criterio | Estado | Evidencia / pendiente |
|---|---|---|
| 1 · Aplicación (40 %) | 🟢 | App + plataforma web `/app`; **pendiente** el video demo |
| 2 · Observabilidad (20 %) | 🟢 | 3+3 métricas instrumentadas, tablero y alertas; **pendiente** capturas/video |
| 3 · Fallos (30 %) | 🟢 | IF-01/02/03/05 aprobados; **pendiente** capturas del tablero por fallo |
| 4 · Patrones (10 %) | 🟢 | [`patrones.md`](patrones.md); **pendiente** capturas de código |
| 5 · Autoevaluación (+10 %) | ⚪ | Por escribir al cierre |
| 6 · Coherencia (−10 %) | 🟢 | Este documento + `fidelidad-arquitectonica.md`; cobertura ya corre en CI |

## 6. Acciones tomadas en esta auditoría

- **CI con cobertura.** [`verificacion.yml`](../../../.github/workflows/verificacion.yml) ahora
  corre `test:coverage` y **anexa el reporte** como artefacto (cierra el ítem del checklist de
  coherencia «los 21 casos corren en CI y el reporte de cobertura está anexo»).
- **`ESTADO.md` sincronizado.** Se corrigió la inconsistencia del tablero (decía «sin empezar
  el código») y se registró el incremento de la plataforma web. La documentación ahora refleja
  el estado real (evita el descuento del criterio 6 por documentación desfasada).
