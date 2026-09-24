import { Dinero, Duracion, Porcentaje, fecha, rango } from "@ticketright/shared-kernel";
import { describe, expect, it } from "vitest";

import {
  AforoDelRecintoExcedido,
  Cancelacion,
  ConvenioNoVigente,
  Convenio,
  Evento,
  Promotor,
  Recinto,
  ReglasReventa,
  ReglasVenta,
  TransicionDeEventoInvalida,
} from "../src/index.js";

const T0 = fecha("2026-03-01T10:00:00-05:00");

function reglasVentaBasicas(): ReglasVenta {
  return new ReglasVenta(
    fecha("2026-03-10T10:00:00-05:00"),
    fecha("2026-03-20T10:00:00-05:00"),
    4,
    true,
  );
}

describe("Recinto — R1: la suma de localidades no supera el aforo máximo", () => {
  it("acepta un aforo total dentro del máximo", () => {
    const recinto = Recinto.crear("Estadio El Campín", "Bogotá", 40000);
    expect(recinto.cabe(38000)).toBe(true);
    expect(() => recinto.exigirCabe(38000)).not.toThrow();
  });

  it("rechaza cuando el aforo total supera el máximo del recinto", () => {
    const recinto = Recinto.crear("Coliseo MedPlus", "Bogotá", 14000);
    expect(recinto.cabe(15000)).toBe(false);
    expect(() => recinto.exigirCabe(15000)).toThrow(AforoDelRecintoExcedido);
  });

  it("no permite crear un recinto con aforo no positivo", () => {
    expect(() => Recinto.crear("X", "Y", 0)).toThrow(AforoDelRecintoExcedido);
  });
});

describe("Convenio — vigencia (firmado y dentro del rango)", () => {
  const vigencia = rango(fecha("2026-01-01T00:00:00-05:00"), fecha("2026-12-31T23:59:59-05:00"));

  it("un convenio firmado y en fecha está vigente", () => {
    const convenio = new Convenio(Porcentaje.de(12), Porcentaje.de(10), vigencia, "firmado");
    expect(convenio.estaVigente(T0)).toBe(true);
    expect(() => convenio.exigirVigente(T0)).not.toThrow();
  });

  it("un convenio en borrador no está vigente aunque la fecha caiga en el rango", () => {
    const convenio = new Convenio(Porcentaje.de(12), Porcentaje.de(10), vigencia, "borrador");
    expect(convenio.estaVigente(T0)).toBe(false);
    expect(() => convenio.exigirVigente(T0)).toThrow(ConvenioNoVigente);
  });

  it("firmar produce un convenio vigente", () => {
    const convenio = new Convenio(Porcentaje.de(12), Porcentaje.de(10), vigencia, "borrador").firmar();
    expect(convenio.estaVigente(T0)).toBe(true);
  });
});

describe("Promotor — referencia su convenio vigente", () => {
  const vigencia = rango(fecha("2026-01-01T00:00:00-05:00"), fecha("2026-12-31T23:59:59-05:00"));

  it("exige convenio vigente para operar", () => {
    const convenio = new Convenio(Porcentaje.de(12), Porcentaje.de(10), vigencia, "firmado");
    const promotor = Promotor.crear("Páramo Presenta S.A.S.", "900123456-7", "permanente", convenio);
    expect(() => promotor.exigirConvenioVigente(T0)).not.toThrow();
  });

  it("un promotor con convenio en borrador no puede operar hasta firmarlo", () => {
    const borrador = new Convenio(Porcentaje.de(12), Porcentaje.de(10), vigencia, "borrador");
    const promotor = Promotor.crear("Ocesa Colombia", "830000000-1", "ocasional", borrador);
    expect(() => promotor.exigirConvenioVigente(T0)).toThrow(ConvenioNoVigente);
    promotor.actualizarConvenio(borrador.firmar());
    expect(() => promotor.exigirConvenioVigente(T0)).not.toThrow();
  });
});

