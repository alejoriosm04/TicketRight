# Arquitectura de implementación de TicketRight

## Propósito y alcance

Este documento aterriza la [arquitectura de referencia](arquitectura-de-referencia.md) en una
topología de producción concreta sobre **Amazon Web Services (AWS)**. Responde dónde corre
cada componente, con qué servicio, cómo se comunican, cómo se configura cada ambiente, qué
controles de seguridad y resiliencia lo sostienen y cuánto cuesta operarlo en la ventana de
alta demanda.

La referencia describe capacidades sin marcas; **aquí sí se nombran proveedores y productos**
(por ejemplo, «grilla distribuida en memoria» pasa a ser Amazon ElastiCache for Redis). La
distinción es la que explicó el profesor en
[clase](../../curso/clase-03-04-transcripcion.md#8-arquitectura-de-referencia-vs-arquitectura-de-implementación)
y la que la rúbrica califica por separado. Cada elemento de esta topología se puede rastrear
hasta un componente de la referencia y hasta un ADR en la
[matriz de trazabilidad](#trazabilidad-referencia--implementación--adr).

**Es diseño del despliegue, no el despliegue.** No hay cuentas, clústeres ni recursos creados
en AWS: la Entrega 3 ejecutará el piloto en Kubernetes local, como autoriza
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) y el profesor
([clase](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación)).
Los precios citados son de lista; el único precio `[V]` es el de AWS Fargate del
[caso de negocio](../01-caso-de-negocio/canvas.md#dato-6--precio-de-cómputo-y-qué-sale-de-él).

## Artefactos

- [Diagrama de despliegue interactivo](arquitectura-de-implementacion.html).
- [Fuente validada del diagrama](arquitectura-de-implementacion.json).
- [Diagrama de despliegue para diagrams.net](arquitectura-de-implementacion.drawio), con
  iconos oficiales de AWS Architecture Icons y los logos de las demás tecnologías.
- [Render de verificación del `.drawio`](arquitectura-de-implementacion.drawio.render.png).
- [Arquitectura de referencia relacionada](arquitectura-de-referencia.md).
- [Atributos de calidad](../../proyecto/01-caso-de-negocio/atributos-de-calidad.md) y
  [volumetría](volumetria.md): los números que dimensionan esta topología.

El diagrama `.drawio` es la vista de despliegue principal: agrupa por nube, región, zonas de
disponibilidad, VPC, subredes y clúster, y usa la iconografía oficial de AWS más los logos de
PostgreSQL, Redis, Kafka, Kubernetes, OpenSearch, Grafana, Prometheus, OpenTelemetry,
Terraform, Helm, Argo CD y GitHub Actions. La vista interactiva presenta la misma topología
en capas legibles y con vistas guiadas por ambiente lógico. **Ninguna de las dos desciende al
detalle de pods o instancias individuales que cambian entre despliegues.**

## Contenido

| Sección | Pregunta que responde |
|---|---|
| [Entornos](#entornos) | ¿Qué ambientes existen y en qué se diferencian? |
| [Topología de producción](#topología-de-producción-en-aws) | ¿Dónde corre cada componente en AWS? |
| [Cómo leer el diagrama](#cómo-leer-el-diagrama) | ¿Qué notación, leyenda y nivel de abstracción tiene la vista? |
| [Evidencia de validación](#evidencia-de-validación) | ¿Con qué se comprobó que el diagrama es correcto y legible? |
| [Correspondencia con la referencia](#correspondencia-con-la-arquitectura-de-referencia) | ¿Qué servicio materializa cada capacidad? |
| [Unidades desplegables](#unidades-desplegables-en-kubernetes) | ¿Cómo se organizan los contenedores y el escalado? |
| [Integraciones y contratos](#integraciones-y-contratos) | ¿Qué protocolo, formato, versionado y errores tiene cada integración? |
| [Infraestructura como código](#infraestructura-como-código-y-entrega) | ¿Cómo se configura y despliega de forma reproducible? |
| [Seguridad](#seguridad) | ¿Qué modelo de amenazas motiva cada control? |
| [Escalabilidad y resiliencia](#escalabilidad-disponibilidad-y-resiliencia) | ¿Cómo se comporta en cada perfil y ante fallos? |
| [Observabilidad](#observabilidad-en-la-implementación) | ¿Dónde se despliega la plataforma Grafana? |
| [Costos](#costos-y-atributo-a-7) | ¿Cómo se controla el costo por boleta vendida? |
| [Trazabilidad](#trazabilidad-referencia--implementación--adr) | ¿De dónde sale cada elemento y a qué ADR pertenece? |
| [Atributos de calidad](#correspondencia-con-los-atributos-de-calidad) | ¿Qué atributo sostiene cada mecanismo? |
| [Implicaciones y límites](#implicaciones-y-límites) | ¿Qué queda fuera y qué falta validar? |

## Entornos

La misma carta de servicios se despliega en tres ambientes con parámetros distintos; no
existen dos arquitecturas. Los contratos, las fuentes de verdad y los tokens son idénticos
([AD-005](../decisiones/0005-estilo-de-arquitectura.md)).

| Ambiente | Dónde corre | Datos | Para qué sirve |
|---|---|---|---|
| **Local (piloto Entrega 3)** | Kubernetes local (`k3d` o Minikube) con las mismas imágenes y charts; Kafka compatible y PostgreSQL/Redis en contenedores; Chaos Mesh para inyección de fallos; pasarela de pagos simulada | Sintéticos | Reproducir la carga de [volumetría](volumetria.md) y los experimentos de [inyección de fallos](inyeccion-de-fallos.md) sin costo de nube |
| **Staging** | Clúster EKS no productivo (mismo Terraform, `workspace` distinto), una sola zona lógica y capacidad mínima; OpenSearch puede quedar apagado y la búsqueda resolverse con una proyección simple | Sintéticos | Validar migraciones, charts, contratos y pruebas de regresión antes de producción |
| **Producción** | Lo que describe este documento: `us-east-1`, tres zonas de disponibilidad, Multi-AZ en todos los datos y la zona Space-Based activable por ventana | Reales, cifrados y auditados | Vender en la ventana de alta demanda |

Parámetros que cambian por ambiente (siempre por `values` de Helm y variables de Terraform,
nunca por edición manual):

| Parámetro | Local | Staging | Producción |
|---|---|---|---|
| Réplicas mínimas de servicios críticos | 1 | 1 | 2 (una por zona como mínimo) |
| Aurora PostgreSQL | Contenedor | Aurora Serverless v2 mínima | Aurora provisionado Multi-AZ + réplica de lectura + RDS Proxy |
| Redis | 1 nodo | 1 shard, 1 réplica | 3 shards, Multi-AZ, conmutación automática |
| OpenSearch | Apagado | Apagado o 1 nodo | Habilitado (2 nodos, conciencia de zona) `[S]` omitible en el MVP |
| Fila Space-Based | Opcional (`ModoAdmision.pasoDirecto`) | Paso directo | Paso directo cotidiano; activación programada antes de la ventana |
| Datos personales | Sintéticos | Sintéticos | Reales, campos cifrados con llave propia |
| Retención de telemetría | Horas | 7 días | 15–30 días en la plataforma y 24 meses de evidencia de auditoría |

## Topología de producción en AWS

La venta se concentra en **una región** (`us-east-1`) porque es la de menor latencia desde
Colombia y la que usó el cálculo de costos `[V]`. La alta disponibilidad se consigue con tres
zonas de disponibilidad dentro de la región; una segunda región es una decisión de
recuperación ante desastres que hoy no se paga (ver [límites](#implicaciones-y-límites)).

### Red

| Zona | CIDR | Qué contiene | Ruta a Internet |
|---|---|---|---|
| VPC | `10.20.0.0/16` | Toda la solución de producción | — |
| Subred pública A/B/C | `10.20.0.0/20`, `10.20.16.0/20`, `10.20.32.0/20` | NAT Gateway de cada zona | Vía Internet Gateway |
| Subred privada de aplicación A/B/C | `10.20.48.0/20`, `10.20.64.0/20`, `10.20.80.0/20` | Nodos y pods de EKS, ENIs de Fargate, balanceador interno | Salida vía NAT, sin entrada pública |
| Subred privada de datos A/B/C | `10.20.96.0/20`, `10.20.112.0/20`, `10.20.128.0/20` | Aurora, ElastiCache, MSK, OpenSearch | Ninguna |

Reglas de red:

1. **No hay balanceador público.** Todo el tráfico público entra por CloudFront y API Gateway;
   el balanceador interno de la VPC solo acepta tráfico del enlace privado del gateway.
2. **Ningún nodo tiene IP pública ni acceso SSH.** La administración usa AWS Systems Manager
   Session Manager, y cada pod obtiene permisos AWS por rol IRI (IRSA), no por credenciales
   del nodo.
3. **Endpoints de VPC** para S3, ECR, Secrets Manager, KMS y CloudWatch: el plano de
   aplicación no necesita NAT para hablar con los servicios AWS.
4. **Grupos de seguridad por nivel** (borde, aplicación, datos) y NetworkPolicies por
   namespace; el grupo de datos solo acepta tráfico del grupo de aplicación y en los puertos
   de cada motor.
5. **Registros de flujo** de VPC hacia S3 para investigación y auditoría.

### Servicios por zona funcional

| Zona | Servicios AWS | Qué materializa |
|---|---|---|
| Borde | Route 53, CloudFront, AWS WAF (reglas administradas y Bot Control), Shield Standard, S3 (sitio estático), API Gateway (HTTP API), Amazon Cognito | Portal, CDN, firewall, cuotas, autenticación federada y entrada única a las APIs |
| Ejecución | Amazon EKS, Karpenter, KEDA, AWS Fargate, EventBridge Scheduler | Contenedores, escalado por trabajo pendiente y precalentamiento de la ventana |
| Núcleo transaccional | Aurora PostgreSQL Multi-AZ + RDS Proxy, ElastiCache for Redis, Amazon MSK Serverless | Autoridad del inventario, grilla en memoria, bus durable y outbox |
| Consultas | Aurora (réplica de lectura), ElastiCache, Amazon OpenSearch Service | Proyecciones CQRS reconstruibles |
| Identidad | Cognito, Aurora PostgreSQL Serverless v2 aislada, AWS KMS | Identidad, consentimiento y datos personales separados |
| Seguridad | KMS, Secrets Manager, IAM, CloudTrail, GuardDuty, Security Hub, AWS Config | Llaves, secretos, mínimo privilegio y evidencia de accesos |
| Observabilidad | Grafana, Prometheus, Tempo, Loki, Alloy, Alertmanager (contenedores en EKS), S3 y EBS | Plataforma Grafana de [observabilidad](observabilidad.md) |
| Entrega | GitHub Actions, Amazon ECR, Argo CD, Terraform, S3 + DynamoDB para estado | CI/CD, artefactos inmutables, GitOps e infraestructura como código |
| Externos | Pasarela de pagos (Wompi como referencia de tarifa `[V]`), control de acceso del recinto, autoridades y registros | Terceros fuera de la frontera del sistema |

## Cómo leer el diagrama

El diagrama de despliegue sigue las convenciones de AWS Architecture Icons y declara su
nivel de abstracción:

- **Qué muestra:** la topología de producción —nodos de red, zonas, subredes, fronteras de
  confianza, servicios desplegados y sus integraciones—. El ambiente local del piloto se
  describe en este documento, no se dibuja.
- **Qué no muestra:** pods, réplicas, tipos de instancia ni versiones exactas; esos
  parámetros viven en los `values` de Helm y en las variables de Terraform.
- **Iconografía:** los servicios AWS usan los iconos oficiales (`mxgraph.aws4`); las demás
  tecnologías usan su logo: Kubernetes, KEDA, Grafana, Prometheus, OpenTelemetry,
  PostgreSQL, Redis, Apache Kafka, OpenSearch, Docker, Terraform, Helm, GitHub Actions y
  Argo CD. Los terceros sin logo se representan con el servidor genérico.
- **Líneas:** continua = llamada sincrónica; punteada = flujo asíncrono (eventos); punteada
  roja = camino de error o DLQ. Las etiquetas indican el protocolo o el dato transportado;
  el detalle de cada contrato está en [Integraciones y contratos](#integraciones-y-contratos).
- **Fronteras:** `AWS Cloud` (cuenta), `VPC` con tres zonas de disponibilidad, `EKS`
  (clúster y nodos), `Plano de datos aislado` y los recuadros de observabilidad, seguridad
  y entrega.

## Correspondencia con la arquitectura de referencia

Cada componente lógico de la [referencia](arquitectura-de-referencia.md#componentes-e-interfaces)
se materializa así. La columna **Alternativa considerada** documenta la decisión de servicio.

| Componente de referencia | Implementación en AWS | Por qué | Alternativa considerada |
|---|---|---|---|
| Portal web | S3 + CloudFront (OAC) con versiones del build; el portal consume las APIs por el mismo dominio | Contenido estático servido en el borde sin tocar los servicios dinámicos | Amplify Hosting (menos control del cacheo y de la seguridad) |
| API Gateway y entrega perimetral | API Gateway HTTP API + VPC Link a balanceador interno; AWS WAF y Shield en CloudFront | Termina TLS, valida JWT, aplica cuotas por ruta y evita exponer el clúster | Kong autoadministrado (más operación para un equipo pequeño) |
| Servicio de identidad y consentimiento | Amazon Cognito (OIDC/OAuth 2.0) + Aurora PostgreSQL Serverless v2 en subred, grupo de seguridad, llave KMS y credenciales propias | Identidad administrada y almacén de datos personales aislado por finalidad ([AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md)) | Proveedor de identidad especializado (reevaluar con el equipo jurídico) |
| Servicio de catálogo y configuración de eventos | Servicio en EKS + Aurora PostgreSQL (autoridad) + Amazon OpenSearch Service (búsqueda) | Las reglas y el aforo viven en la autoridad; la búsqueda es una proyección reconstruible | Solo índices en OpenSearch (arriesga autoridad) |
| Servicio de admisión y fila virtual | Servicio en EKS + ElastiCache for Redis (cluster) + MSK (topic durable de admisión) + JWT de admisión firmado con KMS | Absorbe la multitud fuera de PostgreSQL y conserva el registro durable de cada turno | Sala administrada de terceros (dependencia adicional en el camino crítico) |
| Servicio de inventario y reservas | Servicio en EKS + Aurora PostgreSQL Multi-AZ detrás de **RDS Proxy** | Es la única autoridad del aforo; RDS Proxy acota la tormenta de conexiones del pico | Instancias EC2 con PostgreSQL autoadministrado (más operación, sin failover administrado) |
| Orquestador de compra y pagos | Servicio en EKS + estado de la SAGA en Aurora + outbox transaccional + MSK | Coordina la SAGA sin plataforma adicional ([AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md)) | Step Functions o Temporal (reevaluar si crecen duración y número de pasos) |
| Servicio de boletas y titularidad | Servicio en EKS + Aurora PostgreSQL (transacción de venta y emisión en el mismo límite) | Garantiza una sola titularidad vigente por boleta | DynamoDB (transacciones de un solo ítem, pero pierde el modelo relacional ya decidido) |
| Bus de eventos y colas durables | Amazon MSK Serverless (temas versionados, partición por `venta_id`, DLQ, retención 7–30 días) | Escala con la demanda sin pagar brokers ociosos; retención suficiente para relectura | MSK provisionado (menor costo solo con carga sostenida; reevaluar en régimen) |
| Procesadores asíncronos | Workers en EKS escalados por **KEDA** según el retraso del grupo consumidor | Escala con el trabajo real, no con CPU | Autoescalado solo por CPU y memoria (reactivo y ciego a la cola) |
| Base de datos transaccional | Aurora PostgreSQL Multi-AZ, cifrado con KMS, PITR y copia de respaldo entre regiones | Autoridad con conmutación administrada y recuperación a un punto en el tiempo | RDS PostgreSQL (válido; Aurora simplifica réplica y failover) |
| Caché distribuida y modelos de lectura | ElastiCache for Redis (cluster mode, cifrado en tránsito y reposo) + OpenSearch | Responde el camino caliente sin competir con las escrituras; ambas proyecciones se reconstruyen | MemoryDB (durabilidad que estas proyecciones no necesitan) |
| Plataforma de ejecución | Amazon EKS multi-AZ + Karpenter (nodos) + KEDA (pods) + Fargate para la sala de espera + EventBridge Scheduler | Capacidad base mínima y ráfaga serverless en la ventana; precalentamiento programado | ECS/Fargate puro (menos ecosistema para KEDA y Helm); autoescalado solo por métricas básicas |
| Seguridad de plataforma | KMS (llaves por clase de dato), Secrets Manager con rotación, IAM con IRSA, CloudTrail, GuardDuty, Security Hub, Config | Defensa en profundidad y evidencia auditable sin credenciales estáticas | Secretos en Kubernetes (sin rotación ni auditoría central) |
| Plataforma de observabilidad | Grafana OSS + Prometheus + Tempo + Loki + Alloy + Alertmanager en EKS; S3 como almacén de largo plazo | Mantiene la plataforma elegida en [observabilidad](observabilidad.md) y su integración con OpenTelemetry | Amazon Managed Grafana/Prometheus (menor operación, mayor costo fijo) |
| Entrega automatizada | GitHub Actions + ECR + Argo CD + Terraform (estado en S3 con bloqueo en DynamoDB) | Reproducible y auditable; despliegue sin interrumpir ventas activas ([A-12](../01-caso-de-negocio/atributos-de-calidad.md#a-12--modificabilidad-de-políticas-de-venta)) | Despliegue manual por pipeline (sin GitOps, sin reversión declarativa) |

## Unidades desplegables en Kubernetes

### Grupos de nodos y capacidad

| Grupo | Tipo de instancia | Cargas | Mínimo / máximo | Notas |
|---|---|---|---|---|
| `ng-core` | Graviton (`m7g.large`), bajo demanda | identidad, catálogo, admisión, inventario, SAGA, boletas | 3 / 12 nodos | Una réplica por zona como mínimo; sin Spot |
| `ng-async` | Graviton + Spot | procesadores, proyecciones, emisión y conciliación | 0 / 20 nodos | KEDA decide pods; Karpenter consolida nodos |
| `ng-platform` | Graviton (bajo demanda) | observabilidad, ingress interno, KEDA, Karpenter, Argo CD, External Secrets | 2 / 6 nodos | Aísla la operación del camino de compra |
| Perfil Fargate `sala` | Serverless | Workers sin estado de la sala de espera | 0 / 60 tareas | Ráfaga de la ventana; dimensiona el costo `[V]` |

Namespaces y cargas principales: `identidad` (identidad-api), `catalogo` (catálogo y
proyector), `admision` (sala, emisor de tokens y workers), `ventas` (inventario, orquestador
SAGA y relay de outbox), `boletas` (boletas y emisión), `procesadores` (pago, conciliación,
vencimientos y proyecciones), `observabilidad` y `plataforma`.

### Escalado

1. **KEDA** ajusta consumidores y workers con el *lag* de MSK y el trabajo pendiente; cada
   `ScaledObject` declara mínimo, máximo y umbral, y el máximo nunca supera la capacidad de
   la pasarela ni del núcleo.
2. **Karpenter** provee nodos según la demanda real de pods y consolida la capacidad cuando
   baja; en `ng-async` combina bajo demanda y Spot.
3. **Fargate** absorbe la ráfaga de la sala de espera sin nodos precalentados; los workers de
   la sala son sin estado y no necesitan DaemonSets.
4. **EventBridge Scheduler** dispara el calendario de la venta: precalienta réplicas,
   conexiones, shards de Redis y consumidores antes de abrir, y agenda la vuelta al perfil
   cotidiano solo cuando el trabajo pendiente está drenado.
5. **Topes de seguridad**: máximo de réplicas por servicio, tasa máxima de admisión y
   presupuesto de conexiones en RDS Proxy; el autoescalado del pico no se convierte en una
   avalancha contra PostgreSQL.

### Configuración

- **Helm** para servicios y charts de dependencias; `values` por ambiente versionados en Git.
- **ConfigMaps** para parámetros no secretos (ventana de venta, umbrales, flags de
  funcionalidad como OpenSearch habilitado/apagado).
- **External Secrets Operator** sincroniza Secrets Manager hacia el clúster; los secretos no
  viven en Git ni en imágenes.
- **Flyway** para migraciones de esquema versionadas y compatibles hacia atrás
  (*expand/contract*), de modo que un despliegue no rompa una venta activa (A-12).
- Manifiestos adicionales: NetworkPolicies, PodDisruptionBudgets, límites y solicitudes de
  recursos, y puntos de salud/readiness por servicio.

## Integraciones y contratos

Contratos públicos descritos con **OpenAPI 3.1**; eventos con **AsyncAPI** (formalización
pendiente, como dejó anotado la referencia) y esquemas JSON verificados con **AWS Glue Schema
Registry** para compatibilidad hacia atrás.

| Origen → destino | Protocolo | Formato | Sincronía | Contrato y versionado | Errores y reintentos |
|---|---|---|---|---|---|
| Navegador → CloudFront | HTTPS (TLS 1.2+) | HTML/JS estático, JSON | Sincrónica | Build versionado por artefacto; invalidación por despliegue | WAF bloquea y cuenta; errores de origen controlados |
| Navegador → API Gateway | HTTPS (TLS 1.2+) | JSON | Sincrónica | OpenAPI 3.1 en `/v1`; cambio incompatible → `/v2` con solapamiento | 4xx/429 con `Retry-After`; cuotas por identidad y token; el cliente solo reintenta operaciones idempotentes |
| API Gateway → servicios | HTTPS interno + VPC Link | JSON | Sincrónica | Esquemas por servicio; JWT de Cognito validado en el gateway y **JWT de admisión** revalidado en el núcleo | *Timeout* y *circuit breaker* por ruta; 5xx con traza correlacionada |
| Admisión → ElastiCache | RESP sobre TLS | Estructuras compactas | Sincrónica | Nombres de llave versionados (`fila:{evento}:{turno}`) | *Timeout* corto y reconstrucción desde el registro durable de MSK; Redis nunca decide aforo |
| Servicios → RDS Proxy → Aurora | PostgreSQL sobre TLS | SQL transaccional | Sincrónica | Esquema por Flyway; actualización condicional y restricción única | Reintento solo de transacciones idempotentes; el pool acota la concurrencia (contrapresión) |
| Relay de outbox → MSK | Kafka (TLS + SASL/IAM) | JSON Schema | Asíncrona, al menos una vez | Temas `ventas.v1.*` particionados por `venta_id`; `event_id` para idempotencia | Reintentos acotados; tras el límite el mensaje va a la cola de no procesables (DLQ) con evidencia |
| MSK → procesadores | Kafka | JSON Schema | Asíncrona | `AsyncAPI`; mismos temas versionados | Consumidores idempotentes, espera progresiva y DLQ; el *lag* es la señal de escalado |
| Orquestador → pasarela de pagos | HTTPS/REST + webhook | JSON | Solicitud sincrónica, resultado asíncrono | Contrato del proveedor con clave de idempotencia por orden; webhook firmado verificado antes de persistir | Reintentos con espera progresiva, *circuit breaker*, consulta de conciliación; un pago confirmado nunca se revierte como si no existiera |
| Pasarela → API de webhooks | HTTPS | JSON firmado | Asíncrona | Versión y firma del proveedor; identificador de evento | Idempotencia por identificador; evento repetido produce el mismo resultado |
| Servicios → KMS | API AWS sobre TLS | Firma/verificación asimétrica | Sincrónica | Llave y política versionadas; rotación anual | Errores de autorización auditados; sin llave privada en los pods |
| Control de acceso → API de validación | HTTPS | JSON | Sincrónica | Consulta de estado y versión del código de la boleta | Solo lectura; errores reintentables con espera corta |
| Tickets → autoridades y registros | HTTPS/SFTP por lotes | Archivo firmado | Asíncrona | Reportes autorizados y referencias | Salida únicamente desde subred privada; reintento programado y evidencia |
| Servicios → Alloy/Prometheus | OTLP/gRPC y *scrape* | Métricas, trazas y logs | Asíncrona | Convenciones semánticas de OpenTelemetry; muestreo configurable | El búfer local reintenta; la telemetría no bloquea la venta |
| GitHub Actions → ECR → Argo CD → EKS | OIDC/STS, HTTPS, Git | Imágenes OCI y manifiestos | Asíncrona | Imágenes inmutables por *commit*; revisión de Git como fuente | Promoción con aprobación a producción; reversión declarativa a la revisión anterior |

## Infraestructura como código y entrega

- **Terraform** define red, EKS, datos, borde, seguridad y observabilidad como módulos
  reutilizables; `staging` y `producción` son *workspaces* con variables distintas. El estado
  vive en S3 con bloqueo en DynamoDB y cifrado KMS.
- **Helm** empaqueta servicios, workers, KEDA `ScaledObjects`, Ingress interno y el stack de
  observabilidad; los `values` por ambiente se revisan por *pull request*.
- **GitHub Actions** ejecuta lint, pruebas unitarias del [plan de pruebas](plan-de-pruebas.md),
  construcción de imagen `linux/arm64`, escaneo de vulnerabilidades y publicación en **ECR**
  con etiqueta inmutable; asume un rol IAM por **OIDC**, sin claves estáticas.
- **Argo CD** sincroniza el estado declarado del clúster; la promoción a producción exige
  aprobación y permite revertir a la revisión anterior sin recompilar.
- **Migraciones** con Flyway en el pipeline, compatibles hacia atrás, antes de habilitar la
  nueva versión del servicio.
- **Reproducibilidad local**: los mismos gráficos se levantan en `k3d`/Minikube con
  `values-local.yaml`; la pasarela real se reemplaza por el simulador y los datos por
  sintéticos.

## Seguridad

### Modelo de amenazas

| Amenaza | Vector | Control en la implementación | Decisión |
|---|---|---|---|
| Acaparamiento automatizado (bots) | Compra masiva con scripts durante la apertura | WAF con reglas administradas y Bot Control, cuotas por ruta e identidad, retos por riesgo y fila obligatoria en el pico | [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) |
| Manipulación o repetición de tokens | Alterar o reutilizar el JWT de admisión | Firma asimétrica en KMS, vigencia corta, `jti` de un solo uso lógico, validación en el gateway **y** en el núcleo | AD-004 |
| Suplantación de webhook de pago | Enviar confirmaciones falsas a la API de webhooks | Firma verificada del proveedor, respuesta persistida antes de actuar y conciliación contra el proveedor | AD-002 · AD-004 |
| Fuga de datos personales | Acceso o propagación indebida de nombre, documento o contacto | Almacén aislado, llave KMS propia, autorización por finalidad, identificadores opacos en eventos, cachés y trazas, datos sintéticos fuera de producción | AD-004 |
| Robo de credenciales de servicio | Claves estáticas en repositorios o variables | IRSA por pod, secretos en Secrets Manager con rotación, OIDC de GitHub, cero claves en el repositorio | AD-004 |
| Denegación de servicio volumétrica | Saturación del borde o de la base | Shield y WAF en el borde, cuotas por ruta, contrapresión de admisión, RDS Proxy y topes de autoescalado | AD-004 · AD-006 |
| Compromiso de dependencia o imagen | Imagen o librería alterada | Imágenes inmutables escaneadas en ECR, dependencias fijadas, mínimo privilegio del pod | [A-11](../01-caso-de-negocio/atributos-de-calidad.md#a-11--seguridad-y-privacidad-de-datos-y-operaciones) |
| Acceso privilegiado no auditado | Acceso humano a producción sin registro | Sin SSH: Session Manager; CloudTrail, GuardDuty, Security Hub y Config; accesos nominales y temporales | AD-004 |
| Indisponibilidad de una zona | Falla de AZ durante la ventana | Multi-AZ en EKS, Aurora, ElastiCache, MSK y OpenSearch; sin instancias únicas en el camino crítico | [A-9](../01-caso-de-negocio/atributos-de-calidad.md#a-9--disponibilidad-durante-la-ventana-de-venta) |

### Cifrado y secretos

| Capa | En tránsito | En reposo |
|---|---|---|
| Borde | TLS 1.2+ con ACM en CloudFront y API Gateway | S3 del portal con SSE-KMS y versionado |
| Aplicación | TLS interno hacia el balanceador y entre servicios compatibles | Imágenes y capas en ECR cifradas |
| Datos | PostgreSQL TLS, RESP/TLS, Kafka TLS + SASL/IAM | Aurora, ElastiCache, MSK y OpenSearch cifrados con llaves KMS por clase de dato |
| Respaldo | Copia cifrada entre regiones | AWS Backup + PITR de Aurora; S3 de auditoría con bloqueo de objetos 24 meses |
| Secretos | Acceso por rol IAM, nunca por variable en Git | Secrets Manager con rotación; External Secrets los inyecta en el clúster |

Llaves KMS separadas por finalidad: núcleo transaccional, identidad, telemetría, auditoría y
respaldos. Así una llave comprometida no abre todos los datos.

## Escalabilidad, disponibilidad y resiliencia

### Comportamiento por perfil

| Perfil | Qué se activa | Qué escala | Qué se degrada primero |
|---|---|---|---|
| Cotidiano | Paso directo sin fila visible; Redis pequeño como caché y sesión; workers no críticos en cero | Nada: capacidad mínima multi-AZ | Nada |
| Preparación | Calendario de EventBridge, precalentamiento de réplicas, conexiones, shards y consumidores; reglas WAF del evento | Réplicas mínimas suben; proyecciones se reconstruyen y precargan | — |
| Pico | Fila obligatoria, Fargate para la sala, válvula de admisión al ritmo del núcleo | KEDA por *lag*; Karpenter por nodos; Redis y OpenSearch horizontales | Catálogo y nuevas admisiones antes que pagos iniciados |
| Recuperación | Cierre del ingreso, drenaje de colas, reconstrucción de proyecciones y conciliación | Consumidores siguen activos hasta *lag* cero; luego vuelve el mínimo | — |

### Sin puntos únicos de falla

| Componente | Redundancia | Failover |
|---|---|---|
| Borde | CloudFront y WAF son servicios globales; API Gateway regional | Automático |
| EKS | Nodos en tres zonas; réplicas de servicios distribuidas con antiafinidad | Karpenter y Kubernetes reprograman pods |
| Aurora (núcleo e identidad) | Escritor y réplica en zonas distintas; almacenamiento replicado; RDS Proxy | Conmutación administrada; la aplicación reintenta transacciones idempotentes |
| ElastiCache | Shards con réplica y conmutación automática | Reconstrucción de proyecciones desde MSK si se pierde por completo |
| MSK Serverless | Distribuido por diseño en tres zonas | Reanudación desde el *offset*; idempotencia en consumidores |
| OpenSearch | Dos nodos con conciencia de zona | Reconstrucción del índice desde la autoridad |

### Recuperación y evidencia

- **Reservas vencidas**: worker durable cada ≤ 30 s; una reserva con pago confirmado no se
  libera (A-5).
- **Pagos sin boleta**: reintentos con espera progresiva, DLQ y conciliación; toda
  discrepancia se cierra automáticamente en ≤ 15 minutos (A-1).
- **DLQ**: mensajes no procesables visibles con su `event_id`, alerta por antigüedad y
  reproceso controlado tras corregir la causa.
- **Respaldos**: PITR de Aurora y copia entre regiones; los objetos de auditoría se replican
  para conservar 24 meses de historia (A-8).
- `PENDIENTE: definir RTO/RPO numéricos para una caída regional; hoy son un supuesto sin validar y no hay atributo que los fije.`

## Observabilidad en la implementación

La plataforma diseñada en [observabilidad](observabilidad.md) se despliega en `ng-platform`:

| Componente | Despliegue | Almacenamiento y retención |
|---|---|---|
| OpenTelemetry SDK | Dentro de cada servicio; propaga `trace_id` y `correlation_id` hasta los eventos | — |
| Grafana Alloy | DaemonSet y puerta OTLP; filtra datos sensibles y aplica lotes, reintentos y muestreo | Búfer local |
| Prometheus | Despliegue con volumen EBS gp3 | 15 días |
| Grafana Tempo | Despliegue con backend S3 | 30 días |
| Grafana Loki | Despliegue con backend S3, sin datos personales | 30 días |
| Grafana + Alertmanager | Interfaz interna con autenticación Cognito; alertas a los responsables por umbral | Configuración versionada en Git |
| Exportadores | Kubernetes, PostgreSQL, Kafka y Redis | — |
| Evidencia de auditoría | S3 con bloqueo de objetos y ciclo de vida | 24 meses |

Las solicitudes sintéticas al flujo crítico (canarios) alimentan la medición de A-9 y las
alertas de negocio y técnicas existentes no cambian: la implementación solo las conecta a
estas fuentes reales.

## Costos y atributo A-7

La estrategia de costo es la de [AD-005](../decisiones/0005-estilo-de-arquitectura.md) y
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md): capacidad base
mínima, sala serverless en la ventana y topes de escalado. El costo se mide por venta.

| Concepto | Dimensionamiento | Costo | Estado |
|---|---|---|---|
| Cómputo de la sala (Fargate) | 60 tareas × (2 vCPU, 4 GB) × 3 h de ventana provisionada | USD $17,78 por corrida | Precio `[V]` 9-sep-2026; dimensionamiento `[S]` |
| Plano de control de EKS | 1 clúster en soporte estándar, sin soporte extendido | USD $0,10/h ≈ USD $73/mes | `[V]` AWS EKS Pricing, consultado 18-sep-2026 |
| Nodos Graviton base y de plataforma | `ng-core` + `ng-platform` en el perfil cotidiano | `PENDIENTE: cotizar` | `[S]` |
| Nodos de trabajo asíncrono | `ng-async` con Spot y consolidación de Karpenter; cero fuera de la ventana | `PENDIENTE: cotizar` | `[S]` |
| Datos | Aurora core + réplica, Aurora Serverless v2 de identidad, ElastiCache, OpenSearch, MSK Serverless | `PENDIENTE: cotizar` | `[S]`; OpenSearch es omitible en el MVP |
| Borde y seguridad | CloudFront, WAF con Bot Control, API Gateway, KMS, Secrets Manager, respaldos | `PENDIENTE: cotizar` | `[S]` |

Cómo se demuestra A-7 (≤ COP $150 de infraestructura por boleta vendida):

1. El costo del cómputo de la ventana ya está anclado en el dato `[V]` de Fargate
   (≈ COP $71.000 por corrida, ~$9 por boleta en el evento tipo).
2. Todos los recursos se etiquetan por evento (`evento:<id>`, `ambiente`, `servicio`) para que
   Cost Explorer atribuya preparación, pico y recuperación a cada venta.
3. El techo de réplicas y la tasa de admisión de AD-006 son también un techo de gasto: si el
   autoescalado se dispara, la contrapresión frena antes de la avalancha.
4. La estimación vigente del caso de negocio —del orden de $115 por boleta como cota
   superior de infraestructura completa— se conserva como referencia hasta que la corrida de
   volumetría y la calculadora de AWS produzcan el número definitivo
   ([canvas, dato 6](../01-caso-de-negocio/canvas.md#dato-6--precio-de-cómputo-y-qué-sale-de-él)).

`PENDIENTE: cotizar el mes tipo en AWS Pricing Calculator con precios de lista y cerrar el costo por boleta; responsable: Alejo.`

## Trazabilidad: referencia → implementación → ADR

| Componente de referencia | Elemento de implementación | ADR | Atributos que sostiene |
|---|---|---|---|
| Portal web | S3 + CloudFront | [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) | A-9, A-11 |
| API Gateway y entrega perimetral | CloudFront + WAF + Shield + API Gateway + VPC Link | AD-004 | A-6, A-9, A-11 |
| Servicio de identidad y consentimiento | Cognito + Aurora Serverless v2 aislada + KMS | AD-004 | A-4, A-8, A-11 |
| Servicio de catálogo y configuración de eventos | Servicio EKS + Aurora + OpenSearch | AD-003 | A-8, A-12 |
| Servicio de admisión y fila virtual | Servicio EKS + ElastiCache + MSK + KMS | AD-004, AD-006 | A-4, A-10 |
| Servicio de inventario y reservas | Servicio EKS + Aurora Multi-AZ + RDS Proxy | AD-003 | A-2, A-5, A-10 |
| Orquestador de compra y pagos | Servicio EKS + estado SAGA en Aurora + MSK + outbox | AD-002 | A-1, A-6 |
| Servicio de boletas y titularidad | Servicio EKS + Aurora Multi-AZ | AD-002, AD-003 | A-1, A-3, A-8 |
| Bus de eventos y colas durables | MSK Serverless + Glue Schema Registry + DLQ | AD-002, AD-005 | A-1, A-6, A-8 |
| Procesadores asíncronos | Workers EKS + KEDA | AD-002, AD-006 | A-1, A-5, A-6 |
| Base de datos transaccional | Aurora PostgreSQL Multi-AZ + AWS Backup | AD-003 | A-2, A-3, A-9 |
| Caché distribuida y modelos de lectura | ElastiCache for Redis + Aurora (lectura) + OpenSearch | AD-003, AD-005 | A-6, A-10 |
| Plataforma de ejecución | EKS + Karpenter + KEDA + Fargate + EventBridge Scheduler | AD-005, AD-006 | A-6, A-7, A-9, A-12 |
| Seguridad de plataforma | KMS, Secrets Manager, IAM/IRSA, CloudTrail, GuardDuty, Security Hub, Config | AD-004 | A-11 |
| Plataforma de observabilidad | Grafana, Prometheus, Tempo, Loki, Alloy, Alertmanager en EKS + S3 | AD-002, AD-004 | A-1, A-8 |
| Entrega automatizada | GitHub Actions + ECR + Argo CD + Terraform | AD-005, AD-006 | A-12 |
| Pasarela de pago (externa) | Contrato HTTPS + webhook firmado con Wompi como referencia `[V]`; tokenización del navegador | AD-002, AD-004 | A-1, A-11 |
| Control de acceso del recinto (externa) | API de validación HTTPS sobre la versión del código | AD-003 | A-3 |
| Identidad federada (externa) | Cognito como proveedor OIDC/OAuth 2.0 | AD-004 | A-11 |
| Autoridades y registros (externa) | Salida HTTPS/SFTP por lotes desde subred privada | AD-004 | A-8, A-11 |

## Correspondencia con los atributos de calidad

| Atributo | Mecanismo concreto de la implementación |
|---|---|
| A-1 · confiabilidad pago–boleta | SAGA en Aurora con outbox, webhook firmado e idempotente, DLQ, conciliación y cierre ≤ 15 min |
| A-2 · integridad del aforo | Aurora como autoridad única, actualización condicional y restricción única; Redis y OpenSearch jamás confirman |
| A-3 · titularidad única | Transición versionada de titularidad en la misma transacción que la venta de la silla |
| A-4 · equidad de la fila | MSK durable por `event_id`, reconstrucción de la posición desde el registro y token de admisión firmado |
| A-5 · liberación ≤ 10 min | `expires_at` en Aurora y worker durable cada ≤ 30 s; protección de pagos confirmados |
| A-6 · degradación controlada | Cuotas en API Gateway, válvula de admisión, circuit breaker y RDS Proxy; se degradan catálogo y admisión |
| A-7 · costo ≤ COP $150/boleta | Capacidad base mínima, Fargate en la ventana, Spot en asíncronos, topes de escalado y etiquetado por evento |
| A-8 · trazabilidad 24 meses | `trace_id`/`correlation_id`, outbox, auditoría en S3 con bloqueo de objetos y respaldo entre regiones |
| A-9 · disponibilidad ≥ 99,9% | Multi-AZ sin instancias únicas, precalentamiento programado, conmutación administrada y canarios sintéticos |
| A-10 · P95 1 s / 2 s | ElastiCache y OpenSearch para el camino caliente; solo los comandos admitidos llegan a Aurora |
| A-11 · seguridad y privacidad | Defensa en profundidad, KMS por clase de dato, IRSA, cero PAN/CVV y datos sintéticos fuera de producción |
| A-12 · cambio de políticas | Límite funcional de admisión, contratos versionados, Flyway compatible y Argo CD sin interrumpir ventas |

## Evidencia de validación

| Artefacto | Comprobación | Resultado |
|---|---|---|
| Archify (`.json` → `.html`) | `validate` y `deliver` con perfil `standard` y perfil de ingeniería `deployment-ownership` | 9/9 comprobaciones, 0 errores y 5 advertencias de composición: cuatro cruces entre rutas y un aviso de legibilidad por densidad. Recibo: `sha256 bf37b3c0…` (15.141 bytes) para la fuente y `sha256 327e3757…` (876.702 bytes) para el HTML |
| Archify (`.html`) | `visual-check` en 1440×900, 1600×1000, 1920×1080 y 2048×1320, claro y oscuro | Sin desbordamiento horizontal ni vertical en los cuatro tamaños. La estimación automática del tamaño de texto proyectado queda por debajo del umbral en los tamaños menores por la densidad del mapa —igual que en los otros diagramas densos del repositorio— y el visor permite ampliar |
| `.drawio` | Render con el motor de diagrams.net y revisión visual del PNG | 92 celdas (28 relaciones y 7 contenedores); todos los extremos enlazados a celdas válidas, sin iconos vacíos ni rutas sobre iconos. Evidencia: [render de verificación](arquitectura-de-implementacion.drawio.render.png) |

Esta validación comprueba la composición del diagrama y la coherencia de la topología, no el
rendimiento, la disponibilidad ni el costo reales: esas medidas siguen siendo `[S]` y
pertenecen a las pruebas de la Entrega 3.

## Implicaciones y límites

- **No se despliega nada real en AWS en esta entrega.** El ambiente ejecutable es el
  Kubernetes local del piloto; esta topología documenta el destino de producción.
- **Una sola región.** La recuperación ante una caída regional completa queda como decisión
  futura: exige segunda región, réplica de Aurora entre regiones y duplicación del clúster, y
  compite con A-7. `PENDIENTE: dueño y umbral RTO/RPO.`
- **Proveedor de identidad administrado.** [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md)
  dejó abierta la validación jurídica; Cognito es la elección de implementación y se reevalúa
  si la revisión legal pide otro proveedor o aislamiento por cuenta.
- **MSK Serverless** limita particiones y caudal por cuota de servicio; la volumetría del pico
  (≈ 500 ingresos/s y ≈ 8 escrituras/s críticas) está muy por debajo del techo, pero debe
  verificarse con la corrida real.
- **OpenSearch puede no ser necesario en el MVP** (`[S]`): si el catálogo cabe en una
  proyección simple, se apaga y baja el costo.
- **Costos pendientes.** Solo Fargate `[V]` y el plano de control de EKS `[V]` están anclados;
  el resto espera cotización. Ninguna cifra de este documento debe citarse como costo probado.
- **El diagrama es diseño, no inventario.** Las unidades desplegables (pods, réplicas, tipos
  de instancia) son la configuración inicial prevista y cambiarán con las pruebas de la
  Entrega 3.
