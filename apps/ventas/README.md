# @ticketright/ventas — composición de la aplicación

Servicio Fastify que compone el dominio de `@ticketright/sales`, la emisión de
`@ticketright/entitlements` y los adaptadores de PostgreSQL. Es el incremento 1 de la
[Entrega 3](../../docs/proyecto/03-implementacion/README.md): el caso de uso real
—reservar, pagar, confirmar y emitir— corriendo contra la base de datos.

## Arranque local

```bash
cp .env.example .env                 # una sola vez, desde la raíz del repo
docker compose up -d postgres        # PostgreSQL 18 en localhost:5433
npm install                          # desde la raíz
npm run db:migrate -w @ticketright/ventas
npm run db:seed -w @ticketright/ventas
npm run dev -w @ticketright/ventas   # API en http://localhost:3000
```

En otra terminal:

```bash
npm run e2e -w @ticketright/ventas   # reserva, paga y espera la emisión
```

El archivo `.env` (ignorado por git) trae la cadena de conexión y el perfil de la pasarela; el
puerto local es **5433** para no chocar con otros proyectos que usen el 5432.

## Probarlo a mano

La semilla carga ocho eventos con sus localidades; los ids de localidad se generan en cada
seed, así que se leen del catálogo. El fan de ejemplo es `88888888-8888-4888-8888-888888888888`.

```bash
curl -s localhost:3000/catalogo | jq '.eventos[0].localidades[] | {nombre, localidadId, disponibles}'
```

El token de admisión **solo** lo emite la sala de espera: `POST /fila/entrar` y luego
`GET /fila/:turnoId` hasta quedar `admitido`; la respuesta trae el JWT firmado (AD-004). El
token es del fan que entró a la fila y sirve para **una** reserva: si la reserva se confirma,
para otra hay que volver a la fila (si se rechaza por aforo, el turno sigue sirviendo). Un
token inventado, ajeno o ya usado responde `401`.

```bash
FAN=88888888-8888-4888-8888-888888888888
TURNO=$(curl -s localhost:3000/fila/entrar -H 'content-type: application/json' \
  -H 'user-agent: Mozilla/5.0' -d "{\"fanId\": \"$FAN\"}" | jq -r .turnoId)
TOKEN=$(curl -s localhost:3000/fila/$TURNO -H 'user-agent: Mozilla/5.0' | jq -r .token)
curl -s localhost:3000/compras -H 'content-type: application/json' -H 'user-agent: Mozilla/5.0' -d "{
  \"fanId\": \"$FAN\", \"tokenAdmision\": \"$TOKEN\",
  \"localidadId\": \"<localidadId del catálogo>\", \"cantidad\": 2
}"
```

Guarda el `compraId` y sigue con `POST /compras/<compraId>/pago` y
`GET /compras/<compraId>`.

## Cambiar de perfil y reiniciar

```bash
PASARELA_PERFIL=repetida npm run dev -w @ticketright/ventas   # o edita .env
npm run db:seed -w @ticketright/ventas                        # estado limpio para otra demo
docker compose down                                           # apagar PostgreSQL
```

## Rutas

| Método y ruta | Qué hace |
|---|---|
| `GET /health` | Estado del servicio |
| `GET /metrics` | Métricas en formato Prometheus |
| `POST /fila/entrar` | Entra a la sala de espera (`fanId`); devuelve un turno |
| `GET /fila/:turnoId` | Posición y estado en la fila; cuando queda `admitido` trae el token |
| `POST /compras` | Crea la reserva (`fanId`, `tokenAdmision`, `localidadId`, `cantidad` o `sillaIds`) |
| `POST /compras/:compraId/pago` | Inicia el pago con la pasarela simulada |
| `POST /pagos/webhook` | Recibe la confirmación de la pasarela (`pagoId`, `aprobado`) |
| `GET /compras/:compraId` | Estado de la compra, el pago, las boletas y las discrepancias |
| `POST /demo/pasarela/confirmar/:pagoId` | Fuerza la confirmación para la demo |

## Perfiles de la pasarela simulada

Se configuran con `PASARELA_PERFIL`:

| Perfil | Comportamiento |
|---|---|
| `normal` | Confirma tras el retraso configurado |
| `tardia` | Confirma después de 45 s (respuesta tardía) |
| `repetida` | Envía el mismo webhook dos veces con la misma clave de idempotencia |
| `rechaza` | Responde rechazado y deja la reserva cancelada |

## Piezas

- `src/adapters/postgres/repositories.ts`: repositorios de los cinco agregados de ventas.
- `src/adapters/postgres/ticket-issuer.ts`: realiza `EmisorDeBoletas` con el agregado
  `Boleta` de `entitlements` ([AD-008](../../docs/proyecto/decisiones/0008-boleta-en-derecho-de-asistencia.md)).
- `src/adapters/outbox.ts`: publica los eventos en la tabla `outbox` y los despacha.
- `src/adapters/simulated-gateway.ts`: pasarela simulada configurable (fallo de tercero).
- `src/adapters/jwt-admission.ts`: valida el JWT de admisión que firma la fila (AD-004).
- `src/db/connection.ts`: pool y `BaseTransaccional`, la unidad de trabajo que da a cada paso
  de la compra su `BEGIN`/`COMMIT` (AD-003).
- `src/main.ts`: composición, trabajador de expiración y cierre ordenado.
- `migrations/`: esquema SQL versionado.
- `tests/`: integración contra PostgreSQL real (concurrencia sobre el aforo y webhooks
  simultáneos). Corre con `DATABASE_URL` definido; sin base se omite.
