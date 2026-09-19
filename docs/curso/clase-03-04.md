# Clases 3 y 4 — Patrones y estilos de arquitectura

**Universidad EAFIT · Arquitecturas Avanzadas de Software · sábado 12 de septiembre de 2026**

> Digitalización de las láminas originales (generadas con NotebookLM), en
> [`material/2026-09-12-clase-03-04.pdf`](material/2026-09-12-clase-03-04.pdf). Se conserva
> el orden de las diapositivas y se transcribe todo el contenido textual, tablas y diagramas.
>
> **Lo que el profesor dijo de viva voz sobre el Entregable 2 está en
> [`clase-03-04-transcripcion.md`](clase-03-04-transcripcion.md)**, y lo que se pide está
> organizado en [`../proyecto/02-modelamiento/README.md`](../proyecto/02-modelamiento/README.md).

---

## Índice

1. [Revisión del ensayo](#1-revisión-del-ensayo)
2. [Kafka vs. RabbitMQ: Duelo de Mensajería](#2-kafka-vs-rabbitmq-duelo-de-mensajería)
3. [Patrones de Arquitectura](#3-patrones-de-arquitectura)
4. [Patrones/Estilos de arquitectura](#4-patronesestilos-de-arquitectura)
5. [Relación Estilo – Patrón (Style – Pattern)](#5-relación-estilo--patrón-style--pattern)
6. [Diferencias Estilo – Patrón](#6-diferencias-estilo--patrón)
7. [Cómo se clasifican los estilos](#7-cómo-se-clasifican-los-estilos)
8. [Estilos arquitectónicos según estructura del sistema](#8-estilos-arquitectónicos-según-estructura-del-sistema)
9. [Particionamiento técnico vs. por dominios](#9-particionamiento-técnico-vs-por-dominios)
10. [Estilo: Arquitectura en Capas (Layered)](#10-estilo-arquitectura-en-capas-layered)
11. [Estilo: Microkernel](#11-estilo-microkernel)
12. [Estilo: Event-Driven (basado en eventos)](#12-estilo-event-driven-basado-en-eventos)
13. [Estilo: Microservicios](#13-estilo-microservicios)
14. [Estilo: Space-Based Architecture](#14-estilo-space-based-architecture)
15. [Resumen comparativo de estilos](#15-resumen-comparativo-de-estilos)
16. [Architecture Styles Worksheet](#16-architecture-styles-worksheet)
17. [Ejercicios prácticos](#17-ejercicios-prácticos)
18. [Caso de estudio: Prime Video](#18-caso-de-estudio-prime-video)
19. [Arquitecturas Compuestas (MASA)](#19-arquitecturas-compuestas-masa)
20. [Composable Architecture: 20 beneficios ocultos](#20-composable-architecture-20-beneficios-ocultos)
21. [Proyecto Integrador — Entregable 2: Modelamiento](#21-proyecto-integrador--entregable-2-modelamiento)
22. [Proyecto Integrador — Tabla de Entregables](#22-proyecto-integrador--tabla-de-entregables)

---

## 1. Revisión del ensayo

**"Revisemos primero el ensayo"**

- Conversación activa.
- Aprender a escuchar.
- Todos queremos que nos escuchen y no sabemos escuchar a los demás.

---

## 2. Kafka vs. RabbitMQ: Duelo de Mensajería

*(Infografía — fuente: NotebookLM)*

**Subtítulo:** Comparando arquitecturas, rendimiento y casos de uso ideales. Elección: ¿Volumen masivo o flexibilidad?

### Arquitectura y rendimiento

**Apache Kafka — Log vs. Colas de Mensajes**
- **DISCO (PERSISTENTE)** → Log de mensajes distribuido
- **RAM (TRANSIENTE)** → Colas en memoria (comparación con RabbitMQ)

**Retención y Replay (Kafka)**
- Permite retransmitir mensajes históricos (como una cinta).
- RabbitMQ suele eliminar el mensaje tras el consumo exitoso.

**RabbitMQ — Rendimiento vs. Latencia**
- Throughput masivo (alto volumen).
- Latencia baja y predecible (sub-10 ms).

### Comparativa operativa rápida

| Aspecto | Kafka | RabbitMQ |
|---|---|---|
| **Escalabilidad** | Excelente (vía particiones) | Moderada (requiere lógica extra) |
| **Enrutamiento** | Básico (por tópicos) | Muy sofisticado (exchanges AMQP) |
| **Protocolos** | Propietario | Estándares (AMQP, MQTT, STOMP) |

### ¿Cuál elegir para tu proyecto?

**Casos ideales para Kafka:**
- Ingesta masiva de Big Data
- "Event Firehose"
- Captura de cambios (CDC)

**Casos ideales para RabbitMQ:**
- Microservicios
- Sistemas de solicitud-respuesta (RPC)
- Interoperabilidad IoT

**Uso combinado:** RabbitMQ para procesamiento inmediato, luego Kafka para almacenamiento a largo plazo. ¡El mejor de ambos mundos!

---

## 3. Patrones de Arquitectura

**Subtítulo:** Soluciones comprobadas para construir sistemas robustos, escalables y mantenibles.

*(La infografía usa la analogía de la Sagrada Familia de Barcelona para representar el crecimiento evolutivo de una arquitectura.)*

| Concepto | Descripción |
|---|---|
| **Crecimiento evolutivo complejo** (como la Sagrada Familia) | Evoluciona por etapas y se adapta a nuevas necesidades sin perder estabilidad. |
| **API Gateway** | Punto único de entrada que gestiona, enruta y protege las solicitudes a los servicios. |
| **Base estable y robusta** (como la parroquia italiana) | Cimientos sólidos que garantizan confiabilidad, seguridad y rendimiento a largo plazo. |
| **Event Broker** (Kafka / RabbitMQ) | Gestiona eventos en tiempo real para comunicación desacoplada entre servicios. |
| **Patrón CQRS — Lectura (Read)** | Optimiza consultas para obtener información rápida, consistente y escalable. |
| **Escritura (Write)** | Gestiona cambios de estado de forma segura y eficiente. |

**Microservicios y bases de datos políglotas:** infraestructura híbrida combinando distintos motores de base de datos (relacional, documentos, clave-valor, columnar).

> **Nota:** Los patrones de arquitectura son soluciones reutilizables basadas en experiencia que guían el diseño de sistemas flexibles, resilientes y alineados con los objetivos del negocio.

---

## 4. Patrones/Estilos de arquitectura

> Los patrones y estilos guían decisiones arquitectónicas para construir soluciones escalables, mantenibles y alineadas al negocio.

Cuatro pilares destacados:
- Soluciones comprobadas
- Eficiencia y escala
- Calidad y consistencia
- Alineación con el negocio

---

## 5. Relación Estilo – Patrón (Style – Pattern)

### Estilo Arquitectónico (*Architectural Style*)
Un estilo arquitectónico define la **estructura organizativa global** de un sistema de software. Es una **familia de sistemas** que comparten ciertas **características estructurales y principios de diseño**. Un estilo arquitectónico es mucho más que un patrón, ya que dicta la **organización fundamental** de todo el sistema. Es el **"tipo" de arquitectura** que se está utilizando.

**Beneficios de un buen estilo arquitectónico:**
- Proporciona una visión de alto nivel del sistema.
- Asegura consistencia en la estructura y componentes.
- Facilita decisiones de diseño estratégicas.
- Mejora la mantenibilidad y escalabilidad.

> **Tip:** Elegir un estilo arquitectónico adecuado al contexto del negocio y a los requisitos técnicos es clave para el éxito del sistema en el largo plazo. Un buen estilo guía el diseño, reduce la complejidad y alinea tecnología con estrategia.

### Patrón Arquitectónico (*Architectural Pattern*)
Un patrón arquitectónico es una **solución reusable** a un **problema recurrente** en un **contexto específico** dentro del diseño de software. Piensa en él como una **plantilla probada** para resolver un desafío de diseño particular. Los patrones arquitectónicos no son arquitecturas completas por sí mismos, sino más bien **bloques de construcción o mecanismos** que se pueden incorporar en el diseño general.

### Relación entre ambos conceptos

- **Jerarquía:** los estilos operan a un nivel de abstracción superior que los patrones. Un estilo proporciona el contexto general dentro del cual se pueden aplicar múltiples patrones.
- **Composición:** un sistema software puede implementar un estilo arquitectónico principal que incorpora múltiples patrones de arquitectura para resolver problemas específicos.
- **Especialización:** los patrones a menudo representan especializaciones o refinamientos de los principios generales establecidos por un estilo arquitectónico.
- **Implementación:** los patrones pueden ser utilizados como mecanismos concretos para implementar aspectos de un estilo arquitectónico más abstracto.
- Los **estilos arquitectónicos se construyen utilizando patrones arquitectónicos**. La implementación concreta de un estilo a menudo implica el uso de múltiples patrones para resolver problemas específicos dentro de esa arquitectura.
- Los **patrones arquitectónicos pueden ser utilizados dentro de diferentes estilos arquitectónicos**. Un patrón como el "Proxy" o el "Pub-Sub" no está limitado a un único estilo arquitectónico; puede ser útil en arquitecturas monolíticas, de microservicios, o basadas en eventos, dependiendo de las necesidades.
- Los **estilos arquitectónicos proporcionan el contexto para aplicar patrones**. El estilo elegido define el "marco general" dentro del cual los patrones arquitectónicos se utilizan para refinar el diseño y resolver desafíos específicos.

---

## 6. Diferencias Estilo – Patrón

| Aspecto | Estilo de Arquitectura | Patrón de Arquitectura |
|---|---|---|
| **Alcance** | Global, define la estructura general | Local, aborda problemas específicos |
| **Nivel de abstracción** | Mayor (macro-arquitectura) | Menor (meso-arquitectura) |
| **Especificidad** | Define principios generales | Proporciona soluciones concretas |
| **Contexto de aplicación** | Define el contexto arquitectónico | Opera dentro de un contexto dado |
| **Adaptabilidad** | Define restricciones amplias | Ofrece soluciones parametrizables |
| **Propósito** | Establece el paradigma estructural | Resuelve problemas recurrentes |

---

## 7. Cómo se clasifican los estilos

Los estilos arquitectónicos se pueden clasificar según diferentes criterios:

| Criterio de clasificación | Descripción | Ejemplos |
|---|---|---|
| **Según la Estructura del Sistema** | Describe cómo se organiza el sistema en componentes y cómo interactúan entre sí. | Capas (Layers), Cliente-Servidor, Tuberías y Filtros, Repositorio, Microservicios |
| **Según el Alcance de Aplicación** | Indica el nivel o dominio en el que se aplica el estilo. | Arquitectura Empresarial, Arquitectura de Soluciones, Arquitectura de Software |
| **Según la Composición** | Define cómo se combinan los componentes o módulos del sistema. | Arq. Monolíticas, Basada en Componentes, Orientada a Servicios (SOA), Microkernel (Plug-in) |
| **Según las Cualidades de Calidad** | Se enfoca en atributos de calidad específicos que el sistema debe cumplir. | Rendimiento, Disponibilidad, Seguridad, Escalabilidad, Modificabilidad |
| **Según la Tecnología o Paradigma** | Basado en el paradigma de programación o tecnología utilizada. | Orientada a Objetos, Orientada a Eventos, Reactiva, Serverless |

---

## 8. Estilos arquitectónicos según estructura del sistema

### Monolitos
Los estilos de arquitectura monolítica son generalmente mucho más simples que los distribuidos, y por ello son más fáciles de diseñar e implementar. Estas aplicaciones de **unidad de despliegue única** son bastante económicas desde el punto de vista del costo total. Además, la mayoría de las aplicaciones con estilo monolítico se pueden desarrollar y desplegar mucho más rápido que las distribuidas.

*Diagrama: User interface → varios componentes internos → Database (todo dentro de una sola unidad de despliegue).*

### Distribuidas
Como su nombre indica, las arquitecturas distribuidas consisten en **múltiples unidades de despliegue** que trabajan juntas para realizar una función de negocio cohesiva. Hoy en día, la mayoría de las arquitecturas distribuidas consisten en servicios, aunque cada estilo de arquitectura distribuida tiene su propio nombre formal para un servicio.

*Diagrama: User interface → Service, Service, Service (unidades independientes) → Database.*

---

## 9. Particionamiento técnico vs. por dominios

### Particionamiento técnico
En este estilo de arquitectura, los componentes se organizan por **capas técnicas**; por ejemplo, componentes de presentación relacionados con la interfaz de usuario, componentes de la capa de negocio relacionados con las reglas de negocio y el procesamiento central, componentes de la capa de persistencia que interactúan con la base de datos, y la capa de base de datos que contiene los datos del sistema.

*Diagrama: Presentation layer → Business layer → Persistence layer → Database.*

### Particionamiento por dominios
A diferencia de las arquitecturas particionadas técnicamente, los componentes en las arquitecturas particionadas por dominio se organizan por **áreas de dominio**, no por uso técnico. Esto significa que toda la funcionalidad (presentación, lógica de negocio y lógica de persistencia) se agrupa para cada área de dominio y subdominio en zonas separadas de la aplicación.

*Diagrama: Customer, Inventory, Payment, Shipping, Fulfillment, Analytics (cada dominio con su propia lógica completa) → Database.*

### Particionamiento técnico – Arquitectura por Capas (Layered)
Los componentes dentro del estilo de arquitectura en capas se organizan en **capas horizontales**, cada una desempeñando un rol específico dentro de la aplicación (como lógica de presentación, lógica de negocio, lógica de persistencia, etc.). Aunque el número de capas puede variar, la mayoría de las arquitecturas en capas constan de cuatro capas estándar: **presentación, negocio, persistencia y base de datos**.

*Diagrama: Presentation layer (Component, Component, Component) → Business layer (Component, Component, Component) → Persistence layer (Component, Component, Component) → Database layer (múltiples bases de datos).*

---

## 10. Estilo: Arquitectura en Capas (Layered)

**Figura 3-5 — Características de arquitectura (rating por estrellas):**

| Característica | Calificación |
|---|---|
| Tipo de particionamiento | Técnico |
| Costo total | $ |
| Agilidad | ★☆☆☆☆ (1/5) |
| Simplicidad | ★★★★★ (5/5) |
| Escalabilidad | ★☆☆☆☆ (1/5) |
| Tolerancia a fallos | ★☆☆☆☆ (1/5) |
| Rendimiento | ★★★☆☆ (3/5) |
| Extensibilidad | ★☆☆☆☆ (1/5) |

---

## 11. Estilo: Microkernel

El estilo de arquitectura microkernel es una arquitectura **flexible y extensible** que permite a un desarrollador o usuario final agregar fácilmente funcionalidades y características adicionales a una aplicación existente en forma de extensiones, o **"plug-ins"**, sin impactar la funcionalidad central del sistema.

*Diagrama: Plug-in component (x6) conectados alrededor de un Core system central.*

**Figura 4-3 — Características de arquitectura (rating por estrellas):**

| Característica | Calificación |
|---|---|
| Tipo de particionamiento | Técnico o de dominio |
| Costo total | $ |
| Agilidad | ★★★☆☆ (3/5) |
| Simplicidad | ★★★★★ (5/5) |
| Escalabilidad | ★☆☆☆☆ (1/5) |
| Tolerancia a fallos | ★☆☆☆☆ (1/5) |
| Rendimiento | ★★★☆☆ (3/5) |
| Extensibilidad | ★★★★☆ (4/5) |

---

## 12. Estilo: Event-Driven (basado en eventos)

El estilo de arquitectura basado en eventos ha ganado popularidad y uso significativamente en los últimos años, tanto que incluso la forma en que pensamos sobre él ha cambiado. Esta alta tasa de adopción no es sorprendente dado que resuelve problemas complejos como **flujos de trabajo no deterministas** y sistemas **altamente reactivos y responsivos**.

*Diagrama: Initiating event → Event channel → Event processor → Processing event → Event channel → Event processor(s).*

**Figura 5-5 — Características de arquitectura (rating por estrellas):**

> El gráfico resume las capacidades generales (características arquitectónicas) de la arquitectura basada en eventos en términos de calificación por estrellas. Una estrella significa que la característica no está bien soportada, mientras que cinco estrellas significa que es muy adecuada para esa característica.

| Característica | Calificación |
|---|---|
| Tipo de particionamiento | Técnico |
| Costo total | $$$ |
| Agilidad | ★★★☆☆ (3/5) |
| Simplicidad | ★☆☆☆☆ (1/5) |
| Escalabilidad | ★★★★★ (5/5) |
| Tolerancia a fallos | ★★★★★ (5/5) |
| Rendimiento | ★★★★★ (5/5) |
| Extensibilidad | ★★★★★ (5/5) |

---

## 13. Estilo: Microservicios

El estilo de arquitectura de microservicios es un **ecosistema** compuesto por servicios de **propósito único, desplegados por separado**, a los que normalmente se accede a través de un **API gateway**. Las solicitudes de los clientes, originadas ya sea desde una interfaz de usuario (usualmente un microfrontend) o desde una solicitud externa, invocan endpoints bien definidos en un API gateway, que luego reenvía la solicitud a los servicios desplegados por separado. Cada servicio accede a sus propios datos, o realiza solicitudes a otros servicios para acceder a datos que no posee.

*Diagrama: HTTP client → API gateway → Service, Service, Service (cada uno con su propia Database).*

*(No se presenta una tabla individual de calificación por estrellas para microservicios en esta diapositiva; ver la [tabla resumen comparativo](#15-resumen-comparativo-de-estilos).)*

---

## 14. Estilo: Space-Based Architecture

El estilo de arquitectura space-based está diseñado específicamente para **abordar y resolver problemas de alta escalabilidad y concurrencia**. También es útil para aplicaciones con volúmenes de usuarios concurrentes variables e impredecibles (conocidos como **sistemas elásticos**). Resolver necesidades de escalabilidad extrema y variable es exactamente de lo que se trata la space-based architecture.

*Diagrama: HTTP client → múltiples Web servers → múltiples Application servers → múltiples Databases (la base de datos suele ser el cuello de botella final en sistemas altamente escalables).*

**Figura 7-5 — Características de arquitectura (rating por estrellas):**

| Característica | Calificación |
|---|---|
| Tipo de particionamiento | Técnico |
| Costo total | $$$$$ |
| Agilidad | ★★☆☆☆ (2/5) |
| Simplicidad | ★☆☆☆☆ (1/5) |
| Escalabilidad | ★★★★★ (5/5) |
| Tolerancia a fallos | ★★★☆☆ (3/5) |
| Rendimiento | ★★★★★ (5/5) |
| Extensibilidad | ★★★☆☆ (3/5) |

---

## 15. Resumen comparativo de estilos

> Este resumen ayuda a determinar qué estilo podría ser el mejor para cada situación. Por ejemplo, si la principal preocupación arquitectónica es la escalabilidad, el estilo event-driven, microservicios y space-based son probablemente buenas opciones. De forma similar, si se elige el estilo de capas (layered), hay que tener en cuenta que el despliegue, el rendimiento y la escalabilidad podrían ser áreas de riesgo en la arquitectura.

**Figura A-1 — Resumen de calificaciones de estilos de arquitectura** (● = nivel de calificación; a mayor número de símbolos, mejor soporte de la característica):

| Característica | Layered | Microkernel | Event-driven | Microservices | Space-based |
|---|---|---|---|---|---|
| **Particionamiento** | T (Técnico) | D/T (Dominio/Técnico) | T (Técnico) | D (Dominio) | T (Técnico) |
| **Costo total** | $ | $ | $$$ | $$$$$ | $$$$$ |
| **Agilidad** | ● | ●●● | ●●● | ●●●●● | ●● |
| **Simplicidad** | ●●●●● | ●●●● | ● | ● | ● |
| **Escalabilidad** | ● | ● | ●●●●● | ●●●●● | ●●●●● |
| **Tolerancia a fallos** | ● | ● | ●●●●● | ●●●●● | ●●● |
| **Rendimiento** | ●●● | ●●● | ●●●●● | ●● | ●●●●● |
| **Extensibilidad** | ● | ●●● | ●●●●● | ●●●●● | ●●● |

*Fuente citada en la diapositiva: "Software Architecture Patterns, 2nd Edition".*

---

## 16. Architecture Styles Worksheet

*(Plantilla de trabajo — V2.0, creada por Mark Richards, DeveloperToArchitect.com)*

Incluye un encabezado para completar: **Sistema/Proyecto**, **Arquitecto/Equipo**, **Fecha**, y casillas de selección para 8 arquitecturas: **layered, modular monolith, microkernel, microservices, service-based, service-oriented, event-driven, space-based**.

| Criterio | Layered | Modular Monolith | Microkernel | Microservices | Service-based | Service-oriented | Event-driven | Space-based |
|---|---|---|---|---|---|---|---|---|
| **Partitioning** | technical | domain | domain | domain | domain | technical | technical | technical |
| **Cost** | $ | $ | $ | $$$$$ | $$ | $$$$ | $$$ | $$$$ |
| **Maintainability** | ★ | ★★ | ★★★ | ★★★★★ | ★★★★ | ★ | ★★★ | ★★★ |
| **Testability** | ★★ | ★★ | ★★★ | ★★★★★ | ★★★★ | ★ | ★★ | ★ |
| **Deployability** | ★ | ★★ | ★★★ | ★★★★★ | ★★★★ | ★ | ★★★ | ★★★ |
| **Simplicity** | ★★★★★ | ★★★★★ | ★★★★ | ★ | ★★★ | ★ | ★★ | ★ |
| **Scalability** | ★ | ★ | ★ | ★★★★★ | ★★★ | ★★★ | ★★★★ | ★★★★★ |
| **Elasticity** | ★ | ★ | ★ | ★★★★ | ★★ | ★★★ | ★★★ | ★★★★★ |
| **Responsiveness** | ★★★ | ★★★ | ★★★ | ★★ | ★★★ | ★★ | ★★★★★ | ★★★★★ |
| **Fault-tolerance** | ★ | ★ | ★ | ★★★★★ | ★★★★ | ★★★ | ★★★★★ | ★★★ |
| **Evolvability** | ★ | ★ | ★★★ | ★★★★★ | ★★★★ | ★ | ★★★★★ | ★★★ |
| **Abstraction** | ★ | ★ | ★★★ | ★ | ★ | ★★★★★ | ★★★★ | ★ |
| **Interoperability** | ★ | ★ | ★★★ | ★★★ | ★★ | ★★★★★ | ★★★ | ★★ |

---

## 17. Ejercicios prácticos

### Ejercicio 1 — Sistema de Gestión de Inventarios
- **Solución necesaria:** una aplicación web para gestionar el inventario de una tienda minorista, con módulos para entrada/salida de productos, reportes y auditorías.
- **Descripción del problema:** el sistema debe ser modular, fácil de mantener, y permitir la separación clara entre la lógica de negocio, la interfaz de usuario y el acceso a datos.
- **Por qué usar Capas:** el patrón de Capas organiza el sistema en niveles (presentación, lógica de negocio, datos), promoviendo la separación de responsabilidades, facilitando el mantenimiento y permitiendo actualizaciones en una capa sin afectar las demás. Por ejemplo, cambiar la base de datos no impacta la lógica de negocio.
- **Ejemplo de implementación:** capa de presentación con React, capa de lógica de negocio con servicios en Java, y capa de datos con un ORM como Hibernate conectado a PostgreSQL.

### Ejercicio 2 — Sistema de Reservas de Vuelos
- **Solución necesaria:** una plataforma escalable para reservas de vuelos que integre búsqueda, pago y notificaciones.
- **Descripción del problema:** la plataforma debe soportar picos de tráfico, integrarse con múltiples proveedores externos (aerolíneas, pasarelas de pago) y permitir despliegues independientes.
- **Por qué usar Microservicios:** este patrón permite dividir la funcionalidad en servicios independientes (búsqueda de vuelos, gestión de pagos, notificaciones), cada uno con su propia base de datos y tecnología, lo que facilita la escalabilidad horizontal y el despliegue continuo.
- **Ejemplo de implementación:** servicios en contenedores Docker (uno para búsqueda en Node.js, otro para pagos en Python), orquestados con Kubernetes.

### Ejercicio 3 — Sistema de Monitoreo de automatizadores de una fábrica
- **Solución necesaria:** un sistema para procesar datos en tiempo real de dispositivos IoT, como sensores en una fábrica.
- **Descripción del problema:** los dispositivos generan eventos continuos (temperatura, presión) que deben procesarse rápidamente para alertar sobre anomalías.
- **Por qué usar Event-Driven:** este patrón permite manejar flujos asíncronos de eventos, desacoplando productores (sensores) de consumidores (procesadores de datos), lo que mejora la escalabilidad y la capacidad de respuesta en tiempo real.
- **Ejemplo de implementación:** uso de Apache Kafka para la cola de eventos, con microservicios consumiendo eventos para análisis y alertas.

### Ejercicio 4 — Sistema Operativo Personalizable
- **Solución necesaria:** un sistema operativo ligero para dispositivos embebidos, con soporte para módulos personalizados.
- **Descripción del problema:** el sistema debe ser altamente modular, permitiendo agregar o quitar funcionalidades (como soporte para nuevos periféricos) sin recompilar todo el sistema.
- **Por qué usar Microkernel:** el patrón Microkernel separa el núcleo del sistema (servicios básicos) de los módulos opcionales, permitiendo extensiones dinámicas y mejor mantenimiento.
- **Ejemplo de implementación:** un núcleo minimalista que maneja procesos y memoria, con módulos como controladores de dispositivos cargados dinámicamente.

### Ejercicio 5 — Plataforma de Comercio Electrónico
- **Solución necesaria:** una tienda en línea que soporte picos de tráfico durante eventos como Black Friday.
- **Descripción del problema:** la aplicación debe manejar miles de transacciones simultáneas sin degradación del rendimiento.
- **Por qué usar Space-Based:** este patrón utiliza almacenamiento en memoria distribuida (como cachés) y procesamiento paralelo para manejar grandes volúmenes de datos y tráfico, eliminando cuellos de botella en bases de datos tradicionales.
- **Ejemplo de implementación:** uso de Apache Ignite para caché distribuido, con nodos de procesamiento que manejan sesiones de usuario y carritos de compra.

### Ejercicio 6 — Sistema Microcréditos
- **Solución necesaria:** un sistema para procesar transacciones bancarias, con auditorías y reportes regulatorios.
- **Descripción del problema:** el sistema requiere alta seguridad, trazabilidad y facilidad para actualizar reglas de negocio sin afectar la interfaz o el almacenamiento.
- **Por qué usar Capas:** la separación en capas (presentación, lógica de negocio, datos) permite aislar la lógica de seguridad y reglas regulatorias, facilitando auditorías y actualizaciones.
- **Ejemplo de implementación:** capa de presentación con Angular, lógica de negocio en Spring Boot, y almacenamiento en Oracle con auditoría en una capa separada.

### Ejercicio 7 — Plataforma de Streaming de Video
- **Solución necesaria:** un sistema para streaming de video con recomendaciones personalizadas y facturación.
- **Descripción del problema:** la plataforma debe escalar servicios independientes (streaming, recomendaciones, pagos) y soportar múltiples regiones.
- **Por qué usar Microservicios:** permite que cada servicio (como el motor de recomendaciones) escale y se desarrolle de forma independiente, optimizando recursos y facilitando integraciones con terceros.
- **Ejemplo de implementación:** servicio de streaming en Go, recomendaciones con TensorFlow en Python, y pagos en Java, coordinados con una API Gateway.

### Ejercicio 8 — Sistema de Procesamiento de Pagos
- **Solución necesaria:** un sistema para procesar pagos en tiempo real, con detección de fraudes y notificaciones.
- **Descripción del problema:** los pagos deben procesarse rápidamente, y las alertas de fraude deben generarse sin retrasar las transacciones.
- **Por qué usar Event-Driven:** este patrón permite que los eventos de pago desencadenen procesos paralelos (validación, detección de fraude, notificaciones), asegurando baja latencia y desacoplamiento.
- **Ejemplo de implementación:** cola de eventos en RabbitMQ, con microservicios para validación de pagos y análisis de fraude en tiempo real.

### Ejercicio 9 — Sistema de Automatización Industrial
- **Solución necesaria:** un software para controlar maquinaria industrial con soporte para nuevos dispositivos.
- **Descripción del problema:** el sistema debe ser extensible para integrar nuevos protocolos de comunicación y tipos de máquinas sin modificar el núcleo.
- **Por qué usar Microkernel:** el núcleo proporciona servicios básicos (como comunicación y control), mientras que los módulos plug-in manejan dispositivos específicos, facilitando la extensibilidad.
- **Ejemplo de implementación:** núcleo en C++ para control básico, con plug-ins para protocolos como Modbus o OPC UA.

### Ejercicio 10 — Plataforma de Análisis de Big Data
- **Solución necesaria:** un sistema para analizar grandes volúmenes de datos en tiempo real, como logs de servidores.
- **Descripción del problema:** el sistema debe procesar terabytes de datos con baja latencia y alta disponibilidad.
- **Por qué usar Space-Based:** este patrón utiliza almacenamiento en memoria distribuida y particionamiento para procesar datos masivos en paralelo, garantizando escalabilidad y rendimiento.
- **Ejemplo de implementación:** uso de Hazelcast para almacenamiento en memoria y Apache Spark para procesamiento distribuido.

### Ejercicio 11 — Plataforma de Mensajería Instantánea
- **Solución necesaria:** una aplicación de mensajería con soporte para chats, grupos y multimedia.
- **Descripción del problema:** la aplicación debe escalar para millones de usuarios y permitir actualizaciones frecuentes en funciones específicas.
- **Por qué usar Microservicios:** cada funcionalidad (chat, almacenamiento de multimedia, notificaciones) puede desarrollarse y escalarse de forma independiente, mejorando la agilidad y el rendimiento.
- **Ejemplo de implementación:** servicios en Node.js para chats, almacenamiento en S3, y notificaciones con Firebase.

---

## 18. Caso de estudio: Prime Video

**Arquitectura original (distribuida / microservicios con AWS Step Functions):**
- Customer envía audio/video stream.
- AWS Step Functions workflow → AWS Lambda (Entry point) → inicia conversión.
- Ejecución paralela con dos detectores (AWS Step Functions Detector 1 y Detector 2), cada uno como una unidad de cómputo (compute unit).
- Media Conversion Service procesa el audio/video buffer, almacenado en un bucket de Amazon S3.
- AWS Lambda (Result aggregation) agrega los resultados de detección.
- Resultados almacenados en un bucket de Amazon S3 (detection results).
- Amazon SNS notifica al cliente en tiempo real (real-time detection results).

**Nueva arquitectura (monolito — todos los componentes trasladados a un solo proceso):**
- Un único **Amazon ECS task** contiene: Orchestration, Media Converter, Detection (Detector 1 y Detector 2), Result aggregation e Instance Memory.
- El cliente inicia el análisis (start analysis) y recibe resultados en tiempo real vía Amazon SNS.
- Resultados agregados se almacenan en Amazon S3.

> Este caso ilustra cómo Amazon migró un servicio de monitoreo de audio/video de una arquitectura distribuida (microservicios/serverless) a una arquitectura monolítica, **reduciendo costos en un 90%**.

**Fuente:** https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90

---

## 19. Arquitecturas Compuestas (MASA)

> Los negocios digitales requieren **arquitecturas de aplicación composables** que permitan agilidad, flexibilidad, integración e innovación. Una arquitectura de tipo "mesh app and service" (MASA) con un enfoque centrado en APIs permite a arquitectos de aplicaciones e ingenieros de software satisfacer esas necesidades.

### Hallazgos clave (Key Findings)
1. Una arquitectura de aplicación composable **nunca está terminada**. A medida que evolucionan los requisitos de negocio y las tecnologías, también lo hace la arquitectura.
2. Una arquitectura de tipo "mesh app and service" (**MASA**) aplica patrones de arquitectura probados y un diseño de interfaz de usuario intuitivo para soportar una arquitectura ágil y composable, compuesta por aplicaciones multiexperiencia, APIs mediadas y servicios de múltiples granularidades.
3. Una arquitectura de aplicación ágil exige un enfoque **distribuido y desacoplado** que permita el desarrollo, pruebas y despliegue independientes de cada componente. Este enfoque permite a los desarrolladores usar la tecnología óptima para cada componente.

### Recomendaciones
1. **Usar MASA para crear una arquitectura ágil en aplicaciones nuevas.** MASA habilita altos grados de escalabilidad, flexibilidad y composabilidad de aplicaciones e integraciones personalizadas.
2. **Usar MASA como el enfoque óptimo para modernizar aplicaciones heredadas (legacy).** La arquitectura permite actualizar, reemplazar y modernizar componentes de forma independiente entre sí, a un ritmo que la organización pueda tolerar.
3. **Implementar MASA en pasos, construyendo componentes incrementalmente** y adaptando funcionalidad en cada iteración. Esto permite evolucionar la arquitectura, perfeccionar habilidades y aplicar mejores prácticas a medida que se aclaran nuevos requisitos de apps, APIs y servicios.
4. **Usar un enfoque de APIs mediadas** para abstraer las dependencias de servicios back-end de las apps multiexperiencia. Descomponer las aplicaciones en servicios según sea necesario para ganar más agilidad.
5. **Implementar una estrategia de versionamiento** tanto para componentes como para interfaces, que aísle el ciclo de vida de cada componente arquitectónico. Esto minimiza el acoplamiento y da la flexibilidad necesaria para adaptarse e innovar.

**El valor de una arquitectura compuesta (MASA):** mayor agilidad y velocidad · flexibilidad para adaptarse al cambio · mejor integración e innovación · resiliencia y confiabilidad · equipos autónomos y más productivos.

### ¿Qué es Composable Architecture / MASA?

**MASA = Microservices + API + SaaS + AI**

> MASA es una arquitectura de aplicación composable, ágil y distribuida que permite a las organizaciones crear, adaptar y modernizar aplicaciones rápidamente.

**¿Qué significa "composable"?**
- **Composable Apps:** aplicaciones compuestas por módulos de negocio reutilizables que se pueden combinar, reemplazar o escalar de forma independiente.
- **APIs & Services:** servicios expuestos y consumidos a través de APIs que facilitan la integración, la orquestación y la reutilización.
- **Fit-for-purpose multiexperience apps:** experiencias diseñadas para canales y usuarios específicos, optimizadas para cada contexto de uso.

**Outer APIs – Mediated APIs – Inner APIs**
- **Outer APIs:** exponen capacidades a socios, clientes o ecosistemas.
- **Mediated APIs:** orquestan, combinan y adaptan servicios para necesidades específicas.
- **Inner APIs:** exponen capacidades internas de forma segura dentro de la organización.

**Multigrained services:** servicios con diferentes niveles de granularidad (finos, medianos y gruesos) para maximizar la reutilización y el valor de negocio.

- **Empieza pequeño, evoluciona con el tiempo:** para implementar exitosamente MASA, se debe comenzar pequeño y evolucionar la arquitectura con el tiempo mientras se desarrollan las habilidades necesarias, se establece coordinación y se adapta la infraestructura.
- **¿Qué es MASA?:** una arquitectura de aplicación composable, ágil y distribuida que aplica un enfoque modular para crear, adaptar y modernizar aplicaciones rápidamente.
- **La pregunta clave:** "¿Cómo implemento una arquitectura de aplicación que proporcione la agilidad óptima para innovar y adaptarse al cambio?"

**Beneficios de una arquitectura composable (MASA):** mayor agilidad e innovación · escalabilidad y flexibilidad · menor costo de cambio · resiliencia y disponibilidad · equipos autónomos y empoderados · mejor experiencia de cliente.

---

## 20. Composable Architecture: 20 beneficios ocultos

> Composable Architecture no solo transforma la forma de construir software, sino también los resultados del negocio. Estos beneficios suelen ser invisibles, pero su impacto es enorme.

1. Decentralized Decision-Making
2. Easy Maintainability
3. Enhanced Developer Experience
4. Quick Decommissioning Of Underperforming Modules
5. Faster Experimentation
6. Empowerment Of Nontechnical Teams
7. Selective Innovation
8. Rapid AI Integration
9. Boosted Business Flexibility
10. Readiness For Rapid Strategic Pivots
11. More Independent Teams
12. 'Scope Creep' Becoming 'Scope Leap'
13. The Ability To Isolate Production Issues
14. Fast Innovation With Minimal Disruption
15. Faster Developer Onboarding
16. Avoidance Of Vendor Lock-In
17. Freedom To 'Fail Cheaply'
18. Shorter Time To Value
19. Rapid Disaster Recovery
20. Reduced 'Cost Of Change'

**Resumen:** beneficios que no siempre se ven, pero que definen la ventaja competitiva: más agilidad para innovar · mayor resiliencia operacional · decisiones más rápidas · equipos más empoderados.

---

## 21. Proyecto Integrador — Entregable 2: Modelamiento

**Objetivo:** modelar la arquitectura de referencia y la arquitectura de implementación de la solución propuesta en el punto 1 (Entregable 1). *"De la visión a un diseño concreto."*

**Secuencia de entregables del proyecto:**
1. **Entregable 1:** Caso de negocio y requerimientos
2. **Entregable 2:** Modelamiento (Arquitecturas)
3. **Entregable 3:** Validación y plan de adopción

**Preguntas guía del Entregable 2:**
- ¿Qué patrones arquitectónicos utilizarás?
- ¿Cómo se relacionan los componentes?
- ¿Cómo soporta esta arquitectura los requerimientos del negocio?

> Una arquitectura bien modelada es la base para soluciones sostenibles, escalables y alineadas con el negocio.

---

## 22. Proyecto Integrador — Tabla de Entregables

> Cada entregable aporta al desarrollo del proyecto y tiene un porcentaje de participación en la calificación total.

| # | Entregable | % | Descripción |
|---|---|---|---|
| 1 | **Modelo de dominio** (completo) | 5% | Diagrama que muestra las entidades del dominio, sus atributos, relaciones y reglas de negocio. *Ejemplo: Cliente → Pedido → Producto, con sus atributos (id, nombre, email / id, fecha, estado / id, descripción, precio).* |
| 2 | **ADR** (Architectural Decision Record) | 25% | Documento que registra las decisiones clave de arquitectura, con su contexto, alternativas, motivación y consecuencias. *Estructura: Contexto → Decisión → Alternativas → Consecuencias.* |
| 3 | **Arquitectura de referencia** | 20% | Vista de alto nivel de la solución, con sus capas, componentes, tecnologías y patrones. *Estructura: Canales/Clientes → Capa de Aplicación → Capa de Servicios → Capa de Datos.* |
| 4 | **Arquitectura de implementación** | 20% | Detalle técnico de cómo se despliegan los componentes, integraciones, infraestructura y configuraciones. *Incluye Frontend y Backend (contenedores, nube, bases de datos).* |
| 5 | **Diagrama de clases** (de un caso) | 5% | Representa las clases, atributos, métodos y relaciones para un caso específico del sistema. *Ejemplo: Usuario – Pedido – Producto.* |
| 6 | **Diagrama de secuencia** (de un caso) | 5% | Muestra la interacción entre objetos y el flujo de mensajes en un escenario específico. *Ejemplo: Usuario → Aplicación → Servicio → BD (Solicitud → Procesa → Consulta → Respuesta).* |
| 7 | **Prototipo de interfaz de usuario** | 10% | Diseño funcional de las pantallas principales que muestran la experiencia del usuario (UI/UX). |
| 8 | **Plataforma de observabilidad** | 5% | Monitoreo, métricas, trazas y logs para garantizar la operación, rendimiento y resiliencia del sistema. |
| 9 | **Plan de pruebas unitarias** | 5% | Estrategia, casos y resultados de pruebas unitarias que validan el correcto funcionamiento del código, sobre los casos de uso definidos. *Incluye: escenario, datos de prueba, resultado esperado, evidencia.* |
| 10 | **Definición de volumetría para pruebas** | 0% | Estimación de volúmenes de datos, usuarios y transacciones para escenarios de prueba. |
| 11 | **Módulo de inyección de fallos** | 0% | Mecanismo para simular fallos y validar la resiliencia del sistema (red, servicios, BD, recursos). |

**Mensaje final:** *"Un entregable, un objetivo: construir una solución de software sólida, escalable y alineada con las mejores prácticas de arquitectura y desarrollo."*
— Arquitectura + Calidad · Trabajo en equipo + Colaboración · Innovación + Mejores prácticas

---

*Fin del documento — contenido íntegro de las diapositivas "Arquitecturas Avanzadas de Software — Semana 2 (Clases 3 y 4), Universidad EAFIT, 2025".*