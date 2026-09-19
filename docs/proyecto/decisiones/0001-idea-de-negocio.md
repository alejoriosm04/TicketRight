# AD-001 — Idea de negocio del proyecto integrador

**Fecha:** 2026-09-07 · **Estado:** Aceptada
**Participan:** Alejo, Lina, Quinnie

> El 7 de septiembre la idea se llamaba **«Puesto»**. El nombre definitivo, con el que se
> entregó el caso de negocio el 12 de septiembre, es **TicketRight**. La decisión de fondo
> —el negocio, el problema y la frontera— no cambió.

## 1. Decisión arquitectónica

El proyecto integrador se construirá sobre **una plataforma de venta de boletería para
eventos de alta demanda («TicketRight»)**, cuyo problema central es sostener la correspondencia
entre el dinero cobrado y el derecho a entrar durante una ráfaga de demanda concentrada,
sobre un aforo que no puede excederse.

## 2. Identificador único

AD-001

## 3. Problema o asunto

El proyecto integrador vale el 80% del curso y se acumula en tres entregas: caso de
negocio, modelamiento e implementación. La idea elegida condiciona las tres. Se necesitaba
un negocio que fuera real y defendible **y** que exigiera decisiones de arquitectura con
trade-offs demostrables el 26 de septiembre.

Cada integrante presentó una idea el 7 de septiembre. La decisión debía tomarse ese día:
cada día de indecisión sale del tiempo del caso de negocio.

## 4. Supuestos

| # | Supuesto | Marca |
|---|---|---|
| 1 | Hay suficientes eventos de 3.000 a 40.000 asistentes al año en Colombia como para sostener el negocio | `[S]` Validación nº 1 |
| 2 | Los promotores están insatisfechos con las plataformas que usan hoy, sea por caídas o por no recibir datos del comprador | `[S]` Se valida con una conversación |
| 3 | Una fracción relevante de las boletas termina en reventa con sobreprecio, y ese margen hoy no lo captura el promotor | `[S]` Sin verificar |
| 4 | El aforo es un límite legal y físico, no una regla de negocio relajable | `[S]` Verificar norma aplicable |
| 5 | Toda la demostración del 26 de septiembre puede hacerse con carga simulada y una pasarela de pagos simulada, sin contratar terceros | `[V]` Depende solo de nosotros |
| 6 | El equipo dispone de tres semanas y tres personas, en paralelo con las entregas 1 y 2 | `[V]` Syllabus, lámina 5 |

## 5. Alternativas

| # | Alternativa | A favor | En contra |
|---|---|---|---|
| 0 | **Mantener lo actual** — seguir sin idea y decidir después | Más tiempo para validar mercado | Bloquea la Entrega 1, que vence el 12 de septiembre. La semana 1 es la única con holgura |
| 1 | **Boletería de alta demanda** (Lina) | Invariante duro, binario y verificable en vivo; trade-off de CAP directo sobre la lámina 23; la demo más fácil de acotar y la más difícil de arruinar; encaja con el ensayo de mensajería | Es el caso más frecuente en cursos de arquitectura; colinda con el control de acceso de la lámina 53; el modelo de negocio base es plano |
| 2 | **Ventana** — recomendación de compra de tiquetes con garantía de precio (Alejo) | Tensión fresca (presupuesto finito de observación); el error tiene precio en pesos; protagonismo de la arquitectura de datos, dominio poco trabajado | Su premisa central —que el precio se mueve con patrón— no se puede validar antes del 12; riesgo de derivar en un proyecto de predicción; la demo puede leerse como un simulador |
| 3 | **Plataforma de nutrición y clínicas** (Quinnie) | El mejor caso de negocio de todos: unit economics, LTV/CAC, COGS, break-even | Amplia pero sin tensión arquitectónica dura: el único invariante es el doble booking. Su propio documento estima el MVP en 12–16 semanas, y tenemos tres |
| 4 | **Enchufe** — reparto de potencia para carga eléctrica en propiedad horizontal (síntesis) | Invariante físico; cuatro tensiones incluida CAP con consecuencia física; premisa validable esta semana; nadie más la llevaría | Llegó el mismo día de la reunión, sin que nadie del equipo hubiera invertido en ella ni conociera el dominio |

