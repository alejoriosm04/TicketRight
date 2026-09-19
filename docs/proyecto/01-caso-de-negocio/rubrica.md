# Rúbrica — Entregable 1: Modelamiento del caso de negocio

**Peso del entregable dentro del proyecto integrador:** 20%

> Original del profesor: [`curso/material/2026-09-08-rubrica-entregable-1.pdf`](../../curso/material/2026-09-08-rubrica-entregable-1.pdf).

---

## 1. Premisas, supuestos y restricciones — 10%

### Puntos específicos a evaluar

- Identificación de supuestos y restricciones.
- Claridad y precisión de cada supuesto.
- Justificación de los supuestos.
- Identificación del impacto de cada supuesto/restricción sobre el negocio.
- Consistencia entre los supuestos y el resto del caso.

### Criterio clave

No se debe premiar la cantidad de supuestos, sino su relevancia.

Un equipo que presenta 30 supuestos genéricos no debería obtener mejor valoración que uno que identifica 8 supuestos críticos y explica correctamente su impacto.

---

## 2. Alcance y definición completa del caso de negocio — 15%

### Puntos específicos a evaluar

- Problema u oportunidad claramente definido.
- Contexto y actores involucrados.
- Necesidad o dolor del cliente/usuario.
- Propuesta de solución a alto nivel.
- Delimitación del alcance: qué está incluido y qué está fuera.
- Relación con los supuestos y restricciones.
- Coherencia y consistencia general.

### Pregunta de control

Cualquier persona que lea debería poder responder después de leer esta sección:

> "¿Qué problema estamos resolviendo, para quién, por qué y exactamente hasta dónde llega este proyecto?"

Si no puede responderlo, el alcance no está suficientemente definido.

---

## 3. Business Model Canvas — 25%

Se recomienda evaluar explícitamente los 9 bloques estándar del Business Model Canvas, pero además evaluar la coherencia entre ellos.

### Puntos específicos a evaluar

- Segmentos de clientes.
- Propuesta de valor.
- Canales.
- Relaciones con clientes.
- Fuentes de ingresos.
- Recursos clave.
- Actividades clave.
- Socios clave.
- Estructura de costos.
- Coherencia horizontal entre los nueve bloques.
- Coherencia con supuestos, restricciones y alcance.

### Criterio pedagógico importante

Un Canvas no obtiene una calificación alta por estar "lleno". Obtiene una calificación alta cuando los nueve bloques cuentan una historia empresarial coherente.

**Ejemplo de coherencia:**

- Segmento → Problema → Propuesta de valor → Canal → Relación → Ingreso debe tener una lógica clara.
- Propuesta de valor → Actividades → Recursos → Socios → Costos también debe ser coherente.

---

## 4. Modelo de costos: ingresos vs. costos — 25%

Este componente es particularmente importante porque permite evaluar si los estudiantes están construyendo un negocio viable, y no solamente una buena idea.

### Puntos específicos a evaluar

- Identificación de fuentes de ingresos.
- Identificación de costos fijos.
- Identificación de costos variables.
- Relación entre costos y actividades/recursos del Canvas.
- Supuestos utilizados para las estimaciones.
- Proyección de ingresos.
- Proyección de costos.
- Relación ingresos–costos.
- Identificación de punto de equilibrio o indicadores de viabilidad cuando aplique.
- Coherencia financiera con el modelo de negocio.

### Una distinción que se recomienda exigir

Los estudiantes deben diferenciar:

> "¿Cuánto cuesta?" de "¿Qué genera el costo?"

**Ejemplo:**

❌ Menos útil: *Servidores: $X*

✅ Más útil: *100.000 transacciones/mes × costo por transacción = $X*

Esto empieza a introducir el pensamiento arquitectónico: los costos deben estar relacionados con los drivers del negocio y, posteriormente, con los drivers tecnológicos.

---

## 5. Definición de OKR — 25%

Se recomienda evaluar que los OKR no sean simplemente una lista de tareas.

### Puntos específicos a evaluar

