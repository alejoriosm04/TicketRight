# Diagrama de clases — Comprar en la ventana de alta demanda

Diagrama de clases UML de **un caso de uso**: la compra durante la ventana de alta demanda,
desde que el fan tiene un turno admitido hasta que recibe su boleta. Es el caso que la
[reunión de equipo](README.md#base-para-la-decisión-2--el-caso-de-uso) consideró
representativo: es la tesis del negocio y toca los atributos de calidad que más pesan —A-1 ·
correspondencia dinero–boleta cerrada en ≤ 15 min, A-2 · cero boletas sobre el aforo, A-5 ·
liberación de reservas abandonadas en ≤ 10 min y A-6 · degradación controlada que protege
las compras iniciadas—.

## Contenido

| Sección | Qué responde |
|---|---|
| [Artefactos](#artefactos) | Dónde está el diagrama y cómo se regenera |
| [El caso y su alcance](#el-caso-y-su-alcance) | Por qué este caso, qué entra y qué queda fuera |
| [Capas y patrones](#capas-y-patrones) | Cómo se organizan las clases y de qué ADR sale cada capa |
| [Clases](#clases) | Cada clase con estereotipo, atributos, métodos y a qué concepto o decisión corresponde |
| [Relaciones](#relaciones) | Cada relación con su tipo UML, multiplicidad y navegabilidad justificada |
| [Correspondencia con el modelo de dominio](#correspondencia-con-el-modelo-de-dominio) | Qué clase viene de qué concepto y qué regla hace cumplir |
| [Cómo sustentarlo](#cómo-sustentarlo) | Qué aclarar en la revisión y en qué orden recorrerlo |
| [Notación](#notación) | Convenciones UML que usa el diagrama |
| [Correspondencia con la rúbrica](#correspondencia-con-la-rúbrica) | Qué evidencia cubre cada criterio |

## Artefactos

El caso se dibuja en **dos vistas complementarias**, para que cada una quepa en una pantalla
sin perder el detalle que pide la rúbrica (atributos y operaciones con visibilidad, tipo y
firma). Juntas contienen las **39 clases y 37 relaciones** del caso.

- **Vista 1 — [dominio del caso](diagrama-de-clases-dominio.html)**
  ([fuente validada](diagrama-de-clases-dominio.json)): las 20 clases del dominio
  (agregados, entidades, objetos de valor, eventos y excepciones) con sus 16 relaciones.
- **Vista 2 — [aplicación, puertos y adaptadores](diagrama-de-clases-aplicacion.html)**
  ([fuente validada](diagrama-de-clases-aplicacion.json)): las 5 clases de aplicación, los
  9 puertos y los 5 adaptadores, con sus 21 relaciones; una caja de referencia
  (`«reference»`) representa el dominio de la vista 1 para no duplicarlo.

**Este archivo es la fuente de atributos, métodos y relaciones.** El posprocesado lee las
tablas de la sección [Clases](#clases) y dibuja los compartimentos UML dentro de cada caja de
la vista correspondiente; el prefijo del identificador de cada relación en el JSON fija su
notación (`comp-`, `agg-`, `assoc-`, `dep-`, `real-`, `gen-`).

```bash
for v in dominio aplicacion; do
  node .agents/skills/archify/bin/archify.mjs deliver architecture \
    proyecto/02-modelamiento/diagrama-de-clases-$v.json \
    proyecto/02-modelamiento/diagrama-de-clases-$v.html --quality standard --json
  node herramientas/postprocesa-diagrama-clases.mjs \
    proyecto/02-modelamiento/diagrama-de-clases-$v.json \
    proyecto/02-modelamiento/diagrama-de-clases.md \
    proyecto/02-modelamiento/diagrama-de-clases-$v.html
done
```

Las dos vistas usan el perfil `standard` de Archify, pasan las comprobaciones de composición
(cero errores; la vista 1 con una advertencia y la vista 2 con diez, todas de rutas o
etiquetas) y la comprobación de contención sin desplazamiento horizontal ni vertical en
1440×900, 1600×1000, 1920×1080 y 2048×1320. Recibos de `deliver` (18 de septiembre de 2026,
antes del posprocesado): vista 1 fuente `sha256 1ebe7d10bed0…` (12.536 bytes) → HTML
`sha256 dda44cb298f4…` (834.196 bytes); vista 2 fuente `sha256 5b433ee0d32e…` (13.790 bytes)
→ HTML `sha256 8e993adf6a9b…` (836.991 bytes).

**Vistas guiadas.** Cada visor trae sus capítulos: la vista 1 recorre *Reservar*, *Pagar*,
*Emitir y hechos*, *Pago: estado y evento* y *Precio: desglose y calculadora*; la vista 2
recorre *Aplicación*, *Puertos* y *Adaptadores*.

### Dos vistas del mismo caso

| Vista | Qué contiene | Qué deja fuera (y por qué) |
|---|---|---|
| 1 · Dominio | Agregados, entidades y objetos de valor que el caso usa, más los eventos y las excepciones del dominio. | Las capas de aplicación, puertos y adaptadores, que no son vocabulario del dominio; los demás contextos acotados. |
| 2 · Aplicación y bordes | El servicio de aplicación que orquesta la SAGA, los nueve puertos que colaboran y los adaptadores que los realizan. | Los detalles internos de los agregados: se referencian con la caja `«reference»` y se leen en la vista 1. |

La división no cambia el caso ni sus nombres: es la misma solución repartida por nivel de
detalle, como autoriza el [sistema de diseño](../design.md#26-aplicación-en-diagramas)
(«si el contenido no cabe, se divide por vista, escenario o nivel de detalle»).

## Pago: estado y evento

`Pago` tiene las dos cosas y no se reemplazan: el **estado** dice en qué va el pago y protege
R4 dentro del agregado; los **eventos** son los hechos durables que mueven la SAGA.

| Pregunta | Dónde vive | Quién lo usa |
|---|---|---|
| ¿En qué va el pago? | `Pago.estado: EstadoPago` (`solicitado`, `confirmado`, `rechazado`, …) | El orquestador para decidir y hacer cumplir R4; la consulta de estado. |
| ¿Qué ocurrió y quién debe enterarse? | `PagoSolicitado` y `PagoConfirmado`, que generalizan `EventoDeDominio` (`eventoId`, `ocurridoEn`, `claveIdempotencia`) | Worker de cobro (2.5), emisión (paso 4), proyecciones, auditoría y conciliación ([AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md)). |
| ¿Y si el webhook llega repetido? | La `claveIdempotencia` del pago y del evento | `registrarConfirmacion` produce el mismo resultado una sola vez. |

El estado se sobrescribe; el evento conserva la secuencia y el instante. Por eso ambos se
escriben en **la misma transacción local** —estado en PostgreSQL y evento en el outbox— y el
relay publica después. Quitar los eventos dejaría sin aviso al worker de cobro y a la
emisión, y rompería la correspondencia con los mensajes del
[diagrama de secuencia](diagrama-de-secuencia.md#mensajes).

## Precio: desglose y calculadora

No son lo mismo: uno es el **valor** que se guarda y el otro la **política** que lo calcula.

| Pieza | Qué es | Dónde vive | Por qué no se fusiona |
|---|---|---|---|
| `DesglosePrecio` | Objeto de valor con `valorNominal`, `cargoServicio`, `contribucionParafiscal` y `total()` | Guardado en `ItemReserva.precio` | Los tres bolsillos —promotor, TicketRight y Estado— son una unidad con invariante propio (`total` = suma) y nombre en el glosario; se guarda calculado para que un cambio de tarifa no altere ventas pasadas (R13). |
| `CalculadoraDePrecio` | Servicio de dominio sin estado: aplica el `Convenio` vigente y el umbral parafiscal | No se guarda: `desglosar(nominal, cantidad)` devuelve el VO (dependencia «create») | Es comportamiento. Si viviera dentro de `ItemReserva`, cada lugar que necesite un precio duplicaría la política: cargo del 12% `[S]` y parafiscal del 10% cuando el nominal ≥ 3 UVT (R13, Ley 1493 `[V]`). |

Si los tres campos se pasaran dentro de `ItemReserva`, el invariante del total y la regla R13
quedarían repartidos por el agregado y el concepto desaparecería del lenguaje ubicuo; la
rúbrica, además, pide distinguir objetos de valor. Sobre el nombre: **`CobrosAdicionales`
describiría mal al servicio**, porque calcula el desglose completo —incluido el valor
nominal— y aplica la contribución parafiscal, que no es un cobro de TicketRight. Si al
equipo no le gusta «Calculadora», la alternativa honesta es `TarificadorDePrecio`;
renombrarlo toca modelo, clases, secuencia y pruebas, así que es una decisión de equipo.

## El caso y su alcance

**Caso:** *Comprar en la ventana de alta demanda* — turno admitido → reserva → pago →
emisión de la boleta.

**Por qué este y no otro.** De los tres candidatos comparados en el README de la entrega,
es el único que recorre la cadena completa que TicketRight promete custodiar (fila → pago →
boleta) y el único que obliga a modelar los fallos que el negocio teme: la pasarela que
responde tarde o dos veces, la reserva que vence con el pago en curso, el cobro confirmado
sin boleta. Reventa y devolución son más acotados pero dejan fuera el pico, que es donde está
la dificultad arquitectónica. No es un CRUD: hay cuatro agregados, una SAGA con
compensación y tres invariantes con plazo.

| Entra | Queda fuera y por qué |
|---|---|
| Validar el turno admitido (el JWT de [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md)) | **Ordenar la fila y emitir turnos**: es el contexto de admisión, con su propia autoridad en Redis ([AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md)); el caso empieza cuando el turno ya existe |
| Reservar inventario en Localidad con aforo, silla y desglose de precio (R1, R2, R13) | **Notificaciones**: efecto secundario por coreografía ([AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md)); no cambia el resultado de la compra |
| Crear la Reserva durable con vencimiento (R3) | **Transferencia y reventa**: vida de la boleta después de la venta; otro caso |
| Iniciar el Pago con clave de idempotencia (R4) y recibir la confirmación de la pasarela | **Devolución y liquidación**: cierre económico posterior; solo se abre la Discrepancia que los alimenta |
| Vender el inventario en Localidad y emitir la Boleta con su titular y código, en una misma transacción (R2, R7) | **Consultas CQRS** (catálogo, mapa, disponibilidad): lecturas sobre proyecciones, sin lógica de dominio |
| Abrir una Discrepancia cuando la cadena no cierra (R5, R14) | **Devolución como compensación**: el orquestador la ordena, pero su ejecución es el caso «devolver» |

## Capas y patrones

El servicio de ventas se organiza en **arquitectura hexagonal** —aplicación, dominio,
puertos y adaptadores—, que es la forma interna que hace posibles las decisiones ya
aceptadas. La arquitectura de referencia debe respetar estas capas.

| Capa | Qué contiene | De qué decisión sale |
|---|---|---|
| **Aplicación** | `OrquestadorDeCompra` (la SAGA), `CompraEnCurso` (su estado durable) y los tres comandos | [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md): «el orquestador formará parte del servicio de ventas y guardará su estado en PostgreSQL» |
| **Dominio** | Los agregados del [modelo de dominio](modelo-de-dominio.md) con sus reglas como métodos, el servicio de dominio `CalculadoraDePrecio`, los eventos y las excepciones | El modelo de dominio; no depende de ninguna otra capa |
| **Puertos** («interface») | Un repositorio por agregado, la pasarela, el validador de admisión y el publicador de eventos | [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md): PostgreSQL es la autoridad detrás de los repositorios; [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md): la pasarela y la admisión son fronteras de confianza |
| **Adaptadores** | Los repositorios PostgreSQL, la pasarela tokenizada, el validador JWT y el outbox | [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) (outbox), [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md) (bloqueo de fila, transacción corta), [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) (sin PAN ni CVV; JWT firmado) |

Patrones visibles: **SAGA orquestada** (`OrquestadorDeCompra` + `CompraEnCurso`),
**repositorio** por agregado, **outbox transaccional** (`OutboxTransaccional` realiza
`PublicadorDeEventos`), **idempotencia** (`Pago.claveIdempotencia`,
`RepositorioDePagos.porClaveIdempotencia`, `Pago.registrarConfirmacion` devuelve `false`
ante una referencia ya procesada) y **objetos de valor** inmutables (`Aforo.conReserva`
devuelve un Aforo nuevo).

Se dibujan cinco adaptadores: los tres que encapsulan una frontera externa y dos
repositorios PostgreSQL. Los repositorios de Pago, Boleta, Discrepancia y Compra siguen el
mismo patrón que `RepositorioPostgresDeReservas` y se omiten para no repetir cajas.

## Clases

Los tipos son los del modelo de dominio (`UUID`, `Dinero`, `FechaHora`, `IdOpaco`, las
enumeraciones) más los propios de la implementación: `String`, `int`, `boolean`, `List<T>`,
`Duracion`; la enumeración `PasoDeCompra` (`reservada`, `pagoSolicitado`, `pagoConfirmado`,
`emitida`, `enConciliacion`, `compensada`), que es el estado de la SAGA de AD-002; y, solo en
los adaptadores, `Transaccion` (unidad de trabajo de PostgreSQL), `ClienteHttp`, `Secreto` y
`Llave` (credenciales gestionadas fuera del código, AD-004). `T?` es opcional. Los métodos `crear`, `iniciar`, `emitir` y `abrir` de los
agregados son fábricas estáticas: la única forma de construir un agregado válido.

### Capa de aplicación

| Clase | Estereotipo | Atributos | Métodos | Corresponde a |
|---|---|---|---|---|
| CrearReserva | «command» | `+ fanId: UUID`, `+ identidadRef: IdOpaco`, `+ tokenAdmision: String`, `+ localidadId: UUID`, `+ cantidad: int`, `+ sillaIds: List<UUID>` | — | Entrada del caso; lleva el `sub` opaco y el token de admisión de AD-004 |
| IniciarPago | «command» | `+ compraId: UUID`, `+ medio: MedioPago`, `+ tokenTarjeta: String`, `+ claveIdempotencia: String` | — | Pago.medio y Pago.claveIdempotencia; el token de tarjeta nunca se persiste (AD-004) |
| ConfirmarPago | «command» | `+ pagoId: UUID`, `+ referenciaExterna: String`, `+ aprobado: boolean`, `+ firma: String` | — | Webhook de la pasarela; Pago.referenciaExterna (AD-002 paso 3) |
| OrquestadorDeCompra | «application service» | `- admision: ValidadorDeAdmision`, `- localidades: RepositorioDeLocalidades`, `- reservas: RepositorioDeReservas`, `- pagos: RepositorioDePagos`, `- boletas: RepositorioDeBoletas`, `- compras: RepositorioDeCompras`, `- discrepancias: RepositorioDeDiscrepancias`, `- pasarela: PasarelaDePago`, `- eventos: PublicadorDeEventos`, `- precios: CalculadoraDePrecio`, `- vigenciaReserva: Duracion`, `- limiteA1: Duracion` | `+ reservar(cmd: CrearReserva): CompraEnCurso`, `+ iniciarPago(cmd: IniciarPago): void`, `+ confirmarPago(cmd: ConfirmarPago): void`, `+ emitir(compraId: UUID): List<Boleta>`, `+ compensar(compraId: UUID, motivo: String): void`, `+ vencerReservasExpiradas(ahora: FechaHora): int` | La SAGA orquestada de AD-002 dentro del servicio de ventas: un dueño visible de reserva → pago → emisión y de sus compensaciones (R5; A-1 · correspondencia dinero–boleta cerrada en ≤ 15 min) |
| CompraEnCurso | «entity» | `- compraId: UUID`, `- reservaId: UUID`, `- pagoId: UUID?`, `- paso: PasoDeCompra`, `- intentos: int`, `- actualizadoEn: FechaHora` | `+ avanzar(paso: PasoDeCompra): void`, `+ registrarIntento(): int` | Estado durable de la SAGA en PostgreSQL (AD-002): recuerda en qué paso va cada compra |

### Capa de dominio

| Clase | Estereotipo | Atributos | Métodos | Corresponde a |
|---|---|---|---|---|
| Localidad | «aggregate root» | `- localidadId: UUID`, `- eventoId: UUID`, `- tipo: TipoLocalidad`, `- aforo: Aforo`, `- precio: Dinero`, `- sillas: List<Silla>` | `+ reservar(cantidad: int, sillaIds: List<UUID>): void`, `+ liberar(cantidad: int, sillaIds: List<UUID>): void`, `+ vender(cantidad: int, sillaIds: List<UUID>): void`, `+ precioNominal(): Dinero` | Localidad (RAÍZ). `reservar` hace cumplir R1 y R2 al reservar; `vender` vuelve a hacer cumplir R2 al emitir, en la misma transacción que `Boleta.emitir`. Ambos lanzan AforoExcedido |
| Aforo | «value object» | `- autorizado: int`, `- reservado: int`, `- vendido: int` | `+ disponible(): int`, `+ conReserva(n: int): Aforo`, `+ conVenta(n: int): Aforo` | Aforo (VO). Inmutable: cada operación devuelve un nuevo Aforo |
| Silla | «entity» | `- sillaId: UUID`, `- fila: String`, `- numero: String`, `- estado: EstadoSilla` | `+ reservar(): void`, `+ liberar(): void`, `+ vender(): void` | Silla (E). Una sola asignación activa (R2) |
| Reserva | «aggregate root» | `- reservaId: UUID`, `- fanId: UUID`, `- turnoId: UUID`, `- estado: EstadoReserva`, `- creadaEn: FechaHora`, `- venceEn: FechaHora`, `- total: Dinero`, `- items: List<ItemReserva>` | `+ crear(fanId: UUID, turnoId: UUID, items: List<ItemReserva>): Reserva`, `+ estaVigente(ahora: FechaHora): boolean`, `+ marcarEnPago(ahora: FechaHora): void`, `+ confirmar(): void`, `+ vencer(): void`, `+ total(): Dinero` | Reserva (RAÍZ). `marcarEnPago` lanza ReservaVencida (R3); `total` aplica R13 |
| ItemReserva | «entity» | `- itemId: UUID`, `- localidadId: UUID`, `- sillaId: UUID?`, `- cantidad: int`, `- precio: DesglosePrecio` | `+ subtotal(): Dinero` | Ítem de reserva (E) |
| DesglosePrecio | «value object» | `- valorNominal: Dinero`, `- cargoServicio: Dinero`, `- contribucionParafiscal: Dinero` | `+ total(): Dinero` | Desglose de precio (VO): los tres bolsillos (R13) |
| CalculadoraDePrecio | «domain service» | `- cargoServicio: Porcentaje`, `- tasaParafiscal: Porcentaje`, `- umbralParafiscal: Dinero` | `+ desglosar(nominal: Dinero, cantidad: int): DesglosePrecio` | Fabrica el DesglosePrecio: 10% si nominal ≥ 3 UVT, si no cero (R13, Ley 1493 [V]) |
| Pago | «aggregate root» | `- pagoId: UUID`, `- origen: OrigenPago`, `- monto: Dinero`, `- medio: MedioPago`, `- estado: EstadoPago`, `- claveIdempotencia: String`, `- referenciaExterna: String?`, `- iniciadoEn: FechaHora`, `- confirmadoEn: FechaHora?` | `+ iniciar(origen: OrigenPago, monto: Dinero, medio: MedioPago, clave: String): Pago`, `+ registrarConfirmacion(referencia: String, en: FechaHora): boolean`, `+ registrarRechazo(motivo: String): void`, `+ estaConfirmado(): boolean` | Pago (RAÍZ). `registrarConfirmacion` devuelve false si la referencia ya se procesó: mensaje repetido, mismo resultado (AD-002) |
| OrigenPago | «value object» | `- tipo: TipoOrigenPago`, `- referenciaId: UUID` | — | Origen de pago (VO). En este caso siempre `reserva` (R4) |
| Discrepancia | «aggregate root» | `- discrepanciaId: UUID`, `- tipo: TipoDiscrepancia`, `- pagoId: UUID`, `- boletaId: UUID?`, `- detectadaEn: FechaHora`, `- resueltaEn: FechaHora?`, `- resolucion: ResolucionDiscrepancia?` | `+ abrir(tipo: TipoDiscrepancia, pagoId: UUID): Discrepancia`, `+ resolver(r: ResolucionDiscrepancia, en: FechaHora): void` | Discrepancia (RAÍZ). El caso `cobroSinBoleta` es la discrepancia de A-1 · dinero–boleta, que debe cerrarse en ≤ 15 min (R14) |
| Boleta | «aggregate root» | `- boletaId: UUID`, `- eventoId: UUID`, `- localidadId: UUID`, `- sillaId: UUID?`, `- pagoId: UUID`, `- precioNominal: Dinero`, `- codigo: CodigoBoleta`, `- estado: EstadoBoleta`, `- emitidaEn: FechaHora`, `- titularidades: List<Titularidad>` | `+ emitir(item: ItemReserva, pago: Pago, titular: Titular): Boleta`, `+ titularActivo(): Titular`, `+ anular(en: FechaHora): void` | Boleta (RAÍZ). `emitir` crea la única Titularidad activa (R7) y el código versión 1; recibe el `sillaId` que Localidad ya vendió (R2 lo hace cumplir Localidad, no Boleta) |
| CodigoBoleta | «value object» | `- valor: String`, `- version: int` | `+ siguiente(): CodigoBoleta` | Código de boleta (VO) |
| Titularidad | «entity» | `- titularidadId: UUID`, `- titular: Titular`, `- inicio: FechaHora`, `- fin: FechaHora?`, `- estado: EstadoTitularidad` | `+ cerrar(en: FechaHora): void` | Titularidad (E) |
| Titular | «entity» | `- titularId: UUID`, `- fanId: UUID`, `- identidadRef: IdOpaco`, `- estado: EstadoTitular` | — | Titular (E). Solo la referencia opaca: sin datos personales (AD-004) |
| EventoDeDominio | «abstract» | `# eventoId: UUID`, `# ocurridoEn: FechaHora`, `# claveIdempotencia: String` | `+ nombre(): String` | Base de los hechos durables de AD-002 |
| PagoSolicitado | «event» | `- pagoId: UUID`, `- monto: Dinero` | — | Evento del paso 2 de AD-002 |
| PagoConfirmado | «event» | `- pagoId: UUID`, `- referenciaExterna: String` | — | Evento del paso 4 de AD-002: ordena emitir |
| ExcepcionDeDominio | «abstract» | `# regla: String`, `# mensaje: String` | — | Base de las violaciones de invariantes |
| AforoExcedido | «exception» | `- localidadId: UUID`, `- solicitado: int`, `- disponible: int` | — | Violación de R1 o R2; se rechaza el ítem completo |
| ReservaVencida | «exception» | `- reservaId: UUID`, `- vencioEn: FechaHora` | — | Violación de R3; no se contacta la pasarela |

### Puertos

| Clase | Estereotipo | Atributos | Métodos | Corresponde a |
|---|---|---|---|---|
| PasarelaDePago | «interface» | — | `+ cobrar(pago: Pago, tokenTarjeta: String): void`, `+ verificarFirma(cmd: ConfirmarPago): boolean` | Puerto hacia la pasarela externa; TicketRight no controla su operación (alcance) |
| PublicadorDeEventos | «interface» | — | `+ publicar(evento: EventoDeDominio): void` | Puerto del bus durable de AD-002 |
| RepositorioDeCompras | «interface» | — | `+ obtener(compraId: UUID): CompraEnCurso`, `+ guardar(compra: CompraEnCurso): void` | Persistencia del estado de la SAGA (AD-002) |
| RepositorioDeDiscrepancias | «interface» | — | `+ guardar(d: Discrepancia): void`, `+ abiertasPorPago(pagoId: UUID): List<Discrepancia>` | Discrepancia (R14) |
| ValidadorDeAdmision | «interface» | — | `+ validar(token: String, fanId: UUID): UUID` | Devuelve el turnoId admitido o falla; el JWT firmado de AD-004/AD-006 |
| RepositorioDeLocalidades | «interface» | — | `+ obtenerParaActualizar(id: UUID): Localidad`, `+ guardar(l: Localidad): void` | Autoridad del inventario en PostgreSQL (AD-003) |
| RepositorioDeReservas | «interface» | — | `+ obtener(id: UUID): Reserva`, `+ guardar(r: Reserva): void`, `+ vencidasA(ahora: FechaHora): List<Reserva>` | Reserva durable (AD-003); `vencidasA` sostiene A-5 · liberación en ≤ 10 min |
| RepositorioDePagos | «interface» | — | `+ obtener(id: UUID): Pago`, `+ porClaveIdempotencia(clave: String): Pago?`, `+ guardar(p: Pago): void` | Pago; la búsqueda por clave es la idempotencia de AD-002 |
| RepositorioDeBoletas | «interface» | — | `+ guardar(b: Boleta): void`, `+ porPago(pagoId: UUID): List<Boleta>` | Boleta |

> **Ajuste de la Entrega 3 ([AD-008](../decisiones/0008-boleta-en-derecho-de-asistencia.md)).**
> La implementación mueve `Boleta` al contexto Derecho de asistencia y reemplaza este puerto
> por `EmisorDeBoletas` con un DTO de emisión; los repositorios de pagos y compras ganan
> lecturas `porReserva`. Los artefactos JSON y HTML se regeneran en la próxima pasada.

### Adaptadores

| Clase | Estereotipo | Atributos | Métodos | Corresponde a |
|---|---|---|---|---|
| AdaptadorDePasarelaTokenizada | «adapter» | `- clienteHttp: ClienteHttp`, `- secretoWebhook: Secreto` | `+ cobrar(pago: Pago, tokenTarjeta: String): void`, `+ verificarFirma(cmd: ConfirmarPago): boolean` | Realiza PasarelaDePago; solo maneja referencias tokenizadas (AD-004) |
| OutboxTransaccional | «adapter» | `- transaccion: Transaccion` | `+ publicar(evento: EventoDeDominio): void`, `+ despachar(lote: int): int` | Realiza PublicadorDeEventos; escribe en la misma transacción y despacha a Kafka (AD-002, AD-003) |
| ValidadorJwtDeAdmision | «adapter» | `- llavePublica: Llave`, `- audiencia: String` | `+ validar(token: String, fanId: UUID): UUID` | Realiza ValidadorDeAdmision: firma, emisor, audiencia, expiración y jti de un solo uso (AD-004) |
| RepositorioPostgresDeLocalidades | «adapter» | `- transaccion: Transaccion` | `+ obtenerParaActualizar(id: UUID): Localidad`, `+ guardar(l: Localidad): void` | Realiza RepositorioDeLocalidades con bloqueo de fila y transacción corta (AD-003) |
| RepositorioPostgresDeReservas | «adapter» | `- transaccion: Transaccion` | `+ obtener(id: UUID): Reserva`, `+ guardar(r: Reserva): void`, `+ vencidasA(ahora: FechaHora): List<Reserva>` | Realiza RepositorioDeReservas; `venceEn` vive en almacenamiento durable (AD-003) |

## Relaciones

La multiplicidad se lee por extremo, como en UML: el número junto a una clase dice cuántas
instancias de **esa** clase ve una instancia de la otra. `Pago 0..1 — 1 Reserva` significa
que una reserva tiene cero o un pago, y que un pago tiene exactamente una reserva. En el
JSON esa misma relación se codifica como `origen · 0..1 → 1` (origen → destino); el
posprocesado dibuja cada número en su extremo y deja en el centro solo el nombre del rol.

| Relación (con multiplicidad en cada extremo) | Tipo UML | Navegabilidad y justificación |
|---|---|---|
| Reserva `1` ◆—→ `1..*` ItemReserva | Composición | El ítem no existe sin su reserva y muere con ella; solo Reserva navega a sus ítems (raíz de agregado). |
| ItemReserva `1` ◆—→ `1` DesglosePrecio | Composición | Objeto de valor propio del ítem; se guarda calculado para que un cambio de tarifa no altere ventas pasadas (R13). |
| Localidad `1` ◆—→ `1` Aforo | Composición | El aforo es parte de la localidad y solo ella lo cambia (R1). |
| Localidad `1` ◆—→ `0..*` Silla | Composición | La silla vive dentro del agregado Localidad, como en el modelo de dominio (`E · Localidad`): su `estado` por venta solo lo cambia la localidad (R2). Una localidad general tiene cero sillas. |
| Pago `1` ◆—→ `1` OrigenPago | Composición | Objeto de valor que dice qué se cobra (R4). |
| Pago `0..1` —→ `1` Reserva | Asociación | Una reserva tiene cero o un pago; un pago tiene exactamente una reserva (`origen.referenciaId`). Reserva no conoce su pago: el resultado le llega por el orquestador. Misma dirección que en el modelo de dominio. |
| Pago `1` —→ `0..*` Discrepancia | Asociación | Un pago puede abrir varios casos; la discrepancia guarda `pagoId`. |
| Boleta `1..*` —→ `1` Pago | Asociación | Un pago confirmado emite una o más boletas; cada boleta conserva exactamente un `pagoId`. Pago no navega a sus boletas. |
| Boleta `1` ◆—→ `1` CodigoBoleta | Composición | El código es un valor de la boleta y cambia de versión con ella (R8). |
| Boleta `1` ◆—→ `1..*` Titularidad | Composición | La historia de titularidad vive dentro del agregado; una sola activa (R7). |
| Titularidad `1` —→ `1` Titular | Asociación | Titular tiene identidad propia y puede repetirse en varias boletas; la titularidad lo referencia. |
| CalculadoraDePrecio - - -> DesglosePrecio | Dependencia «create» | El servicio de dominio fabrica el valor y no lo conserva. |
| AforoExcedido, ReservaVencida —▷ ExcepcionDeDominio | Generalización | Toda violación de invariante comparte `regla` y `mensaje`; el orquestador captura la base. |
| PagoSolicitado, PagoConfirmado —▷ EventoDeDominio | Generalización | Todo hecho durable lleva identificador, instante y clave de idempotencia (AD-002). |
| OrquestadorDeCompra - - -> CrearReserva, IniciarPago, ConfirmarPago | Dependencia «use» | Los comandos entran como parámetros; el orquestador no los conserva. |
| OrquestadorDeCompra - - -> CompraEnCurso | Dependencia «create» | El orquestador crea el estado de la SAGA y lo persiste por su repositorio. |
| OrquestadorDeCompra `1` ◇—→ `1` cada puerto (9) | Agregación | Colaboradores inyectados —`admision`, `localidades`, `reservas`, `pagos`, `boletas`, `compras`, `discrepancias`, `pasarela`, `eventos`—: el orquestador los usa como partes, pero no los crea ni los destruye y una misma instancia se comparte entre orquestadores. Es la agregación compartida de UML. Navegable solo desde el orquestador: los puertos no conocen quién los usa. |
| OrquestadorDeCompra - - -> Reserva | Dependencia «create» | `reservar()` construye la Reserva con `Reserva.crear` y la entrega al repositorio. |
| OrquestadorDeCompra - - -> EventoDeDominio | Dependencia «use» | La SAGA crea `PagoSolicitado` y `PagoConfirmado` y los publica por el puerto; el orquestador depende de la base de los hechos. Ancla el grupo de eventos al resto del diagrama. |
| RepositorioDeBoletas - - -> Boleta | Dependencia «use» | Los puertos hablan en tipos del dominio: el dominio no depende de ellos, ellos del dominio. Los demás repositorios dependen igual de su agregado; se dibuja uno. |
| Adaptador - - -▷ puerto (5) | Realización | `AdaptadorDePasarelaTokenizada` ⇒ `PasarelaDePago`, `OutboxTransaccional` ⇒ `PublicadorDeEventos`, `ValidadorJwtDeAdmision` ⇒ `ValidadorDeAdmision`, `RepositorioPostgresDeLocalidades` ⇒ `RepositorioDeLocalidades`, `RepositorioPostgresDeReservas` ⇒ `RepositorioDeReservas`. La dependencia apunta hacia adentro: el dominio y la aplicación no conocen la infraestructura. |

No hay relación `Reserva → Localidad`: la reserva guarda `localidadId` en sus ítems y es el
orquestador quien pide a `Localidad.reservar` antes de crearla, dentro de la misma
transacción ([AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md)).

El grupo **Dominio: eventos y excepciones** queda anclado por `EventoDeDominio`. Las
excepciones no dibujan flecha: las lanzan `Localidad.reservar` (R1, R2) y
`Reserva.marcarEnPago` (R3) y el orquestador captura `ExcepcionDeDominio`; su vínculo está
en la tabla clase → concepto → regla y en la columna «Corresponde a» de cada clase.

## Correspondencia con el modelo de dominio

| Clase | Concepto del modelo | Regla o decisión que materializa |
|---|---|---|
| Localidad, Aforo, Silla | Localidad (RAÍZ), Aforo (VO), Silla (E) | `reservar` → R1, R2; `vender` → R2 al emitir; `Aforo` inmutable |
| Reserva, ItemReserva, DesglosePrecio | Reserva (RAÍZ), Ítem de reserva (E), Desglose de precio (VO) | `marcarEnPago` → R3; `total` → R13 |
| Pago, OrigenPago | Pago (RAÍZ), Origen de pago (VO) | `iniciar` → R4; `registrarConfirmacion` → idempotencia AD-002; R5 |
| Boleta, CodigoBoleta, Titularidad, Titular | Boleta (RAÍZ), Código de boleta (VO), Titularidad (E), Titular (E) | `emitir` → R7 (R2 la garantiza `Localidad.vender` en la misma transacción); `codigo.version` → R8 |
| Discrepancia | Discrepancia (RAÍZ) | `abrir`/`resolver` → R14; A-1 · correspondencia dinero–boleta cerrada en ≤ 15 min |
| CalculadoraDePrecio | Servicio de dominio; no es un concepto: fabrica el VO | R13, Ley 1493 `[V]` |
| AforoExcedido, ReservaVencida | Violaciones de R1/R2 y R3 | Resultado «rechazar» de la tabla de reglas |
| PagoSolicitado, PagoConfirmado | Hechos de la SAGA | Pasos 2 y 4 de AD-002 |
| OrquestadorDeCompra, CompraEnCurso, comandos | No están en el modelo: son de aplicación | AD-002 |
| Puertos y adaptadores | No están en el modelo: son de infraestructura | AD-002, AD-003, AD-004 |

Los nombres de las clases de dominio son idénticos a los del modelo; los atributos también,
con dos traducciones de tipo: `Conjunto<X>` pasa a `List<X>` y `Texto` a `String`.

## Cómo sustentarlo

Cinco aclaraciones que evitan que el evaluador lea el diagrama como una mezcla accidental
de dominio, persistencia e infraestructura:

1. **El caso empieza con un turno ya admitido.** La fila, la política y la emisión del turno
   son otro contexto; aquí solo se valida el JWT que el turno produce.
2. **`CrearReserva`, `IniciarPago` y `ConfirmarPago` son clases de aplicación**, no
   entidades: son la entrada de cada paso de la SAGA y no se persisten.
3. **`PasarelaDePago`, `ValidadorDeAdmision`, `PublicadorDeEventos` y los repositorios son
   puertos** («interface»): la aplicación los usa sin saber qué hay detrás.
4. **Los adaptadores no son dominio.** Realizan un puerto y encapsulan PostgreSQL, la
   pasarela o el JWT; se pueden cambiar sin tocar una sola clase de dominio.
5. **Recorrido sugerido:** las vistas guiadas en orden —aplicación y puertos, reservar,
   pagar y emitir, adaptadores— y, en cada una, un método y la regla que hace cumplir.

## Notación

| Símbolo | Significado |
|---|---|
| `«aggregate root»`, `«entity»`, `«value object»`, `«domain service»`, `«application service»`, `«command»`, `«event»`, `«exception»`, `«interface»`, `«adapter»`, `«abstract»` | Estereotipo en el primer compartimento. Nombre en cursiva = clase abstracta. |
| `+` `-` `#` | Visibilidad pública, privada y protegida. |
| `nombre(param: Tipo): Retorno` | Firma completa de operación. |
| ◆ / ◇ | Composición / agregación, en el extremo del todo. |
| → / - - -> | Asociación navegable / dependencia. |
| —▷ / - - -▷ | Generalización / realización de interfaz. |
| `1`, `0..1`, `1..*`, `0..*` | Multiplicidad en cada extremo. |

## Correspondencia con la rúbrica

| Criterio | Evidencia |
|---|---|
| Selección y alcance del caso | Caso justificado frente a los otros dos candidatos; tabla explícita de lo que entra y lo que queda fuera con la razón. |
| Clases, atributos y métodos | 39 clases con estereotipo, atributos y operaciones con visibilidad, tipo y firma completa; entidades, objetos de valor, servicios y repositorios diferenciados. |
| Relaciones y multiplicidad | Composición, agregación, asociación, dependencia, realización y generalización, cada una con la multiplicidad escrita en cada extremo y la navegabilidad justificada. |
| Coherencia con dominio y arquitectura | Nombres idénticos al modelo de dominio; cada capa trazada a un ADR; tabla clase → concepto → regla. |
| Notación UML | Compartimentos, estereotipos, marcadores ◆ ◇ ▷ y multiplicidades en los extremos, generados desde este archivo; vistas guiadas para leerlo por recorrido. |
