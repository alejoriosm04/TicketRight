# Autoevaluación del equipo — Entrega 3

> Marco: un **atributo de calidad** (requisito no funcional) expresa una exigencia medible sin
> decir cómo lograrla; una **táctica** es el medio para alcanzarla (por ejemplo circuit breaker,
> caché o back pressure). En todo el proyecto seguimos la regla del curso: **cada decisión de
> arquitectura responde a un atributo de calidad y declara qué se cede a cambio**. Esta
> autoevaluación está redactada en esos términos.

## Cómo entendemos el resultado

La implementación quedó **muy compatible con lo que modelamos**, y no fue casualidad: entendimos
que **modelamiento e implementación tienen propósitos distintos**.

- **Modelamiento** → definir los **atributos de calidad (RNF)** y la arquitectura que los
  satisface. Es el **norte**.
- **Implementación** → decidir, con criterio de ingeniería, **qué tácticas construir primero y
  hasta dónde**, sin sacrificar los atributos que el negocio no negocia.

Nuestros **atributos no negociables** —y las garantías de negocio que representan— fueron:

1. **A-2 · Integridad del aforo** → nunca vender por encima del aforo.
2. **A-1 · Confiabilidad pago–boleta** → nunca cobrar sin entregar la boleta (o compensar).
3. **A-3 · Unicidad de titularidad** → una boleta, un titular válido a la vez.

> Priorizamos cubrir de verdad estos RNF y probarlos, antes que dejar muchas tácticas a medias
> por querer tenerlo todo.

## Qué nos propusimos y qué entregamos

- **Nos propusimos** entender el negocio de las tiqueteras y, a partir de sus exigencias,
  **derivar los atributos de calidad** que la arquitectura debía sostener.
- **Terminamos yendo más allá:** una arquitectura original cuyos estilos y tácticas responden
  cada uno a un atributo (Space-Based para A-9/A-10 en el pico, SAGA + outbox para A-1, núcleo
  transaccional para A-2/A-3).
- **Entregamos:** la aplicación con el recorrido completo de compra (fila → reserva → pago →
  emisión) sobre PostgreSQL, Redis y Kafka; la plataforma web; las reglas de negocio con pruebas
  unitarias; observabilidad con métricas, tableros y alertas por atributo; y cuatro experimentos
  de inyección de fallos.

## Implementado vs. no implementado, por atributo de calidad

Somos explícitos aquí para sostener la **coherencia**: qué RNF quedó cubierto, con qué táctica, y
qué quedó parcial o fuera de alcance.

### ✅ Atributos cubiertos y verificados

| Atributo (RNF) | Táctica implementada | Evidencia |
|---|---|---|
| **A-2 · Integridad del aforo** | Núcleo transaccional en PostgreSQL como única autoridad; reserva/venta con transacción y bloqueo de fila (unidad de trabajo) | Prueba de concurrencia y experimentos de fallo: cero sobreventa |
| **A-1 · Confiabilidad pago–boleta** | SAGA orquestada + outbox transaccional + idempotencia del pago; discrepancia y conciliación si la cadena no cierra | Webhook repetido y caída entre cobro y emisión: una sola boleta o compensación |
| **A-3 · Unicidad de titularidad** | Emisión de boleta con titular único; transiciones controladas | Prueba unitaria de transferencias concurrentes |
| **A-4 · Equidad de la fila** | Sala de espera en Redis con política de orden y turno reconstruible | Turnos conformes a la política publicada |
| **A-5 · Recuperabilidad del inventario** | Worker de expiración idempotente que libera reservas vencidas | Reserva vencida se libera; nunca toca un pago confirmado |
| **A-6 · Resiliencia y degradación controlada** | Back pressure por perfil operativo; timeouts acotados; reintentos y compensación | Bajo saturación de CPU las compras en curso se completan (degrada, no cae) |
| **A-8 · Trazabilidad** | Trazas correlacionadas por identificador de recorrido; eventos durables | Traza de una compra de punta a punta |
| **A-10 · Rendimiento** | CQRS (lecturas separadas de la escritura) + válvula de admisión que acota lo que llega al núcleo | Latencia de reserva medida bajo carga |
| **A-12 · Modificabilidad** | Arquitectura hexagonal por contextos; la política vive en el dominio y el orquestador solo depende de puertos | Cambiar una política no toca inventario ni pago |

### 🟳 Atributos cubiertos con equivalente de piloto

El diseño de implementación separa la topología de nube del piloto que corre el equipo. La
táctica es la misma; cambia la tecnología. **El atributo se sostiene en la demo, con menor
robustez que en producción.**

| Atributo (RNF) | En el diseño (nube) | En el piloto |
|---|---|---|
| **A-11 · Seguridad y privacidad** | Cognito (identidad), KMS (llaves), API Gateway + WAF | JWT firmado, cifrado AES-256-GCM, borde propio con control de tasa y detección de bots |
| **A-9 · Disponibilidad** | EKS multi-zona, MSK y ElastiCache gestionados | Kafka y Redis en contenedor, minikube; sin multi-zona |
| **A-6/A-9 · Escalado elástico** | KEDA en clúster escalando por demanda | KEDA **declarado** en los manifiestos, no ejecutado en clúster |

### ⚪ Atributos con cobertura parcial o fuera de alcance (a conciencia)

Ninguno de estos era un atributo no negociable; los acotamos por tiempo, riesgo y curva de
aprendizaje, y lo dejamos documentado.

