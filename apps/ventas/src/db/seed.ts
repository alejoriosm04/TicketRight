import { randomUUID } from "node:crypto";

import { cargarConfig } from "../config.js";
import { crearPool } from "./connection.js";

// Catálogo de demostración de TicketRight: eventos reales en recintos colombianos, cada uno
// con las localidades propias de su recinto. Los datos son sintéticos/[S] pero verosímiles;
// sirven para mostrar la plataforma funcionando como una ticketera real.
//
// La localidad sigue siendo la autoridad del aforo (AD-003). El aforo total del recinto
// mantiene el orden de magnitud de la volumetría (miles de boletas).

interface LocalidadSemilla { nombre: string; tipo: "general" | "numerada"; precioPesos: number; aforo: number; }
interface EventoSemilla {
  id: string;
  nombre: string;
  artista: string;
  recinto: string;
  ciudad: string;
  fecha: string;          // ISO
  categoria: string;
  descripcion: string;
  imagen: string;         // gradiente CSS para la portada
  destacado: boolean;
  localidades: LocalidadSemilla[];
}

// Plantillas de recinto (mismo patrón que usaría cada tipo de venue).
const ESTADIO = (base: number): LocalidadSemilla[] => [
  { nombre: "Occidental", tipo: "numerada", precioPesos: base * 2.4, aforo: 1200 },
  { nombre: "Oriental", tipo: "numerada", precioPesos: base * 2.0, aforo: 1400 },
  { nombre: "Norte", tipo: "general", precioPesos: base, aforo: 3000 },
  { nombre: "Sur", tipo: "general", precioPesos: base, aforo: 3000 },
  { nombre: "Grama / Field", tipo: "general", precioPesos: base * 1.6, aforo: 2500 },
];
const COLISEO = (base: number): LocalidadSemilla[] => [
  { nombre: "Platea VIP", tipo: "numerada", precioPesos: base * 2.2, aforo: 600 },
  { nombre: "Tribuna Baja", tipo: "numerada", precioPesos: base * 1.5, aforo: 1800 },
  { nombre: "Tribuna Alta", tipo: "general", precioPesos: base, aforo: 2400 },
  { nombre: "General", tipo: "general", precioPesos: base * 0.8, aforo: 2000 },
];
const TEATRO = (base: number): LocalidadSemilla[] => [
  { nombre: "Luneta Centro", tipo: "numerada", precioPesos: base * 1.6, aforo: 384 },
  { nombre: "Luneta Derecha", tipo: "numerada", precioPesos: base * 1.6, aforo: 181 },
  { nombre: "Luneta Izquierda", tipo: "numerada", precioPesos: base * 1.6, aforo: 180 },
  { nombre: "Balcón Centro", tipo: "numerada", precioPesos: base * 1.3, aforo: 384 },
  { nombre: "Balcón Lateral", tipo: "general", precioPesos: base, aforo: 573 },
];

