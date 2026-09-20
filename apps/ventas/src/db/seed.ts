import { cargarConfig } from "../config.js";
import { crearPool } from "./connection.js";

export const EVENTO_DEMO = "11111111-1111-4111-8111-111111111111";
export const LOCALIDAD_GENERAL_DEMO = "22222222-2222-4222-8222-222222222222";
export const LOCALIDAD_NUMERADA_DEMO = "33333333-3333-4333-8333-333333333333";
export const SILLAS_DEMO = [
  "44444444-4444-4444-8444-444444444401",
  "44444444-4444-4444-8444-444444444402",
  "44444444-4444-4444-8444-444444444403",
  "44444444-4444-4444-8444-444444444404",
];

const pool = crearPool(cargarConfig().databaseUrl);

await pool.query(
  `truncate table titularidades, titulares, boletas, items_reserva, reservas, devoluciones,
   pagos, compras, discrepancias, outbox cascade`,
);

await pool.query(
  `insert into eventos (evento_id, nombre) values ($1, $2)
   on conflict (evento_id) do update set nombre = excluded.nombre`,
  [EVENTO_DEMO, "Concierto de demostración"],
);

await pool.query(
  `insert into localidades (localidad_id, evento_id, tipo, precio_centavos, aforo_autorizado, aforo_reservado, aforo_vendido)
   values ($1, $2, 'general', $3, 50, 0, 0)
   on conflict (localidad_id) do update set aforo_reservado = 0, aforo_vendido = 0`,
  [LOCALIDAD_GENERAL_DEMO, EVENTO_DEMO, 100000 * 100],
);

await pool.query(
  `insert into localidades (localidad_id, evento_id, tipo, precio_centavos, aforo_autorizado, aforo_reservado, aforo_vendido)
   values ($1, $2, 'numerada', $3, $4, 0, 0)
   on conflict (localidad_id) do update set aforo_reservado = 0, aforo_vendido = 0`,
  [LOCALIDAD_NUMERADA_DEMO, EVENTO_DEMO, 200000 * 100, SILLAS_DEMO.length],
);

for (const [indice, sillaId] of SILLAS_DEMO.entries()) {
  await pool.query(
    `insert into sillas (silla_id, localidad_id, fila, numero, estado)
     values ($1, $2, 'A', $3, 'libre')
     on conflict (silla_id) do update set estado = 'libre'`,
    [sillaId, LOCALIDAD_NUMERADA_DEMO, String(indice + 1)],
  );
}

await pool.end();

console.log("estado de demostración listo:");
console.log(`  evento            ${EVENTO_DEMO}`);
console.log(`  localidad general ${LOCALIDAD_GENERAL_DEMO}  ($100.000, aforo 50)`);
console.log(`  localidad numerada ${LOCALIDAD_NUMERADA_DEMO}  ($200.000, 4 sillas)`);
console.log("  las tablas transaccionales quedaron vacías");
