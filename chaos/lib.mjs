// Utilidades compartidas del arnés de inyección de fallos (Entrega 3, criterio 3).
// Consultan la observabilidad ya montada (Prometheus) y la API de ventas para
// medir el estado estable, la perturbación y la recuperación de cada experimento.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const API = process.env.API_URL ?? "http://127.0.0.1:3000";
const PROM = process.env.PROM_URL ?? "http://127.0.0.1:9090";

export const FAN = "88888888-8888-4888-8888-888888888888";

// Evento de la demo: el único cuyo token de admisión acepta ventas (EVENTO_DEMO en main.ts).
const EVENTO_DEMO = "11111111-1111-4111-8111-111111111111";

// Cuatro tribunas del evento de la demo. El seed genera ids nuevos en cada corrida, así que
// se resuelven por nombre desde el catálogo al cargar el arnés.
// Los ids resueltos se guardan en un archivo temporal: IF-03 carga el arnés con PostgreSQL
// en pausa, cuando el catálogo no responde, y usa los ids que dejó la fase anterior.
const CACHE_LOCALIDADES = path.join(os.tmpdir(), "ticketright-chaos-localidades.json");

async function resolverLocalidades() {
  // IF-02 carga el arnés mientras el proceso reinicia: se espera a la API hasta 60 s.
  let r;
  for (let intento = 0; intento < 60 && !r?.ok; intento += 1) {
    r = await fetch(`${API}/catalogo`, {
      headers: { "user-agent": "Mozilla/5.0 Chrome/120" },
      signal: AbortSignal.timeout(3000),
    }).catch(() => undefined);
    if (!r?.ok && existsSync(CACHE_LOCALIDADES)) {
      return JSON.parse(readFileSync(CACHE_LOCALIDADES, "utf8"));
    }
    if (!r?.ok) await new Promise((listo) => setTimeout(listo, 1000));
  }
  if (!r?.ok) throw new Error("no se pudo leer el catálogo en 60 s; ¿está arriba la app?");
  const { eventos } = await r.json();
  const evento = eventos.find((e) => e.eventoId === EVENTO_DEMO);
  if (!evento) throw new Error(`el catálogo no trae el evento de la demo ${EVENTO_DEMO}; corre el seed`);
  const porNombre = (nombre) => {
    const localidad = evento.localidades.find((l) => l.nombre === nombre);
    if (!localidad) throw new Error(`el evento de la demo no tiene la localidad «${nombre}»`);
    return localidad.localidadId;
  };
  const localidades = {
    oriental: porNombre("Tribuna Oriental"),
    occidental: porNombre("Tribuna Occidental"),
    sur: porNombre("Tribuna Sur"),
    norte: porNombre("Tribuna Norte"),
  };
  writeFileSync(CACHE_LOCALIDADES, JSON.stringify(localidades));
  return localidades;
}

export const LOCALIDADES = await resolverLocalidades();

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(metodo, ruta, cuerpo, fanId = FAN) {
  // Cabeceras de cliente legítimo: identidad (señal principal del borde) y UA de navegador,
  // para no ser tratado como bot por el borde de seguridad (AD-004).
  const init = { method: metodo, headers: { "x-fan-id": fanId, "user-agent": "Mozilla/5.0 Chrome/120" } };
  if (cuerpo !== undefined) {
    init.headers["content-type"] = "application/json";
    init.body = JSON.stringify(cuerpo);
  }
  const r = await fetch(`${API}${ruta}`, init);
  const texto = await r.text();
  const datos = texto ? JSON.parse(texto) : {};
  return { ok: r.ok, status: r.status, datos };
}

/** Consulta instantánea a Prometheus; devuelve el primer valor numérico o 0. */
export async function prom(query) {
  const url = `${PROM}/api/v1/query?query=${encodeURIComponent(query)}`;
  const r = await fetch(url);
  const j = await r.json();
  const res = j?.data?.result ?? [];
  if (res.length === 0) return 0;
  return Number(res[0].value[1]);
}

/** Consulta que devuelve todas las series (para desgloses por etiqueta). */
export async function promSeries(query) {
  const url = `${PROM}/api/v1/query?query=${encodeURIComponent(query)}`;
  const r = await fetch(url);
  const j = await r.json();
  return (j?.data?.result ?? []).map((s) => ({ labels: s.metric, value: Number(s.value[1]) }));
}