Matriz de puntajes y análisis completo en
[`../01-caso-de-negocio/evaluacion-ideas.md`](../01-caso-de-negocio/evaluacion-ideas.md).

## 6. Decisión

Se elige la **Alternativa 1 — boletería de alta demanda**, refinada y documentada en
[`../01-caso-de-negocio/ideas/idea-lina.md`](../01-caso-de-negocio/ideas/idea-lina.md).

## 7. Justificación

**El atributo de calidad que sustenta la decisión es la correspondencia entre dinero y
boleta bajo demanda concentrada**, acompañado del aforo no excedido. Ambos son medibles,
binarios y demostrables en vivo: o hubo un cobro sin boleta, o no lo hubo.

Razones, en orden:

1. **Es la única alternativa cuya demostración es binaria y verificable frente al
   evaluador.** El 26 de septiembre no hay que argumentar que funcionó: se ve.
2. **La ráfaga es planificable.** Sabemos el día y la hora del pico, lo que convierte la
   elasticidad en una decisión costeable y no en un problema abierto.
3. **Toda la demostración depende solo de nosotros**, incluida la pasarela de pagos, que se
   simula hostil a propósito.
4. **Es la de menor riesgo de ejecución** en tres semanas, y el riesgo de ejecución es el
   que más amenaza el 60% que valen las entregas 2 y 3.

**Qué se sacrificó a cambio:**

- **Originalidad de partida.** Es el caso más frecuente en cursos de arquitectura, y hay
  que asumir que otro grupo llegará con algo parecido. Se compensa con las cinco decisiones
  de diferenciación registradas en el documento de la idea —invariante monetario, dos
  modelos de consistencia, la fila como producto, la reventa como ingreso y el costo por
  boleta como atributo—, no con más funcionalidad.
- **La tensión fresca de Ventana** y el dominio de arquitectura de datos, que quedan sin
  trabajar.
- **La profundidad financiera del caso de Quinnie**, que se recupera parcialmente
  reutilizando su estructura de unit economics en el caso de negocio.

## 8. Implicaciones

1. **La Entrega 1 se desbloquea hoy.** Canvas y los seis pasos de la lámina 55 arrancan
   sobre esta idea.
2. **Los umbrales numéricos de los atributos de calidad hay que fijarlos en la Entrega 1**,
   no en la 3. Sin ellos no hay contra qué evaluar la arquitectura de la Entrega 2.
3. **Queda condicionada la decisión de mensajería** (AD-002, pendiente): el bus de eventos
   de venta necesita *replay* para reconstruir la conciliación, lo que inclina hacia un log
   de eventos; la cola de turnos apunta a otra herramienta. El ensayo del viernes 11 sobre
   Kafka y RabbitMQ alimenta directamente esa decisión.
4. **Queda condicionada la decisión de modelo de consistencia por tipo de inventario**
   (AD-003, pendiente): silla numerada y localidad general no se resuelven igual.
5. **Se declara una frontera de contexto:** el control de acceso en puerta —el caso de la
   lámina 53— **no es parte de este sistema**. Se integra por contrato de eventos. Esta
   frontera debe aparecer explícita en el modelamiento de la Entrega 2.
6. **Alcance congelado para la Entrega 3:** flujo de venta con pasarela hostil y los dos
   tipos de inventario. Reventa y devolución masiva se **modelan** en la Entrega 2 y solo
   se implementan si sobra tiempo.
7. **Costo de revertir:** alto después del 19 de septiembre. Cambiar de idea tras la
   Entrega 2 obligaría a rehacer el modelamiento completo con una semana disponible. Antes
   del 12 el costo es moderado: se perdería el caso de negocio, no la arquitectura.
8. **Las ideas descartadas no se borran.** Quedan en `ideas/` como respaldo y como sustento
   de este ADR.
