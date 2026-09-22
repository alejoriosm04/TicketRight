import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * Portal estático (AD-004 §1 · arquitectura de implementación: S3 + CloudFront). Sirve el
 * prototipo navegable (16 pantallas) como contenido estático versionado, sin tocar los
 * servicios dinámicos, con cabeceras de caché y validación por ETag. Homólogo local del
 * borde de contenido: en producción es S3 detrás de CloudFront con Origin Access Control;
 * aquí es una ruta de solo lectura servida desde el disco.
 *
 * El portal consume las APIs por el mismo dominio (mismas rutas /fila, /compras…), como fija
 * la arquitectura.
 */
const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

export interface OpcionesPortal {
  /** Carpeta raíz del contenido estático (el prototipo). */
  raiz: string;
}

export function registrarPortalEstatico(app: FastifyInstance, opciones: OpcionesPortal): void {
  const raiz = path.resolve(opciones.raiz);

  async function servir(peticion: FastifyRequest, respuesta: FastifyReply): Promise<unknown> {
    // Ruta pedida bajo /portal; por defecto index.html.
    const rel = (peticion.params as { "*"?: string })["*"] || "index.html";
    // Evita el salto de directorio (path traversal): la ruta resuelta debe seguir dentro de raíz.
    const destino = path.resolve(raiz, rel);
    if (!destino.startsWith(raiz)) {
      respuesta.code(403);
      return { mensaje: "Ruta no permitida" };
    }
    try {
      const info = await stat(destino);
      if (!info.isFile()) {
        respuesta.code(404);
        return { mensaje: "No encontrado" };
      }
      const contenido = await readFile(destino);
      const ext = path.extname(destino).toLowerCase();
      // ETag por contenido: permite validación de caché (304) como en un CDN.
      const etag = `"${createHash("sha1").update(contenido).digest("hex").slice(0, 16)}"`;
      if (peticion.headers["if-none-match"] === etag) {
        respuesta.code(304);
        return null;
      }
      respuesta.header("content-type", TIPOS[ext] ?? "application/octet-stream");
      respuesta.header("etag", etag);
      // HTML se revalida siempre; los estáticos versionados se cachean agresivamente.
      respuesta.header(
        "cache-control",
        ext === ".html" ? "no-cache" : "public, max-age=3600",
      );
      return contenido;
    } catch {
      respuesta.code(404);
      return { mensaje: "No encontrado" };
    }
  }

  // /portal (sin barra) redirige a /portal/ para que las rutas relativas del prototipo
  // (estilos.css, nav.js, fan-*.html) resuelvan bajo /portal/ y no en la raíz del sitio.
  app.get("/portal", async (_peticion, respuesta) => {
    respuesta.redirect("/portal/", 301);
  });
  app.get("/portal/", servir);
  app.get("/portal/*", servir);
}
