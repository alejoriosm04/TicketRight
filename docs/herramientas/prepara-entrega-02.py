#!/usr/bin/env python3
"""Arma el paquete de entrega de la Entrega 2 en exportaciones/entrega-02/.

Genera, a partir de los documentos del repositorio:
  - un PDF por entregable (documento + sus vistas de diagrama),
  - el Excel de ADR con los identificadores alineados con el resto de la entrega,
  - el prototipo navegable,
  - un LEEME con el indice,
  - el ZIP listo para subir a Teams.

Las copias que se entregan no conservan enlaces al repositorio ni notas de
proceso. Los originales del repositorio no se tocan.

Uso:  python3 herramientas/prepara-entrega-02.py
Requiere: python3 -m pip install --user markdown ; google-chrome
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "exportaciones", "entrega-02")
MD = os.path.join(ROOT, "proyecto", "02-modelamiento")
ADR = os.path.join(ROOT, "proyecto", "decisiones")
CHROME = shutil.which("google-chrome") or shutil.which("chromium")

FECHA = "19 de septiembre de 2026"
EQUIPO = "Alejo, Lina y Quinnie"

# ---------------------------------------------------------------------------
# Enlaces y notas internas que no deben aparecer en lo entregado
# ---------------------------------------------------------------------------

FRIENDLY = {
    "modelo-de-dominio.md": "el modelo de dominio (entregable 1)",
    "arquitectura-de-referencia.md": "la arquitectura de referencia (entregable 3)",
    "arquitectura-de-implementacion.md": "la arquitectura de implementación (entregable 4)",
    "diagrama-de-clases.md": "el diagrama de clases (entregable 5)",
    "diagrama-de-secuencia.md": "el diagrama de secuencia (entregable 6)",
    "observabilidad.md": "la plataforma de observabilidad (entregable 8)",
    "plan-de-pruebas.md": "el plan de pruebas unitarias (entregable 9)",
    "volumetria.md": "la volumetría de pruebas (entregable 10)",
    "inyeccion-de-fallos.md": "el módulo de inyección de fallos (entregable 11)",
    "README.md": "el alcance definido para la Entrega 2",
    "rubrica.md": "la rúbrica del entregable",
    "adr-plantilla.xlsx": "la plantilla de ADR",
    "design.md": "la identidad visual del proyecto",
    "atributos-de-calidad.md": "los atributos de calidad de la Entrega 1",
    "alcance.md": "el alcance del caso de negocio (Entrega 1)",
    "validaciones.md": "las validaciones legales (Entrega 1)",
    "modelo-financiero.md": "el modelo financiero (Entrega 1)",
    "caso-de-negocio-corporativo.md": "el caso de negocio (Entrega 1)",
    "caso-de-negocio.md": "el caso de negocio (Entrega 1)",
    "canvas.md": "el Business Model Canvas (Entrega 1)",
}

ADR_URL = re.compile(r"\.\./decisiones/000([2-6])-[^)]*")
LINK = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
FILENAME = re.compile(r"\.(md|html|json|png|drawio|mmd|xlsx|docx)(#|$)")
GENERIC = {"aquí", "fuente", "fuentes", "mapa", "referencia", "clase", "este documento",
           "esta sección", "ver", "detalle", "evidencia", "el documento", "la versión",
           "alcance", "validaciones", "modelo financiero", "canvas", "atributos de calidad",
           "modelo de dominio", "observabilidad", "volumetría", "volumetria",
           "inyección de fallos", "inyeccion de fallos", "plan de pruebas",
           "diagrama de clases", "diagrama de secuencia", "arquitectura de referencia",
           "arquitectura de implementación", "arquitectura de implementacion",
           "caso de negocio"}


def clean_link(match):
    text, url = match.group(1), match.group(2)
    if url.startswith(("http://", "https://", "mailto:", "#")):
        return match.group(0)
    m = ADR_URL.search(url)
    if m:
        return f"AD-00{m.group(1)}"
    base = url.split("#")[0].split("/")[-1]
    bare = text.strip("`").strip()
    if base == "validaciones.md" and "ley" in bare.lower():
        return bare
    if base in FRIENDLY and (FILENAME.search(text) or bare.lower() in GENERIC):
        return FRIENDLY[base]
    if FILENAME.search(text):
        return FRIENDLY.get(base, bare.replace("-", " "))
    return text


def remove_section(text, heading):
    pattern = re.compile(r"^" + re.escape(heading) + r"\s*$", re.M)
    m = pattern.search(text)
    if not m:
        return text
    end = text.find("\n## ", m.end())
    if end == -1:
        end = len(text)
    return (text[:m.start()] + text[end + 1:]).rstrip() + "\n"


def remove_toc_rows(text, targets):
    lines = []
    for line in text.splitlines():
        if any(f"](#{t})" in line for t in targets):
            continue
        lines.append(line)
    return "\n".join(lines) + "\n"


# Reemplazos editoriales: pendientes internos y nombres de responsables.
REEMPLAZOS = [
    # modelo de dominio
    ("Responsable de validar las reglas: Quinnie, según el [alcance](../01-caso-de-negocio/alcance.md). "
     "`PENDIENTE: el alcance menciona además una «elegibilidad» del comprador; sigue [S] a cargo de Quinnie "
     "y entra al modelo solo si se define.`",
     "Responsable de validar las reglas: equipo TicketRight. Queda por definir si existirá además una "
     "«elegibilidad» del comprador; hoy es un supuesto `[S]` del equipo y entrará al modelo solo si se define."),
    # arquitectura de implementacion
    ("; responsable: Alejo.", "."),
    ("`PENDIENTE: dueño y umbral RTO/RPO.`", "`Pendiente: responsable y umbral de RTO/RPO.`"),
    # arquitectura de referencia: pendiente ya resuelto por el entregable 4
    ("- `PENDIENTE: especificar en la arquitectura de implementación los productos, topología,\n"
     "  protocolos, puertos, zonas, réplicas, políticas de escalado y recuperación que materializan\n"
     "  cada componente de referencia.`\n",
     "- La arquitectura de implementación (entregable 4) especifica los productos, la topología,\n"
     "  los protocolos, los puertos, las zonas, las réplicas y las políticas de escalado y\n"
     "  recuperación que materializan cada componente de referencia.\n"),
    # volumetria
    ("podría acotarla; responsable: Lina.`", "podría acotarla.`"),
    ("`PENDIENTE: responsable de validar con el promotor piloto: Quinnie`, según el mismo",
     "`Pendiente: validar con el promotor piloto`, según el mismo"),
    # diagrama de clases
    ("## Cómo sustentarlo", "## Cómo leer el diagrama"),
    ("| [Cómo sustentarlo](#cómo-sustentarlo) | Qué aclarar en la revisión y en qué orden recorrerlo |",
     "| [Cómo leer el diagrama](#cómo-leer-el-diagrama) | Qué aclarar y en qué orden recorrerlo |"),
    ("Cinco aclaraciones que evitan que el evaluador lea el diagrama como una mezcla accidental",
     "Cinco aclaraciones que evitan leer el diagrama como una mezcla accidental"),
    ("De los tres candidatos comparados en el README de la entrega,",
     "De los tres candidatos comparados por el equipo,"),
    ("sin perder el detalle que pide la rúbrica (atributos y operaciones con visibilidad, tipo y",
     "sin perder el detalle exigido (atributos y operaciones con visibilidad, tipo y"),
    # modelo de dominio: responsables
    ("; el reparto interno lo valida Quinnie.", "; el reparto interno lo valida el equipo."),
    ("Los valores concretos los valida Quinnie, según el",
     "Los valores concretos los valida el equipo, según el"),
    ("el reparto lo valida Quinnie.", "el reparto lo valida el equipo."),
    # arquitectura de implementación: referencia a la clase del curso
    ("([clase](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación)).",
     "en clase."),
    # plan de pruebas: caso elegido
    ("[principal, elegido en la reunión de equipo](README.md#base-para-la-decisión-2--el-caso-de-uso)",
     "principal, elegido por el equipo"),
    # diagrama de clases: caso elegido
    ("[reunión de equipo](README.md#base-para-la-decisión-2--el-caso-de-uso) consideró",
     "el equipo consideró"),
]


def clean_md(text, sections=(), toc_targets=(), extra=()):
    for heading in sections:
        text = remove_section(text, heading)
    if toc_targets:
        text = remove_toc_rows(text, toc_targets)
    for old, new in list(extra) + REEMPLAZOS:
        text = text.replace(old, new)
    text = LINK.sub(clean_link, text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------

CSS = """
@page { size: Letter; margin: 17mm 15mm 16mm; }
* { box-sizing: border-box; }
body { font-family: "Liberation Sans", "DejaVu Sans", Arial, sans-serif; color: #0f172a;
       font-size: 10pt; line-height: 1.5; margin: 0; }
