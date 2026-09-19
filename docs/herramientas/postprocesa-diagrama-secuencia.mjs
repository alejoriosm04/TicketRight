#!/usr/bin/env node

// Convierte las bandas de Archify que representan fragmentos combinados (alt, opt, loop,
// par, break) en marcos UML: recuadro acotado a las líneas de vida que participan, con la
// pestaña del operador y la guarda. Las bandas de fase (numeradas) se conservan como están.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [fuenteArg, htmlArg] = process.argv.slice(2);
if (!fuenteArg || !htmlArg) {
  console.error('Uso: node herramientas/postprocesa-diagrama-secuencia.mjs <fuente.json> <diagrama.html>');
  process.exit(1);
}
const marcador = '<!-- TicketRight: fragmentos combinados UML -->';
const fuente = JSON.parse(await readFile(resolve(fuenteArg), 'utf8'));
let html = await readFile(resolve(htmlArg), 'utf8');
if (html.includes(marcador)) { console.log('El HTML ya tiene los fragmentos UML.'); process.exit(0); }

// x de cada línea de vida, en el orden de los participantes.
const lineas = [...html.matchAll(/<path d="M ([\d.]+) [\d.]+ L [\d.]+ [\d.]+" class="a-default" stroke-width="0\.8" stroke-dasharray="3,7"\/>/g)].map((m) => Number(m[1]));
if (lineas.length !== fuente.participants.length) throw new Error(`Esperaba ${fuente.participants.length} líneas de vida y encontré ${lineas.length}.`);
const xDe = Object.fromEntries(fuente.participants.map((p, i) => [p.id, lineas[i]]));
const esc = (t) => t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

let n = 0;
fuente.segments.forEach((seg, i) => {
  const m = seg.label.match(/^(alt|opt|loop|par|break)\s+\[(.+)\]$/);
  if (!m) return;
  const [, operador, guarda] = m;
  const dentro = fuente.messages.filter((msg) => msg.y >= seg.from && msg.y <= seg.to);
  const xs = dentro.flatMap((msg) => [xDe[msg.from], xDe[msg.to]]);
  const x0 = Math.min(...xs) - 82, x1 = Math.max(...xs) + 82;

  const rectRe = new RegExp(`<rect data-graph-role="structural-frame" data-composition-frame-kind="segment" data-composition-frame-id="${i}" x="[^"]+" y="([^"]+)" width="[^"]+" height="([^"]+)" rx="[^"]+" class="c-lane" stroke-width="1"/>`);
  const r = html.match(rectRe);
  if (!r) throw new Error(`No se encontró la banda del fragmento ${i}.`);
  const y = Number(r[1]), h = Number(r[2]);
  html = html.replace(r[0], `<rect data-graph-role="structural-frame" data-composition-frame-kind="segment" data-composition-frame-id="${i}" x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" rx="2" fill="none" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.2"/>`);

  const labelRe = new RegExp(`<g data-graph-role="segment-label" data-segment-id="${i}">[\\s\\S]*?</g>`);
  const anchoTab = operador.length * 6.5 + 18;
  const tab = `<g data-graph-role="segment-label" data-segment-id="${i}">
          <path d="M ${x0} ${y} H ${x0 + anchoTab} V ${y + 12} L ${x0 + anchoTab - 6} ${y + 18} H ${x0} Z" class="c-mask" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.2"/>
          <text x="${x0 + 8}" y="${y + 13}" class="t-primary" font-size="10" font-weight="700">${operador}</text>
          <text x="${x0 + anchoTab + 10}" y="${y + 13}" class="t-dim" font-size="9">[${esc(guarda)}]</text>
        </g>`;
  html = html.replace(labelRe, tab);
  n += 1;
});

// Las notas de mensaje (llamadas plegadas: validador, calculadora, firma) se leen sin zoom.
html = html.replace(/(<text data-detail="fine" [^>]*class="t-dim" font-size=")7(")/g, '$18.5$2');

// Legibilidad: contraste WCAG AA en el texto del tema claro y un halo del color del fondo
// para las notas y las etiquetas de fragmento, que van montadas sobre líneas de vida.
const estilo = `<style id="ticketright-legibilidad">
html[data-preset="classic"][data-theme="light"] .t-dim{fill:#475569}
html[data-preset="classic"][data-theme="light"] .t-muted{fill:#475569}
html[data-preset="classic"][data-theme="light"] .t-backend{fill:#047857}
html[data-preset="classic"][data-theme="light"] .t-messagebus{fill:#c2410c}
html[data-preset="classic"][data-theme="light"] .t-security{fill:#be123c}
html[data-preset="classic"][data-theme="dark"] .t-dim{fill:#94a3b8}
html[data-preset="classic"] text[data-detail="fine"],
html[data-preset="classic"] g[data-graph-role="segment-label"] text{paint-order:stroke;stroke:var(--bg);stroke-width:2.6px;stroke-linejoin:round}
</style>`;
if (!html.includes('id="ticketright-legibilidad"')) html = html.replace('</head>', `${estilo}\n</head>`);

html = html.replace('<body>', `<body>\n  ${marcador}`);
await writeFile(resolve(htmlArg), html, 'utf8');
console.log(`${n} fragmentos combinados dibujados como marcos UML en ${htmlArg}.`);
