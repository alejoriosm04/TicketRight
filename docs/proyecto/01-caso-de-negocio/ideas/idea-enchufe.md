# Idea: Enchufe — que el carro amanezca cargado sin tumbar el edificio

**Autor:** síntesis del equipo · **Fecha:** 2026-09-07
**Marca:** *Enchufe* — «su carro amanece cargado. El edificio ni se entera.»

> Propuesta de **cierre** para la reunión del 7 de septiembre. No es una cuarta idea suelta:
> es la fusión de las tres, diseñada para conservar lo que cada una tenía de bueno y
> eliminar los contras que las frenaban. Ver
> [`../evaluacion-ideas.md`](../evaluacion-ideas.md).
>
> Todo dato de mercado va marcado `[S]` (supuesto sin validar) o `[V]` (verificado con
> fuente), según la regla del repo y la lámina 56.

---

## De dónde sale

| De la idea de | Qué se conserva |
|---|---|
| **Lina** — ticketera | La **ráfaga** y el **invariante duro y binario**: un recurso escaso que no se puede sobrevender. Aquí el recurso no son sillas: son kilovatios, y el límite no es una regla de negocio sino un breaker físico |
| **Alejo** — Ventana | El **presupuesto finito** que hay que repartir, el **dato que caduca** y la **promesa respaldada con plata**: si prometemos y fallamos, pagamos |
| **Quinnie** — nutrición | El **SaaS B2B2C multi-tenant** con unit economics serios: cada edificio y cada flota es un tenant, y toda su estructura financiera aplica tal cual |

Y —esto importa— la idea de energía compartida en propiedad horizontal ya estaba en la
lista de Alejo. No venimos de cero.

---

## En una frase

> «Ayudamos a **los edificios y las flotas que quieren cargar carros eléctricos** a
> **cargarlos todos sin reforzar la instalación eléctrica** mediante **un sistema que
> reparte la potencia disponible entre los carros conectados y se compromete con una hora
> de entrega.**»

## El pitch de 60 segundos

Un apartamento en Medellín compra un carro eléctrico. Llama al administrador del edificio a
pedir un tomacorriente en su parqueadero. El administrador dice que sí. El segundo también.
El tercero también.

El día que los tres llegan a las 7 de la noche y enchufan al tiempo, **se cae el breaker
principal y se queda sin luz todo el edificio.**

Entonces el administrador hace lo único que sabe hacer: **prohíbe cargar.** Y ahí se
detiene la adopción del carro eléctrico en Colombia — no por falta de carros, sino porque
el transformador del edificio se diseñó cuando nadie cargaba nada.

La respuesta obvia es costosísima: reforzar la acometida, cambiar el transformador,
tramitar con el operador de red. Cientos de millones que la asamblea no aprueba.

**Enchufe es la respuesta barata:** no aumentamos la potencia, la **repartimos**. Doce
carros cargando sobre una instalación que aguanta cuatro al tiempo, sin que el breaker se
entere, y con un compromiso por carro: *«a las 6:00 a.m. usted tiene sus 80%.»* Si no lo
cumplimos, no le cobramos el mes.

El límite es físico y no se negocia. Lo que sí se negocia —y es toda la arquitectura— es
**a quién le damos los kilovatios cuando no alcanzan para todos.**

---

## El problema

1. **La instalación eléctrica de los edificios existentes no fue diseñada para esto.** Un
   cargador residencial consume más o menos lo mismo que varios apartamentos juntos. Tres o
   cuatro cargando al tiempo ya comprometen la acometida de un edificio mediano.
   `[S] Verificar cifras reales de consumo por cargador y de capacidad típica contratada.`
2. **La falla es catastrófica y colectiva.** No es que un carro cargue lento: es que se cae
   el breaker general y **se queda sin luz el edificio entero**. El costo social de una
   falla es enorme, y por eso la reacción del administrador es prohibir.
3. **Reforzar la instalación es carísimo y lento.** Requiere estudio, obra, trámite con el
   operador de red y aprobación de asamblea. `[S] Costo y tiempo por verificar.`
4. **Todos cargan a la misma hora.** Entre 6 y 9 de la noche, que es justo cuando el
   edificio ya está consumiendo su pico. El problema no es la energía del día: es la
   simultaneidad.
