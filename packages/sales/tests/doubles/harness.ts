import { Dinero, Duracion, Porcentaje, fecha } from "@ticketright/shared-kernel";

import {
  Aforo,
  CalculadoraDePrecio,
  Localidad,
  OrquestadorDeCompra,
  Silla,
  type CrearReserva,
} from "../../src/index.js";
import { FakeAdmissionValidator } from "./fake-admission-validator.js";
import { FakePaymentGateway } from "./fake-payment-gateway.js";
import { FakeTicketIssuer } from "./fake-ticket-issuer.js";
import { InMemoryEventPublisher } from "./in-memory-event-publisher.js";
import {
  InMemoryCompras,
  InMemoryDiscrepancias,
  InMemoryLocalidades,
  InMemoryPagos,
  InMemoryReservas,
} from "./repositories.js";
import { TestClock } from "./test-clock.js";

export const T0 = fecha("2026-09-26T10:00:00.000-05:00");

export function localidadGeneral(
  localidadId: string,
  autorizado: number,
  precioNominal = 100000,
): Localidad {
  return new Localidad(localidadId, "evento-1", "general", new Aforo(autorizado), Dinero.pesos(precioNominal));
}

export function localidadNumerada(
  localidadId: string,
  sillaIds: readonly string[],
  precioNominal = 200000,
): Localidad {
  return new Localidad(
    localidadId,
    "evento-1",
    "numerada",
    new Aforo(sillaIds.length),
    Dinero.pesos(precioNominal),
    sillaIds.map((sillaId, indice) => new Silla(sillaId, "A", String(indice + 1))),
  );
}

export function comandoDeReserva(
  localidadId: string,
  opciones: { fanId?: string; cantidad?: number; sillaIds?: readonly string[] } = {},
): CrearReserva {
  const sillaIds = opciones.sillaIds ?? [];
  return {
    fanId: opciones.fanId ?? "fan-1",
    identidadRef: "ref-opaca-1",
    tokenAdmision: "jwt-de-admision",
    localidadId,
    cantidad: opciones.cantidad ?? 1,
    sillaIds,
  };
}

export interface Arnes {
  orquestador: OrquestadorDeCompra;
  admision: FakeAdmissionValidator;
  localidades: InMemoryLocalidades;
  reservas: InMemoryReservas;
  pagos: InMemoryPagos;
  compras: InMemoryCompras;
  discrepancias: InMemoryDiscrepancias;
  eventos: InMemoryEventPublisher;
  pasarela: FakePaymentGateway;
  emisor: FakeTicketIssuer;
  precios: CalculadoraDePrecio;
  reloj: TestClock;
}

export function crearArnes(maxIntentosEmision = 5): Arnes {
  const admision = new FakeAdmissionValidator();
  const localidades = new InMemoryLocalidades();
  const reservas = new InMemoryReservas();
  const pagos = new InMemoryPagos();
  const compras = new InMemoryCompras();
  const discrepancias = new InMemoryDiscrepancias();
  const eventos = new InMemoryEventPublisher();
  const pasarela = new FakePaymentGateway();
  const emisor = new FakeTicketIssuer();
  const precios = new CalculadoraDePrecio(Porcentaje.de(12), Porcentaje.de(10), Dinero.pesos(150000));
  const reloj = new TestClock(T0);
  const orquestador = new OrquestadorDeCompra({
    admision,
    localidades,
    reservas,
    pagos,
    compras,
    discrepancias,
    eventos,
    pasarela,
    emisor,
    precios,
    vigenciaReserva: Duracion.minutos(10),
    maxIntentosEmision,
  });
  return {
    orquestador,
    admision,
    localidades,
    reservas,
    pagos,
    compras,
    discrepancias,
    eventos,
    pasarela,
    emisor,
    precios,
    reloj,
  };
}
