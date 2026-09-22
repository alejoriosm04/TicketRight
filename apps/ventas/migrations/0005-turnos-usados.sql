-- Turno → Reserva es 1:0..1 (modelo de dominio): un turno admitido habilita como máximo una
-- reserva. El validador de admisión registra aquí el jti del JWT dentro de la misma
-- transacción de la reserva; si la reserva se rechaza, el rollback deja el turno disponible.
-- La llave primaria es la que impide usar el mismo turno dos veces, aun a la vez.
create table if not exists turnos_usados (
  turno_id uuid primary key,
  fan_id uuid not null,
  usado_en timestamptz not null default now()
);
