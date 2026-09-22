// IF-03 — PostgreSQL deja de estar disponible para nuevas reservas.
// Hipótesis: si inventario pierde acceso a PostgreSQL, ninguna reserva se marca como
// confirmada sin una transacción durable; el sistema responde con un rechazo/errores
// controlados y no produce sobreventa. Al restaurar, se recupera.
//
// Mecanismo (equivalente docker-compose a NetworkChaos): el orquestador de PowerShell
// hace `docker pause` del contenedor de PostgreSQL antes de la fase "durante" y
// `docker unpause` antes de "recuperar". Este script hace los intentos de compra y mide.
import { api, comprar, dormir, fotoMetricas, imprimirFoto, LOCALIDADES, FAN, fotoAsentada } from "./lib.mjs";

const fase = process.argv[2] ?? "estable";

if (fase === "estable") {
  console.log("== IF-03 fase ESTABLE (antes) ==");
  const foto = await fotoMetricas();
  imprimirFoto("estado estable", foto);
  const compra = await comprar(LOCALIDADES.sur, 2);
  console.log(`  compra de control: paso=${compra.paso} (esperado emitida)`);
  process.exit(compra.paso === "emitida" ? 0 : 1);
}

if (fase === "durante") {
  console.log("== IF-03 fase DURANTE (PostgreSQL pausado) ==");
  // Intentamos reservar directamente con la base caída. La admisión (en memoria) sigue
  // funcionando, pero la reserva toca PostgreSQL: debe fallar de forma controlada y
  // NUNCA confirmarse. Medimos cuántas se rechazan y si hubo alguna sobreventa.
  // No se corre el flujo completo de pago para no encadenar timeouts de la base.
  let rechazos = 0;
  let confirmadasFalsas = 0;
  for (let i = 0; i < 4; i += 1) {
    const entrada = await api("POST", "/fila/entrar", { fanId: FAN });
    let token;
    for (let j = 0; j < 8; j += 1) {
      const est = await api("GET", `/fila/${entrada.datos.turnoId}`);
      if (est.datos.estado === "admitido") { token = est.datos.token; break; }
      await dormir(500);
    }
    const t0 = Date.now();
    const r = await api("POST", "/compras", {
      fanId: FAN, tokenAdmision: token, localidadId: LOCALIDADES.sur, cantidad: 1,
    });
    const ms = Date.now() - t0;
    console.log(`  intento ${i + 1}: status=${r.status} en ${ms}ms ${r.ok ? "(CONFIRMADA!)" : "(rechazada)"}`);
    if (!r.ok) rechazos += 1;
    else confirmadasFalsas += 1;
  }
  const foto = await fotoMetricas();
  console.log(`\n  reservas rechazadas de forma controlada: ${rechazos}/4`);
  console.log(`  reservas confirmadas sin base (no debería): ${confirmadasFalsas} (esperado 0)`);
  console.log(`  sobreventa: ${foto.sobreventa} (esperado 0)`);
  const ok = confirmadasFalsas === 0 && foto.sobreventa === 0 && rechazos === 4;
  console.log(`\n(parcial) durante -> ${ok ? "OK" : "REVISAR"}`);
  process.exit(ok ? 0 : 1);
}

if (fase === "recuperar") {
  console.log("== IF-03 fase RECUPERAR (PostgreSQL restaurado) ==");
  // Tras restaurar, una compra nueva debe volver a completarse: el sistema se recupera.
  const compra = await comprar(LOCALIDADES.sur, 2);
  console.log(`  compra post-recuperación: paso=${compra.paso} (esperado emitida)`);
  const foto = await fotoAsentada();
  imprimirFoto("después de recuperar", foto);
  const ok = compra.paso === "emitida" && foto.sobreventa === 0;
  console.log(`\nRESULTADO IF-03: ${ok ? "APROBADO" : "FALLIDO"}`);
  process.exit(ok ? 0 : 1);
}

console.log(`fase desconocida: ${fase}`);
process.exit(2);
