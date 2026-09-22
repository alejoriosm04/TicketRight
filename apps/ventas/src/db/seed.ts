import { randomUUID } from "node:crypto";

import { cargarConfig } from "../config.js";
import { crearPool } from "./connection.js";
import { ServicioDeCuentas } from "../security/accounts.js";

// Catálogo de demostración de TicketRight: eventos de entretenimiento reales en recintos
// colombianos, cada uno con la distribución de localidades propia de su recinto. Los datos son
// sintéticos/[S] pero verosímiles; sirven para mostrar la plataforma funcionando como una
// ticketera real (estilo Ticketmaster).
//
// La localidad es la autoridad del aforo (AD-003). Todas las localidades de la demo son de
// admisión GENERAL (venta por cantidad, no por silla numerada): el prototipo vende por zona y
// cantidad, y el modelo de dominio soporta ese camino sin necesidad de poblar sillas.

interface LocalidadSemilla { nombre: string; precioPesos: number; aforo: number; }
interface EventoSemilla {
  id: string;
  nombre: string;
  artista: string;
  recinto: string;
  ciudad: string;
  fecha: string;          // ISO
  categoria: string;
  descripcion: string;
  imagen: string;         // ruta a la imagen de portada (banner) o gradiente CSS de respaldo
  destacado: boolean;
  localidades: LocalidadSemilla[];
}

// ---- Plantillas de recinto: cada recinto reparte sus localidades de forma distinta ----
// Todas GENERAL para la demo; el precio base (en pesos) escala por zona.

// Estadio grande (El Campín, Atanasio): tribunas + campo.
const ESTADIO = (base: number): LocalidadSemilla[] => [
  { nombre: "Palco VIP", precioPesos: base * 2.6, aforo: 800 },
  { nombre: "Tribuna Occidental", precioPesos: base * 2.0, aforo: 1500 },
  { nombre: "Tribuna Oriental", precioPesos: base * 1.7, aforo: 1600 },
  { nombre: "Grama / Field", precioPesos: base * 1.9, aforo: 2500 },
  { nombre: "Tribuna Norte", precioPesos: base, aforo: 3000 },
  { nombre: "Tribuna Sur", precioPesos: base, aforo: 3000 },
];
// Arena / music hall techado (Vive Claro Music Hall): pista + gradería + palcos.
const ARENA = (base: number): LocalidadSemilla[] => [
  { nombre: "Palcos Premium", precioPesos: base * 2.4, aforo: 500 },
  { nombre: "Pista (de pie)", precioPesos: base * 1.8, aforo: 3000 },
  { nombre: "Gradería Numerada", precioPesos: base * 1.4, aforo: 2200 },
  { nombre: "General", precioPesos: base, aforo: 2600 },
];
// Coliseo cubierto (MedPlus, La Macarena): platea + tribunas.
const COLISEO = (base: number): LocalidadSemilla[] => [
  { nombre: "Platea VIP", precioPesos: base * 2.2, aforo: 600 },
  { nombre: "Tribuna Baja", precioPesos: base * 1.5, aforo: 1800 },
  { nombre: "Tribuna Alta", precioPesos: base, aforo: 2400 },
  { nombre: "Balcón", precioPesos: base * 0.85, aforo: 1500 },
];
// Teatro (Metropolitano): luneta + balcón + palcos.
const TEATRO = (base: number): LocalidadSemilla[] => [
  { nombre: "Palcos", precioPesos: base * 1.8, aforo: 120 },
  { nombre: "Luneta", precioPesos: base * 1.6, aforo: 745 },
  { nombre: "Balcón Central", precioPesos: base * 1.3, aforo: 384 },
  { nombre: "Balcón Lateral", precioPesos: base, aforo: 320 },
];
// Festival al aire libre (Corferias): fases + zonas por día/experiencia.
const FESTIVAL = (base: number): LocalidadSemilla[] => [
  { nombre: "VIP Experience", precioPesos: base * 2.5, aforo: 1000 },
  { nombre: "Abono 2 días", precioPesos: base * 1.7, aforo: 4000 },
  { nombre: "General Día 1", precioPesos: base, aforo: 5000 },
  { nombre: "General Día 2", precioPesos: base, aforo: 5000 },
];

