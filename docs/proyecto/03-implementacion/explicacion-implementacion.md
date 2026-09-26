# Cómo funciona la implementación de TicketRight — explicación para exponer

> Documento de estudio para la sustentación. Explica **qué se construyó, por qué se construyó
> así (qué atributo de calidad lo justifica) y cómo funciona cada parte**, siguiendo la
> arquitectura planteada en la Entrega 2. Recorre: la forma general, el estilo arquitectónico,
> los contextos y el dominio, el flujo de compra paso a paso, los patrones implementados con su
> evidencia, la seguridad, la observabilidad y el despliegue.

## Contenido

1. La solución en una frase
2. El estilo de arquitectura (y por qué esa mezcla)
3. Las piezas que corren y a qué equivalen
4. Los contextos acotados y el hexágono
5. El flujo de compra, paso a paso
6. Los patrones implementados (con dónde están y qué atributo sostienen)
7. Seguridad de borde e identidad
8. Observabilidad
9. Despliegue
10. Cómo defender cada decisión

---

## 1. La solución en una frase

TicketRight vende boletas cuando **miles de personas llegan al mismo tiempo**, protegiendo tres
garantías que el negocio no negocia: **no vender por encima del aforo**, **no cobrar sin entregar
la boleta** (o compensar) y **una boleta con un solo dueño válido a la vez**. Toda la arquitectura
existe para sostener esas tres cosas bajo avalancha.

## 2. El estilo de arquitectura (y por qué esa mezcla)

El estilo es **híbrido**, no un solo patrón para todo:

- **Núcleo transaccional** (PostgreSQL) para lo que no admite errores: aforo, dinero y
  titularidad → sostiene *integridad del aforo* y *confiabilidad dinero–boleta*.
- **Event-Driven** (Kafka) para lo que puede pasar de forma asíncrona: al confirmarse un pago,
  varias cosas reaccionan (emitir, auditar, proyectar) sin acoplarse → sostiene *confiabilidad* y
  *escalabilidad*.
- **Space-Based bajo demanda** (Redis) para absorber la multitud **fuera** del núcleo: la sala de
  espera → sostiene *disponibilidad* y *rendimiento* en el pico.
- **CQRS**: separar las lecturas (catálogo, disponibilidad) de las escrituras (reservar, pagar),
  para que las consultas no compitan con las compras → sostiene *rendimiento*.

**Por qué no uno solo:** un núcleo transaccional puro no aguanta la avalancha; un sistema
totalmente asíncrono no puede garantizar "cero sobreventa". La mezcla pone cada estilo donde su
fortaleza resuelve el problema y su debilidad no importa.

## 3. Las piezas que corren y a qué equivalen

| Pieza | Rol | Equivalente en la nube (diseño) |
|---|---|---|
| App de ventas (Node/Fastify) | Orquesta la compra y expone las APIs | Servicios en EKS |
| PostgreSQL | Fuente de verdad: aforo, reservas, pagos, boletas | Aurora |
| Redis | Sala de espera / fila de admisión | ElastiCache |
| Kafka | Bus de eventos durable | MSK |
| Prometheus + Grafana | Métricas y tableros | — |
| Tempo + Loki + Alloy + OTel | Trazas y logs correlacionados | — |

Cada tecnología está porque un atributo de calidad la exige, no por preferencia.

## 4. Los contextos acotados y el hexágono

El código es un **monorepo TypeScript** con un paquete por **contexto acotado** (bounded context)
del modelo de dominio, más un núcleo compartido:

| Paquete | Contexto | Qué contiene |
|---|---|---|
| `event-catalog` | Oferta de eventos | Evento, Recinto, Promotor, Convenio, reglas de venta/reventa |
| `admission-identity` | Admisión e identidad | Fila de venta, Turno, Política de fila, Fan, Consentimiento |
| `sales` | Venta y recaudo | Reserva, Pago, Discrepancia, Liquidación, y la SAGA (orquestador) |
| `entitlements` | Derecho de asistencia | Boleta, Titular, Titularidad, Transferencia, Reventa |
| `shared-kernel` | Tipos compartidos | UUID, Dinero, Porcentaje, fechas, y el contrato `EmisorDeBoletas` |

Dentro de cada paquete se aplica **arquitectura hexagonal (ports & adapters)** en cuatro capas:

- `domain/` — las reglas de negocio como métodos de los agregados. **No conoce infraestructura.**
- `application/` — el orquestador de la SAGA y sus comandos.
- `ports/` — las interfaces (repositorios, pasarela, emisor, publicador de eventos).
- `adapters/` — las implementaciones concretas (PostgreSQL, Kafka, JWT). En este proyecto los
  adaptadores de infraestructura viven en `apps/ventas` (la raíz de composición), que es donde se
  arma todo.

