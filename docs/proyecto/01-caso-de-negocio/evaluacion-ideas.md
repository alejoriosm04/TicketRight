# Evaluación y elección de la idea de negocio

> ✅ **Cerrado.** Es el sustento de [AD-001](../decisiones/0001-idea-de-negocio.md): por qué
> se eligió la boletería de alta demanda y no las otras tres. Histórico: no hace falta leerlo
> para trabajar en las Entregas 2 y 3.

**Reunión:** lunes 7 de septiembre de 2026
**Salida esperada:** una idea elegida + `../decisiones/0001-idea-de-negocio.md` escrito

> **Estado de este documento.** Contiene un **análisis previo** de las tres ideas
> presentadas, hecho contra el material de `curso/`, más una **cuarta opción de síntesis
> (Enchufe)** construida para eliminar los contras de las tres. Los puntajes de C1 a C4 son
> una **propuesta para arrancar la discusión**, no la decisión. C5 solo lo puede llenar el
> equipo. La decisión al final sigue en `PENDIENTE`.

## Qué estamos eligiendo realmente

No el mejor negocio, sino **el negocio que dé pie al mejor proyecto de arquitectura y que
se pueda demostrar el 26 de septiembre**. A veces apuntan a ideas distintas.

- **La idea comercialmente redonda pero arquitectónicamente plana.** Un CRUD con buen
  modelo de negocio deja sin material las entregas 2 y 3, que valen el 60%.
- **La idea técnicamente fascinante sin negocio detrás.** La Entrega 1 pide modelo de
  negocio, premisas y 3 OKR: sin cliente ni fuente de ingreso, no se llena.

Los dos casos que mostró el profesor —control de acceso en un estadio y despacho en línea
de comida y licor (láminas 53 y 54)— sirven para calibrar: ambos son negocios reales y
ambos exigen tiempo real, operación distribuida, seguridad y disponibilidad.

## Criterios

| # | Criterio | Peso | Qué puntúa alto |
|---|---|---|---|
| C1 | **Riqueza arquitectónica** | 30% | Exige decisiones con trade-offs reales: volumen, tiempo real, integración con terceros, distribución, operación offline, consistencia vs. disponibilidad |
| C2 | **Viabilidad de demostrarla en 3 semanas** | 25% | Hay un alcance mínimo implementable y simulable para el 26 de septiembre |
| C3 | **Solidez del caso de negocio** | 20% | Cliente identificable, problema real, alguien que pagaría, OKR formulables |
| C4 | **Acceso a información** | 15% | Podemos validar supuestos sin depender de terceros |
| C5 | **Conocimiento e interés del equipo** | 10% | Alguien conoce el dominio; nos interesa sostenerla tres semanas |

C1 y C2 pesan más de la mitad juntos: son los que determinan las entregas que valen el 60%.

### Criterio de desempate (fuera de la matriz): diferenciación

La matriz mide si la idea *sirve*. No mide si la idea *destaca*. Con el objetivo de ser un
equipo sobresaliente, cuando dos ideas quedan empatadas en la matriz el desempate es:
**¿cuántos equipos van a llegar el sábado con algo parecido, y qué tan cerca está de un
ejemplo que el profesor ya dio en clase?**

---

## Las ideas

### A — Ventana (Alejo) · precio de tiquetes con garantía

[`ideas/idea-alejo-ventana.md`](ideas/idea-alejo-ventana.md)

**Qué es.** Observa continuamente el precio de rutas aéreas, recomienda comprar o esperar,
y respalda la recomendación con plata: si dice «espere» y el precio sube, paga la
diferencia.

**Lo que la hace fuerte para *este* curso.**

