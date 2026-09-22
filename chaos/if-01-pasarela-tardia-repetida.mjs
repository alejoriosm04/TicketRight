// IF-01 — La pasarela responde tarde y repite la confirmación.
// Hipótesis: aunque el webhook llegue dos veces con la misma clave de idempotencia,
// TicketRight mantiene una sola intención de pago y una sola emisión; la compra llega
// a boleta emitida sin cobro ni boleta duplicada.
//
// Mecanismo (equivalente docker-compose a NetworkChaos + perfil de pasarela): se hace
// una compra real y luego se reenvía el MISMO webhook varias veces a mano, que es la
// condición exacta de "confirmación repetida" del diseño, de forma determinista.
// Fase 1: tres reenvíos en serie. Fase 2 (22 sep): cinco reenvíos A LA VEZ, que es como
// llegan los reintentos de una pasarela real; antes de la unidad de trabajo emitían de más.
import { api, comprar, fotoMetricas, imprimirFoto, prom, dormir, LOCALIDADES, FAN, fotoAsentada } from "./lib.mjs";

console.log("== IF-01 — pasarela tardía y repetida ==");

const base = await fotoMetricas();
imprimirFoto("estado estable (antes)", base);

// Reserva dos boletas y solicita el pago, sin confirmarlo todavía.
async function reservarYPedirPago() {
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
  const pago = await api("POST", `/compras/${compra.datos.compraId}/pago`, {});
  return { compraId: compra.datos.compraId, pagoId: pago.datos.pagoId };
}

// 1. Reservar y solicitar el pago (sin confirmar todavía).
const { compraId, pagoId } = await reservarYPedirPago();
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
const despues = await fotoAsentada();
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

const fase1 =
  paso === "emitida" && pagoEstado === "confirmado" && boletas === 2 &&
  discrepanciasCompra === 0 && despues.sobreventa === 0;

// 4. Fase 2: el mismo webhook cinco veces a la vez sobre otra compra.
const segunda = await reservarYPedirPago();
console.log(`\ncompra ${segunda.compraId}, pago ${segunda.pagoId} — 5 webhooks simultáneos...`);
const simultaneo = {
  pagoId: segunda.pagoId, referenciaExterna: `simulada-${segunda.pagoId}`, aprobado: true, firma: "simulada",
};
const respuestas = await Promise.all(
  Array.from({ length: 5 }, () => api("POST", "/pagos/webhook", simultaneo)),
);
console.log(`  respuestas: ${respuestas.map((r) => r.status).join(", ")}`);
await dormir(1500);
const estado2 = (await api("GET", `/compras/${segunda.compraId}`)).datos;
const final = await fotoAsentada();
const boletas2 = estado2.boletas?.length ?? 0;
console.log("\n--- verificación (fase 2, webhooks simultáneos) ---");
console.log(`  paso de la compra:            ${estado2.compra?.paso} (esperado emitida)`);
console.log(`  boletas de la compra:         ${boletas2} (esperado 2)`);
console.log(`  discrepancias de la compra:   ${estado2.discrepancias?.length ?? 0} (esperado 0)`);
console.log(`  sobreventa global:            ${final.sobreventa} (esperado 0)`);
const fase2 =
  estado2.compra?.paso === "emitida" && boletas2 === 2 &&
  (estado2.discrepancias?.length ?? 0) === 0 && final.sobreventa === 0;

const aprobado = fase1 && fase2;

console.log(`\nRESULTADO IF-01: ${aprobado ? "APROBADO" : "FALLIDO"}`);
process.exit(aprobado ? 0 : 1);
