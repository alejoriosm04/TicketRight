# Clases 3 y 4 — lo que el profesor explicó del Entregable 2

**Universidad EAFIT · Arquitecturas Avanzadas de Software · sábado 12 de septiembre de 2026**

> **Aquí están los criterios que no aparecen ni en las láminas ni en la rúbrica**: cuántos
> ADR quiere, qué separa la arquitectura de referencia de la de implementación, y qué
> espera de la observabilidad, las pruebas y la inyección de fallos. Las láminas están en
> [`clase-03-04.md`](clase-03-04.md); lo que se entrega, organizado, en
> [`../proyecto/02-modelamiento/README.md`](../proyecto/02-modelamiento/README.md).
>
> Transcripción reorganizada y limpiada a partir del audio de clase. Se conserva el contenido y las palabras del profesor, agrupadas en secciones temáticas y con oraciones completas para facilitar la lectura (el archivo original venía como texto fragmentado palabra por palabra, típico de una transcripción automática).

---

## Contenido

| § | Tema | Para qué entregable |
|---|---|---|
| [1](#1-por-qué-documentar-las-decisiones-descartadas) · [2](#2-los-adr-pueden-cambiar-con-el-tiempo) | Por qué se documentan las alternativas descartadas, y por qué un ADR cambia con el tiempo | 2 |
| [3](#3-ejemplo-de-adr-adr001) · [5](#5-plantilla-del-adr) | El ejemplo que mostró en clase y los campos de la plantilla de Excel | 2 |
| [4](#4-cuántos-adr-se-esperan) | **Máximo cinco decisiones** | 2 |
| [6](#6-analogía-el-viaje-a-cartagena-trade-offs) · [7](#7-el-estado-de-una-decisión-no-siempre-está-cerrado) | Cómo se justifica un descarte · una decisión puede quedar pendiente | 2 |
| [8](#8-arquitectura-de-referencia-vs-arquitectura-de-implementación) | **Referencia contra implementación** — la distinción que vale el 40% | 3 · 4 |
| [9](#9-diagrama-de-clases-de-un-caso-de-uso-concreto) · [10](#10-diagrama-de-secuencia-de-un-caso-de-uso) | Qué espera de cada diagrama y qué herramientas acepta | 5 · 6 |
| [11](#11-prototipo-de-interfaz-de-usuario) | Los tres tipos de usuario y el modelo de navegación | 7 |
| [12](#12-plataforma-de-observabilidad) | Métricas doradas, vista de negocio y vista técnica | 8 |
| [13](#13-plan-de-pruebas-unitarias) · [14](#14-definición-de-volumetría-para-pruebas) | Qué pide del plan de pruebas y de la volumetría | 9 · 10 |
| [15](#15-módulo-de-inyección-de-fallos) | Degradación elegante, circuit breaker, encolar y reprocesar | 11 |
| [16](#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación) | **No hace falta desplegar en una nube real** | 4 |
| [17](#17-adelanto-arquitecturas-evolutivas-próxima-clase) · [18](#18-nota-adicional-comentario-breve-durante-la-clase) | Adelanto de la próxima clase: arquitecturas evolutivas, feature flags, beta testing | — |

---

## 1. Por qué documentar las decisiones descartadas

El profesor cuenta una anécdota: en una clase, varios estudiantes decidieron trabajar con una base de datos "porque es muy buena" o "porque es la más usada". Al preguntarles qué alternativas habían descartado y por qué, no tenían respuesta.

El punto es este: si dentro de tres años (cuando el estudiante ya no esté en el proyecto) alguien llega a hacer mantenimiento y ve la decisión de arquitectura ("escogimos Postgres por tal cosa"), esa persona podría pensar "esto debería haber sido con MySQL, por alguna razón". Si no queda registrado que MySQL se descartó y por qué, eso puede llevar a que la aplicación caiga en un error al intentar "corregir" una decisión que en realidad fue tomada con criterio.

## 2. Los ADR pueden cambiar con el tiempo

Es posible que, al reevaluar una decisión, las condiciones que la originaron hayan cambiado. Eso hace que el ADR sea todavía más importante: si el entorno cambió y la razón por la que algo no era viable ya no aplica (por ejemplo, MySQL ya es factible), esa puede convertirse en la mejor decisión en ese nuevo momento. Al final, por una razón o por otra, el ADR siempre va a ser fundamental — es "el corazón" del proceso de documentación arquitectónica.

## 3. Ejemplo de ADR: ADR001

El profesor mostró un ejemplo de ADR ya diligenciado (el archivo en Excel se entrega para que los estudiantes lo usen como plantilla):

- **ID:** ADR001
- **Título:** Arquitectura por capas con microservicios y funciones serverless
- **Necesidad / contexto:** Orquestar pedidos en picos extremos, integrando boletería, pagos, inventarios, runners y notificaciones, con alta disponibilidad y degradación elegante.
- **Decisión:** Adoptar una arquitectura orientada a eventos, con microservicios y funciones serverless, coordinadas por un bus de eventos.
- **Consecuencias:** Escalado por dominio, resiliencia, manejo de back pressure, manejo de reintentos y uso de una Dead Letter Queue (DLQ).
- **Observaciones:** Se requiere observabilidad distribuida e idempotencia como características especiales.
- **Alternativas descartadas:**
  - Monolito escalado verticalmente (sin justificación registrada — el profesor lo usa como ejemplo de lo que *no* se debe hacer).
  - Microservicios comunicados solo de forma síncrona.
- **Métrica asociada:** ADR3 / KR1.
- **Notas:** Event sourcing para órdenes críticas y contratos versionados.

**Interpretación del ejemplo:** el estilo arquitectónico es orientado a eventos (event-driven); el bus de eventos dispara todo el flujo, y cuando ocurre un evento se invocan los microservicios, que son los que dan la alta disponibilidad y la degradación elegante.

## 4. ¿Cuántos ADR se esperan?

En un proyecto nuevo suelen surgir entre 15 y 20 decisiones de arquitectura, pero el profesor no quiere esa cantidad. Pide **máximo 5 decisiones de arquitectura importantes** — las que realmente marcan el rumbo del proyecto — no 15 o 20 decisiones menores.

## 5. Plantilla del ADR

El archivo de Excel que se entrega tiene dos partes:

**Resumen (vista general):**
- ID
- Decisión de arquitectura
- Estado
- Fecha

**Detalle completo (por cada ADR):**
- Mismo ID
- Contexto (el "issue" o problema que originó la decisión)
- Supuestos
- Alternativas consideradas
- Decisión tomada
- Justificación
- Implicaciones
- Participantes
- Fecha

### Ejemplo mostrado en clase (seguridad de datos sensibles)

- **Contexto:** información privada y sensible de los usuarios.
- **Alternativas evaluadas:**
  1. Ceder el control de seguridad a una empresa externa (usar sistemas de seguridad externos).
  2. No modificar la implementación de los datos, pero mantener control de acceso y periodicidad sobre la información.
  3. Encriptación de los datos sensibles, con acceso bajo credenciales encriptadas y registro/auditoría de los datos para comparar en caso de accesos no permitidos.
- **Decisión:** Encriptación de los datos sensibles (alternativa 3).
- **Justificación:** Mantener la persistencia y privacidad de los datos sensibles, y garantizar los permisos adecuados a las personas pertinentes.
- **Implicaciones:** Integración de un sistema de encriptación y desencriptación de datos; nuevas interacciones de los servicios con ese proceso.
- **Participantes:** El equipo que tomó la decisión.
- **Fecha:** Importante porque marca desde cuándo aplica la decisión — no es una decisión "infinita"; con el tiempo pueden aparecer razones en contra, pero la fecha registra el momento en que se tomó y bajo qué condiciones.

## 6. Analogía: el viaje a Cartagena (trade-offs)

Para explicar cómo se justifica una decisión (y sus descartes), el profesor usa esta analogía:

> "Voy a ir para Cartagena. Puedo ir por tierra en bus, por tierra en carro, o por vía aérea. Descarto el bus porque me demoro mucho. Descarto el carro por la gasolina. Me voy por avión porque necesito llegar rápido."

Esas son las consecuencias y la explicación (el *trade-off*). Lo que **no** es válido es decir simplemente "quería ir, pero vi que me salía más barato" sin justificar la comparación real entre alternativas. Al final, el tiempo es lo que valida si la decisión sigue siendo correcta o no — por eso es tan importante la fecha del ADR.

## 7. El estado de una decisión no siempre está cerrado

No todas las decisiones se pueden tomar de inmediato al momento de entregar el ADR. Puede haber decisiones con un **estado pendiente**: ya se identificaron alternativas, pero se está a la espera de una prueba de concepto. Eso es normal en la vida real — no todo se resuelve de inmediato, aunque se sepa que hay que tomar la decisión.

## 8. Arquitectura de referencia vs. arquitectura de implementación

**Arquitectura de referencia:** es una vista de alto nivel de la solución, descrita por sus capas, componentes, tecnología y patrones — **sin nombres de marcas ni proveedores específicos**. La idea es que esa misma arquitectura de referencia se pueda implementar en cualquier proveedor (por ejemplo: usar un modelo tipo PaaS, microservicios, un modelo de arquitectura desacoplada y un CDN para publicación de contenido — esa misma solución conceptual sirve igual en Azure, AWS o GCP).

**Arquitectura de implementación:** aquí sí se concretan las decisiones con nombres de proveedores y tecnologías reales (por ejemplo, "voy a usar tal servicio de AWS", o "voy a desplegar de forma flexible usando open source porque esto es un piloto/MVP"). Es el detalle técnico de cómo se despliegan los componentes, integraciones, infraestructura y configuraciones.

Estos dos entregables (arquitectura de referencia + arquitectura de implementación) representan el grueso de lo que se debe entregar.

## 9. Diagrama de clases (de un caso de uso concreto)

Debe representar clases, atributos y métodos para **un caso de uso específico** del sistema — no para todo el sistema completo.

El profesor advierte que ha recibido diagramas tan grandes (con zoom de hasta el 2000%) que es imposible verlos completos en una sola pantalla, lo que los hace difíciles de entender. Para ese tipo de casos, él mismo apoya la revisión con herramientas de IA, pidiéndoles que comparen si distintos diagramas representan la misma solución y que sean coherentes entre sí con lo entregado.

Se pide el diagrama de clases porque, aunque en el futuro (quizás en dos o tres años) este tipo de diagrama pierda relevancia, en esta etapa de transición los estudiantes deben aprender a leerlos y construirlos.

**Herramientas aceptadas:** no importa cuál se use — Mermaid, draw.io, u otras similares (se menciona una herramienta llamada algo como "Archify" para generarlos). Incluso se puede pegar como imagen en Word. Lo importante es ser prácticos.

## 10. Diagrama de secuencia (de un caso de uso)

Muestra el flujo típico: el usuario llega, hace una solicitud, la aplicación la procesa, el servicio consulta la base de datos y devuelve una respuesta.

Aunque hoy en día ya no es tan indispensable en arquitecturas modernas, sigue siendo relevante por compatibilidad hacia atrás: si los estudiantes llegan a trabajar en una empresa con sistemas más tradicionales (algunos con más de 60 años en producción), van a tener que leer, entender y actualizar este tipo de diagramas. No se puede descartar ese conocimiento con el argumento de que "ya no se necesita".

## 11. Prototipo de interfaz de usuario

Se pide un diseño funcional de las pantallas principales que muestren la experiencia de usuario (UI/UX), considerando que puede haber **distintos tipos de usuario**:
- El usuario final del servicio.
- Quien gestiona usuarios dentro de la empresa.
- Quien recibe/consume el servicio.

El prototipo debe tener un modelo de navegación concreto (no es necesario cubrir absolutamente todo, pero sí debe ser una navegación real y clara).

## 12. Plataforma de observabilidad

Este punto tiene poco peso en la nota, pero el profesor insiste en que es **fundamental** en la práctica real ("pesa poquito acá, pero pesa mucho allá").

Se debe definir cómo se hará el monitoreo, las métricas, las trazas y los logs, para garantizar la operación, el rendimiento y la resiliencia del sistema.

**Analogía:** la observabilidad funciona como un auditor (o "CDD") que enciende alarmas cuando no se están alcanzando las métricas esperadas (por ejemplo, cuando sube la latencia). Los problemas casi siempre empiezan pequeños y se van agravando poco a poco hasta volverse exponenciales — por eso es clave detectarlos a tiempo.

Se debe mostrar en la exposición de la cuarta semana **cómo funciona realmente** la plataforma escogida (puede ser cualquier herramienta, mencionan ejemplos como Datadog o Grafana/Dynatrace, entre otras — lo importante es que sea funcional de verdad, no solo teoría).

**Dos vistas necesarias:**
- **Vista de negocio:** por ejemplo, cuántos usuarios hay activos, cuántas transacciones se hicieron en la última hora, cuánto representan esas transacciones en ingresos.
- **Vista técnica:** por ejemplo, si se está cumpliendo con la latencia esperada, si hay contención en la base de datos, etc.

No se premia tener muchas métricas — el profesor menciona el concepto de **"métricas doradas"** (golden metrics): no se necesitan 200 métricas, sino 4 o 5 métricas clave con sus respectivas alarmas, que permitan saber con tranquilidad cómo está funcionando el negocio y la aplicación.

## 13. Plan de pruebas unitarias

Un desarrollo sin pruebas "no es desarrollo". Se debe tener:
- Un plan de pruebas unitarias.
- Un plan de pruebas sobre los casos críticos del negocio, que garantice que al sacar un nuevo release no se dañe lo que ya está funcionando.

El profesor menciona que uno de los estudiantes trabaja en Bancolombia justamente en el área de pruebas (testing), lo cual es relevante para este entregable. Este ítem vale 5%; la definición de volumetría (relacionada) vale 0% en la nota, pero es necesaria como insumo para poder ejecutar las pruebas.

## 14. Definición de volumetría para pruebas

Se debe estimar volúmenes de datos, usuarios y transacciones para los escenarios de prueba — no hace falta una cifra exagerada (como 200 mil), pero sí algo representativo ("con carnita").

**Analogía usada:** "vamos a hacer un asado — si somos varios y compramos solo 10 chorizos, no alcanza para nadie; hay que calcular una cantidad razonable (30-40 chorizos, morcillas, carne) para que todos puedan comer". De la misma forma, la volumetría de prueba debe ser suficiente para validar el comportamiento real del sistema, sin necesidad de simular escenarios excesivos.

No se necesitan muchos escenarios de prueba — basta con que los casos de uso implementados sean representativos del comportamiento general de la aplicación.

## 15. Módulo de inyección de fallos

Permite simular fallos controlados (de red, de un servicio, de base de datos o de algún recurso) para validar cómo se comporta y se degrada la aplicación ante esos problemas.

El objetivo es lograr una **degradación elegante**: el sistema debe tener el control para manejar el error sin que el usuario final lo perciba como una falla total ("no le voy a decir al usuario simplemente 'error, no hay comunicación'").

**Ejemplos de mecanismos:**
- Patrón **circuit breaker**: ante un error detectado, se controla y contiene el fallo en vez de dejar que se propague.
- Ante un error en base de datos: encolar las solicitudes (cola de mensajes) y, cuando la base de datos se recupera, procesarlas desde la cola — así el usuario nunca percibe que hubo un problema; todo ocurre "puertas para adentro".

## 16. Pregunta de un estudiante: infraestructura para la implementación

**Pregunta:** si la decisión de arquitectura es usar microservicios sobre Kubernetes, ¿es obligatorio montar esa infraestructura en una nube real (por ejemplo AWS)?

**Respuesta del profesor:** No es obligatorio. Se puede montar en Kubernetes local (por ejemplo, con Minikube) o simular un ambiente de desarrollo similar al de AWS, usando herramientas open source. No es necesario desplegarlo en la nube — de hecho, por eso se insiste en el uso de open source, porque permite desplegar en un Kubernetes normal usando todas las herramientas disponibles. La idea es mostrar el piloto/MVP funcionando, y tener claridad de a qué proveedor de nube se migraría en producción y cuáles serían los costos asociados.

---

## 17. Adelanto: arquitecturas evolutivas (próxima clase)

El profesor adelanta que en la siguiente clase se hablará de **arquitecturas evolutivas**: la idea de arrancar con algo pequeño e ir evolucionando la arquitectura a través del tiempo, donde cada nuevo requerimiento se convierte en la excusa/oportunidad para evolucionarla.

Antes de eso, mostró **cuatro estrategias para transformar sistemas sin detener el negocio**, comenzando por el patrón de estrangulamiento (*Strangler Fig Pattern*), muy relevante para migrar componentes viejos a nuevos.

### Feature Toggles / Feature Flags

Son mecanismos (representados como "switches" o interruptores) que permiten **habilitar o deshabilitar capacidades en producción sin necesidad de desplegar nuevo código**, controlando así la exposición de una funcionalidad.

**Usos típicos:**
- Liberar un módulo nuevo solo para un subconjunto de la aplicación distribuida (por ejemplo, habilitarlo solo en una región específica), y una vez que funciona completamente, liberarlo para el resto — esto permite hacer un piloto controlado y salir a producción de forma gradual y segura.
- **Ejemplo de Mercado Libre:** la plataforma está segmentada por país (Brasil, Argentina, etc.), cada uno con reglas propias: comisión que se cobra al vendedor, tratamiento de impuestos, actividades y funcionalidades específicas por país.
- **Como mecanismo de defensa (similar a un circuit breaker):** si un módulo está siendo atacado, se puede deshabilitar mediante el flag para contener el problema ("me están atacando, me bajo").
- **Permission-based toggle (activación por segmento):** se puede decidir no habilitar una funcionalidad para ciertos usuarios en momentos específicos — por ejemplo, no activarla durante una hora pico.

### Beta testing / release controlado

Ejemplo real contado por el profesor: en una EPS, probaban una nueva funcionalidad únicamente en la sede de Córdoba, los sábados de 2 a 6 pm. Los usuarios de esa sede sabían que estaban en la prueba, trabajaban con la funcionalidad y reportaban cualquier problema directamente al equipo de desarrollo, que los acompañaba durante la prueba. Es un release controlado porque solo un grupo específico tiene acceso, distinto de la segmentación por región/permisos usada en el feature flag general.

### Diferencia entre beta testing y feature flag (pregunta de un estudiante)

Un estudiante preguntó cuál es la diferencia entre ambos mecanismos. El profesor explica que, de hecho, ambos suelen usarse juntos: se puede experimentar en producción sacando un módulo nuevo y probándolo primero con un grupo reducido (beta), y solo cuando ya está validado, habilitarlo (vía permission/feature flag) para el resto de usuarios o segmentos — por ejemplo, habilitar una funcionalidad para "los médicos" solamente después de que el piloto haya pasado exitosamente. En el fondo, ambos mecanismos terminan complementándose para lograr el mismo objetivo: una salida a producción controlada y segura.

---

## 18. Nota adicional (comentario breve durante la clase)

El profesor mencionó de forma tangencial el tema de **mapas de calor y neuromarketing**: dependiendo de dónde se ubique la información en una pantalla, esta será más o menos utilizada por el usuario (estudios con seguimiento ocular/psicológico). Lo trajo a colación para explicar por qué ciertos elementos visuales (como GIFs) se colocan estratégicamente para llamar la atención del usuario — como contexto adicional, no como parte central del contenido de la clase.