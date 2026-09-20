import type { FastifyInstance } from "fastify";

import {
  ExcepcionDeDominio,
  type OrquestadorDeCompra,
  type RepositorioDeCompras,
  type RepositorioDeDiscrepancias,
  type RepositorioDeLocalidades,
  type RepositorioDePagos,
  type RepositorioDeReservas,
} from "@ticketright/sales";

import type { PasarelaSimulada } from "../adapters/simulated-gateway.js";
import { boletasPorPago } from "../adapters/postgres/ticket-issuer.js";
import type { Consultable } from "../db/pool.js";

export class ErrorDeSolicitud extends Error {}

export interface DependenciasDeRutas {
  orquestador: OrquestadorDeCompra;
  localidades: RepositorioDeLocalidades;
  reservas: RepositorioDeReservas;
  pagos: RepositorioDePagos;
  compras: RepositorioDeCompras;
  discrepancias: RepositorioDeDiscrepancias;
  pasarela: PasarelaSimulada;
  consultas: Consultable;
}

interface CuerpoDeCompra {
  fanId?: string;
  identidadRef?: string;
  tokenAdmision?: string;
  localidadId?: string;
  cantidad?: number;
  sillaIds?: string[];
}

interface CuerpoDePago {
  medio?: "tarjeta" | "pse" | "billetera";
  tokenTarjeta?: string;
  claveIdempotencia?: string;
}

interface CuerpoDeWebhook {
  pagoId?: string;
  referenciaExterna?: string;
  aprobado?: boolean;
  firma?: string;
}

function exigir<T>(valor: T | undefined, campo: string): T {
  if (valor === undefined || valor === null || valor === "") {
    throw new ErrorDeSolicitud(`Falta el campo ${campo}`);
  }
  return valor;
}

export function registrarRutas(app: FastifyInstance, deps: DependenciasDeRutas): void {
  app.get("/health", async () => ({ ok: true }));

  app.post("/compras", async (peticion, respuesta) => {
    const cuerpo = peticion.body as CuerpoDeCompra;
    const fanId = exigir(cuerpo.fanId, "fanId");
    const sillaIds = cuerpo.sillaIds ?? [];
    const compra = await deps.orquestador.reservar(
      {
        fanId,
        identidadRef: cuerpo.identidadRef ?? `ref-${fanId}`,
        tokenAdmision: exigir(cuerpo.tokenAdmision, "tokenAdmision"),
        localidadId: exigir(cuerpo.localidadId, "localidadId"),
        cantidad: cuerpo.cantidad ?? (sillaIds.length > 0 ? sillaIds.length : 1),
        sillaIds,
      },
      new Date(),
    );
    const reserva = await deps.reservas.obtener(compra.reservaId);
    respuesta.code(201);
    return {
      compraId: compra.compraId,
      reservaId: compra.reservaId,
      paso: compra.paso,
      venceEn: reserva.venceEn,
      totalCentavos: reserva.total().valorCentavos,
    };
  });

  app.post("/compras/:compraId/pago", async (peticion, respuesta) => {
    const parametros = peticion.params as { compraId: string };
    const cuerpo = peticion.body as CuerpoDePago;
    const pago = await deps.orquestador.iniciarPago(
      {
        compraId: parametros.compraId,
        medio: cuerpo.medio ?? "tarjeta",
        tokenTarjeta: cuerpo.tokenTarjeta ?? "token-de-demostracion",
        claveIdempotencia: cuerpo.claveIdempotencia ?? `pago-${parametros.compraId}`,
      },
      new Date(),
    );
    respuesta.code(202);
    return { pagoId: pago.id, estado: pago.estado, montoCentavos: pago.monto.valorCentavos };
  });

  app.post("/pagos/webhook", async (peticion) => {
    const cuerpo = peticion.body as CuerpoDeWebhook;
    await deps.orquestador.confirmarPago(
      {
        pagoId: exigir(cuerpo.pagoId, "pagoId"),
        referenciaExterna: cuerpo.referenciaExterna ?? `manual-${Date.now()}`,
        aprobado: cuerpo.aprobado ?? true,
        firma: cuerpo.firma ?? "simulada",
      },
      new Date(),
    );
    return { ok: true };
  });

  app.get("/compras/:compraId", async (peticion, respuesta) => {
    const parametros = peticion.params as { compraId: string };
    let compra;
    try {
      compra = await deps.compras.obtener(parametros.compraId);
    } catch {
      respuesta.code(404);
      return { mensaje: `No existe la compra ${parametros.compraId}` };
    }
    const reserva = await deps.reservas.obtener(compra.reservaId);
    const pago = compra.pagoId ? await deps.pagos.obtener(compra.pagoId) : undefined;
    const boletas = pago ? await boletasPorPago(deps.consultas, pago.id) : [];
    const discrepancias = pago ? await deps.discrepancias.abiertasPorPago(pago.id) : [];
    return {
      compra: { compraId: compra.compraId, paso: compra.paso, intentos: compra.intentos },
      reserva: { reservaId: compra.reservaId, estado: reserva.estado, venceEn: reserva.venceEn },
      pago: pago
        ? {
            pagoId: pago.id,
            estado: pago.estado,
            montoCentavos: pago.monto.valorCentavos,
            referenciaExterna: pago.referenciaExterna,
          }
        : undefined,
      boletas,
      discrepancias: discrepancias.map((discrepancia) => ({
        discrepanciaId: discrepancia.discrepanciaId,
        tipo: discrepancia.tipo,
        detectadaEn: discrepancia.detectadaEn,
      })),
    };
  });

  app.post("/demo/pasarela/confirmar/:pagoId", async (peticion, respuesta) => {
    const parametros = peticion.params as { pagoId: string };
    const pago = await deps.pagos.obtener(parametros.pagoId);
    await deps.pasarela.confirmarManualmente(pago);
    respuesta.code(202);
    return { ok: true };
  });

  app.setErrorHandler((error, _peticion, respuesta) => {
    if (error instanceof ErrorDeSolicitud) {
      respuesta.code(400);
      return { mensaje: error.message };
    }
    if (error instanceof ExcepcionDeDominio) {
      respuesta.code(409);
      return { regla: error.regla, mensaje: error.mensaje };
    }
    app.log.error(error);
    respuesta.code(500);
    return { mensaje: "Error interno" };
  });
}
