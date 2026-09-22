-- Enriquecimiento del catálogo (para la plataforma tipo Ticketmaster) y cuentas de fan.
-- Aditivo: no cambia el contrato del dominio de ventas, solo enriquece lectura e identidad.

-- Campos de catálogo del evento (artista, recinto, ciudad, fecha, categoría, descripción).
alter table eventos add column if not exists artista text;
alter table eventos add column if not exists recinto text;
alter table eventos add column if not exists ciudad text;
alter table eventos add column if not exists fecha timestamptz;
alter table eventos add column if not exists categoria text;
alter table eventos add column if not exists descripcion text;
alter table eventos add column if not exists imagen text;         -- gradiente o url de portada
alter table eventos add column if not exists destacado boolean not null default false;

-- Cuentas de fan (contexto de identidad; homólogo local de Cognito). Los datos personales
-- van cifrados (AD-004): se guarda el correo en claro solo como identificador de login de la
-- demo, y nombre/documento cifrados.
create table if not exists cuentas (
  cuenta_id uuid primary key,
  correo text not null unique,
  clave_hash text not null,
  nombre_cifrado text,
  documento_cifrado text,
  creada_en timestamptz not null default now()
);
