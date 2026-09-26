# Autoevaluación del equipo — Entrega 3

## Cómo entendemos el resultado

La implementación quedó **muy compatible con lo que modelamos**, y no fue casualidad: entendimos
que **modelamiento e implementación tienen propósitos distintos**.

- **Modelamiento** → diseñar la solución completa y correcta. Es el **norte**.
- **Implementación** → decidir, con criterio de ingeniería, **qué construir primero y hasta dónde**.

Priorizamos por **valor de negocio**, **riesgo** y por las **garantías no negociables** de nuestro
caso:

1. Nunca vender por encima del aforo.
2. Nunca cobrar sin entregar la boleta.
3. Nunca perder la titularidad.

> Preferimos construir bien, probar y poder defender un núcleo sólido, antes que dejar muchas
> piezas a medias por querer tenerlo todo.

## Qué nos propusimos y qué entregamos

- **Nos propusimos** explorar un caso de negocio que nos llamaba la atención —las tiqueteras— y
  entender de verdad cómo funciona por detrás.
- **Terminamos yendo más allá:** propusimos una arquitectura original que resuelve las
  problemáticas reales del sector (avalanchas de tráfico, sobreventa, dinero cobrado sin boleta).
- **Entregamos:**
  - Aplicación con el recorrido completo de compra: fila → reserva → pago → emisión, sobre
    PostgreSQL, Redis y Kafka.
  - Plataforma web que muestra ese recorrido.
  - Reglas de negocio del modelo cubiertas por pruebas unitarias.
  - Observabilidad con métricas, tableros y alertas.
  - Cuatro experimentos de inyección de fallos ejecutados y analizados.

## Qué implementamos y qué no, frente al modelamiento

Somos explícitos para poder responder por todo lo que propusimos.

### ✅ Implementado y probado
- Núcleo transaccional en PostgreSQL como autoridad del aforo.
- SAGA orquestada de la compra, con sus caminos de error.
- Mensajería con outbox transaccional, Kafka y cola de no procesables (DLQ).
- Separación de lecturas y escrituras (CQRS).
- Sala de espera en Redis como válvula de admisión.
- Idempotencia del pago.
- Arquitectura hexagonal por contextos.
- Plataforma de observabilidad completa.

### 🟳 Equivalente de piloto (mismo patrón, otra tecnología)
La arquitectura de implementación separa el diseño para la nube del piloto que corre el equipo.

| Propusimos (nube) | Lo hicimos con |
|---|---|
| Cognito (identidad) | JWT firmado |
| KMS (cifrado) | AES-256-GCM |
| API Gateway + WAF | Borde propio: control de tasa + detección de bots |
| MSK / ElastiCache | Kafka y Redis en contenedor |
| EKS | minikube |

### ⚪ No incluido, a conciencia (no eran garantías de negocio)
- **Reventa de boletas:** modelada, pero sin flujo de aplicación (el foco era la venta primaria).
- **Nube robusta** (alta disponibilidad multi-zona, réplicas, IaC completo): por tiempo y
  capacidades del equipo.
- **Buscador dedicado (OpenSearch):** la búsqueda se resuelve sobre PostgreSQL.
- **Circuit breaker completo:** quedó como reintentos acotados + compensación.
- **Gestión del catálogo por el promotor:** el dominio está, el flujo de administración no.

## Logros de los que respondemos con evidencia

- **Consistencia de principio a fin:** propusimos una idea y un caso de negocio bien conectados, y
  cada entregable fue fiel a lo que planteamos desde el inicio.
- **La app resistió más de lo esperado:** un escenario de fallo diseñado para tumbarla no lo
  logró; tuvimos que subir la intensidad del experimento para forzar la degradación.
- **La inyección de fallos cumplió su propósito:** encontró una debilidad real —el servicio se
  colgaba cuando la base dejaba de responder— que corregimos y reverificamos.
- **Detectamos y corregimos una sobreventa** que solo aparecía con varias confirmaciones
  simultáneas. El diseño la anticipaba, pero solo el código bajo carga la hizo visible.

## Dificultades y cómo las enfrentamos

- **Traducir el negocio a arquitectura.** El reto de fondo. Lo enfrentamos definiendo primero, en
  conjunto, los objetivos y los **atributos de calidad no negociables**, y decidiendo a partir de
  ahí.
- **Las máquinas no soportaban el stack.** Trabajamos en la nube con Codespaces.
- **Un cambio transversal puede romper una prueba en silencio.** El borde de seguridad invalidó un
  experimento; aprendimos a volver a correr toda la campaña tras un cambio así.

## Aprendizajes

**Más allá del código:**

- **Entender el negocio antes de diseñar.** Estudiar cómo opera una tiquetera y hacer el **modelo
  financiero** cambió la forma de diseñar: la arquitectura salió de lo que el negocio debe
  sostener (volumen en el pico, margen por boleta, riesgo de sobreventa), no de preferencias
  técnicas. Modelo financiero y diseño quedaron **articulados**.
- **Los ADR nacen de los atributos de calidad.** Cada decisión de arquitectura surgió de un
  atributo concreto y de lo que aceptábamos sacrificar a cambio. Esa cadena **atributo de calidad
  → decisión (ADR) → mecanismo en el código** es la que nos deja defender por qué el sistema es
  así y no de la forma más simple.

**Técnicos:**

- Una arquitectura **hexagonal se paga sola bajo fallo**: el estado vive en la base y el dominio
  no conoce la infraestructura.
- **Idempotencia y transacciones no son opcionales** en venta de alta demanda.
- Una **métrica solo sirve si de verdad reacciona**; una alerta sobre una señal que nunca cambia
  da falsa confianza.
- Mantener la **documentación al día** con el código es parte de la calidad, no un extra.

**El más transversal:** un modelo ambicioso es una **guía, no una lista de obligaciones
inmediatas**. Implementar es priorizar con criterio, no rebajar el diseño.

## Mejoras que reconocemos

**A partir de la retroalimentación recibida:**

- **Proyección poco realista (feedback previo):** aprendimos a ser más conservadores y a sustentar
  cifras y supuestos con datos, sin sobrevender lo logrado.
- **Observación de implementación (feedback previo):** nos enfocamos en un núcleo funcional,
  probado y coherente con el diseño, en vez de abarcar cada componente; la brecha entre diseño y
  código quedó documentada, no escondida.

**Identificadas por nosotros:**

- Completar el disyuntor (circuit breaker) de la pasarela.
- Habilitar la gestión del catálogo por el promotor.
- Desplegar en un clúster real para demostrar el autoescalado, no solo declararlo.
- Avanzar en rotación de llaves y pruebas de seguridad automatizadas.

## Cierre

Estamos conformes con el resultado y, sobre todo, con lo aprendido: entendimos un sector desde el
negocio y las finanzas, propusimos y defendimos una arquitectura derivada de atributos de calidad,
y la llevamos a código siendo honestos sobre su alcance. **Lo que funciona, funciona de verdad y
está probado; lo que no incluimos, está dicho y justificado.**