5. **Y la energía no cuesta lo mismo a toda hora.** Cargar a las 2 a.m. es más barato que a
   las 7 p.m. Nadie va a levantarse a las 2 a.m. a enchufar el carro.
   `[S] Verificar estructura tarifaria aplicable a propiedad horizontal en Colombia.`

`[S]` **Supuesto crítico:** hay suficientes edificios en Medellín con más de un residente
con carro eléctrico como para que exista un mercado. *Es la validación nº 1 — y a
diferencia del supuesto que sostenía a Ventana, esta se resuelve caminando: se le pregunta
a tres administradores de propiedad horizontal esta semana.*

## Quién lo padece

| Actor | Su dolor | ¿Paga? |
|---|---|---|
| **Administrador de propiedad horizontal** | Le piden cargadores, y aprobarlos lo expone a dejar el edificio sin luz. Hoy su única defensa es decir que no | **Sí. Es el cliente que firma** |
| **Residente con carro eléctrico** | Le prohíben cargar en su propio parqueadero, o carga con miedo | **Sí, la mensualidad** |
| **Operador de flota** (taxis, domicilios, última milla) | Necesita que los N carros amanezcan cargados; si uno no, pierde el turno completo del día | **Sí, y es quien más paga** |
| **Constructora** | Vende «parqueadero apto para eléctrico» y no quiere sobredimensionar la subestación | Sí, versión obra nueva |
| **Operador de red** | Le preocupa el pico agregado del barrio | No es cliente hoy. `[S]` Posible aliado |

**El segmento con el que se arranca:** propiedad horizontal residencial de estrato medio-alto
en Medellín, entre 40 y 200 apartamentos, con parqueaderos asignados. No «todo el mundo que
tiene carro eléctrico».

`[S]` Tamaño del parque de vehículos eléctricos e híbridos enchufables en Antioquia,
número de edificios con más de un residente con carro eléctrico, y costo real de reforzar
una acometida: **sin verificar.** *Fuentes candidatas: RUNT, ANDEMOS, Lonja de Medellín,
administradores. Responsable: por asignar.*

## La solución propuesta

```
1. SE ENCHUFA   →  2. SE PROMETE   →  3. SE REPARTE    →  4. SE VIGILA   →  5. SE CUMPLE
   El residente     El sistema         La potencia         El consumo        A las 6 a.m.
   conecta y dice   se compromete      disponible se       del edificio      el carro tiene
   a qué hora       con una hora       divide entre los    cambia, y el      su carga. Si no,
   necesita el      y un nivel         carros conectados,  reparto se        no se cobra
   carro            de carga           hora por hora       recalcula         el mes
```

Lo que nos diferencia no es medir ni cobrar: eso ya existe. Es el **paso 2**. Cualquiera
enchufa un carro. Nosotros **prometemos una hora de entrega**, y esa promesa es lo que hace
que el administrador se atreva a decir que sí.

## Por qué alguien pagaría

| # | Fuente | Por qué funciona |
|---|---|---|
| 1 | **Mensualidad por toma activa**, cobrada al residente | Es el producto propio. Cuesta una fracción de la cuota de administración |
| 2 | **Instalación y puesta en marcha**, cobrada al edificio | Ingreso de entrada, y es la conversación que ya está teniendo el administrador |
| 3 | **Contrato por flota**, con compromiso de disponibilidad | El que más paga: para una flota, un carro sin cargar es un turno perdido |
| 4 | **Diferencia de energía** | Movemos la carga a las horas baratas. Parte de ese ahorro es margen. `[S] Depende de la tarifa` |
| 5 | **Módulo para obra nueva**, licenciado a constructoras | La constructora ahorra en subestación lo que nos paga a nosotros |

**Por qué el administrador dice que sí:** porque hoy su alternativa es prohibir —y quedar
mal con residentes que compraron un carro de cien millones— o aprobar y rezar. Le estamos
vendiendo **poder decir que sí sin arriesgar el edificio.**

`[S]` **Sin verificar:** cuánto pagaría un edificio, cuánto cuesta el hardware de carga
gestionable, y la diferencia real entre tarifa de pico y de valle. *De esas tres cifras
sale el modelo, y las tres son consultables.*

## Competencia o sustitutos

