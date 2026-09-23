// Pruebas de carga de TicketRight con k6: los cuatro escenarios de la volumetría
// (docs/proyecto/02-modelamiento/volumetria.md#escenarios-de-prueba).
//
// Cada iteración es un fan distinto que recorre la venta real: catálogo → fila → espera
// de admisión → reserva → pago → boleta. Se corre con load/correr.sh, que prepara el
// inventario antes y verifica la sobreventa en PostgreSQL después.
//
// Variables:
//   ESCENARIO      nominal | pico | estres | resistencia            (pico)
//   ESCALA         fracción de la carga declarada de 30.000 fans      (0.05)
//   MULTIPLICADOR  presión extra del escenario de estrés (1.5 o 2)   (1)
//   DURACION       nominal y resistencia                             (5m / 30m)
//   TASA           resistencia: fans que llegan por segundo           (12)
//   CONSULTA_FILA_S cada cuánto consulta un fan su posición           (3)
//   ABANDONO       fracción que reserva y no paga [S]                 (0.15)
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const API = __ENV.API_URL || "http://127.0.0.1:3000";
const ESCENARIO = __ENV.ESCENARIO || "pico";
const ESCALA = Number(__ENV.ESCALA || 0.05);
const MULTIPLICADOR = Number(__ENV.MULTIPLICADOR || 1);
const CONSULTA_FILA_S = Number(__ENV.CONSULTA_FILA_S || 3);
const ABANDONO = Number(__ENV.ABANDONO || 0.15);
const ESPERA_MAX_S = Number(__ENV.ESPERA_MAX_S || 900);
const LOCALIDAD = __ENV.LOCALIDAD_ID || "c4a60000-0000-4000-8000-000000000001";

// Carga declarada (volumetría, A-7 y A-10): 30.000 fans en 60 s por 5.000 boletas.
const FANS_DECLARADOS = 30000;
const VENTANA_S = 60;
const fansDeLaOla = Math.max(1, Math.round(FANS_DECLARADOS * ESCALA * MULTIPLICADOR));

const esperaEnFila = new Trend("espera_en_fila", true);
const tiempoHastaBoleta = new Trend("tiempo_hasta_boleta", true);
const erroresTecnicos = new Rate("errores_tecnicos");
const pagosFinalizados = new Rate("pagos_finalizados");
const fansAdmitidos = new Counter("fans_admitidos");
const fansSinAdmision = new Counter("fans_sin_admision");
const reservasConfirmadas = new Counter("reservas_confirmadas");
const reservasAgotadas = new Counter("reservas_rechazadas_aforo");
const reservasAbandonadas = new Counter("reservas_abandonadas");
const boletasEmitidas = new Counter("boletas_emitidas");
const retosDelBorde = new Counter("retos_del_borde");

// Un 4xx es una respuesta de negocio (aforo agotado, reto del borde), no una caída: la
// disponibilidad se mide con 5xx y errores de conexión.
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 499 }));

function escenarios() {
  const recorrido = { exec: "comprar", gracefulStop: `${ESPERA_MAX_S}s` };
  if (ESCENARIO === "nominal") {
    const duracion = __ENV.DURACION || "5m";
    return {
      // ≤ 50 fans explorando el catálogo y reservas del orden de una por minuto.
      exploradores: { executor: "constant-vus", vus: 50, duration: duracion, exec: "explorar" },
      compradores: {
        ...recorrido,
        executor: "constant-arrival-rate",
        rate: 1,
        timeUnit: "1m",
        duration: duracion,
        preAllocatedVUs: 5,
      },
    };
  }
  if (ESCENARIO === "pico" || ESCENARIO === "estres") {
    // La ola: todos los fans llegan dentro de la ventana de 60 s (modelo abierto: llegan
    // aunque el sistema se demore, como en una apertura de venta real).
    return {
      ola: {
        ...recorrido,
        executor: "constant-arrival-rate",
        rate: fansDeLaOla,
        timeUnit: `${VENTANA_S}s`,
        duration: `${VENTANA_S}s`,
        preAllocatedVUs: fansDeLaOla,
      },
    };
  }
  if (ESCENARIO === "resistencia") {
    const tasa = Number(__ENV.TASA || 12);
    return {
      sostenida: {
        ...recorrido,
        executor: "constant-arrival-rate",
        rate: tasa,
        timeUnit: "1s",
        duration: __ENV.DURACION || "30m",
        preAllocatedVUs: tasa * 60,
        maxVUs: tasa * 300,
      },
    };
  }
  throw new Error(`ESCENARIO desconocido: ${ESCENARIO}`);
}

