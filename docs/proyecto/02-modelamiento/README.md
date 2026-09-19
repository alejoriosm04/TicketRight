# Entrega 2 — Modelamiento de la solución

**Vence:** sábado 19 de septiembre de 2026 a las **3:00 p.m.** — no a medianoche
**Se admiten varias entregas:** sí
**Estado:** 🟡 Activa. Los cinco ADR técnicos fueron aceptados por el equipo el 16 de
septiembre de 2026. Los once entregables están completos: modelo de dominio, ADR,
arquitectura de referencia, arquitectura de implementación, diagrama de clases, diagrama de
secuencia, prototipo, observabilidad, plan de pruebas unitarias, volumetría e inyección de
fallos. Falta subir la entrega a Teams.

> *«De la visión a un diseño concreto.»* El objetivo es modelar la **arquitectura de
> referencia** y la **arquitectura de implementación** de la solución del Entregable 1
> ([lámina 21 de la clase 3-4](../../curso/clase-03-04.md#21-proyecto-integrador--entregable-2-modelamiento)).
>
> Las tres preguntas guía del profesor: **¿qué patrones arquitectónicos utilizarás? · ¿cómo
> se relacionan los componentes? · ¿cómo soporta esta arquitectura los requerimientos del
> negocio?**

## Contenido

| Sección | Qué responde |
|---|---|
| [Lo primero: el alcance](#lo-primero-el-alcance-y-está-confirmado) | Qué se entrega el 19 y qué es de la Entrega 3 |
| [Los once entregables](#los-once-entregables) | Qué se pide, cuánto vale y de dónde sale lo nuestro |
| [El ADR es el 25%](#el-adr-es-el-25--y-tiene-formato-propio) | Formato del profesor, máximo 5 decisiones y cuáles serían |
| [Referencia contra implementación](#referencia-contra-implementación-el-40) | La distinción que vale el 40% |
| [Qué traemos de la Entrega 1](#qué-traemos-de-la-entrega-1) | Los insumos ya escritos |
| [El material de esta entrega](#el-material-de-esta-entrega) | Dónde está cada archivo |
| [La reunión de equipo](#la-reunión-de-equipo) | Lo que hay que sacar de ahí antes de escribir |

---

## Lo primero: el alcance, y está confirmado

**Los once entregables son de esta entrega.** Y todos son de **definición y diseño: no hay
código ni infraestructura.** Se entrega *cómo va a ser*, *qué se va a tener en cuenta* y
*cómo se haría* — incluidos observabilidad, plan de pruebas, volumetría e inyección de
fallos. **La implementación real es la Entrega 3**, el 26 de septiembre.

Esto resuelve la contradicción aparente entre la tarea de Teams y la rúbrica: **la rúbrica
es la del proyecto completo**, no la de esta semana. Por eso varios criterios piden
evidencia de ejecución —«plataforma funcionando con capturas o demostración en vivo»,
«reporte de ejecución», «bitácora de experimentos»—. Esa evidencia se cumple en la Entrega
3; lo que se califica ahora es la estrategia, el catálogo, el plan y los diagramas.

**Qué significa en la práctica, entregable por entregable:**

| Entregable | Esta semana (19 sep) | Entrega 3 (26 sep) |
|---|---|---|
| 8 · Observabilidad | Qué se mide, con qué umbral, qué alarma salta, quién responde, qué herramienta y por qué | La plataforma corriendo, con tableros y datos reales |
| 9 · Plan de pruebas | Estrategia, alcance, matriz caso de uso → casos, datos y resultados esperados | Las pruebas escritas, ejecutadas y su reporte |
| 10 · Volumetría | Las cifras de datos, usuarios, transacciones y los escenarios de carga | Las corridas contra esos escenarios |
| 11 · Inyección de fallos | Catálogo de fallos, mecanismo propuesto e hipótesis de cada experimento | El módulo funcionando y la bitácora |

*Dos consecuencias de fecha, de la rúbrica:* vence el **19 a las 3:00 p.m.**, y **la entrega
tardía sin autorización se califica sobre 3,0 como máximo**. Se admiten varias entregas:
igual que en la Entrega 1, subir algo completo antes y reemplazar.

## Los once entregables

Pesos de la [tarea en Teams](enunciado-teams.md); criterios completos en
[`rubrica.md`](rubrica.md).

| # | Entregable | Peso | De dónde sale lo nuestro | Estado |
|---|---|---|---|---|
| 1 | **Modelo de dominio** completo | 5% | [`modelo-de-dominio.md`](modelo-de-dominio.md): diagrama exportable con 32 conceptos (22 cajas y 10 objetos de valor anidados), cuatro contextos, doce raíces de agregado, atributos tipados con enumeraciones, dieciséis relaciones, catorce invariantes y glosario; incluye el [mapa de contextos y raíces](modelo-de-dominio-mapa.html) de una pantalla con dos atributos clave por raíz y cuatro vistas guiadas por contexto en la vista completa | ✅ Completo; revisado el 17 de septiembre contra la rúbrica, el alcance, las validaciones legales y los ADR |
| 2 | **ADR** | **25%** | [Cinco ADR técnicos consolidados](../decisiones/README.md): estructura, datos, integración, despliegue y seguridad transversal | ✅ 5 ADR aceptados; conservan pruebas y validaciones posteriores |
| 3 | **Arquitectura de referencia** | **20%** | [`arquitectura-de-referencia.md`](arquitectura-de-referencia.md): vista lógica compacta por capas, componentes, interfaces, tecnologías de referencia, patrones, escenarios de calidad y trazabilidad con los cinco ADR; incluye versiones interactiva, Mermaid y diagrams.net | ✅ Diseño completo; cabe en una pantalla de 1440×900 y fue contrastado con ISO 42010, C4, SEI y AsyncAPI |
| 4 | **Arquitectura de implementación** | **20%** | [`arquitectura-de-implementacion.md`](arquitectura-de-implementacion.md): producción en AWS us-east-1 con tres zonas, VPC y subredes, EKS con KEDA/Karpenter/Fargate, Aurora Multi-AZ con RDS Proxy, ElastiCache, MSK Serverless, OpenSearch, Cognito, WAF y KMS; tabla de integraciones con protocolo y contrato, IaC con Terraform y GitOps, modelo de amenazas, perfiles de escalado, costos y trazabilidad a la referencia y a los ADR. Se entrega en [`.drawio` con iconos oficiales](arquitectura-de-implementacion.drawio) —más [render de verificación](arquitectura-de-implementacion.drawio.render.png)— y como [vista interactiva](arquitectura-de-implementacion.html) con [fuente validada](arquitectura-de-implementacion.json) | ✅ Completo; la ejecución real es de la Entrega 3 |
| 5 | Diagrama de clases **de un caso** | 5% | [`diagrama-de-clases.md`](diagrama-de-clases.md): caso «Comprar en la ventana de alta demanda», 39 clases en arquitectura hexagonal y 37 relaciones con notación UML, repartidas en **dos vistas de una pantalla** —[dominio](diagrama-de-clases-dominio.html) (20 clases) y [aplicación, puertos y adaptadores](diagrama-de-clases-aplicacion.html) (19 clases + referencia al dominio)—; correspondencia con el modelo de dominio | ✅ Completo; dividido el 18 de septiembre para que cada vista quepa completa en pantalla |
| 6 | Diagrama de secuencia **de un caso** | 5% | [`diagrama-de-secuencia.md`](diagrama-de-secuencia.md): mismo caso y mismas clases que el diagrama 5; 38 mensajes numerados en los cinco pasos de la SAGA, siete fragmentos `alt`/`loop`/`par` y las diez líneas de vida, repartidos en **dos vistas de una pantalla** —[reservar y cobrar](diagrama-de-secuencia-reservar-pagar.html) (20 mensajes, 8 líneas de vida) y [confirmar, emitir y compensar](diagrama-de-secuencia-confirmar-emitir.html) (18 mensajes, 10 líneas de vida)—; precondiciones y postcondiciones | ✅ Completo; dividido el 18 de septiembre |
| 7 | **Prototipo de interfaz** | 10% | [`prototipo/`](prototipo/index.html): 16 pantallas para fan, promotor y operación interna, mapa de navegación con casos de error y [guía de estilo](prototipo/guia-de-estilo.html); desplegado en <https://harmonious-empanada-797c2e.netlify.app/> | ✅ Prototipo navegable en el repo y desplegado |
| 8 | Plataforma de **observabilidad** | 5% | [`observabilidad.md`](observabilidad.md): plataforma Grafana, métricas, trazas, logs, tableros, alertas y responsables | ✅ Diseño completo; la instrumentación y evidencia real corresponden a la Entrega 3 |
| 9 | Plan de **pruebas unitarias** | 5% | [`plan-de-pruebas.md`](plan-de-pruebas.md): veintiún casos con datos deliberados sobre el caso de uso principal y los dos complementarios, matriz caso de uso → caso de prueba, dobles de prueba y estrategia de automatización | ✅ Diseño completo; el código, la ejecución y la cobertura medida corresponden a la Entrega 3 |
| 10 | **Volumetría** para pruebas | 0% · bonif. | [`volumetria.md`](volumetria.md): volumen por entidad, usuarios y perfiles de carga, transacciones por segundo con relación lectura/escritura, y los cuatro escenarios nominal/pico/estrés/resistencia sobre la carga de A-7 y A-10 —**30.000 usuarios concurrentes en 60 s contra 5.000 boletas** | ✅ Diseño completo; las corridas corresponden a la Entrega 3 |
| 11 | Módulo de **inyección de fallos** | 0% · bonif. | [`inyeccion-de-fallos.md`](inyeccion-de-fallos.md): Chaos Mesh, controles de seguridad, catálogo e hipótesis de experimentos | ✅ Diseño completo; la ejecución y bitácora corresponden a la Entrega 3 |

**Dos observaciones que cambian el orden de trabajo:**

1. **Los entregables 2, 3 y 4 son el 65%.** La rúbrica dice que su ausencia hace imposible
   aprobar. Todo lo demás es 35% repartido en ocho piezas.
2. **Las incoherencias se penalizan en el entregable posterior.** Si el diagrama de clases
   no coincide con el modelo de dominio, el que pierde es el diagrama de clases. El orden
   correcto es dominio → ADR → referencia → implementación → clases/secuencia → el resto.

## Qué hay en esta carpeta

| Archivo o familia | Qué es | Dónde está la fuente |
|---|---|---|
| `README.md` · `enunciado-teams.md` · `rubrica.md` | Esta guía, el texto literal del profesor y la rúbrica digitalizada. | No se editan (salvo este README) |
| `adr-para-excel.md` · `adr-plantilla.xlsx` | Los cinco ADR en el formato del profesor y la plantilla diligenciada. | [`../decisiones/000N-*.md`](../decisiones/README.md) |
| `modelo-de-dominio.md` | Entregable 1: conceptos, atributos, relaciones, invariantes y glosario. | El propio Markdown |
| `arquitectura-de-referencia.md` | Entregable 3: capas, componentes, patrones, escenarios y trazabilidad. | El propio Markdown |
| `arquitectura-de-implementacion.md` | Entregable 4: topología AWS, integraciones, IaC, seguridad y costos. | El propio Markdown |
| `diagrama-de-clases.md` · `diagrama-de-secuencia.md` | Entregables 5 y 6: tablas de clases y mensajes; la notación UML se posprocesa desde ellas. | Los Markdown |
| `observabilidad.md` · `plan-de-pruebas.md` · `volumetria.md` · `inyeccion-de-fallos.md` | Entregables 8, 9, 10 y 11. | Los Markdown |
| `prototipo/` | Entregable 7: catorce pantallas, guía de estilo y mapa de navegación. | [`prototipo/design.md`](prototipo/design.md) |
| `*.html` + `*.json` | Vistas interactivas (HTML) y su fuente validada por Archify (JSON). | El Markdown del entregable y el JSON |
| `*.drawio` · `*.mmd` | Versiones editables en diagrams.net y Mermaid de la referencia y la implementación. | El JSON o el propio archivo |
| `*.png` | Evidencia: renders (`*.drawio.render.png`) y capturas de `visual-check`, que se regeneran localmente y no se versionan. | `visual-check` |
| Recibos `sha256` | Cada Markdown con artefactos anota el recibo de `deliver` en su sección «Artefactos». | Los propios archivos |

**Regla de lectura:** el `.md` manda; el `.json` es la geometría que Archify valida y el
`.html` la vista que se sustenta. Si un dato cambia, se cambia en el Markdown y se regeneran
los artefactos con el comando que cada documento trae en su sección «Artefactos».

## El ADR es el 25% — y tiene formato propio

**El profesor pide «máximo 5 decisiones de arquitectura importantes»** — las que marcan el
rumbo, no quince menores
([transcripción, §4](../../curso/clase-03-04-transcripcion.md#4-cuántos-adr-se-esperan)).
Y los quiere **«basados en el archivo de Excel»**: [`adr-plantilla.xlsx`](adr-plantilla.xlsx).

### La plantilla, y cómo se corresponde con lo que ya escribimos

El Excel trae dos hojas: **RESUMEN** (índice de todos los ADR) y una hoja por ADR con el
detalle. Nuestros ADR ya usan el formato de 8 elementos de la lámina 21, y **cubren todo lo
que pide el Excel**:

| Hoja RESUMEN | De dónde sale en nuestros ADR |
|---|---|
| `IDENTIFICADOR` | El número: AD-001, AD-002… |
| `ARCHITECTURAL DECISION` | El título |
| `STATUS` | El campo **Estado** de la cabecera |
| `DATE` | El campo **Fecha** de la cabecera |
| `DECISION` | La sección **6. Decisión** |

| Hoja de detalle | De dónde sale |
|---|---|
| `ID` · `The architectural decision` · `Status` | Cabecera |
| `Problem/Issue` | **3. Problema o asunto** |
| `Context` | **3. Problema o asunto** — *hay que separarlo: el Excel pide problema y contexto aparte* |
| `Assumptions` | **4. Supuestos** |
| `Alternatives` | **5. Alternativas** |
| `Decision` | **6. Decisión** |
| `Justification` | **7. Justificación** |
| `Implications` | **8. Implicaciones** |
| `Participants` | El campo **Participan** de la cabecera |
| `Date` | Cabecera |

**Markdown primero, igual que en la Entrega 1:** los ADR se escriben y se revisan en
[`../decisiones/`](../decisiones/), y volcarlos al Excel es el último paso. El formato del
repo ya está alineado; ver [el README de decisiones](../decisiones/README.md).

### Las cinco decisiones

La rúbrica pide que los ADR cubran **estructura, datos, integración, despliegue y
transversales**, y el profesor pidió **máximo cinco**. Los cinco están escritos y
consolidados en [`../decisiones/`](../decisiones/README.md): AD-005 define la arquitectura
híbrida y los perfiles cotidiano/pico; AD-003 protege inventario y CQRS; AD-006 activa la
sala Space-Based solo cuando la demanda la justifica y define el escalado;
AD-002 coordina pago y emisión con SAGA; y AD-004 cubre seguridad, admisión e identidad.
El equipo aceptó los cinco el 16 de septiembre de 2026. Los supuestos, pruebas y
validaciones jurídicas o de costo permanecen visibles como condiciones de revisión. AD-001
no cuenta: es una decisión de negocio, no de arquitectura.

**Dos cosas que el profesor dijo y que la rúbrica premia:**

- **El estado puede quedar pendiente.** Una decisión con alternativas identificadas a la
  espera de una prueba de concepto es un ADR válido, no un ADR incompleto
  ([transcripción, §7](../../curso/clase-03-04-transcripcion.md#7-el-estado-de-una-decisión-no-siempre-está-cerrado)).
- **La fecha importa** porque marca bajo qué condiciones se tomó la decisión. Si el entorno
  cambia, el ADR es lo que permite reevaluarla sin repetir el análisis.

## Referencia contra implementación: el 40%

Son dos entregables distintos y confundirlos es un error que la rúbrica castiga
explícitamente. La distinción, como la explicó el profesor
([transcripción, §8](../../curso/clase-03-04-transcripcion.md#8-arquitectura-de-referencia-vs-arquitectura-de-implementación)):

| | **Referencia** (20%) | **Implementación** (20%) |
|---|---|---|
| Qué es | Vista de alto nivel: capas, componentes, tecnologías y patrones | Detalle técnico del despliegue |
| Marcas | **Sin nombres de proveedor.** La misma arquitectura debe poder montarse en Azure, AWS o GCP | **Con** nombres: este servicio, esta base, este orquestador |
| Lo que se evalúa | Responsabilidades, reglas de dependencia, patrones justificados y **escenarios de calidad medibles** | Topología, integraciones con contrato, infraestructura, seguridad y **trazabilidad hasta la referencia y hasta un ADR** |

**No hace falta desplegar en una nube real.** El profesor respondió a esa pregunta en clase:
sirve Kubernetes local (Minikube) o un ambiente simulado con herramientas open source. Lo
que sí pide es **claridad sobre a qué proveedor se migraría en producción y con qué costos**
([transcripción, §16](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación)).

## Qué traemos de la Entrega 1

**El insumo existe y está escrito.** No hay que empezar por inventar atributos.

| Insumo | Dónde | Para qué entregable |
|---|---|---|
| **Doce atributos de calidad**, con umbral y condición de medición | [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) | 3 · 4 · 8 · 10 |
| **Estilo de arquitectura**, con alternativas descartadas y lo que se sacrificó | [AD-005](../decisiones/0005-estilo-de-arquitectura.md) | 2 · 3 |
| **Capacidades C-1 a C-7** del negocio | [`canvas.md`](../01-caso-de-negocio/canvas.md), bloque 7 | 1 · 3 |
| **Frontera del sistema** y qué queda fuera | [`alcance.md`](../01-caso-de-negocio/alcance.md) | 1 · 3 |
| **OKR** — son las métricas de negocio de la observabilidad | [§5 del entregable](../01-caso-de-negocio/caso-de-negocio-corporativo.md#5-objetivos-y-resultados-clave) | 8 |
| **Restricciones legales `[V]`** — parafiscal, retracto, datos personales, aforo | [`validaciones.md`](../01-caso-de-negocio/validaciones.md) | 1 · 2 · 4 |
| **Trazabilidad negocio → atributo → decisión → costo** | [§6](../01-caso-de-negocio/caso-de-negocio.md#6-trazabilidad) | 2 · 3 |
| **Estrategia de implementación** y seis hitos | [anexo B](../01-caso-de-negocio/caso-de-negocio.md#anexo-b--estrategia-de-implementación) | 4 · 9 |

Y la pregunta con la que cerró nuestra sustentación de la Entrega 1, que es el enunciado de
esta: **¿qué decisiones arquitectónicas se justifican a partir de este modelo de negocio?**

## El material de esta entrega

| Archivo | Qué es |
|---|---|
| [`enunciado-teams.md`](enunciado-teams.md) | El texto del profesor, literal. **No se edita** |
| [`rubrica.md`](rubrica.md) | La rúbrica digitalizada: criterios, niveles, evidencias mínimas y errores que bajan la nota |
| [`adr-plantilla.xlsx`](adr-plantilla.xlsx) | La plantilla de ADR del profesor, con un ejemplo diligenciado |
| [`../../curso/clase-03-04.md`](../../curso/clase-03-04.md) | Las láminas de las clases 3 y 4: patrones y estilos, particionamiento técnico contra dominios, caso Prime Video, MASA |
| [`../../curso/clase-03-04-transcripcion.md`](../../curso/clase-03-04-transcripcion.md) | **Lo que el profesor dijo en clase explicando esta entrega.** Es donde están los criterios que no aparecen en la rúbrica |
| [`../../curso/material/2026-09-12-quiz-estilos-arquitectonicos.html`](../../curso/material/2026-09-12-quiz-estilos-arquitectonicos.html) | Quiz de diez situaciones: del driver de negocio al estilo. Autoestudio |

## La reunión de equipo

**Casi todo lo que falta se decide entre los tres, en una sesión.** Esta sección es la
agenda, y lo que hay en el repo es la base para llegar con algo que revisar, no con la
hoja en blanco.

| # | Qué hay que sacar | Base para revisar | Por qué antes de escribir |
|---|---|---|---|
| 1 | **Las cinco decisiones que van al ADR** | ✅ Aceptadas el 16 de septiembre de 2026 | El equipo ratificó estructura, datos, integración, despliegue y seguridad transversal |
| 2 | **El caso de uso** de los entregables 5 y 6 | ✅ Elegido: comprar en la ventana de alta demanda | Los dos diagramas, el plan de pruebas y buena parte del prototipo cuelgan de esa elección |
| 3 | **Ratificar los doce umbrales de calidad** | [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) | Son las promesas numéricas contra las que la rúbrica evalúa la arquitectura de referencia. Leerlos y decir sí o cambiar el número: media hora |
| 4 | **Quién hace qué** | La tabla de los once entregables | El 65% está en tres entregables, así que el reparto no puede ser uno por persona |

**Ya está decidido:** el código de la Entrega 3 **vive en un repositorio aparte**.
`PENDIENTE: su URL, para enlazarla desde aquí.` Esta entrega no lo necesita — no hay
implementación.

### Base para la decisión 1 — los cinco ADR

La rúbrica pide que cubran **estructura, datos, integración, despliegue y transversales**.
Con lo que ya está abierto, los cinco cupos se llenan sin forzar nada:

| # | La pregunta que responde | Dimensión | Lo que ya está sobre la mesa |
|---|---|---|---|
| **[AD-005](../decisiones/0005-estilo-de-arquitectura.md)** | ¿Cómo se organiza el sistema para combinar concurrencia, certeza, tolerancia a fallos y costo cotidiano? | Estructura | ✅ Event-Driven y núcleo PostgreSQL permanentes; Space-Based bajo demanda; CQRS y servicios de dominio de grano grueso |
| **[AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md)** | ¿Quién decide si una silla o cupo se puede reservar y cómo se descargan las consultas? | Datos | ✅ PostgreSQL como autoridad; operaciones atómicas por tipo de inventario; Redis y OpenSearch como proyecciones reconstruibles |
| **[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md)** | ¿Cómo se absorbe el segundo cero sin ahogar el núcleo ni pagar el pico todo el mes? | Despliegue | ✅ Paso directo cotidiano; activación programada de sala Space-Based; back pressure, KEDA y recuperación antes de volver al mínimo |
| **[AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md)** | ¿Cómo se completa o compensa una venta cuando la pasarela responde tarde o repetido? | Integración | ✅ SAGA orquestada en Ventas, outbox, Kafka, idempotencia y coreografía solo para efectos secundarios |
| **[AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md)** | ¿Cómo se filtran bots, se autoriza el checkout y se limita la exposición de datos? | Transversal | ✅ CDN/WAF/gateway, límites por múltiples señales, JWT corto e identidad/consentimiento aislados |

*AD-001 no cuenta: es una decisión de negocio, no de arquitectura.* La fecha de aceptación
registra desde cuándo aplican las cinco decisiones. Si una prueba posterior contradice un
supuesto, el ADR se revisa o se reemplaza; no se borra.

### Base para la decisión 2 — el caso de uso

La rúbrica pide que sea **representativo y con complejidad suficiente**, y castiga
explícitamente el CRUD simple. Tres candidatos que salen del caso de negocio:

| Candidato | A favor | En contra |
|---|---|---|
| **Comprar en la ventana de alta demanda** (fila → reserva → pago → emisión) | Es la tesis del negocio y toca todos los atributos: A-1, A-2, A-4, A-5, A-6. Da flujos de error de sobra —pasarela lenta, respuesta duplicada, reserva vencida— que es justo lo que pide el diagrama de secuencia | Es el más grande: hay que acotarlo bien para que el diagrama sea legible |
| **Revender una boleta dentro de la plataforma** | Toca A-3 (unicidad en el tiempo) y es el diferenciador del negocio; más acotado | Deja fuera la fila y el pico, que es donde está la dificultad arquitectónica |
| **Devolver el dinero de una compra** | Tiene reglas legales duras `[V]` y obliga a modelar la conciliación | El menos vistoso para sustentar |

**Decidido el 17 de septiembre de 2026:** *Comprar en la ventana de alta demanda*, acotado
del turno admitido a la boleta emitida, con arquitectura hexagonal interna. Ver
[`diagrama-de-clases.md`](diagrama-de-clases.md). Es el caso principal de los diagramas 5 y
6, del prototipo (7) y del plan de pruebas (9): la mayor parte del tráfico y del ingreso del
negocio ocurre ahí. Revender y devolver el dinero quedan como casos **complementarios** — se
pueden usar para acotar flujos secundarios o casos borde, pero no reemplazan al principal.

## Antes de entregar

Sale de la rúbrica, no de nuestra imaginación. **Revisado el 18 de septiembre** contra los
archivos del repositorio; a nivel de diseño no queda ninguno abierto:

- [x] Los nombres del modelo de dominio son **idénticos** en el diagrama de clases, la
      arquitectura y la interfaz — la incoherencia se penaliza en el documento posterior
- [x] Cada ADR tiene **al menos dos alternativas viables**, no de paja, comparadas con
      criterios explícitos
- [x] Cada ADR dice **qué se sacrifica** y bajo qué condiciones debería revisarse
- [x] Los atributos de calidad aparecen como **escenarios medibles** (estímulo → respuesta →
      medida), no como adjetivos
- [x] La arquitectura de referencia **no nombra proveedores**; la de implementación sí
- [x] Cada elemento de implementación se rastrea hasta un componente de la referencia **y
      hasta un ADR**
- [x] El diagrama de secuencia tiene **al menos un flujo de error**, no solo el feliz
- [x] El prototipo incluye estados **vacío, de carga y de error**
- [x] La observabilidad define **métricas de negocio y técnicas**, con umbral, alarma y
      responsable — pocas y buenas: el profesor habló de **métricas doradas**, cuatro o
      cinco, no doscientas
- [x] El plan de pruebas y el catálogo de fallos están **amarrados a los casos de uso y a
      los riesgos reales de esta arquitectura**, no a una lista genérica
- [x] **No hay credenciales** en ningún archivo de configuración entregado
