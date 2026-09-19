# Presentación de la Entrega 1

**URL:** <https://wondrous-monstera-174b32.netlify.app/>
**Título:** *TicketRight — Caso de negocio*
**Equipo:** Alejandro Ríos · Lina Ballesteros · Quinnie Villarreal
**Usada en:** sustentación de la Entrega 1, septiembre de 2026

> Este archivo es la **transcripción del contenido publicado**, hecha leyendo el sitio
> desplegado. Sirve para tres cosas: que el contenido no dependa de que el despliegue siga
> en pie, que un agente pueda leerlo sin abrir el navegador, y tener el guion a la mano para
> la sustentación de la Entrega 3.
>
> `PENDIENTE: el código fuente de la presentación no está en este repositorio — solo el
> despliegue. Decidir si se sube (¿carpeta propia?) o se deja en Netlify. Quien lo tenga:
> Alejo.`

Todo el contenido sale del mismo caso de negocio entregado
([`caso-de-negocio-corporativo.md`](caso-de-negocio-corporativo.md)); no hay cifras nuevas
ni distintas. La presentación **no reemplaza al documento**: lo recorre.

## Contenido

| Pantalla | Qué muestra |
|---|---|
| [Cómo funciona](#cómo-funciona) | Los dos modos y las frases puente de trazabilidad |
| [00 · Portada](#00--portada) | Tesis, equipo y convención `[V]` / `[S]` |
| [01 · Problema](#01--problema) | Desincronización dinero–boleta, actores y «por qué ahora» |
| [02 · Solución](#02--solución) | La cadena digital, los tres pilares y el alcance |
| [03 · Canvas](#03--business-model-canvas) | Los nueve bloques en una línea cada uno |
| [03b · Supuestos](#03b--supuestos-críticos-pantalla-propia-en-modo-presentación) | S1–S8 con impacto, restricciones y dependencias |
| [04 · Una boleta](#04--una-boleta-de-punta-a-punta) | El recibo de $244.000, el equilibrio de 2.990 y el capital de T0 |
| [05 · OKR](#05--okr-del-año-1) | Los cuatro objetivos con base → meta → horizonte |
| [06 · Trazabilidad](#06--trazabilidad) | Las cadenas y lo que queda abierto |
| [07 · Cierre](#07--cierre) | El resumen y la pregunta que abre la Entrega 2 |

## Cómo funciona

Es una aplicación web, no un PDF de diapositivas. Tiene **dos modos**:

| Modo | Qué es | Secciones |
|---|---|---|
| **Landing** | Página larga que se recorre con scroll | 6 secciones numeradas |
| **Presentación** | Diapositiva a diapositiva, con `←` `→` y `Esc` para salir | **11 pantallas** |

Se entra al modo presentación con el botón de la esquina o con `⌘/Ctrl + P`. El modo
presentación abre cuatro pantallas que en la landing van embebidas: **Actores**, **Alcance**,
**Supuestos** y **Equilibrio**.

Entre sección y sección hay **frases puente** («Entonces…») que hacen explícita la
trazabilidad que exige la rúbrica. Son el hilo argumental, y vale la pena decirlas en voz
alta al sustentar:

| Puente | Frase |
|---|---|
| Problema → Solución | «Si el dolor es la desincronización, la solución no es "otra boletera": es una cadena que no rompe dinero ↔ boleta —con un alcance digital explícito y actores claros.» |
| Solución → Canvas | «Esa promesa solo vale si el modelo de negocio la sostiene: a quién se vende (promotor), quién paga el cargo (fan), cómo se cobra y qué cuesta operar.» |
| Canvas → Supuestos | «Antes de seguir el dinero de una boleta, conviene dejar explícito qué es apuesta `[S]` y qué ya está verificado `[V]`.» |
| Supuestos → Números | «Con S1–S8 sobre la mesa, los bloques 5 y 9 se entienden siguiendo el dinero de una sola boleta.» |
| Números → OKR | «Si con ~3.000 boletas al mes ya cubrimos costos, los OKR —con key results medibles— dicen cómo sabremos si eso pasa de verdad.» |
| OKR → Cierre | «Con el hilo cerrado, la pregunta que queda para la arquitectura es: ¿qué decisiones sostiene este negocio?» |

---

## 00 · Portada

> **El derecho de entrar debe corresponder siempre al dinero cobrado.**

**TicketRight** · Caso de negocio B2B2C · Cliente: promotor · Usuario: fan · EAFIT
Alejandro Ríos · Lina Ballesteros · Quinnie Villarreal

Convención de evidencia, declarada desde el principio:

- `[V]` Verificado en fuente pública (mercado, leyes, tarifas, SIC, PULEP).
- `[S]` Supuesto del modelo o meta empresarial: hay que contrastarlo con los primeros eventos.
- Todas las cifras monetarias están en pesos colombianos.

## 01 · Problema

> **Cuando el dinero y la boleta se desincronizan, se rompe la confianza.**

En ventas de alta demanda, miles intentan comprar a la vez. La fila, el inventario y la
pasarela procesan a ritmos distintos. Una respuesta tardía o repetida deja la compra en
estado incierto.

**Impacto:** cobro sin boleta → reclamos · boleta duplicada → aforo · devolución mal hecha →
costo y reputación · reventa informal → margen perdido y boletas inválidas.

**Oportunidad:** una cadena digital trazable — fila → reserva → pago → emisión →
transferencia / reventa / devolución → liquidación.

**Quién es cliente y quién es usuario.** TicketRight es B2B2C. El contrato y el inventario
vienen del promotor; el fan usa la plataforma y paga el cargo por servicio. Sin separar esos
roles, ni el canvas ni los OKR se entienden.

| Quién | Rol | Qué hace |
|---|---|---|
| Promotor / productora | Cliente contractual | Decide el operador, aporta el inventario y paga (o negoció) el servicio. Sin este contrato no hay negocio |
| Fan | Usuario y pagador del cargo | Compra, recibe la boleta y vive la experiencia. No firma el contrato B2B, pero financia el cargo por servicio |

**Por qué ahora:** mercado formal que pasó de $310 mil millones (2018) a $1,53 billones
(2023) `[V]` · señal regulatoria —pliego de cargos de la SIC contra el operador de TuBoleta
en junio de 2026, investigación y no condena `[V]`— · obligaciones duras de parafiscal,
retracto, devoluciones y datos personales, que hacen de la trazabilidad una capacidad y no
un adorno `[V]`.

**A quién le duele:** al promotor, que asume el impacto reputacional, operativo y de aforo ·
al fan, que queda con incertidumbre sobre su dinero y su derecho de entrada · y el mercado
paralelo, que captura el margen y expone boletas inválidas.

### Mapa de actores *(pantalla propia en modo presentación)*

| Actor | Rol | Qué quiere |
|---|---|---|
| Promotor / productora | Cliente | Venta confiable, liquidación clara, datos autorizados y participación en reventa |
| Fan | Usuario | Fila comprensible, compra sin error y boleta válida (transferible / revendible) |
| Recinto | Espacio | Operar dentro del aforo autorizado |
| Artista / representación | Influencia | Incide en la elección del operador y en la preventa |
| Pasarela y tech | Terceros | Pagos, nube, identidad, notificaciones |
| Autoridades | Control | PULEP, Ministerio, SIC y locales vigilan registro y consumidor |

## 02 · Solución

> **Una cadena digital que no rompe la correspondencia dinero ↔ boleta.**

El promotor configura evento, localidades, aforo y reglas. TicketRight administra la fila,
reserva inventario, concilia el pago, emite boleta nominal y guarda el historial. Después:
transferencia, reventa autorizada, anulaciones, devoluciones y liquidación.

**La tesis:** no es «no sobrevender» —eso se resuelve con un candado—. Lo difícil es **no
romper nunca la correspondencia entre el dinero cobrado y el derecho a entrar**.

| Pilar | Qué es | Qué cierra |
|---|---|---|
| Invariante monetario | Cada peso cobrado queda amarrado a un derecho de asistencia trazable | Cobros sin boleta y boletas sin cobro |
| Control del promotor | Inventario, liquidación clara e información autorizada de compradores | Devuelve al dueño del evento el control de la relación |
| Reventa autorizada | Canal seguro que comparte valor con el promotor, no con el mercado informal | Convierte un riesgo en fuente de ingreso compartido |

### Alcance *(pantalla propia en modo presentación)*

**Dentro:** configuración de eventos, localidades, precios, aforo y reglas · fila y demanda
concentrada · reserva y custodia de inventario · pago, seguimiento y conciliación · emisión
nominal · transferencia y reventa autorizada · anulaciones y devoluciones · liquidación,
retención parafiscal y reportes.

**Fuera, y por qué:**

| Fuera del alcance | Por qué |
|---|---|
| Producción y logística del evento físico | No es el negocio; el recinto y el promotor ya lo operan |
| Definir permisos o aforo autorizado | Lo fija la autoridad / el recinto; TicketRight respeta el cupo |
| Operación interna de la pasarela | Es un tercero; TicketRight concilia, no la sustituye |
| Control físico de acceso en puerta | Se integra por contrato; el alcance digital termina antes de la puerta |
| Reventa / transferencia fuera de TicketRight | Fuera del canal no hay trazabilidad ni valor compartido |
| Publicidad masiva y representación del artista | Canal de adquisición ajeno; el fan llega por el canal oficial |
| Demanda continua (cine, parques, museos) | El caso está diseñado para picos de alta demanda |

## 03 · Business Model Canvas

**La historia en una línea:** el promotor aporta el inventario y sufre si la venta falla →
TicketRight vende confianza y trazabilidad → llega por venta B2B y cobra por boleta → para
cumplirlo debe conciliar, custodiar y liquidar → eso explica recursos, socios y costos.

| # | Bloque | En una línea |
|---|---|---|
| 1 | Segmentos | Cliente: promotor/productora de eventos 3.000–40.000. Usuario: fan que paga el cargo |
| 2 | Propuesta de valor | Correspondencia dinero–boleta–titular; reventa autorizada; liquidación clara |
| 3 | Canales | Venta consultiva al promotor; prospección PULEP; canal oficial del evento para el fan |
| 4 | Relaciones | Contrato continuo con el promotor; autoservicio y soporte resolutivo para el fan |
| 5 | Ingresos | Cargo 12% por boleta; comisión de reventa; tarifa por evento; datos y preventa |
| 6 | Recursos | Contratos e inventario; autorización de operador; tecnología; custodia y liquidez |
| 7 | Actividades | Adquirir eventos; operar ventas; conciliar; custodiar; retener parafiscal; liquidar |
| 8 | Socios | Promotores, recintos, pasarela, nube, identidad, control de acceso |
| 9 | Costos | $7.770 variables/boleta · $51,9 M fijos/mes en el escenario base |

## 03b · Supuestos críticos *(pantalla propia en modo presentación)*

> **Lo que ya está verificado — y lo que aún es apuesta.**
> Sin esta distinción el caso se ve inventado. `[V]` sostiene el «por qué ahora».
> `[S]` sostiene el modelo financiero y debe cerrarse en T0.

**Verificado `[V]`:** P1 mercado ($310 mil millones en 2018 → $1,53 billones en 2023, +22% en
2023) · P2 PULEP como registro para prospectar sin inventar mercado · P3 cargo por servicio
observado entre 10% y 15% · P4 pliego de cargos de la SIC de junio de 2026 (investigación,
no condena) · P5 parafiscal, retracto, devoluciones y datos hacen de la trazabilidad una
capacidad.

**Supuestos `[S]`, con su impacto declarado:**

| # | Supuesto | Impacto |
|---|---|---|
| S1 | Cargo 12% completo. Con reparto 50/50 la contribución cae de ~$17.350 a ~$5.350 y el equilibrio pasa de 0,39 a 1,28 eventos/mes | **Inductor n.º 1 del caso** |
| S2 | Evento tipo: 8.000 puestos, boleta $200.000, ocupación 95% (7.600 boletas) | Cambia ingresos, parafiscal y equilibrio |
| S3 | Los promotores cambian de operador a cambio de menos riesgo, más trazabilidad y reventa | Sin inventario no hay negocio |
| S4 | Procesamos el pago completo: el fan paga $244.000 | Define el costo de cobrar |
| S5 | Reventa del 8% dentro de la plataforma | Ingreso secundario y diferencial; el core sigue viable sin él |
| S6 | Planta de 4 personas (~4 SMMLV × factor 1,52) | Es la mayor parte de los $51,9 M fijos/mes |
| S7 | IVA: base con cargo excluido e IVA de pasarela descontable → $17.350 y 2.990 boletas. Cota dura: $12.156 y 4.268 | Inductor tributario crítico (R1) |
| S8 | Se recauda antes y se liquida después; el evento tipo mueve $1.854 M y el flotante no es ingreso | Exige cuentas segregadas y liquidez (R2) |

**Restricciones:** parafiscal del 10% (Ley 1493, boletas ≥ 3 UVT = $157.122 en 2026) ·
retracto (Ley 1480) · datos personales (Ley 1581) · aforo autorizado · **autorización de
operador**: registrarse en PULEP no basta, hace falta resolución del Ministerio para vender
en línea, y eso crea un T0 sin ingresos.

**Dependencias:** inventario del promotor, pasarela, nube en el pico y control de acceso.
TicketRight concilia esas relaciones; no opera por dentro a esos terceros.

## 04 · Una boleta, de punta a punta

> **Olvida por un momento tablas y siglas. Vamos a seguir el dinero de una sola compra —y
> luego a preguntar cuántas hacen falta para pagar el mes.**

Concierto de 8.000 puestos, boleta de $200.000, se llena al 95%: 7.600 boletas. Ese es el
evento tipo `[S]`.

**Recibo de una compra — el fan paga $244.000:**

| Quién se lo lleva | Qué es | Cuánto | En cristiano |
|---|---|---:|---|
| El promotor | Precio de la boleta | $200.000 | Es su plata. Nosotros solo la guardamos y se la entregamos después |
| El Estado | Impuesto parafiscal (10%) | $20.000 | Lo retenemos y lo declaramos. Tampoco es nuestro |
| **TicketRight** | **Cargo por servicio (12%)** | **$24.000** | Esto sí es nuestro ingreso principal por cada boleta vendida |

**¿Cuánto nos queda de verdad?** De los $24.000 no nos podemos quedar con todo: cobrar con
tarjeta cuesta, y cuesta caro porque la pasarela cobra sobre los $244.000 completos, no solo
sobre nuestro cargo.

| | |
|---|---:|
| Nos entra por la boleta (cargo del 12%) | $24.000 |
| + Un poco de reventa (promedio si ~8% se revenden) | $1.120 |
| − Costo de cobrar y operar (casi todo Wompi: 2,65% + $700 sobre $244.000) | $7.770 |
| **Nos quedan por cada boleta** | **$17.350** |

Esa plata es la que paga el equipo, la nube fija y el resto del mes. En el documento se
llama «dinero disponible por boleta».

### Equilibrio *(pantalla propia en modo presentación)*

Costos fijos del mes `[S]`, **$51.882.000**:

| Concepto | Valor | Inductor |
|---|---:|---|
| Personal (4 personas) | $42.582.000 | 4 × 4 SMMLV × factor 1,52 |
| Adquisición comercial | $5.000.000 | Prospección de promotores |
| Infraestructura base | $2.000.000 | Ambientes y nube fija |
| Legal, contable y datos | $1.500.000 | Cumplimiento mensual |
| Licencias y herramientas | $800.000 | Herramientas de trabajo |

> **Gastos fijos del mes ÷ lo que deja cada boleta**
> $51.882.000 ÷ $17.350 = **2.990 boletas para cubrir el mes**

Comprobación: 2.990 × $17.350 ≈ $51,9 millones. Un evento tipo vende 7.600 boletas, así que
2.990 son ~0,4 eventos: **menos de medio concierto al mes para no perder en operación**.

**¿Y si nos quedamos con menos del cargo?** Los $51,9 M fijos no cambian; lo que cambia es
cuánto deja cada boleta.

| Escenario | Nos queda | Boletas necesarias | Nota |
|---|---:|---:|---|
| Cargo 12% completo (base) | $17.350 | 2.990 | ~0,39 eventos tipo |
| Cargo baja a 10% | ~$13.456 | 3.856 | Aún menos de un concierto tipo |
| Reparto 50/50 con el promotor | ~$5.350 | 9.698 | ~1,28 eventos tipo. Sigue vivo, con poco colchón |

> **La lección: el inductor n.º 1 no es el aforo, es cuánto del cargo conservamos.**

**Capital inicial antes del primer ingreso (T0).** T0 dura 4–6 meses sin ventas:
autorización de operador, producto y operación inicial. Esto no es el flotante de las
boletas.

| Componente | Rango | Cómo sale |
|---|---:|---|
| Costos fijos de T0 | $208 – $311 M | 4 a 6 meses × $51,9 M |
| Habilitación inicial | $26 – $52 M | Desarrollo externo, seguridad, asesoría, autorización |
| Reserva de liquidez | $84 – $167 M | 5–10% de los $1.672 M de terceros en un evento tipo |
| **Total** | **$317 – $530 M** | El dinero recaudado para promotor y Estado no financia TicketRight: debe permanecer segregado |

Recuperar ese capital toma del orden de un trimestre de operación en verde al ritmo de T1,
o varios años si hay que compartir el cargo por servicio.

**Proyección año 1 (escenario agresivo `[S]`, no un presupuesto aprobado):** T0 de 4–6 meses
sin ingresos · de 2 a 10 promotores activos (T1→T4) · ~69 eventos pagos y ~524.400 boletas
en el año · resultado antes de impuestos e inversión ≈ $8.473 M, alto porque aún faltan
costos abiertos.

**¿Es viable?** Sí, en el modelo operativo actual: el escenario base supera el equilibrio
desde T1. Con cargo 50/50 también puede serlo (~2 eventos tipo/mes), con menos margen. Con
cuatro advertencias: no cubre inversión inicial, impuestos ni contingencias (R1–R7) · la
sensibilidad n.º 1 es el % del cargo que conservamos · la n.º 2 es conseguir eventos de
forma recurrente · hay que crecer con contratos reales, no solo con la proyección.

**Riesgos que se muestran en pantalla:** R1 IVA del cargo / pasarela (puede subir el
equilibrio de 2.990 a 4.268 boletas) · R2 plazos y reserva de liquidez (no cambia el
equilibrio, sí el capital) · R3 nómina / SMMLV (±5% mueve el equilibrio a ~2.868–3.113) ·
R6 cancelación de evento (exposición hasta $1.854 M si ya se giró el recaudo).

## 05 · OKR del año 1

Cuatro objetivos. Cada KR se muestra con **línea base → meta → horizonte**, y cada objetivo
dice con qué parte del caso se amarra.

### OKR 01 · Confianza del promotor

> Convertir la confianza en la razón por la que los promotores eligen y mantienen TicketRight.

*Por qué:* sin inventario no hay negocio. *Amarra con:* el dolor del promotor y el canal B2B
del canvas.

| KR | Línea base | Meta | Horizonte |
|---|---|---|---|
| Autorización de operador — resolución para vender en línea; sin esto no empieza T1 | 0 | Resolución vigente | T0.6 |
| Primeros contratos — promotores que contraten y operen al menos un evento pago | 0 | 2 promotores | T1 |
| Base activa — activo = operó al menos un evento pago en los últimos 90 días | 0 | 10 activos | T4 |
| Repetición — segundo evento dentro de los 180 días siguientes al primero | Cohorte de T1 | ≥ 80% | Desde T3 |

### OKR 02 · Confianza del fan

> Hacer de cada compra de alta demanda una experiencia en la que el fan pueda confiar y que
> quiera recomendar.

*Por qué:* si el invariante dinero–boleta falla en el pico, la tesis del producto se cae
aunque el canvas se vea bien.

| KR | Línea base | Meta | Horizonte |
|---|---|---|---|
| Errores dinero–boleta — reclamos procedentes sobre ventas completadas | Se establece en T1 | ≤ 0,1% | Desde T2 |
| Conversión en el pico — completan la compra sin error en la ventana de mayor demanda | Se establece en T1 | ≥ 98% | Desde T2 |
| Satisfacción poscompra | Se establece en T1 | ≥ 4,2 / 5 | Desde T2 |

### OKR 03 · Rentabilidad por evento

> Hacer de cada evento vendido una operación rentable que financie el crecimiento sin usar
> el flotante de terceros.

*Por qué:* un negocio que «vende mucho» pero mezcla la plata del promotor con la propia no
es viable: es frágil y riesgoso.

| KR | Línea base | Meta | Horizonte |
|---|---|---|---|
| Punto de equilibrio mensual operativo | T0 sin ingresos | Equilibrio ≥ 0 | T1 |
| Resultado estable antes de impuestos e inversión | N/A en T0 | 3 meses consecutivos ≥ 0 | T2 |
| Contribución por boleta después de costos variables | Modelo: $17.350 | ≥ $10.000 | Trimestral desde T2 |
| Profundidad por promotor — eventos pagos por promotor activo | 1 evento / promotor en T1 | 1,5 eventos | T4 |
| Custodia del flotante — recursos de terceros con saldos segregados y conciliados. **Binario** | Diseño de cuentas en T0 | 100% diario | Desde el primer evento |

### OKR 04 · Servicios complementarios

> Convertir la reventa autorizada y la información consentida en servicios que fortalezcan
> al promotor y generen crecimiento responsable.

*Por qué:* la reventa y los datos son la diferenciación económica. Si nadie los adopta, el
caso se queda solo en el cargo por servicio.

| KR | Línea base | Meta | Horizonte |
|---|---|---|---|
| Tasa de reventa dentro de TicketRight | 0% en plataforma | ≥ 8% | T4 |
| Adopción por promotor — habilita reventa en uno o más eventos | 0% | ≥ 70% | T4 |
| Paquete de datos — eventos pagos que lo contratan | 0% | ≥ 50% | T4 |
| Ingreso secundario mensual (10 eventos tipo con 8% de reventa + 5 paquetes) | $0 | ≥ $87 M / mes | T4 |

**Cómo se siguen:** revisión mensual; indicadores de experiencia por evento y consolidación
trimestral · KR progresivos en escala 0,0–1,0, con **0,7 como zona de éxito esperada**
(láminas 49–51) · el KR de custodia y las obligaciones legales son binarios: no se compensan
con otro KR.

## 06 · Trazabilidad

> **El caso se sostiene porque cada pieza empuja a la siguiente.**
> La rúbrica premia trazabilidad: supuesto → segmento → valor → canal → ingreso → costo → OKR.

| De | A | Cómo |
|---|---|---|
| Premisa / oportunidad | Problema | Mercado grande `[V]` + fallas de confianza + obligaciones legales → hay un problema real que pagar |
| Problema | Alcance | El dolor es la desincronización dinero–boleta; el alcance cubre el ciclo digital y se corta antes de la puerta |
| Alcance | Canvas | Cliente = promotor; valor = confianza; ingreso = cargo por boleta; costos = conciliar y custodiar |
| Canvas | Números | El evento tipo de 8.000 puestos cuantifica el cargo, la pasarela y el equilibrio (2.990) |
| Números | OKR | La viabilidad en papel se convierte en metas de adopción, calidad y margen del año 1 |

**Tres cadenas cerradas:**

1. **S1 → equilibrio → OKR 3.** Si conservamos el 12%, cada boleta deja ~$17.350 y el mes se
   cubre con ~2.990. El OKR 3 mide que eso ocurra de verdad y sin usar el flotante.
2. **Problema → valor → OKR 2.** El dolor es dinero ≠ boleta; la propuesta es el invariante;
   el OKR 2 mide errores ≤ 0,1%, conversión en el pico y satisfacción.
3. **S5 → reventa → OKR 4.** El 8% de reventa no se da por sentado: el OKR 4 mide adopción y
   aporte económico.

**Lo que queda abierto, dicho en la presentación:** validar contractualmente si el cargo se
conserva completo o se reparte (S1) · cerrar el tratamiento tributario del cargo y del IVA de
pasarela (S7 / R1) · conseguir inventario real, porque sin promotores no hay modelo
(S3 / OKR 1).

## 07 · Cierre

> **TicketRight crece solo si obtiene inventario, protege la compra y conserva valor en cada
> venta.**

- Cliente contractual: promotor. Usuario y pagador del cargo: fan. Alcance: ciclo digital
  hasta antes de la puerta.
- Tesis: no romper nunca la correspondencia entre dinero cobrado y derecho de entrada.
- Modelo viable con cargo completo (~2.990 boletas/mes); con 50/50 sigue vivo, con menos
  colchón.
- Los OKR miden confianza, margen y adopción con key results (base → meta → horizonte).
- Lo abierto: reparto del cargo, IVA y conseguir inventario real.

**Y la pregunta con la que termina —que es exactamente la puerta de la Entrega 2:**

> ### ¿Qué decisiones arquitectónicas se justifican a partir de este modelo de negocio?
