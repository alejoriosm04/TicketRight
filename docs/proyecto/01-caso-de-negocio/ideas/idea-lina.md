# Idea: TicketRight — venta de boletería para eventos de alta demanda

**Autora original:** Lina · **Refinada en equipo:** 2026-09-07
**Estado:** ✅ **Idea elegida para el proyecto integrador**
**Marca:** *TicketRight* — nombre definitivo de la entrega del 12 de septiembre.
El nombre de trabajo hasta el 10 de septiembre fue *Puesto*; ver [La marca](#la-marca).

> Todo dato de mercado va marcado `[S]` (supuesto sin validar) o `[V]` (verificado con
> fuente), según la regla del repo y la lámina 56.

---

## La tesis que nos separa del montón

Boletería de alta demanda es un caso conocido, y hay que asumir que **otro grupo va a
llegar con algo parecido**. Casi con seguridad va a llegar con esto: sala de espera, cola
virtual, reserva con tiempo límite, «no sobreventa» y un bloque de anti-bots.

Todo eso lo vamos a tener. Pero **no es de ahí de donde sale la nota**, porque es de donde
lo va a sacar todo el mundo.

Nuestra tesis es otra:

> **La boleta no es un registro en una tabla: es plata.** El problema difícil no es que no
> se vendan dos veces las mismas 5.000 sillas —eso se resuelve con un candado y ya—. El
> problema difícil es **no romper nunca la correspondencia entre el dinero y el derecho a
> entrar**, y hacerlo mientras un tercero que no controlamos —la pasarela de pagos— se
> demora, responde tarde, responde dos veces o cobra después de que nos rendimos.

De ahí se desprenden cinco decisiones que nos diferencian, y están desarrolladas más
abajo:

| # | Lo que trae el grupo promedio | Lo que traemos nosotros |
|---|---|---|
| 1 | «No sobreventa» como invariante | **«Ni un peso cobrado sin boleta, ni una boleta sin peso cobrado.»** El invariante es monetario y cruza un sistema de terceros |
| 2 | La fila como plomería | **La fila como producto.** Quién entra primero es una decisión de negocio con consecuencias en ingreso, equidad y reventa |
| 3 | Un solo modelo de consistencia | **Dos.** Silla numerada y localidad general son recursos distintos y exigen garantías opuestas, en el mismo sistema |
| 4 | La reventa como fraude a bloquear | **La reventa como la segunda mitad del negocio**, capturable solo si la arquitectura lo permite |
| 5 | «Escala» como atributo | **El costo por boleta vendida** como atributo de calidad medible, con meta |

Y una decisión de alcance que también nos separa: **no vamos a construir el control de
acceso en la puerta.** Ese es el caso de la lámina 53 del profesor, es un sistema distinto
con dueño distinto, y nos integramos con él por contrato. Saber dónde termina nuestro
sistema es parte de la respuesta, no una limitación.

---

## En una frase

> «Ayudamos a **los promotores de eventos de alta demanda** a **vender todo el aforo en
> minutos sin caerse, sin sobrevender y sin regalarle el margen a la reventa** mediante
> **una plataforma que trata cada boleta como dinero y hace de la fila una decisión del
> negocio.**»

## El problema

1. **La demanda llega toda en el mismo minuto.** Un concierto que agota en diez minutos
   concentra en ese lapso más carga que la que el sistema ve en todo el mes. El pico no es
   grande: es **puntual, predecible y brutal**.
2. **Cuando el sistema se cae, se cae en público.** No es una degradación silenciosa: son
   miles de personas frustradas al tiempo, en redes sociales, con nombre propio. El daño
   reputacional supera con creces la venta perdida.
3. **La plata y la boleta se desincronizan.** La pasarela de pagos se demora, responde
   tarde o responde dos veces. Del otro lado quedan dos fallas, y la segunda es peor que la
   primera: *boleta sin cobro* (pérdida) y **cobro sin boleta** (le quitamos la plata a
   alguien y no le dimos nada). Lo segundo es la queja que hunde a una boletera.
4. **La reventa se lleva el margen y el fan paga el costo.** El revendedor compra en el
   minuto uno y revende con sobreprecio. El promotor no ve un peso de esa diferencia, el
   fan paga de más, y una parte de las boletas revendidas por fuera **son falsas o están
   duplicadas**. `[S] Verificar magnitud en el mercado colombiano.`
5. **Nadie sabe por qué no alcanzó a comprar.** «Se me cayó», «me sacó la fila», «me dijo
   que había y luego que no». Sin trazabilidad, toda disputa se resuelve por quién grita
   más duro.
6. **Y el sistema está quieto el 99% del tiempo.** Sostener capacidad para el pico todo el
   mes es quemar plata; no sostenerla es caerse el día que importa.

`[S]` **Supuesto crítico:** hay suficientes eventos de alta demanda al año en Colombia como
para sostener el negocio, y los promotores están insatisfechos con lo que usan hoy. *Es la
validación nº 1. Se resuelve con la programación pública de escenarios y hablando con un
promotor o un escenario.*

## Quién lo padece

| Actor | Su dolor | ¿Paga? |
|---|---|---|
| **Promotor / productora** | Un evento agotado que se vendió mal le cuesta reputación con el artista, y la reventa se lleva un margen que era suyo | **Sí. Es el cliente que firma** |
| **Escenario / recinto** | Responde por el aforo ante la autoridad. Una boleta de más es un problema legal, no comercial | **Sí, versión recinto** |
| **Fan** | Paga comisión, hace la fila, y aun así compite contra bots y revendedores | **Sí, la comisión de servicio** |
| **Artista y su equipo** | Quieren que las boletas lleguen a fans reales, no a revendedores | No directamente. Pero **es quien exige** |
| **Revendedor profesional** | Ninguno. Hoy gana | No. Y es a quien le quitamos el negocio |

**El segmento con el que se arranca:** promotores de eventos medianos y grandes en Colombia
—entre 3.000 y 40.000 asistentes— que hoy venden por plataformas que se les caen o que no
les devuelven datos del comprador. No «cualquier evento».

`[S]` Número de eventos de ese tamaño al año, aforo promedio, comisión de mercado y precio
promedio de boleta: **sin verificar.** *Fuentes candidatas: programación pública de
escenarios, promotoras, gremio. Responsable: por asignar.*

## La solución propuesta

El flujo de la propuesta original, que se conserva:

```
01 SALA DE      →  02 VALIDACIÓN   →  03 SELECCIÓN   →  04 RESERVA     →  05 PAGO
   ESPERA          El sistema         El usuario        La boleta se      El usuario
   El usuario      valida su          escoge la         retiene por       paga
   entra y toma    acceso y su        boleta            tiempo limitado
   turno           turno              disponible

                                   →  06 CONFIRMACIÓN →  07 EMISIÓN
                                      Se confirma la     Se emite la
                                      compra             boleta digital
                                                         nominal
```

Y lo que le agregamos, que es donde vive la diferencia:

- **La boleta es nominal desde el paso 07.** No es un PDF con un código: está atada a una
  identidad, y cambiar de dueño es una operación del sistema, no un reenvío de WhatsApp.
- **La fila del paso 01 tiene una política publicada antes de la venta**, y el sistema puede
  demostrar después que la respetó.
- **El paso 05 asume que la pasarela va a fallar**, y el sistema cierra solo las
  discrepancias.
- **Después del 07 hay una vida:** transferir, revender dentro de la plataforma, devolver si
  el evento se cancela. Ahí está la segunda mitad del negocio.

## Por qué alguien pagaría

| # | Fuente | Por qué funciona |
|---|---|---|
| 1 | **Comisión de servicio por boleta** | El estándar de la industria. Es la base, no el diferencial |
| 2 | **Comisión por reventa dentro de la plataforma** | **El diferencial.** Hoy ese margen se lo lleva el revendedor por fuera. Nosotros lo capturamos y lo compartimos con el promotor, y de paso el fan compra sin miedo a una boleta falsa |
| 3 | **Plataforma para el promotor (multi-tenant)** | Cada promotor es un tenant: sus eventos, sus reglas de fila, sus datos de comprador |
| 4 | **Datos del evento** | Quién compró, desde dónde, en qué momento. Es lo que el promotor no tiene hoy y necesita para la próxima gira |
| 5 | **Preventa segmentada** como producto | Fan club, tarjeta aliada, suscriptores. Es una política de fila vendida como servicio |

**Por qué el promotor cambia:** porque hoy está eligiendo entre plataformas que se le caen
en el minuto uno y plataformas que funcionan pero no le devuelven ni los datos ni el margen
de reventa. Le estamos vendiendo **quedarse con las dos cosas.**

`[S]` **Sin verificar:** comisión de servicio de mercado, disposición del promotor a
cambiar de plataforma, y qué fracción de las boletas se revende hoy. *De esas tres cifras
sale el modelo.*

## Competencia o sustitutos

| Quién | Qué hace hoy | Por qué no resuelve esto |
|---|---|---|
| **Boleteras establecidas** | Venden, y en general funcionan | `[S] Verificar cuáles operan en Colombia y con qué comisión.` Es la objeción principal. Nuestro ángulo no es «vendemos mejor»: es la reventa capturada y los datos devueltos al promotor |
| **Plataformas de reventa** | Mercado secundario aparte | Le quitan margen al promotor y no garantizan que la boleta sea real |
| **Venta directa del escenario** | Taquilla propia | Se cae con la demanda, y no tiene fila ni anti-bot |
| **Grupos de WhatsApp y redes** | La reventa informal | Es donde ocurre el fraude. Y hoy va ganando |

---

## Por qué sirve para *este* curso

### La integración vertical, en el formato del profesor (lámina 41)

| Estrategia | Capacidad | Proceso | Aplicaciones | Tecnología |
|---|---|---|---|---|
| Ser donde el fan compra sin miedo y el promotor no pierde el margen | Venta de aforo bajo demanda concentrada, con custodia del vínculo dinero–boleta | Encolar → asignar turno → reservar → cobrar → emitir → transferir/revender → liquidar | Sala de espera, motor de inventario, orquestador de pago, emisor de boletas, mercado secundario, conciliación | Cómputo elástico, cola de turnos, bus de eventos con *replay*, almacenamiento transaccional |

### Qué la vuelve técnicamente interesante

1. **El aforo es un límite legal y físico, no una regla de negocio.** Una boleta de más no
   es un error contable: es una persona que llegó al estadio y no cabe. Nadie puede
   relajarlo en una reunión.
2. **La ráfaga es puntual, predecible y de dos órdenes de magnitud.** Sabemos el día y la
   hora exactos. Eso convierte la elasticidad en una decisión planificable y costeable, no
   en un problema de capacidad genérico.
3. **La transacción cruza un sistema que no controlamos.** La pasarela es lenta, a veces
   responde tarde y a veces responde dos veces. No hay transacción distribuida posible: hay
   que diseñar para la inconsistencia temporal y para cerrarla sola.
4. **Hay dos tipos de inventario con garantías opuestas.** Una silla numerada es un recurso
   único e irrepetible. Una localidad general es un contador. Exigen consistencia distinta
   **en el mismo sistema y en la misma venta**.
5. **La boleta tiene una vida después de la venta.** Se transfiere, se revende, se anula, se
   devuelve. Y nunca puede existir en dos manos al tiempo.
6. **Hay una ráfaga inversa que nadie modela:** el evento se cancela y hay que devolver
   miles de pagos al tiempo.

### Atributos de calidad que exigiría

Al nivel de detalle de los casos del profesor (láminas 53 y 54):

| Atributo | Enunciado |
|---|---|
| **Correspondencia dinero–boleta** | En todo momento existe boleta emitida **si y solo si** hay cobro capturado. Una discrepancia no se resuelve manualmente al día siguiente: el sistema la detecta y la cierra sola dentro de un plazo declarado. **Un cobro sin boleta es una falla crítica, no un caso de soporte** |
| **Aforo no excedido** | El número de boletas emitidas por localidad nunca supera el aforo autorizado, incluso durante fallas, reintentos, reprocesos y despliegues. Excederlo una sola vez es falla crítica: hay implicación legal y de seguridad física |
| **Unicidad de la boleta en el tiempo** | Una boleta pertenece a exactamente una identidad en cada instante de su vida —emisión, transferencia, reventa, anulación—. Dos personas con derecho sobre la misma boleta es una falla crítica |
| **Equidad declarada de la fila** | El orden de atención responde a una política **publicada antes de abrir la venta**, y el sistema puede demostrar después que la respetó. Perder el puesto por un reintento o por un despliegue es una falla, no mala suerte |
| **Retención acotada del inventario** | Una reserva no pagada libera la boleta dentro del plazo declarado, aunque el usuario cierre el navegador, pierda la red o el sistema se reinicie. El inventario nunca queda retenido por un cliente que ya no existe |
| **Degradación con prioridad** | Bajo saturación se degrada primero la exploración del catálogo y **de último el cierre de compra de quien ya está pagando**. Nunca se sacrifica una transacción en curso para atender una nueva |
| **Costo por boleta vendida** | El sistema absorbe el pico dentro de un costo declarado por boleta. Sostener capacidad de pico durante todo el mes es una falla de diseño, no prudencia |
| **Reconstrucción de la venta** | Toda boleta se reconstruye: en qué posición estaba el comprador, cuándo reservó, qué respondió la pasarela y cuándo. Es lo que sostiene las disputas, la reventa y la auditoría del aforo |

`[S]` Todos los umbrales concretos —plazos, latencias, metas de costo— están sin definir.
`PENDIENTE: fijarlos en la Entrega 1, no en la 3.`

### Tensiones arquitectónicas que se ven venir

Cinco. La primera es la de siempre; las otras cuatro son las que nos separan. Todas son
**puntos de trade-off** en el sentido de ATAM —mueven dos atributos en direcciones
opuestas, así que se negocian con el negocio, no se optimizan (ver
[`../../../curso/fundamentos-arquitectura.md`](../../../curso/fundamentos-arquitectura.md#6-atam-puntos-de-sensibilidad-y-puntos-de-trade-off)).

**1. No sobrevender contra no rechazar ventas.** El clásico, y es literalmente el ejemplo
trabajado de CAP de la lámina 23. Ante una partición, el nodo que no puede confirmar el
inventario elige: seguir vendiendo (disponibilidad, riesgo de sobreventa) o parar
(consistencia, ventas perdidas en el minuto que más importa).

**2. Y la respuesta no es la misma para los dos tipos de inventario.** Este es el giro que
casi nadie va a traer. Una **silla numerada** es un recurso único: exige consistencia
fuerte, sí o sí. Una **localidad general** es un contador de 8.000: tolera consistencia
aproximada con un margen de seguridad, y eso permite vender en paralelo mucho más rápido.
**Dos modelos de consistencia conviviendo en la misma venta, elegidos por el negocio y no
por el gusto del arquitecto.** Es el mejor material de sustentación que tiene esta idea.

**3. Cerrar rápido contra cobrar seguro.** Confirmar la venta antes de que la pasarela
responda es rápido y arriesga emitir boletas no pagadas. Esperar a la pasarela retiene
inventario durante el pico y bota conversiones. El punto exacto —cuánto se espera, qué se
promete mientras tanto, qué se hace con la respuesta que llega tarde— es una decisión de
negocio con consecuencia directa en pesos y en reputación.

**4. Equidad contra ingreso, en la fila.** FIFO puro premia a quien tiene mejor conexión y
a los bots. La lotería es más justa y más lenta en facturar. La preventa segmentada
monetiza y deja por fuera al fan de a pie. **Son productos distintos con el mismo
inventario**, y la política de fila es la palanca. Además es la única defensa real contra
la reventa: la arquitectura no la bloquea, la desincentiva.

**5. Fricción anti-bot contra conversión.** Cada verificación que frena un bot también frena
fans. Un falso positivo no es una métrica: es una venta perdida y una queja pública. Cuánta
fricción se pone, y a quién, es una decisión que el arquitecto no puede tomar solo.

### Qué se puede implementar y demostrar en la semana 3

Todo simulable, sin depender de ningún tercero: la pasarela de pagos se reemplaza por un
**simulador de pasarela hostil**, que es justamente lo que la hace interesante.

1. **Sistema real:** sala de espera, motor de inventario, orquestador de pago, emisor y
   conciliación, comunicados por bus de eventos.
2. **Generador de carga:** 30.000 usuarios entrando en 60 segundos contra 5.000 boletas.
3. **Simulador de pasarela hostil:** latencia variable, respuestas tardías, respuestas
   duplicadas, y cobros que confirman después de que la reserva expiró.

**Momento estrella 1 — el aforo aguanta.** La corrida completa con el contador de
sobreventa en cero y la fila mostrando su política en vivo. *Es lo que va a mostrar todo el
mundo. Es el piso, no el techo.*

**Momento estrella 2 — la pasarela traiciona.** Se activa el simulador hostil. En la versión
ingenua quedan cobros sin boleta: plata de gente real por un derecho que no existe. En la
nuestra el contador de discrepancias sube y **vuelve solo a cero**, y se muestra cómo. *Este
es el momento que el otro grupo no va a tener.*

**Momento estrella 3 — numerado contra general.** La misma ráfaga sobre los dos tipos de
inventario, con sus dos modelos de consistencia. Se enfrentan los números: latencia de
confirmación y boletas vendidas por segundo. Se ve que el numerado paga coordinación y el
general paga margen de seguridad. *Aquí se demuestra que entendimos CAP, no que lo citamos.*

**Momento estrella 4 — dos políticas de fila, los mismos 30.000.** FIFO puro contra lotería.
Tres números enfrentados: tiempo hasta agotar, **concentración de boletas en pocas
identidades** —el proxy de la reventa— y abandono. *Aquí se demuestra que una decisión de
arquitectura es una decisión de negocio.*

**Momento estrella 5 — se cancela el evento.** La ráfaga inversa: miles de devoluciones al
tiempo. Se muestra que el sistema no se cae y que **la plata cuadra al peso**.

**Momento estrella 6 — cuánto costó.** El gasto de infraestructura de la corrida dividido
por boletas vendidas, bajo dos estrategias de elasticidad. *Es la decisión de arquitectura
puesta en pesos, y cierra la sustentación.*

**Tablero:** aforo por localidad, fila en vivo, discrepancias abiertas, costo acumulado.

### La frontera con la lámina 53 — y por qué declararla nos suma

El caso del profesor es **control de acceso en el estadio**: puertas, credenciales, zonas,
operación offline. El nuestro termina antes.

> **Nosotros vendemos y custodiamos la boleta hasta la puerta. El control de acceso es otro
> sistema, con otro dueño y otros atributos.** Nos integramos por un contrato de eventos:
> *boleta emitida*, *boleta transferida*, *boleta anulada*. Nuestro invariante llega hasta
> «esta boleta es válida y está en estas manos». El suyo empieza en «esta persona puede
> entrar por esta puerta».

Decir esto explícitamente hace tres cosas: evita que nos evalúen contra el ejemplo del
profesor, demuestra que sabemos dónde poner una frontera de contexto, y nos deja un punto
de integración real que enriquece el modelamiento de la Entrega 2.

### OKR que se podrían formular (borrador)

- **O1:** «Que agotar un concierto deje de ser una noche de terror.»
  KR: eventos vendidos sin exceder aforo (meta 100%) · % de compradores que completan la
  compra sin error · tiempo hasta agotar.
- **O2:** «Que la reventa deje de robarle al fan y al promotor.»
  KR: % de boletas revendidas dentro de la plataforma · sobreprecio promedio de reventa
  frente al valor nominal · boletas falsas detectadas en puerta (meta cero).
- **O3:** «Que el pico no nos cueste más de lo que nos deja.»
  KR: costo de infraestructura por boleta vendida · % de la capacidad provisionada
  efectivamente usada en el pico · discrepancias dinero–boleta abiertas al cierre del día
  (meta cero).

`[S]` Todas las metas numéricas están sin definir.

---

## La marca

**TicketRight** es el nombre con el que se entregó el caso de negocio el 12 de septiembre
de 2026, y el que usan el documento, el Canvas y la presentación. Todo lo que se escriba de
aquí en adelante —Entregas 2 y 3— va con ese nombre.

**Nombre de trabajo anterior: *Puesto*.** Fue el recomendado el 7 de septiembre, con la
promesa *«Le guardamos el puesto: en la fila y en el concierto»*: doble sentido feliz —el
puesto en el concierto y guardar el puesto en la fila—, corto, colombiano y cálido. Se
cambió al preparar la versión corporativa de la entrega.

Los tres nombres que estuvieron sobre la mesa ese día:

| Nombre | Registro | Nota |
|---|---|---|
| **Puesto** | Cálido, doble sentido feliz | Fue el recomendado; quedó como nombre de trabajo |
| **Primera Fila** | La mejor silla y el primero en la fila | Bonito, pero largo y difícil de registrar |
| **Tarima** | Sonoro y del mundo del espectáculo | Estaba en la lista de Alejo. Menos ligado al producto |

`PENDIENTE: verificar disponibilidad de dominio y marca de TicketRight — nadie lo ha hecho.`

---

## Riesgos

| Riesgo | Por qué importa | Qué haría |
|---|---|---|
| **Que otro grupo traiga lo mismo** | Es el riesgo número uno, y por eso existe la sección de la tesis | La diferencia no está en el tema sino en el invariante monetario, los dos modelos de consistencia, la fila como producto y el costo por boleta. Hay que **decirlo en el primer minuto de la sustentación**, no al final |
| **Que nos evalúen contra la lámina 53** | Limita el techo | Declarar la frontera explícitamente y tratar el control de acceso como sistema par, no como parte nuestra |
| **«Eso ya existe y funciona»** | Las boleteras establecidas venden bien | Nuestro ángulo no es vender mejor: es **reventa capturada y datos devueltos al promotor**. Verificar quién opera hoy en Colombia |
| **Que el alcance se infle** | Reventa, devoluciones, multi-tenant y anti-bot son cuatro sistemas | Fijar hoy que lo que se implementa es el flujo de venta con pasarela hostil y los dos tipos de inventario. La reventa se **modela** en la Entrega 2 y se demuestra solo si sobra tiempo |
| **Que la demo se quede en «no hubo sobreventa»** | Es el piso que va a mostrar todo el mundo | Los momentos 2, 3, 4 y 6 son obligatorios, no adorno. El 2 y el 6 son los que ganan |
| **Emitir boletas nominales toca datos personales** | Habeas data y tratamiento de datos | Verificar antes del sábado. `PENDIENTE` |
| **Que el equipo confunda atributo con táctica** | El profesor lo señala explícitamente | «Cero sobreventa bajo N concurrentes» es el atributo. «Lock optimista» es la táctica. En el documento van separados |

## Lo que se validó, y con qué fuente

**Investigado el 7 de septiembre con fuentes públicas. Detalle y enlaces en
[`../validaciones.md`](../validaciones.md).**

`[V]` **El mercado existe y creció fuerte.** La boletería de artes escénicas pasó de COP
$310 mil millones en 2018 a **$1,53 billones en 2023** (+22% ese año). Y hay un **registro
público obligatorio de productores y eventos** —el PULEP, creado por la Ley 1493 de 2011—,
así que el universo de clientes potenciales no hay que estimarlo.

`[V]` **El cargo por servicio del mercado está entre 10% y 15%** del valor de la boleta.
Operan Tuboleta —de Ticket Fast S.A.S.— y Ticketmaster Colombia.

`[V]` **El líder del mercado está formalmente imputado por el regulador.** El 4 de junio de
2026 la SIC formuló pliego de cargos contra Ticket Fast S.A.S. por cinco infracciones, tras
acumular nueve expedientes de quejas. Uno de los cargos es una **cláusula abusiva que se
eximía de responsabilidad trasladándosela al promotor**. *Es un pliego de cargos, no una
condena, y así hay que decirlo.*

> **Esto reemplaza el supuesto que sostenía todo el caso de negocio.** Ya no es «creemos que
> los promotores están insatisfechos»: es un acto administrativo público de este año, y uno
> de los cargos describe exactamente el hueco que nuestra propuesta de valor llena.

`[V]` **La reventa está legalmente indefinida en Colombia.** El Código Penal permite
sancionarla, pero casi nunca se aplica. No competimos contra una prohibición que funciona:
el vacío es el espacio donde cabe un mercado secundario formal y trazable.

`[V]` **Cuatro obligaciones legales que son requisitos del sistema, no adornos:**

| Norma | Qué obliga | Qué implica para la arquitectura |
|---|---|---|
| **Ley 1493 de 2011** | Contribución parafiscal del 10% sobre boletas de 3 UVT o más | Un tercer flujo de dinero que liquidar. La boleta es plata de tres bolsillos |
| **Ley 1480 de 2011, art. 47** | Derecho de retracto: 5 días hábiles en venta a distancia | Una operación más que no puede romper el vínculo dinero–boleta |
| **Ante cancelación** | Informar el mecanismo de devolución a la SIC en 3 días hábiles | **La devolución masiva tiene plazo legal.** El momento estrella 5 de la demo es un requisito |
| **Ley 1581 de 2012** | Habeas data: autorización previa para transferir datos a un tercero | Devolverle datos al promotor no es un *export*. Define Responsable vs. Encargado — **AD-004** |

`[V]` **Y hay un precedente que respalda la boleta nominal:** el Decreto 1622 de 2022 la
hace obligatoria para fútbol profesional, con control de acceso que valida documento y QR en
la puerta. **La frontera que declaramos con la lámina 53 es la misma que dibuja la norma.**
*Aplica a fútbol, no a conciertos: es precedente y segundo segmento, no obligación para
nuestro cliente primario.*

### Lo que queda abierto

| Pendiente | Cómo se cierra |
|---|---|
| Conteo de eventos por rango de aforo | Portal de informes públicos del PULEP · 30 min |
| Texto del Decreto 3888 de 2007 sobre aforo | Leerlo |
| Responsable vs. Encargado bajo la Ley 1581 | ADR AD-004, antes de la Entrega 2 |

**No disponible públicamente, y el caso no depende de ello:** el reparto del cargo por
servicio entre operador y promotor, y la fracción de boletas que termina en reventa. Se
modelan como escenario con rango `[S]`.

---

## De dónde salió esto

Documento original de **Lina**, presentado el 7 de septiembre de 2026: el problema central,
el flujo de siete pasos, el valor para el negocio y los cinco atributos de calidad iniciales
—disponibilidad, escalabilidad, seguridad, confiabilidad y auditoría— son suyos y se
conservan, desarrollados al nivel de detalle de las láminas 53 y 54.

Lo que se le agregó en la reunión: la tesis del invariante monetario, los dos modelos de
consistencia, la fila como decisión de negocio, la reventa como fuente de ingreso, el costo
por boleta como atributo, la frontera con la lámina 53 y los seis momentos de la demo.

Comparación con las ideas descartadas: [`../evaluacion-ideas.md`](../evaluacion-ideas.md).