const EVENTOS: EventoSemilla[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    nombre: "Shakira — Las Mujeres Ya No Lloran World Tour",
    artista: "Shakira", recinto: "Estadio El Campín", ciudad: "Bogotá",
    fecha: "2026-03-21T20:00:00-05:00", categoria: "Conciertos", destacado: true,
    descripcion: "La loba colombiana regresa a casa con su gira mundial. Una noche de himnos, energía y orgullo barranquillero en el estadio más grande de Bogotá.",
    imagen: "linear-gradient(135deg,#7c3aed,#ec4899)",
    localidades: ESTADIO(180000),
  },
  {
    id: "11111111-1111-4111-8111-111111111112",
    nombre: "Karol G — Mañana Será Bonito Fest",
    artista: "Karol G", recinto: "Estadio Atanasio Girardot", ciudad: "Medellín",
    fecha: "2026-04-11T20:00:00-05:00", categoria: "Conciertos", destacado: true,
    descripcion: "La Bichota llena su ciudad. Un festival de reguetón y pop urbano con la artista más escuchada de Colombia.",
    imagen: "linear-gradient(135deg,#e11d48,#f59e0b)",
    localidades: ESTADIO(160000),
  },
  {
    id: "11111111-1111-4111-8111-111111111113",
    nombre: "Taylor Swift — The Eras Tour",
    artista: "Taylor Swift", recinto: "Estadio El Campín", ciudad: "Bogotá",
    fecha: "2026-05-02T19:00:00-05:00", categoria: "Conciertos", destacado: true,
    descripcion: "Por primera vez en Colombia. Un recorrido por todas las eras de la artista, tres horas de espectáculo y sorpresas para los swifties.",
    imagen: "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
    localidades: ESTADIO(240000),
  },
  {
    id: "11111111-1111-4111-8111-111111111114",
    nombre: "Romeo Santos — Fórmula Vol. 4",
    artista: "Romeo Santos", recinto: "Coliseo MedPlus", ciudad: "Bogotá",
    fecha: "2026-03-28T21:00:00-05:00", categoria: "Conciertos", destacado: false,
    descripcion: "El Rey de la Bachata en una noche íntima y romántica. Los grandes éxitos de Aventura y su carrera como solista.",
    imagen: "linear-gradient(135deg,#b91c1c,#7c2d12)",
    localidades: COLISEO(150000),
  },
  {
    id: "11111111-1111-4111-8111-111111111115",
    nombre: "Calvin Harris — Live in Concert",
    artista: "Calvin Harris", recinto: "La Macarena", ciudad: "Medellín",
    fecha: "2026-06-14T22:00:00-05:00", categoria: "Festivales", destacado: false,
    descripcion: "El DJ y productor escocés trae su show de música electrónica con una producción visual de primer nivel.",
    imagen: "linear-gradient(135deg,#0891b2,#4f46e5)",
    localidades: COLISEO(130000),
  },
  {
    id: "11111111-1111-4111-8111-111111111116",
    nombre: "Feid — Ferxxocalipsis",
    artista: "Feid", recinto: "Estadio Atanasio Girardot", ciudad: "Medellín",
    fecha: "2026-04-25T20:00:00-05:00", categoria: "Conciertos", destacado: false,
    descripcion: "El Ferxxo enciende Medellín con su tour más grande. Reguetón verde de principio a fin.",
    imagen: "linear-gradient(135deg,#15803d,#65a30d)",
    localidades: ESTADIO(140000),
  },
  {
    id: "11111111-1111-4111-8111-111111111117",
    nombre: "Andrés Cepeda — Décimo Cuarto Tour",
    artista: "Andrés Cepeda", recinto: "Teatro Metropolitano", ciudad: "Medellín",
    fecha: "2026-05-16T20:00:00-05:00", categoria: "Teatro", destacado: false,
    descripcion: "Una velada de pop y balada colombiana con uno de los cantautores más queridos del país.",
    imagen: "linear-gradient(135deg,#334155,#0f766e)",
    localidades: TEATRO(120000),
  },
  {
    id: "11111111-1111-4111-8111-111111111118",
    nombre: "Millonarios vs. Atlético Nacional — Final",
    artista: "Liga BetPlay", recinto: "Estadio El Campín", ciudad: "Bogotá",
    fecha: "2026-06-28T17:00:00-05:00", categoria: "Deporte", destacado: false,
    descripcion: "El clásico del fútbol colombiano en una final vibrante. Vive la pasión desde la tribuna.",
    imagen: "linear-gradient(135deg,#1d4ed8,#065f46)",
    localidades: ESTADIO(90000),
  },
];

const pool = crearPool(cargarConfig().databaseUrl);

await pool.query(
  `truncate table titularidades, titulares, boletas, items_reserva, reservas, devoluciones,
   pagos, compras, discrepancias, outbox cascade`,
);
// Recrea el catálogo desde cero (localidades dependen de eventos).
await pool.query("delete from sillas");
await pool.query("delete from localidades");
await pool.query("delete from eventos");

let aforoTotal = 0;
for (const e of EVENTOS) {
  await pool.query(
    `insert into eventos (evento_id, nombre, artista, recinto, ciudad, fecha, categoria, descripcion, imagen, destacado)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [e.id, e.nombre, e.artista, e.recinto, e.ciudad, e.fecha, e.categoria, e.descripcion, e.imagen, e.destacado],
  );
  for (const l of e.localidades) {
    aforoTotal += l.aforo;
    await pool.query(
      `insert into localidades (localidad_id, evento_id, nombre, tipo, precio_centavos, aforo_autorizado, aforo_reservado, aforo_vendido)
       values ($1,$2,$3,$4,$5,$6,0,0)`,
      [randomUUID(), e.id, l.nombre, l.tipo, Math.round(l.precioPesos) * 100, l.aforo],
    );
  }
}

await pool.end();

console.log("catálogo de demostración listo:");
console.log(`  ${EVENTOS.length} eventos · ${aforoTotal.toLocaleString("es-CO")} boletas en total`);
for (const e of EVENTOS) {
  console.log(`  ${e.artista.padEnd(20)} ${e.recinto}, ${e.ciudad}`);
}
