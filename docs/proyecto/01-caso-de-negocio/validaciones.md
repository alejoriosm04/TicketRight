# Validaciones del caso de negocio

**Fecha de la investigación:** 7 de septiembre de 2026
**Método:** fuentes públicas verificables. Todo lo que no se pudo verificar así queda
marcado como no disponible, no como tarea pendiente.

> Cada afirmación va marcada `[V]` con fuente y fecha, `[S]` sin validar, o `PENDIENTE`
> cuando hay una ruta concreta para cerrarla. **La fecha de la fuente importa**: donde el
> dato tiene tres años se dice, porque el evaluador lo va a preguntar.

---

## Los cuatro hallazgos que cambian el proyecto

**1. Existe una contribución parafiscal del 10% sobre la boletería, y es ley.** `[V]`
La Ley 1493 de 2011 creó una contribución parafiscal cultural del **10% del valor de la
boleta**, para boletas cuyo precio individual sea **igual o superior a 3 UVT**, que el
productor debe recaudar y declarar.

No es un detalle jurídico: **es una línea de la estructura de costos que no habíamos
contemplado**, cambia el precio final que ve el fan, y es un flujo de dinero más que el
sistema debe liquidar sin equivocarse. Refuerza la tesis del proyecto —la boleta es plata de
**tres** bolsillos: el promotor, nosotros y el Estado—.

**2. El líder del mercado está formalmente imputado por la SIC, en junio de 2026.** `[V]`
Nueve expedientes de quejas acumulados, cinco cargos, entre ellos cláusulas abusivas y
fallas en devoluciones. **Es la validación de la premisa central del caso de negocio, y es
pública.** Detalle en la validación 5.

**3. La devolución masiva no es un escenario que nos inventamos: es una obligación
legal.** `[V]` Cuando un evento se cancela o se modifica, el operador debe informar a la SIC
el mecanismo de devolución **dentro de los tres días hábiles siguientes**; y el derecho de
retracto del artículo 47 de la Ley 1480 de 2011 da al comprador **cinco días hábiles** para
deshacer la compra en ventas a distancia.

Esto convierte el «momento estrella 5» de nuestra demo —se cancela el evento y hay que
devolver miles de pagos— de una idea buena a **un requisito con plazo legal**. Y el derecho
de retracto es una operación más que el sistema debe soportar sin romper el vínculo
dinero–boleta.

**4. Para fútbol profesional, la boleta nominal ya es obligatoria.** `[V]` El Decreto 1622
de 2022 exige boleta digital asociada al documento de identidad del comprador, que el
comercializador guarde esa asociación, y que el estadio tenga control de acceso electrónico
que valide documento y QR.

Nuestro diferenciador va **en la dirección hacia la que ya se movió la regulación**. Y el
decreto describe casi literalmente la frontera que declaramos con la lámina 53: nosotros
asociamos la boleta a la identidad, el sistema del estadio valida en la puerta. La frontera
que dibujamos por criterio arquitectónico es la misma que dibuja la norma.

**Ojo con el alcance:** el Decreto 1622 aplica a **fútbol profesional**, no a conciertos. Es
precedente y un segundo segmento posible, no una obligación para nuestro cliente primario.
La prensa lo ha reportado como si aplicara a todo espectáculo, y no es así.

---

## Validación 1 — Tamaño del mercado

**Estado: `[V]` en lo grueso. Falta un corte que está disponible en línea.**

