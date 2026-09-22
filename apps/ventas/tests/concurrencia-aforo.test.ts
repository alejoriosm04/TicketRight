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
  const orquestador = new OrquestadorDeCompra({
    admision: admisionDePrueba,
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
  });

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
});
