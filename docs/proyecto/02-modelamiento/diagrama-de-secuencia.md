# Diagrama de secuencia — Comprar en la ventana de alta demanda

Diagrama de secuencia UML del mismo caso del [diagrama de clases](diagrama-de-clases.md):
del turno admitido a la boleta emitida, con los cuatro pasos de la SAGA de
[AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) y los flujos de error que el
negocio teme —aforo agotado, reserva vencida, pasarela que tarda o rechaza, webhook
repetido, emisión que no cierra—.

## Contenido

| Sección | Qué responde |
|---|---|
| [Artefactos](#artefactos) | Dónde está el diagrama y cómo se regenera |
| [Escenario, precondiciones y postcondiciones](#escenario-precondiciones-y-postcondiciones) | Qué cubre el escenario y en qué estado deja al sistema |
| [Participantes](#participantes) | Cada línea de vida y a qué clase del diagrama de clases corresponde |
| [Mensajes](#mensajes) | Los 38 mensajes numerados, con su tipo y su operación |
| [Fragmentos combinados](#fragmentos-combinados) | Los siete `alt` / `loop` / `par` y qué regla protege cada uno |
| [Notación](#notación) | Convenciones UML del diagrama |
| [Correspondencia con la rúbrica](#correspondencia-con-la-rúbrica) | Qué evidencia cubre cada criterio |

## Artefactos

El caso se dibuja en **dos vistas por fase de la SAGA**, para que cada una quepa en una
pantalla. Juntas contienen los **38 mensajes y los 7 fragmentos** del caso.

- **Vista 1 — [reservar y cobrar](diagrama-de-secuencia-reservar-pagar.html)**
  ([fuente validada](diagrama-de-secuencia-reservar-pagar.json)): pasos 1 y 2, 20 mensajes,
  8 líneas de vida y 4 fragmentos (`alt` de aforo, `alt` de reserva vencida, `loop` de
  reintentos y `alt` de rechazo).
- **Vista 2 — [confirmar, emitir y compensar](diagrama-de-secuencia-confirmar-emitir.html)**
  ([fuente validada](diagrama-de-secuencia-confirmar-emitir.json)): pasos 3, 4 y 5, 18
  mensajes, las 10 líneas de vida y 3 fragmentos (`alt` de webhook repetido, `alt` de
  emisión incompleta y `par` del worker de expiración).

```bash
for v in reservar-pagar confirmar-emitir; do
  node .agents/skills/archify/bin/archify.mjs deliver sequence \
    proyecto/02-modelamiento/diagrama-de-secuencia-$v.json \
    proyecto/02-modelamiento/diagrama-de-secuencia-$v.html --quality standard --json
  node herramientas/postprocesa-diagrama-secuencia.mjs \
    proyecto/02-modelamiento/diagrama-de-secuencia-$v.json \
    proyecto/02-modelamiento/diagrama-de-secuencia-$v.html
done
```

El posprocesado convierte las bandas de Archify que llevan un operador (`alt`, `loop`,
`par`) en marcos UML acotados a las líneas de vida que participan, con la pestaña del
operador y su guarda; también cuida el contraste WCAG AA del tema claro y el halo de las
notas que van sobre líneas de vida. Cada vista tiene sus propias vistas guiadas: la 1 con
*Reservar* y *Pagar*; la 2 con *Confirmar*, *Emitir* y *Liberar*.

Recibos de `deliver` (18 de septiembre de 2026, antes del posprocesado): vista 1 fuente
`sha256 27b8a5fb93aa…` (8.210 bytes) → HTML `sha256 145b76166704…` (822.780 bytes); vista 2
fuente `sha256 782c45cf67b1…` (8.639 bytes) → HTML `sha256 3c2af7894c72…` (824.258 bytes).
Ambas pasan la contención sin desplazamiento en 1440×900, 1600×1000, 1920×1080 y 2048×1320.

## Escenario, precondiciones y postcondiciones

**Escenario.** Un fan con turno admitido reserva dos boletas de una localidad, paga con
tarjeta y recibe sus boletas, durante una venta masiva en la que la pasarela puede tardar,
rechazar o responder dos veces, y en la que la reserva puede vencer antes de pagar.

| Precondiciones | Postcondiciones |
|---|---|
| El fan está autenticado (`Identidad`) y la Fila de venta le emitió un turno admitido: el JWT de admisión de [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) y [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md). | **Éxito:** `Pago.estado = confirmado`; `Localidad.aforo.vendido += n` y sus sillas `vendida`; `Reserva.estado = confirmada`; una `Boleta` por ítem con titular activo y `CodigoBoleta` versión 1; `CompraEnCurso.paso = emitida`; `PagoSolicitado` y `PagoConfirmado` publicados. |
| El evento está `enVenta`, la localidad tiene aforo y el promotor tiene un `Convenio` vigente que fija el cargo por servicio. | **Aforo agotado o reserva vencida:** nada cobrado; el inventario vuelve a `libre`/`disponible` en la misma transacción (aforo) o por el worker en ≤ 30 s (vencida). |
| El navegador obtuvo de la pasarela un token de tarjeta; TicketRight nunca ve el PAN. | **Pago rechazado:** `Pago.estado = rechazado`, `CompraEnCurso.paso = compensada`, la reserva sigue vigente hasta `venceEn`. |
| El reloj del sistema es la referencia de `venceEn` (R3) y del límite de conciliación `limiteA1 = 15 min` (R5). | **Emisión incompleta:** `Discrepancia{tipo: cobroSinBoleta}` abierta y `CompraEnCurso.paso = enConciliacion`; nunca existe dinero confirmado sin boleta ni caso abierto. |

## Participantes

Las líneas de vida son clases del [diagrama de clases](diagrama-de-clases.md#clases). Para
que el diagrama se lea de un vistazo, tres colaboradores de una sola llamada no abren línea
de vida propia y aparecen como nota sobre el mensaje que los usa: `ValidadorDeAdmision`
(1.1), `CalculadoraDePrecio` (1.4) y `PasarelaDePago.verificarFirma` (3.1). `CompraEnCurso`
se muestra dentro del `guardar(...)` de cada paso —`compra.avanzar(paso)`— porque es ahí
donde el estado de la SAGA se persiste. Los seis repositorios comparten una línea de vida:
cada mensaje nombra el repositorio y `[COMMIT]` marca el límite transaccional.

| Línea de vida | Clase | Capa |
|---|---|---|
| Fan | actor externo (prototipo, pantallas 4 a 8) | — |
| OrquestadorDeCompra | `OrquestadorDeCompra` «application service»; persiste `CompraEnCurso` | Aplicación |
| Localidad, Reserva, Pago, Boleta, Discrepancia | raíces de agregado | Dominio |
| Repositorios | `RepositorioDeLocalidades`, `…Reservas`, `…Pagos`, `…Boletas`, `…Discrepancias`, `…Compras` sobre PostgreSQL ([AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md)) | Puerto / adaptador |
| PasarelaDePago | puerto realizado por `AdaptadorDePasarelaTokenizada`; también origina el webhook | Puerto / adaptador |
| PublicadorDeEventos | puerto realizado por `OutboxTransaccional` → Kafka ([AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md)) | Puerto / adaptador |

## Mensajes

Numeración jerárquica por paso (`2.3` es el tercer mensaje del paso 2). Cada operación es
un método del diagrama de clases; `«create»` marca la fábrica estática que construye el
agregado. `{Rn}` indica la regla que el mensaje hace cumplir.

| # | De → a | Tipo | Operación |
|---|---|---|---|
| `1` | Fan → OrquestadorDeCompra | síncrono (entrada del fan) | `reservar(cmd: CrearReserva)` — *1.1 ValidadorDeAdmision.validar(tokenAdmision, fanId) → turnoId* |
| `1.2` | OrquestadorDeCompra → Repositorios | síncrono | `RepositorioDeLocalidades.obtenerParaActualizar(localidadId)  [FOR UPDATE]` |
| `1.3` | OrquestadorDeCompra → Localidad | síncrono | `reservar(cantidad, sillaIds)  {R1, R2}` |
| `✗` | Localidad → OrquestadorDeCompra | excepción de dominio | `AforoExcedido` |
| `1.3` | OrquestadorDeCompra → Fan | retorno | `← rechazo del ítem · rollback · sin cobro` |
| `1.4` | OrquestadorDeCompra → Reserva | síncrono | `«create» Reserva.crear(fanId, turnoId, items)  venceEn = ahora + 10 min` — *precio de cada ítem: CalculadoraDePrecio.desglosar(nominal, cantidad)  {R13}* |
| `1.5` | OrquestadorDeCompra → Repositorios | síncrono | `guardar(localidad, reserva, compra.avanzar(reservada))  [COMMIT]` |
| `1.6` | OrquestadorDeCompra → Fan | retorno | `← CompraEnCurso{compraId, venceEn}` |
| `2` | Fan → OrquestadorDeCompra | síncrono (entrada del fan) | `iniciarPago(cmd: IniciarPago)` — *cmd.claveIdempotencia: un reintento devuelve el mismo Pago sin nuevo cobro* |
| `2.1` | OrquestadorDeCompra → Reserva | síncrono | `marcarEnPago(ahora)  {R3}` |
| `✗` | Reserva → OrquestadorDeCompra | excepción de dominio | `ReservaVencida` |
| `2.1` | OrquestadorDeCompra → Fan | retorno | `← 409 reserva vencida · el worker libera el inventario` |
| `2.2` | OrquestadorDeCompra → Pago | síncrono | `«create» Pago.iniciar(origen{reserva}, monto, medio, clave)  {R4}` |
| `2.3` | OrquestadorDeCompra → Repositorios | síncrono | `guardar(pago, compra.avanzar(pagoSolicitado)) + outbox(PagoSolicitado)  [COMMIT]` |
| `2.4` | OrquestadorDeCompra → Fan | retorno | `← 202 «pago en proceso»` |
| `2.5` | PublicadorDeEventos → OrquestadorDeCompra | asíncrono | `PagoSolicitado → worker de cobro` |
| `2.6` | OrquestadorDeCompra → PasarelaDePago | síncrono | `cobrar(pago, tokenTarjeta)  timeout 15 s` |
| `2.6` | PasarelaDePago → OrquestadorDeCompra | retorno | `← rechazado(motivo)` |
| `2.7` | OrquestadorDeCompra → Pago | síncrono | `registrarRechazo(motivo)` |
| `2.8` | OrquestadorDeCompra → Fan | asíncrono | `«medio rechazado · la reserva sigue vigente hasta venceEn»` |
| `3` | PasarelaDePago → OrquestadorDeCompra | asíncrono | `webhook confirmarPago(cmd: ConfirmarPago)` — *3.1 PasarelaDePago.verificarFirma(cmd) antes de procesar* |
| `3.2` | OrquestadorDeCompra → Pago | síncrono | `registrarConfirmacion(referenciaExterna, ahora) : boolean` |
| `3.2` | Pago → OrquestadorDeCompra | retorno | `← false · referencia ya procesada` |
| `3.2` | OrquestadorDeCompra → PasarelaDePago | retorno | `← 200 sin efectos (idempotente)` |
| `3.3` | OrquestadorDeCompra → Repositorios | síncrono | `guardar(pago, compra.avanzar(pagoConfirmado)) + outbox(PagoConfirmado)  [COMMIT]` |
| `3.4` | OrquestadorDeCompra → PasarelaDePago | retorno | `← 200` |
| `4` | PublicadorDeEventos → OrquestadorDeCompra | asíncrono | `PagoConfirmado → emitir(compraId)` |
| `4.1` | OrquestadorDeCompra → Localidad | síncrono | `vender(cantidad, sillaIds)  {R2: reservada → vendida}` — *misma transacción que la emisión (AD-003)* |
| `4.2` | OrquestadorDeCompra → Boleta | síncrono | `«create» Boleta.emitir(item, pago, titular)  por cada ítem  {R7}` |
| `4.3` | OrquestadorDeCompra → Reserva | síncrono | `confirmar()` |
| `4.4` | OrquestadorDeCompra → Repositorios | síncrono | `guardar(localidad, reserva, boletas, compra.avanzar(emitida))  [COMMIT]` |
| `4.5` | OrquestadorDeCompra → Fan | asíncrono | `boletas emitidas · código y titular` |
| `4.6` | OrquestadorDeCompra → Discrepancia | síncrono | `«create» Discrepancia.abrir(cobroSinBoleta, pagoId)  {R14}` |
| `4.7` | OrquestadorDeCompra → Repositorios | síncrono | `guardar(discrepancia, compra.avanzar(enConciliacion))` |
| `4.8` | OrquestadorDeCompra → Fan | asíncrono | `«pago confirmado · boleta en emisión · caso abierto»` |
| `5` | OrquestadorDeCompra → Repositorios | síncrono | `vencerReservasExpiradas(ahora) → vencidasA(ahora)` |
| `5.1` | OrquestadorDeCompra → Reserva | síncrono | `vencer()  idempotente · nunca con pago confirmado` |
| `5.2` | OrquestadorDeCompra → Localidad | síncrono | `liberar(cantidad, sillaIds)  [COMMIT]` |

## Fragmentos combinados

| Operador | Guarda | Qué protege |
|---|---|---|
| `alt` | [aforo insuficiente o silla ya asignada] | R1/R2 · Localidad rechaza el ítem completo; la transacción hace *rollback* y no se contacta la pasarela. |
| `alt` | [ahora ≥ venceEn] | R3 · la reserva ya no está vigente; el fan recibe 409 y el worker (`par`) libera el inventario en ≤ 30 s (A-5 · liberación en ≤ 10 min). |
| `loop` | [hasta 3 intentos con backoff mientras haya timeout] | AD-002 · `cobrar` reintenta con *backoff* y *circuit breaker*. |
| `alt` | [la pasarela rechaza o agota los intentos] | El pago queda `rechazado`; la reserva sigue vigente hasta `venceEn` para intentar otro medio. |
| `alt` | [webhook repetido] | AD-002 · `registrarConfirmacion` devuelve `false` y el webhook recibe 200 sin efectos: mismo resultado. Es la misma clave de idempotencia que protege el reintento del fan en 2. |
| `alt` | [la emisión no completa antes de limiteA1 = 15 min] | R5/R14 · A-1 · correspondencia dinero–boleta: se abre `Discrepancia cobroSinBoleta` y la compra pasa a `enConciliacion`; nunca dinero confirmado sin caso. |
| `par` | [worker de expiración, cada ≤ 30 s] | Corre en paralelo a todo el caso; `vencer` es idempotente y nunca toca una reserva con pago confirmado (UT-08). |

## Notación

| Elemento | Representación |
|---|---|
| Llamada síncrona | Línea continua con punta rellena; la de entrada del fan, en verde. |
| Mensaje asíncrono | Línea punteada morada: publicación en el outbox, entrega desde Kafka, webhook de la pasarela, notificación al fan. |
| Retorno | Línea punteada gris con el valor devuelto (`← turnoId : UUID`). |
| Excepción de dominio | Línea punteada roja con `✗` y el nombre de la excepción del diagrama de clases. |
| Activación | Barra sobre la línea de vida mientras el objeto ejecuta; la del orquestador abarca cada paso completo. |
| Fragmento combinado | Marco con pestaña `alt` / `loop` / `par` y guarda entre corchetes, acotado a las líneas de vida que participan. |
| Nota | Texto pequeño bajo el mensaje: la llamada plegada a un colaborador (validador, calculadora, firma). |
| Fase | Banda numerada de fondo: los cuatro pasos de la SAGA y el worker de expiración. |
| `[COMMIT]` | Fin de la transacción PostgreSQL de ese paso ([AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md)). |

## Correspondencia con la rúbrica

| Criterio | Evidencia |
|---|---|
| Correspondencia con el caso de uso | Mismo caso y alcance que el diagrama de clases; precondiciones y postcondiciones declaradas por resultado (éxito, aforo, vencida, rechazo, conciliación). |
| Participantes y líneas de vida | 10 líneas de vida, todas clases del diagrama de clases (o el actor), con activaciones por llamada y por paso; los colaboradores de una llamada van como nota para mantener la granularidad. |
| Flujo de mensajes | 38 mensajes numerados con operación, parámetros y retorno; síncrono, asíncrono, retorno y excepción distinguidos. |
| Flujos alternativos y de error | Siete fragmentos: cinco `alt` (aforo, vencida, rechazo, webhook repetido, conciliación), un `loop` (reintentos) y un `par` (worker de expiración). |
| Coherencia con clases y componentes | Cada operación existe en el diagrama de clases; el orquestador solo habla con puertos y agregados; el dominio nunca llama a infraestructura. |
| Notación UML | Marcos de fragmento con operador y guarda, activaciones, tipos de flecha y leyenda en la tabla anterior y en las tarjetas del diagrama. |
