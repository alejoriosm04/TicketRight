// Genera tráfico continuo con sala de espera para ver el tablero en movimiento:
// mucha gente entra a la fila (sesiones y espera suben), y a ritmo constante se
// admite, reserva, paga y emite. Ctrl+C para detener.
const base = process.env.API_URL ?? "http://127.0.0.1:3000";
const fan = "88888888-8888-4888-8888-888888888888";
const alAzar = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function pedir(metodo, ruta, cuerpo) {
  const headers = { "x-fan-id": fan, "user-agent": "Mozilla/5.0 Chrome/120" };
  if (cuerpo) headers["content-type"] = "application/json";
  const r = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  return { ok: r.ok, status: r.status, datos: t ? JSON.parse(t) : {} };
}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// Localidades reales del catálogo (ids dinámicos por seed).
const cat = await pedir("GET", "/catalogo");
const localidades = cat.datos.eventos.flatMap((e) => e.localidades.map((l) => l.localidadId));

let compras = 0;
let rechazos = 0;
console.log("tráfico con fila en marcha; Ctrl+C para detener");

// Hilo 1: mete gente a la fila y la lleva por el recorrido de compra.
async function comprador() {
  while (true) {
    try {
      const entrada = await pedir("POST", "/fila/entrar", { fanId: fan });
      const turnoId = entrada.datos.turnoId;
      // Consulta la posición unas cuantas veces (genera métricas de fila) y espera admisión.
      let token;
      for (let i = 0; i < 15; i += 1) {
        const est = await pedir("GET", `/fila/${turnoId}`);
        if (est.datos.estado === "admitido") { token = est.datos.token; break; }
        await dormir(800);
      }
      if (!token) continue;
      const c = await pedir("POST", "/compras", {
        fanId: fan, tokenAdmision: token, localidadId: alAzar(localidades),
        cantidad: 1 + Math.floor(Math.random() * 3),
      });
      if (!c.ok) { rechazos += 1; continue; }
      await pedir("POST", `/compras/${c.datos.compraId}/pago`, {});
      await dormir(700);
      const est = await pedir("GET", `/compras/${c.datos.compraId}`);
      if (est.datos.pago && est.datos.pago.estado !== "confirmado") {
        await pedir("POST", `/demo/pasarela/confirmar/${est.datos.pago.pagoId}`);
      }
      compras += 1;
      process.stdout.write(`\rcompras=${compras} rechazos=${rechazos}   `);
    } catch {
      rechazos += 1;
    }
    await dormir(300 + Math.random() * 500);
  }
}

// Hilo 2: mete gente extra a la fila sin comprar, para que se vea la espera y las sesiones.
async function multitud() {
  while (true) {
    try {
      const e = await pedir("POST", "/fila/entrar", { fanId: fan });
      await pedir("GET", `/fila/${e.datos.turnoId}`);
    } catch { /* ignorar */ }
    await dormir(500 + Math.random() * 500);
  }
}

await Promise.all([comprador(), multitud(), multitud()]);
