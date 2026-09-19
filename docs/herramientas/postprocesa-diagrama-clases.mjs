#!/usr/bin/env node

// Convierte el diagrama de arquitectura de Archify en un diagrama de clases UML:
// compartimentos (nombre, atributos, métodos) tomados del Markdown, marcadores UML según el
// prefijo del id de cada relación y multiplicidades en los extremos.
//
//   comp-  composición  ◆——>      agg-  agregación  ◇——>      assoc-  asociación ——>
//   dep-   dependencia  - - ->    real- realización - - -▷    gen-    generalización ——▷

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [fuenteArg, markdownArg, htmlArg] = process.argv.slice(2);
if (!fuenteArg || !markdownArg || !htmlArg) {
  console.error('Uso: node herramientas/postprocesa-diagrama-clases.mjs <fuente.json> <clases.md> <diagrama.html>');
  process.exit(1);
}

const marcador = '<!-- TicketRight: notación UML tomada del Markdown -->';
const fuente = JSON.parse(await readFile(resolve(fuenteArg), 'utf8'));
const markdown = await readFile(resolve(markdownArg), 'utf8');
let html = await readFile(resolve(htmlArg), 'utf8');
if (html.includes(marcador)) {
  console.log('El HTML ya tiene la notación UML.');
  process.exit(0);
}

