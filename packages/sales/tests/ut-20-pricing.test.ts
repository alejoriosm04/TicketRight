import { Dinero, Duracion, Porcentaje, fecha } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import { CalculadoraDePrecio, ItemReserva, Reserva } from "../src/index.js";

const UVT_ASUMIDA = 50000;
const UMBRAL_PARAFISCAL = Dinero.pesos(3 * UVT_ASUMIDA);
const calculadora = new CalculadoraDePrecio(
  Porcentaje.de(12),
  Porcentaje.de(10),
  UMBRAL_PARAFISCAL,
);

describe("UT-20 el desglose de precio respeta el umbral parafiscal de 3 UVT", () => {
  it("cobra parafiscal en el nominal de $200.000 y no lo cobra en el de $100.000", () => {
    const alto = calculadora.desglosar(Dinero.pesos(200000));
    expect(alto.valorNominal.enPesos).toBe(200000);
    expect(alto.cargoServicio.enPesos).toBe(24000);
    expect(alto.contribucionParafiscal.enPesos).toBe(20000);
    expect(alto.total().enPesos).toBe(244000);

    const bajo = calculadora.desglosar(Dinero.pesos(100000));
    expect(bajo.valorNominal.enPesos).toBe(100000);
    expect(bajo.cargoServicio.enPesos).toBe(12000);
    expect(bajo.contribucionParafiscal.enPesos).toBe(0);
    expect(bajo.total().enPesos).toBe(112000);
  });

  it("guarda el desglose calculado y un cambio de tarifa no altera el ítem", () => {
    const item = new ItemReserva(
      "item-1",
      "loc-1",
      undefined,
      1,
      calculadora.desglosar(Dinero.pesos(200000)),
    );
    const reserva = Reserva.crear(
      "fan-1",
      "turno-1",
      [item],
      fecha("2026-09-26T10:00:00.000-05:00"),
      Duracion.minutos(10),
    );

    const calculadoraConOtraTarifa = new CalculadoraDePrecio(
      Porcentaje.de(15),
      Porcentaje.de(10),
      UMBRAL_PARAFISCAL,
    );
    expect(calculadoraConOtraTarifa.desglosar(Dinero.pesos(200000)).total().enPesos).toBe(250000);
    expect(reserva.total().enPesos).toBe(244000);
  });
});
