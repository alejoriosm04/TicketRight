# Autoevaluación del equipo — Entrega 3

> Reflexión crítica del equipo sobre el resultado, los aprendizajes y las oportunidades de
> mejora. Responde a lo que valora el criterio 5 de la [rúbrica](rubrica.md#5-autoevaluación-valor-adicional--10):
> **análisis honesto y fundamentado**, **logros / dificultades / mejoras**, **propuestas
> concretas de evolución** y **coherencia con la evidencia del proyecto**. Aplica el marco de
> [documentación y deuda técnica](../../curso/clase-05-06.md#diapositiva-30--proyecto-integrador-documentación-y-deuda-técnica)
> visto en clase 5-6: la deuda técnica no es mala, lo importante es **reconocerla, medirla y
> gestionarla**.

## En una frase

Sentimos que la implementación quedó **muy compatible con lo que pensamos y modelamos**. La
arquitectura que planteamos nos parece un muy buen modelo; a la hora de implementar aprendimos
que **menos es más**, y que ser consciente del alcance, del tiempo y de la curva de aprendizaje
del equipo es parte del diseño, no una excusa. No nos volvimos idealistas con todo lo que nos
hubiera gustado tener: fuimos realistas con lo que podíamos construir bien y hasta dónde.

## 1. Qué nos propusimos y qué entregamos

Nos propusimos **explorar un caso de negocio que nos llamaba mucho la atención**: las
tiqueteras. Queríamos entender de verdad cómo funciona esto por detrás —la venta de boletas de
alta demanda— y todo lo que involucra a nivel de tecnología y de negocio.

Terminamos yendo más allá de "entender": propusimos una **arquitectura original** que toma las
problemáticas reales del sector (avalanchas de tráfico, sobreventa, reventa, dinero que se
cobra sin entregar la boleta) y las resuelve con decisiones justificadas. Comprendimos cómo
operan estas empresas a nivel técnico y logramos **abarcar casos interesantes de volumetría y
de pruebas** —incluido inyección de fallos— sobre una aplicación que funciona de punta a punta.

Concretamente entregamos: la aplicación con el recorrido completo **admisión → reserva → pago →
emisión** contra PostgreSQL, Redis y Kafka reales; una plataforma web que hace visible ese
recorrido; las **14 reglas de negocio** cubiertas por los **21 casos de prueba**;
observabilidad con las métricas del diseño y **15 alertas**; y **cuatro experimentos de fallos**
ejecutados y aprobados.

## 2. Logros de los que respondemos con evidencia

- **Consistencia de principio a fin.** Todas las entregas quedaron enlazadas: propusimos una
  idea y un caso de negocio bien conectados, y cada entregable fue **fiel a lo que nos
  propusimos desde el inicio**. Cada elemento cumplió su propósito para hacer evolucionar un
  producto cada vez mejor, sin contradecir lo anterior. Esa trazabilidad idea → arquitectura →
  código → evidencia es lo que sostiene el criterio de coherencia.
- **La aplicación resistió más de lo que esperábamos.** Uno de los escenarios de caos que
  diseñamos para tumbar la app **no la tumbó**: tuvimos que **subir la intensidad del chaos**
  para forzar la degradación. Que el sistema aguantara el escenario original es, en sí mismo, la
  mejor evidencia de que las decisiones de resiliencia funcionaron.
- **El dominio quedó fiel al modelo.** Las 12 raíces de agregado tienen código y las reglas
  viven como métodos de los agregados; la frontera de `Boleta` (AD-008) se respeta.
- **La inyección de fallos cumplió su propósito real.** IF-03 (PostgreSQL congelado) **encontró
  una debilidad de verdad** —el servicio se colgaba sin timeout de cliente— y la corregimos y
  reverificamos. Ese ciclo romper → aprender → corregir → volver a probar es el corazón del
  criterio 3.
- **Encontramos y corregimos una sobreventa.** Con cinco confirmaciones simultáneas, un pago de
  una boleta llegó a emitir siete: faltaba una unidad de trabajo transaccional. La métrica de
  sobreventa además siempre valía 0 (falsa confianza). Corregimos ambas cosas. Es la evidencia
  más honesta de que las pruebas y el caos sirvieron para algo, no para adornar.

## 3. Dificultades y cómo las enfrentamos

- **Traducir problemáticas de negocio a decisiones de arquitectura.** El reto de fondo fue
  entender cómo cada problema real de una tiquetera —a nivel de infraestructura y de
  experiencia— se resuelve con la arquitectura y con nuestras definiciones. Lo enfrentamos
  fijando primero **objetivos, decisiones en conjunto (ADR) y atributos de calidad no
  negociables** para nuestro caso; eso nos dio un criterio estable para decidir qué construir y
  qué no.
- **La máquina local no soportó el stack.** Docker/WSL colapsaba con Kafka + observabilidad. Lo
  resolvimos moviéndonos a **GitHub Codespaces** con un devcontainer; el costo fue que parte de
  la campaña de fallos corrió sin Grafana visible.
- **Un cambio transversal rompió una prueba en silencio.** Al añadir el borde de seguridad, el
  experimento IF-05 pasó a dar 0/8 incluso en la línea base (un solo fan se veía como bot). Lo
  detectamos al repetir la campaña. Aprendizaje: un cambio transversal puede invalidar pruebas
  que nadie volvió a correr.
- **Coherencia entre lo escrito y lo hecho.** El `ESTADO.md` llegó a decir «sin empezar el
  código» cuando ya había varios incrementos. Hicimos una **auditoría de coherencia**
  ([`coherencia-implementacion.md`](coherencia-implementacion.md)) y sincronizamos la
  documentación con el estado real, tal como pide la clase 5-6.

## 4. Balance honesto: lo positivo y lo mejorable

Presentamos las dos caras, porque una autoevaluación creíble no oculta lo segundo.

| Lo que estuvo bien | Lo que se pudo hacer mejor |
|---|---|
| El planteamiento arquitectónico: un modelo sólido, con atributos de calidad y ADR que guiaron cada decisión. | La implementación **no usa todos los patrones** que el modelo insinúa; no necesariamente hay de todo (p. ej., el circuit breaker quedó parcial). |
| El recorrido crítico y sus reglas quedaron probados y resistieron el caos. | Algunas piezas podrían implementarse mejor o más completas (gestión del catálogo, proyecciones reconstruibles). |
| Coherencia entre entregas y trazabilidad decisión → evidencia. | Faltó cerrar evidencias visuales (video, capturas de Grafana y de los fallos) por depender del stack en la nube. |
| Fuimos realistas con el alcance: entregamos lo que podíamos sostener con calidad. | La ambición del diseño supera lo implementado; hay que ser explícitos sobre esa brecha (y lo somos). |

La lección de fondo: **la arquitectura ideal y la implementación viable no son la misma cosa**.
Un buen modelo puede pedir más patrones y más infraestructura de los que tiene sentido
construir en el tiempo y con la curva de aprendizaje de un equipo de curso. Reconocerlo —y
elegir a conciencia qué sí y qué no— es aplicar el criterio de ingeniería, no rebajarlo.

## 5. Qué prometimos en el modelamiento y qué implementamos

Esta es la sección que sostiene la defensa: para **cada componente y patrón que propusimos en
la [arquitectura de referencia](../02-modelamiento/arquitectura-de-referencia.md) y en los
ADR**, decimos con claridad si está **implementado**, si está como **homólogo local
equivalente** (mismo patrón, tecnología distinta por ser un piloto) o si **no está**, y por
qué. Si nos preguntan por algo que dijimos que tendríamos, aquí está la respuesta. El mapeo
técnico detallado vive en [`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md) y
[`coherencia-implementacion.md`](coherencia-implementacion.md); esto es su lectura para exponer.

**Convención:** ✅ implementado y funcionando · 🟳 homólogo local equivalente (piloto) ·
⚪ no incluido (con justificación).

### Estilo y patrones de arquitectura

| Lo que propusimos (diseño) | Estado | Cómo quedó / por qué |
|---|---|---|
| Núcleo transaccional en PostgreSQL, autoridad del aforo (AD-003) | ✅ | Reserva/venta con transacción y bloqueo de fila; una `UnidadDeTrabajo` protege R1/R2. |
| SAGA orquestada de compra (AD-002) | ✅ | `OrquestadorDeCompra` con los 5 pasos y sus caminos de error. |
| Event-Driven con bus durable + outbox + DLQ (AD-002) | ✅ | Outbox transaccional → relay → Kafka → consumidor idempotente → DLQ. |
| CQRS (lecturas separadas de la escritura) | ✅ | Catálogo y disponibilidad como lectura; comando en PostgreSQL. |
| Space-Based: sala de espera en grilla en memoria (AD-006) | ✅ | Fila en **Redis** con llaves `fila:{evento}:{turno}`, admisión por lotes. |
| Back pressure por perfil operativo (AD-006) | ✅ | `GestorDePerfiles` (cotidiano/pico/…) regula la tasa de admisión. |
| Idempotencia (webhook y reintentos) | ✅ | `Pago.registrarConfirmacion` no repite efecto; probado (UT-09, IF-01). |
| **Circuit breaker** alrededor de la pasarela | ⚪/parcial | Hay timeouts + reintentos acotados + compensación; **falta el disyuntor con estado abierto/semiabierto**. Deuda declarada. |
| Autoescalado por lag de Kafka (KEDA) | 🟳 | `ScaledObject` de KEDA **declarado** en `deploy/k8s`; no ejecutado en clúster (piloto single-node). |

### Contextos y dominio

| Lo que propusimos | Estado | Cómo quedó / por qué |
|---|---|---|
| Los 4 contextos acotados + shared-kernel, hexagonal | ✅ | 5 paquetes; el dominio no conoce infraestructura; un contexto no importa a otro. |
| 12 raíces de agregado del modelo | ✅ | Las 12 tienen código (incluye `Evento`/`Recinto`/`Promotor` en `event-catalog`). |
| 14 reglas de negocio (R1–R14) | ✅ | Implementadas y cubiertas por los 21 casos de prueba. |
| Frontera `Boleta` por el puerto `EmisorDeBoletas` (AD-008) | ✅ | `Boleta` en `entitlements`; `sales` nunca la importa. |
| `Localidad`/`Aforo`/`Silla` (el modelo las pone en «Oferta de eventos») | ✅ ubicación distinta | Viven en el contexto de **venta** por AD-003: son la autoridad transaccional del aforo, no un dato de catálogo. Justificado. |
| **Gestión del catálogo** (alta de eventos/recintos por el promotor) | ⚪ | El dominio existe; el **flujo de administración** no. El catálogo se consume como lectura. Fuera del escenario de la demo. |
| **Reventa** de boletas (R8, R9) | ⚪ | Modelada en el dominio (`Reventa`, `ReglasReventa`) pero **sin flujo de aplicación**: no era el foco (venta primaria). |
| Contexto Identidad con almacén propio | 🟳 | Datos personales cifrados (AES-256-GCM) y cuentas con rol; se transporta `IdOpaco`. No es un servicio de identidad separado. |

### Borde, seguridad e infraestructura (arquitectura de implementación → piloto)

| Lo que propusimos (AWS / referencia) | Estado | Cómo quedó / por qué |
|---|---|---|
| API Gateway + WAF/Bot Control (borde único, cuotas) | 🟳 | Borde propio: **token bucket por ruta + heurística de bots**; sin ML antibot ni CDN gestionada. |
| Cognito / OIDC (identidad federada) | 🟳 | **JWT firmado (HS256)** de admisión y de sesión; sin proveedor federado. |
| KMS (cifrado de PII) | 🟳 | **AES-256-GCM** con secreto; sin rotación gestionada de llaves. |
| CloudTrail (auditoría) | 🟳 | Tabla de auditoría append-only. |
| S3 + CloudFront (portal estático) | 🟳 | Portal servido con ETag/caché en `/portal`. |
| EventBridge Scheduler (perfiles por ventana) | 🟳 | `GestorDePerfiles` con temporizadores. |
| MSK (Kafka), ElastiCache (Redis), EKS (Kubernetes) | 🟳 | Kafka, Redis y minikube/compose reales; sin Multi-AZ ni gestión de nube. |
| Aurora Multi-AZ + RDS Proxy + réplicas de lectura | ⚪ | PostgreSQL 18 en un nodo; sin alta disponibilidad de nube (piloto). |
| **OpenSearch** (búsqueda del catálogo) | ⚪ | No implementado; la búsqueda se resuelve sobre PostgreSQL. Aplicaría al crecer el catálogo. |
| Terraform / Argo CD (IaC + GitOps) | ⚪ | Despliegue con `kubectl`/`compose` versionado; la automatización completa queda documentada, no ejecutada. |
| Observabilidad (OTel + Prometheus + Tempo + Loki + Grafana) | ✅ | Implementada e instrumentada, con 15 alertas ligadas a atributos. |

**Cómo lo defendemos en una frase:** todo lo que es **patrón o garantía de negocio está
implementado y probado**; lo que aparece como 🟳 es el **mismo patrón con una tecnología de
piloto** (y así está declarado en la arquitectura de implementación, que explícitamente separa
diseño de despliegue); y lo ⚪ es **alcance que acotamos a conciencia**, no algo que se nos
olvidó. Ninguna garantía verificada en las pruebas o en la bitácora de fallos depende de un
componente marcado 🟳 o ⚪.

## 6. Deuda técnica deliberada (lo que decidimos NO hacer)

Siguiendo a Cunningham y la clase 5-6: la deuda técnica **no es mala si se reconoce y se
gestiona**. La nuestra es consciente y está justificada:

- **Reventa de boletería, fuera de foco.** El modelo la contempla (R8, R9), pero no era el foco
  del caso ni del recorrido de la demo; la dejamos a nivel de dominio, sin flujo de aplicación.
  El valor estaba en la **venta primaria de alta demanda**, no en el mercado secundario.
- **No llevamos la solución a una nube más robusta.** Por tiempo y por capacidades del equipo,
  corrimos el piloto en local/Codespaces con **homólogos equivalentes** (JWT firmado en vez de
  Cognito, AES-256-GCM en vez de KMS, Kafka/Redis en contenedor en vez de MSK/ElastiCache,
  minikube/KEDA en vez de EKS) en lugar de desplegar Multi-AZ en AWS. Está documentado en
  [`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md); lo asumimos como deuda, no como
  omisión.
- **Circuit breaker parcial.** Hay reintentos acotados, timeouts y compensación; falta el
  disyuntor con estado abierto/semiabierto. Suficiente para la demo.
- **Gestión del catálogo (contexto «Oferta de eventos»).** Implementamos su dominio
  (`Evento`, `Recinto`, `Promotor`) para no dejar raíces del modelo sin código, pero el alta y
  la edición por el promotor no están cableadas; el catálogo se consume como lectura (CQRS).
- **IF-04 (pérdida de la proyección de Redis)** quedó como experimento de respaldo; la rúbrica
  pide cuatro de tipos distintos y esos están ejecutados.

## 7. Aprendizajes (aplicando los conceptos de la materia)

- **Una arquitectura hexagonal se paga sola bajo caos.** Reiniciar el proceso (IF-02) sin
  perder estado, o rechazar de forma acotada con la base caída (IF-03), fue posible porque el
  estado de negocio vive en PostgreSQL y el dominio no conoce infraestructura.
- **Idempotencia y transacciones no son opcionales en alta demanda.** Las dos fallas más serias
  (webhook repetido y sobreventa) fueron de concurrencia; el diseño ya las anticipaba, pero solo
  el **código bajo carga** las hizo visibles. Es la diferencia entre diseñar y demostrar.
- **La observabilidad tiene que medir cosas ciertas.** Una métrica de sobreventa que siempre
  vale 0 es peor que no tenerla: da falsa confianza. Aprendimos a **validar que la métrica
  reacciona** antes de confiar en su alerta (idea de *fitness function*: el umbral solo vale si
  la señal es real).
- **La documentación desincronizada cuesta puntos y confianza.** Mantener `ESTADO.md` fiel al
  repositorio es parte de la calidad, no un extra —exactamente el mensaje de la clase 5-6:
  *menos suposiciones, más claridad*.
- **Menos es más.** El aprendizaje más transversal: acotar el alcance a conciencia produjo una
  entrega más sólida que intentar cubrirlo todo a medias.

## 8. Propuestas concretas de evolución

1. **Cerrar el circuit breaker** alrededor de la pasarela (umbral de apertura + medio-abierto) y
   exponer su estado como métrica.
2. **Completar «Oferta de eventos»**: alta de eventos por promotor con su convenio, para que el
   catálogo deje de ser solo lectura.
3. **Ejecutar IF-04** (pérdida de la proyección de Redis) y **capturar Grafana** durante los
   cuatro fallos para el video.
4. **Corridas de volumetría con k6** (nominal, pico, estrés, resistencia) contra los umbrales de
   la [volumetría](../02-modelamiento/volumetria.md).
5. **Desplegar en un clúster real** (minikube/k3d con KEDA) para demostrar el autoescalado por
   lag, no solo declararlo.
6. **Rotación de llaves y pruebas de seguridad automatizadas**, la deuda que el propio
   [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) reconoce.
7. **Incorporar más patrones donde aporten** (no por completitud): el disyuntor completo, y
   proyecciones reconstruibles desde el registro durable.

## 9. Cierre

Lo que funciona, funciona de verdad y está probado; lo que falta, está **dicho**. Estamos
conformes con el resultado y, sobre todo, con lo aprendido: entendimos un sector, propusimos y
defendimos una arquitectura, y la llevamos a código siendo honestos sobre su alcance. El mayor
riesgo restante no es el código —el recorrido crítico y sus reglas están sólidos— sino las
**evidencias visuales**, que dependen de correr el stack completo en Codespaces. Si tuviéramos
más tiempo, lo invertiríamos en el despliegue en clúster y en la volumetría, no en reescribir
dominio.
