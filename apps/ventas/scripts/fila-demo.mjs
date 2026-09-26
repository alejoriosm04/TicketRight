// Simula una multitud en la sala de espera para que la fila de la demo tarde de verdad.
// Cuenta la historia de AD-006: la venta abre en preparación (admisión cerrada), la
// multitud se acumula, y al pasar a pico la fila admite a ritmo regulado (back pressure).
//
//   node apps/ventas/scripts/fila-demo.mjs llenar 300   # preparación + 300 fans en la fila
//   (entrar a la fila desde /app: queda detrás de los 300, sin avanzar)
//   node apps/ventas/scripts/fila-demo.mjs abrir        # pico: admite 15 por segundo
//   node apps/ventas/scripts/fila-demo.mjs normal       # vuelve a cotidiano
//
// Cada fan simulado es una identidad distinta con un solo ingreso, así que el borde de
// seguridad no lo trata como bot. No compran: solo ocupan su lugar en la fila.
import { randomUUID } from "node:crypto";

const base = process.env.API_URL ?? "http://127.0.0.1:3000";
const NAVEGADOR = "Mozilla/5.0 (X11; Linux x86_64) Chrome/120 Safari/537.36";

async function pedir(metodo, ruta, cuerpo, cabeceras = {}) {
  const r = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { "user-agent": NAVEGADOR, "content-type": "application/json", ...cabeceras },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  const datos = texto ? JSON.parse(texto) : {};
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status}: ${datos.mensaje ?? texto}`);
  return datos;
}

// Solo operación o promotor cambian el perfil operativo (AD-004); se usa la cuenta de la semilla.
async function cambiarPerfil(perfil) {
  const { token } = await pedir("POST", "/auth/ingreso", {
    correo: "operacion@ticketright.co",
    clave: "operacion123",
  });
  const r = await pedir("POST", "/operacion/perfil", { perfil }, { authorization: `Bearer ${token}` });
  console.log(`perfil operativo → ${r.perfil} (${r.ajustes.admitidosPorTic} admitidos por segundo)`);
  return r.ajustes.admitidosPorTic;
}

async function llenar(personas) {
  await cambiarPerfil("preparacion");
  let dentro = 0;
  const LOTE = 25;
  for (let i = 0; i < personas; i += LOTE) {
    const lote = Array.from({ length: Math.min(LOTE, personas - i) }, () => {
      const fanId = randomUUID();
      return pedir("POST", "/fila/entrar", { fanId }, { "x-fan-id": fanId }).then(() => {
        dentro += 1;
      });
    });
    await Promise.all(lote);
  }
  console.log(`${dentro} fans simulados en la fila, con la admisión cerrada.`);
  console.log("Entra ahora a la fila desde /app: quedarás detrás de ellos, sin avanzar.");
  console.log("Cuando quieras abrir la venta: node apps/ventas/scripts/fila-demo.mjs abrir");
}

async function resumen() {
  try {
    const r = await fetch(`${base}/metrics`);
    const texto = await r.text();
    const linea = texto.split("\n").find((l) => l.startsWith("ticketright_queue_waiting"));
    return { enEspera: linea ? Number(linea.split(" ").pop()) : undefined };
  } catch {
    return {};
  }
}

async function abrir(perfil) {
  const porSegundo = await cambiarPerfil(perfil);
  const { enEspera } = await resumen();
  if (enEspera && porSegundo > 0) {
    console.log(`${enEspera} personas en espera → la fila se vacía en ~${Math.ceil(enEspera / porSegundo)} s.`);
  }
  console.log("Al terminar la demo: node apps/ventas/scripts/fila-demo.mjs normal");
}

const [accion, arg] = process.argv.slice(2);
try {
  if (accion === "llenar") await llenar(Number(arg ?? 300));
  else if (accion === "abrir") await abrir(arg ?? "pico");
  else if (accion === "normal") await cambiarPerfil("cotidiano");
  else {
    console.log("uso: fila-demo.mjs llenar [personas=300] | abrir [perfil=pico] | normal");
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
