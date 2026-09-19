# Idea: Ventana — comprar el vuelo en el momento justo

**Autor:** Alejo · **Fecha:** 2026-09-07
**Marca:** *Ventana* — «si le decimos que espere y sube, la diferencia va por nuestra cuenta.»

> Todo dato de mercado va marcado `[S]` (supuesto sin validar) o `[V]` (verificado con
> fuente), según la regla del repo y la lámina 56.

---

## En una frase

> «Ayudamos a **la persona que está a punto de comprar un tiquete y no sabe si es buen
> precio** a **comprar en el momento correcto** mediante **un sistema que observa el precio
> de forma continua, le dice si comprar o esperar, y respalda ese consejo con plata.»

## El pitch de 60 segundos

Usted encuentra el vuelo a Cartagena en cuatrocientos mil. Le parece caro. Decide pensarlo
mientras almuerza. Vuelve, y está en seiscientos cincuenta.

Todo el mundo ha vivido ese momento, y todo el mundo sale de ahí con la misma sensación:
que el sistema lo estaba mirando y le subió el precio a propósito. **Comprar un tiquete es
la única compra cotidiana donde uno siente que está apostando contra alguien que sabe más.**
Y no es paranoia: del otro lado hay un sistema de administración de ingresos moviendo
precios varias veces al día, con años de datos, y del lado de uno no hay nada.

Ventana pone algo del otro lado. Observamos el precio de las rutas de forma continua,
le decimos **compre hoy** o **espere**, y —esto es lo que cambia todo— **respaldamos el
consejo**: si le decimos que espere y el precio sube, la diferencia la pagamos nosotros.

Eso convierte una opinión en un compromiso. Y convierte cada error de nuestro sistema en
una cifra exacta en pesos, que es la mejor cosa que le puede pasar a un problema de
arquitectura.

---

## El problema

1. **La asimetría es total.** La aerolínea tiene un sistema de revenue management con años
   de historia. El comprador tiene una corazonada y el miedo a que suba.
2. **El precio cambia mientras uno decide.** Y el que uno vio deja de existir en el momento
   en que hace clic.
3. **Nadie sabe si el precio que está viendo es bueno.** «Cuatrocientos mil» no significa
   nada sin saber cuánto ha valido esa ruta en esas fechas.
4. **Los consejos que existen no cuestan nada a quien los da.** Un blog que dice «compre
   los martes» no pierde nada si usted pierde plata.
5. **Y viajar es de las compras más emocionales que hay.** La gente ahorra meses. Es el
   paseo, es ir a ver a la familia, es el grado. Equivocarse en el precio duele distinto.

`[S]` **Supuesto crítico:** la variabilidad de precio en rutas colombianas es lo bastante
alta y predecible como para que exista una recomendación con valor. *Es la validación nº 1 y
es la que puede matar la idea: si el precio se mueve al azar, no hay producto. Se valida
observando unas pocas rutas durante unos días.*

## Quién lo padece

**Segmento primario:** viajeros de ocio que compran con anticipación y son sensibles al
precio. No el ejecutivo que viaja mañana y le da igual: el que está planeando el paseo de
diciembre y lleva tres semanas mirando.

| Actor | Su dolor | ¿Paga? |
|---|---|---|
| **Viajero de ocio** | No sabe si comprar hoy o esperar, y pierde plata en las dos direcciones | **Sí: por la garantía** |
| **El que viaja a ver familia** | Fechas fijas y no negociables, máxima exposición al precio | **Sí** |
| **Agencias y compradores corporativos** | Compran mucho y sin criterio de oportunidad | Sí, versión empresarial |
| **La aerolínea** | Nada. No es nuestro cliente, y conviene decirlo | No |

`[S]` Tamaño del mercado de viajes de ocio en Colombia, volumen de vuelos domésticos y
variabilidad real de precios: **sin verificar**. *Fuentes: Aerocivil, agencias, aerolíneas.
Responsable: por asignar.*

## La solución propuesta

```
1. USTED BUSCA  →  2. NOSOTROS      →  3. LE DECIMOS   →  4. USTED DECIDE →  5. CUMPLIMOS
   Su ruta y         OBSERVAMOS         Compre hoy o       Compra ahora       Si dijimos
   sus fechas        Esa ruta entra     espere, con        o activa la        espere y subió,
                     al presupuesto     una razón          garantía           pagamos la
                     de observación                                           diferencia
```

