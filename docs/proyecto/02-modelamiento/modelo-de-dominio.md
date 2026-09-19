# Modelo de dominio de TicketRight

Este modelo describe el negocio completo de TicketRight: desde la definición del evento
hasta la liquidación al promotor, pasando por la fila, la reserva, el pago, la boleta, su
transferencia o reventa, las devoluciones y la conciliación. Es un modelo conceptual. No
representa tablas, servicios, colas ni decisiones de despliegue.

## Contenido

| Sección | Qué responde |
|---|---|
| [Artefactos](#artefactos) | Dónde está el diagrama y cómo se regenera |
| [Convención](#convención) | Qué significa cada marca del diagrama |
| [Tipos y enumeraciones](#tipos-y-enumeraciones) | Qué es cada tipo de atributo y qué valores toma cada estado |
| [Contextos acotados](#contextos-acotados) | Cuáles son los cuatro contextos y por qué se cortan ahí |
| [Agregados, entidades y objetos de valor](#agregados-entidades-y-objetos-de-valor) | Cada concepto con identidad, atributos tipados y semántica |
| [Relaciones, cardinalidades y navegación](#relaciones-cardinalidades-y-navegación) | Las dieciséis relaciones y por qué se navegan en ese sentido |
| [Reglas de negocio e invariantes](#reglas-de-negocio-e-invariantes) | Las catorce reglas, dónde se cumplen y qué pasa si se violan |
| [Glosario de lenguaje ubicuo](#glosario-de-lenguaje-ubicuo) | El vocabulario que debe repetirse idéntico en los demás entregables |
| [Trazabilidad con las decisiones aceptadas](#trazabilidad-con-las-decisiones-aceptadas) | Qué ADR deja huella en qué parte del modelo |
| [Correspondencia con la rúbrica](#correspondencia-con-la-rúbrica) | Qué evidencia cubre cada criterio |

## Artefactos

- [Diagrama interactivo y exportable](modelo-de-dominio.html): 22 cajas —raíces y
  entidades— con sus agregados enmarcados, 10 objetos de valor anidados, 16 relaciones y las
  14 reglas.
- [Fuente validada por Archify](modelo-de-dominio.json): geometría, relaciones y tarjetas.
- [Mapa de contextos y raíces de agregado](modelo-de-dominio-mapa.html)
  ([fuente](modelo-de-dominio-mapa.json)): las doce raíces con **dos atributos clave** cada
  una y sus relaciones, en **una sola pantalla**; es la vista de entrada al dominio completo.
- **Este archivo es la fuente de los atributos.** El posprocesado lee las tablas de la
  sección [Agregados, entidades y objetos de valor](#agregados-entidades-y-objetos-de-valor)
  y las dibuja dentro de cada caja, de modo que el diagrama y el texto no pueden divergir.

El HTML permite ampliar, buscar y exportar sin perder calidad. Para regenerarlo:

```bash
node .agents/skills/archify/bin/archify.mjs deliver architecture \
  proyecto/02-modelamiento/modelo-de-dominio.json \
  proyecto/02-modelamiento/modelo-de-dominio.html --quality standard --json
node herramientas/postprocesa-modelo-dominio.mjs \
  proyecto/02-modelamiento/modelo-de-dominio.json \
  proyecto/02-modelamiento/modelo-de-dominio.md \
  proyecto/02-modelamiento/modelo-de-dominio.html
```

El mapa se regenera igual, con su propio posprocesado de atributos clave:

```bash
node .agents/skills/archify/bin/archify.mjs deliver architecture \
  proyecto/02-modelamiento/modelo-de-dominio-mapa.json \
  proyecto/02-modelamiento/modelo-de-dominio-mapa.html --quality standard --json
node herramientas/postprocesa-mapa-dominio.mjs \
  proyecto/02-modelamiento/modelo-de-dominio-mapa.json \
  proyecto/02-modelamiento/modelo-de-dominio.md \
  proyecto/02-modelamiento/modelo-de-dominio-mapa.html
```

Recibo del mapa (18 de septiembre de 2026, antes del posprocesado): fuente
`sha256 9977d4ac0fa8…` (7.742 bytes) → HTML `sha256 e7fe322a6e48…` (815.191 bytes).

Se entrega con el perfil `standard` de Archify. Las nueve comprobaciones de composición del
perfil `showcase` pasan —cero cruces, cero corredores ambiguos, cero etiquetas en conflicto—;
la única que no pasa es la de escala, que exige un lienzo de ~1 400 px de ancho para leerse
sin ampliar en una pantalla de 1 440 px. Un dominio de 22 cajas con sus atributos no cabe
ahí, y reducirlo a las raíces con tres atributos era exactamente lo que había que corregir.
La lectura en una pantalla queda cubierta por el [mapa](modelo-de-dominio-mapa.html) —doce
raíces con dos atributos clave, cuatro contextos, 6,7 px de texto proyectado a 1440×900— y
por las cuatro vistas guiadas del visor; el detalle completo sigue disponible para ampliar,
buscar y exportar.

## Convención

| Marca | Significado |
|---|---|
| **RAÍZ** | Raíz de agregado: única entrada permitida para cambiar el agregado. Protege sus reglas. |
| **E** | Entidad con identidad propia y continuidad en el tiempo. `E · Boleta` indica que vive dentro del agregado Boleta. |
| **VO** | Objeto de valor inmutable, definido por sus datos y no por una identidad. No es una caja: sus campos aparecen anidados bajo el atributo que lo usa. |
| Flecha `A → B` | A conoce o solicita una acción a B. No implica una llave foránea. |
| `1:0..*` | Cardinalidad en el orden origen:destino. |
| Región punteada | Contexto acotado: vocabulario y reglas que cambian juntos. |
| Marco interior | Agregado: la raíz y las entidades que solo se modifican a través de ella. |
| `atributo?` | Atributo opcional: solo existe cuando el negocio lo produce. |

Las referencias entre agregados se expresan mediante identificadores de dominio
(`fanId`, `pagoId`). Ningún agregado modifica directamente el interior de otro.

## Tipos y enumeraciones

Los tipos son conceptuales, no de base de datos.

| Tipo | Definición |
|---|---|
| `UUID` | Identificador sin significado de negocio. |
| `IdOpaco` | Referencia a una identidad que **no revela ningún dato personal**. Solo el contexto de admisión e identidad puede resolverla a una persona; los demás contextos la transportan sin poder leerla. Es la forma concreta de [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md). |
| `FechaHora` | Instante con zona horaria. |
| `RangoFecha` | Par `inicio`–`fin`. |
| `Dinero` | Monto y moneda. Nunca un número suelto. |
| `Porcentaje` | Fracción con dos decimales, aplicada sobre un `Dinero`. |
| `Correo` | Canal de contacto verificable. Solo existe en `Identidad`. |
| `Texto`, `Booleano`, `EnteroPositivo`, `EnteroNoNegativo`, `NIT` | Escalares con la restricción que su nombre indica. |
| `Conjunto<X>` | Colección sin duplicados de elementos internos del agregado. |
| `ReglasVenta`, `Aforo`, `DesglosePrecio`… | Objetos de valor. Están definidos como filas `VO` en las tablas de cada contexto y el diagrama los dibuja anidados bajo el atributo que los usa. |

| Enumeración | Valores |
|---|---|
| `EstadoEvento` | `borrador`, `publicado`, `enVenta`, `ventaCerrada`, `realizado`, `cancelado` |
| `PerfilDemanda` | `cotidiano`, `masivo`. Lo declara el promotor y decide si la venta abre con fila visible, según [AD-005](../decisiones/0005-estilo-de-arquitectura.md) |
| `TipoProductor` | `permanente`, `ocasional`. Cambia el plazo para declarar la contribución parafiscal `[V]` |
| `EstadoConvenio` | `borrador`, `firmado`, `vencido` |
| `TipoLocalidad` | `numerada`, `general` |
| `EstadoSilla` | `libre`, `reservada`, `vendida`, `bloqueada` |
| `ModoAdmision` | `pasoDirecto`, `filaVisible`. Corresponden a los perfiles cotidiano y pico de [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) |
| `EstadoFila` | `programada`, `abierta`, `cerrada` |
| `CriterioOrden` | `ordenDeLlegada`, `aleatorioPorLote` `[S]` |
| `EstadoTurno` | `enEspera`, `admitido`, `usado`, `vencido`, `rechazado` |
| `EstadoFan` | `activo`, `suspendido` |
| `TipoDocumento` | `cedula`, `cedulaExtranjeria`, `pasaporte`, `tarjetaIdentidad` |
| `FinalidadTratamiento` | `emision`, `notificacion`, `transferenciaAlPromotor`, `marketing`. Cada una exige su propio consentimiento `[V]` Ley 1581 |
| `TipoOrigenPago` | `reserva`, `reventa` |
| `EstadoReserva` | `vigente`, `enPago`, `confirmada`, `vencida`, `cancelada` |
| `MedioPago` | `tarjeta`, `pse`, `billetera` `[S]` según la pasarela que se contrate |
| `EstadoPago` | `iniciado`, `pendientePasarela`, `confirmado`, `rechazado`, `enConciliacion`, `devueltoParcial`, `devueltoTotal` |
| `MotivoDevolucion` | `retracto` (5 días hábiles `[V]` Ley 1480 art. 47), `cancelacionEvento`, `modificacionEvento`, `anulacionPorFraude`, `compensacionPorFallo` |
| `EstadoDevolucion` | `solicitada`, `aprobada`, `rechazada`, `ejecutada` |
| `TipoDiscrepancia` | `cobroSinBoleta`, `boletaSinCobro`, `inventarioDuplicado`, `devolucionSinAnulacion`, `respuestaTardiaPasarela` |
| `ResolucionDiscrepancia` | `emisionCompletada`, `devolucionEjecutada`, `boletaAnulada`, `sinAccion` |
| `TipoMovimiento` | `venta`, `devolucion`, `reventa`, `parafiscal`, `ajuste` |
| `EstadoLiquidacion` | `abierta`, `enConciliacion`, `cerrada`, `desembolsada` |
| `EstadoBoleta` | `emitida`, `transferida`, `revendida`, `anulada` |
| `EstadoTitular` | `activo`, `anterior` |
| `EstadoTitularidad` | `activa`, `finalizada` |
| `EstadoTransferencia` | `solicitada`, `aceptada`, `rechazada`, `vencida` |
| `EstadoReventa` | `publicada`, `vendida`, `retirada`, `vencida` |

La plataforma de observabilidad usa estos mismos valores como dimensión de sus métricas;
ver [`observabilidad.md`](observabilidad.md#métricas-de-negocio-e-integridad).

## Contextos acotados

| Contexto | Conceptos que posee | Límite y razón |
|---|---|---|
| **Oferta de eventos** | Promotor, Convenio, Recinto, Evento, Reglas de venta, Reglas de reventa, Cancelación, Localidad, Aforo y Silla | Define **qué** se vende, cuánta capacidad está autorizada y bajo qué reglas. No decide quién entra a comprar ni procesa dinero. |
| **Admisión e identidad** | Fan, Consentimiento, Identidad, Documento de identidad, Fila de venta, Política de fila y Turno | Decide **quién puede intentar reservar** y bajo qué orden, y custodia los datos personales. Un turno habilita el intento, pero nunca promete inventario. Es el único contexto que puede resolver un `IdOpaco` a una persona, de acuerdo con [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md). |
| **Venta y recaudo** | Reserva, Ítem de reserva, Desglose de precio, Pago, Origen de pago, Devolución, Discrepancia, Liquidación y Movimiento | Custodia inventario durante la compra, registra el resultado económico con sus tres componentes, abre y cierra los casos de conciliación y liquida al promotor. Mantiene separados el bloqueo temporal de inventario y la espera de una pasarela externa. |
| **Derecho de asistencia** | Boleta, Código de boleta, Titular, Titularidad, Transferencia y Reventa | Administra el derecho vigente de ingreso y su historia. Una boleta puede cambiar de titular sin cambiar su identidad. |

La pasarela de pago y el sistema de control de acceso del recinto están fuera de estos
contextos: TicketRight registra su interacción, pero no controla su operación. La gestión
física del evento, el registro PULEP, la declaración del parafiscal ante la autoridad y las compras o reventas
por fuera de TicketRight también quedan fuera, como define el
[alcance del negocio](../01-caso-de-negocio/alcance.md). Las notificaciones al fan son un
subdominio de soporte: consumen estos conceptos y no los modifican.

## Agregados, entidades y objetos de valor

Doce raíces de agregado: Promotor, Recinto, Evento, Localidad, Fan, Identidad, Fila de
venta, Reserva, Pago, Discrepancia, Liquidación y Boleta. Promotor y Recinto son agregados
propios porque se administran fuera del flujo de venta y los demás solo los referencian por
identificador. Cada atributo está porque sostiene una regla, una
relación o una obligación legal; lo que no sostiene nada no está. El posprocesado del
diagrama lee estas tablas: las raíces y entidades son cajas, y los objetos de valor se
dibujan anidados bajo el atributo que los usa.

### Oferta de eventos

| Concepto | Tipo | Identidad y atributos | Semántica |
|---|---|---|---|
| Promotor | RAÍZ | `promotorId: UUID`, `nombreLegal: Texto`, `nit: NIT`, `tipoProductor: TipoProductor`, `convenio: Convenio` | Persona jurídica responsable de organizar y comercializar eventos. `tipoProductor` fija el plazo en que debe declarar la contribución parafiscal: con el IVA si es permanente, cinco días hábiles después del evento si es ocasional `[V]` [Ley 1493](../01-caso-de-negocio/validaciones.md#aforo-y-evento-masivo). |
| Convenio | VO | `cargoServicio: Porcentaje`, `comisionReventa: Porcentaje`, `vigencia: RangoFecha`, `estado: EstadoConvenio` | Condiciones comerciales firmadas con el promotor: qué porcentaje del valor nominal es el cargo por servicio y qué comisión aplica a la reventa, con su vigencia. `[S]` 12% y 10% en el [modelo financiero](../01-caso-de-negocio/modelo-financiero.md); el reparto interno lo valida Quinnie. Es la fuente de `Liquidación.participaciones` y de `DesglosePrecio.cargoServicio`. |
| Recinto | RAÍZ | `recintoId: UUID`, `nombre: Texto`, `ciudad: Texto`, `aforoMaximo: EnteroPositivo` | Lugar autorizado donde ocurre un evento. `aforoMaximo` es el techo que ninguna suma de localidades puede superar (R1). |
| Evento | RAÍZ | `eventoId: UUID`, `promotorId: UUID`, `recintoId: UUID`, `nombre: Texto`, `inicio: FechaHora`, `estado: EstadoEvento`, `perfilDemanda: PerfilDemanda`, `reglasVenta: ReglasVenta`, `cancelacion: Cancelacion?` | Define la oferta comercial y su ciclo de publicación, venta, realización y cancelación. `perfilDemanda` lo declara el promotor y decide si la venta abre con fila visible ([AD-005](../decisiones/0005-estilo-de-arquitectura.md)). |
| Reglas de venta | VO | `inicioVenta: FechaHora`, `finVenta: FechaHora`, `limitePorFan: EnteroPositivo`, `transferenciaPermitida: Booleano`, `reventa: ReglasReventa?` | Condiciones publicadas que aplican a todas las boletas del evento. `limitePorFan` es lo que impide que una sola persona compre cincuenta boletas. |
| Reglas de reventa | VO | `precioMaximo: Dinero`, `comision: Porcentaje`, `ventana: RangoFecha` | Solo existen si el promotor habilita la reventa. Son los límites que R9 hace cumplir. `comision` es la del evento; si el promotor no la fija, se copia de `Convenio.comisionReventa` al publicar el evento, de modo que la regla del evento siempre manda y el convenio es el valor por defecto. `[S]` Los valores concretos los valida Quinnie, según el [alcance](../01-caso-de-negocio/alcance.md#5-alcance--qué-entra). |
| Cancelación | VO | `declaradaEn: FechaHora`, `mecanismoDevolucion: Texto`, `informadoSicEn: FechaHora?` | Registro de la cancelación o modificación del evento. `informadoSicEn` evidencia el deber de informar el mecanismo de devolución a la SIC en tres días hábiles `[V]` [validaciones](../01-caso-de-negocio/validaciones.md#comercio-electrónico-y-devoluciones). |
| Localidad | RAÍZ | `localidadId: UUID`, `eventoId: UUID`, `tipo: TipoLocalidad`, `aforo: Aforo`, `precio: Dinero`, `sillas: Conjunto<Silla>` | Unidad de inventario con capacidad y precio comunes. Es la autoridad que decide si un ítem cabe ([AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md)). `precio` es el valor nominal; el cargo y el parafiscal se calculan sobre él. |
| Aforo | VO | `autorizado: EnteroPositivo`, `reservado: EnteroNoNegativo`, `vendido: EnteroNoNegativo` | Controla que `reservado + vendido` nunca exceda `autorizado` (R1). |
| Silla | E | `sillaId: UUID`, `fila: Texto`, `numero: Texto`, `estado: EstadoSilla` | Unidad identificable de una localidad numerada. Solo puede tener una asignación activa (R2). |

### Admisión e identidad

| Concepto | Tipo | Identidad y atributos | Semántica |
|---|---|---|---|
| Fan | RAÍZ | `fanId: UUID`, `identidadRef: IdOpaco`, `estado: EstadoFan`, `consentimientos: Conjunto<Consentimiento>` | Persona que entra a una venta, reserva y puede convertirse en titular. Es la participación, no la persona: la persona es `Identidad`, y `identidadRef` es lo único que los demás contextos ven. |
| Consentimiento | E | `consentimientoId: UUID`, `finalidad: FinalidadTratamiento`, `otorgadoEn: FechaHora`, `revocadoEn: FechaHora?` | Evidencia qué uso de datos fue aceptado y si sigue vigente. Cada finalidad exige su propio consentimiento `[V]` Ley 1581; la transferencia de datos al promotor —el paquete de datos del OKR 4— es una de ellas (R11). |
| Identidad | RAÍZ | `identidadId: IdOpaco`, `nombreLegal: Texto`, `documento: DocumentoIdentidad`, `correo: Correo` | Los datos personales de la persona. Es el único lugar del dominio donde existen nombre, documento y contacto. `correo` es el canal para avisar el turno y entregar la boleta; `documento` es la asociación que exige el Decreto 1622 `[V]` y la que el control de acceso valida en la puerta. Vive en almacén y credenciales propios ([AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md)). |
| Documento de identidad | VO | `tipo: TipoDocumento`, `numero: Texto` | Tipo y número del documento que se asocia a la boleta. |
| Fila de venta | RAÍZ | `filaId: UUID`, `eventoId: UUID`, `modo: ModoAdmision`, `estado: EstadoFila`, `politica: PoliticaFila`, `turnos: Conjunto<Turno>` | Regula el ingreso a una ventana de venta. En modo `pasoDirecto` entrega el turno de inmediato y no muestra fila; en `filaVisible` ordena y libera al ritmo de la política ([AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md)). |
| Política de fila | VO | `criterio: CriterioOrden`, `tasaAdmision: EnteroPositivo`, `vigencia: RangoFecha` | Regla publicada con la que se ordenan y habilitan turnos (R6). `tasaAdmision` es cuántos turnos se admiten por minuto `[S]`; el valor sale de la prueba de capacidad pendiente de AD-006. |
| Turno | E | `turnoId: UUID`, `fanId: UUID`, `posicion: EnteroPositivo`, `estado: EstadoTurno`, `ingresoEn: FechaHora`, `admitidoEn: FechaHora?`, `venceEn: FechaHora` | Derecho temporal a intentar una reserva, emitido por la raíz **Fila de venta**: el fan no navega a `Turno`, lo recibe de la fila. No representa una boleta ni garantiza disponibilidad. Conserva ingreso, posición, admisión y expiración —y el rechazo, como estado— para que la fila pueda reconstruirse y auditarse (A-4 · equidad y auditabilidad: 100% de turnos conformes y reconstruibles; AD-006). |

### Venta y recaudo

| Concepto | Tipo | Identidad y atributos | Semántica |
|---|---|---|---|
| Reserva | RAÍZ | `reservaId: UUID`, `fanId: UUID`, `turnoId: UUID`, `estado: EstadoReserva`, `creadaEn: FechaHora`, `venceEn: FechaHora`, `total: Dinero`, `items: Conjunto<ItemReserva>` | Compromiso temporal y durable sobre inventario. Es requisito para iniciar el pago. `turnoId` es la prueba de que el intento fue admitido; `venceEn` es lo que libera el inventario abandonado (A-5 · liberación en ≤ 10 min; R3). |
| Ítem de reserva | E | `itemId: UUID`, `localidadId: UUID`, `sillaId: UUID?`, `cantidad: EnteroPositivo`, `precio: DesglosePrecio` | Inventario concreto comprometido. `sillaId` solo existe para una localidad numerada. |
| Desglose de precio | VO | `valorNominal: Dinero`, `cargoServicio: Dinero`, `contribucionParafiscal: Dinero` | Los tres bolsillos de cada boleta: el del promotor, el de TicketRight y el del Estado. `contribucionParafiscal` es el 10% del valor nominal cuando este es igual o superior a 3 UVT `[V]` [Ley 1493](../01-caso-de-negocio/validaciones.md#los-cuatro-hallazgos-que-cambian-el-proyecto); `cargoServicio` aplica el `Convenio.cargoServicio` vigente al reservar (`[S]` 12% hoy, según el modelo financiero). Se guarda calculado para que un cambio de tarifa no altere ventas pasadas (R13). |
| Pago | RAÍZ | `pagoId: UUID`, `origen: OrigenPago`, `monto: Dinero`, `medio: MedioPago`, `estado: EstadoPago`, `claveIdempotencia: Texto`, `referenciaExterna: Texto?`, `iniciadoEn: FechaHora`, `confirmadoEn: FechaHora?`, `devoluciones: Conjunto<Devolucion>` | Resultado económico trazable de una reserva o de una reventa, incluso ante respuestas tardías o repetidas de la pasarela. `claveIdempotencia` es lo que hace que un webhook repetido produzca el mismo resultado ([AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md)); `referenciaExterna` es el identificador que asigna la pasarela. **No guarda número de tarjeta, CVV ni credenciales**: eso queda tokenizado en la pasarela ([AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md)). |
| Origen de pago | VO | `tipo: TipoOrigenPago`, `referenciaId: UUID` | Qué se está cobrando: la reserva o la reventa cuyo identificador lleva (R4). |
| Devolución | E | `devolucionId: UUID`, `boletaId: UUID?`, `motivo: MotivoDevolucion`, `monto: Dinero`, `estado: EstadoDevolucion`, `solicitadaEn: FechaHora`, `resueltaEn: FechaHora?` | Reversión total o parcial vinculada al pago original. Cuando `motivo` es `retracto`, `solicitadaEn` debe caer dentro de los cinco días hábiles de la compra `[V]` Ley 1480 art. 47. `boletaId` enlaza la boleta que R10 obliga a anular. |
| Discrepancia | RAÍZ | `discrepanciaId: UUID`, `tipo: TipoDiscrepancia`, `pagoId: UUID`, `boletaId: UUID?`, `detectadaEn: FechaHora`, `resueltaEn: FechaHora?`, `resolucion: ResolucionDiscrepancia?` | Caso abierto de conciliación: dinero confirmado sin boleta, boleta sin cobro, inventario duplicado o devolución sin anulación. Es lo que A-1 · confiabilidad dinero–boleta cuenta —«cero discrepancias abiertas al cierre»— y lo que el orquestador de [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) abre cuando agota reintentos (R14). |
| Liquidación | RAÍZ | `liquidacionId: UUID`, `promotorId: UUID`, `periodo: RangoFecha`, `bruto: Dinero`, `parafiscalRecaudado: Dinero`, `participaciones: Dinero`, `devoluciones: Dinero`, `neto: Dinero`, `estado: EstadoLiquidacion`, `movimientos: Conjunto<Movimiento>` | Consolidación conciliada de lo que corresponde al promotor en un periodo. `bruto` es el valor nominal confirmado; `parafiscalRecaudado` se entrega separado porque el promotor debe declararlo `[V]`; `participaciones` es lo que el promotor recibe del cargo por servicio y de la comisión de reventa según el `Convenio` vigente en cada venta —el monto queda fijado en su `Movimiento`, así que un cambio de convenio no altera ventas pasadas— `[S]`; el reparto lo valida Quinnie. |
| Movimiento | E | `movimientoId: UUID`, `tipo: TipoMovimiento`, `origenId: UUID`, `monto: Dinero`, `conciliadoEn: FechaHora` | Hecho económico individual —una venta, una devolución, una reventa, un parafiscal, un ajuste— ya conciliado. Es la unidad con la que R12 verifica que la liquidación solo contiene lo confirmado. |

### Derecho de asistencia

| Concepto | Tipo | Identidad y atributos | Semántica |
|---|---|---|---|
| Boleta | RAÍZ | `boletaId: UUID`, `eventoId: UUID`, `localidadId: UUID`, `sillaId: UUID?`, `pagoId: UUID`, `precioNominal: Dinero`, `codigo: CodigoBoleta`, `estado: EstadoBoleta`, `emitidaEn: FechaHora`, `anuladaEn: FechaHora?`, `titularidades: Conjunto<Titularidad>`, `transferencias: Conjunto<Transferencia>`, `reventas: Conjunto<Reventa>` | Derecho verificable de asistencia. `localidadId` y `sillaId` dicen dónde es válida —sin ellos no se puede verificar A-2 · cero boletas sobre el aforo por localidad ni hacer cumplir R2 al emitir—. `precioNominal` es la base del tope de reventa. Conserva una sola titularidad activa y la historia completa de cambios. |
| Código de boleta | VO | `valor: Texto`, `version: EnteroPositivo` | Identificador verificable —el QR— que cambia de versión al invalidar el derecho anterior (R8). |
| Titular | E | `titularId: UUID`, `fanId: UUID`, `identidadRef: IdOpaco`, `estado: EstadoTitular` | Persona que posee actualmente el derecho de asistencia. Es siempre un fan; `identidadRef` permite que el control de acceso valide el documento sin que este contexto guarde datos personales. |
| Titularidad | E | `titularidadId: UUID`, `titularId: UUID`, `inicio: FechaHora`, `fin: FechaHora?`, `estado: EstadoTitularidad` | Intervalo durante el cual un titular posee la boleta (R7). |
| Transferencia | E | `transferenciaId: UUID`, `titularOrigenId: UUID`, `fanDestinoId: UUID`, `estado: EstadoTransferencia`, `solicitadaEn: FechaHora`, `aceptadaEn: FechaHora?` | Cambio de titular sin compraventa dentro de TicketRight. El destino es un fan con identidad. |
| Reventa | E | `reventaId: UUID`, `titularVendedorId: UUID`, `fanCompradorId: UUID?`, `precio: Dinero`, `comision: Dinero`, `pagoId: UUID?`, `estado: EstadoReventa`, `publicadaEn: FechaHora` | Oferta y cambio de titular con pago, solo cuando las reglas del evento lo permiten. Origina un `Pago` propio; `comision` es lo que la liquidación reparte `[S]`. |

## Relaciones, cardinalidades y navegación

| Origen → destino | Cardinalidad | Significado | Navegación justificada |
|---|---:|---|---|
| Promotor → Evento | `1:0..*` | Un promotor organiza varios eventos; cada evento tiene un promotor responsable. | Desde el promotor se consulta su portafolio. El evento conserva solo `promotorId`. |
| Recinto → Evento | `1:0..*` | Un recinto alberga eventos en diferentes fechas; cada evento ocurre en un recinto. | La agenda parte del recinto. El evento conserva solo `recintoId`. |
| Evento → Localidad | `1:1..*` | Todo evento define al menos una localidad. | Evento publica su oferta; Localidad conserva `eventoId` y no modifica al Evento. |
| Evento → Fila de venta | `1:1` | Cada evento tiene una fila, aunque en modo `pasoDirecto` no se vea. | La apertura del evento configura la fila; la fila conserva `eventoId` y no cambia reglas comerciales. |
| Fan → Identidad | `1:1` | Todo fan corresponde a exactamente una persona identificada. | El fan conserva `identidadRef`; solo este contexto puede resolverla. Nadie navega de Identidad hacia afuera. |
| Fan → Fila de venta | `1:0..*` | Un fan recibe turnos en distintas ventas. | El fan no navega directamente a `Turno`: accede a sus turnos a través de la raíz **Fila de venta**, y cada Turno conserva `fanId`, nunca datos personales. |
| Fan → Reserva | `1:0..*` | Un fan crea varias reservas a lo largo del tiempo. | El historial se consulta desde el fan; Reserva conserva `fanId`. |
| Turno → Reserva | `1:0..1` | Un turno admitido habilita como máximo un intento de reserva. | Reserva valida `turnoId` y lo marca usado; no navega la fila. |
| Localidad → Ítem de reserva | `1:0..*` | Cada ítem compromete capacidad de una localidad y, si aplica, una silla. | La autoridad de inventario valida la solicitud; el ítem guarda `localidadId` y `sillaId`. |
| Reserva → Pago | `1:0..1` | Una reserva puede no pagarse o producir un único pago. | El pago nace de la reserva (`origen.tipo = reserva`); la reserva conoce su resultado, no los detalles de la pasarela. |
| Reventa → Pago | `1:0..1` | Una reventa publicada produce un pago cuando alguien la compra. | El pago nace de la reventa (`origen.tipo = reventa`); Reventa conserva `pagoId` al venderse. |
| Pago → Boleta | `1:1..*` | Un pago confirmado emite una o más boletas según los ítems reservados. | La emisión usa el pago confirmado; Boleta conserva `pagoId` para trazabilidad. |
| Pago → Discrepancia | `1:0..*` | Un pago puede abrir casos de conciliación cuando su cadena no cierra. | La discrepancia conserva `pagoId`; Pago no navega sus discrepancias. |
| Pago → Liquidación | `0..*:1` | Los pagos confirmados —de reservas y reventas— y sus devoluciones aportan movimientos a una liquidación. | Liquidación incorpora movimientos conciliados con `origenId`; no modifica pagos. |
| Boleta → Titular | `1:1` | Toda boleta vigente tiene exactamente un titular activo. | Boleta controla la titularidad; Titular no puede modificarla directamente. |
| Fan → Titular | `1:0..*` | Un fan puede ser titular de varias boletas. | Titular conserva `fanId`; desde el fan se consultan sus boletas vigentes. |

Dos relaciones se dejan derivadas a propósito. **`Evento → Liquidación`** se obtiene a través
de los pagos confirmados; así un cierre financiero no puede modificar la oferta. **`Boleta →
Liquidación`** ya no es directa: una devolución vive dentro del Pago y una reventa origina su
propio Pago, así que todo movimiento económico llega a la liquidación por un único camino,
`Pago → Liquidación`, y ningún ajuste puede entrar sin un pago que lo respalde.

## Reglas de negocio e invariantes

| Regla | Invariante | Dónde se hace cumplir | Resultado si se viola |
|---|---|---|---|
| **R1** `[V]` | `reservado + vendido` de una localidad nunca supera su `aforo.autorizado`, y la suma de localidades nunca supera `Recinto.aforoMaximo`. | Agregado **Localidad**, mediante `Aforo`; Evento al definir localidades. | Rechazar el ítem completo; no iniciar pago. La obligación está documentada en [validaciones](../01-caso-de-negocio/validaciones.md#aforo-y-evento-masivo). |
| **R2** | Una silla solo puede tener una asignación activa: un ítem de reserva vigente o una boleta no anulada. | Agregado **Localidad**, único que conoce las asignaciones: al reservar (`libre → reservada`) y al vender durante la emisión (`reservada → vendida`), en la misma transacción en que se emite la Boleta. Boleta solo registra el `sillaId` que Localidad ya confirmó. | Rechazar la segunda asignación; si aparece al emitir, no emitir y abrir una Discrepancia `inventarioDuplicado`. |
| **R3** `[S]` | Una reserva sin pago confirmado vence en máximo diez minutos: `venceEn = creadaEn + 10 min` y a partir de `venceEn` —inclusive— ya no está vigente ni retiene inventario; la liberación efectiva la ejecuta el proceso de expiración en su siguiente ciclo, `[S]` ≤ 30 s después. | Agregado **Reserva** y proceso durable de expiración definido en [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md). | Marcarla vencida y liberar sus ítems. Responsable de validar el umbral: equipo TicketRight. |
| **R4** | Ningún pago inicia sin un origen vigente: una reserva `vigente` o una reventa `publicada`. | Agregado **Pago**, que valida `origen` antes de solicitar el cobro. | Rechazar el inicio y no contactar la pasarela. |
| **R5** `[S]` | Todo cobro confirmado termina en boleta emitida o devolución trazable en máximo 15 minutos. | Agregados **Pago** y **Boleta**, coordinados según [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md). | Reintentar; si persiste, abrir Discrepancia `cobroSinBoleta` y alertar. Responsable de validar el umbral: equipo TicketRight. |
| **R6** | Todo turno respeta la política publicada y su decisión puede reconstruirse desde `ingresoEn`, `posicion` y `admitidoEn`. | Agregado **Fila de venta**. | Rechazar el turno inválido, conservar evidencia y permitir revisión. |
| **R7** | Cada boleta vigente tiene exactamente un titular activo y una titularidad `activa`. | Agregado **Boleta**. | Rechazar la operación y conservar la titularidad anterior. |
| **R8** | Una transferencia aceptada o una reventa vendida cierra la titularidad anterior y cambia la `version` del código. | Agregado **Boleta**. | Si no puede hacerse de forma completa, no cambia el titular. |
| **R9** `[S]` | La reventa solo existe si `ReglasVenta.reventa` está definida, `precio ≤ precioMaximo` y la fecha cae en `ventana`; la comisión es la de las reglas del evento, que por defecto copian el convenio. | Agregado **Boleta**, consultando la versión de `Reglas de reventa` vigente al publicar. | Rechazar la publicación o compra. Responsable de validar las reglas: Quinnie, según el [alcance](../01-caso-de-negocio/alcance.md). `PENDIENTE: el alcance menciona además una «elegibilidad» del comprador; sigue [S] a cargo de Quinnie y entra al modelo solo si se define.` |
| **R10** `[V]` | Una devolución aprobada anula la boleta correspondiente y genera el movimiento económico; un retracto solo se acepta dentro de los cinco días hábiles siguientes a la compra. | Agregados **Pago**, **Boleta** y **Liquidación**, mediante movimientos trazables. | Si falta un paso, abrir Discrepancia `devolucionSinAnulacion`; nunca dejar la boleta utilizable y el dinero devuelto a la vez. |
| **R11** `[V]` | Los datos de `Identidad` solo se comparten para una finalidad con consentimiento vigente (`revocadoEn` vacío). | Agregado **Fan** y su `Consentimiento`, conforme a [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md). | Denegar el acceso o transferencia y registrar el intento. El texto y la retención concretos siguen pendientes de validación jurídica. |
| **R12** | Una liquidación cerrada contiene únicamente movimientos conciliados, y `neto = bruto + parafiscalRecaudado + participaciones − devoluciones`. | Agregado **Liquidación**. | Impedir el cierre y enviar diferencias a conciliación. |
| **R13** `[V]` | Todo ítem cobrado lleva su desglose; `Reserva.total` y `Pago.monto` son la suma de `valorNominal + cargoServicio + contribucionParafiscal` de sus ítems, con parafiscal igual al 10% del nominal si este es ≥ 3 UVT y cero si no, y cargo igual al `Convenio.cargoServicio` vigente al reservar. | Agregados **Reserva** al crear ítems y **Pago** al iniciar. | Rechazar el ítem o el pago; nunca cobrar un total sin desglose. Fuente: [Ley 1493](../01-caso-de-negocio/validaciones.md#los-cuatro-hallazgos-que-cambian-el-proyecto). |
| **R14** | Toda discrepancia se cierra con una `resolucion` y un `resueltaEn`; ninguna liquidación se cierra con discrepancias abiertas de sus pagos. | Agregados **Discrepancia** y **Liquidación**. | Mantener la liquidación en `enConciliacion` y alertar. Es la forma operativa de A-1 · confiabilidad dinero–boleta: cero discrepancias abiertas al cierre. |

## Glosario de lenguaje ubicuo

| Término | Definición acordada |
|---|---|
| **Promotor** | Organización responsable de crear y comercializar un evento. |
| **Convenio** | Condiciones comerciales firmadas con el promotor: cargo por servicio, comisión de reventa y vigencia. |
| **Recinto** | Lugar autorizado donde se realiza el evento. |
| **Evento** | Oferta programada con fecha, recinto, localidades, reglas de venta y perfil de demanda. |
| **Perfil de demanda** | Declaración del promotor sobre si la venta será cotidiana o masiva; decide si abre con fila visible. |
| **Reglas de venta** | Condiciones publicadas del evento: ventana, límite por fan, transferencia y reventa. |
| **Reglas de reventa** | Tope de precio, comisión y ventana de la reventa, si el promotor la habilita. |
| **Cancelación** | Registro de que el evento se canceló o modificó, con el mecanismo de devolución informado. |
| **Localidad** | Grupo de inventario con aforo, tipo y precio comunes. |
| **Aforo** | Capacidad máxima autorizada y su consumo reservado o vendido. |
| **Silla** | Unidad identificada dentro de una localidad numerada. |
| **Fan** | Persona que participa en una venta y puede adquirir una boleta. |
| **Identidad** | Datos personales de una persona: nombre, documento y contacto. Solo existen en el contexto de admisión e identidad. |
| **Documento de identidad** | Tipo y número del documento que se asocia a la boleta. |
| **Consentimiento** | Autorización del fan para una finalidad concreta de uso de sus datos. |
| **Fila de venta** | Mecanismo que ordena y limita los intentos de reserva. |
| **Política de fila** | Criterio de orden, tasa de admisión y vigencia publicados. |
| **Turno** | Permiso temporal para intentar reservar; no garantiza inventario. |
| **Reserva** | Compromiso temporal y durable de inventario previo al pago. |
| **Ítem de reserva** | Localidad, silla opcional, cantidad y precio desglosado comprometidos. |
| **Desglose de precio** | Valor nominal, cargo por servicio y contribución parafiscal de un ítem. |
| **Pago** | Registro del intento y resultado de cobrar una reserva o una reventa. |
| **Devolución** | Reversión total o parcial del dinero de un pago. |
| **Discrepancia** | Caso abierto de conciliación entre dinero, inventario y boleta. |
| **Liquidación** | Cierre conciliado de los movimientos que corresponden al promotor. |
| **Movimiento** | Hecho económico individual ya conciliado dentro de una liquidación. |
| **Boleta** | Derecho verificable de asistencia asociado a un solo titular activo. |
| **Código de boleta** | Identificador verificable de la boleta; cambia de versión al invalidarse. |
| **Titular** | Persona que posee actualmente el derecho de asistencia. |
| **Titularidad** | Periodo durante el cual una persona es titular de una boleta. |
| **Transferencia** | Cambio de titular sin compraventa dentro de TicketRight. |
| **Reventa** | Venta autorizada de una boleta dentro de TicketRight, con su propio pago. |

## Trazabilidad con las decisiones aceptadas

| Decisión | Efecto visible en el modelo |
|---|---|
| [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) | Separa Reserva, Pago y Boleta; `Pago.claveIdempotencia` absorbe respuestas repetidas; Discrepancia es el caso que el orquestador abre cuando agota reintentos. |
| [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md) | Localidad protege aforo y silla; Reserva es durable, previa al pago y con `venceEn`; Boleta conserva una sola titularidad activa y `sillaId` para verificar R2 al emitir. |
| [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) | Identidad y Consentimiento viven aislados; todo lo demás transporta `IdOpaco`; Pago no guarda datos de tarjeta. |
| [AD-005](../decisiones/0005-estilo-de-arquitectura.md) | `Evento.perfilDemanda` es la decisión del promotor que activa un perfil operativo; los límites del dominio permiten separar capacidades sin convertir el modelo en un diagrama técnico. |
| [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) | Fila de venta, Política de fila y Turno —con ingreso, posición, admisión, expiración y rechazo— habilitan el intento de compra sin reservar ni prometer inventario. |

## Correspondencia con la rúbrica

| Criterio | Evidencia en este entregable |
|---|---|
| Cobertura completa | Cuatro contextos, 32 conceptos desde la oferta hasta la liquidación, obligaciones legales modeladas (parafiscal, retracto, cancelación, datos personales) y límites externos explícitos. |
| Entidades y atributos | Identidad, atributos tipados con enumeraciones definidas, semántica por atributo, y distinción visible entre doce raíces, entidades y objetos de valor: los agregados van enmarcados y los objetos de valor anidados. |
| Relaciones | Dieciséis relaciones nombradas, dirigidas, con cardinalidad y justificación de navegación; dos relaciones derivadas explicadas. |
| Reglas de negocio | Catorce invariantes numeradas con responsable de cumplimiento y resultado ante violación. |
| Lenguaje ubicuo | Convención única, glosario, y atributos del diagrama generados desde estas tablas para que los nombres no puedan divergir. |
