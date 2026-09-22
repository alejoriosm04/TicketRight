import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

/**
 * Arranque de OpenTelemetry para el servicio de ventas. Se importa antes que cualquier
 * otro módulo (ver main.ts) para que la auto-instrumentación envuelva HTTP y PostgreSQL.
 *
 * Implementa la parte de instrumentación de la plataforma de observabilidad diseñada
 * (docs/proyecto/02-modelamiento/observabilidad.md): OpenTelemetry SDK exportando por OTLP
 * hacia Grafana Alloy, que a su vez reparte a Tempo (trazas), Prometheus y Loki. En la demo
 * el endpoint OTLP se toma de OTEL_EXPORTER_OTLP_ENDPOINT; si no está, no exporta (la app
 * funciona igual, solo sin trazas).
 */
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

let sdk: NodeSDK | undefined;

if (endpoint) {
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "ventas",
      [ATTR_SERVICE_VERSION]: "0.0.0",
      "deployment.environment": process.env.DEPLOY_ENV ?? "demo",
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // El sistema de archivos genera ruido y no aporta al recorrido de compra.
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });
  sdk.start();
  process.on("SIGTERM", () => void sdk?.shutdown());
  process.on("SIGINT", () => void sdk?.shutdown());
  console.log(`OpenTelemetry activo; exportando trazas a ${endpoint}`);
}

export {};
