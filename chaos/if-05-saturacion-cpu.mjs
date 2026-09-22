// IF-05 — Saturación de CPU en un componente crítico (aquí, la base de inventario).
// Hipótesis: bajo presión de CPU aumenta la latencia/espera, pero las compras en curso
// conservan su tasa de finalización (degradación controlada, no caída), y al retirar la
// presión el sistema vuelve a la línea base sin sobreventa ni discrepancias.
//
// Mecanismo (equivalente docker-compose a StressChaos): el orquestador de PowerShell
// limita la CPU del contenedor de PostgreSQL con `docker update --cpus` durante la fase
// "durante" y la restaura antes de "recuperar". Este script genera la carga de compras y
// mide latencia de reserva (P95) y finalización.
import { randomUUID } from "node:crypto";

import { api, comprar, dormir, fotoMetricas, imprimirFoto, prom, LOCALIDADES } from "./lib.mjs";

const fase = process.argv[2] ?? "estable";
const LOTE = 8; // compras concurrentes por fase, cada una de un fan distinto

async function lote(nombre) {
  const t0 = Date.now();
  const resultados = await Promise.all(
    // Ocho fans distintos: con uno solo, el borde de seguridad (AD-004) lo reta como bot.
    Array.from({ length: LOTE }, () => comprar(LOCALIDADES.norte, 1, randomUUID())),
  );
  const ms = Date.now() - t0;
  const emitidas = resultados.filter((r) => r.paso === "emitida").length;
  const p95 = await prom("histogram_quantile(0.95, sum by (le) (rate(ticketright_reservation_duration_seconds_bucket[1m])))");
  console.log(`  [${nombre}] ${emitidas}/${LOTE} compras emitidas en ${ms}ms; P95 reserva ~ ${Number(p95).toFixed(3)}s`);
  return { emitidas, ms, p95: Number(p95) };
}

if (fase === "estable") {
  console.log("== IF-05 fase ESTABLE (antes) ==");
  const foto = await fotoMetricas();
  imprimirFoto("estado estable", foto);
  const r = await lote("estable");
  // La línea base debe completar todo el lote.
  process.exit(r.emitidas === LOTE ? 0 : 1);
}

if (fase === "durante") {
  console.log("== IF-05 fase DURANTE (CPU de la base restringida) ==");
  const r = await lote("durante");
  const foto = await fotoMetricas();
  console.log(`  finalización: ${r.emitidas}/${LOTE}`);
  console.log(`  sobreventa: ${foto.sobreventa} (esperado 0)`);
  console.log(`  discrepancias: ${foto.discrepancias_abiertas} (esperado 0)`);
  // Bajo saturación admitimos degradación (más lento), pero: nada de sobreventa ni
  // discrepancias, y las compras siguen completándose (aquí exigimos ≥ 75%).
  const ok = foto.sobreventa === 0 && foto.discrepancias_abiertas === 0 && r.emitidas >= Math.ceil(LOTE * 0.75);
  console.log(`\n(parcial) durante -> ${ok ? "OK" : "REVISAR"} (finalización ${r.emitidas}/${LOTE})`);
  process.exit(ok ? 0 : 1);
}

if (fase === "recuperar") {
  console.log("== IF-05 fase RECUPERAR (CPU restaurada) ==");
  await dormir(3000);
  const r = await lote("recuperar");
  const foto = await fotoMetricas();
  imprimirFoto("después de recuperar", foto);
  const ok = r.emitidas === LOTE && foto.sobreventa === 0;
  console.log(`\nRESULTADO IF-05: ${ok ? "APROBADO" : "FALLIDO"}`);
  process.exit(ok ? 0 : 1);
}

console.log(`fase desconocida: ${fase}`);
process.exit(2);
