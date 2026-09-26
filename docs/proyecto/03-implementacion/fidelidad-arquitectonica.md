# Fidelidad arquitectónica — de la arquitectura al código

> Criterio 6 de la [rúbrica del Entregable 3](rubrica.md): coherencia con los ADR, los
> supuestos, el alcance y los entregables anteriores. Este documento traza cada decisión de
> arquitectura y cada componente de la
> [arquitectura de implementación](../02-modelamiento/arquitectura-de-implementacion.md)
> hasta su realización en el código, con la evidencia y con lo que quedó fuera de alcance,
> **sin ambigüedades**.

## Principio de la equivalencia

La [arquitectura de implementación](../02-modelamiento/arquitectura-de-implementacion.md)
describe una topología en AWS; el propio documento aclara que **la Entrega 3 ejecuta el
piloto en Kubernetes local**, no en AWS. Por eso cada servicio administrado de AWS se
reemplaza por un **equivalente de la misma tecnología o del mismo protocolo**, de modo que
las garantías de negocio (aforo íntegro, dinero↔boleta, equidad de la fila) no cambian.
Lo que cambia es el proveedor, no el patrón ni el contrato.

## Los ADR, reflejados en el código

### AD-002 — SAGA orquestada con eventos durables (Kafka + outbox)

| Elemento del ADR | Realización | Evidencia |
|---|---|---|
| SAGA orquestada dentro de Ventas | `OrquestadorDeCompra` coordina reserva → pago → emisión → compensación | [`purchase.ts`](../../../packages/sales/src/application/purchase.ts) |
| Outbox transaccional | El evento se escribe en la misma transacción del estado; un relay lo publica | [`outbox.ts`](../../../apps/ventas/src/adapters/outbox.ts) |
| Apache Kafka (MSK en prod), partición por `venta_id` | El relay publica a `ventas.v1.eventos` con `key=venta_id`, productor idempotente | [`kafka.ts`](../../../apps/ventas/src/adapters/kafka.ts) |
| Entrega "al menos una vez" + idempotencia | El consumidor deduplica por `event_id` (PK en `eventos_consumidos`) | `ConsumidorDeEventos` en `kafka.ts` |
| DLQ para no procesables | Topic `ventas.v1.dlq` recibe lo que agota reintentos | `kafka.ts` |
| Idempotencia del webhook | Un webhook repetido no crea otra transición ni otra boleta | [IF-01](bitacora-de-fallos.md), `Pago.registrarConfirmacion` |
| Métricas de la SAGA | pagos por estado, discrepancias, lag del consumidor | tablero de [observabilidad](../../../observability/README.md) |

### AD-003 — PostgreSQL autoridad + CQRS