// Filas «| Clase | «estereotipo» | `atributos` | `métodos` | Corresponde a |».
const clases = new Map();
for (const linea of markdown.split('\n')) {
  const celdas = linea.split('|').map((c) => c.trim());
  if (celdas.length < 6 || !celdas[2].startsWith('«')) continue;
  const items = (celda) => [...celda.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  clases.set(celdas[1], { estereotipo: celdas[2], atributos: items(celdas[3]), metodos: items(celdas[4]) });
}

const esc = (t) => t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// ---- Compartimentos -------------------------------------------------------------------
const faltantes = [];
for (const componente of fuente.components ?? []) {
  if (componente.tag === 'REFERENCIA') continue;
  const clase = clases.get(componente.label);
  if (!clase) { faltantes.push(componente.label); continue; }

  const inicio = html.indexOf(`<g id="node-${componente.id}"`);
  if (inicio === -1) throw new Error(`No se encontró el nodo ${componente.id}.`);
  const candidatos = [html.indexOf('\n        <g id="node-', inicio + 1), html.indexOf('\n        <!-- ', inicio + 1)].filter((i) => i !== -1);
  const limite = Math.min(...candidatos);

  const [x, y] = componente.pos;
  const [ancho] = componente.size;
  const cx = x + ancho / 2;
  const abstracto = clase.estereotipo === '«abstract»';
  const yEst = y + 13, yNombre = y + 27, ySep1 = y + 36;
  let bloque = html.slice(inicio, limite);

  bloque = bloque.replace(/(<text data-node-label=""[^>]*\sy=")[^"]+("[^>]*)(>)/, `$1${yNombre}$2${abstracto ? ' font-style="italic"' : ''}$3`);
  bloque = bloque.replace(/(<text data-detail="context"[^>]*\sy=")[^"]+("[^>]*font-size=")[^"]+("[^>]*>)/, `$1${yEst}$2 8$3`);
  bloque = bloque.replace(/<text data-detail="fine"[^>]*>[^<]*<\/text>/, '');

  const linea = (yy) => `<line x1="${x}" y1="${yy}" x2="${x + ancho}" y2="${yy}" stroke="currentColor" stroke-opacity="0.35" stroke-width="1"/>`;
  const lista = (items, yy) => items.length
    ? `<text data-detail="context" x="${cx}" y="${yy}" class="t-muted" font-size="9.5" text-anchor="start">` +
      items.map((t, i) => `<tspan x="${x + 12}" dy="${i ? 13 : 0}">${esc(t)}</tspan>`).join('') + '</text>'
    : '';
  const altoAttrs = clase.atributos.length ? 13 * clase.atributos.length : 8;
  const ySep2 = ySep1 + altoAttrs + 8;
  const extra = [linea(ySep1), lista(clase.atributos, ySep1 + 14), linea(ySep2), lista(clase.metodos, ySep2 + 14)].join('\n          ');
  bloque = bloque.replace(/\n        <\/g>\s*$/, `\n          ${extra}\n        </g>`);
  if (!bloque.includes(extra)) bloque = bloque.replace(/<\/g>(?![\s\S]*<\/g>)/, `${extra}\n        </g>`);
  html = html.slice(0, inicio) + bloque + html.slice(limite);
}
if (faltantes.length) throw new Error(`Sin fila en el Markdown para: ${faltantes.join(', ')}.`);

// ---- Marcadores UML ------------------------------------------------------------------
const defs = `
<marker id="uml-diamond-filled" markerWidth="14" markerHeight="10" refX="0" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,5 L7,0 L14,5 L7,10 z" fill="var(--arrow)" stroke="var(--arrow)"/></marker>
<marker id="uml-diamond-hollow" markerWidth="14" markerHeight="10" refX="0" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,5 L7,0 L14,5 L7,10 z" fill="var(--mask)" stroke="var(--arrow)" stroke-width="1.2"/></marker>
<marker id="uml-triangle-hollow" markerWidth="12" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L12,6 L0,12 z" fill="var(--mask)" stroke="var(--arrow)" stroke-width="1.2"/></marker>
<marker id="uml-arrow-open" markerWidth="11" markerHeight="11" refX="11" refY="5.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L11,5.5 L0,11" fill="none" stroke="var(--arrow)" stroke-width="1.3"/></marker>
`;
html = html.replace(/(<svg\b[^>]*>)/, `$1${defs}`);

const notacion = {
  comp: { start: 'uml-diamond-filled', end: 'uml-arrow-open', dashed: false },
  agg: { start: 'uml-diamond-hollow', end: 'uml-arrow-open', dashed: false },
  assoc: { start: null, end: 'uml-arrow-open', dashed: false },
  dep: { start: null, end: 'uml-arrow-open', dashed: true },
  real: { start: null, end: 'uml-triangle-hollow', dashed: true },
  gen: { start: null, end: 'uml-triangle-hollow', dashed: false },
};

for (const conexion of fuente.connections ?? []) {
  const tipo = conexion.id.split('-')[0];
  const n = notacion[tipo];
  if (!n) throw new Error(`Relación ${conexion.id}: el prefijo «${tipo}» no es una notación UML conocida.`);
  const re = new RegExp(`<path ([^>]*data-edge-id="${conexion.id}"[^>]*)/>`);
  const m = html.match(re);
  if (!m) throw new Error(`No se encontró la relación ${conexion.id}.`);
  let attrs = m[1]
    .replace(/ marker-end="[^"]*"/, ` marker-end="url(#${n.end})"`)
    .replace(/ class="a-[a-z]+"/, ` class="a-default"${n.dashed ? ' stroke-dasharray="5,4"' : ''}`);
  if (n.start) attrs += ` marker-start="url(#${n.start})"`;
  html = html.replace(m[0], `<path ${attrs}/>`);

  // Multiplicidades «nombre · m1 → m2»: m1 junto al origen, m2 junto al destino.
  const mult = conexion.label?.match(/^(.*?)(?: · )?(\S+) → (\S+)$/);
  if (!mult) continue;
  const [, nombre, m1, m2] = mult;
  const puntos = m[1].match(/data-composition-points="([^"]+)"/)[1].split(';').map((p) => p.split(',').map(Number));
  const texto = (p, q, t) => {
    const dx = Math.sign(q[0] - p[0]), dy = Math.sign(q[1] - p[1]);
    const tx = p[0] + dx * 18 + (dy ? 8 : 0), ty = p[1] + dy * 18 + (dx ? -6 : 4);
    return `<text data-detail="context" x="${tx}" y="${ty}" class="t-muted" font-size="8.5" text-anchor="${dy ? 'start' : 'middle'}">${esc(t)}</text>`;
  };
  const ini = texto(puntos[0], puntos[1], m1);
  const fin = texto(puntos[puntos.length - 1], puntos[puntos.length - 2], m2);
  const grupo = new RegExp(`(<g data-detail="context" [^>]*data-edge-id="${conexion.id}"[^>]*>)([\\s\\S]*?)(</g>)`);
  html = html.replace(grupo, (todo, abre, cuerpo, cierra) => {
    const nuevoCuerpo = nombre
      ? cuerpo
          .replace(/(<rect x=")([^"]+)(" [^>]*width=")([^"]+)(")/, (r, a, rx, b, rw, c) => {
            const w = Math.max(30, nombre.length * 4.8 + 10);
            return `${a}${Number(rx) + (Number(rw) - w) / 2}${b}${w}${c}`;
          })
          .replace(/>[^<]*<\/text>/, `>${esc(nombre)}</text>`)
      : '';
    return `${abre}${nuevoCuerpo}\n          ${ini}\n          ${fin}\n        ${cierra}`;
  });
}

html = html.replace('<body>', `<body>\n  ${marcador}`);
await writeFile(resolve(htmlArg), html, 'utf8');
console.log(`Notación UML aplicada a ${fuente.components.length} clases y ${fuente.connections.length} relaciones en ${htmlArg}.`);