`[V]` **Existe un registro oficial y obligatorio de todos los espectáculos públicos de artes
escénicas en Colombia: el PULEP** (Portal Único de Espectáculos Públicos de las Artes
Escénicas), del Ministerio de las Culturas, creado por la Ley 1493 de 2011. Productores y
operadores de boletería deben registrarse, y **cada evento recibe un código PULEP único**.
Fuente: [PULEP – Ministerio de Cultura](https://pulep.mincultura.gov.co/Paginas/ley1493.aspx).

`[V]` **Eventos registrados en 2023, por ciudad:** Bogotá 5.419 · Medellín 3.277 · Cali
1.597 · Cúcuta 976 · Barranquilla 574. El sector **creció 22% en 2023**.
Fuente: Anuario PULEP, reportado por
[Ámbito Jurídico](https://www.ambitojuridico.com/noticias/general/educacion-y-cultura/eventos-de-artes-escenicas-en-colombia-crecieron-un-22-en-2023).

`[V]` **La boletería estimada pasó de COP $310 mil millones en 2018 a COP $1,53 billones en
2023.** Misma fuente. Un mercado que se quintuplicó en cinco años: ese es el número que abre
el caso de negocio.

`PENDIENTE` **El corte por aforo —eventos de 3.000 a 40.000 asistentes— no está en el
resumen de prensa, pero es consultable en línea:** el PULEP publica informes públicos en
[pulepapp.mincultura.gov.co/Informespublicos/eventos](https://pulepapp.mincultura.gov.co/Informespublicos/eventos)
y los anuarios completos en `pulep.mincultura.gov.co/avances/`. Media hora de trabajo.

**Lo que ya se puede afirmar:** el mercado existe, creció fuerte, está concentrado en Bogotá
y Medellín, y **hay un registro público del que sale el universo exacto de clientes
potenciales**. Para un caso de negocio eso vale más que una cifra de mercado global.

---

## Validación 2 — Comisión del mercado y quién opera

**Estado: `[V]`, con la advertencia de que la cifra es de 2023.**

`[V]` **El cargo por servicio en Colombia está entre el 10% y el 15% del valor de la
boleta.** Lo dice Jorge Ríos, gerente de Tuboleta, y cubre licencias de funcionamiento del
sistema, costos de operación y servicio de venta y posventa.
Fuente: [El Tiempo, 12 de octubre de 2023](https://www.eltiempo.com/economia/finanzas-personales/que-le-cobran-en-el-cargo-por-servicio-cuando-compra-una-boleta-en-colombia-815191).

`[V]` **Quién opera en Colombia:** **Tuboleta** —operado por **Ticket Fast S.A.S.**— es el
líder del mercado. **Ticketmaster Colombia**
([ticketmaster.co](https://www.ticketmaster.co/page/terminos-condiciones)) opera en el país.
**Colboletos** aparece en el mismo artículo por un caso histórico de sanción.

`[V]` **Los operadores de boletería también deben registrarse en el PULEP**, con perfil de
«operador vendedor de boletería». Es un requisito de entrada al mercado.

**No disponible públicamente:** cómo se reparte ese 10-15% entre operador y promotor. Es
información contractual privada. **Para el caso de negocio se modela con el rango completo
y se marca `[S]`** — no se inventa un reparto.

> **Quinnie:** el precio final que paga el fan es *boleta + cargo por servicio (10-15%) +
> parafiscal (10% si la boleta es ≥ 3 UVT)*. Mostrar los tres pedazos desglosados en el
> bloque 5 es exactamente el nivel de concreción que pide la lámina 56.

---

## Validación 3 — Reventa

**Estado: el marco legal quedó `[V]`. La fracción del mercado no es información pública.**

`[V]` **En Colombia la legalidad de la reventa está sin definir.** El Código Penal (Ley 599
de 2000) permite sancionar con multa y prisión la reventa no autorizada, pero **la
aplicación es inconsistente y rara vez se persigue al revendedor**.
Fuente: [El Tiempo, 22 de octubre de 2023](https://www.eltiempo.com/economia/es-legal-en-colombia-la-reventa-de-boletas-para-espectaculos-818538).

**Esto es una buena noticia para el negocio y hay que decirlo así:** no competimos contra
una prohibición que ya funciona. El vacío de aplicación es exactamente el espacio donde cabe
un mercado secundario formal, trazable y con la boleta atada a una identidad.

`[V]` **Un punto de referencia de sobreprecio:** las boletas de Colombia vs. Portugal para
el Mundial 2026 se revendieron con un alza **superior al 500%** sobre el valor nominal.
Fuente: [El Tiempo, 2026](https://www.eltiempo.com/deportes/futbol-internacional/se-disparo-el-precio-de-reventa-de-las-boletas-para-colombia-vs-portugal-en-el-mundial-2026-el-valor-subio-mas-del-500-por-ciento-3515349).

`[S]` **Ese dato no es representativo de nuestro segmento.** Un partido de mundial es el
evento más extremo posible; usarlo como supuesto para un concierto de 8.000 personas sería
el estiramiento que la lámina 56 advierte. **Sirve como cota superior y como ilustración del
dolor, no como parámetro del modelo.**

**No disponible públicamente:** qué fracción de las boletas termina en reventa en Colombia.
No hay cifra oficial ni estudio publicado. **El caso de negocio no depende de ese número**:
la fuente de ingreso por reventa se dimensiona como escenario con rango marcado `[S]`.

---

## Validación 4 — Aforo y datos personales

**Estado: `[V]`, y es la que más material aportó.**

### Aforo y evento masivo

`[V]` **Contribución parafiscal del 10%** sobre boletas de 3 UVT o más (Ley 1493 de 2011),
recaudada por el productor y declarada en los plazos del IVA (productores permanentes) o
dentro de los 5 días hábiles siguientes al evento (ocasionales). Los recursos se destinan a
infraestructura de artes escénicas.
Fuentes: [Ley 1493 de 2011 – Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=45246) ·
[Secretaría de Cultura de Bogotá](https://www.culturarecreacionydeporte.gov.co/es/arte-cultura-y-patrimonio/fortalecimiento-infraestructura-cultural/contribucion-parafiscal).

`[V]` **Todo espectáculo público de artes escénicas necesita código PULEP**, y el permiso se
tramita ante la alcaldía.

`[V]` La normativa de eventos exige **certificación de seguridad expedida por bomberos** para
el escenario, y personal de logística acreditado en control de eventos masivos, planes de
evacuación y primeros auxilios. **La sobreocupación no está permitida en ningún caso.**
Fuente: [Bogotá.gov.co](https://bogota.gov.co/mi-ciudad/cultura-recreacion-y-deporte/proceso-para-pedir-permisos-de-organizacion-de-eventos-en-bogota).

`[S]` **Marco de eventos de afluencia masiva:** Decreto 3888 de 2007 (Plan Nacional de
Emergencia y Contingencia para eventos de afluencia masiva de público) y Ley 1575 de 2012
(bomberos). *El sitio de Función Pública falló al intentar abrir el texto del decreto, así
que queda `[S]` hasta leerlo.* `PENDIENTE: leer el Decreto 3888 y confirmar qué obligación
concreta impone sobre el aforo.`

> **Esto confirma el atributo de calidad tal como lo escribimos:** el aforo no es una regla
> de negocio, es un límite con respaldo normativo y responsabilidad del organizador. Una
> boleta de más no es un error contable.

### Datos personales en boleta nominal

`[V]` **Aplica la Ley Estatutaria 1581 de 2012** (habeas data). Lo que nos obliga:

- **Autorización previa, expresa e informada** del titular antes de tratar sus datos.
- Distinción entre **Responsable** (quien decide para qué se usan los datos) y **Encargado**
  (quien los trata por cuenta del Responsable).
- Si los datos se entregan a un tercero, hay que **informar al titular y pedir autorización
  antes**.
- Vigila la **Superintendencia de Industria y Comercio**, que puede multar hasta **2.000
  SMMLV**, con multas sucesivas mientras dure el incumplimiento, y **suspender el tratamiento
  hasta por 6 meses**.

Fuentes: [Ley 1581 de 2012 – Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981) ·
[Compendio SIC](https://www.sic.gov.co/sites/default/files/files/Nuestra_Entidad/Publicaciones/Compendio%202%20FINAL%20V%2012%20Dic20.pdf).

> **Aquí aparece una decisión de arquitectura que no habíamos visto.** Una de nuestras
> fuentes de ingreso es **devolverle al promotor los datos del comprador**. Bajo la Ley 1581
> eso no es un *export* de una tabla: es una transferencia a un tercero que exige
> autorización previa del titular, y obliga a definir **quién es Responsable y quién es
> Encargado** —¿el promotor es Responsable y nosotros Encargado, o somos corresponsables?—.
>
> Condiciona el modelo de datos, el aislamiento entre tenants y qué se puede mostrar en el
> panel del promotor. **Queda como AD-004.** En la sustentación es oro: una restricción legal
> que se traduce en decisión de arquitectura.

### Comercio electrónico y devoluciones

`[V]` **Derecho de retracto, artículo 47 de la Ley 1480 de 2011** (Estatuto del Consumidor):
en ventas a distancia el consumidor tiene **cinco días hábiles** para retractarse, y el
vendedor debe **informar en el medio electrónico** que ese derecho existe y cómo ejercerlo.
Al ejercerlo se resuelve el contrato y **hay que reintegrar el dinero**.
Fuentes: [Ley 1480 de 2011 – Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306) ·
[Ámbito Jurídico](https://www.ambitojuridico.com/noticias/blog-juridico/precisiones-sobre-el-derecho-de-retracto).

`[V]` **Ante cancelación o modificación de un evento**, el operador debe informar a la SIC el
mecanismo de devolución **dentro de los tres días hábiles siguientes** (ver validación 5).

> **Dos operaciones más que el sistema tiene que sostener sin romper el vínculo
> dinero–boleta**, y las dos con plazo legal. La devolución masiva deja de ser un escenario
> elegante de la demo y pasa a ser un requisito.

### Precedente: Decreto 1622 de 2022

`[V]` Para **eventos de fútbol profesional**: boleta digital asociada al documento de
identidad, el comercializador debe guardar esa asociación, el estadio debe tener control de
acceso electrónico que valide documento y QR, y existe un Sistema Nacional de Validación.
Fuentes: [Decreto 1622 de 2022 – Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=192812) ·
[El País](https://www.elpais.com.co/colombia/se-exigira-cedula-para-comprar-boletas-e-ingresar-a-los-estadios-en.html).

---

## Validación 5 — ¿Está el mercado insatisfecho con lo que existe hoy?

**Estado: `[V]`. Y con la mejor fuente posible: el regulador.**

Esta es la premisa central del caso de negocio. **Está documentada públicamente y por una
autoridad**, así que no depende de nuestra opinión ni de la de un tercero.

`[V]` **El 4 de junio de 2026, la Superintendencia de Industria y Comercio formuló pliego de
cargos contra Ticket Fast S.A.S., operador de TuBoleta**, mediante la **Resolución 38063 de
2026**, tras acumular **nueve expedientes** de quejas ciudadanas por venta de boletería para
conciertos, partidos de fútbol y eventos públicos.

**Los cinco cargos imputados:**

| # | Cargo | Por qué nos importa |
|---|---|---|
| 1 | **Incumplimientos al deber de información** — omitió municipio del evento, datos del promotor, horarios definitivos y canales de venta habilitados | Es información que el sistema debería exponer por diseño, no por diligencia manual |
| 2 | **No notificar el mecanismo de devolución** a la SIC dentro de los tres días hábiles tras cancelaciones | **La devolución masiva tiene plazo legal.** Valida el escenario de la demo |
| 3 | **Cláusulas abusivas** — se eximía de responsabilidad trasladándola al promotor, y vendía «Asistencia TuBoleta» como no reembolsable si el evento se cancelaba | **Este es el hueco exacto que llena nuestra propuesta de valor.** El líder del mercado se protege a sí mismo trasladándole el riesgo al promotor: nuestro cliente |
| 4 | **Incumplimiento de las reglas de comercio electrónico** — falló en garantizar el derecho de retracto y los canales de PQR | Retracto y disputas son operaciones del sistema, no del área de servicio al cliente |
| 5 | **Desatender órdenes de la autoridad** sobre eventos específicos | |

Fuentes: [Comunicado oficial de la SIC](https://sedeelectronica.sic.gov.co/comunicado/la-sic-del-cambio-formula-pliego-de-cargos-tuboleta-por-presuntas-fallas-en-el-deber-de-informacion-las-clausulas-abusivas-y-las-reglas) ·
[El Tiempo](https://www.eltiempo.com/amp/economia/empresas/sic-formula-cargos-a-tuboleta-por-presuntas-fallas-en-informacion-comercio-electronico-y-devoluciones-3562032) ·
[El País](https://www.elpais.com.co/economia/sic-formula-cargos-a-tuboleta-por-presuntas-fallas-en-ventas-de-boleteria-devoluciones-y-comercio-electronico-0415.html) ·
[El Colombiano](https://www.elcolombiano.com/negocios/sic-cargos-tuboleta-fallas-boletas-consumidores-eventos-masivos-DC37355446).

`[V]` **Y hay evidencia pública de que el sistema se cae en el pico:** en la preventa del
concierto de Harry Styles en Bogotá se reportaron fallas simultáneas de Tuboleta y del banco
que procesaba los pagos.
Fuente: [Pulzo](https://www.pulzo.com/tecnologia/banco-bogota-tuboleta-caidos-preventa-boletas-harry-styles-PP1160553).
También se documentaron reclamos masivos de usuarios en la venta de boletas de la Selección
Colombia. Fuente: [Pulzo](https://www.pulzo.com/deportes/tuboleta-problema-boletas-ver-seleccion-colombia-compra-eliminatorias-PP3837550).

> **Cómo se usa esto en la sustentación.** La premisa del caso de negocio ya no es «creemos
> que los promotores están insatisfechos». Es: *el líder del mercado colombiano está
> formalmente imputado por el regulador —nueve expedientes, cinco cargos, junio de 2026— y
> uno de los cargos es precisamente trasladarle el riesgo al promotor mediante una cláusula
> abusiva.* Eso es `[V]`, es de este año, y es el argumento más fuerte del documento.
>
> No es una impresión ni un testimonio: es un acto administrativo público y consultable.

**Precisión obligatoria en el documento:** es un **pliego de cargos**, es decir, una
imputación en una investigación en curso. **No es una condena.** Hay que escribirlo así o el
dato se vuelve atacable en la sustentación.

---

## Qué queda abierto

| # | Pendiente | Cómo se cierra |
|---|---|---|
| 1 | Conteo de eventos por rango de aforo | Portal de informes públicos del PULEP · 30 min |
| 2 | Texto del Decreto 3888 de 2007 sobre aforo | Leerlo; el sitio de Función Pública falló hoy |
| 3 | Responsable vs. Encargado bajo la Ley 1581 | **ADR AD-004**, antes de la Entrega 2 |

**No disponible públicamente, y el caso de negocio no depende de ello:** el reparto del
cargo por servicio entre operador y promotor, y la fracción de boletas que termina en
reventa. Ambos se modelan como escenario con rango marcado `[S]`.
