-- Nombre legible de la localidad, para tableros y evidencia (Oriental, Occidental, Sur, Norte).
-- Aditivo: no cambia el contrato del dominio, solo enriquece la lectura y la observabilidad.

alter table localidades add column if not exists nombre text;