**Regla que se respeta:** el dominio no importa infraestructura, y **un contexto no importa a
otro**. La única forma de cruzar frontera es por un puerto o un evento. Ejemplo clave: `sales`
nunca importa `entitlements`; la boleta se emite a través del puerto `EmisorDeBoletas`, cuyo
contrato vive en `shared-kernel`. Esto sostiene *modificabilidad*.

## 5. El flujo de compra, paso a paso

Es el diagrama de secuencia de la Entrega 2, hecho código. El orquestador está en
`packages/sales/src/application/purchase.ts`; las rutas HTTP en `apps/ventas/src/http/routes.ts`.

**Paso 0 — Ver el catálogo.** El fan entra a `/app`. El catálogo es una **lectura** de PostgreSQL
(`GET /catalogo`). No toca inventario. *(CQRS.)*

**Paso 1 — Fila de admisión (Redis).** Al pulsar "Ver entradas" entra a la fila
(`POST /fila/entrar`). En Redis se guardan tres estructuras con llaves versionadas:
- `fila:{evento}:{turno}` → el estado del turno.
- `fila:{evento}:orden` → orden de llegada (para la posición).
- `fila:{evento}:espera` → los que esperan a ser admitidos.

Un temporizador **admite por lotes** a un ritmo configurable (la *tasa de admisión*). Cuando te
admite, la fila **firma un JWT de un solo uso** y te lo entrega. **La fila no decide el cupo:
solo autoriza a intentar.** *(Space-Based + back pressure.)*

**Paso 2 — Reserva (PostgreSQL con candado).** Con el token, `POST /compras`:
- Abre una **transacción** y bloquea la fila de la localidad con `FOR UPDATE`.
- Verifica cupo, descuenta y confirma. Nadie más toca ese cupo hasta el COMMIT.
- Crea la reserva con **vencimiento a 10 minutos**.

Esto hace **imposible la sobreventa**: 100 peticiones por la última boleta pasan una por una; una
gana, el resto recibe "agotado". *(Núcleo transaccional, integridad del aforo.)*

**Paso 3 — Pago (SAGA).** `POST /compras/:id/pago`:
- Registra la intención de pago y escribe el evento `PagoSolicitado` en la tabla **outbox**, en la
  **misma transacción** que el estado del pago.
- La pasarela (simulada) responde con un **webhook** `POST /pagos/webhook`.
- Al confirmarse, se dispara la emisión.

**Paso 4 — Emisión.** La boleta se crea en el contexto `entitlements` a través del puerto
`EmisorDeBoletas`, y el cupo pasa a "vendido", en la misma transacción. El fan ve su boleta con QR.

**Paso 5 — Caminos de error:**
- **Reserva vencida:** un *worker* que corre periódicamente libera las reservas no pagadas
  (`vencerReservasExpiradas`), y nunca toca una con pago confirmado.
- **Pago rechazado:** compensación — se libera el cupo y se cancela la reserva.
- **Emisión que no cierra:** se abre una **discrepancia** ("cobro sin boleta") y la compra pasa a
  "en conciliación". Nunca hay dinero confirmado sin boleta ni sin un caso abierto que lo persiga.

## 6. Los patrones implementados

Cada patrón está en el código y sostiene un atributo. Esta es la lista con dónde vive y qué
resuelve.

### Patrones de arquitectura

| Patrón | Dónde está | Qué resuelve (atributo) |
|---|---|---|
| **Hexagonal (ports & adapters)** | `packages/*/src/{domain,application,ports}` | El dominio no depende de infraestructura → *modificabilidad, testeabilidad* |
| **Bounded contexts + anticorrupción** | Los 5 paquetes; la emisión cruza por `EmisorDeBoletas` | Contextos evolucionan por separado → *modificabilidad* |
| **SAGA orquestada** | `purchase.ts` (`OrquestadorDeCompra`) | Coordinar reserva→pago→emisión→compensación con una pasarela externa ambigua → *confiabilidad* |
| **Outbox transaccional** | `adapters/outbox.ts` + `adapters/kafka.ts` | Guardar estado y publicar el evento en la misma transacción → *confiabilidad* |
| **CQRS** | Lectura de catálogo/disponibilidad vs. escritura en PostgreSQL | Que las consultas no compitan con las compras → *rendimiento* |
| **Space-Based** | `adapters/waiting-room-redis.ts` | Absorber la multitud fuera del núcleo → *disponibilidad, escalabilidad* |
| **Back pressure / válvula de admisión** | La tasa de admisión de la fila + gestor de perfiles | Frenar la entrada antes de ahogar el núcleo → *resiliencia* |
| **Autoescalado por lag (KEDA)** | `deploy/k8s/40-keda-scaledobject.yaml` | Escalar por trabajo pendiente, no por CPU → *escalabilidad* (declarado, no ejecutado en clúster) |

### Patrones de diseño

