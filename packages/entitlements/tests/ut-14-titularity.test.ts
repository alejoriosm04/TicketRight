import { Dinero, fecha } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import { Boleta, TitularidadNoVigente } from "../src/index.js";
import { InMemoryBoletas } from "./doubles/in-memory-boletas.js";

const EMISION = fecha("2026-09-08T10:00:00.000-05:00");
const TRANSFERENCIA = fecha("2026-09-09T10:00:00.000-05:00");

function boletaEmitida(): Boleta {
  return Boleta.emitir(
    {
      eventoId: "evento-1",
      localidadId: "loc-1",
      sillaId: "silla-1",
      pagoId: "pago-1",
      fanId: "fan-1",
      identidadRef: "ref-opaca-1",
      precioNominal: Dinero.pesos(200000),
    },
    EMISION,
  );
}

describe("UT-14 dos transferencias concurrentes dejan una sola titularidad activa", () => {
  it("acepta una transferencia, rechaza la otra y sube la versión del código una sola vez", async () => {
    const boleta = boletaEmitida();
    const titularidadOrigen = boleta.titularidades[0]?.titularidadId ?? "";
    const almacen = new InMemoryBoletas();
    almacen.guardar(boleta);

    const resultados = await Promise.allSettled([
      almacen.conTransaccion(boleta.boletaId, (actual) =>
        actual.transferir(titularidadOrigen, "fan-2", "ref-opaca-2", TRANSFERENCIA),
      ),
      almacen.conTransaccion(boleta.boletaId, (actual) =>
        actual.transferir(titularidadOrigen, "fan-3", "ref-opaca-3", TRANSFERENCIA),
      ),
    ]);

    const aceptadas = resultados.filter((resultado) => resultado.status === "fulfilled");
    const rechazadas = resultados.filter(
      (resultado): resultado is PromiseRejectedResult =>
        resultado.status === "rejected" && resultado.reason instanceof TitularidadNoVigente,
    );

    expect(aceptadas).toHaveLength(1);
    expect(rechazadas).toHaveLength(1);
    expect(boleta.codigo.version).toBe(2);
    expect(boleta.titularidades.filter((titularidad) => titularidad.estado === "activa")).toHaveLength(1);
    expect(boleta.transferencias).toHaveLength(1);
    expect(["fan-2", "fan-3"]).toContain(boleta.titularActivo().fanId);
    expect(boleta.estado).toBe("transferida");
  });
});
