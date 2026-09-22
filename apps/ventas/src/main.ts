// OpenTelemetry debe iniciarse antes que cualquier otro módulo para envolver HTTP y pg.
import "./observability/tracing.js";

import Fastify from "fastify";

import { Dinero, Duracion, Porcentaje } from "@ticketright/shared-kernel";
import { CalculadoraDePrecio, OrquestadorDeCompra } from "@ticketright/sales";

import { ValidadorJwtDeAdmision } from "./adapters/jwt-admission.js";
import { crearKafka, ConsumidorDeEventos, RelayDeOutboxKafka } from "./adapters/kafka.js";
import { PublicadorDeEventosOutbox, RelayDeOutbox } from "./adapters/outbox.js";
import { GestorDePerfiles } from "./adapters/operational-profiles.js";
import { registrarPortalEstatico } from "./http/static-portal.js";
import { EmisorDeTokenAdmision, ValidadorDeTokenAdmision } from "./security/admission-token.js";
import { BordeDeSeguridad } from "./security/edge-gateway.js";
import { RegistroDeAuditoria } from "./security/audit-log.js";
import { ServicioDeCuentas } from "./security/accounts.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  RepositorioPostgresDeCompras,
  RepositorioPostgresDeDiscrepancias,
  RepositorioPostgresDeLocalidades,
  RepositorioPostgresDePagos,
  RepositorioPostgresDeReservas,
} from "./adapters/postgres/repositories.js";
import { EmisorDeBoletasPostgres } from "./adapters/postgres/ticket-issuer.js";
import { PasarelaSimulada } from "./adapters/simulated-gateway.js";
import { SalaDeEspera, type Fila } from "./adapters/waiting-room.js";
import { SalaDeEsperaRedis } from "./adapters/waiting-room-redis.js";
import { cargarConfig } from "./config.js";
import { crearPool } from "./db/connection.js";
import { registrarRutas } from "./http/routes.js";
import { ColectorDeGauges } from "./observability/collector.js";
import { opcionesDeLog } from "./observability/logger.js";
import { admisionesConcedidas } from "./observability/metrics.js";
import { SondaSintetica } from "./observability/synthetic-probe.js";

// Evento y localidad de la demo (mismos ids que usa el seed). Se mantienen aquí para
// no importar el script de seed, que ejecuta consultas al cargarse.
const EVENTO_DEMO = "11111111-1111-4111-8111-111111111111";
const LOCALIDAD_SONDA = "22222222-2222-4222-8222-222222222203"; // Sur

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

// Seguridad del borde y admisión (AD-004). El secreto de firma vendría de Secrets Manager
// en producción; aquí de una variable de ambiente.
const secretoAdmision = process.env.ADMISION_SECRET ?? "demo-secreto-admision-ticketright";
const emisorToken = new EmisorDeTokenAdmision(secretoAdmision);
const validadorToken = new ValidadorDeTokenAdmision(secretoAdmision);

