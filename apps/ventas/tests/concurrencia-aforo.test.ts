import { Dinero, Duracion, Porcentaje, nuevoId } from "@ticketright/shared-kernel";
import {
  AforoExcedido,
  CalculadoraDePrecio,
  OrquestadorDeCompra,
  type PasarelaDePago,
  type ValidadorDeAdmision,
} from "@ticketright/sales";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TokenDeAdmisionInvalido, ValidadorJwtDeAdmision } from "../src/adapters/jwt-admission.js";
import { PublicadorDeEventosOutbox } from "../src/adapters/outbox.js";
import {
  RepositorioPostgresDeCompras,
  RepositorioPostgresDeDiscrepancias,
  RepositorioPostgresDeLocalidades,
  RepositorioPostgresDePagos,
  RepositorioPostgresDeReservas,
} from "../src/adapters/postgres/repositories.js";
import { EmisorDeBoletasPostgres } from "../src/adapters/postgres/ticket-issuer.js";
import { BaseTransaccional } from "../src/db/connection.js";
import { EmisorDeTokenAdmision, ValidadorDeTokenAdmision } from "../src/security/admission-token.js";

/**
 * Integración contra PostgreSQL real: la concurrencia que los dobles en memoria de UT-04 no
 * pueden mostrar. Corre solo con DATABASE_URL (el CI levanta PostgreSQL y migra); sin base,
 * se omite. Crea su propio evento y localidades y los borra al terminar.
 */
const url = process.env.DATABASE_URL;

const admisionDePrueba: ValidadorDeAdmision = { validar: async () => nuevoId() };
const pasarelaDePrueba: PasarelaDePago = {
  cobrar: async () => undefined,
  verificarFirma: async () => true,
};