| Quién | Qué hace hoy | Por qué no resuelve esto |
|---|---|---|
| **Cargador residencial suelto** | Carga un carro a máxima potencia | Es exactamente lo que tumba el breaker. Es el problema, no la solución |
| **Reforzar la acometida** | Aumenta la capacidad | Carísimo, lento y requiere asamblea. Es el sustituto real, y contra ese competimos |
| **Fabricantes con balanceo de carga** | Algunos equipos reparten potencia entre sus propios cargadores | `[S] Verificar cuáles operan en Colombia.` Reparten, pero **no prometen una hora**, no son multimarca y no gestionan cobro entre copropietarios. Es la objeción principal |
| **Prohibir cargar** | La política actual de muchos edificios | Y hoy va ganando |
| **Cargar en la calle** | Estaciones públicas | Caro, hay que ir, y no resuelve al que tiene parqueadero propio |

---

## Por qué sirve para *este* curso

Esta idea junta, en un solo sistema, las tres cosas que en las otras estaban separadas: un
**invariante duro y binario** (Lina), un **presupuesto finito que hay que repartir con la
plata encima** (Alejo) y un **SaaS multi-tenant con negocio serio** (Quinnie).

### La integración vertical, en el formato del profesor (lámina 41)

| Estrategia | Capacidad | Proceso | Aplicaciones | Tecnología |
|---|---|---|---|---|
| Que un edificio pueda decir que sí a la carga eléctrica sin obra | Reparto de potencia con compromiso de entrega | Conectar → prometer → asignar → vigilar → reconciliar → cobrar | Motor de asignación, servicio de promesas, agente de borde, medición y facturación | Agentes en sitio, flujo de telemetría, series de tiempo, nube multi-tenant |

### Qué la vuelve técnicamente interesante

1. **El límite es físico y no se negocia.** La suma de la potencia entregada en un instante
   no puede pasar de la capacidad contratada. No es una regla de negocio que un producto
   owner pueda relajar: si se pasa, se cae el edificio. Es el invariante más duro que puede
   tener un sistema, y es **binario y visible**.
2. **El recurso es escaso, compartido y continuo.** No es «hay 500 sillas». Es «hay 40 kW
   ahora mismo, que en cinco minutos pueden ser 25 porque el ascensor arrancó». El
   presupuesto **cambia solo**, y hay que repartirlo otra vez.
3. **La promesa le pone precio al error.** «A las 6 a.m. usted tiene su 80%.» Si no
   cumplimos, no cobramos el mes. Cada carro conectado es una posición abierta, y el sistema
   tiene que saber en todo momento cuántas promesas puede seguir aceptando.
4. **El borde tiene que sobrevivir solo.** Si se cae el internet del edificio, los cargadores
   no pueden apagarse (el residente se queda sin carro) ni seguir a toda potencia (se cae el
   breaker). Tienen que **decidir solos, y de forma que la suma siga siendo segura aunque
   ninguno hable con los otros.**
5. **El pico es predecible:** entre 6 y 9 de la noche, todos los días.

### Atributos de calidad que exigiría

Al nivel de detalle de los casos del profesor (láminas 53 y 54):

| Atributo | Enunciado |
|---|---|
| **Invariante de potencia** | La suma de la potencia entregada por todos los puntos de un sitio no supera la capacidad contratada **en ningún instante**, incluso durante fallas de red, reinicios y despliegues. Superarla una sola vez es una falla crítica, no una degradación |
| **Autonomía degradada del borde** | Ante pérdida de conectividad, cada punto sigue operando con un presupuesto local conservador cuya **suma sobre todos los puntos sigue siendo segura sin coordinación**, y reconcilia al reconectar |
| **Cumplimiento de la promesa** | Un compromiso aceptado se cumple dentro de la hora y el nivel pactados. El sistema **sabe cuándo ya no puede prometer** y deja de aceptar compromisos antes de incumplir |
| **Exposición acotada de la promesa** | El número de promesas vivas cuyo incumplimiento es posible está acotado, cuantificado y conocido en todo momento, por sitio y en agregado |
| **Reconstrucción de la asignación** | Toda decisión de reparto se reconstruye con la telemetría vigente en el momento en que se tomó. Es lo que permite responder «¿por qué mi carro cargó menos que el del vecino?» y lo que sostiene la facturación entre copropietarios |
| **Aislamiento entre tenants** | Un sitio con muchos puntos y telemetría intensa no degrada el servicio ni la frescura de los demás |
| **Exactitud de la medida** | La energía facturada a cada residente corresponde a la entregada, con tolerancia declarada. Es plata entre vecinos: una discrepancia es un problema de asamblea |

### Tensión arquitectónica que se ve venir