export const options = {
  scenarios: escenarios(),
  thresholds: {
    // A-10: posición en la fila P95 ≤ 1 s; reserva P95 ≤ 2 s y error técnico < 1 %.
    "http_req_duration{operacion:fila_posicion}": ["p(95)<1000"],
    "http_req_duration{operacion:reserva}": ["p(95)<2000"],
    "errores_tecnicos{operacion:reserva}": ["rate<0.01"],
    // A-9: disponibilidad ≥ 99,9 % durante la ventana.
    http_req_failed: ["rate<0.001"],
    // A-6: ≥ 99 % de los pagos iniciados llegan a un estado final.
    pagos_finalizados: ["rate>=0.99"],
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function pedir(metodo, ruta, cuerpo, fanId, operacion, nombre) {
  const respuesta = http.request(metodo, `${API}${ruta}`, cuerpo ? JSON.stringify(cuerpo) : null, {
    headers: {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (k6; TicketRight carga) Chrome/120",
      "x-fan-id": fanId,
    },
    tags: { operacion, name: nombre },
  });
  erroresTecnicos.add(respuesta.status === 0 || respuesta.status >= 500, { operacion });
  if (respuesta.status === 429) {
    retosDelBorde.add(1, { operacion });
  }
  return respuesta;
}

function json(respuesta) {
  try {
    return respuesta.json();
  } catch {
    return {};
  }
}

// Cambia el perfil operativo con la cuenta de operación de la demo. La sesión no sale de
// esta función: lo que devuelve setup() queda escrito en el resumen de k6.
function cambiarPerfil(perfil) {
  const ingreso = http.post(
    `${API}/auth/ingreso`,
    JSON.stringify({ correo: "operacion@ticketright.co", clave: "operacion123" }),
    { headers: { "content-type": "application/json" } },
  );
  const sesion = json(ingreso).token;
  if (!sesion) {
    throw new Error(`no se pudo ingresar como operación (${ingreso.status}); ¿corriste el seed?`);
  }
  return http.post(`${API}/operacion/perfil`, JSON.stringify({ perfil }), {
    headers: { "content-type": "application/json", authorization: `Bearer ${sesion}` },
  });
}

export function setup() {
  // AD-006: el perfil operativo fija la tasa de admisión de la fila (back pressure).
  const cambio = cambiarPerfil(ESCENARIO === "nominal" ? "cotidiano" : "pico");
  const catalogo = json(http.get(`${API}/catalogo`));
  const localidad = (catalogo.eventos || [])
    .flatMap((evento) => evento.localidades)
    .find((l) => l.localidadId === LOCALIDAD);
  if (!localidad) {
    throw new Error("no está la localidad de carga; corre load/inventario.mjs preparar");
  }
  console.log(
    `escenario ${ESCENARIO} · escala ${ESCALA} · ×${MULTIPLICADOR} · ` +
      `perfil ${json(cambio).perfil} · aforo ${localidad.disponibles} · ` +
      (ESCENARIO === "pico" || ESCENARIO === "estres"
        ? `${fansDeLaOla} fans en ${VENTANA_S} s`
        : ""),
  );
}

export function teardown() {
  cambiarPerfil("cotidiano");
}

// Fan del perfil cotidiano: mira el catálogo y busca, sin comprar.
export function explorar() {
  const fanId = uuid();
  pedir("GET", "/catalogo", null, fanId, "catalogo", "GET /catalogo");
  sleep(2 + Math.random() * 4);
  pedir("GET", "/catalogo?q=bogota", null, fanId, "catalogo", "GET /catalogo?q=");
  sleep(5 + Math.random() * 10);
}

// Fan que viene a comprar: el recorrido completo de la venta.
export function comprar() {
  const fanId = uuid();
  pedir("GET", "/catalogo", null, fanId, "catalogo", "GET /catalogo");

  const entrada = pedir("POST", "/fila/entrar", { fanId }, fanId, "fila_ingreso", "POST /fila/entrar");
  const turnoId = json(entrada).turnoId;
  if (!check(entrada, { "entra a la fila": (r) => r.status === 201 && !!turnoId })) {
    return;
  }

  const llegada = Date.now();
  let token;
  while (!token) {
    if ((Date.now() - llegada) / 1000 > ESPERA_MAX_S) {
      fansSinAdmision.add(1);
      return;
    }
    sleep(CONSULTA_FILA_S * (0.8 + Math.random() * 0.4));
    const estado = pedir("GET", `/fila/${turnoId}`, null, fanId, "fila_posicion", "GET /fila/:turnoId");
    if (json(estado).estado === "admitido") {
      token = json(estado).token;
    }
  }
  fansAdmitidos.add(1);
  esperaEnFila.add(Date.now() - llegada);

  // 1,4 boletas por fan en promedio [S] (volumetría): 60 % compra una, 40 % dos.
  const cantidad = Math.random() < 0.4 ? 2 : 1;
  let reserva;
  for (let intento = 0; intento < 3; intento += 1) {
    reserva = pedir(
      "POST",
      "/compras",
      { fanId, tokenAdmision: token, localidadId: LOCALIDAD, cantidad },
      fanId,
      "reserva",
      "POST /compras",
    );
    if (reserva.status !== 429) break;
    sleep(1 + intento);
  }
  if (reserva.status === 409) {
    reservasAgotadas.add(1);
    return;
  }
  const compraId = json(reserva).compraId;
  if (!check(reserva, { "reserva confirmada": (r) => r.status === 201 && !!compraId })) {
    return;
  }
  reservasConfirmadas.add(1);

  if (Math.random() < ABANDONO) {
    // Reserva y se va: el worker la libera al vencer (R3, A-5).
    reservasAbandonadas.add(1);
    return;
  }

  const pago = pedir("POST", `/compras/${compraId}/pago`, {}, fanId, "pago", "POST /compras/:id/pago");
  if (!check(pago, { "pago solicitado": (r) => r.status === 202 })) {
    pagosFinalizados.add(false);
    return;
  }
  const inicioPago = Date.now();
  for (let intento = 0; intento < 60; intento += 1) {
    sleep(1);
    const compra = json(
      pedir("GET", `/compras/${compraId}`, null, fanId, "estado_compra", "GET /compras/:id"),
    );
    const paso = compra.compra && compra.compra.paso;
    if (paso === "emitida") {
      pagosFinalizados.add(true);
      boletasEmitidas.add(compra.boletas.length);
      tiempoHastaBoleta.add(Date.now() - inicioPago);
      return;
    }
    if (paso === "compensada") {
      pagosFinalizados.add(true);
      return;
    }
  }
  pagosFinalizados.add(false);
}