| Patrón | Dónde está | Qué resuelve |
|---|---|---|
| **Repository** | `packages/sales/src/ports/repositories.ts` + adaptadores PostgreSQL | Ocultar la persistencia detrás de un puerto por agregado → *testeabilidad* |
| **Idempotencia** | `Pago.registrarConfirmacion` devuelve `false` si ya estaba confirmado | Un webhook repetido produce el mismo resultado → *confiabilidad* |
| **Domain Events (Observer)** | `packages/sales/src/domain/events.ts` | Publicar hechos para que otros reaccionen sin acoplarse |
| **Value Objects** | `Dinero`, `Porcentaje`, `Aforo`, `DesglosePrecio` | Hacer imposibles los valores inválidos |
| **Factory Method** | `Reserva.crear`, `Pago.iniciar`, `Boleta.emitir` | Construir agregados válidos, con reglas al nacer |
| **Timeouts acotados** | `apps/ventas/src/db/connection.ts` (`query_timeout`) | Que una dependencia caída falle rápido, no cuelgue → *resiliencia* (lo verificó IF-03) |
| **Unidad de trabajo** | `BaseTransaccional` en `db/connection.ts` | Agrupar lo de un paso en un solo COMMIT → *integridad* (corrige la sobreventa) |
| **Circuit breaker** | *Parcial:* reintentos + timeouts + compensación; falta abierto/medio-abierto | Evitar fallas en cascada por la pasarela → *resiliencia* |

## 7. Seguridad de borde e identidad

Homólogo local de la capa de seguridad del diseño (API Gateway + WAF + Cognito + KMS):

- **Borde de seguridad** (`security/edge-gateway.ts`): antes de las rutas corre un control de tasa
  con **token bucket** por clase de ruta (catálogo, fila, checkout) y una **heurística de bots**
  (ráfagas y cabeceras). Riesgo medio recibe un reto, riesgo alto se bloquea → *seguridad*.
- **JWT de admisión firmado** (`security/admission-token.ts`): la fila lo emite al admitir; es
  corto y de un solo uso. El checkout valida firma, evento y expiración → *seguridad*.
- **Cifrado de datos personales** (`security/crypto-utils.ts`): nombre y documento se guardan con
  **AES-256-GCM**; el resto del sistema usa un identificador opaco. Nunca hay datos personales en
  Kafka, métricas ni logs → *privacidad*.
- **Cuentas de fan con rol** (`security/accounts.ts`): registro/ingreso con contraseña por scrypt,
  sesión JWT y rol (cliente/promotor/operación) que autoriza las vistas internas → *seguridad*.
- **Auditoría** (`security/audit-log.ts`): registro de solo anexado, homólogo de CloudTrail.

## 8. Observabilidad

Instrumentación con **OpenTelemetry**, que produce tres señales correlacionadas por un
identificador de recorrido:

- **Métricas** → Prometheus → Grafana. 14 métricas del diseño (ventas, sobreventa, discrepancias,
  latencia de reserva, lag de Kafka, conexiones de PostgreSQL, etc.), definidas en
  `apps/ventas/src/observability/metrics.ts`.
- **Trazas** → Tempo. El viaje completo de una compra, con cada consulta a PostgreSQL.
- **Logs** → Loki. Estructurados y sin datos personales.

Hay **15 alertas** ligadas a atributos (sobreventa, discrepancia sin resolver, latencia de reserva
alta, lag/DLQ, servicio caído, etc.). Desde una alerta se navega a la métrica, la traza y los logs
de esa compra.

## 9. Despliegue

- **Local / Codespaces:** `docker compose` levanta los 8 servicios; la app corre con `tsx`.
- **minikube + KEDA:** manifiestos en `deploy/k8s/` (namespaces, datastores, la app y el
  `ScaledObject` de KEDA que escala por lag de Kafka). Ejecutado en Codespaces.
- **CI:** GitHub Actions corre `typecheck`, las pruebas y la cobertura en cada push y PR.

## 10. Cómo defender cada decisión

La cadena que hay que poder recitar para cualquier pieza:

**Necesidad del negocio → atributo de calidad → decisión (ADR) → táctica en el código.**

Ejemplos:

- *"En el pico llegan miles de personas a la vez (negocio) → la fila y la reserva deben responder
  a tiempo sin caerse (rendimiento y disponibilidad) → sala de espera que regula la admisión y
  PostgreSQL como única autoridad del cupo (decisión) → fila en Redis con JWT de un solo uso y
  transacciones con `FOR UPDATE` (táctica)."*
- *"La pasarela puede confirmar dos veces (negocio) → no puede haber doble cobro ni doble boleta
  (confiabilidad) → SAGA con idempotencia (decisión) → `Pago.registrarConfirmacion` devuelve
  `false` en la repetición (táctica)."*
- *"El modelo financiero fija un tope de costo por boleta (negocio) → no pagar la capacidad del
  pico todo el mes (eficiencia de costos) → escalado por demanda (decisión) → KEDA por lag de
  Kafka (táctica)."*
