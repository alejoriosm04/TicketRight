import { Duracion } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import type { Arnes } from "./doubles/harness.js";
import { crearArnes, comandoDeReserva, localidadGeneral, T0 } from "./doubles/harness.js";

async function prepararCompra(arnes: Arnes) {
  const localidad = localidadGeneral("loc-1", 10);
  arnes.localidades.agregar(localidad);
  const compra = await arnes.orquestador.reservar(comandoDeReserva("loc-1"), arnes.reloj.ahora());
  const pago = await arnes.orquestador.iniciarPago(
    {
      compraId: compra.compraId,
      medio: "tarjeta",
      tokenTarjeta: "token-tarjeta",
      claveIdempotencia: "clave-idempotencia-1",
    },
    arnes.reloj.ahora(),
  );
  return { compra, pago, localidad };
}

describe("UT-09 el webhook duplicado produce el mismo resultado una sola vez", () => {
  it("confirma una vez, emite una boleta y no abre discrepancia", async () => {
    const arnes = crearArnes();
    const { pago } = await prepararCompra(arnes);

    await arnes.orquestador.confirmarPago(
      { pagoId: pago.pagoId, referenciaExterna: "ref-X", aprobado: true, firma: "firma-valida" },
      T0,
    );
    arnes.reloj.avanzarA(Duracion.segundos(3).sumarA(T0));
    await arnes.orquestador.confirmarPago(
      { pagoId: pago.pagoId, referenciaExterna: "ref-X", aprobado: true, firma: "firma-valida" },
      arnes.reloj.ahora(),
    );

    const pagoFinal = await arnes.pagos.obtener(pago.pagoId);
    expect(pagoFinal.estado).toBe("confirmado");
    expect(arnes.eventos.porNombre("PagoConfirmado")).toHaveLength(1);
    expect(arnes.emisor.emitidas).toHaveLength(1);
    expect(await arnes.discrepancias.abiertasPorPago(pago.pagoId)).toHaveLength(0);
  });
});

describe("UT-10 la respuesta tardía retoma el flujo sin cobrar dos veces", () => {
  it("queda pendientePasarela al agotar el timeout y confirma a los 45 segundos", async () => {
    const arnes = crearArnes();
    const { pago } = await prepararCompra(arnes);

    const pagoTrasTimeout = await arnes.pagos.obtener(pago.pagoId);
    expect(pagoTrasTimeout.estado).toBe("pendientePasarela");
    expect(arnes.pasarela.cobros).toHaveLength(1);

    arnes.reloj.avanzarA(Duracion.segundos(45).sumarA(T0));
    await arnes.orquestador.confirmarPago(
      { pagoId: pago.pagoId, referenciaExterna: "ref-tardia", aprobado: true, firma: "firma-valida" },
      arnes.reloj.ahora(),
    );

    const pagoFinal = await arnes.pagos.obtener(pago.pagoId);
    expect(pagoFinal.estado).toBe("confirmado");
    expect(arnes.emisor.emitidas).toHaveLength(1);
    expect(arnes.pasarela.cobros).toHaveLength(1);
  });
});

describe("UT-11 el rechazo explícito cancela la reserva y libera inventario", () => {
  it("no crea discrepancia porque el rechazo no es ambiguo", async () => {
    const arnes = crearArnes();
    const { compra, pago, localidad } = await prepararCompra(arnes);

    await arnes.orquestador.confirmarPago(
      { pagoId: pago.pagoId, referenciaExterna: "ref-Y", aprobado: false, firma: "firma-valida" },
      T0,
    );

    const reserva = await arnes.reservas.obtener(compra.reservaId);
    expect(reserva.estado).toBe("cancelada");
    expect(localidad.aforo.reservado).toBe(0);
    expect((await arnes.pagos.obtener(pago.pagoId)).estado).toBe("rechazado");
    expect(arnes.discrepancias.todas).toHaveLength(0);
  });
});

describe("UT-12 la emisión que agota reintentos abre discrepancia cobroSinBoleta", () => {
  it("deja la discrepancia abierta y la compra en conciliación", async () => {
    const arnes = crearArnes(5);
    arnes.emisor.fallosRestantes = 5;
    const { compra, pago } = await prepararCompra(arnes);

    await arnes.orquestador.confirmarPago(
      { pagoId: pago.pagoId, referenciaExterna: "ref-Z", aprobado: true, firma: "firma-valida" },
      T0,
    );

    const pagoFinal = await arnes.pagos.obtener(pago.pagoId);
    const discrepancias = await arnes.discrepancias.abiertasPorPago(pago.pagoId);
    expect(discrepancias).toHaveLength(1);
    expect(discrepancias[0]?.tipo).toBe("cobroSinBoleta");
    expect(discrepancias[0]?.resueltaEn).toBeUndefined();
    expect(discrepancias[0]?.detectadaEn.getTime()).toBeGreaterThanOrEqual(
      pagoFinal.confirmadoEn?.getTime() ?? 0,
    );
    expect((await arnes.compras.obtener(compra.compraId)).paso).toBe("enConciliacion");
    expect(arnes.emisor.emitidas).toHaveLength(0);
  });
});

describe("UT-13 la emisión que se recupera cierra la discrepancia antes de 15 minutos", () => {
  it("emite la boleta referenciando el pago original y resuelve emisionCompletada", async () => {
    const arnes = crearArnes(5);
    arnes.emisor.fallosRestantes = 5;
    const { compra, pago } = await prepararCompra(arnes);
    await arnes.orquestador.confirmarPago(
      { pagoId: pago.pagoId, referenciaExterna: "ref-Z", aprobado: true, firma: "firma-valida" },
      T0,
    );
    const pagoConfirmado = await arnes.pagos.obtener(pago.pagoId);

    arnes.reloj.avanzarA(Duracion.minutos(5).sumarA(T0));
    await arnes.orquestador.emitir(compra.compraId, arnes.reloj.ahora());

    expect(arnes.emisor.emitidas).toHaveLength(1);
    expect(arnes.emisor.emitidas[0]?.pagoId).toBe(pago.pagoId);
    const discrepancia = arnes.discrepancias.todas[0];
    expect(discrepancia?.estaAbierta).toBe(false);
    expect(discrepancia?.resolucion).toBe("emisionCompletada");
    expect(
      discrepancia?.resueltaEn?.getTime(),
    ).toBeLessThanOrEqual((pagoConfirmado.confirmadoEn?.getTime() ?? 0) + Duracion.minutos(15).milisegundos);
    expect((await arnes.compras.obtener(compra.compraId)).paso).toBe("emitida");
  });
});