- Calidad de los Objectives.
- Relevancia estratégica de los Objectives.
- Calidad de los Key Results.
- Medición y cuantificación.
- Alineación con el modelo de negocio.
- Alineación con la propuesta de valor.
- Trazabilidad hacia ingresos, clientes, costos o crecimiento.
- Ambición y realismo de los resultados.
- Ausencia de confusión entre Key Results y tareas/iniciativas.

---

## Matriz consolidada para calificación

| Componente | Peso dentro del entregable | Qué se evalúa |
|---|---|---|
| 1. Premisas, supuestos y restricciones | 10% | Calidad y explicitud de las condiciones bajo las cuales se construye el caso |
| 2. Alcance y definición del caso de negocio | 15% | Claridad, delimitación y coherencia del problema/oportunidad |
| 3. Business Model Canvas | 25% | Construcción integral y coherente del modelo de negocio |
| 4. Modelo de costos e ingresos | 25% | Viabilidad económica y relación ingresos–costos |
| 5. Definición de OKR | 25% | Capacidad de traducir el modelo de negocio en objetivos y resultados medibles |

---

## Regla de consistencia transversal

**El caso de negocio debe ser trazable**

El profesor debería poder seguir esta cadena:

```
PREMISAS
   ↓
SUPUESTOS
   ↓
RESTRICCIONES
   ↓
PROBLEMA / OPORTUNIDAD
   ↓
ALCANCE
   ↓
BUSINESS MODEL CANVAS
   ↓
INGRESOS ─────── COSTOS
   ↓
VIABILIDAD DEL NEGOCIO
   ↓
OKR
```

### Ejemplo de trazabilidad:

**Supuesto:** El 60% de los clientes utilizará el canal digital.

↓

**Canvas – Segmento:** Clientes recurrentes con alta adopción digital.

↓

**Propuesta de valor:** Servicio digital con atención 24/7.

↓

**Canal:** Aplicación móvil y web.

↓

**Ingreso:** Suscripción mensual.

↓

**Costo:** Infraestructura, desarrollo, operación y soporte.

↓

**OKR:** Incrementar la adopción digital del 40% al 60% durante los primeros 12 meses.

---

Eso demuestra que el modelo de negocio fue razonado. En cambio, si cada sección parece haber sido construida independientemente, debería penalizarse la calificación, aunque cada documento, considerado aisladamente, "se vea bien".

El propósito del entregable es demostrar que el equipo entiende qué negocio está intentando soportar.

**Para después responder a la siguiente pregunta:** ¿Qué decisiones arquitectónicas se justifican a partir de este modelo de negocio?

Y conectar:

OKR → atributos de calidad → decisiones arquitectónicas → costos de arquitectura → riesgos → arquitectura final.

Así, el Business Canvas deja de ser un ejercicio de emprendimiento aislado y se convierte en el punto de partida para las decisiones de arquitectura.

---

## Rúbricas de evaluación por criterio

### 1. Premisas, supuestos y restricciones

| Nivel | Descripción |
|---|---|
| **5 – Excelente** | Identifica de manera completa y estructurada las principales premisas, supuestos y restricciones del caso. Cada uno está claramente formulado, es razonable y está justificado. Explica explícitamente cómo afectan las decisiones del modelo de negocio. Existe una clara trazabilidad entre estos elementos y el alcance, Canvas, modelo financiero y OKR. |
| **4 – Sobresaliente** | Identifica la mayoría de los supuestos y restricciones relevantes. Están claramente formulados y razonablemente justificados. Se evidencia su impacto sobre el negocio y existe buena coherencia con los demás componentes del entregable. Puede faltar alguna condición secundaria o alguna relación podría estar mejor explicada. |
| **3 – Buena** | Identifica los principales supuestos y restricciones, pero algunos son genéricos, poco justificados o no explican claramente su impacto. Existe una relación básica con el modelo de negocio, aunque algunas decisiones aparecen desconectadas de los supuestos. |
| **2 – Suficiente** | Presenta algunos supuestos y restricciones, pero de manera superficial, incompleta o ambigua. Hay poca justificación y escasa evidencia de que hayan sido utilizados para construir el modelo de negocio. Se observan inconsistencias entre los supuestos y otras partes del caso. |
| **1 – Insuficiente** | No identifica adecuadamente los supuestos y restricciones, o estos son irrelevantes, contradictorios o simplemente declarativos. No existe evidencia de que hayan servido como base para las decisiones del caso de negocio. |

