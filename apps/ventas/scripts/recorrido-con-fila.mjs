// Recorrido completo con sala de espera: entrar a la fila, esperar admisión,
// reservar, pagar, confirmar y emitir. Genera métricas, trazas y logs.
const base = process.env.API_URL ?? "http://127.0.0.1:3000";
const general = process.env.LOCALIDAD_ID ?? "22222222-2222-4222-8222-222222222203"; // Sur
const fan = "88888888-8888-4888-8888-888888888888";

async function pedir(metodo, ruta, cuerpo) {
  const headers = { "x-fan-id": fan, "user-agent": "Mozilla/5.0 Chrome/120" };
  if (cuerpo) headers["content-type"] = "application/json";
  const r = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  const datos = t ? JSON.parse(t) : {};
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status}: ${t}`);
  return datos;
}
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("1. entrar a la fila");
const entrada = await pedir("POST", "/fila/entrar", { fanId: fan });
console.log("   turno", entrada.turnoId);

console.log("2. esperar admisión");
let estadoFila;
for (let i = 0; i < 20; i += 1) {
  estadoFila = await pedir("GET", `/fila/${entrada.turnoId}`);
  if (estadoFila.estado === "admitido") break;
  console.log(`   en espera, posición ${estadoFila.posicion}`);
  await dormir(1000);
}
if (estadoFila.estado !== "admitido") { console.error("no fui admitido"); process.exit(1); }
console.log("   admitido, token", estadoFila.token);

console.log("3. reservar");
const compra = await pedir("POST", "/compras", {
  fanId: fan,
  tokenAdmision: estadoFila.token,
  localidadId: general,
  cantidad: 2,
});

console.log("4. pagar");
await pedir("POST", `/compras/${compra.compraId}/pago`, {});
await dormir(1200);

console.log("5. estado final");
let estado = await pedir("GET", `/compras/${compra.compraId}`);
if (estado.pago && estado.pago.estado !== "confirmado") {
  await pedir("POST", `/demo/pasarela/confirmar/${estado.pago.pagoId}`);
  await dormir(500);
  estado = await pedir("GET", `/compras/${compra.compraId}`);
}
console.log("   paso:", estado.compra.paso, "| boletas:", estado.boletas.length);
console.log(estado.compra.paso === "emitida" ? "recorrido OK" : "recorrido incompleto");
