import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { cargarConfig } from "../config.js";
import { crearPool } from "./connection.js";

const directorio = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations",
);
const pool = crearPool(cargarConfig().databaseUrl);

await pool.query(
  "create table if not exists migraciones (nombre text primary key, aplicada_en timestamptz not null default now())",
);

const aplicadas = new Set(
  (await pool.query("select nombre from migraciones")).rows.map((fila) => fila.nombre as string),
);
const archivos = (await readdir(directorio)).filter((a) => a.endsWith(".sql")).sort();

for (const archivo of archivos) {
  if (aplicadas.has(archivo)) {
    continue;
  }
  const sql = await readFile(path.join(directorio, archivo), "utf8");
  await pool.query(sql);
  await pool.query("insert into migraciones (nombre) values ($1)", [archivo]);
  console.log(`migración aplicada: ${archivo}`);
}

await pool.end();
console.log("base de datos al día");
