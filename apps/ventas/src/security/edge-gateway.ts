import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { solicitudesBloqueadas, retosEmitidos } from "../observability/metrics.js";

/**
 * Borde de seguridad (AD-004 §1). Homólogo local de API Gateway + AWS WAF/Bot Control:
 * - Rate limiting con TOKEN BUCKET, con límites distintos por clase de ruta
 *   (catálogo, fila, checkout), usando la identidad/token como señal principal e IP como
 *   señal auxiliar (no se castiga a toda una red compartida).
 * - Detección de automatización por heurística: ráfagas muy rápidas o falta de cabeceras
 *   típicas de navegador elevan el riesgo; riesgo medio recibe un reto (429 con Retry-After),
 *   riesgo alto se bloquea. Ninguna señal aislada produce bloqueo permanente.
 *
 * En producción esto vive en el borde (CloudFront + WAF + API Gateway); aquí es un hook de
 * Fastify que se ejecuta antes que las rutas. No sustituye un WAF real: reduce abuso conocido
 * y entrega señales, como dice el ADR.
 */

interface Cubeta {
  tokens: number;
  ultimaRecarga: number;
}

interface Limite {
  capacidad: number; // tokens máximos (ráfaga)
  porSegundo: number; // recarga por segundo (tasa sostenida)
}

type ClaseRuta = "catalogo" | "fila" | "checkout" | "otros";

// Límites por clase de ruta (AD-004: distintos para catálogo, fila y checkout).
const LIMITES: Record<ClaseRuta, Limite> = {
  catalogo: { capacidad: 30, porSegundo: 15 },
  fila: { capacidad: 20, porSegundo: 10 },
  checkout: { capacidad: 10, porSegundo: 5 },
  otros: { capacidad: 40, porSegundo: 20 },
};

function claseDeRuta(ruta: string): ClaseRuta {
  if (ruta.startsWith("/fila")) return "fila";
  if (ruta.startsWith("/compras") || ruta.startsWith("/pagos")) return "checkout";
  if (ruta.startsWith("/catalogo") || ruta.startsWith("/eventos")) return "catalogo";
  return "otros";
}

export interface OpcionesGateway {
  /** Rutas que no pasan por el borde (salud, métricas, webhook interno). */
  exentas: string[];
}

export class BordeDeSeguridad {
  private readonly cubetas = new Map<string, Cubeta>();
  // Historial de tiempos de llegada por identidad, para detectar ráfagas robóticas.
  private readonly llegadas = new Map<string, number[]>();

  constructor(private readonly opciones: OpcionesGateway) {}

  /** Señal principal: identidad autenticada o token; auxiliar: IP. */
  private identidad(peticion: FastifyRequest): string {
    const fan = (peticion.headers["x-fan-id"] as string) || "";
    const auth = (peticion.headers["authorization"] as string) || "";
    const ip = peticion.ip || "sin-ip";
    return fan || auth || ip;
  }

  private tomarToken(clave: string, clase: ClaseRuta, ahora: number): boolean {
    const limite: Limite = LIMITES[clase];
    let cubeta = this.cubetas.get(clave);
    if (!cubeta) {
      cubeta = { tokens: limite.capacidad, ultimaRecarga: ahora };
      this.cubetas.set(clave, cubeta);
    }
    // Recarga proporcional al tiempo transcurrido (token bucket).
    const transcurridoS = (ahora - cubeta.ultimaRecarga) / 1000;
    cubeta.tokens = Math.min(limite.capacidad, cubeta.tokens + transcurridoS * limite.porSegundo);
    cubeta.ultimaRecarga = ahora;
    if (cubeta.tokens >= 1) {
      cubeta.tokens -= 1;
      return true;
    }
    return false;
  }

  /** Riesgo de automatización 0..1 por heurística simple. */
  private riesgoDeBot(peticion: FastifyRequest, clave: string, ahora: number): number {
    let riesgo = 0;
    // 1) Falta de User-Agent de navegador es señal débil.
    const ua = (peticion.headers["user-agent"] as string) || "";
    if (!ua || !/mozilla|chrome|safari|firefox|edge/i.test(ua)) {
      riesgo += 0.4;
    }
    // 2) Ráfaga: muchas llegadas en muy poco tiempo desde la misma identidad.
    const ventana = this.llegadas.get(clave) ?? [];
    const recientes = ventana.filter((t) => ahora - t < 2000);
    recientes.push(ahora);
    this.llegadas.set(clave, recientes.slice(-50));
    if (recientes.length > 20) riesgo += 0.5;
    else if (recientes.length > 12) riesgo += 0.3;
    return Math.min(1, riesgo);
  }

  registrar(app: FastifyInstance): void {
    app.addHook("onRequest", async (peticion: FastifyRequest, respuesta: FastifyReply) => {
      const ruta = peticion.routeOptions?.url ?? peticion.url;
      if (this.opciones.exentas.some((e) => ruta === e || ruta.startsWith(e))) {
        return;
      }
      const ahora = Date.now();
      const clave = this.identidad(peticion);
      const clase = claseDeRuta(ruta);

      // Detección de bots primero (riesgo alto se bloquea; medio recibe reto).
      const riesgo = this.riesgoDeBot(peticion, clave, ahora);
      if (riesgo >= 0.8) {
        solicitudesBloqueadas.inc({ motivo: "bot" });
        respuesta.code(403).send({ mensaje: "Solicitud bloqueada por comportamiento automatizado" });
        return respuesta;
      }
      if (riesgo >= 0.5) {
        retosEmitidos.inc();
        respuesta.header("retry-after", "2");
        respuesta.code(429).send({ mensaje: "Verificación requerida; reintente en unos segundos" });
        return respuesta;
      }

      // Rate limiting por token bucket según la clase de ruta.
      if (!this.tomarToken(`${clave}:${clase}`, clase, ahora)) {
        solicitudesBloqueadas.inc({ motivo: "rate_limit" });
        respuesta.header("retry-after", "1");
        respuesta.code(429).send({ mensaje: "Demasiadas solicitudes; reintente en breve" });
        return respuesta;
      }
      return;
    });
  }
}
