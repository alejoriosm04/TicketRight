# Clases 1 y 2 — Fundamentos de arquitectura

**Fecha:** sábado 5 de septiembre de 2026
**Profesor:** José Daniel Medina Solano — Consultor, líder de arquitectura y mentor
(Ing. de Sistemas EAFIT, MBA Tecnológico de Monterrey; +32 años como director ejecutivo
y técnico en Telco, banca y seguros; profesor de la especialización desde 2022;
`jmedin23@eafit.edu.co`)

> **Digitalización completa de las 57 láminas** de
> `material/2026-09-05-clase-01-02.pdf`. Las láminas son imágenes, así que este archivo
> es la única forma de que una IA lea el contenido. Cada sección indica su lámina de
> origen. Fiel a lo que dice la diapositiva; donde hay interpretación, va marcada.

---

## Contenido

1. [Encuadre del curso](#1-encuadre-del-curso) · láminas 1-5
2. [La analogía con la arquitectura física](#2-la-analogía-con-la-arquitectura-física) · 6-11
3. [Qué es arquitectura](#3-qué-es-arquitectura) · 12-16
4. [Principios, políticas y decisiones](#4-principios-políticas-y-decisiones) · 17-21
5. [Trade-off y costo de oportunidad](#5-trade-off-y-costo-de-oportunidad) · 22-25
6. [El rol del arquitecto](#6-el-rol-del-arquitecto) · 26-31
7. [Arquitectura empresarial](#7-arquitectura-empresarial) · 32-46
8. [OKR](#8-okr) · 47-51
9. [El proyecto integrador](#9-el-proyecto-integrador) · 52-57

---

## 1. Encuadre del curso

### Enfoque (lámina 2)

> «Cocreamos con situaciones reales para elevar tu criterio y que tomes mejores decisiones.»
> «Integramos tecnología, negocio y personas para diseñar soluciones de alto impacto.»

Siete dimensiones que el curso dice desarrollar: pensamiento crítico, visión estratégica,
innovación y aprendizaje, liderazgo e influencia, ética y responsabilidad, análisis y
evaluación, integración y contexto.

El curso se dibuja como la intersección de cinco cosas: **usuarios, negocio, tecnología,
datos y procesos**.

### Objetivos del curso (lámina 4)

1. Conocer los **conceptos fundamentales** de las arquitecturas avanzadas de software.
2. Reconocer la importancia del diseño de la arquitectura como **estrategia de alto nivel**.
3. Aplicar **patrones de diseño y frameworks** para el desarrollo de las arquitecturas.
4. Identificar cómo **reducir la deuda técnica** de los proyectos de software.
5. Concebir, diseñar y desarrollar **arquitecturas avanzadas de software**.

**Metodología:** ejemplos de la vida real; implementación basada en casos, lecturas y
*hands on* de temas específicos.

**Fuentes de información:** documentación de AWS, Azure (Microsoft) y GCP; O'Reilly;
algunos assets de fuentes públicas.

### Modelo de evaluación (lámina 5)

| | Componente | Peso | Fecha |
|---|---|---|---|
| | **PROYECTO INTEGRADOR** | **80%** | |
| 1 | Definición completa de un caso de negocio | 20% | Sábado 12 |
| 2 | Modelamiento de una solución basada en arquitecturas modernas | 30% | Sábado 19 |
| 3 | Implementación – Sustentación – Simulación – Defensa | 30% | Sábado 26 |
| 4 | Ensayos | 10% | Viernes 11 y 18 |
| 5 | Extras | 10% | Todo el tiempo |

---

## 2. La analogía con la arquitectura física

Las láminas 6 a 11 construyen, con imágenes de edificios, puentes y vías férreas, la
analogía que sostiene todo el resto del curso.

**Lámina 6 — «Arquitectura: diseñamos el PRESENTE, construimos el FUTURO.»**

**Lámina 7 — «Arquitecturas específicas»:** soluciones arquitectónicas diseñadas para
necesidades únicas. La idea es que no existe la arquitectura genérica correcta.

**Láminas 8 y 9 — «¿Qué hay de malo?»** Dos imágenes: una casa construida sobre un
terreno erosionado, y un puente cuyos dos extremos no coinciden.

> «Identificar problemas de arquitectura es el primer paso hacia mejores soluciones.»
> «No es casualidad. Es ingeniería, planificación y detalle.»

Cinco elementos que la lámina 9 enumera: arquitectura *que conecta*, estructuras *que
soportan*, movilidad *que impulsa*, tecnología *que integra*, personas *que transforman*.

**Lámina 10 — «Algo faltó o algo sobró»:** edificios colapsados, pisos agrietados, rieles
que no empatan, y la caricatura «¿quién tiene la culpa? ¿el ingeniero o el topógrafo?».

> «En arquitectura y diseño, los errores no siempre se ven a simple vista, pero siempre
> se sienten.»
> «Diseñar no es solo construir, es entender lo esencial.»

**Nota de lectura.** La analogía no es decorativa: es el andamio del que cuelgan la
definición de arquitectura (lámina 12), la separación de roles (lámina 15) y el concepto
de costo de reversión. Cuando el profesor pregunta «¿qué hay de malo?», está pidiendo
identificar la **decisión estructural** que faltó, no el defecto visible.

---

## 3. Qué es arquitectura

### Definición (lámina 12)

> **La arquitectura es el plano de un sistema de software.** Define su estructura
> fundamental, las relaciones e interacciones entre sus componentes, los principios que
> guían su diseño y evolución, y las decisiones estratégicas que impactan en todo el
> ecosistema tecnológico.

**En resumen:** la arquitectura de software es la **organización fundamental** de un
sistema. Proporciona el marco para construir soluciones que sean **funcionales, fiables,
mantenibles, escalables** y alineadas con los **objetivos del negocio** y las
**restricciones** del entorno.

> «La arquitectura no es sólo diagramas ni tecnología, es tomar **decisiones conscientes**
> hoy para obtener el **máximo valor mañana**.» — Arquitecto de software, +10 años

**Componentes clave de la arquitectura:**

| Componente | Qué es |
|---|---|
| **Estructura** | Componentes principales del sistema y cómo se organizan |
| **Relaciones e interacciones** | Cómo los componentes se comunican y colaboran |
| **Principios** | Reglas y lineamientos que guían las decisiones de diseño y evolución |
| **Decisiones arquitectónicas** | Elecciones estratégicas con impacto a largo plazo |
| **Impacto** | Efecto en atributos clave: calidad, costo, riesgo y tiempo |

**Principios que guían la arquitectura:** simplicidad, modularidad, escalabilidad,
seguridad, mantenibilidad, rendimiento.

**Ejemplo simple:** aplicación e-commerce → servicios de negocio → base de datos. «La
arquitectura define cómo se separan las responsabilidades y cómo se comunican los
componentes.»

**Visión de un arquitecto con experiencia:**

- **Ve más allá del código.** No se trata de escribir código, sino de diseñar sistemas
  que puedan crecer, adaptarse y sobrevivir al cambio.
- **Toma decisiones conscientes.** Cada decisión implica trade-offs. El arquitecto evalúa
  opciones y elige el mejor equilibrio para el contexto.
- **Piensa en el negocio y en las personas.** La mejor arquitectura habilita el valor del
  negocio y facilita el trabajo de los equipos que construyen y operan el sistema.
- **Diseña para el cambio.** Asume que los requisitos cambiarán. Una buena arquitectura
  reduce el costo del cambio.
- **Comunica y alinea.** Usa artefactos, modelos y lenguaje común para alinear a todos
  los stakeholders y tomar decisiones informadas.

> **Idea clave:** la arquitectura transforma la complejidad en decisiones claras,
> alineando tecnología y negocio para entregar valor sostenible.

### Arquitectura vs. diseño (lámina 13)

Dos niveles complementarios. **Arquitectura: ¿qué sistema debe existir? Diseño: ¿cómo
debe construirse el sistema?**

| | Arquitectura | Diseño |
|---|---|---|
| **Enfoque** | Define la estructura general del sistema y sus componentes principales | Define la estructura interna del código, clases, funciones y módulos |
| **Alcance** | Establece límites entre componentes y responsabilidades | Organiza módulos, paquetes y detalles de implementación |
| **Decisiones** | Define cómo los componentes se integran y comunican | Define tecnologías, librerías, algoritmos y patrones de implementación |
| **Criterios** | Se basa en restricciones de negocio, calidad, riesgo y cumplimiento | Se basa en eficiencia, rendimiento, mantenibilidad y costo |
| **Horizonte** | Define la dirección a largo plazo y la visión del sistema | Guía la construcción e implementación de la solución |
| **Participantes** | Arquitectos, stakeholders y líderes de negocio | Equipos de desarrollo y técnicos |

La arquitectura **define limitantes, toma decisiones estratégicas y alinea la solución con
los objetivos del negocio**. El diseño **define cómo hacer las cosas, implementa
decisiones y construye la solución**.

> «Arquitectura y diseño trabajan juntos: la arquitectura define **qué** y **por qué**;
> el diseño define **cómo**. Juntos entregan soluciones robustas, escalables y sostenibles.»

### Los aspectos de la arquitectura (lámina 14)

Un cubo de tres ejes: un enfoque multidimensional para diseñar soluciones integrales.

**Eje vertical — niveles:**
- **Nivel de aplicación:** qué ofrece el sistema al usuario y cómo genera valor. Se enfoca
  en las necesidades del negocio y del usuario; define qué debe hacer el sistema y qué
  valor entrega.
- **Nivel técnico:** cómo se construye el sistema usando tecnología y componentes. Se
  enfoca en las tecnologías, componentes y mecanismos que permiten construir el sistema.

**Eje de profundidad — perspectivas:**
- **Perspectiva lógica:** cómo se estructura la información y se relacionan los
  componentes. Representa la estructura conceptual del sistema, las entidades, relaciones
  y reglas del negocio.
- **Perspectiva física:** dónde y con qué recursos se implementa la solución. Representa
  la distribución e implementación real en entornos y recursos físicos o cloud.

**Eje horizontal — aspectos:**
- **Aspecto funcional:** qué funciones y servicios debe proporcionar el sistema. Define
  las capacidades, procesos y servicios que el sistema debe ofrecer.
- **Aspecto operacional:** cómo se opera, monitorea y soporta el sistema en el tiempo.
  Define cómo se despliega, opera, monitorea y mantiene la solución.

> «Una arquitectura sólida considera todas las dimensiones del problema para tomar
> decisiones informadas, alineadas y sostenibles.»

### Roles y alcance: la analogía de la construcción (lámina 15)

| Rol | Alcance | Responsabilidades | Enfoque |
|---|---|---|---|
| **Arquitecto** — visiona y diseña el todo | Define la visión, el diseño general y la estructura de la solución | Comprende las necesidades de los usuarios · Diseña la arquitectura alineada a objetivos y restricciones · Considera normas, riesgos, tecnologías y el entorno · Entrega planos y especificaciones | Estratégico, de largo plazo y multidimensional |
| **Gerente de proyecto** — planifica y coordina | Planifica el trabajo, gestiona recursos, tiempo, presupuesto y coordina a los contratistas | | |
| **Contratista y subcontratistas** — ejecutan y construyen | | | |
| **Inspector** — verifica y asegura calidad | Verifica que la construcción cumpla con normas y estándares | | |
| **Usuarios (ocupantes)** — viven y se benefician | Usan la solución para satisfacer sus necesidades y alcanzar sus objetivos | Comunican sus necesidades y expectativas · Usan la solución de manera efectiva · Dan retroalimentación para mejoras futuras | Experiencia, valor y resultados en el día a día |

> «Una solución exitosa es el resultado de roles complementarios: el arquitecto diseña,
> el gerente lidera, los constructores ejecutan y los usuarios dan sentido.»

### Características esenciales de la arquitectura (lámina 16)

Siete características, alrededor de la definición «estructura fundamental que guía el
diseño, la construcción y la evolución del sistema»:

1. **Alineación estratégica.** Está alineada con los objetivos del negocio y genera valor
   real para los usuarios.
2. **Visión integral.** Considera múltiples dimensiones: negocio, datos, aplicaciones,
   tecnología, seguridad, experiencia, operaciones.
3. **Abstracción y simplificación.** Reduce la complejidad resaltando los elementos
   esenciales y sus relaciones clave.
4. **Guía y restricción.** Proporciona directrices y límites que orientan el diseño e
   implementación consistentes y coherentes.
5. **Calidad atributiva.** Aborda explícitamente atributos de calidad como rendimiento,
   seguridad, disponibilidad, escalabilidad y mantenibilidad.
6. **Flexibilidad y evolución.** Permite adaptarse al cambio y evolucionar sin comprometer
   la estabilidad del sistema.
7. **Comunicación efectiva.** Facilita la comunicación entre todos los involucrados usando
   un lenguaje común y modelos comprensibles.

> «Una buena arquitectura no es solo un diseño: es una **decisión estratégica** que
> determina el éxito a largo plazo de la solución.»

---

## 4. Principios, políticas y decisiones

### Políticas vs. principios (lámina 17)

Dos niveles que guían las decisiones, con distinto alcance y flexibilidad.

| | **Políticas** — mandatorias y obligatorias | **Principios** — orientadores y flexibles |
|---|---|---|
| **Qué es** | Declaración empresarial de cómo se deben hacer las cosas | Regla empresarial para guiar decisiones de arquitectura |
| **De dónde proviene** | Impuestas desde **fuera** de la organización, a menudo por ley o regulación | Definidas desde **dentro** de la organización o a nivel divisional / supra-programa |
| **Ejemplos** | Protección de datos, salud y seguridad · Regulaciones de la industria | Distribución de datos que afecta operaciones · *Buy not Make* que afecta desarrollo de aplicaciones · Single sign-on que afecta la gestión de seguridad |
| **Flexibilidad** | **No se pueden conceder excepciones:** se debe encontrar una alternativa para cumplir la política | **Se pueden conceder excepciones:** los principios pueden tener conflictos o variaciones con los requerimientos |
| **Consecuencias del incumplimiento** | Puede ser una ofensa legal o traer consecuencias como despido o sanciones financieras | Puede generar riesgos o decisiones subóptimas, pero no tiene sanción legal |

Las **políticas** aseguran conformidad, legalidad y protección de la organización. Los
**principios** aseguran coherencia, calidad y buenas decisiones arquitectónicas. Ambas son
esenciales y complementarias: *las políticas marcan los límites, los principios guían cómo
alcanzamos nuestros objetivos dentro de ellos.*

> ⚠️ **Ojo con esta lámina.** Su definición de política —origen externo, sin excepciones—
> es más estrecha que la del cuestionario de fundamentos, donde una política es interna y
> *debe* tener ruta formal de excepción. Ver [`fundamentos-arquitectura.md`](fundamentos-arquitectura.md#4-principios-políticas-y-estándares).
> Si el tema aparece en una evaluación, vale la pena preguntar cuál de las dos lecturas
> aplica. `PENDIENTE: aclarar con el profesor.`

### Principios fundamentales de la arquitectura de software (lámina 18)

Cinco grupos. «Las reglas que guían las decisiones para construir sistemas sostenibles y
evolutivos.»

**1. Diseño responsable** — *cada componente cumple una única función claramente definida*
- **Separation of Concerns:** cada componente tiene una responsabilidad específica.
- **Single Responsibility Principle:** un módulo debe tener una sola razón para cambiar.

**2. Extensibilidad** — *evolucionar sin modificar el comportamiento existente*
- **Open/Closed Principle:** los componentes deben estar abiertos para extensión, pero
  cerrados para modificación.
- **Composición sobre herencia:** preferir composición de objetos sobre herencia de clases.

**3. Desacoplamiento** — *reducir dependencias para facilitar evolución, pruebas y mantenimiento*
- **Dependency Inversion Principle:** depender de abstracciones, no de implementaciones
  concretas.
- **Law of Demeter:** un objeto debe conocer solo a sus colaboradores inmediatos.

**4. Reutilización y modularidad** — *construir una vez y reutilizar muchas veces*
- **DRY (Don't Repeat Yourself):** evitar duplicación de lógica, conocimiento y
  responsabilidades.
- **Principio de modularidad:** el sistema debe estar dividido en módulos cohesivos y
  débilmente acoplados.

**5. Calidad operacional** — *diseñar pensando en crecimiento y continuidad del servicio*
- **Escalabilidad por diseño:** la arquitectura debe anticipar el crecimiento y permitir
  el escalado horizontal y vertical.
- **Tolerancia a fallos:** el sistema debe continuar funcionando ante fallos parciales.

> «La arquitectura no se define por tecnologías. Se define por principios que permanecen
> válidos a lo largo del tiempo.»

### Modelo de decisiones de arquitectura (láminas 19 y 24)

**Entradas del modelo:**
- **Requisitos de negocio:** objetivos, necesidades y restricciones del negocio.
- **Atributos de calidad:** escalabilidad, seguridad, disponibilidad, rendimiento, etc.
- **Restricciones técnicas:** limitaciones tecnológicas, estándares, políticas y cumplimiento.
- **Principios de arquitectura:** reglas y lineamientos que guían las decisiones y aseguran
  coherencia con la estrategia.
- **Artefactos y definiciones existentes:** documentos, modelos, estándares, catálogos.
- **Contexto del negocio y de TI:** estrategia, capacidades actuales, restricciones
  técnicas, regulaciones y cumplimiento, presupuesto y plazos.

**El proceso, en seis pasos (lámina 24):**

1. **Identificar necesidad.** Detectar problema u oportunidad, entender el contexto,
   definir objetivos arquitectónicos.
2. **Definir decisión.** Formular la decisión, establecer alcance, definir restricciones,
   identificar stakeholders.
3. **Identificar alternativas.** Generar opciones de solución, basadas en patrones,
   tecnologías y enfoques. **Incluir la opción «mantener actual».**
4. **Evaluar alternativas.** Evaluar según criterios, análisis de trade-offs, considerar
   riesgos e impacto.
5. **Tomar decisión.** Seleccionar la mejor alternativa, documentar justificación, obtener
   aprobación.
6. **Implementar y comunicar.** Planificar e implementar, comunicar la decisión, alinear a
   los equipos.

**Criterios de evaluación (ejemplos):**

| Categoría | Criterios |
|---|---|
| **Negocio** | Valor de negocio · Alineación estratégica · Time to market |
| **Técnico** | Viabilidad técnica · Escalabilidad · Rendimiento · Mantenibilidad |
| **Económico** | Costo de implementación · Costo operativo · Retorno de inversión |
| **Riesgos** | Riesgos técnicos · Riesgos de seguridad · Riesgos del negocio |
| **Organizacional** | Impacto organizacional · Capacidades del equipo · Gestión del cambio |
| **Otros** | Cumplimiento · Sostenibilidad · Dependencias |

**Retroalimentación:** monitorear resultados y revisar decisiones cuando sea necesario.
**Gobernanza y repositorio:** almacenar decisiones (ADRs), facilitar búsqueda y
trazabilidad, revisar y evolucionar.

> «Decisiones y principios tienen el mismo peso en la arquitectura: ambos son
> restricciones que la solución debe cumplir.»

### Por qué documentar las decisiones (lámina 20)

**¿Por qué documentar formalmente?**
- **Asegura claridad y trazabilidad.** Todos entienden qué se decidió, por qué y en qué
  contexto.
- **Facilita la comunicación.** Alinea a equipos técnicos y de negocio.
- **Soporta la gobernanza.** Permite evaluar cumplimiento de principios y políticas.
- **Reduce riesgos y reprocesos.** Evita repetir debates y decisiones inconsistentes.
- **Construye conocimiento.** Crea un historial de decisiones para aprender y evolucionar.

**¿Por qué gestionarlas todo el tiempo?**
- **Revisar:** validar que la decisión sigue siendo válida en el contexto actual.
- **Evaluar impacto:** analizar efectos en otras decisiones, soluciones y capacidades.
- **Identificar conflictos:** detectar inconsistencias con principios, políticas o nuevas
  decisiones.
- **Actualizar o reemplazar:** evolucionar la decisión cuando cambie el contexto o
  aparezcan mejores opciones.
- **Comunicar y registrar:** mantener el registro actualizado y disponible para toda la
  organización.

> «Documentar no es burocracia, es arquitectura con memoria.»
> «Una decisión bien documentada hoy evita problemas, costos y confusión mañana.»
> «Lo que no se documenta, no existe.»

### El formato ADR del curso (lámina 21)

**Este es el formato que usa el profesor.** Ocho elementos:

| # | Elemento | Qué contiene | Ejemplo de la lámina |
|---|---|---|---|
| 1 | **Decisión arquitectónica** | La decisión escrita como una declaración clara | «El sistema usará el patrón de integración por mensajería para comunicarse con la aplicación XYZ» |
| 2 | **Identificador único** | Código único que identifica la decisión | `AD-065` |
| 3 | **Problema o asunto** | Descripción de la situación que requiere una decisión | ¿Cómo debe el sistema integrarse con la aplicación XYZ? |
| 4 | **Supuestos** | Lo que se considera verdadero del contexto, restricciones y condiciones | La aplicación XYZ soporta una interfaz de mensajería |
| 5 | **Alternativas** | Opciones consideradas y explicación de cada una | 1 – Transferencia de archivos · 2 – Mensajería |
| 6 | **Decisión** | La alternativa seleccionada | Se elige la Alternativa 2 (Mensajería) |
| 7 | **Justificación** | Razones por las cuales se tomó la decisión | La mensajería provee comunicación confiable, asíncrona y tolerante a fallos |
| 8 | **Implicaciones** | Consecuencias e impactos en la solución y otros aspectos | 1. Se requiere un nodo de integración. 2. Se debe considerar una capa adicional para modelamiento de rendimiento |

> «Un registro bien estructurado permite tomar mejores decisiones, aprender del pasado y
> mantener la arquitectura alineada con los objetivos del negocio.»

---

## 5. Trade-off y costo de oportunidad

### Trade-off en arquitectura (lámina 22)

> **Un trade-off es elegir la mejor opción entre alternativas que tienen beneficios y
> costos diferentes, alineada con los objetivos y restricciones del negocio y la
> arquitectura.**

Es una decisión consciente donde se priorizan ciertos atributos de calidad a cambio de
sacrificar otros: **ganancia** (lo que optimizamos) `<>` **costo** (lo que sacrificamos).

**Atributos en conflicto comunes:**

| Se gana en… | …se paga en |
|---|---|
| Rendimiento | Simplicidad |
| Escalabilidad | Mantenibilidad |
| Disponibilidad | Costo |

**¿Cuándo usar trade-off?**
- **Objetivos en conflicto:** cuando no se pueden maximizar todos los atributos a la vez.
- **Recursos limitados:** tiempo, presupuesto, talento, tecnología, infraestructura.
- **Restricciones del contexto:** regulatorias, técnicas, operativas o del negocio.
- **Mejor decisión posible:** no existe una opción perfecta, solo la mejor posible.

**Cómo evaluar un trade-off:**
1. **Definir objetivos.** ¿Qué es lo más importante para el negocio?
2. **Identificar alternativas.** ¿Qué opciones tenemos para resolver el problema?
3. **Evaluar atributos.** Medir el impacto en cada atributo relevante.
4. **Comparar y ponderar.** Asignar peso según la prioridad de cada atributo.
5. **Decidir y justificar.** Elegir la mejor alternativa y documentar los motivos.

**Ejemplo de la lámina — monolito vs. microservicios:**

| Opción A: arquitectura monolítica | Opción B: microservicios |
|---|---|
| ✅ Mayor rendimiento | ✅ Alta escalabilidad |
| ✅ Menor costo inicial | ✅ Despliegue independiente |
| ❌ Escalabilidad limitada | ❌ Mayor complejidad |
| ➖ Despliegue complejo | ➖ Mayor costo operativo |

> «No se trata de elegir la "mejor" opción absoluta, sino la mejor opción para el contexto
> y objetivos actuales.»
> **Para recordar:** los trade-offs no son errores, son decisiones informadas y
> documentadas que reflejan prioridades.
> «En arquitectura no buscamos la perfección, buscamos el mejor equilibrio entre todo lo
> que importa.»

### Ejemplo trabajado: el teorema CAP (lámina 23)

**Escenario.** Una aplicación de e-commerce espera un gran aumento de usuarios durante el
Black Friday. **La decisión:** ¿qué arquitectura de base de datos usar para soportar la
demanda?

| | Opción A — relacional (SQL) | Opción B — distribuida (NoSQL) |
|---|---|---|
| | Más simple y consistente | Más escalable y disponible |
| Consistencia (C) | ●○○ fuerte (prioridad) | ●○○ baja (sacrificio) |
| Disponibilidad (A) | ●○○ | ●●● fuerte |
| Tolerancia a particiones (P) | ●○○ | ●●● fuerte |

**Elección: opción B (NoSQL distribuida).** Se priorizan disponibilidad y tolerancia a
fallos para soportar picos masivos de tráfico.

**¿Qué ganamos?** Alta disponibilidad durante picos de demanda · Escalabilidad horizontal
sencilla · El sistema sigue funcionando si un nodo falla.

**¿Qué sacrificamos?** Consistencia inmediata de los datos · Consultas más complejas y
posibles duplicados temporales.

**Impacto en el negocio.** Mejor experiencia para el usuario durante eventos críticos como
Black Friday. Aceptamos consistencia eventual para garantizar ventas sin caídas.

> «En arquitectura no buscamos la perfección, buscamos el mejor equilibrio entre todo lo
> que importa.» — inspirado en el teorema CAP

**Nota de lectura.** Este ejemplo es la plantilla de razonamiento que el curso espera:
escenario de negocio → decisión → dos opciones comparadas por atributo → elección →
qué se gana → **qué se sacrifica** → impacto en el negocio. Vale la pena copiar esa
estructura literalmente en la Entrega 2.

### El costo de oportunidad (lámina 25)

> **El costo de oportunidad es el valor de las mejores alternativas que dejamos de elegir
> cuando tomamos una decisión.**
> «Toda decisión de arquitectura entrega valor, pero también descarta otras oportunidades
> de valor.»

**Cómo se calcula:** costo de oportunidad = **valor de la mejor alternativa no elegida**.

*Ejemplo:* elegimos una solución on-premise. El costo de oportunidad es el valor que
podríamos haber obtenido con una solución cloud (mayor escalabilidad, menor time to
market). **No es un costo en dinero hoy, es el valor futuro que dejamos de capturar.**

**Impacto en la arquitectura:**

| Dimensión | Efecto |
|---|---|
| **Time to market** | Podemos llegar más lento al mercado |
| **Innovación** | Se limitan capacidades futuras |
| **Costos** | Podemos asumir mayores costos a largo plazo |
| **Talento** | Puede ser más difícil atraer y retener talento |
| **Flexibilidad** | Aumentan las restricciones para adaptarnos al cambio |

**Ejemplo simple — base de datos:**

| | Opción A: BD administrada (cloud) | Opción B: BD en servidores propios |
|---|---|---|
| Implementación | ✅ Semanas | ❌ Meses |
| Escalabilidad | ✅ Alta | ❌ Limitada |
| Costo inicial | ✅ Bajo | ❌ Alto |
| Operación | ✅ Administrada | ❌ Equipo interno |
| Innovación | ✅ Nuevos servicios | ❌ Más esfuerzo |

Costo de oportunidad de elegir B: el valor de innovar más rápido y escalar fácilmente.

**Mensajes clave:**
1. Toda decisión de arquitectura implica un costo de oportunidad.
2. No se trata solo del menor costo hoy, sino del mayor valor total en el tiempo.
3. Evalúa valor, riesgo y oportunidades futuras de forma integral.
4. Decide con la visión del negocio, no solo con la tecnología.

> «Una buena arquitectura no solo resuelve el presente, protege y habilita las
> oportunidades del futuro.»

---

## 6. El rol del arquitecto

### Maestro · Héroe · Referente (lámina 26)

- **El sabio** (*Know Your Stuff*): maestro del oficio. Cultiva el dominio profundo de los
  fundamentos y la disciplina de la mejora continua.
- **El héroe** (*Make it Matter*): resuelve problemas que importan. Toma decisiones
  difíciles y trae claridad donde había complejidad.
- **El referente** (*Teach Others*): voz que otros buscan. Su criterio orienta, su ejemplo
  multiplica y su legado trasciende los proyectos.

> «Liderar con conocimiento, propósito e impacto. Así construimos soluciones que
> transforman.»

### Qué es un arquitecto (lámina 28)

> **Un arquitecto es la persona que traduce intención de negocio en decisiones técnicas
> sostenibles, articulando personas, tecnología y tiempo para que el sistema construido
> haga lo que debe hacer — hoy y mañana.**

| I. Conocimiento (*Skill*) | II. Liderazgo (*Leadership*) | III. Impacto (*Make it Matter*) |
|---|---|---|
| Domina los fundamentos: empresarial, técnico, soluciones, datos, redes | Enseña, mentorea, amplifica el talento de otros | Prioriza lo que mueve la aguja del negocio |
| Aplica metodologías, patrones y principios con criterio | Comunica con claridad: oral, escrita y visualmente | Construye comunidad y deja capacidad instalada |
| Mantiene su práctica viva: aprende, prueba, descarta | Influye sin autoridad formal: prospectiva y negociación | Sus decisiones se sostienen en el tiempo |

### Cómo el arquitecto multiplica su valor (lámina 27)

> «No se mide por lo que él hace, sino por lo que hace posible que otros hagan.»

1. **Decide.** Toma decisiones difíciles bajo incertidumbre. Su criterio reduce la varianza
   de los equipos y acelera la ejecución.
2. **Enseña.** Convierte experiencia en marcos transferibles. Mentorea, califica criterios
   y forma a la siguiente generación.
3. **Conecta.** Articula negocio, ingeniería, datos y operación. Traduce entre mundos que
   normalmente no se entienden.
4. **Trasciende.** Sus decisiones se sostienen después de que él se va del proyecto. Deja
   capacidad instalada, no dependencia.

### Dos pilares para crecer como arquitecto (lámina 29)

> «Ningún pilar funciona sin el otro: el técnico habilita, el humano amplifica.»

**Fundamentos de arquitectura**
- *Dominios técnicos:* empresarial, técnico, soluciones, datos, telco/red.
- *Capacidades transversales:* metodologías (TOGAF, C4, ADR, marcos de decisión) ·
  patrones de diseño/arquitectura (microservicios, eventos, capas, hexagonal) ·
  arquitectura particular del dominio de negocio que está sirviendo.

**Habilidades blandas**
- *Capacidades de visión:* liderazgo, prospectiva, negociación.
- *Capacidades de comunicación e influencia:* liderazgo técnico (decide con criterio, da
  seguridad al equipo) · expresión oral y escrita (documenta, presenta, convence con
  claridad) · impacto e influencia (mueve organizaciones sin autoridad formal).

### Skill · Leadership · Impact (lámina 30)

> «Las tres patas que sostienen al arquitecto. Si falta una, el taburete se cae.»
> En el centro: **Mentor** — *Apply · Amplify*.

1. **Skill** (*Know Your Stuff*): el arquitecto invierte en su práctica: profundiza,
   experimenta, mantiene el filo de su criterio técnico.
2. **Leadership** (*Teach Others*): convierte conocimiento en capacidad colectiva:
   mentorea, documenta y forma a otros arquitectos.
3. **Impact** (*Make it Matter*): aplica criterio donde mueve la aguja: prioriza, ejecuta
   y deja huella en el negocio y la comunidad.

### Pensamiento crítico: las leyes de la arquitectura (lámina 31)

> «No se trata de elegir entre opciones. Se trata de **entender el espectro**, para tomar
> **mejores decisiones**.»

| Cita | Fuente |
|---|---|
| *Everything in software architecture is a trade-off.* | **Primera ley de la arquitectura de software** |
| *Why is more important than how.* | **Segunda ley de la arquitectura de software** |
| *Most architecture decisions aren't binary but rather exist on a spectrum between extremes.* | **Tercera ley de la arquitectura de software** |
| *When dealing with big challenges, success is elusive only until you bring the appropriate skills and personalities together.* | J. Luisi |
| *Complexity is anything related to the structure of a software system that makes it hard to understand and modify the system.* | — |

> Pensamiento crítico para ver más allá de lo evidente → mejores decisiones, mejores
> arquitecturas → impacto real en sistemas que transforman el mundo.

---

## 7. Arquitectura empresarial

### Definición central (lámina 33)

> **«La Arquitectura Empresarial es el conjunto de principios, modelos, estándares y
> decisiones que guían la evolución coherente de una organización, alineando la estrategia
> del negocio con las capacidades tecnológicas, con el fin de optimizar la entrega de
> valor, gestionar la complejidad y habilitar la transformación.»**

> «Es menos sobre tecnología y más sobre conexiones, contexto y entender el negocio
> (sistema) completo.»

Cada decisión técnica —desde la elección de un patrón de integración hasta la adopción de
una plataforma cloud— tiene consecuencias que trascienden el componente inmediato. La AE
provee el contexto para entender esas consecuencias:

- **Evita** la proliferación de soluciones duplicadas o contradictorias.
- **Reduce** la deuda técnica al establecer estándares de diseño.
- **Facilita** la interoperabilidad entre sistemas heterogéneos.
- **Habilita** la trazabilidad desde requerimientos de negocio hasta componentes técnicos.
- **Provee** el lenguaje común entre negocio, arquitectura y desarrollo.

### El puente entre estrategia y ejecución (lámina 34)

La AE no es solo una cuestión de TI; es una práctica para analizar, diseñar y planificar
la implementación de la estrategia en toda la organización.

**El desafío:**
- Desconexión entre la misión y los procesos de soporte.
- Silos de información y duplicidad de esfuerzos.
- Inversiones tecnológicas sin retorno claro.
- **Ley Clinger-Cohen:** no se trata de tecnología, sino de transformar la misión.

**La solución:**
- Análisis, diseño, planificación e implementación con enfoque integral.
- Objetivos: eficacia, eficiencia, agilidad y continuidad de las operaciones.
- Conecta la visión estratégica con la ejecución sostenible.

### Modelo de relación: de la estrategia a la ejecución (lámina 35)

```
ESTRATEGIA              Objetivos de negocio y ventajas competitivas
    ↓
CAPACIDADES             Habilidades permanentes que necesita la organización
    ↓
PROCESOS                Secuencias de actividades que materializan las capacidades
    ↓
RECURSOS & TECNOLOGÍA   Personas, datos, aplicaciones e infraestructura
```

> Las **capacidades** responden *qué* necesita la empresa. Los **procesos** responden
> *cómo* lo hace. Ambos deben alinearse con la estrategia y respaldarse con recursos
> (personas, datos, tecnología).

### Los cuatro dominios de arquitectura (lámina 36)

| Dominio | Descripción | Artefactos clave | Pregunta que responde |
|---|---|---|---|
| **Arquitectura de Negocio** | Define la estrategia, gobierno, organización y procesos clave de la empresa | Cadena de valor, mapa de capacidades, BPMN, RACI | ¿Qué hace la organización y cómo? |
| **Arquitectura de Datos / Información** | Describe la estructura lógica y física de los activos de datos, su ciclo de vida y gobierno | Modelos de datos, diccionario de datos, mapa de flujo de datos, lineage | ¿Qué datos existen, dónde están y cómo se gestionan? |
| **Arquitectura de Aplicaciones** | Define el portafolio de aplicaciones, sus responsabilidades, interfaces y relaciones | Diagrama de contexto, catálogo de aplicaciones, mapa de integración, matrices de dependencia | ¿Qué sistemas existen y cómo se relacionan? |
| **Arquitectura de Tecnología / Infraestructura** | Describe la plataforma técnica: hardware, software de base, redes, cloud, seguridad | Diagramas de infraestructura, topologías de red, inventario tecnológico, matriz de capacidad | ¿Sobre qué plataforma opera todo lo anterior? |

La **arquitectura de seguridad** envuelve a los cuatro dominios (aparece como el marco
exterior del diagrama).

> «La AE integra los cuatro dominios para transformar la estrategia en soluciones
> coherentes, seguras y sostenibles.»

### Capacidades de negocio (lámina 37)

> **Una capacidad representa «lo que hace una organización» independientemente de «cómo»
> lo hace.**

- **Estabilidad:** las capacidades son estables en el tiempo, a diferencia de los procesos
  y tecnologías.
- **Abstracción:** se define el resultado esperado, no el procedimiento.

Ejemplo de mapa de capacidades, marcando en naranja las que requieren transformación y en
gris las estables: gestión de riesgo, **ventas**, producción, marketing, reclutamiento,
**logística**, TI, servicio al cliente, finanzas, **I+D**, operaciones, compras.

> «Sin una base de planificación sólida (capacidades), existe un alto riesgo de desviarse
> en la transformación digital.» — BOC Group

### Capacidades vs. procesos (lámina 38)

| **Capacidades** — el QUÉ hace la empresa | **Procesos** — el CÓMO lo hace la empresa |
|---|---|
| Representa habilidades o aptitudes permanentes de la organización | Son secuencias de actividades que producen un resultado de valor |
| Son estables y relativamente independientes de cómo se implementan | Son dinámicos: pueden rediseñarse, tercerizarse o automatizarse |
| Responden a: ¿qué necesita poder hacer el negocio para lograr sus objetivos? | Responden a: ¿cómo ejecuta la empresa sus capacidades paso a paso? |
| *Ejemplo:* gestión de siniestros, suscripción de riesgos, relacionamiento con cliente | *Ejemplo:* proceso de recepción y análisis de siniestros, proceso de cotización |

### Marco de integración: capacidades × procesos (lámina 39)

Ejemplo del sector seguros:

| Nivel 1 (dominio) | Nivel 2 (capacidad) | Proceso asociado | KPI / resultado |
|---|---|---|---|
| Gestión comercial | Suscripción de riesgos | Proceso de cotización y aprobación | Tasa de conversión · % de riesgos aceptados |
| Gestión comercial | Relacionamiento con cliente | Proceso de servicio y atención al cliente | NPS · retención · % deserción |
| Gestión de siniestros | Recepción y análisis | Proceso de radicación y ajuste | Tiempo de ciclo · satisfacción |
| Gestión financiera | Facturación y cobro | Proceso de emisión y recaudo | % cartera vencida · días de recaudo |

> Cada capacidad puede soportarse en uno o más procesos. Un proceso puede contribuir a
> varias capacidades simultáneamente.

### Patrones de relación y uso (lámina 40)

- **1:N — una capacidad, varios procesos.** La capacidad «gestión de siniestros» se
  materializa en procesos distintos: recepción, ajuste, liquidación, pago. Permite
  modularidad y especialización.
- **N:1 — varios procesos, una capacidad.** Procesos de cotización web, presencial y móvil
  alimentan la misma capacidad de suscripción. Facilita la omnicanalidad sin duplicar
  capacidades.
- **N:M — cruce complejo.** Una capacidad puede compartir procesos con otras capacidades.
  Identificar estos cruces evita silos y revela oportunidades de reutilización de servicios.

**¿Para qué sirve en arquitectura?**
- Mapear capacidades a aplicaciones (*Application Capability Map*) para identificar deuda
  técnica.
- Detectar redundancias: procesos similares en distintas unidades de negocio que soportan
  la misma capacidad.
- Priorizar inversión tecnológica según capacidades críticas para la estrategia.
- **Diseñar APIs y microservicios alineados a capacidades, no a silos organizacionales.**

### Integración vertical: de la estrategia a la tecnología (lámina 41)

Caso de estudio: aseguradora.

```
Estrategia    →  Capacidad         →  Proceso (BPM)        →  Aplicaciones      →  Tecnología
Ser la           Emisión de           Validación de           Motor de reglas      Nube de alta
aseguradora      pólizas en           riesgo → cotización     + core de            disponibilidad
más rápida       tiempo real          → emisión               seguros
del mercado
```

> «La AE asegura la estructura; el BPM asegura el flujo. Juntos garantizan la trazabilidad
> *end-to-end*.»

### Valor estratégico de la AE (lámina 42)

- **Decisiones informadas:** basadas en datos y mapas de capacidad.
- **Eficiencia operativa:** reducción de redundancias.
- **Agilidad y resiliencia:** adaptación a cambios del mercado. Métricas RTO/RPO.
- **Alineación TI-negocio:** la tecnología habilita la misión.

### El ciclo de transformación de la AE (lámina 43)

> Principio de «dividir y conquistar»: la adopción es iterativa e incremental.

```
1. Planeación      →  2. Diagnóstico   →  3. Definición   →  4. Hoja de ruta  →  5. Gestión y
   Alcance y          (AS-IS)             (TO-BE)            Brechas y            gobierno
   visión             ¿Dónde estamos?     ¿Dónde queremos    proyectos            Mantenimiento
                                          estar?
```

### Principios para aplicar (lámina 44)

1. **Modela primero las capacidades.** Define el qué antes de diseñar procesos. Las
   capacidades son el lenguaje neutro entre negocio y TI.
2. **Usa la matriz como artefacto vivo.** El cuadro capacidad-proceso debe actualizarse en
   cada ciclo de planificación estratégica.
3. **Evalúa brechas por capacidad.** Para cada capacidad pregunta: ¿el proceso que la
   soporta es eficiente? ¿La tecnología es la adecuada?
4. **Alinea tu arquitectura de soluciones.** Cada solución de TI debe trazarse a una o más
   capacidades. **Si no, su valor de negocio es cuestionable.**

### TOGAF y el modelo ADM (lámina 45)

**TOGAF** (*The Open Group Architecture Framework*) es un marco de arquitectura empresarial
desarrollado por The Open Group que proporciona un método y herramientas para diseñar,
planificar, implementar y gobernar la arquitectura empresarial de una organización.

- Marco abierto y agnóstico a proveedores.
- Alinea la TI con los objetivos de negocio.
- Basado en mejores prácticas y probado en múltiples industrias.
- Proporciona un lenguaje común para la arquitectura empresarial.

**Principios de TOGAF:** enfoque en el stakeholder · cobertura *end-to-end* (negocio,
datos, aplicaciones y tecnología) · iteración continua · colaboración · gobernanza.

**Modelo ADM** (*Architecture Development Method*) — enfoque iterativo, con **gestión de
requerimientos** en el centro:

| Fase | Nombre | Tipo |
|---|---|---|
| Preliminar | Preliminar | Desarrollo |
| A | Visión de arquitectura | Desarrollo |
| B | Arquitectura de negocio | Desarrollo |
| C | Arquitectura de sistemas de información | Desarrollo |
| D | Arquitectura tecnológica | Desarrollo |
| E | Oportunidades y soluciones | Gobernanza y ejecución |
| F | Planificación de migración | Gobernanza y ejecución |
| G | Gobierno de implementación | Gobernanza y ejecución |
| H | Gestión de cambios de la arquitectura | Gobernanza y ejecución |

> **Tip de la lámina:** incluir siempre actuarios como stakeholders — sus modelos de riesgo
> impactan todas las capas.

### Comparativa de frameworks (lámina 46)

| Criterio | **TOGAF** | **Zachman** | **ArchiMate** |
|---|---|---|---|
| **Tipo** | Metodología | Taxonomía | Lenguaje de modelado |
| **Fortaleza** | Proceso paso a paso | Catalogación exhaustiva | Visualización |
| **¿Cuándo en seguros?** | Migrar core de pólizas | Auditoría regulatoria | Comunicar cambios a junta |
| **Compatibilidad** | Usa ArchiMate | Puede usar ArchiMate | Complementa ambos |

**Modelo Zachman aplicado a retail** — filas (perspectivas) × columnas (preguntas):

| | ¿QUÉ? (datos) | ¿CÓMO? (función) | ¿DÓNDE? (red/sistema) | ¿QUIÉN? (personas) | ¿CUÁNDO? (tiempo) | ¿POR QUÉ? (motivación) |
|---|---|---|---|---|---|---|
| **Contexto** (planificador) | Productos, clientes | Estrategia de experiencia | Canales de venta | Clientes, colaboradores | Calendario comercial | Rentabilidad, crecimiento |
| **Conceptual** (dueño) | Catálogo de productos | Procesos de negocio | Mapa de canales | Roles organizacionales | Eventos clave | Objetivos del negocio |
| **Lógico** (diseñador) | Modelo de datos | Servicios y reglas | Arquitectura de aplicaciones | Estructura organizacional | Flujos de información | Reglas de negocio |
| **Físico** (constructor) | Bases de datos | Componentes de software | Infraestructura tecnológica | Usuarios y dispositivos | Programación operativa | Métricas y KPIs |
| **Operacional** (subcontratista) | Datos en uso | Procesos ejecutados | Sistemas en producción | Personas en actividad | Eventos en curso | Resultados obtenidos |

### Pregunta de clase (lámina 47)

> **¿Cuál es el valor de la arquitectura?**
>
> A) Entregar el proyecto a tiempo y dentro del presupuesto
> B) Abordar un problema de negocio con una solución técnica que involucre tecnologías,
>    personas y procesos
> C) Hacer realidad la visión de la solución más efectiva

`PENDIENTE: la lámina no marca la respuesta. Confirmar en clase.` La opción B es la que
mejor concuerda con el resto del material —arquitectura como problema sociotécnico— pero
esto es lectura nuestra, no del profesor.

---

## 8. OKR

Cuatro láminas dedicadas a OKR. **No es material de relleno: la Entrega 1 exige definir al
menos 3 OKR** (ver [lámina 55](#pasos-clave-para-definir-una-solución-alineada-al-negocio-lámina-55)).

### Qué es OKR (lámina 48)

> OKR conecta la **estrategia** con la **ejecución** a través de objetivos inspiradores y
> resultados clave medibles.

Un marco de trabajo simple para definir objetivos ambiciosos y **medir resultados clave**.
Foco en lo que realmente importa; transparencia y alineación en todos los niveles.

```
OBJETIVO                    ALINEACIÓN                   RESULTADOS CLAVE
Ambicioso, cualitativo  →   Conecta estrategia,      →   Medibles, verificables
e inspirador                equipos y personas           y con tiempo definido
```

**Beneficios clave:** claridad sobre las prioridades · alineación entre equipos y niveles ·
mayor enfoque y disciplina · resultados medibles y transparentes.

> «OKR no es solo una herramienta, es una **disciplina** que impulsa la ejecución
> estratégica.»
> Creado por Andy Grove en Intel · popularizado por Google · adoptado globalmente.

### Cómo se construye (lámina 50)

| **O — Objective** · ¿hacia dónde vamos? | **KR — Key Results** · ¿cómo medimos el avance? |
|---|---|
| Cualitativo e inspirador | Cuantitativos y verificables |
| Ambicioso pero alcanzable | Máximo **3–5 por objetivo** |
| **Sin métricas** | Expresan **resultados, no tareas** |
| Horizonte temporal definido | Puntaje de 0.0 a 1.0 |
| Alinea al equipo con la visión | **0.7 = zona de éxito esperada** |

**Cuatro claves para implementar OKR con éxito:**

1. **Ambición calibrada.** Un KR con score 0.7 es éxito. Si siempre llegas a 1.0, tus
   objetivos no son suficientemente ambiciosos.
2. **Cascada vertical y horizontal.** Los OKR de equipos deben derivarse de los OKR de la
   organización y coordinarse entre equipos del mismo nivel.
3. **Revisión continua (check-ins).** No es un ejercicio anual. Los OKR se revisan
   semanalmente para detectar bloqueos y reasignar prioridades.
4. **Separar de compensación.** Los OKR no deben estar ligados directamente a bonos o
   evaluaciones: esto destruye la ambición y la honestidad.

> Empresas como SAP (Alemania), Adyen (Países Bajos) y Spotify (Suecia) reportan que los
> OKR **redujeron el time-to-market hasta en un 40%** al eliminar trabajo no alineado con
> la estrategia.

### La diferencia entre un sueño y un objetivo (lámina 51)

> **«La diferencia entre un sueño y un objetivo es un Key Result.»**
> «OKR no es un formulario. Es una conversación continua sobre lo que más importa.»

**Ejemplo de un OKR:**
- **Objetivo:** incrementar la recompra por parte de los clientes actuales.
- **KR1:** incrementar en 15% el número de clientes que recompran.
- **KR2:** lograr ingresos por recompras de xxx millones.

Referencia: Andy Grove (Intel) · John Doerr (Google) · *Measure What Matters* (2018).

### Tres ejemplos reales — empresas europeas (lámina 49)

| Empresa | Objective | Key Results |
|---|---|---|
| **Volkswagen Group** (Alemania, Q1 2024) · automoción | «Acelerar la transición hacia la movilidad eléctrica y reducir nuestra huella de carbono» | Lanzar 4 modelos EV nuevos en Europa en Q1 2024 · Alcanzar 25% de ventas eléctricas sobre total de unidades · Reducir emisiones de producción en 30% vs. 2020 |
| **Ørsted A/S** (Dinamarca, 2023) · sostenibilidad | «Convertirnos en la empresa de energía renovable más sostenible del planeta» | Operar 20 GW de capacidad eólica offshore instalada · Reducir intensidad de carbono a 11 g CO₂/kWh · Alcanzar 99% de energía renovable en operaciones propias |
| **Philips N.V.** (Países Bajos, 2023) · salud digital | «Transformar la experiencia del paciente mediante soluciones de salud digital integradas» | Conectar 10 millones de pacientes a plataformas remotas · Reducir tiempo de diagnóstico en UCI en 20% · NPS de hospitales clientes ≥ 65 puntos |

> «Los OKR convierten la estrategia en acción medible, generando impacto real en los
> negocios.»

**Patrón a copiar:** el Objective es una frase cualitativa entre comillas. Cada KR tiene
**una métrica, un número y una referencia** (vs. año base, o un umbral absoluto). Ninguno
describe una tarea.

---

## 9. El proyecto integrador

### El arco del proyecto (lámina 52)

> Desarrollaremos un proyecto **evolutivo** a lo largo de toda la materia.

```
ANALIZAR   →   DISEÑAR      →   CONSTRUIR     →   EVOLUCIONAR   →   VALOR
Entendemos     Definimos la     Implementamos     Mejoramos y       Entregamos
los            arquitectura     de forma          adaptamos la      valor continuo
requerimientos y las mejores    iterativa e       solución a        con calidad y
y el contexto  soluciones       incremental       nuevos desafíos   escalabilidad
```

### Dos casos de ejemplo del profesor

Las láminas 53 y 54 presentan dos sistemas ya desarrollados como ejemplo del nivel
esperado. **Sirven de referencia para calibrar las ideas del equipo.**

#### Caso A — Control de acceso en el estadio (lámina 53)

*Flujo de paso por diferentes puertas:*

1. **Llegada al estadio.** El asistente llega y se dirige al primer punto de acceso.
2. **Validación de credenciales.** Se valida la entrada (digital, QR, tarjeta o biometría)
   contra el sistema central. → *Verificación en tiempo real con listas de control y
   políticas de acceso: listas negras, entradas inválidas, duplicadas.*
3. **Acceso autorizado y apertura.** Si la validación es exitosa, se habilita la apertura
   de la puerta. → *Control por zonas y niveles de acceso: general, VIP, palcos, backstage,
   staff.*
4. **Tránsito por áreas internas.** En cada puerta o área se repite la validación según el
   nivel de acceso requerido.
5. **Salida del estadio.** Se registra la salida y se libera el acceso para futuros
   ingresos según las reglas. → *Registro y monitoreo continuo para análisis en tiempo real
   y mejora operativa.*

Todo se apoya en una **plataforma central de control de acceso** que gestiona identidades,
permisos, dispositivos, políticas, monitoreo y auditoría en tiempo real.

**Atributos de calidad que requiere la solución** *(así los enuncia la lámina — este es el
nivel de detalle esperado)*:

| Atributo | Enunciado |
|---|---|
| **Seguridad** | Protección de identidades, datos y dispositivos. Autenticación fuerte, control de acceso basado en roles y encriptación de extremo a extremo |
| **Disponibilidad** | El sistema debe estar disponible 24/7 para garantizar el acceso fluido de los asistentes en todo momento |
| **Resiliencia** | Capacidad de operar ante fallos de red, dispositivos o servicios. **Funcionamiento offline en puertas con sincronización posterior** |
| **Auditoría** | Registro completo y trazable de todos los eventos de acceso y cambios de configuración para cumplimiento normativo y análisis forense si es necesario |

#### Caso B — Sistema de despacho en línea de comida y licor (lámina 54)

> El objetivo es entregar una experiencia rápida, segura y confiable, conectando clientes,
> restaurantes, tiendas y aliados logísticos **en tiempo real**.

```
01 PEDIDO         →  02 RESTAURANTE/    →  03 DESPACHO      →  04 SEGUIMIENTO    →  05 ENTREGA
El cliente           TIENDA                El aliado           EN TIEMPO REAL       El pedido llega
realiza el           El comercio           logístico           El cliente sigue     al cliente y se
pedido desde         confirma el pedido    recoge y            su pedido en         confirma la
la app o web         y prepara el          transporta          tiempo real          entrega
                     producto              el pedido           en el mapa
```

**Atributos que destaca la lámina:** seguridad (datos de usuarios, comercios y
transacciones) · velocidad (tiempos de preparación, recolección y entrega) · escalabilidad
(arquitectura preparada para crecer en usuarios, ciudades y comercios) · confiabilidad
(sistema disponible 24/7 con monitoreo y respuesta automática) · alianzas.

### Pasos clave para definir una solución alineada al negocio (lámina 55)

**Esta es la rúbrica de la Entrega 1.** Seis pasos, en dos bloques:

#### Definir el QUÉ

1. **Define el modelo de negocio.** Comprende cómo se crea, entrega y captura valor.
2. **Completa las premisas que necesita para que el caso de negocio tenga sentido.**
   Identifica supuestos críticos, restricciones y dependencias.
3. **Alinea la expectativa del negocio con la solución que se proponga.** Asegura que la
   solución resuelva necesidades reales y genere valor.
4. **Define por lo menos 3 OKR que apunten al propósito.** Establece objetivos ambiciosos
   y medibles que guíen el éxito.

#### Definir el CÓMO

5. **Identifica el estilo de arquitectura propuesto como alternativa de solución y
   justifica tu respuesta.** Evalúa opciones tecnológicas según criterios de negocio y
   técnicos.
6. **Define una estrategia de implementación clara y justifícala.** Establece hitos,
   recursos, riesgos y cómo medirás el progreso.

> «Enfoque estratégico, diseño inteligente y ejecución con propósito.»

**Consecuencia práctica.** La Entrega 1 **no es solo llenar el Canvas**. El Canvas cubre
el paso 1; los pasos 2 a 6 son documento aparte. Ver
[`../proyecto/01-caso-de-negocio/`](../proyecto/01-caso-de-negocio/).

### Definición completa del caso de negocio (lámina 56)

Una tabla de seis filas numeradas con una columna «Puntos», **presentada en blanco** para
llenarse en clase.

> Complete la definición del caso de negocio siguiendo el orden sugerido. Cada elemento
> debe aportar claridad sobre el problema, la solución y el valor esperado.

**Tips clave:**
- Sea específico y concreto.
- Enfoque en el valor para el negocio.
- **Use datos y supuestos validados.**
- Piense en el impacto a corto y largo plazo.

> «Un caso de negocio bien definido es la base para tomar decisiones acertadas.»

`PENDIENTE: la tabla viene vacía y tiene una columna «Puntos» que sugiere una rúbrica
puntuada. Confirmar con el profesor si los 6 elementos son los mismos 6 pasos de la lámina
55 y cuántos puntos vale cada uno.` Mientras tanto asumimos que sí — es la lectura más
natural, y es la que sigue nuestra Entrega 1.

### El Business Model Canvas (lámina 57)

> Un modelo visual para diseñar, analizar y comunicar cómo creamos, entregamos y
> capturamos valor.

Características que destaca la lámina: enfocado en el cliente y el valor · alinea
actividades y recursos clave · conecta ingresos con costos · modelo simple, claro y
colaborativo.

Los nueve bloques con sus preguntas guía, tal como aparecen:

| Bloque | Preguntas |
|---|---|
| **Key Partners** | ¿Quiénes son nuestros socios clave? ¿Quiénes son nuestros proveedores clave? ¿Qué actividades adquirimos de partners? |
| **Key Activities** | ¿Qué actividades clave requieren nuestras propuestas de valor? ¿Cuáles canales? ¿Relaciones con clientes? ¿Fuentes de ingresos? |
| **Key Resources** | ¿Qué recursos clave requieren nuestras propuestas de valor? ¿Canales? ¿Relaciones con clientes? ¿Fuentes de ingresos? |
| **Value Propositions** | ¿Qué valor entregamos al cliente? ¿Cuál problema solucionamos? ¿Qué necesidades satisfacemos? |
| **Customer Relationships** | ¿Qué tipo de relación espera cada segmento? ¿Cómo las establecemos? ¿Cómo se integran con nuestro modelo de negocio? ¿Cuál es su costo? |
| **Channels** | ¿A través de qué canales quieren ser alcanzados nuestros segmentos? ¿Cómo los alcanzamos? ¿Cuáles funcionan mejor? ¿Cuáles son más eficientes? ¿Cómo se integran con las rutinas del cliente? |
| **Customer Segments** | ¿Para quién creamos valor? ¿Quiénes son nuestros clientes más importantes? |
| **Cost Structure** | ¿Cuáles son los costos más importantes de nuestro modelo de negocio? |
| **Revenue Streams** | ¿Por qué valor están realmente dispuestos a pagar nuestros clientes? ¿Por qué pagan actualmente? ¿Cómo prefieren pagar? ¿Qué aporta cada fuente de ingresos a los ingresos totales? |

El ejemplo mostrado es un canvas real de **Juramelo.es** (Begoña Martínez, 19/09/2012,
iteración 2), un servicio de traducción jurada: segmentos particulares (inmigrantes,
estudiantes), prescriptores (universidades, ONGs) y canal de abogados/gestores; propuesta
de valor «más barato, más rápido, más fácil» y «confianza: seguro, rápido, con garantías».

> «Un modelo de negocio sólido alinea nuestras actividades, recursos y alianzas para
> entregar valor real y sostenible a nuestros clientes.»

---

## Lo que este material implica para el proyecto

| Concepto de clase | Dónde se usa |
|---|---|
| Los 6 pasos de la lámina 55 | **Estructura literal de la Entrega 1** |
| Business Model Canvas (lámina 57) | Paso 1 de la Entrega 1 |
| OKR (láminas 48-51) | Paso 4 de la Entrega 1: mínimo 3 OKR |
| Estilos de arquitectura y trade-offs | Pasos 5-6 de la Entrega 1, y toda la Entrega 2 |
| Formato ADR de 8 elementos (lámina 21) | `proyecto/decisiones/` |
| Ejemplo CAP (lámina 23) | Plantilla de razonamiento para justificar decisiones |
| Atributos de calidad de los casos 53-54 | Calibrar el nivel de detalle esperado |
| Capacidades vs. procesos (láminas 37-41) | Entrega 2: derivar servicios de capacidades, no de silos |
| Ciclo AS-IS → TO-BE → hoja de ruta (lámina 43) | Entrega 2 y estrategia de implementación |

## Dudas para el profesor

**La lista viva está en [`../ESTADO.md`](../ESTADO.md), que es donde se mantiene.** Las que
salieron de este material: la definición de **política** de la lámina 17 (externa, sin
excepciones) contra la del cuestionario de fundamentos (interna, con ruta de excepción), y
la respuesta correcta de la **lámina 47** sobre el valor de la arquitectura.

*Resueltas: la tabla vacía de la lámina 56 la respondió la rúbrica del 8 de septiembre —son
cinco componentes con pesos 10/15/25/25/25—, y el formato de la Entrega 1 se resolvió
entregando en `.docx`.*
