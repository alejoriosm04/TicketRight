#!/usr/bin/env bash
# Corre un escenario de carga de principio a fin y deja la evidencia en load/resultados/.
#
#   bash load/correr.sh pico
#   ESCALA=0.1 bash load/correr.sh pico
#   MULTIPLICADOR=1.5 bash load/correr.sh estres
#   DURACION=30m bash load/correr.sh resistencia
#
# 1. Resiembra la base (¡borra reservas, pagos y boletas!) y crea la localidad de carga
#    con el aforo escalado: 5.000 boletas × ESCALA.
# 2. Corre k6 (binario local si existe; si no, la imagen grafana/k6 por Docker).
# 3. Verifica en PostgreSQL que no hubo sobreventa ni turnos reutilizados.
# La app debe estar arriba en API_URL (por defecto http://127.0.0.1:3000).
set -euo pipefail
cd "$(dirname "$0")/.."

ESCENARIO="${1:-pico}"
ESCALA="${ESCALA:-0.05}"
MULTIPLICADOR="${MULTIPLICADOR:-1}"
API_URL="${API_URL:-http://127.0.0.1:3000}"
AFORO=$(node -e "console.log(Math.max(1, Math.round(5000 * ${ESCALA})))")
MARCA="$(date +%Y%m%d-%H%M%S)-${ESCENARIO}-e${ESCALA}-x${MULTIPLICADOR}"
mkdir -p load/resultados

curl -sf "${API_URL}/health" >/dev/null || { echo "la app no responde en ${API_URL}"; exit 1; }

echo "==> 1/3 base limpia y localidad de carga (aforo ${AFORO})"
npm run db:seed -w @ticketright/ventas >/dev/null
node --env-file-if-exists=.env load/inventario.mjs preparar "${AFORO}"

echo "==> 2/3 k6 · ${ESCENARIO} · escala ${ESCALA} · ×${MULTIPLICADOR}"
VARIABLES=(-e ESCENARIO="${ESCENARIO}" -e ESCALA="${ESCALA}" -e MULTIPLICADOR="${MULTIPLICADOR}"
  -e API_URL="${API_URL}")
for opcional in DURACION TASA CONSULTA_FILA_S ABANDONO ESPERA_MAX_S; do
  [ -n "${!opcional:-}" ] && VARIABLES+=(-e "${opcional}=${!opcional}")
done
set +e
if command -v k6 >/dev/null; then
  k6 run "${VARIABLES[@]}" --summary-export "load/resultados/${MARCA}.k6.json" load/ticketright.js
else
  # --network host: el contenedor ve la app en 127.0.0.1 (Linux y Codespaces).
  docker run --rm --network host -u "$(id -u):$(id -g)" -v "${PWD}/load:/load" grafana/k6 run \
    "${VARIABLES[@]}" --summary-export "/load/resultados/${MARCA}.k6.json" /load/ticketright.js
fi
K6=$?

echo "==> 3/3 inventario en PostgreSQL"
node --env-file-if-exists=.env load/inventario.mjs verificar "load/resultados/${MARCA}.inventario.json"
INVENTARIO=$?
set -e

echo
echo "resultados: load/resultados/${MARCA}.*.json"
echo "umbrales de k6:  $([ ${K6} -eq 0 ] && echo cumplidos || echo 'NO cumplidos (ver arriba)')"
echo "inventario (A-2): $([ ${INVENTARIO} -eq 0 ] && echo 'sin sobreventa' || echo FALLA)"
exit $(( K6 != 0 || INVENTARIO != 0 ))