h1 { color: #1d4ed8; font-size: 19pt; line-height: 1.25; margin: 0 0 10pt; }
h2 { color: #0f172a; font-size: 13.5pt; margin: 16pt 0 6pt; border-bottom: 1.5pt solid #dbeafe; padding-bottom: 3pt; }
h3 { color: #1e3a8a; font-size: 11.5pt; margin: 12pt 0 4pt; }
h4, h5 { color: #1e3a8a; font-size: 10.5pt; margin: 10pt 0 3pt; }
p { margin: 5pt 0; }
ul, ol { margin: 5pt 0 5pt 16pt; padding: 0; }
li { margin: 2pt 0; }
table { border-collapse: collapse; width: 100%; margin: 7pt 0; font-size: 8pt; }
th { background: #eff6ff; color: #1e3a8a; text-align: left; }
th, td { border: 0.6pt solid #cbd5e1; padding: 3.2pt 4pt; vertical-align: top; }
tr { page-break-inside: avoid; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 8.6pt; background: #f1f5f9;
       padding: 0.5pt 2pt; border-radius: 2pt; }
pre { background: #f8fafc; border: 0.6pt solid #e2e8f0; border-radius: 3pt; padding: 6pt 8pt;
      font-size: 8pt; white-space: pre-wrap; word-break: break-word; }
pre code { background: none; padding: 0; }
blockquote { border-left: 3pt solid #93c5fd; margin: 7pt 0; padding: 2pt 10pt; color: #334155; background: #f8fafc; }
a { color: #1d4ed8; text-decoration: none; }
hr { border: none; border-top: 0.6pt solid #e2e8f0; margin: 10pt 0; }
.page-break { page-break-after: always; }
.cover { padding-top: 6mm; }
.cover .eyebrow { color: #64748b; font-size: 9pt; letter-spacing: 0.4pt; text-transform: uppercase; }
.cover h1 { font-size: 30pt; margin: 6mm 0 2mm; color: #1d4ed8; }
.cover .sub { font-size: 13pt; color: #334155; margin: 0 0 8mm; }
.cover .badge { display: inline-block; background: #1d4ed8; color: #fff; font-weight: bold;
                font-size: 11pt; padding: 4pt 10pt; border-radius: 4pt; margin-bottom: 3mm; }
.cover .meta { color: #475569; font-size: 10pt; margin: 0 0 10mm; }
.cover .box { background: #f8fafc; border: 1pt solid #e2e8f0; border-radius: 5pt;
              padding: 4mm 5mm; margin-bottom: 4mm; }
.cover .box h2 { font-size: 11pt; margin: 0 0 3pt; border: none; padding: 0; color: #1e3a8a; }
.cover .box p, .cover .box li { font-size: 9.5pt; }
.cover .nota { color: #64748b; font-size: 9pt; margin-top: 6mm; }
"""


def chrome_pdf(html_path, pdf_path):
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
           "--no-pdf-header-footer", "--virtual-time-budget=4000",
           f"--print-to-pdf={pdf_path}", f"file://{html_path}"]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def render_pdf(md_text, title, cover, out_pdf, build):
    import markdown  # noqa: import local para dar un error claro
    body = markdown.markdown(md_text, extensions=["tables", "fenced_code", "sane_lists", "toc"])
    html = (f"<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"utf-8\">"
            f"<title>{title}</title><style>{CSS}</style></head><body>"
            f"{cover}<div class=\"page-break\"></div>{body}</body></html>")
    name = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    html_path = os.path.join(build, name + ".html")
    with open(html_path, "w", encoding="utf-8") as fh:
        fh.write(html)
    chrome_pdf(html_path, out_pdf)
    return out_pdf


def cover_html(numero, nombre, peso, contenido, nota=""):
    items = "".join(f"<li>{c}</li>" for c in contenido)
    return f"""<section class="cover">
  <p class="eyebrow">Universidad EAFIT · Arquitecturas Avanzadas de Software</p>
  <h1>TicketRight</h1>
  <p class="sub">Entrega 2 — Modelamiento de la solución</p>
  <div class="badge">Entregable {numero} · {nombre} · {peso}</div>
  <p class="meta">{FECHA} · Equipo: {EQUIPO}</p>
  <div class="box"><h2>Contenido de este PDF</h2><ul>{items}</ul></div>
  <div class="box"><h2>Cómo leer las marcas</h2>
    <p><code>[V]</code> dato verificado, con la fuente citada. <code>[S]</code> supuesto por validar.
    <b>Pendiente:</b> definición o validación prevista. Los umbrales marcados <code>[S]</code> se
    ratifican con las pruebas, la volumetría y la observabilidad.</p></div>
  {f'<p class="nota">{nota}</p>' if nota else ''}
</section>"""


# ---------------------------------------------------------------------------
# Entregables
# ---------------------------------------------------------------------------

NOTA_EJECUCION = ("Este documento presenta el diseño completo del entregable. La ejecución, "
                  "la instrumentación y su evidencia corresponden a la Entrega 3.")

DOCS = {
    "01": dict(nombre="Modelo de dominio", peso="5%", carpeta="01-modelo-de-dominio",
               src=os.path.join(MD, "modelo-de-dominio.md"),
               secciones=["## Artefactos", "## Correspondencia con la rúbrica"],
               toc=["artefactos", "correspondencia-con-la-rúbrica"],
               diagramas=["modelo-de-dominio-mapa", "modelo-de-dominio"],
               contenido=["Documento: contextos acotados, tipos y enumeraciones, atributos, relaciones, catorce invariantes y glosario",
                          "Diagrama: mapa de contextos y raíces de agregado (una pantalla)",
                          "Diagrama: modelo de dominio completo, con las 22 cajas y sus atributos"]),
    "03": dict(nombre="Arquitectura de referencia", peso="20%", carpeta="03-arquitectura-de-referencia",
               src=os.path.join(MD, "arquitectura-de-referencia.md"),
               secciones=["## Artefactos"], toc=[],
               diagramas=["arquitectura-de-referencia"],
               contenido=["Documento: capas y reglas de dependencia, componentes e interfaces, flujos, patrones, tecnologías, escenarios de calidad y trazabilidad",
                          "Diagrama: arquitectura de referencia con leyenda, sin marcas ni proveedores"]),
    "04": dict(nombre="Arquitectura de implementación", peso="20%", carpeta="04-arquitectura-de-implementacion",
               src=os.path.join(MD, "arquitectura-de-implementacion.md"),
               secciones=["## Artefactos", "## Evidencia de validación"],
               toc=["evidencia-de-validación"],
               diagramas=["arquitectura-de-implementacion"],
               nota=NOTA_EJECUCION,
               contenido=["Documento: entornos, topología de producción en AWS, unidades desplegables, integraciones y contratos, IaC, seguridad, escalabilidad, costos y trazabilidad",
                          "Diagrama: despliegue de producción en AWS, por zonas y fronteras de confianza"]),
    "05": dict(nombre="Diagrama de clases de un caso", peso="5%", carpeta="05-diagrama-de-clases", src=os.path.join(MD, "diagrama-de-clases.md"),
               secciones=["## Artefactos", "## Correspondencia con la rúbrica"],
               toc=["artefactos", "correspondencia-con-la-rúbrica"],
               diagramas=["diagrama-de-clases-dominio", "diagrama-de-clases-aplicacion"],
               contenido=["Documento: caso y alcance, capas y patrones, 39 clases con atributos y métodos, relaciones y correspondencia con el modelo de dominio",
                          "Diagrama: vista de dominio del caso «Comprar en la ventana de alta demanda»",
                          "Diagrama: vista de aplicación, puertos y adaptadores del mismo caso"]),
    "06": dict(nombre="Diagrama de secuencia de un caso", peso="5%", carpeta="06-diagrama-de-secuencia",
               src=os.path.join(MD, "diagrama-de-secuencia.md"),
               secciones=["## Artefactos", "## Correspondencia con la rúbrica"],
               toc=["artefactos", "correspondencia-con-la-rúbrica"],
               diagramas=["diagrama-de-secuencia-reservar-pagar", "diagrama-de-secuencia-confirmar-emitir"],
               contenido=["Documento: escenario, precondiciones y postcondiciones, participantes, 38 mensajes, fragmentos de error y notación",
                          "Diagrama: vista 1, reservar y cobrar",
                          "Diagrama: vista 2, confirmar, emitir y compensar"]),
    "08": dict(nombre="Plataforma de observabilidad", peso="5%", carpeta="08-observabilidad", src=os.path.join(MD, "observabilidad.md"),
               secciones=[], toc=[], diagramas=[], nota=NOTA_EJECUCION,
               contenido=["Documento: plataforma, arquitectura de telemetría, catálogo de métricas de negocio y técnicas, trazas, logs, tableros y alertas con responsable"]),
    "09": dict(nombre="Plan de pruebas unitarias", peso="5%", carpeta="09-plan-de-pruebas", src=os.path.join(MD, "plan-de-pruebas.md"),
               secciones=[], toc=[], diagramas=[], nota=NOTA_EJECUCION,
               contenido=["Documento: estrategia y alcance, dobles de prueba, 21 casos con datos deliberados, matriz caso de uso → caso y criterios de cobertura"]),
    "10": dict(nombre="Volumetría para pruebas", peso="0% · bonificación", carpeta="10-volumetria", src=os.path.join(MD, "volumetria.md"),
               secciones=[], toc=[], diagramas=[], nota=NOTA_EJECUCION,
               contenido=["Documento: volúmenes por entidad, usuarios y perfiles de carga, transacciones con relación lectura/escritura y escenarios nominal, pico, estrés y resistencia"]),
    "11": dict(nombre="Módulo de inyección de fallos", peso="0% · bonificación", carpeta="11-inyeccion-de-fallos",
               src=os.path.join(MD, "inyeccion-de-fallos.md"),
               secciones=[], toc=[], diagramas=[], nota=NOTA_EJECUCION,
               contenido=["Documento: diseño del módulo, controles de seguridad, catálogo de fallos por dimensión, hipótesis de los experimentos y criterios de aceptación"]),
}


def build_doc(key, cfg, build):
    text = open(cfg["src"], encoding="utf-8").read()
    text = clean_md(text, sections=cfg["secciones"], toc_targets=cfg["toc"])
    folder = os.path.join(OUT, cfg["carpeta"])
    os.makedirs(folder, exist_ok=True)
    pdf = os.path.join(folder, cfg["carpeta"] + ".pdf")
    cover = cover_html(int(key), cfg["nombre"], cfg["peso"], cfg["contenido"], cfg.get("nota", ""))
    parts = [render_pdf(text, cfg["nombre"], cover, os.path.join(build, key + "-doc.pdf"), build)]
    for diagram in cfg["diagramas"]:
        d_pdf = os.path.join(build, f"{key}-{diagram}.pdf")
        chrome_pdf(os.path.join(MD, diagram + ".html"), d_pdf)
        parts.append(d_pdf)
    subprocess.run(["pdfunite", *parts, pdf], check=True)
    return folder, pdf


def slug(value):
    import unicodedata
    value = unicodedata.normalize("NFKD", value.lower())
    value = "".join(c for c in value if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


# ---------------------------------------------------------------------------
# ADR, prototipo, Excel, LEEME, ZIP
# ---------------------------------------------------------------------------

ADR_INDEX = [
    ("AD-002", "SAGA orquestada con eventos durables para pago y emisión", "Integración"),
    ("AD-003", "PostgreSQL como autoridad del inventario y CQRS para las consultas", "Datos"),
    ("AD-004", "Seguridad por capas en el borde, admisión firmada e identidad aislada", "Transversal"),
    ("AD-005", "Arquitectura híbrida con Event-Driven y Space-Based bajo demanda", "Estructura"),
    ("AD-006", "Activación programada de la sala Space-Based y escalado elástico", "Despliegue"),
]

ADR_FUENTES = {
    "0002": "**Fuentes:** atributos de calidad y caso de negocio de la Entrega 1.",
    "0003": "**Fuentes:** atributos de calidad, validaciones legales y alcance de la Entrega 1.",
    "0004": "**Fuentes:** atributos de calidad, validaciones legales y caso de negocio de la Entrega 1.",
    "0005": "**Fuentes:** atributos de calidad, caso de negocio y trazabilidad de la Entrega 1.",
    "0006": "**Fuentes:** atributos de calidad, alcance y dato de cómputo del Canvas de la Entrega 1.",
}

ADR_TRAZABILIDAD = """## Trazabilidad: componentes de la arquitectura afectados

| Decisión | Componentes afectados | Manifestación en la arquitectura |
|---|---|---|
| AD-002 | Orquestador de compra y pagos; Bus de eventos y colas; Base de datos transaccional | SAGA orquestada, outbox, entrega al menos una vez, idempotencia, cola de errores y compensaciones explícitas |
| AD-003 | Servicio de inventario y reservas; Base de datos transaccional; Modelos de lectura | Una autoridad de escritura y proyecciones CQRS reconstruibles; ninguna vista confirma aforo |
| AD-004 | API Gateway y borde; Servicio de identidad y consentimiento; todos los contratos | Defensa en profundidad, token de admisión separado, datos personales aislados e identificadores opacos |
| AD-005 | Estructura completa | Composición selectiva de Space-Based, núcleo transaccional, CQRS y Event-Driven |
| AD-006 | Servicio de admisión y fila virtual; Modelos de lectura; Plataforma de ejecución | Precalentamiento, control de flujo, escalado por trabajo pendiente y cuatro perfiles operativos |
"""


def build_adr(build):
    parts_md = ["# ADR — Decisiones de arquitectura de TicketRight\n",
                "Cinco decisiones de arquitectura, en el formato de ocho elementos del curso: decisión, "
                "identificador, problema o asunto, supuestos, alternativas, decisión tomada, justificación e "
                "implicaciones. Cada una declara su dimensión, su estado, la fecha en que se tomó y las "
                "decisiones relacionadas.\n",
                "## Índice de decisiones\n",
                "| ID | Decisión | Dimensión | Estado | Fecha |",
                "|---|---|---|---|---|"]
    for ident, titulo, dim in ADR_INDEX:
        parts_md.append(f"| {ident} | {titulo} | {dim} | Aceptado | 2026-09-16 |")
    parts_md.append("\nLas decisiones se tomaron bajo las condiciones del 16 de septiembre de 2026 y se "
                    "revisarán si cambian los supuestos que las sostienen. La decisión de negocio (idea de "
                    "TicketRight) no es una decisión de arquitectura y no forma parte de este registro.\n")
    for num, (ident, _, _) in zip(["0002", "0003", "0004", "0005", "0006"], ADR_INDEX):
        path = next(os.path.join(ADR, f) for f in os.listdir(ADR)
                    if f.startswith(num + "-") and f.endswith(".md"))
        text = open(path, encoding="utf-8").read()
        text = re.sub(r"\*\*Dimensión \(rúbrica\):\*\*", "**Dimensión:**", text)
        text = re.sub(r"\n---\n\n\*\*Fuentes:\*\*.*$", "\n", text, flags=re.S)
        text = clean_md(text, sections=[], toc_targets=[])
        text = re.sub(r"✅\s*", "", text)
        text = text.replace("**Fecha:** 2026-09-16 · **Estado:** Aceptado",
                            "**Fecha:** 2026-09-16 · **Estado:** Aceptado")
        text += "\n" + ADR_FUENTES[num] + "\n"
        parts_md.append("\n<div class=\"page-break\"></div>\n")
        parts_md.append(text)
    parts_md.append("\n<div class=\"page-break\"></div>\n")
    parts_md.append(ADR_TRAZABILIDAD)
    combined = "\n".join(parts_md)
    folder = os.path.join(OUT, "02-adr")
    os.makedirs(folder, exist_ok=True)
    pdf = os.path.join(folder, "02-adr.pdf")
    cover = cover_html(2, "ADR — Architectural Decision Record", "25%",
                       ["Índice de las cinco decisiones con su dimensión, estado y fecha",
                        "Los cinco ADR completos, con alternativas comparadas y consecuencias",
                        "Matriz de comparación de alternativas en cada decisión",
                        "Trazabilidad de cada ADR con los componentes de la arquitectura que afecta",
                        "Archivo de Excel diligenciado en la plantilla del curso: 02-adr.xlsx"])
    render_pdf(combined, "ADR", cover, pdf, build)
    fix_adr_xlsx(os.path.join(MD, "adr-plantilla.xlsx"), os.path.join(folder, "02-adr.xlsx"))
    return folder, pdf


def fix_adr_xlsx(src, dst):
    mapping = {"AD-0001": "AD-002", "AD-0002": "AD-003", "AD-0003": "AD-004",
               "AD-0004": "AD-005", "AD-0005": "AD-006",
               "ADR0001": "AD-002", "ADR0002": "AD-003", "ADR0003": "AD-004",
               "ADR0004": "AD-005", "ADR0005": "AD-006"}
    pattern = re.compile("|".join(sorted((re.escape(k) for k in mapping), key=len, reverse=True)))
    with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename.endswith((".xml", ".rels")):
                try:
                    data = pattern.sub(lambda m: mapping[m.group(0)], data.decode("utf-8")).encode("utf-8")
                except UnicodeDecodeError:
                    pass
            zout.writestr(item, data)


def build_prototipo():
    folder = os.path.join(OUT, "07-prototipo-interfaz")
    shutil.copytree(os.path.join(MD, "prototipo"), folder,
                    ignore=shutil.ignore_patterns("design.md"))
    return folder


LEEME = """TicketRight — Entrega 2 · Modelamiento de la solución
Universidad EAFIT · Arquitecturas Avanzadas de Software
{fecha} · Equipo: {equipo}
Vence: sábado 19 de septiembre de 2026, 3:00 p.m.

CONTENIDO DE ESTA CARPETA
{filas}
LEEME DE LAS MARCAS
  [V]  dato verificado, con la fuente citada en el documento.
  [S]  supuesto por validar.
  Pendiente:  definición o validación prevista; se cierra con las pruebas, la volumetría
              y la observabilidad.

ALCANCE
  Los once entregables son de definición y diseño. La ejecución de pruebas, la plataforma
  de observabilidad y la inyección de fallos se evidencian en la Entrega 3.

PROTOTIPO
  Abra 07-prototipo-interfaz/index.html con doble clic (no necesita servidor).
  En línea: https://harmonious-empanada-797c2e.netlify.app/
"""


def build_leeme():
    filas = [
        "  01-modelo-de-dominio/01-modelo-de-dominio.pdf         5%   Documento + mapa + modelo completo",
        "  02-adr/02-adr.pdf                                  25%   Índice + los cinco ADR + trazabilidad",
        "  02-adr/02-adr.xlsx                                 25%   Excel diligenciado en la plantilla del curso",
        "  03-arquitectura-de-referencia/03-arquitectura-de-referencia.pdf  20%   Documento + diagrama",
        "  04-arquitectura-de-implementacion/04-arquitectura-de-implementacion.pdf  20%   Documento + diagrama",
        "  05-diagrama-de-clases/05-diagrama-de-clases.pdf     5%   Documento + vistas de dominio y aplicación",
        "  06-diagrama-de-secuencia/06-diagrama-de-secuencia.pdf  5%   Documento + las dos vistas",
        "  07-prototipo-interfaz/index.html                   10%   16 pantallas navegables para fan, promotor y operación",
        "  08-observabilidad/08-observabilidad.pdf             5%   Diseño de la plataforma de observabilidad",
        "  09-plan-de-pruebas/09-plan-de-pruebas.pdf           5%   Estrategia, matriz y 21 casos de prueba",
        "  10-volumetria/10-volumetria.pdf                     0%   Volúmenes, transacciones y cuatro escenarios de carga",
        "  11-inyeccion-de-fallos/11-inyeccion-de-fallos.pdf   0%   Catálogo de fallos e hipótesis de los experimentos",
    ]
    return LEEME.format(fecha=FECHA, equipo=EQUIPO, filas="\n".join(filas))


def build_zip():
    zip_path = os.path.join(OUT, "TicketRight-Entrega-2-Modelamiento.zip")
    root = "TicketRight-Entrega-2-Modelamiento"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        for base, _, files in os.walk(OUT):
            for name in sorted(files):
                if name.endswith(".zip"):
                    continue
                path = os.path.join(base, name)
                z.write(path, os.path.join(root, os.path.relpath(path, OUT)))
    return zip_path


# ---------------------------------------------------------------------------
# Verificacion
# ---------------------------------------------------------------------------

PROHIBIDO = [
    r"Archify", r"visual-check", r"sha256", r"postprocesa", r"\.\./", r"02-modelamiento/",
    r"proyecto/decisiones", r"README", r"ESTADO\.md", r"rubrica\.md", r"enunciado-teams",
    r"herramientas/", r"revisión externa", r"autorevisión", r"el repo\b",
]


def verificar(paths):
    problemas = []
    for path in paths:
        if path.endswith(".pdf"):
            try:
                text = subprocess.run(["pdftotext", "-q", path, "-"], check=True,
                                      capture_output=True, text=True).stdout
            except Exception as exc:  # noqa: BLE001
                problemas.append(f"{path}: no se pudo leer ({exc})")
                continue
        elif path.endswith(".md"):
            text = open(path, encoding="utf-8").read()
        else:
            continue
        for pattern in PROHIBIDO:
            for match in re.finditer(pattern, text):
                around = text[max(0, match.start() - 40):match.end() + 40].replace("\n", " ")
                problemas.append(f"{os.path.relpath(path, ROOT)} · {pattern} · …{around}…")
    return problemas


def main():
    if not CHROME:
        sys.exit("Falta google-chrome (o chromium) para generar los PDF.")
    try:
        import markdown  # noqa: F401
    except ImportError:
        sys.exit("Falta el paquete markdown: python3 -m pip install --user markdown")

    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    build = tempfile.mkdtemp(prefix="entrega-02-")

    pdfs = []
    for key in ["01", "03", "04", "05", "06", "08", "09", "10", "11"]:
        _, pdf = build_doc(key, DOCS[key], build)
        pdfs.append(pdf)
        print("ok", os.path.relpath(pdf, ROOT))
    _, adr_pdf = build_adr(build)
    pdfs.append(adr_pdf)
    print("ok", os.path.relpath(adr_pdf, ROOT))
    build_prototipo()
    print("ok 07-prototipo-interfaz/")

    with open(os.path.join(OUT, "00-LEEME.txt"), "w", encoding="utf-8") as fh:
        fh.write(build_leeme())

    zip_path = build_zip()
    print("ok", os.path.relpath(zip_path, ROOT))

    problemas = verificar(pdfs)
    if problemas:
        print("\nREVISAR (posibles referencias internas):")
        for problema in problemas:
            print(" -", problema)
    else:
        print("\nVerificación limpia: los PDF no contienen referencias internas.")


if __name__ == "__main__":
    main()
