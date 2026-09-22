import { cargarConfig } from "../config.js";
import { crearPool } from "./connection.js";

// Evento y localidades de la demo. Se modela un recinto con cuatro tribunas con
// nombre legible (Oriental, Occidental, Sur, Norte), como en un estadio o coliseo,
// para que los tableros y la evidencia se lean en lenguaje de ticketera.
export const EVENTO_DEMO = "11111111-1111-4111-8111-111111111111";

export const LOCALIDAD_ORIENTAL = "22222222-2222-4222-8222-222222222201";
export const LOCALIDAD_OCCIDENTAL = "22222222-2222-4222-8222-222222222202";
export const LOCALIDAD_SUR = "22222222-2222-4222-8222-222222222203";
export const LOCALIDAD_NORTE = "22222222-2222-4222-8222-222222222204";

interface LocalidadSemilla {
  id: string;
  nombre: string;
  tipo: "general" | "numerada";
  precioPesos: number;
  aforo: number;
}

// Aforos y precios [S] de demostración; suman 5.000 boletas, alineado con la
// volumetría (5.000 boletas del escenario de pico).
const LOCALIDADES: LocalidadSemilla[] = [
  { id: LOCALIDAD_ORIENTAL, nombre: "Oriental", tipo: "general", precioPesos: 320000, aforo: 800 },
  { id: LOCALIDAD_OCCIDENTAL, nombre: "Occidental", tipo: "general", precioPesos: 280000, aforo: 900 },
  { id: LOCALIDAD_SUR, nombre: "Sur", tipo: "general", precioPesos: 150000, aforo: 1650 },
  { id: LOCALIDAD_NORTE, nombre: "Norte", tipo: "general", precioPesos: 150000, aforo: 1650 },
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

for (const localidad of LOCALIDADES) {
  await pool.query(
    `insert into localidades (localidad_id, evento_id, nombre, tipo, precio_centavos, aforo_autorizado, aforo_reservado, aforo_vendido)
     values ($1, $2, $3, $4, $5, $6, 0, 0)
     on conflict (localidad_id) do update set
       nombre = excluded.nombre,
       tipo = excluded.tipo,
       precio_centavos = excluded.precio_centavos,
       aforo_autorizado = excluded.aforo_autorizado,
       aforo_reservado = 0,
       aforo_vendido = 0`,
    [localidad.id, EVENTO_DEMO, localidad.nombre, localidad.tipo, localidad.precioPesos * 100, localidad.aforo],
  );
}

await pool.end();

const aforoTotal = LOCALIDADES.reduce((suma, l) => suma + l.aforo, 0);
console.log("estado de demostración listo:");
console.log(`  evento ${EVENTO_DEMO} — recinto con ${aforoTotal} boletas`);
for (const l of LOCALIDADES) {
  console.log(`  ${l.nombre.padEnd(11)} ${l.id}  ($${l.precioPesos.toLocaleString("es-CO")}, aforo ${l.aforo})`);
}
console.log("  las tablas transaccionales quedaron vacías");
