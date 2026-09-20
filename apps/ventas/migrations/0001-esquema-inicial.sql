-- Esquema inicial de la composición de ventas (Entrega 3, incremento 1).

create table if not exists migraciones (
  nombre text primary key,
  aplicada_en timestamptz not null default now()
);

create table if not exists eventos (
  evento_id uuid primary key,
  nombre text not null
);

create table if not exists localidades (
  localidad_id uuid primary key,
  evento_id uuid not null references eventos(evento_id),
  tipo text not null check (tipo in ('numerada', 'general')),
  precio_centavos integer not null check (precio_centavos >= 0),
  moneda text not null default 'COP',
  aforo_autorizado integer not null check (aforo_autorizado >= 0),
  aforo_reservado integer not null default 0 check (aforo_reservado >= 0),
  aforo_vendido integer not null default 0 check (aforo_vendido >= 0),
  check (aforo_reservado + aforo_vendido <= aforo_autorizado)
);

create table if not exists sillas (
  silla_id uuid primary key,
  localidad_id uuid not null references localidades(localidad_id),
  fila text not null,
  numero text not null,
  estado text not null check (estado in ('libre', 'reservada', 'vendida', 'bloqueada'))
);

create table if not exists reservas (
  reserva_id uuid primary key,
  fan_id uuid not null,
  turno_id uuid not null,
  estado text not null check (estado in ('vigente', 'enPago', 'confirmada', 'vencida', 'cancelada')),
  creada_en timestamptz not null,
  vence_en timestamptz not null,
  total_centavos integer not null
);

create index if not exists reservas_vence_en on reservas (vence_en) where estado in ('vigente', 'enPago');

create table if not exists items_reserva (
  item_id uuid primary key,
  reserva_id uuid not null references reservas(reserva_id) on delete cascade,
  localidad_id uuid not null,
  silla_id uuid,
  cantidad integer not null check (cantidad > 0),
  valor_nominal_centavos integer not null,
  cargo_servicio_centavos integer not null,
  contribucion_parafiscal_centavos integer not null,
  moneda text not null default 'COP'
);

create table if not exists pagos (
  pago_id uuid primary key,
  origen_tipo text not null check (origen_tipo in ('reserva', 'reventa')),
  origen_id uuid not null,
  monto_centavos integer not null check (monto_centavos > 0),
  moneda text not null default 'COP',
  medio text not null,
  estado text not null,
  clave_idempotencia text not null unique,
  referencia_externa text,
  iniciado_en timestamptz not null,
  confirmado_en timestamptz
);

create index if not exists pagos_origen on pagos (origen_id);

create table if not exists devoluciones (
  devolucion_id uuid primary key,
  pago_id uuid not null references pagos(pago_id),
  boleta_id uuid,
  motivo text not null,
  monto_centavos integer not null,
  moneda text not null default 'COP',
  estado text not null,
  solicitada_en timestamptz not null,
  resuelta_en timestamptz
);

create table if not exists compras (
  compra_id uuid primary key,
  reserva_id uuid not null unique,
  fan_id uuid not null,
  identidad_ref text not null,
  pago_id uuid unique,
  paso text not null,
  intentos integer not null default 0,
  actualizado_en timestamptz not null
);

create table if not exists discrepancias (
  discrepancia_id uuid primary key,
  tipo text not null,
  pago_id uuid not null,
  boleta_id uuid,
  detectada_en timestamptz not null,
  resuelta_en timestamptz,
  resolucion text
);

create table if not exists boletas (
  boleta_id uuid primary key,
  evento_id uuid not null,
  localidad_id uuid not null,
  silla_id uuid,
  pago_id uuid not null,
  precio_nominal_centavos integer not null,
  moneda text not null default 'COP',
  codigo text not null,
  version integer not null,
  estado text not null check (estado in ('emitida', 'transferida', 'revendida', 'anulada')),
  emitida_en timestamptz not null,
  anulada_en timestamptz
);

create index if not exists boletas_pago on boletas (pago_id);

create table if not exists titulares (
  titular_id uuid primary key,
  fan_id uuid not null,
  identidad_ref text not null,
  estado text not null check (estado in ('activo', 'anterior'))
);

create table if not exists titularidades (
  titularidad_id uuid primary key,
  boleta_id uuid not null references boletas(boleta_id) on delete cascade,
  titular_id uuid not null references titulares(titular_id),
  inicio timestamptz not null,
  fin timestamptz,
  estado text not null check (estado in ('activa', 'finalizada'))
);

create index if not exists titularidades_boleta on titularidades (boleta_id);

create table if not exists outbox (
  evento_id uuid primary key,
  tipo text not null,
  payload jsonb not null,
  ocurrido_en timestamptz not null,
  clave_idempotencia text not null,
  publicado_en timestamptz
);

create index if not exists outbox_pendientes on outbox (ocurrido_en) where publicado_en is null;
