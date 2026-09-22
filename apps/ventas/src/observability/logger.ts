import path from "node:path";
import { fileURLToPath } from "node:url";

import { trace } from "@opentelemetry/api";
import pino from "pino";

/**
 * Logger estructurado en JSON con el esquema definido en el diseño
 * (docs/proyecto/02-modelamiento/observabilidad.md#logs-estructurados-y-seguros):
 * service, service_version, environment, operation, event_type, outcome, y correlación
 * con la traza activa (trace_id, span_id). No se registran datos personales.
 *
 * La salida es a stdout; Grafana Alloy la recoge y la envía a Loki. Así el log no depende
 * de archivos locales que desaparecen al reemplazar un contenedor.
 */
export const opcionesDeLog = {
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "ventas",
    service_version: "0.0.0",
    environment: process.env.DEPLOY_ENV ?? "demo",
  },
  formatters: {
    level(label: string) {
      return { level: label };
    },
    log(objeto: Record<string, unknown>) {
      // Adjunta el contexto de traza activo para poder saltar de un log a su traza.
      const span = trace.getActiveSpan();
      if (span) {
        const ctx = span.spanContext();
        return { ...objeto, trace_id: ctx.traceId, span_id: ctx.spanId };
      }
      return objeto;
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  messageKey: "message",
};

// En la demo, además de stdout escribimos a un archivo JSON que Alloy recoge para Loki.
// Si LOG_FILE no está definido, se escribe solo a stdout. Las rutas relativas se
// resuelven contra la raíz del repositorio (dos niveles arriba de apps/ventas/src/...),
// no contra el cwd del proceso, que depende de cómo se lance el workspace.
const raizRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const archivoDeLogEnv = process.env.LOG_FILE;
const archivoDeLog = archivoDeLogEnv
  ? path.isAbsolute(archivoDeLogEnv)
    ? archivoDeLogEnv
    : path.resolve(raizRepo, archivoDeLogEnv)
  : undefined;

export const logger = archivoDeLog
  ? pino(opcionesDeLog, pino.destination({ dest: archivoDeLog, sync: false, mkdir: true }))
  : pino(opcionesDeLog);

/** Registra una transición de negocio con nombre estable (event_type). */
export function registrarHecho(
  operation: string,
  event_type: string,
  outcome: string,
  extra: Record<string, unknown> = {},
): void {
  logger.info({ operation, event_type, outcome, ...extra }, event_type);
}
