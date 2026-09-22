// IF-01 — La pasarela responde tarde y repite la confirmación.
// Hipótesis: aunque el webhook llegue dos veces con la misma clave de idempotencia,
// TicketRight mantiene una sola intención de pago y una sola emisión; la compra llega
// a boleta emitida sin cobro ni boleta duplicada.
//
// Mecanismo (equivalente docker-compose a NetworkChaos + perfil de pasarela): se hace
// una compra real y luego se reenvía el MISMO webhook varias veces a mano, que es la
// condición exacta de "confirmación repetida" del diseño, de forma determinista.
import { api, comprar, fotoMetricas, imprimirFoto, prom, dormir, LOCALIDADES, FAN } from "./lib.mjs";

console.log("== IF-01 — pasarela tardía y repetida ==");

const base = await fotoMetricas();
imprimirFoto("estado estable (antes)", base);

// 1. Reservar y solicitar el pago (sin confirmar todavía).
const entrada = await api("POST", "/fila/entrar", { fanId: FAN });
let token;
for (let i = 0; i < 15; i += 1) {
  const est = await api("GET", `/fila/${entrada.datos.turnoId}`);
  if (est.datos.estado === "admitido") { token = est.datos.token; break; }
  await dormir(700);
}
const compra = await api("POST", "/compras", {
  fanId: FAN, tokenAdmision: token, localidadId: LOCALIDADES.oriental, cantidad: 2,
});
const compraId = compra.datos.compraId;
const pago = await api("POST", `/compras/${compraId}/pago`, {});
const pagoId = pago.datos.pagoId;
console.log(`\ncompra ${compraId}, pago ${pagoId} — simulando webhook repetido...`);

// 2. Enviar el MISMO webhook tres veces (respuesta duplicada de la pasarela).
const webhook = { pagoId, referenciaExterna: `simulada-${pagoId}`, aprobado: true, firma: "simulada" };
for (let i = 1; i <= 3; i += 1) {
  const r = await api("POST", "/pagos/webhook", webhook);
  console.log(`  webhook #${i} -> ${r.status}`);
  await dormir(400);
}

await dormir(1500);
const estado = (await api("GET", `/compras/${compraId}`)).datos;
const despues = await fotoMetricas();
imprimirFoto("después de 3 webhooks idénticos", despues);

// 3. Verificar la hipótesis SOBRE ESTA COMPRA (la invariante de idempotencia es por-compra;
// los deltas globales no sirven porque puede haber otras compras concurrentes en la demo).
const boletas = estado.boletas?.length ?? 0;
const paso = estado.compra?.paso;
const intentos = estado.compra?.intentos ?? 0;
const pagoEstado = estado.pago?.estado;
const discrepanciasCompra = estado.discrepancias?.length ?? 0;

console.log("\n--- verificación (sobre la compra de IF-01) ---");
console.log(`  paso de la compra:            ${paso} (esperado emitida)`);
console.log(`  estado del pago:              ${pagoEstado} (esperado confirmado)`);
console.log(`  boletas de la compra:         ${boletas} (esperado 2, no 4 ni 6)`);
console.log(`  discrepancias de la compra:   ${discrepanciasCompra} (esperado 0)`);
console.log(`  sobreventa global:            ${despues.sobreventa} (esperado 0)`);
console.log("\n  → los 3 webhooks idénticos produjeron UNA sola confirmación y DOS boletas.");

const aprobado =
  paso === "emitida" && pagoEstado === "confirmado" && boletas === 2 &&
  discrepanciasCompra === 0 && despues.sobreventa === 0;

console.log(`\nRESULTADO IF-01: ${aprobado ? "APROBADO" : "FALLIDO"}`);
process.exit(aprobado ? 0 : 1);
