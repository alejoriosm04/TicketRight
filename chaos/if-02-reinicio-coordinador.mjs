// IF-02 — Reinicio del coordinador de pago durante el procesamiento.
// Hipótesis: si el proceso que coordina la SAGA se reinicia con pagos en curso, el
// estado durable (PostgreSQL + outbox) permite retomar sin perder el pago ni duplicar
// el efecto monetario o la emisión. La idempotencia convierte cualquier repetición en
// el mismo resultado de negocio.
//
// Mecanismo (equivalente docker-compose a PodChaos sobre el coordinador): se ejecuta en
// dos fases alrededor de un reinicio del proceso de la app.
//   fase "preparar": crea N compras con el pago SOLICITADO pero SIN confirmar (in-flight),
//                    y guarda sus ids en chaos/estado-if02.json
//   fase "verificar": tras reiniciar el proceso, confirma cada pago y comprueba que cada
//                     compra llega a boleta emitida con sus boletas exactas, sin duplicar.
import { writeFileSync, readFileSync } from "node:fs";
import { api, dormir, fotoMetricas, imprimirFoto, LOCALIDADES, FAN } from "./lib.mjs";

const ARCHIVO = new URL("./estado-if02.json", import.meta.url);
const fase = process.argv[2] ?? "preparar";
const N = 5;

async function admitir() {
  const entrada = await api("POST", "/fila/entrar", { fanId: FAN });
  for (let i = 0; i < 20; i += 1) {
    const est = await api("GET", `/fila/${entrada.datos.turnoId}`);
    if (est.datos.estado === "admitido") return est.datos.token;
    await dormir(600);
  }
  return undefined;
}

if (fase === "preparar") {
  console.log("== IF-02 fase PREPARAR — dejar pagos en curso (in-flight) ==");
  const base = await fotoMetricas();
  imprimirFoto("estado estable (antes)", base);
  const compras = [];
  for (let i = 0; i < N; i += 1) {
    const token = await admitir();
    const compra = await api("POST", "/compras", {
      fanId: FAN, tokenAdmision: token, localidadId: LOCALIDADES.occidental, cantidad: 2,
    });
    const compraId = compra.datos.compraId;
    const pago = await api("POST", `/compras/${compraId}/pago`, {});
    compras.push({ compraId, pagoId: pago.datos.pagoId });
    console.log(`  compra ${compraId} — pago ${pago.datos.pagoId} SOLICITADO (sin confirmar)`);
  }
  writeFileSync(ARCHIVO, JSON.stringify({ compras, base }, null, 2));
  const enCurso = await fotoMetricas();
  imprimirFoto("con pagos en curso (antes del reinicio)", enCurso);
  console.log(`\n${N} pagos quedaron en curso. Ahora se reinicia el proceso de la app.`);
  process.exit(0);
}

if (fase === "verificar") {
  console.log("== IF-02 fase VERIFICAR — tras el reinicio, confirmar y comprobar ==");
  const { compras, base } = JSON.parse(readFileSync(ARCHIVO, "utf8"));
  let ok = true;
  for (const { compraId, pagoId } of compras) {
    // Estado tras el reinicio: la compra y el pago deben seguir existiendo (durables).
    const antes = await api("GET", `/compras/${compraId}`);
    if (!antes.ok) { console.log(`  [FALLO] la compra ${compraId} no sobrevivió al reinicio`); ok = false; continue; }
    // Confirmar el webhook DOS veces (el reinicio pudo dejar el trabajo a medias; la
    // idempotencia debe convertir la repetición en el mismo resultado).
    const webhook = { pagoId, referenciaExterna: `simulada-${pagoId}`, aprobado: true, firma: "simulada" };
    await api("POST", "/pagos/webhook", webhook);
    await api("POST", "/pagos/webhook", webhook);
    await dormir(800);
    const est = (await api("GET", `/compras/${compraId}`)).datos;
    const boletas = est.boletas?.length ?? 0;
    const paso = est.compra?.paso;
    const disc = est.discrepancias?.length ?? 0;
    const bien = paso === "emitida" && boletas === 2 && disc === 0;
    console.log(`  compra ${compraId}: paso=${paso} boletas=${boletas} discrepancias=${disc} -> ${bien ? "OK" : "FALLO"}`);
    if (!bien) ok = false;
  }
  const despues = await fotoMetricas();
  imprimirFoto("después del reinicio y la confirmación", despues);
  console.log(`  sobreventa global: ${despues.sobreventa} (esperado 0)`);
  if (despues.sobreventa !== 0) ok = false;
  console.log(`\nRESULTADO IF-02: ${ok ? "APROBADO" : "FALLIDO"}`);
  process.exit(ok ? 0 : 1);
}

console.log(`fase desconocida: ${fase} (usa "preparar" o "verificar")`);
process.exit(2);