Lo que nos diferencia no es la recomendación: es **el paso 5**. Cualquiera puede opinar.
Nosotros ponemos plata detrás de la opinión, y eso obliga a que el sistema sea bueno de
verdad.

## Por qué alguien pagaría

| # | Fuente | Por qué funciona |
|---|---|---|
| 1 | **Tarifa por la garantía de precio** | Es el producto propio. El usuario paga una tarifa pequeña por no tener que adivinar |
| 2 | **Congelar el precio por unos días** | Producto complementario y muy vendible: «guárdeme este precio mientras decido» |
| 3 | **Comisión de afiliación por la compra** | Estándar de la industria, y llega sin fricción |
| 4 | **Versión para agencias y empresas** | Compran mucho y sin criterio de oportunidad |

**Por qué el usuario dice que sí:** porque hoy ya está apostando, solo que sin
información y sin red. Le estamos vendiendo dejar de apostar.

`[S]` **Sin verificar:** cuánto pagaría alguien por la garantía, cuánto varía realmente el
precio, y la comisión de afiliación de mercado. *De esas tres cifras sale el modelo.*

## Competencia o sustitutos

| Quién | Qué hace hoy | Por qué no resuelve esto |
|---|---|---|
| **Buscadores y metabuscadores** | Muestran el precio de hoy | No dicen si es bueno, y no responden por nada |
| **Apps internacionales de predicción** | Predicen y en algunos casos garantizan | `[S]` *Verificar si operan en Colombia, con rutas domésticas y medios de pago locales.* Es la objeción principal |
| **Alertas de precio** | Avisan cuando baja | Reaccionan, no anticipan, y avisan tarde |
| **Comprar y rezar** | La alternativa real | Y hoy va ganando |

---

## Por qué sirve para *este* curso

Esta es la idea donde el protagonista es la **arquitectura de datos**, que es uno de los
cuatro dominios de la lámina 36 y el que menos se trabaja en los proyectos de curso.

### La integración vertical, en el formato del profesor (lámina 41)

| Estrategia | Capacidad | Proceso | Aplicaciones | Tecnología |
|---|---|---|---|---|
| Ser el lugar donde uno sabe **cuándo** comprar | Observación continua del precio y recomendación respaldada | Priorizar qué observar → observar → estimar → recomendar → garantizar → liquidar | Motor de priorización, motor de observación, motor de estimación, motor de garantía | Ingesta en flujo, series de tiempo, cómputo elástico |

Poder presentar esta tabla, con nuestro caso, en el mismo formato de su lámina, es una
forma directa de mostrar que entendimos el marco y no solo el problema.

### Qué la vuelve técnicamente interesante

1. **El espacio a observar es inmenso y el presupuesto es finito.** Rutas × fechas de ida ×
   fechas de vuelta × aerolíneas × clases tarifarias son millones de combinaciones, cada una
   cambiando varias veces al día. Cada consulta a un proveedor **cuesta plata y está
   limitada por cupo**. No se puede mirar todo. **Decidir qué mirar y cada cuánto es la
   arquitectura.**
2. **El dato se pudre rápido.** Un precio de hace seis horas puede ser mentira.
3. **La garantía le pone precio exacto a cada error.** Un error de estimación no es una
   métrica: es una transferencia de plata desde nosotros hacia el usuario.
4. **El pico es predecible:** temporada, puentes, diciembre, y cada anuncio de promoción.

### Atributos de calidad que exigiría

Al nivel de detalle de los casos del profesor (láminas 53 y 54):

