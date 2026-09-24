# Autoevaluación — Entrega 3 (criterio 5, valor adicional +10 %)

> Reflexión crítica del equipo sobre el resultado de la implementación, coherente con la
> evidencia del repositorio. Sigue lo que pide la [rúbrica](rubrica.md#5-autoevaluación-valor-adicional--10):
> logros, dificultades, mejoras y propuestas de evolución. Escrita al cierre de la entrega,
> con la evidencia en la mano; no repite lo obvio ni infla resultados.

## 1. Qué nos propusimos y qué entregamos

La Entrega 3 no rediseña: **implementa** lo que ya definió el modelamiento (Entrega 2) y lo
**demuestra funcionando, observado y bajo fallo**. Contra esa vara, esto es lo que quedó:

- Una **aplicación funcional** de venta de boletas de alta demanda, con el recorrido completo
  admisión → reserva → pago → emisión operando de punta a punta contra PostgreSQL, Redis y
  Kafka reales, más una **plataforma web** (`/app`) que hace visible ese recorrido como un
  producto de ticketera.
- La **SAGA orquestada** del [diagrama de secuencia](../02-modelamiento/diagrama-de-secuencia.md)
  con sus cinco pasos, incluidos los caminos de error (reserva vencida, pasarela lenta/repetida,
  webhook duplicado, emisión que no cierra → discrepancia).
- Las **14 reglas de negocio (R1–R14)** implementadas en el dominio y cubiertas por los
  **21 casos de prueba** del [plan de pruebas](../02-modelamiento/plan-de-pruebas.md), en verde.
- **Observabilidad** con OpenTelemetry + Prometheus + Tempo + Loki + Grafana, el catálogo de
  métricas del diseño (incluidas las 3 de negocio y 3 técnicas de la rúbrica) y **15 alertas**
  ligadas a atributos de calidad.
- **Cuatro experimentos de inyección de fallos** ejecutados y aprobados, de tipos distintos,
  con [bitácora](bitacora-de-fallos.md).

## 2. Logros de los que respondemos con evidencia

- **El dominio es fiel al modelo.** Las 12 raíces de agregado del
  [modelo de dominio](../02-modelamiento/modelo-de-dominio.md) tienen código; las reglas viven
  como métodos de los agregados, no dispersas. La frontera de `Boleta` (AD-008) se respeta:
  `sales` nunca importa `entitlements`, la emisión cruza por el puerto `EmisorDeBoletas`.
- **La inyección de fallos cumplió su propósito real.** IF-03 (PostgreSQL congelado)
  **encontró una debilidad de verdad**: sin timeout de cliente el servicio se colgaba y un
  rechazo del relay de outbox podía tumbar el proceso. Se corrigió (timeouts acotados,
  relay tolerante, red de seguridad `unhandledRejection`) y se **reverificó**. Ese ciclo
  —romper, aprender, corregir, volver a probar— es exactamente lo que evalúa el criterio 3.
- **Encontramos y corregimos una sobreventa.** Al enviar cinco webhooks **a la vez**, un pago
  de una boleta llegó a emitir siete: faltaba una unidad de trabajo transaccional. Se
  introdujo el puerto `UnidadDeTrabajo` y la métrica de sobreventa se pasó a calcular desde las
  tablas (antes valía 0 pasara lo que pasara). Es la evidencia más honesta de que las pruebas y
  el caos sirvieron para algo, no para adornar.
- **Trazabilidad decisión → código → atributo.** Cada patrón y cada homólogo local de AWS está
  mapeado a su ADR y a su atributo de calidad en [`patrones.md`](patrones.md) y
  [`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md).

## 3. Dificultades y cómo las enfrentamos

- **La máquina local no soportó el stack.** Docker/WSL colapsaba con Kafka + observabilidad.
  Lo resolvimos moviendo el trabajo a **GitHub Codespaces** con un devcontainer; el costo fue
  que parte de la campaña de fallos corrió sin Grafana y con la fila en memoria.
- **El borde de seguridad rompió una prueba silenciosamente.** Al añadir el rate-limiting, el
  experimento IF-05 pasó a dar 0/8 incluso en la línea base porque un solo fan era tratado como
  bot. Lo detectamos al repetir la campaña y lo corregimos usando ocho fans distintos. Lección:
  un cambio transversal puede invalidar pruebas que nadie volvió a correr.
- **Fidelidad vs. alcance de un piloto.** Reproducir AWS (Multi-AZ, API Gateway, Cognito, KMS,
  EKS) era inviable en el tiempo y la máquina disponibles. Optamos por **homólogos locales
  equivalentes** (JWT firmado, AES-256-GCM, Kafka, Redis, minikube/KEDA) y lo documentamos en
  vez de simularlo a medias.
- **Coherencia entre lo escrito y lo hecho.** El `ESTADO.md` llegó a decir «sin empezar el
  código» cuando ya había cinco incrementos. Hicimos una auditoría de coherencia
  ([`coherencia-implementacion.md`](coherencia-implementacion.md)) y sincronizamos la
  documentación con el estado real.

## 4. Deuda técnica deliberada (lo que decidimos NO hacer)

La asumimos a conciencia; no es descuido:

- **Contexto «Oferta de eventos» acotado.** Implementamos los agregados `Evento`, `Recinto`,
  `Promotor` (con `Convenio`, `ReglasVenta`, `ReglasReventa`, `Cancelacion`) para no dejar
  raíces del modelo sin código, pero la **gestión** del catálogo (alta por promotor) no está en
  la demo: el catálogo se consume como lectura CQRS. El valor de la entrega está en el camino de
  venta.
- **Circuit breaker completo.** Hay reintentos acotados, timeouts y compensación; falta el
  disyuntor con estados abierto/semiabierto. Suficiente para la demo, deuda para producción.
- **Infraestructura de producción.** Multi-AZ, RDS Proxy, sharding de Redis, OpenSearch,
  Argo CD/Terraform y KEDA en clúster son diseño, no despliegue del piloto.
- **IF-04 (pérdida de la proyección de Redis)** quedó como quinto experimento de respaldo; la
  rúbrica pide cuatro de tipos distintos y esos están ejecutados.
- **Concurrencia real de aforo.** La invariante R1/R2 bajo concurrencia se prueba con un test
  de integración contra PostgreSQL (`skipIf` sin base); en local sin DB no corre, en Codespaces
  sí.

## 5. Aprendizajes

- **Una arquitectura hexagonal se paga sola bajo caos.** Poder reiniciar el proceso (IF-02) sin
  perder estado, o rechazar de forma acotada con la base caída (IF-03), fue posible porque el
  estado de negocio vive en PostgreSQL y el dominio no conoce infraestructura.
- **Idempotencia y transacciones no son opcionales en venta de alta demanda.** Las dos fallas
  más serias (webhook repetido y sobreventa) fueron de concurrencia; el diseño ya las
  anticipaba, pero solo el código bajo carga las hizo visibles.
- **La observabilidad tiene que probar cosas ciertas.** Una métrica de sobreventa que siempre
  vale 0 es peor que no tenerla: da falsa confianza. Aprendimos a validar que la métrica
  reacciona antes de confiar en su alerta.
- **La documentación desincronizada cuesta puntos y confianza.** Mantener `ESTADO.md` fiel al
  repositorio es parte del trabajo, no un extra.

## 6. Propuestas concretas de evolución

1. **Cerrar el circuit breaker** alrededor de la pasarela (umbral de apertura + medio-abierto)
   y exponer su estado como métrica.
2. **Completar «Oferta de eventos»**: alta de eventos por promotor con su convenio, para que el
   catálogo deje de ser solo lectura.
3. **Ejecutar IF-04** (pérdida de la proyección de Redis) y **capturar Grafana** durante los
   cuatro fallos para el video.
4. **Corridas de volumetría con k6** (nominal, pico, estrés, resistencia) contra los umbrales de
   la [volumetría](../02-modelamiento/volumetria.md), hoy pendientes.
5. **Desplegar en un clúster real** (minikube/k3d con KEDA) para demostrar el autoescalado por
   lag, no solo declararlo.
6. **Rotación de llaves y pruebas de seguridad automatizadas**, la deuda que el propio AD-004
   reconoce.

## 7. Autonota honesta

Lo que funciona, funciona de verdad y está probado; lo que falta, está **dicho**. El mayor
riesgo de la entrega no es el código —el recorrido crítico y sus reglas están sólidos— sino las
**evidencias visuales** (video y capturas de Grafana/fallos), que dependen de correr el stack
completo en Codespaces. Si tuviéramos una semana más, la gastaríamos en el despliegue en
clúster y en la volumetría, no en reescribir dominio.
