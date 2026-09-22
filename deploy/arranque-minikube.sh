#!/usr/bin/env bash
# Despliegue de fidelidad en Kubernetes local (minikube) con KEDA, como plantea la
# arquitectura de implementación (EKS local para el piloto). Pensado para Codespaces u
# otra máquina con RAM suficiente (>= 8 GB).
# Uso:  bash deploy/arranque-minikube.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 1/6 iniciando minikube (driver docker)"
minikube start --driver=docker --memory=4096 --cpus=4

echo "==> 2/6 construyendo la imagen dentro del daemon de minikube"
eval "$(minikube docker-env)"
docker build -f apps/ventas/Dockerfile -t ticketright/ventas:local .

echo "==> 3/6 instalando KEDA (autoescalado por lag de Kafka, AD-006)"
helm repo add kedacore https://kedacore.github.io/charts >/dev/null 2>&1 || true
helm repo update >/dev/null
helm upgrade --install keda kedacore/keda --namespace keda --create-namespace --wait

echo "==> 4/6 aplicando manifiestos (namespaces, datos, config, ventas)"
kubectl apply -f deploy/k8s/00-namespaces.yaml
kubectl apply -f deploy/k8s/10-config-secrets.yaml
kubectl apply -f deploy/k8s/20-datastores.yaml
echo "    esperando a que PostgreSQL, Redis y Kafka estén listos..."
kubectl -n ventas rollout status deploy/postgres --timeout=180s
kubectl -n ventas rollout status deploy/redis --timeout=120s
kubectl -n ventas rollout status deploy/kafka --timeout=240s

echo "==> 5/6 migración + semilla (Job) y despliegue del servicio"
kubectl apply -f deploy/k8s/30-ventas.yaml
kubectl -n ventas wait --for=condition=complete job/ventas-migrate-seed --timeout=180s || true
kubectl -n ventas rollout status deploy/ventas --timeout=180s

echo "==> 6/6 autoescalado por lag (KEDA ScaledObject)"
kubectl apply -f deploy/k8s/40-keda-scaledobject.yaml

echo
echo "Estado del namespace ventas:"
kubectl -n ventas get pods,svc,scaledobject
cat <<'FIN'

Listo. Para acceder a la API:
  kubectl -n ventas port-forward svc/ventas 3000:3000
  curl localhost:3000/health
Ver el autoescalado por lag:
  kubectl -n ventas get hpa -w      # KEDA crea un HPA a partir del ScaledObject
FIN
