import { Duracion, fecha, rango } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import { FilaDeVenta, PoliticaFila, TurnoVencido } from "../src/index.js";

const POLITICA = new PoliticaFila(
  "ordenDeLlegada",
  100,
  rango(fecha("2026-09-01T00:00:00.000-05:00"), fecha("2026-09-30T23:59:59.000-05:00")),
);

function crearFila(): FilaDeVenta {
  return new FilaDeVenta("fila-1", "evento-1", "filaVisible", "abierta", POLITICA);
}

describe("UT-01 la posición del turno sigue ingresoEn, no el orden de llegada", () => {
  it("asigna 1, 2 y 3 por ingresoEn aunque fan2 llegue primero al emisor", () => {
    const fila = crearFila();
    const vence = fecha("2026-09-26T10:02:00.000-05:00");

    const turnoFan2 = fila.ingresar(
      "fan2",
      "clave-fan2",
      fecha("2026-09-26T10:00:01.000-05:00"),
      vence,
    );
    const turnoFan3 = fila.ingresar(
      "fan3",
      "clave-fan3",
      fecha("2026-09-26T10:00:00.500-05:00"),
      vence,
    );
    const turnoFan1 = fila.ingresar(
      "fan1",
      "clave-fan1",
      fecha("2026-09-26T10:00:00.000-05:00"),
      vence,
    );

    expect(turnoFan1.posicion).toBe(1);
    expect(turnoFan3.posicion).toBe(2);
    expect(turnoFan2.posicion).toBe(3);
  });
});

describe("UT-02 el ingreso idempotente no duplica turnos", () => {
  it("devuelve el mismo turnoId en tres solicitudes con la misma clave", () => {
    const fila = crearFila();
    const ingreso = fecha("2026-09-26T10:00:00.000-05:00");
    const vence = fecha("2026-09-26T10:02:00.000-05:00");

    const primero = fila.ingresar("fan1", "clave-1", ingreso, vence);
    const segundo = fila.ingresar("fan1", "clave-1", ingreso, vence);
    const tercero = fila.ingresar("fan1", "clave-1", ingreso, vence);

    expect(segundo.turnoId).toBe(primero.turnoId);
    expect(tercero.turnoId).toBe(primero.turnoId);
    expect(fila.turnos).toHaveLength(1);
  });
});

describe("UT-03 un turno vencido rechaza la reserva", () => {
  it("marca el turno como vencido a los tres minutos con vencimiento a los dos", () => {
    const fila = crearFila();
    const ingreso = fecha("2026-09-26T10:00:00.000-05:00");
    const vence = Duracion.minutos(2).sumarA(ingreso);
    const turno = fila.ingresar("fan1", "clave-1", ingreso, vence);

    expect(() =>
      fila.usarTurno(turno.turnoId, "fan1", fecha("2026-09-26T10:03:00.000-05:00")),
    ).toThrow(TurnoVencido);
    expect(turno.estado).toBe("vencido");
    expect(turno.ingresoEn.getTime()).toBe(ingreso.getTime());
    expect(turno.posicion).toBe(1);
  });
});