describe("Evento — ciclo de vida (EstadoEvento) y perfil de demanda", () => {
  it("recorre borrador → publicado → enVenta → ventaCerrada → realizado", () => {
    const evento = Evento.crear("promo-1", "recinto-1", "Shakira", fecha("2026-03-21T20:00:00-05:00"), "masivo", reglasVentaBasicas());
    expect(evento.estado).toBe("borrador");
    evento.publicar();
    expect(evento.estado).toBe("publicado");
    evento.abrirVenta();
    expect(evento.estado).toBe("enVenta");
    evento.cerrarVenta();
    expect(evento.estado).toBe("ventaCerrada");
    evento.marcarRealizado();
    expect(evento.estado).toBe("realizado");
  });

  it("no permite abrir venta desde borrador (hay que publicar primero)", () => {
    const evento = Evento.crear("promo-1", "recinto-1", "Karol G", fecha("2026-04-11T20:00:00-05:00"), "masivo", reglasVentaBasicas());
    expect(() => evento.abrirVenta()).toThrow(TransicionDeEventoInvalida);
  });

  it("un evento masivo abre con fila visible; uno cotidiano, paso directo", () => {
    const masivo = Evento.crear("p", "r", "Taylor Swift", fecha("2026-05-02T19:00:00-05:00"), "masivo", reglasVentaBasicas());
    const cotidiano = Evento.crear("p", "r", "Obra de teatro", fecha("2026-05-16T20:00:00-05:00"), "cotidiano", reglasVentaBasicas());
    expect(masivo.abreConFilaVisible).toBe(true);
    expect(cotidiano.abreConFilaVisible).toBe(false);
  });

  it("ventaDisponible exige estado enVenta y estar dentro de la ventana", () => {
    const evento = Evento.crear("p", "r", "Feid", fecha("2026-04-25T20:00:00-05:00"), "masivo", reglasVentaBasicas());
    evento.publicar();
    evento.abrirVenta();
    expect(evento.ventaDisponible(fecha("2026-03-15T10:00:00-05:00"))).toBe(true);
    expect(evento.ventaDisponible(fecha("2026-03-25T10:00:00-05:00"))).toBe(false); // fuera de ventana
  });
});

describe("Evento — cancelación (R de comercio electrónico) y reglas de reventa", () => {
  it("registra la cancelación y no permite cancelar un evento ya realizado", () => {
    const evento = Evento.crear("p", "r", "Concierto", fecha("2026-06-14T22:00:00-05:00"), "masivo", reglasVentaBasicas());
    evento.publicar();
    evento.abrirVenta();
    evento.cancelar(new Cancelacion(T0, "Reembolso al medio de pago original", fecha("2026-03-03T10:00:00-05:00")));
    expect(evento.estado).toBe("cancelado");
    expect(evento.cancelacion?.mecanismoDevolucion).toContain("Reembolso");
    expect(() => evento.marcarRealizado()).toThrow(TransicionDeEventoInvalida);
  });

  it("las reglas de reventa validan la ventana (base de R9)", () => {
    const reglas = new ReglasReventa(
      Dinero.pesos(500000),
      Porcentaje.de(10),
      rango(fecha("2026-03-10T00:00:00-05:00"), fecha("2026-03-19T00:00:00-05:00")),
    );
    expect(reglas.ventanaIncluye(fecha("2026-03-15T12:00:00-05:00"))).toBe(true);
    expect(reglas.ventanaIncluye(fecha("2026-03-25T12:00:00-05:00"))).toBe(false);
  });

  it("ReglasVenta rechaza finVenta anterior a inicioVenta", () => {
    expect(
      () => new ReglasVenta(fecha("2026-03-20T10:00:00-05:00"), fecha("2026-03-10T10:00:00-05:00"), 4, true),
    ).toThrow(TransicionDeEventoInvalida);
  });
});

// La duración se usa solo para asegurar que el import del shared-kernel resuelve en el paquete.
describe("integración con shared-kernel", () => {
  it("usa los tipos compartidos (Duracion) sin acoplar a otros contextos", () => {
    expect(Duracion.minutos(10).milisegundos).toBe(600000);
  });
});