- La tensión central es **fresca y no es de libro**: presupuesto finito de observación
  sobre un espacio de rutas × fechas × aerolíneas prácticamente infinito. Frescura contra
  cobertura, con el mismo costo. Es un **punto de trade-off** en el sentido exacto de ATAM
  (mueve dos atributos en direcciones opuestas → se negocia, no se optimiza) — ver
  [`fundamentos-arquitectura.md`](../../curso/fundamentos-arquitectura.md#6-atam-puntos-de-sensibilidad-y-puntos-de-trade-off).
- **Pone precio en pesos a cada decisión de arquitectura.** La garantía convierte el error
  del sistema en una transferencia de dinero. Es la forma más limpia de responder la
  pregunta del profesor sobre el valor de la arquitectura (lámina 47) y de conectar con
  **costo de oportunidad** (lámina 25).
- Es la única de las tres donde el protagonista es la **arquitectura de datos**, uno de los
  cuatro dominios de la lámina 36 y el que casi nadie trabaja. Y ya viene con la tabla de
  **integración vertical en el formato de la lámina 41**.
- **La Entrega 3 se llama «Implementación – Sustentación – Simulación – Defensa».** Esta
  idea es la única de las tres que es *nativamente* una simulación: se corre una temporada
  completa bajo dos políticas y se enfrentan los números.
- **No depende de ningún tercero para la demo.** El simulador de mercado reemplaza al
  proveedor de precios, que es lo único que costaría plata.

**Dónde falla.**

- `[S]` El supuesto que la sostiene —que el precio se mueve con patrón— **no está
  validado**, y si es falso el negocio no existe. Para el curso no mata el proyecto (el
  simulador es nuestro), pero sí debilita el caso de negocio de la Entrega 1, que es
  justamente donde el profesor pide «datos y supuestos validados» (lámina 56).
- **Riesgo de deriva:** el equipo se enamora del modelo de predicción y entrega un proyecto
  de ciencia de datos en un curso de arquitectura. El propio archivo lo señala.
- Riesgo de que la demo se lea como «un script que simula», no como un sistema. Se mitiga
  construyendo servicios reales con broker y almacenamiento reales, y dejando el simulador
  **solo como fuente externa de eventos de precio**. El simulador reemplaza al proveedor,
  no a la arquitectura.
- Ofrecer garantía de precio puede ser un producto financiero regulado. `PENDIENTE: verificar.`

### B — Ticketera de alta demanda (Lina) · venta de entradas para conciertos

[`ideas/idea-lina.md`](ideas/idea-lina.md)

**Qué es.** Venta de boletería para eventos donde miles de personas compran en el mismo
minuto: sala de espera, turno, reserva temporal, pago, emisión.

**Lo que la hace fuerte para *este* curso.**

- **Es el trade-off más limpio y más defendible que existe:** consistencia contra
  disponibilidad bajo ráfaga. No sobrevender contra no rechazar ventas. Cae exactamente
  sobre el ejemplo trabajado de **CAP de la lámina 23**, que el profesor ya usó como
  plantilla de razonamiento.
- Atributos de calidad fáciles de enunciar **y de medir**: cero sobreventa, P99 de la cola,
  disponibilidad en el minuto pico, tasa de bots bloqueados, trazabilidad de cada reserva.
- **Es la más fácil de demostrar el 26.** Una prueba de carga contra el sistema, en vivo,
  con el contador de sobreventa en cero, es una sustentación que se defiende sola.
- Encaja perfecto con el ensayo de **Kafka vs. RabbitMQ** del viernes 11: cola de turnos
  (RabbitMQ) contra log de eventos de reserva y auditoría (Kafka). El ensayo y el proyecto
  se alimentan.

**Dónde falla.**

- **Es la idea más trillada del catálogo.** Boletería de alta demanda es *el* proyecto de
  todo curso de arquitectura. La probabilidad de que otro equipo llegue con lo mismo es
  alta.
- **Colinda con el caso propio del profesor.** La lámina 53 es control de acceso en un
  estadio. No es lo mismo (venta ≠ ingreso), pero es el mismo mundo, y presentar una
  variante del ejemplo del profesor limita el techo: se evalúa contra su propia versión.
- El archivo, tal como está, **no llena la sección que decide** de la plantilla: no hay
  atributos de calidad medibles (dice «disponibilidad», no «cero sobreventa con 20.000
  usuarios concurrentes»), no hay tensión arquitectónica enunciada, no hay alcance
  demostrable, no hay quién paga ni cuánto. Eso es arreglable en una hora, pero hoy la idea
  se está presentando por debajo de lo que vale.
- El modelo de negocio es correcto pero **plano**: comisión por boleta, como todos. No hay
  una decisión de negocio interesante que la arquitectura habilite.

### C — Plataforma de nutrición y clínicas (Quinnie) · SaaS multi-tenant

[`ideas/idea-quinnie.md`](ideas/idea-quinnie.md)

**Qué es.** SaaS para nutricionistas y clínicas: planes, menús, agenda, adherencia,
facturación, multi-tenant, con teleconsulta e integraciones.

**Lo que la hace fuerte.**

> Revisado el 2026-09-07 con el documento ya completo (9 secciones). El veredicto no
> cambia, pero las razones sí: es el documento más completo de los tres, y por eso vale
> más como fuente que como proyecto.

- **Es, de lejos, el mejor caso de negocio de los tres.** Fuentes de ingreso, go-to-market,
  unit economics, LTV/CAC, sensibilidad de precio, COGS y break-even. Eso es el paso 1 y
  buena parte de los pasos 2 y 3 de la lámina 55, ya resueltos.
- **El problema está enunciado con precisión**, que es lo más difícil: «el nutricionista
  prescribe en PDF/Excel; el paciente no lo ejecuta» y «no hay trazabilidad entre plan →
  compra → cocina → resultado clínico». Eso es un dolor concreto, no una generalidad.
- **Tiene el catálogo, los 20 casos de uso y el mapa producto → valor por actor**, separados
  por actor (profesional y paciente). Es material de Canvas listo para usar.
- Toca temas que puntúan: multi-tenant, datos sensibles de salud, privacidad por diseño,
  auditoría clínica.

**Dónde falla como *proyecto de este curso*.**

- **La riqueza arquitectónica es amplia pero poco profunda.** El propio documento dice
  «viable como MVP con monolito modular» y que los microservicios se justifican después del
  product-market fit. Tiene razón como consultoría, y por eso mismo es mala noticia aquí:
  el curso evalúa decisiones de arquitectura con tensión, y aquí no hay volumen, ni tiempo
  real, ni ráfaga, ni distribución.
  Los 20 casos de uso ahora visibles lo confirman: **P-01 a P-10 y U-01 a U-10 son todos
  CRUD y flujo de trabajo.** Configurar disponibilidad, crear plan, registrar notas,
  consultar menú, generar lista de compra. El único con tensión es P-02, «agenda sin doble
  booking», y el propio documento ya lo resuelve con lock optimista.
- **Es la más difícil de demostrar en 3 semanas, y el documento completo lo empeora.** Ya
  estimaba el MVP en **12 a 16 semanas**; ahora se ve el alcance real: **9 productos y 20
  casos de uso**. Tenemos tres semanas, tres personas, y encima las entregas 1 y 2. El
  recorte necesario deja en la sustentación un CRUD de citas con menús.
- **Las cifras están inventadas.** El documento lo admite al final («hipótesis de trabajo,
  no una cotización real»), pero llegan al lector como una tabla de USD 57.640 de MRR sin
  marca `[S]` en cada línea. Es exactamente el riesgo que advierte la lámina 56 y la regla
  de `AGENTS.md`. Se arregla marcando, pero hay que arreglarlo.

### D — Enchufe (síntesis del equipo) · reparto de potencia para carga eléctrica

[`ideas/idea-enchufe.md`](ideas/idea-enchufe.md) · **propuesta de cierre, 2026-09-07**

**Qué es.** Doce carros eléctricos cargando en un edificio cuya instalación aguanta cuatro
al tiempo, sin tumbar el breaker, y con una promesa por carro: «a las 6 a.m. tiene su 80%».
Si no se cumple, no se cobra el mes.

**Por qué existe esta cuarta opción.** No es una idea nueva: es la fusión de las tres,
armada para conservar lo bueno de cada una y quitarle a cada una su contra.

| Contra que tenía | Cómo lo resuelve Enchufe |
|---|---|
| **Ventana:** el supuesto que la sostiene no se puede validar esta semana | Aquí la validación se hace **caminando**: tres administradores de propiedad horizontal. El sustituto contra el que competimos —reforzar la acometida— tiene un precio cotizable |
| **Ventana:** riesgo de volverse un proyecto de predicción | El corazón es el invariante y el borde autónomo. El repartidor puede ser deliberadamente simple |
| **Ventana:** la demo se lee como «un script que simula» | El simulador reemplaza **solo el hardware**. Los puntos de carga hablan un protocolo real contra servicios reales — que es como la industria prueba esto |
| **Ticketera:** trillada y colinda con la lámina 53 | Nadie llega con esto, y no se parece a ninguno de los dos casos del profesor |
| **Ticketera:** una sola tensión, resuelta en la literatura | Cuatro tensiones, y la de CAP tiene **consecuencia física**: elegir disponibilidad arriesga dejar el edificio a oscuras |
| **Ticketera:** modelo de negocio plano | La promesa de hora de entrega **es** el producto, y la arquitectura es lo que la hace posible |
| **Nutrición:** amplia pero sin tensión dura | Invariante físico, binario y no negociable |
| **Nutrición:** 9 productos y 20 casos de uso en 3 semanas | Un solo flujo: conectar → prometer → repartir → vigilar → cumplir |
| **Nutrición:** cifras inventadas | Todo `[S]` con responsable, y las cinco validaciones son consultables esta semana |

**Lo que además gana.**

- **Invariante duro, binario y visible**, como el de Lina, pero **físico**: si se pasa, se
  cae el edificio. No es una regla que un product owner pueda relajar.
- **Presupuesto escaso que hay que repartir**, como el de Alejo, pero que **cambia solo**:
  hay 40 kW ahora y 25 en cinco minutos porque arrancó el ascensor.
- **Operación offline obligatoria.** Si se cae la red, los puntos no pueden apagarse ni
  seguir a máxima potencia. Es el atributo de resiliencia de la lámina 53 en otro dominio.
- **Multi-tenant B2B2C**, como el de Quinnie: cada edificio y cada flota es un tenant, y
  toda su estructura financiera aplica tal cual.
- **Encaja con el ensayo del viernes 11.** Telemetría de los puntos (flujo de alto volumen
  con *replay* para reconstruir la facturación → Kafka) contra comandos a un punto concreto
  (enrutamiento y respuesta → RabbitMQ). Es el caso de «combinarlos» de
  [`mensajeria-pubsub.md`](../../curso/mensajeria-pubsub.md#combinarlos), tal cual.

**Dónde falla.**

- `[S]` **Puede ser temprano en el mercado.** Es el riesgo real: el problema es cierto, pero
  puede que todavía no haya suficientes edificios con más de un carro eléctrico. Si la
  validación dice que sí, el segmento de entrada pasa a ser **flotas**, donde la densidad ya
  existe. La idea no se cae; se mueve de segmento.
- **Nadie del equipo trae este dominio de entrada.** El dominio es superficial —presupuestos
  de potencia y horarios, sin física complicada—, pero hay que aceptarlo.
- **Llega el mismo día de la reunión.** Nadie ha invertido en ella todavía, y eso hay que
  reconocerlo antes de votar.

---

## Matriz

> Puntaje 1 a 5. Total = suma de (puntaje × peso).
> **C1 a C4: propuesta del análisis previo. C5: se llena en la reunión.**
> El total mostrado es sobre el 90% (C1-C4) reescalado a 5,0.

| Idea | Autor | C1 (30%) | C2 (25%) | C3 (20%) | C4 (15%) | C5 (10%) | **Total C1-C4** |
|---|---|---|---|---|---|---|---|
| **Ventana** — tiquetes con garantía | Alejo | **5** | 4 | 4 | 3 | _ | **4,17** |
| **Ticketera** — boletería alta demanda | Lina | 4 | **5** | 4 | 4 | _ | **4,28** |
| **Nutrición** — SaaS clínicas | Quinnie | 3 | 2 | **5** | 3 | _ | **3,17** |
| **Enchufe** — reparto de potencia | Síntesis | **5** | **5** | 4 | **5** | _ | **4,78** |

**Cómo leer esto.** Entre las tres ideas originales, Ventana y Ticketera quedaron
**empatadas dentro del margen de error del ejercicio** —0,11 puntos, con puntajes que son
juicios y no mediciones— y Nutrición quedó fuera como proyecto, aunque es el mejor caso de
negocio. **Enchufe se separa medio punto** porque no compite con las tres: nace de ellas,
armada para quedarse con lo bueno de cada una y quitarle su contra.

Sustento de los puntajes que más pesan:

- *C1 Enchufe = 5.* Cuatro tensiones, y una de ellas es CAP con consecuencia física.
  Invariante duro y binario, presupuesto que cambia solo, operación offline obligatoria,
  exposición de la promesa.
- *C1 Ventana = 5.* Presupuesto finito sobre espacio infinito, dato que caduca, exposición
  financiera acotada, reconstrucción histórica de la recomendación. Tres tensiones.
- *C1 Ticketera = 4.* La tensión es real y ejemplar, pero **es una sola** (consistencia vs.
  disponibilidad) y viene resuelta de fábrica en la literatura.
- *C2 Enchufe = 5.* Un solo flujo, cuatro componentes, y una demo binaria: el breaker se
  cae o no se cae, en pantalla.
- *C2 Ticketera = 5.* Prueba de carga en vivo, resultado binario y visible.
- *C2 Ventana = 4.* Hay que construir simulador + priorizador + estimador + garantía.
- *C3 Enchufe = 4.* Los pagadores están claros y el sustituto tiene precio cotizable, pero
  `[S]` el mercado puede ser temprano. Es su único riesgo real.
- *C4 Enchufe = 5.* La validación se hace caminando: tres administradores esta semana.
- *C4 Ventana = 3.* La demo no depende de nadie, pero **validar el supuesto de negocio sí**
  requiere datos reales de precios que todavía no tenemos.

---

## Recomendación

**Enchufe**, con **Ventana** como respaldo y **Ticketera** como red de seguridad.

[`ideas/idea-enchufe.md`](ideas/idea-enchufe.md)

Las razones, en orden:

1. **Es la única con un invariante que no se puede negociar.** «La suma de la potencia
   entregada no supera la capacidad contratada» no es una regla de negocio que alguien
   pueda relajar en una reunión: si se pasa, se cae el breaker y el edificio se queda a
   oscuras. Eso convierte la sustentación en algo que se ve, no que se explica.
2. **Tiene cuatro tensiones, y una es CAP con consecuencia física.** Cuando se cae la red,
   elegir consistencia deja carros sin cargar y elegir disponibilidad arriesga el breaker.
   Es el ejemplo trabajado de la lámina 23 con un desenlace que se puede mostrar en vivo.
3. **La arquitectura tiene precio en pesos** —lo mejor que tenía Ventana— pero aquí la
   cifra se sostiene en datos consultables, no en un supuesto que no podemos validar antes
   del sábado.
4. **Se valida caminando.** Tres administradores de propiedad horizontal esta semana
   convierten la premisa central de `[S]` a `[V]`. Es exactamente lo que pide la lámina 56,
   y es lo que ninguna de las otras tres permite hacer a tiempo.
5. **Nadie más va a llevar esto**, y no se parece a ninguno de los dos casos del profesor.
6. **Conserva el trabajo de los tres.** El invariante bajo ráfaga es de Lina; el presupuesto
   escaso y la promesa respaldada son de Alejo; el multi-tenant B2B2C y toda la estructura
   financiera son de Quinnie. Nadie pierde su idea: las tres están adentro.

**El reparo honesto.** Llega el mismo día de la reunión y nadie ha invertido en ella
todavía. Si el equipo no la compra en la discusión, **no hay que forzarla**: Ventana sigue
siendo una gran idea y la Ticketera sigue siendo la ruta más segura a una nota alta. Un 4,5
sólido con una idea que el equipo quiere vale más que un 3,5 con una que le impusieron.

### Condiciones para que Enchufe llegue a 5,0

1. **Hacer las cinco validaciones esta semana**, empezando por los tres administradores.
   Es lo que separa un caso de negocio con `[V]` de uno con puros `[S]`.
2. **Fijar hoy que el corazón es el invariante, la promesa y el borde autónomo** — no el
   algoritmo de optimización. El repartidor puede ser deliberadamente simple, y eso se dice
   en la sustentación como decisión consciente de alcance.
3. **Construirlo como sistema real, no como script.** Servicios separados, broker real,
   almacenamiento real, y puntos de carga simulados hablando un protocolo real por red. El
   simulador reemplaza el hardware, no la arquitectura.
4. **Verificar si algún fabricante ya vende esto en Colombia con compromiso de hora.** Es
   la objeción que va a llegar en la sustentación.
5. **Preparar el momento del breaker desde ya.** Es la demo que cierra la defensa, y
   conviene que esté funcionando antes del 19, no el 25.

### Qué se le roba a cada idea descartada


Las ideas no elegidas no se botan: alimentan el entregable. Si se elige Enchufe esto ya
está medio hecho, porque nace de ellas — pero el material concreto hay que traerlo:

- **De Nutrición (Quinnie):** *la estructura financiera completa.* Fuentes de ingreso,
  unit economics, LTV/CAC, sensibilidad de precio, COGS, break-even. Ese esqueleto aplicado
  a Ventana —costo por consulta al proveedor, tarifa de la garantía, tasa esperada de pago
  de garantías, margen— convierte el caso de negocio de bueno a sobresaliente, y es
  exactamente lo que pide el paso 1 de la lámina 55. También su tabla de fases MVP →
  Growth → Scale sirve tal cual para el **paso 6 (estrategia de implementación)**.
- **De la Ticketera (Lina):** *la disciplina de la ráfaga.* Enchufe tiene su pico todos los
  días entre 6 y 9 de la noche. El enunciado de atributos bajo ráfaga, la
  degradación controlada y la prueba de carga como evidencia vienen de ahí. Y la pregunta
  «¿qué pasa si el sistema se cae en el minuto que más importa?» hay que responderla igual.

---

## Preguntas para presionar cada idea

Vale más una idea que sobreviva a estas preguntas que una que puntúe alto.
Respuestas del análisis previo, para contrastar en la reunión:

| # | Pregunta | **Enchufe** | **Ventana** | **Ticketera** | **Nutrición** |
|---|---|---|---|---|---|
| 1 | ¿Atributo de calidad **medible**? | Potencia entregada nunca por encima del techo contratado; % de promesas cumplidas | Antigüedad mediana del dato en rutas con garantía activa; costo de observación por recomendación | Cero sobreventa con N usuarios concurrentes; P99 de la cola | Sin doble booking. Poco más |
| 2 | ¿Qué dos cosas deseables se contradicen? | Cuando no alcanza, ¿quién carga primero? Y: energía barata contra promesa | Frescura contra cobertura, con el mismo presupuesto | No sobrevender contra no rechazar ventas | Nada duro. Es el punto débil |
| 3 | ¿Salen 3 OKR con KR numéricos? | Sí, y son medibles solas | Sí, ya hay borrador | Sí, fáciles de escribir | Sí, es su fortaleza |
| 4 | ¿Qué se muestra el 26? | El breaker cayéndose con la política ingenua y aguantando con la nuestra | Misma temporada, dos políticas, dos números enfrentados | Prueba de carga con sobreventa en cero | Un CRUD de citas. Ahí duele |
| 5 | ¿Quién paga y por qué cambia? | El administrador, por poder decir que sí sin riesgo | El viajero, por dejar de apostar | El organizador, por no colapsar | Clínicas y pacientes. Bien resuelto |
| 6 | ¿Qué dato falta y se consigue esta semana? | Si hay edificios con el problema: **sí, preguntando** | Variabilidad real de precios: sí, observando rutas | Volúmenes de venta de conciertos: parcial | Tamaño de mercado y precios: no |

---

## Arreglos pendientes en los archivos de ideas

Independiente de cuál se elija, hay que dejar los tres archivos presentables: el ADR 0001
va a citarlos como sustento de la decisión.

- [x] `idea-quinnie.md` — completo desde el 2026-09-07: las 9 secciones están.
- [ ] `idea-quinnie.md` — renombrar a `idea-quinnie.md` (doble punto en el nombre) y
      marcar `[S]` cada cifra de las tablas de unit economics.
- [ ] `idea-lina.md` — completar la sección «Por qué sirve para este curso» de la plantilla:
      atributos medibles, tensión arquitectónica, alcance demostrable, quién paga.
- [ ] `idea-alejo-ventana.md` — asignar responsable a las cuatro validaciones.

---

## Decisión

**Idea elegida:** **Boletería de alta demanda** (Lina), refinada como **«TicketRight»** —
[`ideas/idea-lina.md`](ideas/idea-lina.md)
**Fecha:** 7 de septiembre de 2026
**Razón principal:** es la única cuya demostración es **binaria y verificable frente al
evaluador** —el contador de sobreventa y el de discrepancias dinero–boleta están en cero o
no lo están—, la ráfaga es planificable, y toda la demo depende solo de nosotros. Es la de
menor riesgo de ejecución en tres semanas, y el riesgo de ejecución es el que más amenaza
el 60% que valen las entregas 2 y 3.
**Qué se descartó y por qué:** registrado en
[`../decisiones/0001-idea-de-negocio.md`](../decisiones/0001-idea-de-negocio.md) (AD-001),
con las cuatro alternativas y lo que se sacrificó.

> **Nota sobre la matriz.** Enchufe puntuaba más alto (4,78 contra 4,28) y el equipo eligió
> distinto. Está bien y así debe quedar registrado: la matriz ordena la conversación, no
> decide. C5 —conocimiento e interés del equipo— es el criterio que ella no puede puntuar,
> y es el que sostiene tres semanas de trabajo. La contrapartida es explícita: **lo que
> Enchufe ganaba en diferenciación hay que construirlo aquí a mano**, y por eso el documento
> de la idea abre con la tesis que nos separa del grupo que traiga lo mismo.

✅ Registrado en `../decisiones/0001-idea-de-negocio.md`. ✅ `ESTADO.md` actualizado.