const EVENTOS: EventoSemilla[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    nombre: "Shakira — Las Mujeres Ya No Lloran World Tour",
    artista: "Shakira", recinto: "Estadio El Campín", ciudad: "Bogotá",
    fecha: "2026-03-21T20:00:00-05:00", categoria: "Conciertos", destacado: false,
    descripcion:
      "La loba colombiana regresa a casa con su gira mundial más ambiciosa. Un recorrido por tres décadas de éxitos — de «Pies Descalzos» a «Las Mujeres Ya No Lloran» — con una producción de estadio, cuerpo de baile y sorpresas para su público de siempre. Apertura de puertas dos horas antes; llega temprano para vivir la previa.",
    imagen: "linear-gradient(135deg,#7c3aed,#ec4899)",
    localidades: ESTADIO(180000),
  },
  {
    id: "11111111-1111-4111-8111-111111111112",
    nombre: "Karol G — Mañana Será Bonito Fest",
    artista: "Karol G", recinto: "Estadio Atanasio Girardot", ciudad: "Medellín",
    fecha: "2026-04-11T20:00:00-05:00", categoria: "Conciertos", destacado: false,
    descripcion:
      "La Bichota llena su ciudad. Un festival de reguetón y pop urbano con la artista más escuchada de Colombia, invitados sorpresa y el show visual que ha recorrido el mundo. Una noche para cantar de principio a fin en el corazón de Medellín.",
    imagen: "linear-gradient(135deg,#e11d48,#f59e0b)",
    localidades: ESTADIO(160000),
  },
  {
    id: "11111111-1111-4111-8111-111111111113",
    nombre: "Taylor Swift — The Eras Tour",
    artista: "Taylor Swift", recinto: "Estadio El Campín", ciudad: "Bogotá",
    fecha: "2026-05-02T19:00:00-05:00", categoria: "Conciertos", destacado: false,
    descripcion:
      "Por primera vez en Colombia. Un viaje por todas las eras de la artista: más de tres horas de espectáculo, 40 canciones, cambios de vestuario y las «surprise songs» de cada noche. El fenómeno cultural que agotó estadios en cuatro continentes llega a Bogotá.",
    imagen: "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
    localidades: ESTADIO(240000),
  },
  {
    id: "11111111-1111-4111-8111-111111111114",
    nombre: "Los Fabulosos Cadillacs — LFC Tour 2026 · 40 Aniversario",
    artista: "Los Fabulosos Cadillacs", recinto: "Vive Claro Music Hall", ciudad: "Bogotá",
    fecha: "2026-10-17T20:00:00-05:00", categoria: "Conciertos", destacado: true,
    descripcion:
      "Cuatro décadas de la banda de ska-rock más querida de Latinoamérica. «Matador», «El Genio del Dub», «Vasos Vacíos» y toda una vida de himnos, con 2 Minutos como banda invitada. Presenta Páramo, en el nuevo Vive Claro Music Hall.",
    imagen: "img/fabulosos-cadillacs.png",
    localidades: ARENA(150000),
  },
  {
    id: "11111111-1111-4111-8111-111111111115",
    nombre: "Calvin Harris — Live in Bogotá",
    artista: "Calvin Harris", recinto: "Coliseo MedPlus", ciudad: "Bogotá",
    fecha: "2026-11-13T22:00:00-05:00", categoria: "Festivales", destacado: true,
    descripcion:
      "El DJ y productor escocés detrás de «Summer», «Feel So Close» y «One Kiss» trae su show de música electrónica con una producción visual de primer nivel. Special guests: Tyson O'Brien y Martin Trevy. Una noche de festival dentro del Coliseo MedPlus.",
    imagen: "img/calvin-harris.png",
    localidades: COLISEO(140000),
  },
  {
    id: "11111111-1111-4111-8111-111111111116",
    nombre: "Feid — Ferxxocalipsis",
    artista: "Feid", recinto: "Estadio Atanasio Girardot", ciudad: "Medellín",
    fecha: "2026-04-25T20:00:00-05:00", categoria: "Conciertos", destacado: false,
    descripcion:
      "El Ferxxo enciende Medellín con el tour más grande de su carrera. Reguetón verde de principio a fin, invitados de la escena urbana y la energía de una ciudad entera cantando en casa.",
    imagen: "linear-gradient(135deg,#15803d,#65a30d)",
    localidades: ESTADIO(140000),
  },
  {
    id: "11111111-1111-4111-8111-111111111117",
    nombre: "Andrés Cepeda — Décimo Cuarto Tour",
    artista: "Andrés Cepeda", recinto: "Teatro Metropolitano", ciudad: "Medellín",
    fecha: "2026-05-16T20:00:00-05:00", categoria: "Teatro", destacado: false,
    descripcion:
      "Una velada íntima de pop y balada colombiana con uno de los cantautores más queridos del país. Su repertorio de siempre y las canciones de su nuevo álbum, en la acústica perfecta del Teatro Metropolitano.",
    imagen: "linear-gradient(135deg,#334155,#0f766e)",
    localidades: TEATRO(120000),
  },
  {
    id: "11111111-1111-4111-8111-111111111118",
    nombre: "BAUM Festival 2027 — Los Bajos en el Pecho",
    artista: "BAUM Festival", recinto: "Corferias", ciudad: "Bogotá",
    fecha: "2027-02-12T14:00:00-05:00", categoria: "Festivales", destacado: true,
    descripcion:
      "Dos días de música electrónica de vanguardia en Corferias. El festival de referencia de la escena techno y house en Colombia, con line-up internacional, varios escenarios y una producción audiovisual inmersiva. Los bajos en el pecho, 12 y 13 de febrero.",
    imagen: "img/baum-festival.png",
    localidades: FESTIVAL(130000),
  },
];