| Atributo | Enunciado |
|---|---|
| **Rendimiento del presupuesto de observación** | El sistema opera bajo un tope fijo de consultas por período y lo asigna donde más reduce la incertidumbre de las recomendaciones activas. Gastar el presupuesto en rutas sin usuarios ni garantías vigentes es una falla, no una ineficiencia |
| **Antigüedad declarada del dato** | Todo precio mostrado lleva asociada la antigüedad de la observación que lo respalda, y el sistema **sabe cuándo su propio dato es demasiado viejo para prometer** |
| **Fidelidad de la recomendación** | Cuando el sistema dice «compre», el precio ofrecido existe al momento de la compra dentro de un margen declarado. Una promesa rota cuenta como falla grave, no como variación de mercado |
| **Exposición acotada de la garantía** | La pérdida máxima por garantías vigentes está acotada, cuantificada y conocida en todo momento, por ruta y en agregado |
| **Reconstrucción de la recomendación** | Toda recomendación se reconstruye con las observaciones vigentes en el momento en que se dio, aunque el precio haya cambiado después. Es lo que permite responder «¿por qué me dijeron que esperara?» |
| **Capacidad de ráfaga** | El sistema absorbe los picos de temporada sin degradar la frescura de las rutas con garantías activas, degradando primero las rutas sin compromiso |

### Tensión arquitectónica que se ve venir

