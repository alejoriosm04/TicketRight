# Autoevaluación del equipo — Entrega 3

> Marco: un **atributo de calidad** (requisito no funcional) expresa una exigencia medible sin
> decir cómo lograrla; una **táctica** es el medio para alcanzarla (por ejemplo circuit breaker,
> back pressure o caché). En todo el proyecto seguimos la regla del curso: **cada decisión de
> arquitectura responde a un atributo de calidad y declara qué se cede a cambio.**

## Cómo entendemos el resultado

La implementación quedó **muy compatible con lo que modelamos**, y no fue casualidad: entendimos
que **modelamiento e implementación tienen propósitos distintos**.

- **Modelamiento** → definir los atributos de calidad (los requisitos no funcionales) y la
  arquitectura que los satisface. Es el **norte**.
- **Implementación** → decidir, con criterio de ingeniería, **qué tácticas construir primero y
  hasta dónde**, sin sacrificar los atributos que el negocio no negocia.

Nuestras **garantías no negociables** fueron: nunca vender por encima del aforo (**integridad del
aforo**), nunca cobrar sin entregar la boleta o compensar (**confiabilidad dinero–boleta**) y una
boleta con un solo titular válido a la vez (**unicidad de titularidad**). Priorizamos cubrirlas de
verdad y probarlas, antes que dejar muchas tácticas a medias por querer tenerlo todo.

## Qué construimos y qué funciona

- **El flujo principal de compra de punta a punta** (el del diagrama de secuencia de la
  Entrega 2): fila → reserva → pago → emisión, más la compensación cuando un pago se rechaza.
  Corre contra PostgreSQL, Redis y Kafka reales.
- **SAGA orquestada con eventos durables:** outbox transaccional, Kafka particionado por venta,
  consumidor idempotente, cola de no procesables (DLQ) y webhooks idempotentes.
- **PostgreSQL como autoridad del aforo:** transacciones con bloqueo de fila (`FOR UPDATE`), un
  worker que libera las reservas vencidas, y la fila que solo autoriza a intentar reservar.
- **Arquitectura hexagonal por contexto acotado**, monorepo TypeScript, pruebas con Vitest y CI
  en GitHub Actions.
- **La boleta vive en su propio contexto** (derecho de asistencia) y la emisión cruza por el
  puerto `EmisorDeBoletas`.
- **Plan de pruebas:** los 21 casos pasan (58 pruebas unitarias más 5 de integración contra
  PostgreSQL real, 63 en total), con cobertura en CI.
- **Modelo de dominio:** las 12 raíces de agregado tienen código —11 en el dominio e `Identidad`
  en su almacén aislado, como pide el ADR de datos personales— y las reglas de negocio R1–R14
  están implementadas.
- **Observabilidad:** el stack completo (OpenTelemetry, Alloy, Prometheus, Tempo, Loki, Grafana),
  las 14 métricas diseñadas y 15 alertas.
- **Inyección de fallos:** 4 de los 5 experimentos ejecutados y aprobados (pasarela tardía y
  repetida, reinicio del coordinador, PostgreSQL no disponible, saturación de CPU).
- **Carga:** los 4 escenarios de volumetría con k6 (nominal, pico, estrés, resistencia)
  ejecutados en local y en Codespaces, aunque a escala reducida (ver «Parcial» más abajo).
- **Prototipo:** además de las 16 pantallas estáticas, una plataforma web funcional en `/app`
  conectada a las APIs.
- **Despliegue:** minikube con autoescalado KEDA en Codespaces.
- **Desglose de precio:** valor nominal + cargo por servicio + contribución parafiscal, en el
  dominio.

## Hecho con equivalente local, o solo en parte

Aquí hay dos casos distintos: **(a)** piezas que están completas pero con una tecnología de
piloto en lugar de la de nube —la táctica es la misma, cambia la tecnología, el atributo se
sostiene con menor robustez que en producción—; y **(b)** piezas que quedaron a medias.

**(a) Piezas de AWS reemplazadas por equivalentes locales:**

