# TicketRight — Caso de negocio (consolidado de trabajo)

> ⚠️ **Este no es el documento que se entregó.** El entregable es
> [`caso-de-negocio-corporativo.md`](caso-de-negocio-corporativo.md) y su versión maquetada
> [`caso-de-negocio-ticketright.docx`](caso-de-negocio-ticketright.docx). Este archivo es el
> consolidado de trabajo: más largo, más crudo, y **tiene cosas que el entregable no** —la
> trazabilidad de §6 y los anexos A, B y C. Los nueve atributos de calidad salieron de aquí
> a [`atributos-de-calidad.md`](atributos-de-calidad.md).

**Entrega 1 del proyecto integrador · Arquitecturas Avanzadas de Software**
Universidad EAFIT · 12 de septiembre de 2026
**Equipo:** Alejo Ríos · Lina · Quinnie

> **TicketRight** es una plataforma de venta de boletería para eventos de alta demanda.
> *El derecho de entrar debe corresponder siempre al dinero cobrado.*

Toda afirmación de este documento va marcada **`[V]`** cuando está verificada con una fuente
pública citada, o **`[S]`** cuando es un supuesto sin validar, en cuyo caso se dice **qué
pasa si es falso** y **quién lo valida**. Donde no hay dato y no quisimos inventarlo, dice
`PENDIENTE` y cómo se consigue.

## Contenido

