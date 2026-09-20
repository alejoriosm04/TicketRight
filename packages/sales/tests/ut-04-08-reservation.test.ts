import { Dinero, Duracion, nuevoId } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import {
  AforoExcedido,
  DesglosePrecio,
  ItemReserva,
  Localidad,
  OrigenPago,
  Pago,
  Reserva,
} from "../src/index.js";
import {
  crearArnes,
  comandoDeReserva,
  localidadGeneral,
  localidadNumerada,
  T0,
} from "./doubles/harness.js";
import { InMemoryStore } from "./doubles/in-memory-store.js";

function localidadConAforo(autorizado: number, reservado: number): Localidad {
  const localidad = localidadGeneral("loc-1", autorizado);
  localidad.reservar(reservado);
  return localidad;
}

describe("UT-04 una sola reserva gana la misma silla entre cien intentos concurrentes", () => {
  it("deja una reserva vigente y rechaza las otras 99 con silla no disponible", async () => {
    const localidad = localidadNumerada("loc-1", ["silla-1"]);
    const almacen = new InMemoryStore<Localidad>();
    almacen.guardar(localidad.localidadId, localidad);

    const intentos = Array.from({ length: 100 }, () =>
      almacen.conTransaccion(localidad.localidadId, (actual) => actual.reservar(1, ["silla-1"])),
    );
    const resultados = await Promise.allSettled(intentos);
    const exitosos = resultados.filter((resultado) => resultado.status === "fulfilled");
    const rechazados = resultados.filter(
      (resultado): resultado is PromiseRejectedResult =>
        resultado.status === "rejected" && resultado.reason instanceof AforoExcedido,
    );

    expect(exitosos).toHaveLength(1);
    expect(rechazados).toHaveLength(99);
    expect((rechazados[0]?.reason as AforoExcedido).mensaje).toContain("no está disponible");
    expect(localidad.aforo.reservado).toBe(1);
    expect(localidad.sillasActuales[0]?.estado).toBe("reservada");
  });
});

describe("UT-05 un ítem mayor que el remanente se rechaza completo", () => {
  it("no cambia el aforo cuando se piden cinco sobre dos disponibles", () => {
    const localidad = localidadConAforo(50, 48);

    expect(() => localidad.reservar(5)).toThrow(AforoExcedido);
    expect(localidad.aforo.reservado).toBe(48);
    expect(localidad.aforo.disponible()).toBe(2);
  });
});

describe("UT-06 el remanente exacto se acepta y cierra el aforo", () => {
  it("acepta dos cuando quedan dos y rechaza la siguiente unidad", () => {
    const localidad = localidadConAforo(50, 48);

    localidad.reservar(2);
    expect(localidad.aforo.reservado).toBe(50);
    expect(localidad.aforo.disponible()).toBe(0);
    expect(() => localidad.reservar(1)).toThrow(AforoExcedido);
  });
});

describe("UT-07 la reserva vence en el minuto diez exacto y libera su ítem", () => {
  it("sigue vigente a los 09:59, vence a los 10:00 y el worker libera el inventario", async () => {
    const arnes = crearArnes();
    const localidad = localidadGeneral("loc-1", 5);
    arnes.localidades.agregar(localidad);
    const compra = await arnes.orquestador.reservar(comandoDeReserva("loc-1"), T0);
    const reserva = await arnes.reservas.obtener(compra.reservaId);

    arnes.reloj.avanzarA(Duracion.segundos(9 * 60 + 59).sumarA(T0));
    expect(reserva.estaVigente(arnes.reloj.ahora())).toBe(true);

    arnes.reloj.avanzarA(Duracion.minutos(10).sumarA(T0));
    expect(reserva.estaVigente(arnes.reloj.ahora())).toBe(false);

    const liberadas = await arnes.orquestador.vencerReservasExpiradas(arnes.reloj.ahora());
    expect(liberadas).toBe(1);
    expect(reserva.estado).toBe("vencida");
    expect(localidad.aforo.reservado).toBe(0);
  });
});

describe("UT-08 el worker no libera una reserva con pago confirmado", () => {
  it("deja intacta la reserva vencida por tiempo si su pago está confirmado", async () => {
    const arnes = crearArnes();
    const localidad = localidadGeneral("loc-1", 10);
    arnes.localidades.agregar(localidad);
    localidad.reservar(1);

    const creadaHaceOnceMinutos = Duracion.minutos(11).restarA(T0);
    const reserva = Reserva.crear(
      "fan-1",
      "turno-1",
      [
        new ItemReserva(
          nuevoId(),
          "loc-1",
          undefined,
          1,
          new DesglosePrecio(Dinero.pesos(100000), Dinero.pesos(12000), Dinero.cero()),
        ),
      ],
      creadaHaceOnceMinutos,
      Duracion.minutos(10),
    );
    await arnes.reservas.guardar(reserva);
    const pago = Pago.iniciar(
      new OrigenPago("reserva", reserva.id),
      reserva.total(),
      "tarjeta",
      "clave-1",
      creadaHaceOnceMinutos,
    );
    pago.registrarConfirmacion("ref-1", creadaHaceOnceMinutos);
    await arnes.pagos.guardar(pago);

    const liberadas = await arnes.orquestador.vencerReservasExpiradas(T0);

    expect(liberadas).toBe(0);
    expect(reserva.estado).toBe("vigente");
    expect(localidad.aforo.reservado).toBe(1);
  });
});