/** Espera hasta que la app responda /health o se agote el tiempo. */
export async function esperarApi(timeoutMs = 30000) {
  const fin = Date.now() + timeoutMs;
  while (Date.now() < fin) {
    try {
      const r = await fetch(`${API}/health`);
      if (r.ok) return true;
    } catch { /* reintentar */ }
    await dormir(1000);
  }
  return false;
}

/**
 * Recorrido completo de compra; devuelve el estado final de la compra. Las compras
 * concurrentes deben usar fans distintos: el borde de seguridad (AD-004) trata como bot a
 * una sola identidad que dispara varios recorridos a la vez.
 */
export async function comprar(localidadId, cantidad = 1, fanId = FAN) {
  const entrada = await api("POST", "/fila/entrar", { fanId }, fanId);
  const turnoId = entrada.datos.turnoId;
  let token;
  for (let i = 0; i < 15; i += 1) {
    const est = await api("GET", `/fila/${turnoId}`, undefined, fanId);
    if (est.datos.estado === "admitido") { token = est.datos.token; break; }
    await dormir(700);
  }
  if (!token) return { paso: "sin_admision" };
  const compra = await api("POST", "/compras", {
    fanId, tokenAdmision: token, localidadId, cantidad,
  }, fanId);
  if (!compra.ok) return { paso: "reserva_rechazada", status: compra.status, error: compra.datos };
  await api("POST", `/compras/${compra.datos.compraId}/pago`, {}, fanId);
  for (let i = 0; i < 15; i += 1) {
    await dormir(600);
    const est = await api("GET", `/compras/${compra.datos.compraId}`, undefined, fanId);
    if (est.datos.pago && est.datos.pago.estado !== "confirmado") {
      await api("POST", `/demo/pasarela/confirmar/${est.datos.pago.pagoId}`, undefined, fanId);
    }
    if (est.datos.compra?.paso === "emitida" || est.datos.compra?.paso === "compensada") {
      return { paso: est.datos.compra.paso, compraId: compra.datos.compraId, estado: est.datos };
    }
  }
  const final = await api("GET", `/compras/${compra.datos.compraId}`, undefined, fanId);
  return { paso: final.datos.compra?.paso ?? "desconocido", compraId: compra.datos.compraId, estado: final.datos };
}

/** Toma una foto de las métricas clave para la bitácora. */
export async function fotoMetricas() {
  return {
    ventas_cop: Math.round((await prom("sum(ticketright_sales_amount_total)")) / 100),
    pagos_confirmados: await prom('sum(ticketright_payments_total{state="confirmado"})'),
    pagos_rechazados: await prom('sum(ticketright_payments_total{state="rechazado"})'),
    pagos_en_curso: await prom("ticketright_payments_in_flight"),
    boletas_emitidas: await prom('sum(ticketright_ticket_state_transitions_total{state="emitida"})'),
    discrepancias_abiertas: await prom("ticketright_open_discrepancies"),
    edad_discrepancia_s: await prom("ticketright_oldest_discrepancy_age_seconds"),
    sobreventa: await prom("sum(ticketright_oversell_total)"),
    reservas_ok: await prom('sum(ticketright_reservations_total{result="ok"})'),
    reservas_rechazadas: await prom('sum(ticketright_reservations_total{result="rechazada"})'),
    errores_reserva: await prom("sum(ticketright_reservation_errors_total)"),
    reserva_p95_s: await prom("histogram_quantile(0.95, sum by (le) (rate(ticketright_reservation_duration_seconds_bucket[1m])))"),
    cpu_nucleos: await prom("rate(ticketright_process_cpu_seconds_total[1m])"),
    pg_conexiones: await prom('ticketright_pg_pool_connections{state="total"}'),
  };
}

/**
 * Foto tomada después de dos ciclos de medición: el colector recalcula los gauges y la
 * sobreventa cada 5 s y Prometheus raspa cada 5 s. Sin esta espera, la foto posterior a una
 * perturbación puede leer el valor de antes.
 */
export async function fotoAsentada() {
  await dormir(11000);
  return fotoMetricas();
}

export function imprimirFoto(titulo, foto) {
  console.log(`\n--- ${titulo} ---`);
  for (const [k, v] of Object.entries(foto)) {
    console.log(`  ${k.padEnd(22)} ${v}`);
  }
}
