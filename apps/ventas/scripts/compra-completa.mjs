const base = process.env.API_URL ?? "http://127.0.0.1:3000";
const localidadId =
  process.env.LOCALIDAD_ID ?? "22222222-2222-4222-8222-222222222222";

async function pedir(metodo, ruta, cuerpo) {
  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: cuerpo ? { "content-type": "application/json" } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : {};
  if (!respuesta.ok) {
    throw new Error(`${metodo} ${ruta} → ${respuesta.status}: ${texto}`);
  }
  return datos;
}

const dormir = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

console.log("1. salud");
console.log("  ", await pedir("GET", "/health"));

console.log("2. reservar dos boletas en la localidad general");
const compra = await pedir("POST", "/compras", {
  fanId: "88888888-8888-4888-8888-888888888888",
  tokenAdmision: "turno:99999999-9999-4999-8999-999999999999",
  localidadId,
  cantidad: 2,
});
console.log("  ", compra);

console.log("3. iniciar el pago");
const pago = await pedir("POST", `/compras/${compra.compraId}/pago`, {});
console.log("  ", pago);

console.log("4. esperar la confirmación de la pasarela simulada");
await dormir(1500);
let estado = await pedir("GET", `/compras/${compra.compraId}`);
if (estado.pago && estado.pago.estado !== "confirmado") {
  console.log("  confirmación manual");
  await pedir("POST", `/demo/pasarela/confirmar/${pago.pagoId}`);
}

console.log("5. esperar la emisión");
for (let intento = 0; intento < 20; intento += 1) {
  estado = await pedir("GET", `/compras/${compra.compraId}`);
  if (estado.compra.paso !== "pagoConfirmado" && estado.compra.paso !== "reservada" && estado.compra.paso !== "pagoSolicitado") {
    break;
  }
  await dormir(500);
}

console.log("6. resultado");
console.log(JSON.stringify(estado, null, 2));

if (estado.compra.paso !== "emitida") {
  console.error(`la compra quedó en ${estado.compra.paso}`);
  process.exit(1);
}
if (estado.boletas.length !== 2) {
  console.error(`se esperaban 2 boletas y hay ${estado.boletas.length}`);
  process.exit(1);
}
console.log("compra completa: dos boletas emitidas");