Tres, y son de negociar con el negocio, no de optimizar
(ver [`../../../curso/fundamentos-arquitectura.md`](../../../curso/fundamentos-arquitectura.md#6-atam-puntos-de-sensibilidad-y-puntos-de-trade-off)).

**1. Frescura contra cobertura, con el mismo presupuesto.** Es la tensión central y es
fresca.

Con un tope fijo de consultas se puede mirar **pocas rutas muy seguido** —predicciones
excelentes en un catálogo estrecho, y un producto que no le sirve a la mayoría— o **muchas
rutas de vez en cuando** —cubrimos a todos con datos viejos y recomendaciones tibias. Con el
mismo presupuesto, y son productos distintos.

Y hay un giro: el presupuesto debería concentrarse donde hay garantías activas, porque ahí
el error cuesta plata. Pero concentrarlo ahí nos deja ciegos en las rutas nuevas, que es de
donde saldrán los usuarios de mañana. *Servir bien a quien ya confía contra poder servir a
quien todavía no.*

**2. Mostrar rápido contra mostrar cierto.** Verificar el precio en vivo antes de mostrarlo
es lento y consume presupuesto; mostrar lo que tenemos guardado es instantáneo y a veces
miente. Y una promesa rota en esta categoría es exactamente la herida que el producto vino a
curar. Cuánta verificación se hace antes de comprometerse es una decisión de negocio con
consecuencia directa en costo.

**3. La garantía convierte el error en plata, y eso obliga a declarar cuánto se apuesta.**
Si decimos «espere» y sube, pagamos. Cada recomendación es una posición abierta. El sistema
tiene que conocer en todo momento su exposición total y poder cerrarla —dejando de ofrecer
garantía en rutas donde su dato está viejo— antes de que el mercado se mueva. Es el **límite
de exposición** del material del curso, y aquí no es un mecanismo defensivo: es el corazón
del modelo de negocio.

### Qué se puede implementar y demostrar en la semana 3

Todo simulable, sin pagar un solo proveedor de datos:

1. **Simulador de mercado de precios:** rutas con estacionalidad, tendencia por cercanía a
   la fecha, y choques aleatorios.
2. **Motor de priorización** que reparte un presupuesto fijo de observaciones.
3. **Motor de estimación** y **motor de garantía** con exposición acotada.
4. **Momento estrella 1 — frescura contra cobertura, con el mismo presupuesto.** Se corre la
   misma temporada bajo dos políticas y se enfrentan los dos números: **error de la
   recomendación** contra **rutas cubiertas**. Dos productos distintos con el mismo costo.
5. **Momento estrella 2 — el precio que ya no existe.** El usuario compra sobre un dato
   guardado. Se muestra la política de verificación: cuánto presupuesto consume verificar en
   vivo contra cuántas promesas se rompen sin verificar.
6. **Momento estrella 3 — el error tiene precio.** Se corre la temporada completa y se ve
   **cuánta plata se pagó en garantías**, y cómo esa cifra cae cuando el presupuesto de
   observación se concentra bien. Es la demostración más limpia que se puede hacer de que
   una decisión de arquitectura vale dinero.
7. **Tablero:** mapa de frescura por ruta y exposición viva.

El momento 6 es el que cierra la sustentación: pone una decisión de arquitectura y una cifra
en pesos en la misma pantalla.

### OKR que se podrían formular (borrador)

- **O1:** «Que nadie vuelva a comprar un tiquete a ciegas.»
  KR: % de recomendaciones acertadas · ahorro promedio por compra frente a comprar el día de
  la búsqueda · % de usuarios que activan la garantía.
- **O2:** «Que nuestro consejo valga lo que cuesta.»
  KR: pagos por garantía como % de los ingresos por garantía · exposición viva máxima ·
  promesas de precio incumplidas.
- **O3:** «Sacarle el máximo a cada consulta que pagamos.»
  KR: costo de observación por recomendación entregada · antigüedad mediana del dato en
  rutas con garantía · rutas cubiertas por peso gastado.

`[S]` Todas las metas están sin definir.

---

## La marca

**Ventana.** Doble sentido y los dos sirven: **la silla de ventana**, que es la que todo el
mundo quiere, y **la ventana de compra**, que es el producto. Corta, cálida y en español.

**Promesa:** *«Si le decimos que espere y sube, la diferencia va por nuestra cuenta.»*

Es larga para un eslogan y aun así es la correcta, porque es un compromiso y no un adjetivo.
La versión corta para la marca: *«Compre en su ventana.»*

**Alternativas:**

| Nombre | Registro | Nota |
|---|---|---|
| **Ventana** | Cálido, doble sentido feliz | El recomendado |
| **Escala** | Técnico y viajero a la vez | «Escala» es parada técnica y también magnitud. Guiño fino para un curso de arquitectura |
| **Cuándo** | Es literalmente la pregunta | Difícil de registrar |

`[S]` *Verificar disponibilidad de dominio y marca.*

---

## Riesgos

| Riesgo | Por qué importa | Qué haría |
|---|---|---|
| **Que el precio no sea predecible** | Mata la idea entera, no solo el proyecto | Es la validación nº 1 y se puede empezar hoy: observar unas pocas rutas unos días y mirar si hay patrón |
| **«Eso ya existe»** | Hay apps internacionales que predicen y garantizan | Verificar si operan en rutas domésticas colombianas. Si sí, cambia el posicionamiento; si no, es el argumento |
| **Acceso a los datos de precios** | Los proveedores cobran y limitan | Para el curso todo es simulado. Para el negocio, hay que costearlo y decirlo en el caso |
| **Ofrecer una garantía es un producto financiero** | Puede tener implicaciones regulatorias | Verificar antes del sábado |
| **El equipo se enamora del modelo de predicción** | El curso evalúa arquitectura, no pronóstico | Fijar el alcance hoy: el corazón es el **presupuesto de observación**, no la precisión del estimador |

## Lo que hay que validar antes del sábado

1. **Que el precio de rutas colombianas se mueva con patrón.** Se empieza hoy.
2. **Si ya hay alguien garantizando precio** en Colombia.
3. **Cuánto cuesta acceder a datos de precios** de forma sostenida.
4. **Qué implica ofrecer una garantía de precio** en términos regulatorios.

`PENDIENTE: asignar responsable a cada validación en la reunión de hoy.`

---

## Comparación con las otras ideas del autor

| | **Ventana** | Llévelo | Esquina | Feria | Tarima |
|---|---|---|---|---|---|
| Momento de compra | **Sí, y muy emocional: el viaje** | Sí, el mostrador | Es un trámite | Dentro del evento | Antes del evento |
| Mercado | Masivo, todo el que viaja | Masivo | Nacional | Un evento a la vez | Un evento a la vez |
| Dominio protagonista | **Arquitectura de datos** (lámina 36) | Aplicaciones y decisión | Datos y operación | Tecnología e infraestructura | Aplicaciones |
| Tensión distintiva | **Presupuesto finito de observación sobre un espacio inmenso** | Solo aprende de a quien aprueba | Modifica lo que predice | Cobrar sin red | Consistencia dura bajo carga |
| El error se mide en | **Pesos, por la garantía** | Ventas y mora | Viajes en vano | Ventas perdidas | Sillas dobles |
| Riesgo principal | Que el precio no sea predecible | «Eso ya existe» | El efectivo puede bajar | Alcance | Solaparse con lámina 53 |