| En el diseño (nube) | En el piloto |
|---|---|
| EKS / Fargate | minikube |
| Aurora | PostgreSQL (sin Multi-AZ ni RDS Proxy) |
| MSK | Kafka |
| ElastiCache | Redis |
| API Gateway + WAF/Bot Control | Borde propio (control de tasa + heurística, sin ML) |
| Cognito | JWT propio con cuentas de fan y roles |
| KMS | Cifrado AES-256-GCM, sin rotación gestionada de llaves |
| CloudTrail | Tabla de auditoría de solo anexado |
| Secrets Manager | Secret de Kubernetes |
| S3 + CloudFront | Portal estático en `/portal` |

**(b) Parcial:**

- **Precalentamiento programado:** el gestor de perfiles existe y `programarVentana` está escrito,
  pero **nada lo invoca**, así que no hay precalentamiento automático antes de la venta.
- **Reventa y liquidación al promotor:** existen solo en el dominio (`Reventa`, `ReglasDeReventa`,
  `Liquidacion`), con pruebas pero **sin endpoint ni pantalla**. Revender y devolver eran los
  casos de uso secundarios de la Entrega 2.
- **Oferta de eventos:** el dominio está construido (`Evento`, `Recinto`, `Promotor`, `Convenio`),
  pero el catálogo es **de solo lectura**; un promotor no puede crear eventos todavía.
- **Tableros:** el diseño pedía 3 tableros separados (salud de la venta, negocio y promotor,
  diagnóstico técnico). Hay **1 tablero con 5 secciones**.
- **Volumetría:** corrió a **escala reducida** (0,05 en local), no con los 30.000 fans en 60 s
  completos. No se buscó el multiplicador de punto de quiebre.
- **Retención de datos:** el diseño pide 24 meses (para trazabilidad). En local, Loki guarda logs
  **7 días** y Tempo guarda trazas **1 hora**.

## No hecho

- Nada real sobre AWS: Multi-AZ, VPC y subredes, Karpenter, una segunda región.
- Terraform y Argo CD: el despliegue usa `kubectl` y `helm` con manifiestos versionados.
- OpenSearch para la búsqueda del catálogo.
- **Circuit breaker completo:** hay reintentos, timeouts y compensación, pero **no** los estados
  abierto/medio-abierto.
- El quinto experimento de fallos (pérdida de la proyección de Redis): quedó como experimento de
  respaldo.
- Rotación de llaves y pruebas de seguridad automatizadas (deudas que el propio ADR de seguridad
  reconoce).
- Los flujos HTTP de devolución/retracto y de reventa.

## Atributos de calidad de la Entrega 1: cuáles tienen evidencia

**Con evidencia:**

- **Confiabilidad dinero↔boleta:** el experimento de pasarela repetida y las métricas de
  discrepancia.
- **Integridad del aforo:** cero sobreventa bajo carga y en las pruebas de concurrencia.
- **Unicidad de titularidad:** pruebas de dominio.
- **Liberación de reservas:** el worker de expiración.
- **Degradación controlada:** el experimento de saturación de CPU.
- **Rendimiento:** k6 a escala reducida.

**Parcial:**

- **Equidad de la fila:** la fila funciona, pero no se muestra una reconstrucción completa del
  orden de turnos.
- **Trazabilidad:** las trazas existen, pero no la retención de 24 meses.
- **Seguridad:** hay JWT y cifrado, pero sin pruebas de seguridad.
- **Modificabilidad:** la sostiene la estructura hexagonal, pero no está demostrada.

**No medidos:**

- **Costo por boleta:** requiere costos reales de infraestructura.
- **Disponibilidad del 99,9%.**

## Caso de negocio de la Entrega 1: qué queda sin verificar

- Los OKR, como la conversión en el pico y el costo por boleta.
- Los 12 umbrales, que nunca se ratificaron formalmente.
- La disponibilidad del nombre y la marca «TicketRight».

## Logros de los que respondemos con evidencia

- **Consistencia entre entregas:** el caso de negocio, los atributos de calidad, las decisiones de
  arquitectura (ADR) y el código forman una sola cadena; cada entregable fue fiel al anterior.
- **La app resistió más de lo esperado:** un experimento de fallo diseñado para tumbarla no lo
  logró; tuvimos que subir la intensidad para forzar la degradación.