Cuatro, y las tres primeras son **puntos de trade-off** en el sentido de ATAM —mueven dos
atributos en direcciones opuestas, así que se negocian con el negocio, no se optimizan
(ver [`../../../curso/fundamentos-arquitectura.md`](../../../curso/fundamentos-arquitectura.md#6-atam-puntos-de-sensibilidad-y-puntos-de-trade-off)).

**1. Cuando no alcanza para todos, ¿quién carga primero?** Es la tensión central y no tiene
respuesta técnica.

¿El que llegó primero? ¿El que se va más temprano mañana? ¿El que paga la tarifa alta? ¿El
taxi que se queda sin turno contra el residente que va a mercar el sábado? Cada respuesta es
un producto distinto y un modelo de negocio distinto, **con el mismo hardware**. Es
exactamente una decisión que el arquitecto no puede tomar solo: implica decidir qué se
sacrifica y a nombre de quién.

**2. Energía barata contra promesa cumplida.** La energía es más barata de madrugada.
Esperar a la madrugada maximiza el margen y arriesga el compromiso; cargar apenas se enchufa
cumple siempre y regala el margen. En el medio está el producto, y **el punto exacto es una
decisión de negocio con consecuencia directa en pesos**, medible en la simulación.

**3. Coordinación central contra autonomía del borde — y es CAP, con un breaker de por
medio.** Coordinar desde la nube reparte mejor pero deja el sitio inútil cuando se cae la
red. Decidir localmente sobrevive a la partición pero reparte peor, porque cada punto tiene
que reservarse un margen de seguridad «por si los demás también están cargando». **Elegir
consistencia deja carros sin cargar; elegir disponibilidad arriesga el breaker.** Es el
ejemplo trabajado de la lámina 23 con una consecuencia física, y es el mejor material de
sustentación que puede tener este proyecto.

**4. La promesa convierte el error en plata, y obliga a declarar cuánto se apuesta.** Cada
compromiso aceptado es una posición abierta. Aceptar muchos llena el edificio y sube el
ingreso; aceptar demasiados garantiza incumplir. El sistema tiene que conocer su exposición
y **cerrar la puerta a tiempo**. Es el límite de exposición del material del curso, y aquí
es el corazón del modelo de negocio.

### Qué se puede implementar y demostrar en la semana 3

Todo simulable, sin comprar un solo cargador. Y —esto responde el reparo que tenía Ventana—
**el simulador reemplaza únicamente al hardware, no a la arquitectura**: los cargadores
simulados hablan un protocolo real sobre la red contra servicios reales, que es exactamente
como la industria prueba este tipo de sistemas.

1. **Simulador de sitio:** N puntos de carga, carros con hora de salida y nivel objetivo,
   más el consumo base del edificio variando durante el día.
2. **Motor de asignación** que reparte la potencia disponible respetando el invariante.
3. **Servicio de promesas** con exposición acotada: acepta compromisos mientras pueda
   cumplirlos y deja de aceptar cuando no.
4. **Agente de borde** con presupuesto local conservador y reconciliación posterior.
5. **Momento estrella 1 — el breaker.** Se corre la misma noche con la política ingenua
   (el que llega carga a máxima potencia) y con la nuestra. La primera **tumba el breaker en
   vivo, en pantalla, a las 6:40 p.m.**, y todos los carros pierden la carga. La segunda no.
   Es la demostración más contundente que se puede hacer de que una decisión de arquitectura
   evita un desastre.
6. **Momento estrella 2 — se cae el internet.** Se corta la red a la mitad de los puntos.
   Se muestran las dos alternativas —seguir coordinando a ciegas contra degradar a
   presupuesto local— y qué cuesta cada una: en carros sin cargar y en riesgo de breaker.
   CAP, en vivo, con consecuencia física.
7. **Momento estrella 3 — la promesa tiene precio.** Se corre el mes completo bajo distintas
   políticas de reparto y se enfrentan **tres números en la misma pantalla**: promesas
   incumplidas, costo de la energía y ocupación del sitio. Se ve que la política más barata
   incumple más, y **cuánto más, exactamente, en pesos.**
8. **Tablero:** potencia en vivo contra el techo contratado, promesas en riesgo y exposición.

### OKR que se podrían formular (borrador)

- **O1:** «Que ningún edificio tenga que prohibir cargar.»
  KR: sitios operando por encima del número de carros que su instalación aguantaría sin
  gestión · eventos de sobrepaso del límite contratado (meta: cero) · % de residentes que
  cargan sin restricción de horario.
- **O2:** «Que nuestra promesa valga lo que cuesta.»
  KR: % de promesas cumplidas · meses no cobrados por incumplimiento sobre ingreso ·
  exposición viva máxima por sitio.
- **O3:** «Que la energía cueste menos sin que el residente lo note.»
  KR: % de energía entregada en horas de tarifa baja · costo de energía por vehículo-mes ·
  diferencia contra cargar sin gestión.

`[S]` Todas las metas están sin definir.

---

## La marca

**Enchufe.** Doble sentido y los dos sirven: **el enchufe** que es el producto, y **«tener
enchufe»**, que en español es tener la conexión que le abre a uno la puerta. Corto, cálido y
en español.

**Promesa:** *«Su carro amanece cargado. El edificio ni se entera.»*

**Alternativas:**

| Nombre | Registro | Nota |
|---|---|---|
| **Enchufe** | Cálido, doble sentido feliz | El recomendado |
| **Cupo** | Es literalmente el concepto: el cupo del transformador | Muy colombiano, más frío |
| **Vatio** | Técnico y claro | Menos memorable |

`[S]` *Verificar disponibilidad de dominio y marca.*

---

## Riesgos

| Riesgo | Por qué importa | Qué haría |
|---|---|---|
| **Que todavía no haya suficientes edificios con más de un carro eléctrico** | Es el riesgo real de mercado: el problema es cierto pero puede ser temprano | Validación nº 1, y se hace caminando: tres administradores esta semana. Si es temprano, el segmento de entrada pasa a ser **flotas**, donde la densidad ya existe hoy |
| **Que el hardware de carga gestionable sea caro o difícil de conseguir** | Sube el costo de entrada | Cotizar. Para el curso es irrelevante: todo simulado |
| **«Eso ya lo hace el fabricante del cargador»** | Es la objeción principal en la sustentación | Verificar. El diferencial no es balancear: es **prometer una hora**, ser multimarca y repartir el cobro entre copropietarios |
| **Que la instalación eléctrica sea materia regulada** | Puede haber norma técnica (RETIE) y trámite con el operador de red | Verificar antes del sábado. `PENDIENTE` |
| **Que el equipo se enamore del algoritmo de optimización** | El curso evalúa arquitectura, no investigación de operaciones | Fijar el alcance hoy: el corazón es **el invariante, la promesa y el borde autónomo**. El repartidor puede ser deliberadamente simple, y se dice en la sustentación como decisión consciente |
| **Que nadie del equipo sepa de energía** | Tres semanas es poco para aprender un dominio | El dominio es superficial: son presupuestos de potencia y horarios. No hay física complicada |

## Lo que hay que validar antes del sábado

1. **Que existan edificios con el problema.** Tres administradores de propiedad horizontal.
   Es la validación nº 1 y se puede hacer mañana.
2. **Cuánto cuesta reforzar una acometida.** Es el sustituto contra el que competimos: esa
   cifra es la que justifica todo el negocio.
3. **Consumo típico de un cargador y capacidad típica contratada** en un edificio de 40 a
   200 apartamentos.
4. **Estructura tarifaria** aplicable, para saber si el arbitraje horario es real.
5. **Si algún fabricante ya vende esto en Colombia** con compromiso de hora.

`PENDIENTE: asignar responsable a cada validación en la reunión de hoy.`

---

## Por qué esta y no las otras tres

| | **Enchufe** | Ventana | Ticketera | Nutrición |
|---|---|---|---|---|
| Invariante duro y binario | **Sí, y es físico** | No | Sí (sobreventa) | No |
| Presupuesto escaso que repartir | **Sí, y cambia solo** | Sí | No | No |
| El error se mide en | **Pesos y en un edificio a oscuras** | Pesos | Ventas perdidas | Nada duro |
| Tensiones arquitectónicas reales | **Cuatro** | Tres | Una | Media |
| CAP con consecuencia | **Sí, física** | No | Sí, clásica | No |
| Operación offline | **Sí, y es obligatoria** | No | No | No |
| Multi-tenant B2B | **Sí** | No | Parcial | Sí |
| Datos validables esta semana | **Sí, caminando** | No | Parcial | No |
| ¿Otro equipo llega con esto? | **No** | No | **Muy probable** | Posible |
| ¿Se parece a la lámina 53 o 54? | No | No | **Sí** | No |