// ---- Cuentas de demostración (una por rol) para mostrar la autorización por sesión ----
const CUENTAS_DEMO: { correo: string; clave: string; nombre: string }[] = [
  { correo: "cliente@ticketright.co", clave: "cliente123", nombre: "Quinnie Villa" },
  { correo: "promotor@ticketright.co", clave: "promotor123", nombre: "Equipo Promotor" },
  { correo: "operacion@ticketright.co", clave: "operacion123", nombre: "Centro de Operaciones" },
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
       values ($1,$2,$3,'general',$4,$5,0,0)`,
      [randomUUID(), e.id, l.nombre, Math.round(l.precioPesos) * 100, l.aforo],
    );
  }
}

// Cuentas de demostración (idempotente: ignora si ya existen).
const cuentas = new ServicioDeCuentas(
  pool,
  process.env.SESION_SECRET ?? "demo-secreto-sesion",
  process.env.ADMISION_SECRET ?? "demo-secreto-admision-ticketright",
);
await cuentas.inicializar();
for (const c of CUENTAS_DEMO) {
  try {
    await cuentas.registrar(c.correo, c.clave, c.nombre, "");
  } catch {
    /* ya existe: la demo se puede resembrar sin fallar */
  }
}

await pool.end();

console.log("catálogo de demostración listo:");
console.log(`  ${EVENTOS.length} eventos de entretenimiento · ${aforoTotal.toLocaleString("es-CO")} boletas en total`);
for (const e of EVENTOS) {
  console.log(`  ${e.artista.padEnd(26)} ${e.recinto}, ${e.ciudad}`);
}
console.log("cuentas de demostración (correo / clave / rol):");
console.log("  cliente@ticketright.co   / cliente123   / cliente");
console.log("  promotor@ticketright.co  / promotor123  / promotor");
console.log("  operacion@ticketright.co / operacion123 / operacion");
