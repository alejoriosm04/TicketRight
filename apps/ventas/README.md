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

Con la semilla cargada, el recinto tiene cuatro tribunas con 5.000 boletas en total:

| Tribuna | Id | Precio · aforo |
|---|---|---|
| Oriental | `22222222-2222-4222-8222-222222222201` | $320.000 · 800 |
| Occidental | `22222222-2222-4222-8222-222222222202` | $280.000 · 900 |
| Sur | `22222222-2222-4222-8222-222222222203` | $150.000 · 1650 |
| Norte | `22222222-2222-4222-8222-222222222204` | $150.000 · 1650 |
| Fan de ejemplo | `88888888-8888-4888-8888-888888888888` | — |

El token de admisión sale de la sala de espera (`POST /fila/entrar` → `GET /fila/:turnoId`
hasta quedar `admitido`); en la demo también sirve cualquier `turno:<uuid>`.

```bash
curl -s localhost:3000/compras -H 'content-type: application/json' -d '{
  "fanId": "88888888-8888-4888-8888-888888888888",
  "tokenAdmision": "turno:99999999-9999-4999-8999-999999999999",
  "localidadId": "22222222-2222-4222-8222-222222222203",
  "cantidad": 2
}'
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
- `src/adapters/demo-admission.ts`: validador de admisión de demostración (`turno:<uuid>`);
  se reemplaza cuando exista el servicio de admisión real.
- `src/main.ts`: composición, trabajador de expiración y cierre ordenado.
- `migrations/`: esquema SQL versionado.
