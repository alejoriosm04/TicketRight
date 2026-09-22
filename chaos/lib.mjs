// Utilidades compartidas del arnés de inyección de fallos (Entrega 3, criterio 3).
// Consultan la observabilidad ya montada (Prometheus) y la API de ventas para
// medir el estado estable, la perturbación y la recuperación de cada experimento.

const API = process.env.API_URL ?? "http://127.0.0.1:3000";
const PROM = process.env.PROM_URL ?? "http://127.0.0.1:9090";

// Cuatro tribunas del recinto de la demo.
export const LOCALIDADES = {
  oriental: "22222222-2222-4222-8222-222222222201",
  occidental: "22222222-2222-4222-8222-222222222202",
  sur: "22222222-2222-4222-8222-222222222203",
  norte: "22222222-2222-4222-8222-222222222204",
};
export const FAN = "88888888-8888-4888-8888-888888888888";

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(metodo, ruta, cuerpo) {
  // Cabeceras de cliente legítimo: identidad (señal principal del borde) y UA de navegador,
  // para no ser tratado como bot por el borde de seguridad (AD-004).
  const init = { method: metodo, headers: { "x-fan-id": FAN, "user-agent": "Mozilla/5.0 Chrome/120" } };
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

/** Recorrido completo de compra; devuelve el estado final de la compra. */
export async function comprar(localidadId, cantidad = 1) {
  const entrada = await api("POST", "/fila/entrar", { fanId: FAN });
  const turnoId = entrada.datos.turnoId;
  let token;
  for (let i = 0; i < 15; i += 1) {
    const est = await api("GET", `/fila/${turnoId}`);
    if (est.datos.estado === "admitido") { token = est.datos.token; break; }
    await dormir(700);
  }
  if (!token) return { paso: "sin_admision" };
  const compra = await api("POST", "/compras", {
    fanId: FAN, tokenAdmision: token, localidadId, cantidad,
  });
  if (!compra.ok) return { paso: "reserva_rechazada", status: compra.status, error: compra.datos };
  await api("POST", `/compras/${compra.datos.compraId}/pago`, {});
  for (let i = 0; i < 15; i += 1) {
    await dormir(600);
    const est = await api("GET", `/compras/${compra.datos.compraId}`);
    if (est.datos.pago && est.datos.pago.estado !== "confirmado") {
      await api("POST", `/demo/pasarela/confirmar/${est.datos.pago.pagoId}`);
    }
    if (est.datos.compra?.paso === "emitida" || est.datos.compra?.paso === "compensada") {
      return { paso: est.datos.compra.paso, compraId: compra.datos.compraId, estado: est.datos };
    }
  }
  const final = await api("GET", `/compras/${compra.datos.compraId}`);
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

export function imprimirFoto(titulo, foto) {
  console.log(`\n--- ${titulo} ---`);
  for (const [k, v] of Object.entries(foto)) {
    console.log(`  ${k.padEnd(22)} ${v}`);
  }
}