- **La inyección de fallos cumplió su propósito:** halló una debilidad real —el servicio se
  colgaba cuando la base dejaba de responder— que corregimos con timeouts acotados y reverificamos.
- **Detectamos y corregimos una sobreventa** que solo aparecía con varias confirmaciones
  simultáneas. El diseño la anticipaba; solo el código bajo carga la hizo visible.

## Dificultades y cómo las enfrentamos

- **Traducir el negocio a atributos de calidad y estos a tácticas.** El reto de fondo. Lo
  enfrentamos fijando primero, en conjunto, los atributos no negociables y decidiendo cada táctica
  a partir de ellos.
- **Las máquinas no soportaban el stack.** Trabajamos en la nube con Codespaces.
- **Un cambio transversal puede romper una prueba en silencio.** El borde de seguridad invalidó un
  experimento de resiliencia; aprendimos a re-ejecutar toda la campaña tras un cambio así.

## Aprendizajes

**Más allá del código:**

- **Los atributos de calidad se derivan del negocio.** Estudiar cómo opera una tiquetera y hacer
  el **modelo financiero** fue lo que nos dio los requisitos no funcionales y sus umbrales: el
  volumen del pico define disponibilidad y rendimiento, el margen por boleta define la eficiencia
  de costos, el riesgo de sobreventa define la integridad del aforo. El modelo financiero y la
  arquitectura quedaron **articulados**: la capacidad y el escalado responden a números del
  negocio, no a preferencias técnicas.
- **Las decisiones de arquitectura (ADR) nacen de los atributos de calidad.** Cada decisión que
  registramos partió de un atributo concreto y de lo que aceptábamos ceder. Esa cadena
  **atributo → decisión → táctica en el código** es la que nos permite defender por qué el sistema
  es así y no en su forma más simple.

**Técnicos:**

- La **arquitectura hexagonal** sostiene la resiliencia bajo fallo: el estado vive en la base y el
  dominio no conoce la infraestructura, por eso el proceso se reinicia sin perder consistencia.
- **Idempotencia y transacciones** no son opcionales para la confiabilidad y la integridad del
  aforo en venta de alta demanda.
- Una **métrica solo sirve si reacciona**: una alerta sobre una señal que nunca cambia da falsa
  confianza sobre un atributo.
- Mantener la **documentación al día** con el código es parte de la calidad (modificabilidad), no
  un extra.

**El más transversal:** un modelo ambicioso es una **guía, no una lista de obligaciones
inmediatas**. Implementar es priorizar tácticas por atributo, no rebajar el diseño.

## Mejoras que reconocemos

**A partir de la retroalimentación recibida:**

- **Proyección poco realista (feedback previo):** aprendimos a ser conservadores y a sustentar
  cifras y supuestos con datos, sin sobrevender lo logrado —especialmente en el costo por boleta y
  la disponibilidad.
- **Observación de implementación (feedback previo):** nos enfocamos en un núcleo funcional y
  probado, coherente con el diseño, en vez de abarcar cada componente; la brecha entre diseño y
  código quedó documentada, no escondida.

**Identificadas por nosotros:**

- Completar el **circuit breaker** de la pasarela (cierra la resiliencia).
- **Corridas de carga a escala completa** (30.000 fans) para confirmar costo, disponibilidad y
  rendimiento con números, y encontrar el punto de quiebre.
- **Desplegar en un clúster real / nube** para demostrar el escalado elástico en vez de declararlo.
- **Habilitar los flujos que quedaron solo en el dominio:** reventa, devolución/retracto,
  liquidación al promotor y creación de eventos por el promotor.
- **Rotación de llaves y pruebas de seguridad automatizadas.**
- **Cablear el precalentamiento programado** para que la venta arranque con capacidad lista.

## Cierre

Entendimos un sector desde el negocio y las finanzas, **derivamos de ahí los atributos de
calidad**, tomamos decisiones de arquitectura justificadas en cada atributo y las llevamos a
código siendo honestos sobre su alcance. **Las garantías no negociables —dinero↔boleta, aforo y
titularidad— están cubiertas y probadas; el resto está cubierto, parcial o acotado, pero siempre
dicho y justificado.**
