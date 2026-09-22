-- Rol de la cuenta de fan (cliente | promotor | operacion). Homólogo local de los grupos de
-- Cognito (AD-004): la autorización de las vistas internas (Promotor, Operación) se decide por
-- el rol que porta la sesión, no por el cliente. Aditivo y con valor por defecto seguro.
alter table cuentas add column if not exists rol text not null default 'cliente'
  check (rol in ('cliente', 'promotor', 'operacion'));
