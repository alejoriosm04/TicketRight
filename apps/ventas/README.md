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

## Rutas

| Método y ruta | Qué hace |
|---|---|
| `GET /health` | Estado del servicio |
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