| # | Sección | Qué responde |
|---|---|---|
| 1 | [Premisas, supuestos y restricciones](#1-premisas-supuestos-y-restricciones) | ¿Bajo qué condiciones se construyó este caso, y qué se cae si alguna es falsa? |
| 2 | [Alcance y definición del caso](#2-alcance-y-definición-del-caso-de-negocio) | ¿Qué problema, para quién, por qué, y hasta dónde llega? |
| 3 | [Business Model Canvas](#3-business-model-canvas) | ¿Cómo se crea, se entrega y se captura valor? |
| 4 | [Modelo de costos e ingresos](#4-modelo-de-costos-e-ingresos) | ¿El negocio se sostiene? |
| 5 | [OKR](#5-okr) | ¿Cómo sabremos si está funcionando? |
| 6 | [Trazabilidad](#6-trazabilidad) | ¿Se sostiene la cadena completa, de la premisa al indicador? |
| — | [Anexos A, B y C](#anexos) | Estilo de arquitectura · estrategia de implementación · DAFO |

**Los nueve atributos de calidad con su umbral** están en
[`atributos-de-calidad.md`](atributos-de-calidad.md) — archivo aparte porque es lo que más
se consulta y no hace falta cargar este documento entero para leerlo.

**Documentos de detalle que acompañan a este:** [`alcance.md`](alcance.md) ·
[`canvas.md`](canvas.md) · [`modelo-financiero.md`](modelo-financiero.md) ·
[`validaciones.md`](validaciones.md) (todas las fuentes) ·
[`AD-001`](../decisiones/0001-idea-de-negocio.md) y
[`AD-005`](../decisiones/0005-estilo-de-arquitectura.md).

---

## 1. Premisas, supuestos y restricciones

El criterio para que un supuesto entre en esta tabla es duro: **si resulta falso, algo del
caso de negocio se cae.** Si es falso y no pasa nada, no es crítico y no va.

### 1.1 Premisas — las condiciones de partida

> Lo que damos por cierto del entorno antes de empezar a razonar. Varias ya están `[V]` con
> fuente pública, y eso es una ventaja: la mayoría de los equipos escribe premisas `[S]`.

| # | Premisa | `[V]`/`[S]` | Fuente | Qué se cae si es falsa |
|---|---|---|---|---|
| P1 | **El mercado existe y creció fuerte:** la boletería de artes escénicas pasó de COP $310 mil millones (2018) a **$1,53 billones (2023)**, +22% ese año | `[V]` | Anuario PULEP vía [Ámbito Jurídico](validaciones.md#validación-1--tamaño-del-mercado) | El caso de negocio entero. Es la premisa de tamaño |
| P2 | **El universo de clientes no hay que estimarlo: está publicado.** El PULEP registra obligatoriamente productores, operadores, escenarios y eventos | `[V]` | [PULEP – Ley 1493](validaciones.md#validación-1--tamaño-del-mercado) | El embudo comercial del bloque 3 y la proyección del §6 del modelo financiero |
| P3 | **El mercado ya paga por esto:** el cargo por servicio en Colombia está entre **10% y 15%** del valor de la boleta | `[V]` | [El Tiempo, 2023](validaciones.md#validación-2--comisión-del-mercado-y-quién-opera) | La fuente de ingreso 1, que es el ~86% del ingreso |
| P4 | **Hay insatisfacción documentada, y la documentó el regulador:** el líder del mercado tiene pliego de cargos de la SIC desde el 4 de junio de 2026 —nueve expedientes, cinco cargos—, uno de ellos por **trasladarle el riesgo al promotor con una cláusula abusiva**. *Es imputación en curso, no condena* | `[V]` | [Resolución 38063 / SIC](validaciones.md#validación-5--está-el-mercado-insatisfecho-con-lo-que-existe-hoy) | La propuesta de valor. Sin esta premisa, «el promotor cambiaría de plataforma» vuelve a ser opinión nuestra |
| P5 | **No competimos contra una prohibición que funciona:** la reventa está legalmente indefinida en Colombia y casi nunca se persigue | `[V]` | [El Tiempo, 2023](validaciones.md#validación-3--reventa) | La fuente de ingreso 2 —el diferenciador— y buena parte de la tesis |
| P6 | **La boleta es plata de tres bolsillos:** toda boleta ≥ 3 UVT ($157.122 en 2026) paga contribución parafiscal del 10%, que recauda el productor | `[V]` | [Ley 1493 de 2011](validaciones.md#validación-4--aforo-y-datos-personales) + UVT 2026 | La capacidad C-5 y el desglose del precio. Si no aplicara, el sistema liquida dos bolsillos y no tres |
| P7 | **La boleta nominal tiene precedente normativo en Colombia:** el Decreto 1622 de 2022 la exige para fútbol profesional, con validación de documento y QR en puerta | `[V]` | [Decreto 1622](validaciones.md#validación-4--aforo-y-datos-personales) | Nada crítico: es respaldo, no cimiento. *Aplica a fútbol, no a conciertos: es precedente y segundo segmento, no obligación de nuestro cliente* |

**Material listo para llenar esto** (todo `[V]`, de [`validaciones.md`](validaciones.md)):
el mercado creció de COP $310 mil millones (2018) a **$1,53 billones** (2023) · existe el
**registro público PULEP** con el universo de clientes · el cargo por servicio del mercado
es **10-15%** · **el líder del mercado está formalmente imputado por la SIC** desde junio de
2026, y uno de los cargos es trasladarle el riesgo al promotor.

### 1.2 Supuestos críticos

| # | Supuesto | Justificación | **Impacto si es falso** | Cómo se validaría | Responsable |
|---|---|---|---|---|---|
| **S1** | **Nos quedamos con el cargo por servicio completo (12%), sin compartirlo con el promotor.** Es el supuesto del que cuelga todo el ingreso | Es lo que hace el modelo hoy. **Cómo se reparte el 10-15% entre operador y promotor no es información pública** ([validación 2](validaciones.md#validación-2--comisión-del-mercado-y-quién-opera)) | **El más caro de todos.** Con un reparto 50/50 el ingreso por boleta cae de $24.000 a $12.000, el margen de contribución de ~$15.900 a ~$3.950 y el punto de equilibrio sube de **0,43 a ~1,7 eventos/mes** (×4). *El negocio sigue siendo viable, pero deja de parecer que no tiene riesgo* | Contrato tipo con un promotor; preguntarle a uno | Quinnie y Lina |
| **S2** | **El segmento son eventos de 3.000 a 40.000 asistentes, con aforo tipo 8.000 y boleta de $200.000** | Punto medio del rango; el precio queda sobre el umbral de 3 UVT para mostrar los tres bolsillos | Si el aforo tipo real es 3.000, el equilibrio en eventos casi se triplica. Si el precio medio cae bajo $157.122, **la parafiscal deja de aplicar** y cambia el desglose | Corte por aforo del [portal PULEP](https://pulepapp.mincultura.gov.co/Informespublicos/eventos) · 30 min | Lina |
| **S3** | **El promotor del segmento cambia de plataforma** por los dos dolores: riesgo trasladado y caída en el minuto uno | P4 lo respalda para el mercado en general, no para nuestro segmento en particular | Es el supuesto comercial central: si es falso, el embudo del §6 del modelo financiero no existe y no hay a quién venderle | Conversación con al menos un promotor | Lina |
| **S4** | **El cobro pasa por nosotros por el monto completo** ($244.000: boleta + cargo + parafiscal) | Es lo que hace el modelo de costos hoy (`F3`) | Define dos cosas a la vez: quién asume la comisión de pasarela —hoy nosotros, ~$8.528 por boleta— y **cuánta caja ajena inmoviliza R-5**. Si el promotor liquidara por otro riel, el costo variable cambia de dueño | Contrato con la pasarela y con el promotor | Alejo y Quinnie |
| **S5** | **El inductor del costo de pico son los usuarios concurrentes en la fila, no las boletas por segundo** | El evento tipo vende ~5 boletas/s, que es poco; lo que cuesta es sostener decenas de miles esperando turno | Si el inductor real fuera otro, el modelo de costos estaría midiendo la cosa equivocada y la meta de costo por boleta no significaría nada | Corrida de carga de la Entrega 3 (momento estrella 6) | Alejo |
| **S6** | **8% de las boletas se revenden dentro de la plataforma** en estado estable | No hay cifra pública en Colombia ([validación 3](validaciones.md#validación-3--reventa)); se modela como escenario | Cuesta ~7% del ingreso. **No tumba el negocio** —el modelo demuestra viabilidad con reventa en cero— pero sí borra el diferenciador frente a Tuboleta | Piloto; métrica post-MVP | Quinnie |
| **S7** | **El fan y el promotor autorizan el tratamiento y la transferencia de datos** bajo Ley 1581 | Es el consentimiento que exige la norma para que la fuente 4 exista | Mata la fuente de ingreso 4 y obliga a rediseñar C-6. La SIC multa hasta 2.000 SMMLV y puede suspender el tratamiento 6 meses | **AD-004** — Responsable vs. Encargado | Alejo |
| **S8** | **El equipo del año 1 son 4 FTE a ~4 SMMLV** con factor prestacional 1,52 | Supuesto de operación mínima viable | Es el 82% del costo fijo. Con 3 personas sin nómina completa el equilibrio baja; con 8 personas se duplica | Decisión del equipo | Los tres |

> **Son ocho a propósito.** Los ocho tienen la propiedad de que **si cualquiera resulta
> falso, hay que reescribir un bloque del canvas o una línea del modelo financiero** — y la
> columna de impacto dice cuál. Una lista más larga de supuestos genéricos no diría más.

Los supuestos del modelo financiero (`F1`…`F6`) viven en
[`modelo-financiero.md`](modelo-financiero.md#8-supuestos-de-este-modelo) y **no se
duplican aquí**: los de arriba son los que son críticos para el caso completo. Equivalencias:
S2↔F1, S1↔*(nuevo, no estaba en el modelo)*, S4↔F3, S6↔F4, S8↔F5.

> **S1 no existía en ninguna parte hasta hoy, y es el supuesto más caro del documento.**
> Salió de cruzar el modelo financiero con la [validación 2](validaciones.md#validación-2--comisión-del-mercado-y-quién-opera):
> el modelo se queda con el 12% completo, pero la validación dice que **el reparto del cargo
> entre operador y promotor no es público**. Hay que decidir en la revisión cruzada si se
> declara como supuesto o se modela el reparto — está en la agenda de
> [`ESTADO.md`](../../ESTADO.md).

### 1.3 Restricciones

> Límites que no negociamos: no son decisiones nuestras. La ventaja de este proyecto es que
> **cuatro de ellas son legales y están verificadas**, lo que las vuelve incontestables.

| # | Restricción | Tipo | Origen | Qué nos obliga a hacer |
|---|---|---|---|---|
| R1 | Contribución parafiscal del 10% sobre boletas ≥ 3 UVT | Legal `[V]` | Ley 1493 de 2011 | Liquidar un tercer flujo de dinero sin error |
| R2 | Derecho de retracto: 5 días hábiles | Legal `[V]` | Ley 1480 de 2011, art. 47 | Devolución con plazo, sin romper el vínculo dinero–boleta |
| R3 | Informar mecanismo de devolución a la SIC en 3 días hábiles ante cancelación | Legal `[V]` | Deber de información | **La devolución masiva es requisito, no demo** |
| R4 | Habeas data: autorización previa para transferir datos a un tercero | Legal `[V]` | Ley 1581 de 2012 | Condiciona la fuente de ingreso 4 — **AD-004** |
| R5 | El aforo autorizado no se puede exceder en ningún caso | Legal y física `[V]` | Normativa de eventos | Invariante duro, no regla de negocio |
| R6 | Equipo de 3 personas, 3 semanas, sin presupuesto | De proyecto | El curso | Acota qué se implementa en la Entrega 3 |
| R7 | El operador de boletería debe registrarse en el PULEP | Legal `[V]` | Ley 1493 de 2011 | Es **requisito de entrada al mercado**, no un trámite posterior |
| R8 | La SIC puede multar hasta **2.000 SMMLV** y suspender el tratamiento de datos hasta 6 meses | Legal `[V]` | Ley 1581 de 2012 | Es lo que le da dientes a R4: el incumplimiento no es una multa simbólica |
| R9 | Equipo de 3 personas y 3 semanas para las tres entregas | De proyecto | El curso | La reventa se **modela** en la Entrega 2 y solo se demuestra si sobra tiempo |

### 1.4 Dependencias

> De qué terceros y decisiones ajenas depende que esto funcione. **La dependencia central de
> este negocio no es técnica: es que el promotor firme.** Sin inventario no hay nada que
> vender, y el inventario es de otro.

| # | Dependencia | De quién | Qué pasa si falla | Cómo la mitigamos |
|---|---|---|---|---|
| D1 | Inventario de boletas | Promotores y recintos (S-2) | **No hay negocio.** Es la dependencia raíz | Firmar más de un promotor antes de depender de la caja de uno |
| D2 | Recaudo y aprobación del pago | La pasarela (S-1) | **Puede romper el invariante central**: responde tarde, dos veces, o cobra después de que la reserva expiró | El sistema asume que va a fallar y cierra las discrepancias solo. Es la tesis del proyecto |
| D3 | Validación en la puerta | Operador del control de acceso (S-3) | El fan queda afuera con una boleta válida, **y la culpa se ve nuestra** | Contrato de eventos: *emitida*, *transferida*, *anulada*. Está [fuera del alcance](alcance.md#6-fuera-de-alcance--y-por-qué) a propósito |
| D4 | Capacidad elástica en la ventana | Proveedor de nube (S-4) | Se cae el día que importa, en público | Provisionar la ventana, no el mes. Meta de costo por boleta medida bajo carga |
| D5 | Verificación de identidad | Proveedor de KYC (S-5) | Sin boleta nominal no hay transferencia controlada ni reventa capturada | Degradar a verificación mínima antes que bloquear la venta |
| D6 | Autorización de tratamiento de datos | El titular (el fan) y la norma | Sin consentimiento no hay fuente de ingreso 4 | Pedirlo en la compra, no después. **AD-004** |

---

## 2. Alcance y definición del caso de negocio

> Al terminar esta sección debe quedar respondido, sin ambigüedad: **qué problema
> resolvemos, para quién, por qué ahora y exactamente hasta dónde llega este proyecto.**

### El problema

La demanda de un evento de alta demanda llega **toda en el mismo minuto**. Un concierto que
agota en diez minutos concentra en ese lapso más carga que la que el sistema ve en todo el
mes, y cuando se cae, se cae **en público**: miles de personas frustradas al tiempo, con
nombre propio, en redes. Pero el problema difícil no es ese. Es que **la plata y la boleta
se desincronizan**: la pasarela se demora, responde tarde o responde dos veces, y del otro
lado quedan dos fallas —*boleta sin cobro*, que es pérdida, y **cobro sin boleta**, que es
haberle quitado la plata a alguien sin darle nada—. La segunda es la queja que hunde a una
boletera. Encima, la reventa se lleva un margen que era del promotor, el fan paga de más y
algunas de esas boletas son falsas.

### La oportunidad, y por qué ahora

`[V]` **El 4 de junio de 2026 la SIC formuló pliego de cargos contra Ticket Fast S.A.S.,
operador de TuBoleta** (Resolución 38063), tras acumular nueve expedientes de quejas. De los
cinco cargos, uno es **haberse eximido de responsabilidad trasladándosela al promotor
mediante una cláusula abusiva**, y otro es no haber informado el mecanismo de devolución
dentro de los tres días hábiles. *Es una imputación en curso, no una condena, y así hay que
decirlo.* **Ese es exactamente el hueco que llena nuestra propuesta de valor**, y no lo
afirmamos nosotros: lo documentó el regulador.
[Fuentes](validaciones.md#validación-5--está-el-mercado-insatisfecho-con-lo-que-existe-hoy).

### Actores

| Actor | Su dolor | ¿Paga? |
|---|---|---|
| **Promotor / productora** | Un evento agotado que se vendió mal le cuesta la relación con el artista, y la reventa se lleva un margen que era suyo | **Sí — es quien firma** |
| **Recinto** | Responde por el aforo ante la autoridad: una boleta de más es un problema legal | **Sí** |
| **Fan** | Paga el cargo, hace la fila y compite contra bots y revendedores | **Sí, el cargo por servicio** |
| **Artista y management** | Quieren que las boletas lleguen a fans reales | No, **pero es quien exige** |
| **Autoridad (SIC, alcaldía, PULEP)** | — | No: **es restricción, no cliente** |
| **Revendedor profesional** | Ninguno: hoy gana | No — **es a quien le quitamos el negocio** |

### La solución, a nivel de negocio

Una plataforma donde el fan entra a una fila **con una política publicada antes de abrir**,
reserva por un tiempo acotado, paga, y recibe una **boleta nominal** atada a su identidad. El
sistema **asume que la pasarela va a fallar** y cierra solo las discrepancias. Después de la
emisión la boleta tiene vida: se transfiere, se devuelve si el evento se cancela y puede
cambiar de manos dentro de la plataforma. Al promotor se le devuelven dos cosas que hoy no
recibe: **los datos del comprador y el margen de ese mercado secundario**.

**La unidad de la promesa es el recorrido completo, no la transacción.** Es la decisión de
producto más importante de este caso de negocio y conviene decirla explícitamente: no nos
comprometemos con «procesar el pago correctamente», sino con **todo el trayecto que hace una
persona para conseguir su boleta** — entrar a la fila sabiendo cuánto va a esperar, esperar
sin perder el puesto, escoger, pagar, recibir la boleta, y poder usarla o transferirla.

La razón es que **el usuario no distingue tramos**. Para él «se me cayó», «me sacó la fila»,
«me dijo que había y luego que no» y «me cobraron y no tengo boleta» son el mismo fracaso, y
lo atribuye entero a la plataforma. Un sistema que procesa el pago perfectamente pero deja al
usuario cuarenta minutos en una fila sin información **ya falló**, aunque ningún indicador
técnico lo registre. Por eso el
[OKR 2](#okr-2--que-comprar-sea-fácil-de-principio-a-fin) mide los cinco tramos del
recorrido y no solo el que nos conviene, y por eso la frontera del alcance se declara donde
se declara: **terminamos cuando la boleta es válida y está en manos de su dueño**, que es
hasta donde podemos responder.

### Qué entra y qué queda fuera

**Dentro:** gestión comercial del evento · gestión de la demanda concentrada · custodia del
inventario · custodia de la transacción · gestión del derecho de asistencia · reventa
autorizada · devoluciones y anulaciones · trazabilidad y liquidación para el promotor.

**Fuera, y es lo que da confianza en el resto:**

| Qué queda fuera | Por qué |
|---|---|
| **El control de acceso en la puerta** | Otro sistema, otro dueño, otros atributos. Nos integramos por contrato de eventos: *emitida*, *transferida*, *anulada*. **Nuestro invariante llega hasta «esta boleta es válida y está en estas manos»; el suyo empieza en «esta persona puede entrar por esta puerta»** |
| Eventos de demanda continua (cine, parques, museos) | No tienen ráfaga: no nos necesitan |
| Eventos de menos de 3.000 asistentes `[S]` | Con venta directa les alcanza |
| Gestión integral del evento físico | Vendemos y custodiamos el derecho; no montamos ni operamos el evento |
| Determinación de permisos y aforo | Es responsabilidad del productor y la autoridad |
| Operar la pasarela de pagos | Es un tercero: **nos integramos y conciliamos, no la reemplazamos** |
| La reventa fuera de la plataforma | No podemos garantizar autenticidad ni titularidad |
| Publicidad masiva y representación del artista | No es nuestro mecanismo de adquisición |

**De qué supuestos y restricciones sale este alcance.** El PULEP separa por ley los roles de
productor, operador de boletería, escenario y autoridad `[V]`: por eso TicketRight se limita a
vender y custodiar. **R9** —tres personas, tres semanas— es lo que deja la reventa *modelada*
en la Entrega 2 y no implementada. Y **S2**, el corte de 3.000 a 40.000 asistentes, es una
hipótesis de segmentación explícita, no un hecho de mercado.

> Desarrollo completo, con fuentes por afirmación, en [`alcance.md`](alcance.md).

---

## 3. Business Model Canvas

> Los nueve bloques desarrollados, con fuentes por afirmación, están en
> [`canvas.md`](canvas.md).

### Los nueve bloques, en una página

| # | Bloque | Lo esencial |
|---|---|---|
| 1 | **Segmentos** | Plataforma de dos lados. **Firma el promotor** —promotora independiente, recinto con programación propia, organizador de festival— de eventos de 3.000 a 40.000 asistentes `[S]`. **Usa y paga comisión el fan**, segmentado por comportamiento: el de minuto uno, el del parche, el de última hora. No son clientes el revendedor profesional (a quien le quitamos el negocio) ni los eventos de demanda continua |
| 2 | **Propuesta de valor** | *Custodiamos el vínculo entre el dinero y el derecho a entrar —incluso cuando la pasarela falla— y devolvemos al promotor el margen de la reventa y los datos del comprador que hoy se le quedan a la boletera.* Una cara para el promotor (no se cae, no le regalan el margen, no le trasladan el riesgo) y otra para el fan (no le quitan la plata sin darle boleta, no compra falsas) |
| 3 | **Canales** | **Venta:** canal digital oficial enlazado desde la comunicación del evento. **Adquisición:** el promotor y el artista — el fan no nos busca. Prospección desde el registro público del PULEP `[V]`. *Consecuencia: este negocio no tiene línea de publicidad masiva, tiene línea comercial B2B* |
| 4 | **Relación** | Con el fan: diez minutos de tensión máxima una o dos veces al año, y silencio el resto. Soporte concentrado en la ventana, autoservicio fuera de ella, y **la disputa como el momento que define si volvemos a existir**. Con el promotor: contractual y continua, con datos y liquidación |
| 5 | **Ingresos** | Cinco fuentes. **1 · cargo por servicio 12%** `[S]` dentro del rango de mercado 10-15% `[V]` (~86%) · **2 · comisión de reventa** en plataforma (~7%, *el diferencial*) · 3 · plataforma multi-tenant (~4%) · 4 · datos del evento (~2%) · 5 · preventa segmentada (~1%) |
| 6 | **Recursos** | Ordenados por escasez: **el contrato con el promotor** (el aforo es de otro) · capacidad elástica para la ventana · identidad verificada del comprador · registro reconstruible de cada venta · **capital de trabajo del ciclo de liquidación** · histórico de ventas · 4 FTE |
| 7 | **Actividades** | Siete capacidades, no funcionalidades: custodiar el vínculo dinero–boleta · administrar aforo finito bajo demanda concentrada · decidir y **demostrar** el orden de atención · sostener el ciclo de vida del derecho de asistencia · liquidar tres bolsillos · devolverle al promotor lo que hoy no recibe · conseguir y sostener inventario |
| 8 | **Socios** | **La pasarela** es el socio crítico: el único tercero que puede romper el invariante central · promotores y recintos · **el operador del control de acceso en puerta** (socio, no parte nuestra) · nube · verificación de identidad · artista y aliados de preventa. *PULEP y SIC no son socios: son autoridad* |
| 9 | **Costos** | La separación que importa es **fijo contra pico**. Variable dominante: la pasarela, **~$8.528 por boleta, el 90% del costo variable**. Fijo: ~$52 M/mes, 82% equipo. **Adquisición de promotores en lugar de publicidad**, que es coherente con el bloque 3 |

### La coherencia horizontal, dicho de frente

Un canvas no vale por estar lleno, sino porque los nueve bloques cuenten **una sola
historia**. Las dos cadenas se leen así:

**Segmento → problema → propuesta → canal → relación → ingreso.** El promotor de eventos de
alta demanda pierde reputación cuando el sistema se cae y pierde margen cuando la reventa
ocurre por fuera *(1)*; le vendemos que no se caiga y que ese margen vuelva *(2)*; llegamos
a él por venta B2B directa y a su fan por el anuncio del artista *(3)*; con él la relación
es contractual y continua, con el fan es de diez minutos y una disputa *(4)*; y cobramos un
cargo por servicio sobre cada boleta y una comisión sobre cada reventa *(5)*.

**Propuesta → actividades → recursos → socios → costos.** Custodiar el vínculo dinero–boleta
*(2)* exige conciliar, encolar, emitir y liquidar *(7)*; eso consume capacidad elástica,
identidad verificada y un registro reconstruible *(6)*; que compramos a la pasarela, a la
nube y al proveedor de verificación *(8)*; y por eso el costo variable lo domina la pasarela
y el fijo lo domina el equipo *(9)*.

**Y la comprobación al revés, que es la que descubre huecos:** ningún ingreso del bloque 5
viene de un segmento que no esté en el bloque 1, y ningún costo del bloque 9 existe sin un
recurso, una actividad o un socio que lo genere
([verificación de huérfanos](canvas.md)).

---

## 4. Modelo de costos e ingresos

> El modelo completo —fórmulas, escenarios, proyección y fuentes— está en
> [`modelo-financiero.md`](modelo-financiero.md).

### La unidad: el evento tipo

Este negocio no factura por usuario al mes: **factura por evento**. Evento tipo: aforo
**8.000**, precio de boleta **COP $200.000**, 95% de venta → **7.600 boletas** `[S]`.

### El precio tiene tres bolsillos, y solo uno es nuestro

```
Valor de la boleta        → del promotor            $200.000
Cargo por servicio (12%)  → NUESTRO ingreso          $24.000     [S] dentro del rango [V] 10-15%
Contribución parafiscal   → del Estado (10%)         $20.000     [V] Ley 1493, boletas ≥ 3 UVT
                                                    ─────────
Total que ve el fan                                 $244.000
```

**La parafiscal no es ingreso nuestro ni costo nuestro:** es dinero que pasa por el sistema.
Lo nuestro es la obligación de liquidarla sin equivocarnos.

### Las cinco fuentes de ingreso, y qué aporta cada una

| # | Fuente | Quién paga | Base de cálculo | Aporte al ingreso | Estado |
|---|---|---|---|---|---|
| 1 | **Cargo por servicio por boleta** | El fan | boletas × precio × **12%** = $24.000/boleta | **~86%** | `[S]` dentro del rango `[V]` 10-15% |
| 2 | **Comisión por reventa en plataforma** | El comprador de reventa | boletas revendidas (8% `[S]`) × precio de reventa (1,4× `[S]`) × 10%, **repartido 50/50 con el promotor** = $14.000 por boleta revendida | **~7%** | `[S]` — **el diferencial** |
| 3 | Plataforma multi-tenant | El promotor | ~$800.000 por evento activo | **~4%** | `[S]` |
| 4 | Datos del evento | El promotor | ~$400.000 por evento, la mitad de los eventos | **~2%** | `[S]` · condicionado a Ley 1581 |
| 5 | Preventa segmentada | El promotor o el aliado | ~$300.000 por campaña, una cada dos eventos | **~1%** | `[S]` |

**La fuente 2 es la que hay que defender con cuidado**, porque es la que nos separa. Que no
exista cifra pública de qué fracción de las boletas se revende en Colombia
(`[V]` no es información publicada) no es excusa para omitirla: se modela como escenario con
rango declarado, y el negocio se demuestra viable también con ella en cero.

### Los costos, con su inductor

Ninguna línea de costo se escribe sin lo que la genera:

```
Pasarela      = transacciones aprobadas × (2,65% + $700 + IVA)  →  ~$8.528 / boleta   [V] tarifa
Cómputo pico  = instancias-hora de la ventana × precio/hora     →  ~$9 / boleta       [V] tarifa
Soporte       = agentes-hora en ventana / boletas del evento    →  ~$200 / boleta     [S]
Comercial     = costo fijo B2B, no publicidad masiva            →  ~$5 M / mes        [S]
```

| | Valor | Nota |
|---|---|---|
| Costo variable por boleta | **~$9.173** | **El 90% es la pasarela**, no el cómputo |
| Costo fijo mensual | **~$51,9 M** | 82% es el equipo (4 FTE) |
| Margen de contribución por boleta | **~$15.947** (~63%) | Con reventa atribuida |
| **Punto de equilibrio** | **~3.250 boletas/mes ≈ 0,43 eventos/mes ≈ 1 promotor activo** | Sin reventa: ~0,46 eventos/mes |

**Los costos fijos, desglosados** — ~$51,9 M/mes:

| Concepto | Mensual | Por qué es fijo |
|---|---|---|
| Equipo, 4 FTE (2 ingeniería · 1 operación y soporte · 1 comercial-técnico) | **$42,6 M** | No depende de cuántas boletas se vendan. `[V]` SMMLV 2026 $1.750.905 · `[S]` nivel de 4 SMMLV y factor prestacional 1,52 |
| Adquisición de promotores (comercial B2B) | **$5,0 M** | **Reemplaza a la publicidad masiva**, y eso sale directamente del canal de adquisición del bloque 3 |
| Infraestructura base y entornos | **$2,0 M** | Corre haya evento o no |
| Cumplimiento: habeas data, PULEP, contable | **$1,5 M** | Obligación permanente, no por evento |
| Licencias y herramientas | **$0,8 M** | |

### Proyección a 12 meses

| | T1 (meses 1-3) | T2 (4-6) | T3 (7-9) | T4 (10-12) |
|---|---|---|---|---|
| Promotores firmados | 2 | 5 | 10 | 18 |
| Eventos / mes | 2 | 6 | 12 | 20 |
| Boletas / mes | 15.200 | 45.600 | 91.200 | 152.000 |
| Ingresos / mes | ~$390 M | ~$1.170 M | ~$2.340 M | ~$3.900 M |
| Costos variables | ~$139 M | ~$418 M | ~$836 M | ~$1.394 M |
| Costos fijos | ~$52 M | ~$55 M | ~$60 M | ~$68 M |
| **Resultado mensual** | **~$200 M** | **~$700 M** | **~$1.440 M** | **~$2.440 M** |

**Cada salto tiene una razón escrita, no una curva.** T1→T2: dos promotores piloto
demuestran un evento sin caída y el comercial cierra tres referencias del mismo circuito.
T2→T3: el argumento del pliego de cargos y los datos devueltos abren a promotoras medianas,
y se activa la reventa en todos los eventos. T3→T4: la capacidad de pico queda
industrializada dentro de la meta de costo y se firma al menos un recinto con programación
propia.

`[S]` **Todo el eje de eventos por mes es una hipótesis comercial.** Si el corte por aforo
del PULEP muestra menos eventos alcanzables, se baja ese eje: **no se inventa penetración**.
El punto de equilibrio es el ancla, y no depende de esta proyección.

### Escenarios y sensibilidad

| Variable | Pesimista | **Base** | Optimista | Por qué es la que manda |
|---|---|---|---|---|
| Cargo por servicio (*take rate*) | 10% | **12%** | 15% | Es ingreso puro: mueve el margen linealmente |
| % de boletas revendidas en plataforma | 2% | **8%** | 15% | Es el diferenciador. Si tiende a cero, somos una boletera con invariante |
| Eventos al mes (año 1 estable) | 1 | **6** | 15 | Es la variable comercial, no la técnica |
| Costo de infraestructura por boleta | $500 | **$115** | $30 | Es la variable de arquitectura. Hoy no rompe el equilibrio |

| Caso | Margen por boleta | Equilibrio | ¿Viable? |
|---|---|---|---|
| **Base** (12%, 8% de reventa) | ~$15.950 | ~3.250 boletas/mes | Sí, con holgura |
| Take rate 10%, reventa 0% | ~$10.950 | ~4.740 boletas/mes | Sí — ~0,62 eventos/mes |
| **Cargo compartido 50/50 con el promotor** | ~$3.950 | ~13.150 boletas/mes | Sí — ~1,7 eventos/mes |
| Cargo compartido **y** evento pequeño (3.000 × 90%) | ~$3.950 | ~13.150 boletas/mes | Ajustado — ~5 eventos/mes |

**La variable que de verdad decide no es el volumen: es cuánto del cargo por servicio nos
quedamos.** Por eso [S1](#1-premisas-supuestos-y-restricciones) es el supuesto crítico del
caso, y por eso la última fila está en la tabla: es el peor escenario razonable, y es donde
el modelo deja de tener holgura.

### El hallazgo que conecta el negocio con la arquitectura

**El costo del pico es reputacional, no económico.** Con la tarifa verificada, el cómputo de
la ventana de venta sale en ~$9 por boleta: frente a los $8.528 de la pasarela es casi
ruido. Caerse en el minuto uno **no cuesta servidores: cuesta el promotor**. Eso reordena
las prioridades de arquitectura y es el argumento del atributo A-7.

### ¿Es viable?

**Sí, y con holgura en el escenario base.** Las tres respuestas que importan:

1. **¿Se sostiene sin el diferenciador?** Sí. Con reventa en cero el equilibrio apenas se
   mueve (0,43 → 0,46 eventos/mes). La reventa es **techo, no piso**.
2. **¿Se sostiene en el pesimista?** Sí: con take rate 10% y reventa 0%, el margen baja a
   ~$10.950 por boleta y el equilibrio sube a ~0,62 eventos/mes.
3. **¿Y si el supuesto más caro es falso?** El modelo asume que **el cargo por servicio es
   todo nuestro** ([S1](#1-premisas-supuestos-y-restricciones)), y el reparto real entre
   operador y promotor **no es público**. Con un reparto 50/50 el margen cae de ~$15.900 a
   ~$3.950 y el equilibrio sube a **~1,7 eventos/mes**. **Sigue siendo viable** — y ese es
   el número honesto para la sustentación, porque un equilibrio de medio evento al mes se
   lee como un modelo que no se analizó.

> **La frase que hay que poder decir en voz alta:** *«Con uno o dos promotores que hagan un
> evento de 8.000 aforos al mes, el modelo no pierde plata — y eso se sostiene incluso si
> tenemos que compartir el cargo por servicio con el promotor.»*

---

## 5. OKR

> Reglas que seguimos (lámina 50 del curso): el **Objective** es cualitativo, inspirador, ambicioso pero
> alcanzable, con horizonte temporal y **sin métricas**. Los **Key Results** son
> cuantitativos y verificables, entre **3 y 5 por objetivo**, expresan **resultados, no
> tareas**, y se puntúan de 0.0 a 1.0 donde **0.7 es la zona de éxito esperada**.
>
> «La diferencia entre un sueño y un objetivo es un Key Result.» (lámina 51)
>
> Cada Key Result lleva además **línea base, meta, horizonte y a qué parte del negocio
> traza**.

**Un Key Result no es una tarea.** «Implementar la sala de espera» no es un resultado;
«cero boletas por encima del aforo» sí lo es. Y **estos objetivos son de negocio, no de
sistema**: los umbrales técnicos son atributos de calidad y viven en el
[anexo A](#anexo-a--estilo-de-arquitectura).

**Cuatro objetivos.** Tres miran el producto —que la venta no falle, que comprar sea fácil y
que el pico no se salga de presupuesto— y el cuarto mira el negocio: conseguir promotores.

**Sobre las líneas base.** El negocio todavía no opera. Donde no hay dato histórico lo
decimos y señalamos cuándo se fija —en el primer evento piloto—. **No inventamos una línea
base para que la meta se vea mejor.**

**Plazos:** año 1 de operación, por trimestres (T1 a T4), según la
[proyección financiera](modelo-financiero.md#6-proyección-a-12-meses).

---

### OKR 1 · Que la venta nunca falle

> **Objetivo:** «Que nadie pierda su dinero ni su entrada comprando en TicketRight.»

Es el objetivo del que dependen los demás. Una boletera no se juzga por lo que vende bien,
sino por lo que hace cuando algo sale mal.

**KR 1.1 · Cero boletas vendidas por encima del aforo, en el 100% de los eventos.**
Línea base: no operamos aún · Meta: 100% · Plazo: cada evento desde T1 · Conecta con: la
restricción legal del aforo (R5) y el atributo A-2.

**KR 1.2 · Cero pagos sin boleta al cerrar cada día de venta.**
Línea base: no operamos aún · Meta: 0 · Plazo: diario desde T1 · Conecta con: el atributo
A-1 — **es la promesa central del negocio**.

**KR 1.3 · Cero boletas con dos dueños al mismo tiempo.**
Línea base: no operamos aún · Meta: 0 · Plazo: cada evento desde T1 · Conecta con: el
atributo A-3 y la entrega en puerta.

**KR 1.4 · 95% de los reclamos resueltos con el historial de la compra, sin discutir con el
cliente.**
Línea base: se fija en el evento piloto de T1 · Meta: ≥ 95% · Plazo: desde T2 · Conecta con:
el atributo A-8 y la relación con el fan.

---

### OKR 2 · Que comprar sea fácil de principio a fin

> **Objetivo:** «Que sacar una boleta para un evento que se agota sea fácil y predecible,
> desde la fila hasta tener la entrada en la mano.»

**Este es el objetivo que define el producto.** Para el usuario, «me sacó la fila», «se me
cayó al pagar» y «me cobraron y no llegó nada» son el mismo fracaso, y lo culpa a la
plataforma. Por eso medimos **los cinco tramos del recorrido**, no solo el del pago.

**KR 2.1 · El 100% de la gente en fila ve su turno y cuánto falta, y el estimado no se
desvía más de 20% del tiempo real.**
Línea base: `[S]` no la tenemos; se mide observando una preventa del mercado antes de T1 ·
Meta: 100% con desviación ≤ 20% · Plazo: cada evento desde T1 · Conecta con: el atributo
A-4 — **es lo que hace tolerable la espera**.

**KR 2.2 · Menos del 15% de la gente abandona la fila.**
Línea base: se fija en el evento piloto de T1 · Meta: ≤ 15% · Plazo: desde T2 · Conecta con:
la conversión y la fuente de ingreso 1.

**KR 2.3 · El 98% de quienes empiezan a pagar terminan la compra sin errores**, incluso en
el minuto de mayor demanda.
Línea base: se fija en el evento piloto de T1 · Meta: ≥ 98% · Plazo: desde T2 · Conecta con:
el atributo A-6 — **es el tramo donde hoy se cae el mercado**.

**KR 2.4 · El 95% de las boletas llegan al comprador en menos de dos minutos.**
Línea base: no operamos aún · Meta: ≥ 95% en ≤ 2 min · Plazo: cada evento desde T1 ·
Conecta con: el atributo A-1 — **pagar y no recibir nada es la peor experiencia posible**.

**KR 2.5 · Satisfacción de 4,2 sobre 5 después de comprar en un evento agotado.**
Línea base: se fija en el evento piloto de T1 · Meta: ≥ 4,2/5 · Plazo: desde T2 · Conecta
con: la retención — **mide que el recorrido completo funcionó, no cada tramo por separado**.

---

### OKR 3 · Que el pico cueste lo que dijimos

> **Objetivo:** «Que atender la avalancha de un evento agotado cueste lo que presupuestamos,
> y no lo que aparezca en la factura.»

El sistema está quieto el 99% del tiempo. Sostener capacidad de pico todo el mes es botar
plata; no sostenerla es caerse el día que importa.

**KR 3.1 · Máximo $150 de infraestructura por boleta vendida**, medido con 30.000 personas
comprando a la vez.
Línea base: ~$115 calculado, sin medir `[S]` · Meta: ≤ $150 · Plazo: cada evento desde T1 ·
Conecta con: el atributo A-7 y la estructura de costos.

**KR 3.2 · Máximo $9.500 de costo variable por boleta.**
Línea base: $9.173 calculado `[S]` · Meta: ≤ $9.500 · Plazo: trimestral · Conecta con: el
margen y la viabilidad del negocio.

**KR 3.3 · Usar al menos el 70% de la capacidad que contratamos para el pico.**
Línea base: no operamos aún · Meta: ≥ 70% · Plazo: cada evento desde T2 · Conecta con: el
recurso R-2 — **impide contratar de más «por si acaso»**.

**KR 3.4 · 99,9% de disponibilidad mientras la venta está abierta.**
Línea base: el mercado tiene caídas públicas documentadas en preventas `[V]` · Meta: ≥ 99,9%
· Plazo: cada evento desde T1 · Conecta con: el atributo A-9 y la premisa P4.

---

### OKR 4 · Que los promotores nos elijan y se queden

> **Objetivo:** «Ser la plataforma que los promotores eligen porque sus compradores la
> prefieren.»

Los tres objetivos anteriores no sirven de nada si no hay eventos que vender. **La
experiencia del OKR 2 es el argumento de venta de este.**

**KR 4.1 · 18 promotores activos al terminar el primer año.**
Línea base: 0 · Meta: 18 · Plazo: fin de T4 · Conecta con: el recurso R-1 y la dependencia
D1 — **sin inventario no hay negocio**.

**KR 4.2 · 20 eventos vendidos al mes.**
Línea base: 0 · Meta: 20/mes · Plazo: T4 · Conecta con: los ingresos y el punto de
equilibrio.

**KR 4.3 · Dejar de perder plata antes de cerrar el primer trimestre.**
Línea base: el equilibrio está en ~0,43 eventos/mes, o ~1,7 si hay que compartir el cargo
por servicio · Meta: superado dentro de T1 · Plazo: T1 · Conecta con: el modelo financiero
y el supuesto S1.

**KR 4.4 · 8 de cada 10 promotores repiten después de su primer evento.**
Línea base: no operamos aún · Meta: ≥ 80% · Plazo: desde T3 · Conecta con: la retención —
**impide cumplir el KR 4.1 comprando clientes que no vuelven**.

**KR 4.5 · El 8% de las boletas que cambian de dueño lo hacen dentro de la plataforma.**
Línea base: 0% — hoy eso pasa por fuera y sin rastro · Meta: ≥ 8% · Plazo: T4 · Conecta con:
la fuente de ingreso 2 y el supuesto S6.

---

### Cómo se puntúan

Escala del curso (lámina 50): de **0.0 a 1.0**, donde **0.7 es la zona de éxito esperada**.
Dos excepciones deliberadas, y conviene decirlas antes de que las pregunten:

**Los KR 1.1, 1.2 y 1.3 se puntúan 0 o 1, no en la escala.** No existe un 0.7 de «no vender
más boletas que sillas»: una boleta de más es una persona que llegó al evento y no cabe, y un
pago sin boleta es la plata de alguien. **Son reglas que se cumplen o se rompen**, y darles
la escala normal sería aceptar que fallar tres de cada diez veces está bien.

**Los demás sí usan la escala completa.** Varios arrancan sin línea base a propósito: el
primer evento piloto la fija, y desde ahí la meta se vuelve exigible.

## 6. Trazabilidad

> Un caso de negocio no se sostiene por tener secciones bien escritas por separado, sino
> porque la cadena completa se puede seguir de punta a punta:
>
> `PREMISAS → SUPUESTOS → RESTRICCIONES → PROBLEMA → ALCANCE → CANVAS → INGRESOS/COSTOS →
> VIABILIDAD → OKR`

Tres cadenas, una por cada pieza del negocio: **el invariante monetario, el recorrido del
comprador y el costo del pico.** Cada fila es un eslabón, y **cada eslabón existe en el
documento**: si una casilla estuviera vacía, ahí habría un hueco real.

### Cadena 1 — el invariante monetario, que es la razón de ser del negocio

| Eslabón | Contenido |
|---|---|
| **Premisa** | `[V]` **P4** — El líder del mercado tiene pliego de cargos de la SIC, y uno de los cargos es trasladarle el riesgo al promotor con una cláusula abusiva |
| **Supuesto** | **S3** — El promotor cambia de plataforma por ese dolor · **S4** — El cobro pasa por nosotros por el monto completo |
| **Restricción** | **R1** parafiscal · **R2** retracto en 5 días hábiles · **R3** informar el mecanismo de devolución en 3 días hábiles |
| **Problema** | La plata y la boleta se desincronizan cuando la pasarela se demora, responde tarde o responde dos veces. **Cobro sin boleta** es la queja que hunde a una boletera |
| **Alcance** | *Dentro:* custodia de la transacción y de las devoluciones. *Fuera:* operar la pasarela y el control de acceso en puerta |
| **Canvas** | Propuesta de valor *(2)* → capacidad **C-1** custodiar el vínculo *(7)* → recursos **R-4** registro y **R-5** capital de trabajo *(6)* → socio **S-1** la pasarela *(8)* |
| **Ingreso** | Fuente 1 — cargo por servicio del 12%: es lo que el promotor paga por no cargar con ese riesgo |
| **Costo** | Comisión de la pasarela **~$8.528/boleta (90% del variable)** + devoluciones y disputas ~$150/boleta |
| **Atributo** | **A-1** discrepancias en cero, cerradas solas en ≤ 15 min · **A-8** 100% de las ventas reconstruibles |
| **OKR / KR** | **KR 1.2** cero pagos sin boleta al cerrar el día · **KR 1.4** 95% de reclamos resueltos con el historial de la compra · **KR 2.4** boleta entregada en menos de 2 min |

### Cadena 2 — el recorrido completo del comprador

| Eslabón | Contenido |
|---|---|
| **Premisa** | `[V]` **P4** — Hay caídas públicas documentadas en preventas, y el regulador imputó al líder del mercado por fallas en el deber de información y en las reglas de comercio electrónico · `[V]` **P7** — La boleta nominal tiene precedente normativo |
| **Supuesto** | **S3** — El promotor cambia de plataforma por la caída en el minuto uno · **S6** — 8% de las boletas cambian de manos después de la venta · **S7** — El fan autoriza el tratamiento de sus datos |
| **Restricción** | **R2** retracto en 5 días hábiles · **R4** habeas data: la boleta nominal trata datos personales · **R8** la SIC multa hasta 2.000 SMMLV |
| **Problema** | El recorrido está roto por pedazos y **cada pedazo roto es un usuario que no vuelve**: entra a una fila sin saber cuánto va a esperar, no sabe si va a alcanzar, se cae al pagar, paga y no recibe nada, o recibe una boleta que no puede transferir sin salirse de la plataforma |
| **Alcance** | *Dentro:* desde que el usuario entra a la fila hasta que la boleta es válida y está en sus manos — incluidas la transferencia, la reventa autorizada y la devolución. *Fuera:* la validación en la puerta y lo que ocurra fuera de la plataforma |
| **Canvas** | Segmentos *el de minuto uno*, *el del parche* y *el de última hora* *(1)* → propuesta de valor al fan *(2)* → relación de diez minutos y una disputa *(4)* → capacidades **C-3** orden de atención y **C-4** ciclo de vida del derecho *(7)* → recurso **R-3** identidad verificada *(6)* |
| **Ingreso** | **Fuente 1**, que solo existe si el recorrido se completa · **Fuente 2** — comisión sobre las boletas que cambian de manos dentro de la plataforma, ~7% del ingreso |
| **Costo** | Verificación de identidad ~$100 por comprador nuevo · soporte en la ventana ~$200/boleta · devoluciones y disputas ~$150/boleta |
| **Atributo** | **A-4** fila con política demostrable · **A-6** nunca se sacrifica una compra en curso · **A-3** una boleta, un titular válido en cada instante · **A-5** la reserva no pagada se libera en ≤ 10 min |
| **OKR / KR** | **KR 2.1** ve su turno y cuánto falta · **KR 2.2** abandono < 15% · **KR 2.3** 98% termina el pago sin errores · **KR 2.4** boleta en menos de 2 min · **KR 2.5** satisfacción 4,2/5 · **KR 4.5** 8% de los cambios de dueño ocurren dentro de la plataforma |

### Cadena 3 — el costo del pico, que es donde el negocio toca la arquitectura

| Eslabón | Contenido |
|---|---|
| **Premisa** | `[V]` **P1** y **P2** — el mercado creció a $1,53 billones y el PULEP publica quién lo compone: hay suficientes eventos de ráfaga |
| **Supuesto** | **S5** — El inductor del costo de pico son los usuarios concurrentes en la fila, no las boletas por segundo · **S2** — aforo tipo 8.000 |
| **Restricción** | **R5** el aforo autorizado no se puede exceder en ningún caso · **R9** equipo de 3 personas y 3 semanas |
| **Problema** | El sistema está quieto el 99% del tiempo y absorbe dos órdenes de magnitud en diez minutos. Sostener capacidad de pico todo el mes es quemar plata; no sostenerla es caerse el día que importa — **en público** |
| **Alcance** | *Dentro:* gestión de la demanda concentrada y política de fila publicada. *Fuera:* eventos de demanda continua, que no tienen ráfaga |
| **Canvas** | Segmento *el de minuto uno* *(1)* → capacidades **C-2** aforo finito y **C-3** orden de atención demostrable *(7)* → recurso **R-2** capacidad elástica *(6)* → socio **S-4** la nube *(8)* → costo de pico *(9)* |
| **Ingreso** | Indirecto pero decisivo: **es la condición para que exista la fuente 1.** Un evento caído no factura, y cuesta el promotor |
| **Costo** | Cómputo de la ventana **~$9/boleta** `[V]` tarifa — el hallazgo es que **el pico es caro en reputación y barato en pesos** |
| **Atributo** | **A-7** ≤ $150/boleta bajo carga declarada · **A-9** ≥ 99,9% en la ventana · **A-2** cero sobreventa · **A-4** fila demostrable |
| **OKR / KR** | **KR 3.1** máximo $150 de infraestructura por boleta · **KR 3.3** usar ≥ 70% de la capacidad contratada · **KR 3.4** 99,9% de disponibilidad en la venta · **KR 1.1** cero boletas por encima del aforo |

### Y la cadena de vuelta: qué le exige este negocio a la arquitectura

> *«¿Qué decisiones arquitectónicas se justifican a partir de este modelo de negocio?»*

| Del negocio… | …sale este atributo | …que fuerza esta decisión | …y esta decisión cuesta |
|---|---|---|---|
| Cobro sin boleta hunde la reputación (P4, C-1) | **A-1** discrepancias en cero | SAGA orquestada, idempotencia y conciliación durable; no hay una transacción ACID con la pasarela | Complejidad de estados y compensaciones · [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) |
| El aforo es un límite legal (R5) | **A-2** cero sobreventa | Consistencia fuerte en el inventario de silla numerada | Latencia de confirmación en el pico · **AD-003** |
| Una localidad general es un contador, no una silla (bloque 1) | **A-2** con otra garantía | **Dos modelos de consistencia en la misma venta** | Margen de seguridad en localidad general · **AD-003** |
| La fila es un producto, no plomería (C-3) | **A-4** equidad demostrable | Sala Space-Based con secuencia durable, admisión controlada y token firmado | Estado distribuido y reconciliación · [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) |
| El pico es puntual y predecible (S5) | **A-7** costo por boleta con meta | Precalentamiento por ventana, KEDA como respaldo y límites de admisión | Complejidad operativa · [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) |
| Devolverle datos al promotor es transferencia a un tercero (R4) | — *(restricción dura)* | Aislamiento entre tenants y modelo de datos que soporte el consentimiento | **AD-004** |

**Esta tabla es el puente a la Entrega 2.** Ninguna de esas decisiones se toma aquí: aquí se
demuestra **de dónde sale la obligación de tomarlas**.

---

# Anexos

> Los anexos A y B corresponden a los pasos 5 y 6 de la lámina 55 —identificar el estilo de
> arquitectura y definir una estrategia de implementación, ambos con su justificación—. Van
> como anexos porque son la respuesta a la pregunta con la que cierra el caso de negocio:
> **¿qué decisiones arquitectónicas se justifican a partir de este modelo?** El anexo C es
> el análisis de posición.

## Anexo A — Estilo de arquitectura

La estructura de razonamiento que espera el curso es la del ejemplo CAP de la lámina 23:
escenario → decisión → alternativas comparadas por atributo → elección → **qué ganamos** →
**qué sacrificamos** → impacto en el negocio.

### Atributos de calidad que exige el negocio

> **Los nueve atributos, con su umbral, se movieron a
> [`atributos-de-calidad.md`](atributos-de-calidad.md).** Es el insumo directo de las
> Entregas 2 y 3, y ahí se lee sin cargar este documento completo. Lo que sigue —las
> alternativas, la comparación y el estilo elegido— se apoya en ellos.

### Alternativas consideradas

> Incluir siempre la opción «mantener lo actual» o la más simple posible (lámina 24).

**El escenario que fuerza la decisión.** Treinta mil personas entran en sesenta segundos a
comprar ocho mil puestos, pagando a través de un tercero que se demora, responde tarde y a
veces responde dos veces — y el aforo no se puede exceder ni una sola vez.

| # | Alternativa | A favor | En contra |
|---|---|---|---|
| **1** | **Monolito transaccional con una sola base de datos** *(la opción más simple, que la lámina 24 obliga a considerar)* | El invariante del aforo sale gratis: es una transacción. Un solo despliegue, un solo modelo mental, y el equipo son tres personas con tres semanas (**R9**) | La ráfaga obliga a escalar **todo el sistema** para atender la fila, cuando lo que carga es solo la sala de espera. Y una llamada lenta a la pasarela bloquea recursos que el inventario necesita |
| **2** | **Microservicios sincrónicos por capacidad** | Cada capacidad escala por separado; el reparto por C-1…C-7 es natural | Una venta cruza cuatro servicios en cadena sincrónica: la latencia se suma y **la disponibilidad se multiplica a la baja** justo en el minuto que más importa. Y no resuelve la respuesta tardía de la pasarela |
| **3** | **Núcleo transaccional de inventario + servicios desacoplados por eventos** alrededor (fila, orquestador de pago, emisión, conciliación) | El aforo se resuelve donde debe —consistencia fuerte en un núcleo pequeño— y lo que carga en el pico escala solo. **El bus con reproducción es lo que permite cerrar solas las discrepancias de la pasarela** y reconstruir cada venta | Consistencia eventual entre el cobro y la emisión: hay una ventana en la que el sistema *sabe* que algo está a medias. Hay que operar un bus, y la depuración es más difícil |
| **4** | **Serverless puro dirigido por eventos** | La elasticidad de la ventana es casi gratis y el costo fuera del pico tiende a cero | El invariante del aforo queda sin un lugar natural donde vivir, y los arranques en frío pegan **exactamente en el segundo cero** de la venta |

### Comparación por atributo de calidad

| Atributo | 1 · Monolito | 2 · Microservicios sinc. | **3 · Núcleo + eventos** | 4 · Serverless |
|---|---|---|---|---|
| **A-1** correspondencia dinero–boleta | Buena mientras la pasarela responda; sin salida para la respuesta tardía | Débil: la cadena sincrónica no sobrevive al tercero lento | **La mejor**: el bus con reproducción es lo que cierra la discrepancia sola | Posible, pero sin un dueño claro del estado |
| **A-2** aforo no excedido | **La mejor**: es una transacción | Frágil: coordinación distribuida | **Buena**: el núcleo mantiene la transacción | Débil |
| **A-4** equidad de la fila | Cara: escala todo para escalar la fila | Buena | **Buena**: la fila es su propio servicio | **La mejor** |
| **A-7** costo por boleta | Malo: se paga capacidad que no se usa | Medio | **Bueno**: solo escala lo que carga | **El mejor** |
| **A-9** disponibilidad en ventana | Un punto único de falla | La peor: se multiplica a la baja | **Buena**: la degradación es dirigible (A-6) | Buena, salvo el arranque en frío |
| **Cabe en 3 personas y 3 semanas (R9)** | **La mejor** | La peor | **Aceptable**: son cuatro piezas, no catorce | Media |

### Estilo elegido

**Elegimos la alternativa 3: un núcleo transaccional de inventario rodeado de servicios
desacoplados por un bus de eventos con capacidad de reproducción.**

**Qué ganamos:**

- **El aforo deja de ser un problema distribuido.** Vive en un núcleo pequeño con
  consistencia fuerte, que es la única forma honesta de sostener A-2 y R5.
- **Lo que carga en el pico escala solo.** La sala de espera y la fila reciben los 30.000;
  el inventario recibe 5 operaciones por segundo. Escalarlos juntos era pagar de más (A-7).
- **La respuesta tardía de la pasarela deja de ser un caso raro y pasa a ser un evento más.**
  Es lo que permite que la discrepancia se cierre sola en vez de terminar en una hoja de
  cálculo al día siguiente (A-1).
- **La reconstrucción de la venta sale del mismo mecanismo**, no de un módulo de auditoría
  aparte (A-8).

**Qué sacrificamos:**

- **Consistencia eventual entre el cobro y la emisión.** Existe una ventana —acotada y
  declarada— en la que hay dinero capturado sin boleta emitida. La promesa no es que nunca
  ocurra: es que **el sistema la detecta y la cierra en ≤ 15 minutos** sin intervención.
- **Complejidad de operación y de depuración.** Un bus más un núcleo son más piezas que un
  monolito, con tres personas y tres semanas (R9).
- **Orden estricto solo donde se paga.** Fuera del núcleo hay que diseñar para mensajes
  duplicados y fuera de orden.

**Impacto en el negocio:**

Convierte el diferenciador en algo demostrable. La promesa que nos separa —*ni un peso
cobrado sin boleta*— **no es una afirmación de marketing sino una consecuencia de esta
elección**, y es lo que se muestra en el momento estrella 2 de la demo. También es lo que
hace costeable el pico: sin elasticidad selectiva, la meta de ≤ $150 por boleta no se
sostiene.

**Costo de oportunidad** (lámina 25) — el valor de la mejor alternativa no elegida:

La alternativa 1 nos habría dado **la mitad del tiempo del equipo de vuelta** y el invariante
del aforo gratis. Eso es lo que se paga: con tres personas y tres semanas (**R9**), la
complejidad del bus es tiempo que no está en el producto. **Se acepta porque el monolito no
tiene respuesta para la pasarela que responde tarde** — y esa, no la sobreventa, es la tesis
del proyecto. Si el invariante fuera solo «no vender dos veces la misma silla», la
alternativa 1 sería la correcta y este documento no tendría razón de ser.

> Esta decisión se registra además como ADR en [`../decisiones/`](../decisiones/).

### Tensiones ya visibles

> Las cinco están desarrolladas en
> [la idea](ideas/idea-lina.md#tensiones-arquitectónicas-que-se-ven-venir). Son puntos de
> trade-off en el sentido de ATAM: se negocian con el negocio, no se optimizan.

| # | Tensión | Qué se mueve en contra | Quién la decide |
|---|---|---|---|
| 1 | **No sobrevender contra no rechazar ventas** | A-2 contra el ingreso del minuto que más factura. Es el ejemplo de CAP de la lámina 23 | El negocio: cuánta venta se está dispuesto a perder por no arriesgar el aforo |
| 2 | **Y la respuesta no es la misma para los dos inventarios** | Silla numerada exige consistencia fuerte; localidad general es un contador que tolera un margen de seguridad y vende más rápido | **AD-003.** Es el mejor material de sustentación que tiene el proyecto |
| 3 | **Cerrar rápido contra cobrar seguro** | Confirmar antes de la pasarela sube conversión y arriesga emitir sin cobro. Esperarla retiene inventario en el pico | El negocio: cuánto se espera y qué se promete mientras tanto |
| 4 | **Equidad contra ingreso, en la fila** | FIFO premia a quien tiene mejor conexión y a los bots; la lotería es más justa y más lenta en facturar; la preventa monetiza y deja por fuera al fan de a pie | El promotor, evento por evento. **Es la única defensa real contra la reventa** |
| 5 | **Fricción anti-bot contra conversión** | Cada verificación que frena a un bot frena fans. Un falso positivo es una venta perdida y una queja pública | El negocio, no el arquitecto |

**Las cinco tienen la misma forma:** dos atributos que el negocio quiere y que se mueven en
direcciones opuestas. Por eso son puntos de trade-off y no defectos por corregir.

## Anexo B — Estrategia de implementación

### Enfoque

> Cómo se aborda —incremental, por capacidades, piloto y escalado— y **por qué** ese y no
> otro.

**Incremental por capacidades, con un piloto de un solo promotor antes de escalar.**

Cada incremento entrega **una capacidad completa del bloque 7**, no una capa técnica. La
razón es directa: si se construye por capas —primero la base de datos, después la API,
después la interfaz— no hay nada demostrable hasta el final, y con **R9** (tres personas,
tres semanas) no hay margen para descubrir tarde que algo no funciona. Construir por
capacidades significa que **al final de cada incremento hay algo que se puede poner a
fallar a propósito**, que es como se valida esta tesis.

**El orden de los incrementos lo decide el riesgo, no la comodidad.** Primero va lo que
puede matar el proyecto —la pasarela que traiciona—, no lo que es fácil de mostrar. Lo
contrario es el error clásico: dejar la conciliación para el final y descubrir en la
sustentación que no cierra.

**El piloto con un solo promotor** sale del modelo financiero: el punto de equilibrio está
en **~1 promotor activo**, así que no hace falta escalar comercialmente para probar que el
negocio se sostiene. Escalar antes de tener un evento sin caídas sería comprar riesgo
reputacional justo en el segmento donde la reputación es todo.

### Hitos

| # | Hito | Qué queda funcionando | Cómo se verifica | Cuándo |
|---|---|---|---|---|
| **H1** | **El aforo aguanta** | Sala de espera, fila con política publicada, motor de inventario y emisión: la venta completa de extremo a extremo | 30.000 usuarios en 60 s contra 5.000 boletas, **contador de sobreventa en cero** *(momento estrella 1)* | Entrega 3 |
| **H2** | **La pasarela traiciona y el sistema se recupera solo** | Orquestador de pago contra un **simulador de pasarela hostil** —latencia variable, respuestas tardías, duplicadas y cobros después de que expiró la reserva— más el conciliador | El contador de discrepancias sube y **vuelve solo a cero** *(momento estrella 2)*. **Es el hito que no puede fallar** | Entrega 3 |
| **H3** | **Numerado contra general** | Los dos modelos de consistencia conviviendo en la misma venta | La misma ráfaga sobre los dos inventarios, enfrentando latencia de confirmación y boletas por segundo *(momento estrella 3)* | Entrega 3 |
| **H4** | **La ráfaga inversa** | Devolución masiva por cancelación del evento | Miles de devoluciones simultáneas y **la plata cuadra al peso** *(momento estrella 5)*. Cumple R2 y R3 | Entrega 3, si alcanza |
| **H5** | **Cuánto costó** | Medición del costo de infraestructura por boleta bajo dos estrategias de elasticidad | El gasto de la corrida dividido por boletas vendidas, contra la meta A-7 *(momento estrella 6)* | Entrega 3 |
| **H6** | **La reventa** | Mercado secundario dentro de la plataforma | — | **Se modela en la Entrega 2 y solo se implementa si sobra tiempo** |

> **H1 es el piso, no el techo.** Es lo que va a mostrar todo grupo que elija boletería.
> **H2 y H5 son los que ganan**, y por eso van antes que H3 y H4 en el orden de riesgo.
> H6 está declarado como el primer sacrificio: es mejor decirlo ahora que quedar a medias.

### Recursos

| Recurso | Qué se necesita | De dónde sale |
|---|---|---|
| **Equipo** | 3 personas · Alejo (núcleo e infraestructura), Lina (dominio y validación), Quinnie (modelo y datos) | **R9** — es lo que hay |
| **Infraestructura** | Cómputo elástico para la ventana de la corrida; el resto apagado | Nube, tarifa `[V]`. El costo de una corrida es despreciable |
| **Terceros** | **Ninguno bloqueante.** La pasarela se reemplaza por el simulador hostil | Decisión de alcance |
| **Presupuesto** | Ninguno asignado | **R9** |

> **Que la demo no dependa de ningún tercero es una decisión, no una limitación.** Un
> simulador de pasarela hostil es *mejor* que una pasarela real para demostrar esta tesis:
> permite provocar a voluntad la falla que en producción ocurre una vez cada mil ventas.

### Riesgos

| Riesgo | Impacto | Prob. | Qué hacemos al respecto |
|---|---|---|---|
| **Otro grupo llega con boletería** | Alto — es el riesgo número uno | **Alta** | La diferencia no es el tema sino el invariante monetario, los dos modelos de consistencia, la fila como producto y el costo por boleta. **Decirlo en el primer minuto de la sustentación**, no al final |
| **La demo se queda en «no hubo sobreventa»** | Alto — es el piso que muestra todo el mundo | Media | H2 y H5 son obligatorios, no adorno |
| **El alcance se infla** | Alto — reventa, devoluciones, multi-tenant y anti-bot son cuatro sistemas | **Alta** | Ya está fijado: H6 se modela y no se implementa; el control de acceso está fuera del alcance |
| **Nos evalúan contra el caso de la lámina 53** | Medio — limita el techo | Media | La frontera está declarada por escrito en el alcance y en el bloque 8 |
| **El supuesto S1 resulta falso** (hay que compartir el cargo por servicio) | Medio — cuadruplica el punto de equilibrio | **Alta** | Ya está cuantificado: sigue siendo viable en ~1,7 eventos/mes. **Presentarlo nosotros antes de que lo pregunten** |
| **El equipo confunde atributo con táctica** | Medio — el profesor lo señala explícitamente | Media | Los atributos con umbral están en el anexo A; las tácticas van en la Entrega 2, separadas |
| **La conciliación no cierra a tiempo para la sustentación** | **Crítico** — es la tesis | Media | Por eso H2 va segundo y no último |

### Cómo medimos el progreso

> Conectar con los KR de la sección 5 cuando aplique.

**El progreso no se mide en tareas cerradas sino en hitos verificables**, y cada hito tiene
un número que ya está escrito como KR o como atributo:

| Hito | La medida que dice si pasó |
|---|---|
| H1 | Boletas emitidas por encima del aforo = **0** → **KR 1.1** y atributo **A-2** |
| H2 | Discrepancias abiertas al final de la corrida = **0**, cerradas solas en ≤ 15 min → **KR 1.2** y **A-1** |
| H3 | Latencia de confirmación y boletas/s de cada modelo de consistencia → insumo de **AD-003** |
| H4 | Diferencia entre lo cobrado y lo devuelto = **0** → **A-1** bajo la ráfaga inversa |
| H5 | Costo de infraestructura por boleta ≤ **$150** bajo la carga declarada → **KR 3.1** y **A-7** |

**Y la regla de parada:** si al terminar la semana 3 H2 no cierra, **se sustenta con H1 y H2
a medias antes que agregar H3 o H4**. Un hito incompleto que se explica bien vale más que
tres hitos empezados.

## Anexo C — Análisis de posición (DAFO)

> Sale de los nueve bloques del canvas ya escritos, no al revés.

| **Debilidades** (internas) | **Amenazas** (externas) |
|---|---|
| Equipo de 3 personas sin presupuesto ni operación previa: **cero histórico y cero marca** en un mercado donde la confianza lo es todo (**R9**) | Los operadores establecidos ya tienen los contratos y la relación con los promotores. **«Eso ya existe y funciona»** es la objeción principal |
| **No tenemos inventario propio**: dependemos de que un tercero firme (**D1**) | El reparto real del cargo por servicio puede obligarnos a compartirlo (**S1**), y cuadruplica el punto de equilibrio |
| La consistencia eventual entre cobro y emisión es una ventana real, aunque acotada y declarada | El régimen de habeas data castiga con multas de hasta 2.000 SMMLV y puede suspender el tratamiento de datos (**R8**) |
| Dependemos de una pasarela que no controlamos y que es el 90% de nuestro costo variable (**D2**) | La legalidad de la reventa está indefinida: **hoy nos favorece, pero puede cambiar** |
| **Fortalezas** (internas) | **Oportunidades** (externas) |
| El invariante monetario como promesa verificable, no como eslogan: **es lo que ningún competidor está vendiendo hoy** | `[V]` **El líder del mercado está imputado por el regulador**, y uno de los cargos describe exactamente nuestro diferencial |
| Dos modelos de consistencia sobre el mismo inventario: vende más rápido donde se puede y garantiza donde se debe | `[V]` El mercado se quintuplicó en cinco años: de $310 mil millones (2018) a **$1,53 billones** (2023) |
| La reventa como ingreso en lugar de como fraude a bloquear | `[V]` El **PULEP** publica el universo exacto de clientes potenciales: no hay que estimarlo |
| El costo por boleta como atributo con meta medible, no como cifra que sale al final | `[V]` El Decreto 1622 de 2022 **normalizó la boleta nominal** en fútbol: hay precedente regulatorio para lo que proponemos |
| Un alcance declarado con frontera explícita: sabemos dónde termina el sistema | Los promotores no reciben hoy ni datos ni margen de reventa: **son dos cosas que se pueden devolver desde el día uno** |

> **Lo que el DAFO dice cuando se lee en diagonal:** nuestras fortalezas son **de producto**
> y nuestras debilidades son **de operación y de escala**. Eso es exactamente lo que se
> espera de un entrante, y es la razón por la que la estrategia es un piloto con un promotor
> y no una salida al mercado.