const orquestador = new OrquestadorDeCompra({
  admision: new ValidadorJwtDeAdmision(validadorToken, EVENTO_DEMO),
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

// Fila de admisión: Redis (Space-Based, AD-006) si REDIS_URL está definido; si no, en
// memoria para pruebas o arranque sin dependencias.
const alAdmitir = () => admisionesConcedidas.inc({ evento: EVENTO_DEMO });
// Al admitir, la fila emite un JWT de admisión firmado (AD-004).
const firmarToken = (sub: string, eventId: string, jti: string) =>
  emisorToken.emitir(sub, eventId, jti);
const sala: Fila = config.redisUrl
  ? new SalaDeEsperaRedis(EVENTO_DEMO, config.redisUrl, undefined, alAdmitir, firmarToken)
  : new SalaDeEspera(EVENTO_DEMO, undefined, alAdmitir, firmarToken);
sala.iniciar();
console.log(config.redisUrl ? `fila de admisión en Redis (${config.redisUrl})` : "fila de admisión en memoria");

// Gestor de perfiles operativos (AD-006, homólogo EventBridge Scheduler). Ajusta la tasa de
// admisión de la fila según el perfil (cotidiano/preparación/pico/recuperación/emergencia).
const perfiles = new GestorDePerfiles((tasa) => sala.ajustarTasa(tasa));

const app = Fastify({ logger: opcionesDeLog });

// Borde de seguridad (AD-004): rate limiting + detección de bots antes de las rutas.
// Salud, métricas y el webhook interno de la pasarela quedan exentos.
const borde = new BordeDeSeguridad({
  exentas: ["/health", "/metrics", "/pagos/webhook", "/demo", "/portal", "/operacion", "/catalogo", "/auth"],
});
borde.registrar(app);

// Registro de auditoría (AD-004 / A-8), homólogo de CloudTrail.
const auditoria = new RegistroDeAuditoria(pool);
await auditoria.inicializar();

// Cuentas de fan (identidad; homólogo de Cognito). PII cifrada, sesión con JWT.
const cuentas = new ServicioDeCuentas(pool, process.env.SESION_SECRET ?? "demo-secreto-sesion", secretoAdmision);
await cuentas.inicializar();

// Portal estático (homólogo S3 + CloudFront): sirve el prototipo navegable en /portal.
const raizPrototipo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../docs/proyecto/02-modelamiento/prototipo",
);
registrarPortalEstatico(app, { raiz: raizPrototipo });

registrarRutas(app, {
  orquestador,
  localidades,
  reservas,
  pagos,
  compras,
  discrepancias,
  pasarela,
  consultas: pool,
  sala,
  eventoId: EVENTO_DEMO,
  perfiles,
  cuentas,
});

// Bus de eventos (AD-002): con Kafka, el relay del outbox publica al bus y un consumidor
// idempotente proyecta/audita con DLQ. Sin Kafka, el relay solo marca el outbox como
// publicado (comportamiento previo, suficiente para pruebas locales sin broker).
let relay: { detener: () => void | Promise<void> };
let consumidor: ConsumidorDeEventos | undefined;
if (config.kafkaBrokers) {
  try {
    const kafka = crearKafka(config.kafkaBrokers);
    const relayKafka = new RelayDeOutboxKafka(pool, kafka);
    await relayKafka.iniciar();
    relay = relayKafka;
    consumidor = new ConsumidorDeEventos(pool, kafka);
    await consumidor.iniciar();
    const c = consumidor;
    setInterval(() => void c.publicarLag(), 5000);
    console.log(`bus de eventos en Kafka (${config.kafkaBrokers})`);
  } catch (error) {
    console.error("no se pudo conectar a Kafka; se usa el relay solo-PostgreSQL", (error as Error)?.message);
    const relaySimple = new RelayDeOutbox(pool);
    relaySimple.iniciar();
    relay = relaySimple;
  }
} else {
  const relaySimple = new RelayDeOutbox(pool);
  relaySimple.iniciar();
  relay = relaySimple;
  console.log("bus de eventos: relay de outbox solo-PostgreSQL (sin Kafka)");
}

const colector = new ColectorDeGauges(pool, pool, sala, EVENTO_DEMO);
colector.iniciar();

// Sonda sintética del recorrido crítico (A-9). Corre cada 60 s por defecto.
const sonda = new SondaSintetica({
  baseUrl: `http://127.0.0.1:${config.port}`,
  localidadId: LOCALIDAD_SONDA,
  fanId: "88888888-8888-4888-8888-888888888888",
  intervaloMs: Number(process.env.SONDA_INTERVALO_MS ?? 60000),
});
sonda.iniciar();

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
  await relay.detener();
  if (consumidor) await consumidor.detener();
  colector.detener();
  sonda.detener();
  sala.detener();
  perfiles.detener();
  await app.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void apagar());
process.on("SIGTERM", () => void apagar());

// Red de seguridad: un rechazo no atendido en un trabajador de fondo (p. ej. una
// consulta cuando PostgreSQL está caído) no debe tumbar el servicio. Se registra y se
// deja que los reintentos periódicos recuperen cuando la dependencia vuelva (IF-03).
process.on("unhandledRejection", (motivo) => {
  app.log.error({ motivo: (motivo as Error)?.message ?? motivo }, "rechazo no atendido");
});
