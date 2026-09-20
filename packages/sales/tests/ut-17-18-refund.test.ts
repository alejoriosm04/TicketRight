import { Dinero, fecha, rango } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import {
  Devolucion,
  Liquidacion,
  Movimiento,
  PlazoDeRetractoVencido,
} from "../src/index.js";

const COMPRA = fecha("2026-09-08T10:00:00.000-05:00");
const VIERNES_TERCER_DIA_HABIL = fecha("2026-09-11T09:00:00.000-05:00");
const MIERCOLES_SEXTO_DIA_HABIL = fecha("2026-09-16T09:00:00.000-05:00");
const PERIODO = rango(fecha("2026-09-01T00:00:00.000-05:00"), fecha("2026-09-30T23:59:59.000-05:00"));

describe("UT-17 el retracto dentro de los cinco días hábiles se aprueba y deja movimiento", () => {
  it("aprueba la devolución el tercer día hábil y registra el movimiento de devolución", () => {
    const devolucion = Devolucion.solicitarRetracto(
      "boleta-1",
      Dinero.pesos(200000),
      COMPRA,
      VIERNES_TERCER_DIA_HABIL,
    );
    devolucion.aprobar(VIERNES_TERCER_DIA_HABIL);

    const liquidacion = Liquidacion.abrir("promotor-1", PERIODO);
    liquidacion.agregarMovimiento(
      Movimiento.deDevolucion(devolucion.devolucionId, devolucion.monto, VIERNES_TERCER_DIA_HABIL),
    );

    expect(devolucion.estado).toBe("aprobada");
    expect(devolucion.motivo).toBe("retracto");
    expect(devolucion.boletaId).toBe("boleta-1");
    expect(liquidacion.movimientos.filter((movimiento) => movimiento.tipo === "devolucion")).toHaveLength(1);
    expect(liquidacion.devoluciones.enPesos).toBe(200000);
  });
});

describe("UT-18 el retracto después del plazo legal se rechaza", () => {
  it("lanza plazo vencido en el sexto día hábil y no deja movimiento", () => {
    const liquidacion = Liquidacion.abrir("promotor-1", PERIODO);

    expect(() =>
      Devolucion.solicitarRetracto(
        "boleta-1",
        Dinero.pesos(200000),
        COMPRA,
        MIERCOLES_SEXTO_DIA_HABIL,
      ),
    ).toThrow(PlazoDeRetractoVencido);
    expect(liquidacion.movimientos).toHaveLength(0);
    expect(liquidacion.devoluciones.enPesos).toBe(0);
  });
});
