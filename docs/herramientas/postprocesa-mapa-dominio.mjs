#!/usr/bin/env node

// Dibuja dos atributos clave —los más importantes— dentro de cada raíz de agregado del
// mapa de contextos. El texto sale del Markdown (es la fuente); este script solo elige
// cuáles se muestran, para que el mapa siga cabiendo en una pantalla.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [fuenteArg, markdownArg, htmlArg] = process.argv.slice(2);
if (!fuenteArg || !markdownArg || !htmlArg) {
  console.error('Uso: node herramientas/postprocesa-mapa-dominio.mjs <fuente.json> <modelo.md> <mapa.html>');
  process.exit(1);
}

const marcador = '<!-- TicketRight: atributos clave del mapa de dominio -->';
const fuente = JSON.parse(await readFile(resolve(fuenteArg), 'utf8'));
const markdown = await readFile(resolve(markdownArg), 'utf8');
let html = await readFile(resolve(htmlArg), 'utf8');
if (html.includes(marcador)) {
  console.log('El mapa ya muestra los atributos clave.');
  process.exit(0);
}

// Atributos elegidos por raíz: dos, los que identifican o gobiernan la regla del agregado.
const elegidos = {
  Identidad: ['documento: DocumentoIdentidad', 'nombreLegal: Texto'],
  Fan: ['identidadRef: IdOpaco', 'estado: EstadoFan'],
  'Fila de venta': ['eventoId: UUID', 'modo: ModoAdmision'],
  Promotor: ['nit: NIT', 'convenio: Convenio'],
  Recinto: ['ciudad: Texto', 'aforoMaximo: EnteroPositivo'],
  Evento: ['inicio: FechaHora', 'estado: EstadoEvento'],
  Localidad: ['aforo: Aforo', 'precio: Dinero'],
  Reserva: ['venceEn: FechaHora', 'total: Dinero'],
  Pago: ['monto: Dinero', 'estado: EstadoPago'],
  Discrepancia: ['tipo: TipoDiscrepancia', 'resueltaEn: FechaHora?'],
  Liquidación: ['periodo: RangoFecha', 'neto: Dinero'],
  Boleta: ['codigo: CodigoBoleta', 'estado: EstadoBoleta'],
};

// Filas «| Concepto | Tipo | `a: T`, `b: U` | Semántica |» de las tablas de agregados.
const atributosPorConcepto = new Map();
for (const linea of markdown.split('\n')) {
  const celdas = linea.split('|').map((c) => c.trim());
  if (celdas.length < 5 || !/^(RAÍZ|E|VO)$/.test(celdas[2])) continue;
  atributosPorConcepto.set(celdas[1], [...celdas[3].matchAll(/`([^`]+)`/g)].map((m) => m[1]));
}

const escapaXml = (t) =>
  t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');

let n = 0;
for (const componente of fuente.components ?? []) {
  const seleccion = elegidos[componente.label];
  if (!seleccion) throw new Error(`Sin selección de atributos para ${componente.label}.`);
  const fila = atributosPorConcepto.get(componente.label);
  if (!fila) throw new Error(`Sin fila en el Markdown para ${componente.label}.`);
  for (const atributo of seleccion) {
    if (!fila.includes(atributo)) {
      throw new Error(`El atributo «${atributo}» de ${componente.label} no está en el Markdown.`);
    }
  }

  const inicio = html.indexOf(`<g id="node-${componente.id}"`);
  if (inicio === -1) throw new Error(`No se encontró el nodo ${componente.id} en el mapa.`);
  const fin = html.indexOf('\n        <g id="node-', inicio + 1);
  const finFin = html.indexOf('\n        <!-- ', inicio + 1);
  const limite = [fin, finFin].filter((i) => i !== -1).sort((a, b) => a - b)[0];
  if (limite == null) throw new Error(`No se pudo determinar el final del nodo ${componente.id}.`);

  const [x, y] = componente.pos;
  let bloque = html.slice(inicio, limite);

  // Título y frase arriba; los atributos van debajo, alineados a la izquierda.
  bloque = bloque.replace(
    /(<text data-node-label=""[^>]*\sx=")[^"]+("[^>]*\sy=")[^"]+("[^>]*text-anchor=")middle("[^>]*>)/,
    `$1${x + componente.size[0] / 2}$2${y + 30}$3middle$4`,
  );
  bloque = bloque.replace(
    /(<text data-detail="context"[^>]*\sx=")[^"]+("[^>]*\sy=")[^"]+("[^>]*text-anchor=")middle("[^>]*>)/,
    `$1${x + componente.size[0] / 2}$2${y + 48}$3middle$4`,
  );
  const lista = seleccion
    .map((t, i) => `<tspan x="${x + 14}" dy="${i === 0 ? 0 : 13}">• ${escapaXml(t)}</tspan>`)
    .join('');
  const texto =
    `<text data-detail="context" x="${x + componente.size[0] / 2}" y="${y + 66}" ` +
    `class="t-muted" font-size="9.5" text-anchor="start">${lista}</text>`;
  bloque = bloque.replace(/(\n\s*<\/g>\s*)$/, `\n          ${texto}$1`);

  html = html.slice(0, inicio) + bloque + html.slice(limite);
  n += 1;
}

html = html.replace('<body>', `<body>\n  ${marcador}`);
await writeFile(resolve(htmlArg), html, 'utf8');
console.log(`Atributos clave de ${n} raíces dibujados en ${htmlArg}.`);