| Elemento del ADR | Realización | Evidencia |
|---|---|---|
| PostgreSQL única autoridad del aforo | Cada paso de la SAGA corre en una unidad de trabajo (`BEGIN`/`COMMIT`); el `FOR UPDATE` de la localidad se sostiene hasta el `COMMIT`, así que las reservas simultáneas se serializan. Corregido el 22 sep: antes no había transacciones y se sobrevendía ([hallazgo](coherencia-implementacion.md#7-hallazgo-posterior-sobreventa-por-falta-de-transacciones)) | [`inventory.ts`](../../../packages/sales/src/domain/inventory.ts), [`BaseTransaccional`](../../../apps/ventas/src/db/connection.ts), [`concurrencia-aforo.test.ts`](../../../apps/ventas/tests/concurrencia-aforo.test.ts) |
| CQRS: comando en PostgreSQL, lecturas en proyecciones | Fila en Redis y proyección de eventos consumidos; se reconstruyen desde el registro durable | `waiting-room-redis.ts`, `eventos_consumidos` |
| "Redis no decide aforo" | La fila solo autoriza a intentar; la reserva la confirma PostgreSQL. Solo se acepta el JWT que firma la fila (el token plano `turno:<uuid>` se retiró el 22 sep) | `jwt-admission.ts` → `OrquestadorDeCompra.reservar` |
| Liberación de reservas vencidas | Worker durable libera lo no pagado; métrica `overdue_reservations` | `vencerReservasExpiradas` en `purchase.ts` |

### AD-004 — Seguridad por capas, admisión firmada, identidad aislada

| Elemento del ADR | Realización | Evidencia |
|---|---|---|
| API Gateway (única entrada, cuotas por ruta) | Borde propio con token bucket por clase (catálogo/fila/checkout) | [`edge-gateway.ts`](../../../apps/ventas/src/security/edge-gateway.ts) |
| WAF / Bot Control | Detección de automatización por heurística (UA, ráfagas); riesgo medio → reto, alto → bloqueo | `edge-gateway.ts` |
| Cognito / OIDC + JWT de admisión firmado | JWT HS256 corto, con `jti`, `event_id`, `aud`, `exp` (3 min). Desde el 22 sep el `jti` es **de uso único de verdad** (tabla `turnos_usados`, en la transacción de la reserva) y el `sub` debe ser el fan que reserva; antes el mismo token servía para varias reservas y para otro fan | [`admission-token.ts`](../../../apps/ventas/src/security/admission-token.ts), [`jwt-admission.ts`](../../../apps/ventas/src/adapters/jwt-admission.ts) |
| Cognito (cuentas de fan + grupos/roles) | Registro/ingreso con clave por scrypt+sal, sesión JWT de 24 h, y **rol** (`cliente`/`promotor`/`operacion`) que autoriza las vistas internas | [`accounts.ts`](../../../apps/ventas/src/security/accounts.ts); `POST /operacion/perfil` exige rol staff |
| Validación en el gateway y el núcleo | El checkout valida firma, emisor, audiencia, evento, expiración, fan y uso único; un token inválido responde 401 | [`jwt-admission.ts`](../../../apps/ventas/src/adapters/jwt-admission.ts) |
| KMS (cifrado de PII) | Cifrado AES-256-GCM de campos personales | [`crypto-utils.ts`](../../../apps/ventas/src/security/crypto-utils.ts) |
| CloudTrail (auditoría) | Registro append-only de accesos con rol y finalidad | [`audit-log.ts`](../../../apps/ventas/src/security/audit-log.ts) |
| Identificadores opacos en eventos/métricas/logs | El núcleo usa `fanId`/`identidadRef` opacos; no hay PII en Kafka, Prometheus ni Loki | convención en todo el código |
| No almacenar PAN/CVV | La pasarela tokeniza; el sistema guarda referencias | `simulated-gateway.ts`, `Pago` |

### AD-005 — Estilo de arquitectura (hexagonal + contextos)

| Elemento del ADR | Realización | Evidencia |
|---|---|---|
| Hexagonal por contexto | `domain`/`application`/`ports`/`adapters` en cada paquete; el dominio no importa infraestructura | `packages/*/src` |
| Contextos acotados | `sales`, `entitlements`, `admission-identity`, `event-catalog`, `shared-kernel` | `packages/` |
| Mismo diseño en todos los perfiles | Los perfiles cambian capacidad, no contratos | `operational-profiles.ts` |

### AD-006 — Space-Based bajo demanda + KEDA + perfiles

| Elemento del ADR | Realización | Evidencia |
|---|---|---|
| Sala de espera Space-Based en Redis | Fila con llaves `fila:{evento}:{turno}`, admisión por lote | [`waiting-room-redis.ts`](../../../apps/ventas/src/adapters/waiting-room-redis.ts) |
| JWT de admisión de un solo uso | Firmado al admitir; autoriza a intentar reservar | `admission-token.ts` |
| KEDA escala por lag de Kafka | `ScaledObject` con el escalador de Kafka sobre `ventas-proyecciones` | [`40-keda-scaledobject.yaml`](../../../deploy/k8s/40-keda-scaledobject.yaml) |
| Perfiles cotidiano/preparación/pico/recuperación/emergencia | Gestor que ajusta la tasa de admisión (back pressure) y la publica como métrica | [`operational-profiles.ts`](../../../apps/ventas/src/adapters/operational-profiles.ts) |
| Precalentamiento programado (EventBridge Scheduler) | **Parcial.** `programarVentana` encadena preparación → pico → recuperación → cotidiano con temporizadores, pero ninguna ruta lo invoca todavía: en la demo el perfil lo cambia operación a mano con `POST /operacion/perfil` | `operational-profiles.ts`, `routes.ts` |
| Techo de admisión | El `ScaledObject` tiene `maxReplicaCount`; la tasa por perfil está acotada | manifiesto KEDA + perfiles |

### AD-007 — Stack (TypeScript/Node 24, monorepo, Vitest)

Implementado tal cual: monorepo npm workspaces, TypeScript estricto, 63 pruebas Vitest (58
unitarias y 5 de integración contra PostgreSQL, todas en verde en el CI), CI en GitHub Actions con PostgreSQL de
servicio. La app corre con `tsx` y se empaqueta en `Dockerfile`.

### AD-008 — Boleta en el contexto de derecho de asistencia

`Boleta` vive en `@ticketright/entitlements`; la emisión cruza por el puerto `EmisorDeBoletas`
([`ticket-issuance.ts`](../../../packages/shared-kernel/src/ticket-issuance.ts)), realizado por
[`EmisorDeBoletasPostgres`](../../../apps/ventas/src/adapters/postgres/ticket-issuer.ts).

## Correspondencia de infraestructura (AWS → piloto)

| Servicio AWS | Equivalente en el piloto | Fidelidad |
|---|---|---|
| Amazon EKS | minikube (Kubernetes) | Misma API de Kubernetes |
| AWS Fargate | Pods en minikube | Contenedores sin gestionar nodos |
| Aurora PostgreSQL Multi-AZ + RDS Proxy | PostgreSQL 18 | Mismo motor; sin Multi-AZ ni proxy |
| Amazon MSK | Apache Kafka (KRaft) | **Misma tecnología** |
| ElastiCache for Redis | Redis 7 | **Misma tecnología** |
| KEDA | KEDA | **Idéntico** |
| API Gateway + WAF/Bot Control | Borde propio (token bucket + heurística) | Mismo patrón; sin ML antibot |
| Amazon Cognito | JWT HS256 propio | Mismo estándar (JWT/OIDC-like); firma HMAC en vez de KMS |
| AWS KMS | AES-256-GCM con clave de secreto | Mismo cifrado; sin rotación gestionada |
| AWS CloudTrail | Tabla de auditoría append-only | Mismo propósito |
| AWS Secrets Manager | Secret de Kubernetes | Mismo propósito; sin rotación automática |
| S3 + CloudFront | Portal estático en `/portal` con ETag/cache | Mismo patrón de borde de contenido |
| EventBridge Scheduler | Gestor de perfiles con temporizadores (`programarVentana`) | Mismo propósito; la ventana programada no está expuesta, el cambio de perfil es manual |
| Grafana/Prometheus/Tempo/Loki/Alloy/OTel | Los mismos | **Idéntico** |

## Lo que quedó fuera de alcance (deuda técnica deliberada)

Honestamente, y como pide el ADR de no inventar:

- **OpenSearch** (búsqueda CQRS del catálogo): no implementado; las lecturas actuales usan
  PostgreSQL y Redis. Aplicaría al crecer el catálogo.
- **Multi-AZ, VPC, subredes, RDS Proxy, Karpenter**: son topología de producción en AWS;
  el piloto local no los reproduce.
- **Argo CD / Terraform (GitOps + IaC)**: el despliegue del piloto usa `kubectl`/`helm` con
  manifiestos versionados; la entrega automatizada completa queda documentada, no ejecutada.
- **Circuit breaker completo** (umbral de apertura): hoy hay reintentos acotados y timeouts;
  el disyuntor con estados abierto/semiabierto queda como deuda.
- **Ventana de venta programada.** El homólogo de EventBridge Scheduler existe en el gestor de
  perfiles, pero no está conectado a una ruta ni a un calendario: el precalentamiento
  automático antes de la apertura queda como deuda; hoy la transición es manual.
- **Rotación de llaves y ML antibot**: se usan claves de secreto y heurística; la rotación
  gestionada y el Bot Control avanzado son del diseño de producción.

Cada punto está justificado por el alcance del piloto y no compromete ninguna garantía de
negocio verificada en las pruebas y en la [bitácora de fallos](bitacora-de-fallos.md).
