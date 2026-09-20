import Fastify from "fastify";

import { Dinero, Duracion, Porcentaje } from "@ticketright/shared-kernel";
import { CalculadoraDePrecio, OrquestadorDeCompra } from "@ticketright/sales";

import { ValidadorDeAdmisionDeDemostracion } from "./adapters/demo-admission.js";
import { PublicadorDeEventosOutbox, RelayDeOutbox } from "./adapters/outbox.js";
import {
  RepositorioPostgresDeCompras,
  RepositorioPostgresDeDiscrepancias,
  RepositorioPostgresDeLocalidades,
  RepositorioPostgresDePagos,
  RepositorioPostgresDeReservas,
} from "./adapters/postgres/repositories.js";
import { EmisorDeBoletasPostgres } from "./adapters/postgres/ticket-issuer.js";
import { PasarelaSimulada } from "./adapters/simulated-gateway.js";
import { cargarConfig } from "./config.js";
import { crearPool } from "./db/connection.js";
import { registrarRutas } from "./http/routes.js";

const config = cargarConfig();
const pool = crearPool(config.databaseUrl);

const localidades = new RepositorioPostgresDeLocalidades(pool);
const reservas = new RepositorioPostgresDeReservas(pool);
const pagos = new RepositorioPostgresDePagos(pool);
const compras = new RepositorioPostgresDeCompras(pool);
const discrepancias = new RepositorioPostgresDeDiscrepancias(pool);
const eventos = new PublicadorDeEventosOutbox(pool);
const emisor = new EmisorDeBoletasPostgres(pool);

const pasarela = new PasarelaSimulada({
  perfil: config.pasarelaPerfil,
  retrasoMs: config.pasarelaRetrasoMs,
  webhookUrl: `http://127.0.0.1:${config.port}/pagos/webhook`,
});

const orquestador = new OrquestadorDeCompra({
  admision: new ValidadorDeAdmisionDeDemostracion(),
  localidades,
  reservas,
  pagos,
  compras,
  discrepancias,
  eventos,
  pasarela,
  emisor,
  precios: new CalculadoraDePrecio(Porcentaje.de(12), Porcentaje.de(10), Dinero.pesos(150000)),
  vigenciaReserva: Duracion.minutos(10),
  maxIntentosEmision: config.maxIntentosEmision,
});

const app = Fastify({ logger: true });
registrarRutas(app, {
  orquestador,
  localidades,
  reservas,
  pagos,
  compras,
  discrepancias,
  pasarela,
  consultas: pool,
});

const relay = new RelayDeOutbox(pool);
relay.iniciar();

const trabajador = setInterval(() => {
  orquestador
    .vencerReservasExpiradas(new Date())
    .then((liberadas) => {
      if (liberadas > 0) {
        app.log.info(`reservas vencidas liberadas: ${liberadas}`);
      }
    })
    .catch((error) => app.log.error(error));
}, config.intervaloVencimientoMs);

await app.listen({ port: config.port, host: "0.0.0.0" });
app.log.info(`pasarela simulada en perfil ${config.pasarelaPerfil}`);

async function apagar(): Promise<void> {
  clearInterval(trabajador);
  relay.detener();
  await app.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void apagar());
process.on("SIGTERM", () => void apagar());