### 2. Alcance y definición del caso de negocio

| Nivel | Descripción |
|---|---|
| **5 – Excelente** | El caso de negocio presenta un problema/oportunidad claro, relevante y bien delimitado. Identifica actores, clientes, usuarios y contexto. Explica claramente la necesidad que origina el proyecto y plantea una solución coherente a nivel de negocio. Define explícitamente qué está dentro y fuera del alcance. El alcance se deriva de los supuestos y restricciones y proporciona una base sólida para el Canvas y el modelo financiero. |
| **4 – Sobresaliente** | El problema, contexto, actores y solución están claramente definidos. El alcance está bien delimitado y permite entender qué se pretende resolver. Existe buena relación con los supuestos y restricciones, aunque algunos elementos podrían estar mejor delimitados o justificados. |
| **3 – Buena** | El problema y la solución son comprensibles, pero existen ambigüedades en actores, contexto o límites. El alcance está definido de manera general, aunque puede incluir elementos demasiado amplios o poco precisos. La relación con los supuestos es parcial. |
| **2 – Suficiente** | La descripción permite entender parcialmente el proyecto, pero el problema o la oportunidad no está suficientemente delimitado. El alcance es ambiguo y existen elementos que deberían estar dentro/fuera sin estar claramente definidos. |
| **1 – Insuficiente** | No es posible determinar con claridad cuál es el problema, oportunidad o necesidad que se quiere resolver. El alcance es inexistente, excesivamente amplio o contradictorio. No existe relación clara con los supuestos y restricciones. |

### 3. Business Model Canvas

| Nivel | Descripción |
|---|---|
| **5 – Excelente** | Los 9 bloques del Business Model Canvas están completos, claramente definidos y sustentados. Existe una relación lógica entre segmentos, propuesta de valor, canales y relaciones. Los recursos, actividades y socios soportan la propuesta de valor. Los ingresos y costos son coherentes con la operación planteada. El Canvas refleja explícitamente los supuestos, restricciones y alcance definidos previamente. Se evidencia un modelo de negocio integral y consistente, no simplemente nueve bloques independientes. |
| **4 – Sobresaliente** | Los 9 bloques están correctamente desarrollados y existe una buena relación entre ellos. La propuesta de valor responde a necesidades concretas de los segmentos definidos. Los mecanismos de ingresos, costos, recursos y actividades son razonables. Presenta pequeñas inconsistencias o aspectos que podrían profundizarse. |
| **3 – Buena** | Los 9 bloques están presentes y permiten entender el modelo de negocio, pero algunos están formulados de manera genérica o presentan conexiones débiles. Hay coherencia general, aunque algunos elementos parecen definidos de forma independiente. |
| **2 – Suficiente** | El Canvas está incompleto, presenta bloques poco desarrollados o contiene afirmaciones genéricas. Existen contradicciones entre algunos bloques y la conexión con los supuestos, alcance o problema es débil. |
| **1 – Insuficiente** | El Canvas está incompleto, mal estructurado o no corresponde al modelo de negocio planteado. Los bloques presentan contradicciones importantes y no existe una relación lógica entre la propuesta de valor, clientes, ingresos, costos y operación. |

### 4. Modelo de costos e ingresos

