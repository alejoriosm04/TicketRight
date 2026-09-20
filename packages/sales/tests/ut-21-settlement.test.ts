import { Dinero, fecha, rango } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import {
  Discrepancia,
  Liquidacion,
  LiquidacionConDiscrepanciasAbiertas,
  Movimiento,
} from "../src/index.js";

const CONCILIADO_EN = fecha("2026-09-30T10:00:00.000-05:00");
const PERIODO = rango(fecha("2026-09-01T00:00:00.000-05:00"), fecha("2026-09-30T23:59:59.000-05:00"));

function liquidacionConMovimientos(): Liquidacion {
  const liquidacion = Liquidacion.abrir("promotor-1", PERIODO);
  liquidacion.agregarMovimiento(Movimiento.deVenta("pago-1", Dinero.pesos(400000), CONCILIADO_EN));
  liquidacion.agregarMovimiento(Movimiento.parafiscal("pago-1", Dinero.pesos(40000), CONCILIADO_EN));
  liquidacion.agregarMovimiento(Movimiento.participacion("pago-1", Dinero.pesos(24000), CONCILIADO_EN));
  liquidacion.agregarMovimiento(Movimiento.deDevolucion("pago-2", Dinero.pesos(200000), CONCILIADO_EN));
  return liquidacion;
}

describe("UT-21 la liquidación no cierra con discrepancias abiertas y calcula el neto", () => {
  it("pasa a enConciliacion con la discrepancia abierta y cierra en $264.000 al resolverla", () => {
    const liquidacion = liquidacionConMovimientos();
    const discrepancia = Discrepancia.abrir("cobroSinBoleta", "pago-1", CONCILIADO_EN);

    expect(() => liquidacion.cerrar([discrepancia])).toThrow(LiquidacionConDiscrepanciasAbiertas);
    expect(liquidacion.estado).toBe("enConciliacion");
    expect(liquidacion.neto.enPesos).toBe(264000);

    discrepancia.resolver("emisionCompletada", CONCILIADO_EN);
    liquidacion.cerrar([discrepancia]);

    expect(liquidacion.estado).toBe("cerrada");
    expect(liquidacion.bruto.enPesos).toBe(400000);
    expect(liquidacion.parafiscalRecaudado.enPesos).toBe(40000);
    expect(liquidacion.participaciones.enPesos).toBe(24000);
    expect(liquidacion.devoluciones.enPesos).toBe(200000);
    expect(liquidacion.neto.enPesos).toBe(264000);
  });
});
