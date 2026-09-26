#!/usr/bin/env bash
# Arranque para DEMO EN VIVO: igual que arranque-compose.sh, pero deja las métricas "en 0"
# y SIN la sonda sintética, para que los tableros solo se muevan cuando tú uses la app.
#
# Diferencia con arranque-compose.sh:
#   - Resiembra la base (métricas de negocio en 0 al arrancar).
#   - Arranca la app con SONDA_INTERVALO_MS muy alto → la sonda no corre durante la demo.
#
# Cuándo usar cuál:
#   - arranque-demo-limpia.sh  -> para mostrar cómo cambian las métricas comprando en vivo.
#   - arranque-compose.sh      -> arranque normal (con la sonda de disponibilidad activa).
#
# Uso:  bash deploy/arranque-demo-limpia.sh
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

echo "==> 4/5 migración y semilla (deja las métricas de negocio en 0)"
npm run db:migrate -w @ticketright/ventas
npm run db:seed -w @ticketright/ventas

echo "==> parando cualquier app previa"
pkill -f "tsx src/main.ts" 2>/dev/null || true
sleep 2

echo "==> 5/5 aplicación de ventas SIN sonda sintética (en segundo plano)"
# SONDA_INTERVALO_MS gigante = la sonda no ejecuta recorridos durante la demo,
# así los tableros solo cambian con las compras que hagas tú en /app.
SONDA_INTERVALO_MS=999999999 nohup npm run dev -w @ticketright/ventas > observability/logs/ventas-run.log 2>&1 &
sleep 8
curl -s localhost:3000/health && echo " <- API arriba (modo demo: sin sonda, métricas en 0)"

cat <<'FIN'

Listo para la DEMO EN VIVO. Las métricas están en 0 y solo se moverán con lo que compres tú.
  App /app         -> 3000/app       Grafana -> 3001 (admin/admin)
  Prometheus       -> 9090
Tip: en Grafana pon el rango en "Last 15 minutes". Compra en /app y observa el tablero.

Cuando quieras volver al arranque normal (con la sonda de disponibilidad):
  pkill -f "tsx src/main.ts"
  bash deploy/arranque-compose.sh
FIN