describe.skipIf(!url)("aforo en PostgreSQL bajo concurrencia (A-2, R1)", () => {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  const db = new BaseTransaccional(pool);
  const eventoId = nuevoId();
  const secreto = "secreto-de-prueba";
  const emisorDeTokens = new EmisorDeTokenAdmision(secreto);
  const turnosEmitidos: string[] = [];

  function dependencias(admision: ValidadorDeAdmision) {
    return {
      admision,
      localidades: new RepositorioPostgresDeLocalidades(db),
      reservas: new RepositorioPostgresDeReservas(db),
      pagos: new RepositorioPostgresDePagos(db),
      compras: new RepositorioPostgresDeCompras(db),
      discrepancias: new RepositorioPostgresDeDiscrepancias(db),
      eventos: new PublicadorDeEventosOutbox(db),
      pasarela: pasarelaDePrueba,
      emisor: new EmisorDeBoletasPostgres(db),
      precios: new CalculadoraDePrecio(Porcentaje.de(12), Porcentaje.de(10), Dinero.pesos(150000)),
      vigenciaReserva: Duracion.minutos(10),
      maxIntentosEmision: 3,
      unidadDeTrabajo: db,
    };
  }
  const orquestador = new OrquestadorDeCompra(dependencias(admisionDePrueba));
  const conAdmisionReal = new OrquestadorDeCompra(
    dependencias(new ValidadorJwtDeAdmision(new ValidadorDeTokenAdmision(secreto), eventoId, db)),
  );

  function tokenDeLaFila(fanId: string): string {
    const turnoId = nuevoId();
    turnosEmitidos.push(turnoId);
    return emisorDeTokens.emitir(fanId, eventoId, turnoId);
  }

  function reservarConToken(fanId: string, token: string, localidadId: string) {
    return conAdmisionReal.reservar(
      { fanId, identidadRef: `ref-${fanId}`, tokenAdmision: token, localidadId, cantidad: 1, sillaIds: [] },
      new Date(),
    );
  }

  async function crearLocalidad(aforo: number): Promise<string> {
    const localidadId = nuevoId();
    await pool.query(
      `insert into localidades (localidad_id, evento_id, nombre, tipo, precio_centavos,
         aforo_autorizado, aforo_reservado, aforo_vendido)
       values ($1, $2, 'Prueba de concurrencia', 'general', 10000000, $3, 0, 0)`,
      [localidadId, eventoId, aforo],
    );
    return localidadId;
  }

  function reservarUna(localidadId: string) {
    const fanId = nuevoId();
    return orquestador.reservar(
      { fanId, identidadRef: `ref-${fanId}`, tokenAdmision: "jwt", localidadId, cantidad: 1, sillaIds: [] },
      new Date(),
    );
  }

  beforeAll(async () => {
    await pool.query("insert into eventos (evento_id, nombre) values ($1, 'Prueba de concurrencia')", [
      eventoId,
    ]);
  });

  afterAll(async () => {
    const reservas = `select reserva_id from items_reserva where localidad_id in
      (select localidad_id from localidades where evento_id = $1)`;
    const pagos = `select pago_id from pagos where origen_id in (${reservas})`;
    await pool.query(`delete from titularidades where boleta_id in
      (select boleta_id from boletas where evento_id = $1)`, [eventoId]);
    await pool.query("delete from boletas where evento_id = $1", [eventoId]);
    await pool.query(`delete from discrepancias where pago_id in (${pagos})`, [eventoId]);
    await pool.query(`delete from compras where reserva_id in (${reservas})`, [eventoId]);
    await pool.query(`delete from pagos where pago_id in (${pagos})`, [eventoId]);
    await pool.query(`delete from reservas where reserva_id in (${reservas})`, [eventoId]);
    await pool.query(`delete from items_reserva where localidad_id in
      (select localidad_id from localidades where evento_id = $1)`, [eventoId]);
    await pool.query("delete from localidades where evento_id = $1", [eventoId]);
    await pool.query("delete from turnos_usados where turno_id = any($1::uuid[])", [turnosEmitidos]);
    await pool.query("delete from eventos where evento_id = $1", [eventoId]);
    await pool.end();
  });

  it("cien reservas simultáneas sobre cincuenta cupos: gana exactamente la mitad", async () => {
    const localidadId = await crearLocalidad(50);

    const resultados = await Promise.allSettled(
      Array.from({ length: 100 }, () => reservarUna(localidadId)),
    );

    const aceptadas = resultados.filter((resultado) => resultado.status === "fulfilled");
    const rechazadas = resultados.filter(
      (resultado): resultado is PromiseRejectedResult => resultado.status === "rejected",
    );
    expect(aceptadas).toHaveLength(50);
    expect(rechazadas).toHaveLength(50);
    for (const rechazo of rechazadas) {
      expect(rechazo.reason).toBeInstanceOf(AforoExcedido);
    }
    const { rows } = await pool.query(
      `select l.aforo_reservado,
              (select coalesce(sum(i.cantidad), 0) from items_reserva i
               where i.localidad_id = l.localidad_id)::int as unidades_reservadas
       from localidades l where l.localidad_id = $1`,
      [localidadId],
    );
    expect(rows[0]).toEqual({ aforo_reservado: 50, unidades_reservadas: 50 });
  });

  it("cinco webhooks simultáneos del mismo pago emiten una sola vez (A-1)", async () => {
    const localidadId = await crearLocalidad(10);
    const compra = await reservarUna(localidadId);
    const pago = await orquestador.iniciarPago(
      { compraId: compra.compraId, medio: "tarjeta", tokenTarjeta: "tok", claveIdempotencia: nuevoId() },
      new Date(),
    );

    await Promise.all(
      Array.from({ length: 5 }, () =>
        orquestador.confirmarPago(
          { pagoId: pago.id, referenciaExterna: "ref-1", aprobado: true, firma: "simulada" },
          new Date(),
        ),
      ),
    );

    const { rows } = await pool.query(
      `select (select count(*) from boletas where pago_id = $1)::int as boletas,
              l.aforo_reservado, l.aforo_vendido
       from localidades l where l.localidad_id = $2`,
      [pago.id, localidadId],
    );
    expect(rows[0]).toEqual({ boletas: 1, aforo_reservado: 0, aforo_vendido: 1 });
  });

  it("el mismo turno usado cinco veces a la vez produce una sola reserva", async () => {
    const localidadId = await crearLocalidad(10);
    const fanId = nuevoId();
    const token = tokenDeLaFila(fanId);

    const resultados = await Promise.allSettled(
      Array.from({ length: 5 }, () => reservarConToken(fanId, token, localidadId)),
    );

    const rechazos = resultados.filter(
      (resultado): resultado is PromiseRejectedResult => resultado.status === "rejected",
    );
    expect(resultados.filter((resultado) => resultado.status === "fulfilled")).toHaveLength(1);
    expect(rechazos).toHaveLength(4);
    for (const rechazo of rechazos) {
      expect(rechazo.reason).toBeInstanceOf(TokenDeAdmisionInvalido);
    }
    const { rows } = await pool.query("select aforo_reservado from localidades where localidad_id = $1", [
      localidadId,
    ]);
    expect(rows[0]).toEqual({ aforo_reservado: 1 });
  });

  it("el turno de un fan no le sirve a otro", async () => {
    const localidadId = await crearLocalidad(10);
    const token = tokenDeLaFila(nuevoId());

    await expect(reservarConToken(nuevoId(), token, localidadId)).rejects.toBeInstanceOf(
      TokenDeAdmisionInvalido,
    );
  });

  it("una reserva rechazada por aforo no gasta el turno", async () => {
    const agotada = await crearLocalidad(0);
    const conCupo = await crearLocalidad(10);
    const fanId = nuevoId();
    const token = tokenDeLaFila(fanId);

    await expect(reservarConToken(fanId, token, agotada)).rejects.toBeInstanceOf(AforoExcedido);
    await expect(reservarConToken(fanId, token, conCupo)).resolves.toBeDefined();
  });
});
