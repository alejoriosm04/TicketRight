import { Dinero, fecha, Porcentaje, rango } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import { Boleta, PrecioDeReventaExcedido, ReglasDeReventa, ReventaNoPermitida } from "../src/index.js";

const EMISION = fecha("2026-09-01T10:00:00.000-05:00");
const REGLAS = new ReglasDeReventa(
  Dinero.pesos(300000),
  Porcentaje.de(10),
  rango(fecha("2026-09-01T00:00:00.000-05:00"), fecha("2026-09-10T23:59:59.000-05:00")),
);

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

describe("UT-15 la reventa fuera de la ventana se rechaza", () => {
  it("no crea reventa cuando se publica el 11 de septiembre con ventana hasta el 10", () => {
    const boleta = boletaEmitida();

    expect(() =>
      boleta.publicarReventa(
        "fan-1",
        Dinero.pesos(200000),
        fecha("2026-09-11T10:00:00.000-05:00"),
        REGLAS,
      ),
    ).toThrow(ReventaNoPermitida);
    expect(boleta.reventas).toHaveLength(0);
    expect(boleta.titularActivo().fanId).toBe("fan-1");
  });
});

describe("UT-16 la reventa por encima del precio máximo se rechaza", () => {
  it("no crea reventa cuando el precio publicado supera los $300.000", () => {
    const boleta = boletaEmitida();

    expect(() =>
      boleta.publicarReventa(
        "fan-1",
        Dinero.pesos(305000),
        fecha("2026-09-05T10:00:00.000-05:00"),
        REGLAS,
      ),
    ).toThrow(PrecioDeReventaExcedido);
    expect(boleta.reventas).toHaveLength(0);
  });
});