| Tema | Atributo afectado | Decisión y estado |
|---|---|---|
| **Circuit breaker** de la pasarela | A-6 · Resiliencia | **Parcial:** hay timeouts + reintentos acotados + compensación; falta el disyuntor con estado abierto/medio-abierto |
| **Alta disponibilidad de nube** (multi-zona, réplicas, IaC) | A-9 · Disponibilidad | **Fuera de alcance** del piloto; el atributo queda demostrado localmente, no con la robustez de producción |
| **Buscador dedicado (OpenSearch)** | A-10 · Rendimiento de lectura | **No implementado;** la búsqueda se resuelve sobre PostgreSQL (suficiente para el volumen de la demo) |
| **Reventa de boletas** | Funcionalidad (no un RNF crítico) | **Modelada sin flujo de aplicación;** el foco fue la venta primaria |
| **Gestión del catálogo por el promotor** | Funcionalidad | **Dominio implementado, sin flujo de administración;** el catálogo se consume como lectura |
| **A-7 · Eficiencia de costos** | A-7 | **Instrumentado** (métrica de costo por boleta), pero **sin corridas de carga** que confirmen el umbral en la nube |

## Logros de los que respondemos con evidencia

- **Consistencia entre entregas:** el caso de negocio, los atributos de calidad, los ADR y el
  código forman una sola cadena; cada entregable fue fiel al anterior.
- **La app resistió más de lo esperado:** un experimento de fallo diseñado para tumbarla no lo
  logró (A-6 se sostuvo); tuvimos que subir la intensidad para forzar la degradación.
- **La inyección de fallos cumplió su propósito:** halló una debilidad real de **A-6** —el
  servicio se colgaba cuando la base dejaba de responder— que corregimos con timeouts acotados y
  reverificamos.
- **Detectamos y corregimos una violación de A-2:** una sobreventa que solo aparecía con varias
  confirmaciones simultáneas. El diseño la anticipaba; solo el código bajo carga la hizo visible.

## Dificultades y cómo las enfrentamos

- **Traducir el negocio a atributos de calidad y estos a tácticas.** El reto de fondo. Lo
  enfrentamos fijando primero, en conjunto, los **atributos no negociables** y decidiendo cada
  táctica a partir de ellos (la regla del curso: RNF → decisión → qué se cede).
- **Las máquinas no soportaban el stack.** Trabajamos en la nube con Codespaces.
- **Un cambio transversal puede romper una prueba en silencio.** El borde de seguridad (A-11)
  invalidó un experimento de A-6; aprendimos a re-ejecutar toda la campaña tras un cambio así.

## Aprendizajes

**Más allá del código:**

- **Los atributos de calidad se derivan del negocio.** Estudiar cómo opera una tiquetera y hacer
  el **modelo financiero** fue lo que nos dio los RNF y sus umbrales: el volumen del pico define
  A-9/A-10, el margen por boleta define A-7, el riesgo de sobreventa define A-2. El modelo
  financiero y la arquitectura quedaron **articulados**: la capacidad y el escalado responden a
  números del negocio, no a preferencias técnicas.
- **Los ADR nacen de los atributos de calidad.** Cada decisión que registramos partió de un
  atributo concreto y de lo que aceptábamos ceder (punto de trade-off). Esa cadena **atributo →
  decisión (ADR) → táctica en el código** es la que nos permite defender por qué el sistema es
  así y no en su forma más simple.

**Técnicos:**

- La **arquitectura hexagonal** sostiene A-6 bajo fallo: el estado vive en la base y el dominio no
  conoce la infraestructura, por eso el proceso se reinicia sin perder consistencia.
- **Idempotencia y transacciones** no son opcionales para A-1 y A-2 en venta de alta demanda.
- Una **métrica solo sirve si reacciona**: una alerta sobre una señal que nunca cambia da falsa
  confianza sobre un atributo.
- Mantener la **documentación al día** con el código es parte de la calidad (modificabilidad,
  A-12), no un extra.

**El más transversal:** un modelo ambicioso es una **guía, no una lista de obligaciones
inmediatas**. Implementar es priorizar tácticas por atributo, no rebajar el diseño.

## Mejoras que reconocemos

**A partir de la retroalimentación recibida:**

- **Proyección poco realista (feedback previo):** aprendimos a ser conservadores y a sustentar
  cifras y supuestos con datos, sin sobrevender lo logrado —especialmente en los umbrales de A-7
  y A-9.
- **Observación de implementación (feedback previo):** nos enfocamos en un núcleo funcional y
  probado, coherente con el diseño, en vez de abarcar cada componente; la brecha entre diseño y
  código quedó documentada por atributo, no escondida.

**Identificadas por nosotros:**

- Completar el **circuit breaker** de la pasarela (cierra A-6).
- **Corridas de carga** (nominal, pico, estrés, resistencia) para confirmar A-7, A-9 y A-10 con
  números, no solo con instrumentación.
- **Desplegar en un clúster real** para demostrar el escalado elástico (A-6/A-9) en vez de
  declararlo.
- **Rotación de llaves y pruebas de seguridad automatizadas** para cerrar A-11.
- Habilitar la **gestión del catálogo** por el promotor.

## Cierre

Entendimos un sector desde el negocio y las finanzas, **derivamos de ahí los atributos de
calidad**, tomamos decisiones de arquitectura justificadas en cada atributo y las llevamos a
código siendo honestos sobre su alcance. **Los atributos no negociables (A-1, A-2, A-3) están
cubiertos y probados; el resto está cubierto, parcial o acotado, pero siempre dicho y
justificado por atributo.**
