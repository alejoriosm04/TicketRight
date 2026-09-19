# Rúbrica del Entregable 2 — once entregables

> Digitalización fiel de `curso/material/2026-09-12-rubrica-entregable-2.html`, la rúbrica
> que publicó el profesor. **Se lee antes de escribir, no después.** El original es el que
> manda: si algo aquí contradice el HTML, gana el HTML.

**Escala 0 a 5 · 11 entregables · 100% distribuido en 9 calificables · 2 de bonificación.**

> ⚠️ **Es la rúbrica del proyecto completo, no la de una sola semana.** Varios criterios
> piden evidencia de ejecución —«plataforma funcionando», «reporte de ejecución», «bitácora
> de experimentos»—: eso se cumple en la **Entrega 3**. Lo que se entrega el 19 de
> septiembre es la **definición y el diseño** de los once. Ver
> [el alcance en el README](README.md#lo-primero-el-alcance-y-está-confirmado).

Cada entregable se califica de 0 a 5 sobre varios criterios y aporta a la nota final según
su porcentaje de participación. **El nivel se asigna por evidencia observable en el
artefacto entregado, no por intención declarada.**

## Contenido

| # | Entregable | Peso | Aporte máx. |
|---|---|---|---|
| — | [Escala de valoración](#escala-de-valoración) | — | — |
| 1 | [Modelo de dominio (completo)](#1-modelo-de-dominio-completo) | 5% | 0,25 |
| 2 | [**ADR — Architectural Decision Record**](#2-adr--architectural-decision-record) | **25%** | 1,25 |
| 3 | [**Arquitectura de referencia**](#3-arquitectura-de-referencia) | **20%** | 1,00 |
| 4 | [**Arquitectura de implementación**](#4-arquitectura-de-implementación) | **20%** | 1,00 |
| 5 | [Diagrama de clases (de un caso)](#5-diagrama-de-clases-de-un-caso) | 5% | 0,25 |
| 6 | [Diagrama de secuencia (de un caso)](#6-diagrama-de-secuencia-de-un-caso) | 5% | 0,25 |
| 7 | [Prototipo de interfaz de usuario](#7-prototipo-de-interfaz-de-usuario) | 10% | 0,50 |
| 8 | [Plataforma de observabilidad](#8-plataforma-de-observabilidad) | 5% | 0,25 |
| 9 | [Plan de pruebas unitarias](#9-plan-de-pruebas-unitarias) | 5% | 0,25 |
| 10 | [Definición de volumetría](#10-definición-de-volumetría-para-pruebas) | 0% | +0,25 bonif. |
| 11 | [Módulo de inyección de fallos](#11-módulo-de-inyección-de-fallos) | 0% | +0,25 bonif. |
| — | [Cálculo de la nota](#cálculo-de-la-nota) | 100% | 5,00 |

**Los entregables 2, 3 y 4 concentran el 65%.** Ahí es donde se gana o se pierde.

---

## Escala de valoración

La misma escala aplica a cada criterio dentro de cada entregable.

| Nivel | | Descriptor |
|---|---|---|
| **5** | Excelente | Cumple todo lo pedido y además demuestra criterio arquitectónico propio: justifica, anticipa consecuencias y conecta el artefacto con el resto del proyecto. **Nivel presentable ante un comité técnico real** |
| **4** | Sobresaliente | Cumple todo lo pedido con buena calidad. Hay detalles menores por pulir que no comprometen el resultado |
| **3** | Aceptable | Cumple lo mínimo exigido. El artefacto es correcto pero superficial: describe sin justificar, o deja vacíos que obligan a preguntar para entenderlo |
| **2** | Deficiente | Entrega parcial o con errores conceptuales. Falta más de la mitad de lo esperado o hay contradicciones con otros entregables |
| **1** | Insuficiente | Hay entrega, pero es anecdótica o incorrecta. Notación equivocada o contenido genérico sin relación con el dominio del proyecto |
| **0** | Sin entregar | No se entregó, se entregó fuera de plazo sin autorización, o lo entregado no corresponde a lo solicitado |

Los niveles 4 y 2 son intermedios. **Ante duda entre dos niveles se asigna el menor** y se
documenta la razón en la retroalimentación.

---

## 1. Modelo de dominio (completo)

**5%.** Diagrama que muestra las entidades del dominio, sus atributos, relaciones y reglas
de negocio.

**Cobertura del dominio · 30%**
- **5 —** Modela todo el dominio del problema, no solo los casos de uso implementados. Distingue subdominios o contextos acotados y explica el porqué de los límites.
- **3 —** Cubre las entidades principales necesarias para los casos de uso, pero deja fuera conceptos del dominio mencionados en el enunciado.
- **1 —** Solo hay tres o cuatro entidades genéricas (usuario, producto, pedido) que podrían pertenecer a cualquier proyecto.

**Entidades y atributos · 20%**
- **5 —** Cada entidad tiene identidad clara, atributos con tipo y semántica, y se distingue entre entidades, objetos de valor y agregados con su raíz.
- **3 —** Entidades con atributos razonables, pero sin tipos, o mezclando conceptos de persistencia (llaves foráneas, tablas puente) con conceptos de dominio.
- **1 —** Atributos incompletos, sin nombre significativo, o el modelo es en realidad un esquema de base de datos disfrazado.

**Relaciones y cardinalidades · 20%**
- **5 —** Todas las relaciones están nombradas, con cardinalidad y direccionalidad correctas, y las decisiones de navegabilidad están justificadas.
- **3 —** Relaciones presentes con cardinalidad, pero sin nombre o con algunas multiplicidades imprecisas.
- **1 —** Líneas sin cardinalidad, relaciones ambiguas o cardinalidades que contradicen las reglas del negocio.

**Reglas de negocio e invariantes · 20%**
- **5 —** Documenta invariantes y restricciones del dominio, indicando dónde se hacen cumplir y qué pasa cuando se violan.
- **3 —** Enuncia algunas reglas en texto libre, sin vincularlas explícitamente a entidades o relaciones.
- **1 —** No hay reglas de negocio, o las que aparecen son validaciones de formulario, no reglas del dominio.

**Notación y lenguaje ubicuo · 10%**
- **5 —** Notación consistente y legible; los nombres coinciden con el vocabulario del negocio y se mantienen idénticos en todos los demás entregables.
- **3 —** Diagrama legible, con mezcla ocasional de notaciones o nombres técnicos en lugar de términos del negocio.
- **1 —** Diagrama ilegible, sin convención reconocible, o con nombres que cambian entre documentos.

**Evidencias mínimas:** diagrama del dominio completo en alta resolución · glosario de
términos del dominio · listado de reglas de negocio numeradas · identificación de agregados
y sus raíces.

**Errores que bajan la nota:** entregar un modelo entidad-relación de base de datos en
lugar de un modelo de dominio · modelar solo lo que se va a construir y llamarlo «dominio
completo» · nombres de entidades que no aparecen luego en el diagrama de clases ni en el
código.

---

## 2. ADR — Architectural Decision Record

**25% — el entregable de mayor peso del proyecto.** Documento que registra las decisiones
clave de arquitectura, con su contexto, alternativas, motivación y consecuencias.

> **«Evalúa el pensamiento arquitectónico, no la cantidad de páginas: un ADR sin
> alternativas descartadas no es un ADR, es una justificación a posteriori.»**

**Selección de decisiones · 15%**
- **5 —** Registra las decisiones verdaderamente significativas —las costosas de revertir— cubriendo **estructura, datos, integración, despliegue y transversales**. No documenta trivialidades.
- **3 —** Hay varios ADR, pero mezclan decisiones estructurales con elecciones menores (librería de fechas, nombre de carpetas) y falta alguna decisión crítica.
- **1 —** Uno o dos ADR, o se documentan solo preferencias de herramienta sin impacto arquitectónico.

**Contexto y fuerzas · 20%**
- **5 —** El contexto expone el problema, las restricciones reales (presupuesto, plazos, equipo, regulación, legado) y **los atributos de calidad en tensión** que fuerzan la decisión.
- **3 —** Describe la situación de forma general, pero no identifica las fuerzas en conflicto ni los atributos de calidad involucrados.
- **1 —** El contexto es una descripción del producto, no del problema que obliga a decidir.

**Alternativas y criterios de comparación · 25%**
- **5 —** Al menos dos alternativas viables por decisión, evaluadas contra criterios explícitos y comparables. Queda claro qué se sacrifica al descartar cada una.
- **3 —** Menciona alternativas, pero las descarta con una frase y sin criterios comunes de comparación.
- **1 —** No hay alternativas, o las alternativas son **de paja**: opciones evidentemente inviables puestas para justificar la elegida.

**Decisión y justificación · 20%**
- **5 —** La decisión está enunciada de forma inequívoca y su justificación se deriva directamente del contexto y de los criterios declarados. Es trazable hasta la arquitectura entregada.
- **3 —** La decisión es clara, pero la justificación apela a popularidad o preferencia del equipo más que a los criterios definidos.
- **1 —** La decisión es ambigua, o no se encuentra reflejada en la arquitectura de referencia ni de implementación.

**Consecuencias · 15%**
- **5 —** Registra consecuencias positivas y negativas, deuda técnica asumida, riesgos, nuevas restricciones y **condiciones bajo las cuales la decisión debería revisarse**.
- **3 —** Lista beneficios y alguna desventaja genérica, sin riesgos ni deuda técnica.
- **1 —** Solo consecuencias positivas: la sección es publicidad de la decisión tomada.

**Formato, estado y trazabilidad · 5%**
- **5 —** Formato uniforme y numerado, con estado (propuesto, aceptado, reemplazado), fecha, responsables y enlaces entre ADR relacionados.
- **3 —** Formato consistente pero sin estado ni relación entre decisiones.
- **1 —** Documentos sueltos, sin numeración ni estructura común.

**Evidencias mínimas:** índice de ADR con número, título y estado · cada ADR con las cuatro
secciones (contexto, decisión, alternativas, consecuencias) · matriz de comparación de
alternativas para las decisiones mayores · referencia cruzada entre cada ADR y los
componentes afectados.

**Errores que bajan la nota:** redactar el ADR después de construir, describiendo lo que ya
se hizo · confundir decisión arquitectónica con requisito funcional · repetir el mismo
contexto en todos los ADR sin diferenciar las fuerzas de cada uno.

---

## 3. Arquitectura de referencia

**20%.** Vista de alto nivel de la solución, con sus capas, componentes, tecnologías y
patrones. **Sin marcas ni proveedores** — ver la
[explicación del profesor](../../curso/clase-03-04-transcripcion.md#8-arquitectura-de-referencia-vs-arquitectura-de-implementación).

**Estructura en capas y separación de responsabilidades · 20%**
- **5 —** Capas bien delimitadas (canales, aplicación, servicios, datos) con reglas explícitas de dependencia y de qué no puede cruzar cada frontera.
- **3 —** Las capas aparecen dibujadas, pero no se explicitan las reglas de dependencia ni qué se prohíbe.
- **1 —** Cajas apiladas sin criterio de separación; hay componentes que pertenecen a varias capas a la vez.

**Componentes y responsabilidades · 20%**
- **5 —** Cada componente tiene una responsabilidad única y enunciada, con sus interfaces expuestas y consumidas. Se entiende sin explicación verbal.
- **3 —** Componentes nombrados con una descripción breve, pero con responsabilidades solapadas o interfaces no declaradas.
- **1 —** Componentes con nombres genéricos («backend», «lógica») sin responsabilidad definida.

**Patrones arquitectónicos · 20%**
- **5 —** Los patrones aplicados están nombrados, justificados por el problema que resuelven y consistentes con los ADR. **Se reconocen sus contraindicaciones.**
- **3 —** Se nombran patrones correctamente, pero sin justificar por qué ese y no otro.
- **1 —** Se invocan patrones de moda sin que la arquitectura los implemente realmente.

**Atributos de calidad · 20%**
- **5 —** Define **escenarios de calidad medibles** (disponibilidad, latencia, escalabilidad, seguridad, mantenibilidad) y muestra qué decisión arquitectónica los soporta.
- **3 —** Enumera atributos de calidad deseables sin métricas ni vínculo con los componentes que los garantizan.
- **1 —** No se consideran atributos de calidad, o se mencionan como adjetivos («debe ser rápida y segura»).

**Selección tecnológica · 10%**
- **5 —** Tecnologías coherentes entre sí, alineadas con los ADR y con las capacidades del equipo; se explicita qué es decisión y qué es supuesto.
- **3 —** Tecnologías listadas y razonables, pero sin relación con las decisiones registradas.
- **1 —** Listado de logos sin criterio ni compatibilidad entre las piezas.

**Notación y comunicación · 10%**
- **5 —** Notación consistente con convención declarada (C4, UML u otra), con leyenda, niveles de abstracción claros y un diagrama que comunica por sí solo.
- **3 —** Diagrama entendible, pero mezcla niveles de abstracción o carece de leyenda.
- **1 —** Diagrama sobrecargado o ilegible, sin convención reconocible.

**Evidencias mínimas:** diagrama de arquitectura de referencia con leyenda · tabla de
componentes y responsabilidades · **escenarios de atributos de calidad (estímulo, respuesta,
medida)** · patrones aplicados y su justificación.

**Errores que bajan la nota:** presentar la arquitectura de implementación como si fuera la
de referencia · diagramas con quince tecnologías y ninguna responsabilidad declarada ·
atributos de calidad sin métrica: no se pueden verificar ni probar.

---

## 4. Arquitectura de implementación

**20%.** Detalle técnico de cómo se despliegan los componentes, integraciones,
infraestructura y configuraciones. **Aquí sí van proveedores y tecnologías concretas.**

**Topología de despliegue · 20%**
- **5 —** Nodos, zonas, redes, subredes y fronteras de confianza definidos; se entiende dónde corre cada componente y cómo se comunica con los demás.
- **3 —** Muestra dónde se despliega cada componente, pero sin redes, zonas ni fronteras.
- **1 —** Un diagrama de nube genérico sin correspondencia con los componentes de la arquitectura de referencia.

**Integraciones y contratos · 20%**
- **5 —** Cada integración declara protocolo, formato, sincronía, contrato, versionado y manejo de errores y reintentos.
- **3 —** Las integraciones están dibujadas con su protocolo, pero sin contratos ni política de errores.
- **1 —** Flechas entre cajas sin indicar qué viaja, en qué formato ni con qué protocolo.

**Infraestructura y configuración · 20%**
- **5 —** Contenedores, orquestación y configuración parametrizada por ambiente; hay infraestructura como código o manifiestos reproducibles.
- **3 —** Define la infraestructura necesaria y algunos parámetros, pero la configuración es manual o está embebida.
- **1 —** No se distingue entre ambientes ni se explica cómo se configura o despliega la solución.

**Escalabilidad, disponibilidad y resiliencia · 15%**
- **5 —** Estrategia explícita de escalamiento, redundancia, tolerancia a fallos y recuperación, coherente con los escenarios de calidad definidos.
- **3 —** Menciona balanceo o réplicas sin dimensionar ni explicar el comportamiento ante fallo.
- **1 —** Arquitectura con puntos únicos de falla no identificados y sin ninguna consideración de disponibilidad.

**Seguridad · 15%**
- **5 —** Autenticación, autorización, gestión de secretos, cifrado en tránsito y en reposo, y segmentación de red, con el modelo de amenazas que los motiva.
- **3 —** Incluye autenticación y HTTPS, pero omite secretos, autorización fina o cifrado en reposo.
- **1 —** La seguridad no aparece, o se reduce a una mención de «login».

**Trazabilidad con la arquitectura de referencia · 10%**
- **5 —** Cada elemento de implementación se puede rastrear hasta un componente de la referencia **y hasta un ADR**.
- **3 —** Hay correspondencia general, con algunos componentes que aparecen o desaparecen sin explicación.
- **1 —** Las dos arquitecturas describen soluciones distintas.

**Evidencias mínimas:** diagrama de despliegue por ambiente · tabla de integraciones con
protocolo y contrato · manifiestos, scripts o definición de infraestructura · matriz de
trazabilidad referencia → implementación.

**Errores que bajan la nota:** copiar un diagrama de referencia del proveedor de nube sin
adaptarlo · declarar alta disponibilidad con una sola instancia de base de datos ·
**credenciales visibles en archivos de configuración entregados**.

---

## 5. Diagrama de clases (de un caso)

**5%.** Clases, atributos, métodos y relaciones **para un caso específico**, no para todo el
sistema.

**Selección y alcance del caso · 10%**
- **5 —** El caso elegido es representativo y con complejidad suficiente; se justifica por qué se escogió y qué deja fuera.
- **3 —** El caso está identificado, pero es trivial (un CRUD simple) o no se acota explícitamente.
- **1 —** No se indica a qué caso corresponde el diagrama.

**Clases, atributos y métodos · 30%**
- **5 —** Clases con responsabilidad única, atributos y métodos con tipo, visibilidad y firma completa. Se distinguen entidades, servicios, repositorios y objetos de valor.
- **3 —** Clases razonables con atributos y algunos métodos, pero sin tipos o sin visibilidad.
- **1 —** Cajas con nombres sin atributos ni métodos, o clases que son en realidad tablas.

**Relaciones y multiplicidad · 25%**
- **5 —** Usa correctamente asociación, agregación, composición, herencia y dependencia, con multiplicidades y navegabilidad justificadas.
- **3 —** Relaciones presentes y en su mayoría correctas, con confusión entre agregación y composición o multiplicidades faltantes.
- **1 —** Todas las relaciones son líneas iguales sin semántica ni multiplicidad.

**Coherencia con dominio y arquitectura · 20%**
- **5 —** Las clases se derivan del modelo de dominio y respetan las capas y patrones de la arquitectura de referencia.
- **3 —** Hay correspondencia parcial: algunos nombres o conceptos difieren del modelo de dominio.
- **1 —** El diagrama contradice el modelo de dominio o ignora la estructura en capas.

**Notación UML · 15%**
- **5 —** Notación UML impecable: compartimentos, estereotipos, símbolos y direcciones correctos; diagrama limpio y legible.
- **3 —** Notación mayormente correcta con errores puntuales de símbolo o dirección.
- **1 —** Notación inventada o sistemáticamente incorrecta.

**Evidencias mínimas:** diagrama de clases UML del caso · identificación del caso de uso y
su alcance · correspondencia con las entidades del modelo de dominio.

---

## 6. Diagrama de secuencia (de un caso)

**5%.** Interacción entre objetos y flujo de mensajes en un escenario específico.

**Correspondencia con el caso de uso · 15%**
- **5 —** El escenario cubre por completo el caso seleccionado, con precondiciones y postcondiciones declaradas.
- **3 —** Representa el caso, pero solo el flujo feliz y sin condiciones de entrada o salida.
- **1 —** El escenario no corresponde a ningún caso de uso definido.

**Participantes y líneas de vida · 15%**
- **5 —** Actores, componentes y objetos correctos, con líneas de vida y barras de activación bien usadas; **los participantes coinciden con el diagrama de clases**.
- **3 —** Participantes adecuados, pero sin activaciones o con granularidad inconsistente.
- **1 —** Participantes arbitrarios que no existen en la arquitectura ni en el diagrama de clases.

**Flujo de mensajes · 25%**
- **5 —** Mensajes numerados, con nombre de operación, parámetros relevantes y retorno; distingue llamadas síncronas, asíncronas y respuestas.
- **3 —** Orden correcto de mensajes con nombres genéricos y sin distinguir sincronía.
- **1 —** Flechas sin nombre ni orden, o secuencia lógicamente imposible.

**Flujos alternativos y de error · 20%**
- **5 —** Usa fragmentos combinados (`alt`, `opt`, `loop`, `par`) para representar excepciones, timeouts, reintentos y compensaciones.
- **3 —** Menciona una alternativa o error, sin usar fragmentos o sin cubrir los casos críticos.
- **1 —** **Solo flujo feliz: el diagrama supone que nada falla.**

**Coherencia con clases y componentes · 15%**
- **5 —** Cada mensaje corresponde a un método existente en el diagrama de clases y respeta las fronteras entre capas.
- **3 —** Correspondencia parcial; algunos mensajes no tienen método equivalente.
- **1 —** La secuencia salta capas o invoca operaciones inexistentes.

**Notación UML · 10%**
- **5 —** Notación correcta y legible, con leyenda cuando se requiere.
- **3 —** Errores menores de notación que no impiden la lectura.
- **1 —** Notación incorrecta o diagrama ilegible.

**Evidencias mínimas:** diagrama de secuencia UML del caso · precondiciones y
postcondiciones · **al menos un flujo alternativo o de error representado**.

---

## 7. Prototipo de interfaz de usuario

**10%.** Diseño funcional de las pantallas principales que muestran la experiencia del
usuario (UI/UX).

**Cobertura de pantallas y flujos · 25%**
- **5 —** Cubre todos los flujos principales de extremo a extremo, **incluyendo estados vacíos, de carga y de error**.
- **3 —** Incluye las pantallas principales del flujo feliz, sin estados vacíos ni de error.
- **1 —** Dos o tres pantallas sueltas que no forman un flujo completo.

**Navegación y arquitectura de información · 20%**
- **5 —** Mapa de navegación explícito, jerarquía de contenidos clara y el usuario siempre sabe dónde está y cómo volver.
- **3 —** La navegación se infiere de las pantallas, pero no hay mapa ni jerarquía declarada.
- **1 —** Pantallas sin conexión entre sí; no se entiende cómo se llega a cada una.

**Usabilidad y accesibilidad · 20%**
- **5 —** Aplica heurísticas reconocidas y criterios de accesibilidad (contraste, foco, tamaños táctiles, textos alternativos), y lo justifica.
- **3 —** Interfaz usable e intuitiva, pero sin consideraciones explícitas de accesibilidad.
- **1 —** Interfaz confusa, con acciones ambiguas o sin retroalimentación al usuario.

**Consistencia visual · 15%**
- **5 —** Sistema de diseño coherente: tipografía, color, espaciado y componentes reutilizables definidos y aplicados sin excepción.
- **3 —** Estilo razonablemente consistente con variaciones no intencionales entre pantallas.
- **1 —** Cada pantalla parece de un producto distinto.

**Fidelidad e interactividad · 10%**
- **5 —** Prototipo navegable con transiciones reales, que permite recorrer el flujo sin explicación externa.
- **3 —** Maquetas estáticas de fidelidad media, con el flujo indicado mediante flechas.
- **1 —** Bocetos a mano alzada sin estructura ni flujo definido.

**Alineación con dominio y casos de uso · 10%**
- **5 —** Los datos, campos y acciones de la interfaz corresponden exactamente a las entidades y operaciones del dominio.
- **3 —** Correspondencia general, con campos inventados o faltantes respecto al modelo.
- **1 —** La interfaz muestra un producto distinto al modelado.

**Evidencias mínimas:** prototipo navegable o enlace a la herramienta de diseño · mapa de
navegación · pantallas de estado vacío, carga y error · definición de componentes y estilos
reutilizables.

---

## 8. Plataforma de observabilidad

**5%.** Monitoreo, métricas, trazas y logs. *«Pesa poquito acá, pero pesa mucho allá.»*

**Métricas · 25%**
- **5 —** Métricas técnicas **y de negocio** con indicadores y objetivos de nivel de servicio declarados; se justifica qué se mide y por qué.
- **3 —** Métricas básicas de infraestructura (CPU, memoria) sin indicadores de servicio ni objetivos.
- **1 —** Se nombra una herramienta de monitoreo sin definir ninguna métrica.

**Trazas distribuidas · 25%**
- **5 —** Trazabilidad de extremo a extremo con propagación de contexto entre servicios; permite reconstruir una transacción completa.
- **3 —** Hay trazas instrumentadas, pero se pierden al cruzar componentes o no se correlacionan.
- **1 —** No hay trazas o se confunden con registros de log.

**Logs · 20%**
- **5 —** Logs estructurados, con niveles, identificador de correlación y política de retención; sin datos sensibles expuestos.
- **3 —** Logs presentes y centralizados, pero en texto libre y sin correlación.
- **1 —** Impresiones por consola sin centralización ni estructura.

**Tableros y alertas · 15%**
- **5 —** Tableros orientados a preguntas operativas concretas y alertas accionables con umbral, severidad y responsable.
- **3 —** Existe un tablero general; las alertas son genéricas o no están definidas.
- **1 —** No hay tableros ni alertas.

**Evidencia de implementación · 15%**
- **5 —** **Plataforma funcionando** con capturas o demostración en vivo, y la instrumentación visible en el código.
- **3 —** Configuración parcial con evidencia limitada de funcionamiento.
- **1 —** Solo se describe la intención; no hay nada operando.

**Evidencias mínimas:** capturas de tableros con datos reales · catálogo de métricas e
indicadores de nivel de servicio · ejemplo de traza completa de una transacción ·
definición de alertas con umbrales.

---

## 9. Plan de pruebas unitarias

**5%.** Estrategia, casos y resultados de pruebas unitarias sobre los casos de uso definidos.

**Estrategia y alcance · 20%**
- **5 —** Declara qué se prueba, qué no y por qué; cubre todos los casos de uso definidos y explicita el uso de dobles de prueba.
- **3 —** Cubre los casos de uso principales sin declarar exclusiones ni criterios de alcance.
- **1 —** Pruebas sueltas sin relación con los casos de uso del proyecto.

**Diseño de casos de prueba · 30%**
- **5 —** Cada caso define escenario, datos de entrada, resultado esperado y criterio de aceptación; **los datos son deliberados, no aleatorios**.
- **3 —** Los casos tienen escenario y resultado esperado, pero los datos de prueba son improvisados o incompletos.
- **1 —** Casos sin resultado esperado: no se puede determinar si pasan o fallan.

**Cobertura y casos borde · 20%**
- **5 —** Incluye valores límite, entradas inválidas, condiciones de error y reglas de negocio críticas; reporta cobertura **con interpretación, no solo el número**.
- **3 —** Prueba caminos felices y algún caso negativo; la cobertura se reporta sin análisis.
- **1 —** Solo caminos felices o pruebas que verifican el lenguaje, no la lógica.

**Evidencia de ejecución · 20%**
- **5 —** Reporte completo con resultados, fallos encontrados, corrección aplicada y nueva ejecución.
- **3 —** Captura de una ejecución exitosa sin trazabilidad de los defectos encontrados.
- **1 —** No hay evidencia de que las pruebas se hayan ejecutado.

**Automatización · 10%**
- **5 —** Pruebas automatizadas e integradas en el flujo de construcción, ejecutándose en cada cambio.
- **3 —** Pruebas automatizadas ejecutables localmente, sin integración continua.
- **1 —** Pruebas manuales descritas en un documento.

**Evidencias mínimas:** documento de estrategia · matriz caso de uso → casos de prueba ·
código de las pruebas en el repositorio · reporte de ejecución y de cobertura.

---

## 10. Definición de volumetría para pruebas

**0% · bonificación hasta +0,25.** Estimación de volúmenes de datos, usuarios y
transacciones para escenarios de prueba.

**Volúmenes de datos · 25%**
- **5 —** Estima volumen inicial, crecimiento en el tiempo y tamaño por entidad, con la fuente o supuesto que sustenta cada cifra.
- **3 —** Da cifras globales sin desagregar por entidad ni proyectar crecimiento.
- **1 —** Números sin justificación ni unidad.

**Usuarios y perfiles de carga · 25%**
- **5 —** Define usuarios totales, concurrentes, perfiles de comportamiento y distribución horaria o estacional.
- **3 —** Define un número de usuarios concurrentes sin perfiles ni distribución.
- **1 —** No distingue entre usuarios registrados y concurrentes.

**Transacciones · 25%**
- **5 —** Transacciones por segundo promedio y pico por operación, con relación de lectura/escritura y tiempos de respuesta objetivo.
- **3 —** Transacciones estimadas de forma agregada, sin picos ni objetivos de respuesta.
- **1 —** No hay estimación de transaccionalidad.

**Escenarios de prueba · 25%**
- **5 —** Define escenarios nominal, pico, estrés y resistencia, con criterios de aceptación y punto de quiebre esperado.
- **3 —** Define un escenario de carga nominal sin condiciones límite.
- **1 —** La volumetría no se traduce en ningún escenario ejecutable.

**Evidencias mínimas:** tabla de volumetría por entidad y operación · supuestos y fuentes de
cada estimación · escenarios de carga con criterios de aceptación.

---

## 11. Módulo de inyección de fallos

**0% · bonificación hasta +0,25.** Mecanismo para simular fallos y validar la resiliencia
en red, servicios, base de datos y recursos.

**Catálogo de fallos · 30%**
- **5 —** Cubre las cuatro dimensiones —red, servicios, base de datos y recursos— con fallos derivados de los riesgos reales de la arquitectura entregada.
- **3 —** Cubre dos dimensiones con fallos genéricos no vinculados a los riesgos identificados.
- **1 —** Un único tipo de fallo, o fallos que no pueden ocurrir en esta arquitectura.

**Mecanismo de inyección · 25%**
- **5 —** Módulo funcional, parametrizable, reversible y con control de radio de impacto; se activa sin modificar el código de producción.
- **3 —** Mecanismo funcional pero manual, sin parámetros ni control de alcance.
- **1 —** Se describe el mecanismo sin implementarlo.

**Hipótesis y experimentos · 25%**
- **5 —** Cada experimento parte de una hipótesis de estado estable, define la perturbación, la métrica de verificación y el criterio de aborto.
- **3 —** Se ejecutan fallos y se observa qué pasa, sin hipótesis previa formulada.
- **1 —** Se inyectan fallos sin definir qué se espera comprobar.

**Resultados y aprendizajes · 20%**
- **5 —** Documenta el comportamiento observado con evidencia de la plataforma de observabilidad, las debilidades encontradas y las mejoras aplicadas.
- **3 —** Reporta resultados descriptivos sin acciones derivadas.
- **1 —** No hay resultados documentados.

**Evidencias mínimas:** código o configuración del módulo · catálogo de fallos por
dimensión · bitácora de experimentos con hipótesis y resultado · evidencia observada en
tableros o trazas.

---

## Cálculo de la nota

```
Nota del entregable = Σ ( nivel del criterio × peso interno del criterio )
Nota final          = Σ ( nota del entregable × participación del entregable )
Bonificación        = (nota E10 ÷ 5 × 0,25) + (nota E11 ÷ 5 × 0,25)
Nota definitiva     = mínimo entre (nota final + bonificación) y 5,00
```

**Reglas complementarias, textuales:**

- Un entregable en 0 no invalida el proyecto, **pero los entregables 2, 3 y 4 concentran el
  65% de la calificación y su ausencia hace imposible aprobar**.
- **Las incoherencias entre entregables se penalizan en el entregable posterior**, que es el
  que debía mantener la trazabilidad.
- **La entrega tardía sin autorización previa se califica sobre 3,0 como máximo.**

El HTML original trae además una calculadora interactiva para simular la nota según el nivel
asignado a cada entregable.
