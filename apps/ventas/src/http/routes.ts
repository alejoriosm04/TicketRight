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

import type { GestorDePerfiles, PerfilOperativo } from "../adapters/operational-profiles.js";
import type { PasarelaSimulada } from "../adapters/simulated-gateway.js";
import type { Fila } from "../adapters/waiting-room.js";
import type { ServicioDeCuentas } from "../security/accounts.js";
import { boletasPorPago } from "../adapters/postgres/ticket-issuer.js";
import type { Consultable } from "../db/pool.js";
import { registrarHecho } from "../observability/logger.js";
import {
  boletasVendidas,
  desgloseDeVentas,
  duracionConsultaFila,
  duracionEmision,
  duracionHttp,
  duracionReserva,
  erroresReserva,
  ingresosAFila,
  pagosIniciados,
  pagosPorEstado,
  registro,
  reservasCreadas,
  solicitudesHttp,
  transicionesDeBoleta,
  ventasConfirmadas,
} from "../observability/metrics.js";

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
  sala: Fila;
  eventoId: string;
  perfiles: GestorDePerfiles;
  cuentas: ServicioDeCuentas;
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
  // Método RED: mide tasa, errores y duración de cada solicitud HTTP por método y ruta.
  // Se usa el patrón de la ruta (no la URL con ids) para no explotar la cardinalidad.
  app.addHook("onRequest", async (peticion) => {
    (peticion as { inicioMetrica?: [number, number] }).inicioMetrica = process.hrtime();
  });
  app.addHook("onResponse", async (peticion, respuesta) => {
    const ruta = peticion.routeOptions?.url ?? peticion.url;
    if (ruta === "/metrics") {
      return;
    }
    const inicio = (peticion as { inicioMetrica?: [number, number] }).inicioMetrica;
    if (inicio) {
      const [segundos, nanos] = process.hrtime(inicio);
      duracionHttp.observe({ method: peticion.method, route: ruta }, segundos + nanos / 1e9);
    }
    solicitudesHttp.inc({
      method: peticion.method,
      route: ruta,
      status: String(respuesta.statusCode),
    });
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/metrics", async (_peticion, respuesta) => {
    respuesta.header("content-type", registro.contentType);
    return registro.metrics();
  });

  // --- Catálogo (lectura CQRS): eventos y tribunas con disponibilidad en vivo ---
  // Alimenta la plataforma web. Es una consulta de lectura sobre PostgreSQL (la
  // autoridad); no toca el camino de escritura.
  app.get("/catalogo", async (peticion) => {
    const q = ((peticion.query as { q?: string }).q ?? "").trim().toLowerCase();
    const { rows: eventos } = await deps.consultas.query(
      `select evento_id, nombre, artista, recinto, ciudad, fecha, categoria,
              descripcion, imagen, destacado
       from eventos order by destacado desc, fecha asc nulls last, nombre`,
    );
    const { rows: locs } = await deps.consultas.query(
      `select localidad_id, coalesce(nombre, localidad_id::text) as nombre, tipo,
              precio_centavos, aforo_autorizado, aforo_reservado, aforo_vendido, evento_id
       from localidades order by precio_centavos desc`,
    );
    const catalogo = eventos.map((e) => ({
      eventoId: String(e.evento_id),
      nombre: String(e.nombre),
      artista: e.artista ? String(e.artista) : "",
      recinto: e.recinto ? String(e.recinto) : "",
      ciudad: e.ciudad ? String(e.ciudad) : "",
      fecha: e.fecha ? new Date(e.fecha as string).toISOString() : null,
      categoria: e.categoria ? String(e.categoria) : "General",
      descripcion: e.descripcion ? String(e.descripcion) : "",
      imagen: e.imagen ? String(e.imagen) : "",
      destacado: Boolean(e.destacado),
      localidades: locs
        .filter((l) => String(l.evento_id) === String(e.evento_id))
        .map((l) => {
          const aut = Number(l.aforo_autorizado);
          const disp = aut - Number(l.aforo_reservado) - Number(l.aforo_vendido);
          return {
            localidadId: String(l.localidad_id),
            nombre: String(l.nombre),
            tipo: String(l.tipo),
            precioCentavos: Number(l.precio_centavos),
            aforoAutorizado: aut,
            disponibles: disp,
          };
        }),
    }));
    // Búsqueda por nombre, artista, recinto o ciudad (búsqueda en tiempo real del front).
    const filtrados = q
      ? catalogo.filter((e) =>
          [e.nombre, e.artista, e.recinto, e.ciudad, e.categoria]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : catalogo;
    return { eventos: filtrados };
  });

  // --- Cuentas de fan (identidad; homólogo local de Cognito, AD-004) --------

  app.post("/auth/registro", async (peticion, respuesta) => {
    const c = peticion.body as { correo?: string; clave?: string; nombre?: string; documento?: string };
    try {
      const r = await deps.cuentas.registrar(
        exigir(c.correo, "correo"),
        exigir(c.clave, "clave"),
        c.nombre ?? "",
        c.documento ?? "",
      );
      respuesta.code(201);
      return r;
    } catch (error) {
      respuesta.code(409);
      return { mensaje: (error as Error).message };
    }
  });

  app.post("/auth/ingreso", async (peticion, respuesta) => {
    const c = peticion.body as { correo?: string; clave?: string };
    try {
      return await deps.cuentas.ingresar(exigir(c.correo, "correo"), exigir(c.clave, "clave"));
    } catch (error) {
      respuesta.code(401);
      return { mensaje: (error as Error).message };
    }
  });

  app.get("/auth/perfil", async (peticion, respuesta) => {
    const auth = (peticion.headers["authorization"] as string) ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const cuentaId = deps.cuentas.validarSesion(token);
    if (!cuentaId) {
      respuesta.code(401);
      return { mensaje: "Sesión inválida" };
    }
    return { perfil: await deps.cuentas.perfil(cuentaId) };
  });

  app.put("/auth/perfil", async (peticion, respuesta) => {
    const auth = (peticion.headers["authorization"] as string) ?? "";
    const cuentaId = deps.cuentas.validarSesion(auth.replace(/^Bearer\s+/i, ""));
    if (!cuentaId) {
      respuesta.code(401);
      return { mensaje: "Sesión inválida" };
    }
    const c = peticion.body as { nombre?: string; documento?: string };
    return { perfil: await deps.cuentas.actualizar(cuentaId, c.nombre ?? "", c.documento ?? "") };
  });

  // --- Sala de espera / fila de admisión ------------------------------------

  app.post("/fila/entrar", async (peticion, respuesta) => {
    const cuerpo = peticion.body as { fanId?: string };
    const fanId = exigir(cuerpo.fanId, "fanId");
    const turno = await deps.sala.entrar(fanId);
    ingresosAFila.inc({ evento: deps.eventoId });
    registrarHecho("entrar_fila", "ingreso_a_fila", "ok", { turno_id: turno.turnoId });
    respuesta.code(201);
    return { turnoId: turno.turnoId, estado: turno.estado };
  });

  app.get("/fila/:turnoId", async (peticion, respuesta) => {
    const parametros = peticion.params as { turnoId: string };
    const finReloj = duracionConsultaFila.startTimer();
    const estado = await deps.sala.estado(parametros.turnoId);
    finReloj();
    if (!estado) {
      respuesta.code(404);
      return { mensaje: `No existe el turno ${parametros.turnoId} en la fila` };
    }
    return estado;
  });

  // --- Perfil operativo (AD-006, homólogo EventBridge Scheduler) ------------

  app.get("/operacion/perfil", async () => ({
    perfil: deps.perfiles.actual,
    ajustes: deps.perfiles.ajustes,
  }));

  app.post("/operacion/perfil", async (peticion, respuesta) => {
    const cuerpo = peticion.body as { perfil?: PerfilOperativo };
    const validos: PerfilOperativo[] = [
      "cotidiano",
      "preparacion",
      "pico",
      "recuperacion",
      "emergencia",
    ];
    if (!cuerpo.perfil || !validos.includes(cuerpo.perfil)) {
      respuesta.code(400);
      return { mensaje: `perfil inválido; use uno de: ${validos.join(", ")}` };
    }
    deps.perfiles.cambiarA(cuerpo.perfil);
    registrarHecho("cambiar_perfil", "perfil_operativo_cambiado", "ok", { perfil: cuerpo.perfil });
    return { perfil: deps.perfiles.actual, ajustes: deps.perfiles.ajustes };
  });

  app.post("/compras", async (peticion, respuesta) => {
    const cuerpo = peticion.body as CuerpoDeCompra;
    const fanId = exigir(cuerpo.fanId, "fanId");
    const sillaIds = cuerpo.sillaIds ?? [];
    // Histograma del tiempo de confirmación de la reserva (A-10, meta P95 ≤ 2 s).
    const finReloj = duracionReserva.startTimer();
    let compra;
    try {
      compra = await deps.orquestador.reservar(
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
    } catch (error) {
      finReloj({ result: "error" });
      reservasCreadas.inc({ result: "rechazada" });
      if (error instanceof ExcepcionDeDominio) {
        erroresReserva.inc({ kind: "dominio" });
      } else if (error instanceof ErrorDeSolicitud) {
        erroresReserva.inc({ kind: "solicitud" });
      } else {
        erroresReserva.inc({ kind: "tecnico" });
      }
      throw error;
    }
    finReloj({ result: "ok" });
    reservasCreadas.inc({ result: "ok" });
    registrarHecho("crear_reserva", "reserva_creada", "ok", {
      compra_id: compra.compraId,
      localidad: exigir(cuerpo.localidadId, "localidadId"),
    });
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
    pagosIniciados.inc();
    registrarHecho("iniciar_pago", "pago_solicitado", "pendiente", {
      pago_id: pago.id,
      monto_centavos: pago.monto.valorCentavos,
    });
    respuesta.code(202);
    return { pagoId: pago.id, estado: pago.estado, montoCentavos: pago.monto.valorCentavos };
  });

  app.post("/pagos/webhook", async (peticion) => {
    const cuerpo = peticion.body as CuerpoDeWebhook;
    const pagoId = exigir(cuerpo.pagoId, "pagoId");
    // Estado antes de confirmar: distinguir una confirmación nueva de un webhook repetido.
    const estadoPrevio = (await deps.pagos.obtener(pagoId)).estado;
    const finEmision = duracionEmision.startTimer();
    await deps.orquestador.confirmarPago(
      {
        pagoId,
        referenciaExterna: cuerpo.referenciaExterna ?? `manual-${Date.now()}`,
        aprobado: cuerpo.aprobado ?? true,
        firma: cuerpo.firma ?? "simulada",
      },
      new Date(),
    );
    const emitio = await medirResultadoDePago(deps, pagoId, estadoPrevio);
    // Solo cronometramos la emisión cuando efectivamente se emitieron boletas nuevas.
    if (emitio) {
      finEmision({ result: "emitida" });
    }
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

  async function medirResultadoDePago(
    dependencias: DependenciasDeRutas,
    pagoId: string,
    estadoPrevio: string,
  ): Promise<boolean> {
    const pago = await dependencias.pagos.obtener(pagoId);
    // Contamos el pago por su estado solo cuando hubo una transición real; un webhook
    // repetido llega con el pago ya en el mismo estado y no debe volver a sumarse (idempotencia).
    if (pago.estado === estadoPrevio) {
      return false;
    }
    pagosPorEstado.inc({ state: pago.estado });
    if (pago.estado === "confirmado") {
      // Solo el dinero efectivamente confirmado entra al acumulado de ventas (A-1 · OKR-3).
      ventasConfirmadas.inc(
        { currency: pago.monto.moneda },
        pago.monto.valorCentavos,
      );
      const boletas = await boletasPorPago(dependencias.consultas, pago.id);
      transicionesDeBoleta.inc({ state: "emitida" }, boletas.length);
      await medirDesgloseYBoletas(dependencias, pago.id);
      registrarHecho("confirmar_pago", "pago_confirmado", "ok", {
        pago_id: pago.id,
        boletas_emitidas: boletas.length,
        monto_centavos: pago.monto.valorCentavos,
      });
      return boletas.length > 0;
    }
    if (pago.estado === "rechazado") {
      registrarHecho("confirmar_pago", "pago_rechazado", "compensado", { pago_id: pago.id });
    }
    return false;
  }

  async function medirDesgloseYBoletas(
    dependencias: DependenciasDeRutas,
    pagoId: string,
  ): Promise<void> {
    const compra = await dependencias.compras.porPago(pagoId);
    if (!compra) {
      return;
    }
    const reserva = await dependencias.reservas.obtener(compra.reservaId);
    // Nombre legible de cada localidad, para etiquetar las boletas vendidas.
    const { rows } = await dependencias.consultas.query(
      "select localidad_id, coalesce(nombre, localidad_id::text) as nombre from localidades",
    );
    const nombrePorId = new Map(rows.map((f) => [String(f.localidad_id), String(f.nombre)]));
    for (const item of reserva.items) {
      // Desglose del dinero: nominal a la promotora, servicio a la ticketera, parafiscal impuesto.
      desgloseDeVentas.inc({ component: "nominal" }, item.precio.valorNominal.valorCentavos);
      desgloseDeVentas.inc({ component: "cargo_servicio" }, item.precio.cargoServicio.valorCentavos);
      desgloseDeVentas.inc({ component: "parafiscal" }, item.precio.contribucionParafiscal.valorCentavos);
      const localidad = nombrePorId.get(item.localidadId) ?? item.localidadId;
      boletasVendidas.inc({ localidad }, item.cantidad);
    }
  }

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
