# Despliegue de TicketRight

El piloto de la Entrega 3 se ejecuta en **GitHub Codespaces** (o cualquier Linux con Docker),
no en la máquina local del equipo, para tener RAM y CPU suficientes y un entorno Linux
parecido al de producción. Hay dos formas, ambas fieles a la
[arquitectura de implementación](../docs/proyecto/02-modelamiento/arquitectura-de-implementacion.md).

## Opción rápida — docker compose

Levanta toda la infraestructura y la app en un comando. Útil para la demo, la observabilidad
y la inyección de fallos.

```bash
bash deploy/arranque-compose.sh
```

## Opción de fidelidad — Kubernetes local (minikube) + KEDA

Despliega en un clúster de Kubernetes con los namespaces del diseño, sondas de salud,
Secrets y **KEDA escalando por el lag de Kafka** (AD-006). Es el equivalente local de EKS.

```bash
bash deploy/arranque-minikube.sh
```

## Cómo abrir en Codespaces

1. En GitHub, botón **Code → Codespaces → Create codespace on main**.
2. El devcontainer (`.devcontainer/devcontainer.json`) trae Node 24, Docker-in-Docker,
   kubectl, helm y minikube, y corre `npm install` al crearse.
3. Ejecuta uno de los dos scripts de arriba.
4. Abre los puertos publicados desde la pestaña **PORTS** (3000 API, 3001 Grafana, 9090 Prometheus).

## Correspondencia AWS → equivalente local (piloto)

El diseño describe una topología en AWS; el piloto la reproduce con equivalentes de misma
tecnología o mismo protocolo. Ningún cambio altera las garantías de negocio.

| Diseño (AWS) | ADR | Equivalente en el piloto |
|---|---|---|
| Amazon EKS + Fargate | AD-006 | minikube (Kubernetes local, driver docker) |
| Aurora PostgreSQL Multi-AZ + RDS Proxy | AD-003 | PostgreSQL 18 en contenedor/pod |
| Amazon ElastiCache for Redis | AD-006 | Redis 7 en contenedor/pod (fila `fila:{evento}:{turno}`) |
| Amazon MSK | AD-002 | Apache Kafka (KRaft) en contenedor/pod |
| KEDA (lag de Kafka) | AD-006 | KEDA en el clúster, ScaledObject por `consumer_lag` |
| API Gateway + WAF/Bot Control | AD-004 | Borde propio: token-bucket + detección de bots (`src/security/edge-gateway.ts`) |
| Amazon Cognito + JWT de admisión | AD-004 | JWT HS256 firmado (`src/security/admission-token.ts`) |
| AWS KMS | AD-004 | Cifrado AES-256-GCM de PII (`src/security/crypto-utils.ts`) |
| AWS CloudTrail | AD-004 | Registro de auditoría append-only (`src/security/audit-log.ts`) |
| AWS Secrets Manager | AD-004 | Secret de Kubernetes (`deploy/k8s/10-config-secrets.yaml`) |
| S3 + CloudFront | AD-004 | Portal estático servido en `/portal` (`src/http/static-portal.ts`) |
| EventBridge Scheduler | AD-006 | Gestor de perfiles operativos (`src/adapters/operational-profiles.ts`) |
| OpenTelemetry + Grafana + Prometheus + Tempo + Loki + Alloy | — | Los mismos, en contenedores |

Lo que queda como diseño no ejecutado (por alcance del piloto, documentado y justificado):
OpenSearch (búsqueda CQRS), Multi-AZ real, Karpenter, Argo CD/Terraform y la topología de red
de producción (VPC, subredes, WAF administrado). Ver la
[arquitectura de implementación](../docs/proyecto/02-modelamiento/arquitectura-de-implementacion.md#implicaciones-y-límites).
