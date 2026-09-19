#!/usr/bin/env node

// Dibuja dentro de cada caja del diagrama la lista de atributos que declara el Markdown.
// El Markdown es la fuente: si un atributo cambia allí, el diagrama cambia al regenerarlo.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [fuenteArg, markdownArg, htmlArg] = process.argv.slice(2);

if (!fuenteArg || !markdownArg || !htmlArg) {
  console.error(
    'Uso: node herramientas/postprocesa-modelo-dominio.mjs <fuente.json> <modelo.md> <diagrama.html>',
  );
  process.exit(1);
}

const marcador = '<!-- TicketRight: atributos de entidades tomados del Markdown -->';
const fuente = JSON.parse(await readFile(resolve(fuenteArg), 'utf8'));
const markdown = await readFile(resolve(markdownArg), 'utf8');
let html = await readFile(resolve(htmlArg), 'utf8');

if (html.includes(marcador)) {
  console.log('El HTML ya muestra los atributos del Markdown.');
  process.exit(0);
}

// Filas «| Concepto | Tipo | `a: T`, `b: U` | Semántica |» de las tablas de agregados.
// Los objetos de valor no son cajas: sus campos se dibujan anidados bajo el atributo que
// los usa. «Reglas de venta» se reconoce como el tipo `ReglasVenta` normalizando el nombre.
const atributosPorConcepto = new Map();
const camposPorTipoVO = new Map();
const normaliza = (t) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(de|del)\b|\s|\?/g, '');
for (const linea of markdown.split('\n')) {
  const celdas = linea.split('|').map((c) => c.trim());
  if (celdas.length < 5 || !/^(RAÍZ|E|VO)$/.test(celdas[2])) continue;
  const atributos = [...celdas[3].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (!atributos.length) continue;
  atributosPorConcepto.set(celdas[1], atributos);
  if (celdas[2] === 'VO') camposPorTipoVO.set(normaliza(celdas[1]), atributos);
}

function lineasDe(atributos, nivel = 0) {
  const lineas = [];
  for (const atributo of atributos) {
    lineas.push({ texto: atributo, nivel });
    const tipo = normaliza(atributo.split(':')[1] ?? '');
    if (nivel < 2 && camposPorTipoVO.has(tipo)) {
      lineas.push(...lineasDe(camposPorTipoVO.get(tipo), nivel + 1));
    }
  }
  return lineas;
}

function escapaXml(texto) {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

const faltantes = [];

for (const componente of fuente.components ?? []) {
  const atributos = atributosPorConcepto.get(componente.label);
  if (!atributos) {
    faltantes.push(componente.label);
    continue;
  }

  const inicio = html.indexOf(`<g id="node-${componente.id}"`);
  if (inicio === -1) throw new Error(`No se encontró el nodo ${componente.id} en el HTML.`);
  const fin = html.indexOf('\n        <g id="node-', inicio + 1);
  const finComponentes = html.indexOf('\n        <!-- ', inicio + 1);
  const limite = [fin, finComponentes].filter((i) => i !== -1).sort((a, b) => a - b)[0];
  if (limite == null) throw new Error(`No se pudo determinar el final del nodo ${componente.id}.`);

  const [x, y] = componente.pos;
  const [ancho] = componente.size;
  const centroX = x + ancho / 2;
  const tituloY = y + 22;
  const fraseY = tituloY + 14;
  const primerAtributoY = fraseY + 18;
  const atributoX = x + 16;
  const interlineado = 13;

  let bloque = html.slice(inicio, limite);

  // Título arriba, no al centro.
  bloque = bloque.replace(/(<text data-node-label=""[^>]*\sy=")[^"]+("[^>]*>)/, `$1${tituloY}$2`);

  // La frase semántica queda bajo el título, en cursiva.
  bloque = bloque.replace(
    /(<text data-detail="context"[^>]*\sy=")[^"]+("[^>]*)(>)/,
    `$1${fraseY}$2 font-style="italic"$3`,
  );

  // La marca (RAÍZ / E / VO) pasa a la esquina superior derecha.
  bloque = bloque.replace(
    /(<text data-detail="fine"[^>]*\sx=")[^"]+("[^>]*\sy=")[^"]+("[^>]*text-anchor=")middle(")/,
    `$1${x + ancho - 10}$2${y + 14}$3end$4`,
  );

  const lista = lineasDe(atributos)
    .map(
      ({ texto, nivel }, indice) =>
        `<tspan x="${atributoX + nivel * 14}" dy="${indice === 0 ? 0 : interlineado}"` +
        `${nivel ? ' font-size="8.5"' : ''}>${nivel ? '· ' : '• '}${escapaXml(texto)}</tspan>`,
    )
    .join('');
  const textoAtributos =
    `<text data-detail="context" x="${centroX}" y="${primerAtributoY}" ` +
    `class="t-muted" font-size="9.5" text-anchor="start">${lista}</text>`;

  bloque = bloque.replace(/(<text data-detail="fine")/, `${textoAtributos}\n        $1`);

  html = html.slice(0, inicio) + bloque + html.slice(limite);
}

if (faltantes.length) {
  throw new Error(`Sin fila en el Markdown para: ${faltantes.join(', ')}.`);
}

html = html.replace('<body>', `<body>\n  ${marcador}`);
await writeFile(resolve(htmlArg), html, 'utf8');
console.log(`Atributos de ${fuente.components.length} cajas y ${camposPorTipoVO.size} objetos de valor dibujados en ${htmlArg}.`);