| Nivel | Descripción |
|---|---|
| **5 – Excelente** | Presenta un modelo financiero estructurado, cuantificado y sustentado en supuestos explícitos. Identifica claramente fuentes de ingresos, costos fijos y variables y sus principales inductores. Las cifras tienen una justificación razonable. Existe trazabilidad entre los costos, recursos/actividades del Canvas y las fuentes de ingresos. Presenta proyecciones y analiza la relación ingresos–costos, incluyendo indicadores relevantes como margen, punto de equilibrio o rentabilidad cuando sean pertinentes. |
| **4 – Sobresaliente** | Presenta ingresos y costos correctamente identificados y cuantificados. Diferencia adecuadamente costos fijos y variables y utiliza supuestos razonables. Existe coherencia con el Canvas y se realiza un análisis adecuado de la viabilidad económica, aunque puede faltar profundidad en escenarios, sensibilidad o algunos indicadores. |
| **3 – Buena** | Identifica las principales fuentes de ingresos y costos y presenta estimaciones cuantitativas razonables. Sin embargo, algunos valores carecen de justificación o existen debilidades en la clasificación y relación entre costos e ingresos. La viabilidad económica se analiza de forma básica. |
| **2 – Suficiente** | Presenta una aproximación de ingresos y costos, pero con poca sustentación, supuestos débiles o errores de clasificación. Las cifras tienen poca relación con el Canvas y no permiten evaluar adecuadamente la viabilidad del negocio. |
| **1 – Insuficiente** | No presenta un modelo económico funcional. Los ingresos o costos están ausentes, son arbitrarios o presentan inconsistencias graves. No existe relación entre el modelo financiero y el modelo de negocio. |

### 5. Definición de OKR

| Nivel | Descripción |
|---|---|
| **5 – Excelente** | Define Objectives claros, estratégicos, inspiradores y directamente relacionados con el caso de negocio. Cada Objective tiene Key Results cuantificables, verificables y orientados a resultados, no a actividades. Los OKR permiten medir si el modelo de negocio está logrando los resultados esperados. Existe trazabilidad directa con propuesta de valor, clientes, ingresos, costos y/o crecimiento. Los indicadores tienen línea base, meta y horizonte temporal cuando aplica. |
| **4 – Sobresaliente** | Los Objectives son claros y están alineados con la estrategia. Los Key Results son mayoritariamente cuantificables y medibles y permiten evaluar resultados. Existe buena relación con el modelo de negocio, aunque algunos indicadores podrían ser más precisos o estratégicos. |
| **3 – Buena** | Presenta Objectives y Key Results comprensibles y parcialmente medibles. Existe alineación general con el negocio, pero algunos Key Results son demasiado operativos, poco cuantificables o se confunden con actividades. |
| **2 – Suficiente** | Presenta objetivos y resultados, pero muchos son genéricos, difíciles de medir o están desconectados del modelo de negocio. Predominan actividades o entregables en lugar de resultados. |
| **1 – Insuficiente** | Los OKR están ausentes, son incorrectos o no tienen relación con el caso de negocio. Los "Key Results" corresponden principalmente a tareas, funcionalidades o actividades sin métricas que permitan evaluar el resultado obtenido. |

---

## Matriz de evaluación consolidada

| Componente | Peso | **1 – Insuficiente** | **2 – Suficiente** | **3 – Buena** | **4 – Sobresaliente** | **5 – Excelente** |
|---|---|---|---|---|---|---|
| Premisas, supuestos y restricciones | 10% | Ausentes, irrelevantes o contradictorios | Parciales y poco justificados | Identificados pero con justificación limitada | Claros, relevantes y bien justificados | Completos, justificados y con impacto/trazabilidad |
| Alcance y caso de negocio | 15% | Problema y alcance indefinidos | Problema/alcance ambiguos | Problema y alcance comprensibles | Bien delimitado y coherente | Problema, contexto, actores, solución y límites completamente definidos |
| Business Model Canvas | 25% | Incompleto/incoherente | Bloques incompletos o genéricos | Completo pero con conexiones débiles | Completo y coherente | Los 9 bloques están integrados y sustentados |
| Ingresos vs. costos | 25% | Sin modelo económico funcional | Estimaciones débiles | Modelo básico razonable | Modelo cuantificado y sustentado | Modelo cuantificado, trazable y con análisis de viabilidad |
| OKR | 25% | Ausentes o incorrectos | Genéricos y poco medibles | Medibles parcialmente | Claros y alineados | Estratégicos, cuantificables, trazables y orientados a resultados |