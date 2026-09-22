#!/usr/bin/env bash
# Arranque rápido en Codespaces (o cualquier Linux con Docker): levanta toda la
# infraestructura con docker compose, migra, siembra y deja la app corriendo.
# Uso:  bash deploy/arranque-compose.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 1/5 dependencias"
[ -d node_modules ] || npm install

echo "==> 2/5 .env"
[ -f .env ] || cp .env.example .env

echo "==> 3/5 infraestructura (postgres, redis, kafka, observabilidad)"
docker compose up -d postgres redis kafka prometheus grafana tempo loki alloy

echo "==> esperando a PostgreSQL y Kafka..."
until docker compose exec -T postgres pg_isready -U ticketright -d ticketright >/dev/null 2>&1; do sleep 2; done
sleep 15  # Kafka KRaft tarda en quedar listo

echo "==> 4/5 migración y semilla"
npm run db:migrate -w @ticketright/ventas
npm run db:seed -w @ticketright/ventas

echo "==> 5/5 aplicación de ventas (en segundo plano)"
nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &
sleep 8
curl -s localhost:3000/health && echo " <- API arriba"

cat <<'FIN'

Listo. Accesos (usa la pestaña PORTS de Codespaces para abrirlos):
  API + /metrics   -> 3000     Portal (prototipo) -> 3000/portal
  Grafana          -> 3001     (admin/admin)
  Prometheus       -> 9090
Recorrido de prueba:  node apps/ventas/scripts/recorrido-con-fila.mjs
Tráfico de demo:      node apps/ventas/scripts/trafico-demo.mjs
FIN
