#!/usr/bin/env python3
"""Publish docs/ as the repository wiki.

`docs/` is the single source of truth for the documentation; the GitHub wiki is a
generated mirror: flat pages, internal links rewritten to page names and a sidebar
with the sections. The wiki is **not edited by hand**: it is regenerated with this
script.

Before writing anything it checks that:
  1. every file in the manifest exists;
  2. every internal Markdown link resolves to a document or a real file;
  3. every `#anchor` matches a real heading in the target file.

Usage:
  python3 tools/publish-wiki.py                 # writes ../TicketRight.wiki
  python3 tools/publish-wiki.py --push          # also commits and pushes it
  python3 tools/publish-wiki.py --dest PATH     # another local copy of the wiki
"""

import argparse
import datetime
import os
import posixpath
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DEST = os.path.normpath(os.path.join(ROOT, "..", "TicketRight.wiki"))
GITHUB_REPO = "alejoriosm04/TicketRight"
GITHUB_BRANCH = "main"
GENERATED_LIST = ".generated-pages"

LINK = re.compile(r"(!?)\[([^\]]*)\]\(([^)\s]+)\)")
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}

# (source, page, section, label). Order matters: it defines the sidebar.
PAGES = [
    ("ESTADO.md", "Estado", "El repositorio", "Estado del repositorio (Entrega 3)"),
    ("docs/ESTADO.md", "Estado-del-curso", "El repositorio", "Estado del curso (hasta Entrega 2)"),
    ("docs/README.md", "Curso", "El repositorio", None),
    ("docs/proyecto/README.md", "Proyecto", "El repositorio", "Proyecto integrador"),
    ("docs/proyecto/design.md", "Diseno", "El repositorio", "Sistema de diseño"),

    ("docs/proyecto/01-caso-de-negocio/README.md", "Entrega-1", "Entrega 1 · Caso de negocio", "Resumen de la entrega"),
    ("docs/proyecto/01-caso-de-negocio/caso-de-negocio-corporativo.md", "Entrega-1-Caso-de-negocio", "Entrega 1 · Caso de negocio", "Caso de negocio (entregado)"),
    ("docs/proyecto/01-caso-de-negocio/caso-de-negocio.md", "Entrega-1-Caso-de-negocio-consolidado", "Entrega 1 · Caso de negocio", "Consolidado y anexos"),
    ("docs/proyecto/01-caso-de-negocio/canvas.md", "Entrega-1-Canvas", "Entrega 1 · Caso de negocio", "Canvas (9 bloques)"),
    ("docs/proyecto/01-caso-de-negocio/alcance.md", "Entrega-1-Alcance", "Entrega 1 · Caso de negocio", "Alcance"),
    ("docs/proyecto/01-caso-de-negocio/atributos-de-calidad.md", "Entrega-1-Atributos-de-calidad", "Entrega 1 · Caso de negocio", "Atributos de calidad (12)"),
    ("docs/proyecto/01-caso-de-negocio/modelo-financiero.md", "Entrega-1-Modelo-financiero", "Entrega 1 · Caso de negocio", "Modelo financiero"),
    ("docs/proyecto/01-caso-de-negocio/validaciones.md", "Entrega-1-Validaciones", "Entrega 1 · Caso de negocio", "Validaciones"),
    ("docs/proyecto/01-caso-de-negocio/presentacion.md", "Entrega-1-Presentacion", "Entrega 1 · Caso de negocio", "Sustentación"),
    ("docs/proyecto/01-caso-de-negocio/rubrica.md", "Entrega-1-Rubrica", "Entrega 1 · Caso de negocio", "Rúbrica"),
    ("docs/proyecto/01-caso-de-negocio/ideas/README.md", "Entrega-1-Ideas", "Entrega 1 · Caso de negocio", "Ideas evaluadas"),
    ("docs/proyecto/01-caso-de-negocio/ideas/idea-lina.md", "Entrega-1-Idea-TicketRight", "Entrega 1 · Caso de negocio", "Idea: TicketRight"),
    ("docs/proyecto/01-caso-de-negocio/ideas/idea-alejo-ventana.md", "Entrega-1-Idea-Ventana", "Entrega 1 · Caso de negocio", "Idea: Ventana"),
    ("docs/proyecto/01-caso-de-negocio/ideas/idea-enchufe.md", "Entrega-1-Idea-Enchufe", "Entrega 1 · Caso de negocio", "Idea: Enchufe"),
    ("docs/proyecto/01-caso-de-negocio/ideas/idea-quinnie.md", "Entrega-1-Idea-PlateOS-NutriChain", "Entrega 1 · Caso de negocio", "Idea: PlateOS / NutriChain"),
    ("docs/proyecto/01-caso-de-negocio/evaluacion-ideas.md", "Entrega-1-Evaluacion-de-ideas", "Entrega 1 · Caso de negocio", "Evaluación de ideas"),
    ("docs/proyecto/01-caso-de-negocio/contenido-canvas-excel.md", "Entrega-1-Canvas-para-Excel", "Entrega 1 · Caso de negocio", "Canvas para Excel"),

    ("docs/proyecto/02-modelamiento/README.md", "Entrega-2", "Entrega 2 · Modelamiento", "Resumen de la entrega"),
    ("docs/proyecto/02-modelamiento/modelo-de-dominio.md", "Entrega-2-Modelo-de-dominio", "Entrega 2 · Modelamiento", "Modelo de dominio"),
    ("docs/proyecto/02-modelamiento/arquitectura-de-referencia.md", "Entrega-2-Arquitectura-de-referencia", "Entrega 2 · Modelamiento", "Arquitectura de referencia"),
    ("docs/proyecto/02-modelamiento/arquitectura-de-implementacion.md", "Entrega-2-Arquitectura-de-implementacion", "Entrega 2 · Modelamiento", "Arquitectura de implementación"),
    ("docs/proyecto/02-modelamiento/diagrama-de-clases.md", "Entrega-2-Diagrama-de-clases", "Entrega 2 · Modelamiento", "Diagrama de clases"),
    ("docs/proyecto/02-modelamiento/diagrama-de-secuencia.md", "Entrega-2-Diagrama-de-secuencia", "Entrega 2 · Modelamiento", "Diagrama de secuencia"),
    ("docs/proyecto/02-modelamiento/prototipo/design.md", "Entrega-2-Prototipo", "Entrega 2 · Modelamiento", "Prototipo e interfaz"),
    ("docs/proyecto/02-modelamiento/observabilidad.md", "Entrega-2-Observabilidad", "Entrega 2 · Modelamiento", "Observabilidad"),
    ("docs/proyecto/02-modelamiento/plan-de-pruebas.md", "Entrega-2-Plan-de-pruebas", "Entrega 2 · Modelamiento", "Plan de pruebas"),
    ("docs/proyecto/02-modelamiento/volumetria.md", "Entrega-2-Volumetria", "Entrega 2 · Modelamiento", "Volumetría"),
    ("docs/proyecto/02-modelamiento/inyeccion-de-fallos.md", "Entrega-2-Inyeccion-de-fallos", "Entrega 2 · Modelamiento", "Inyección de fallos"),
    ("docs/proyecto/02-modelamiento/rubrica.md", "Entrega-2-Rubrica", "Entrega 2 · Modelamiento", "Rúbrica"),
    ("docs/proyecto/02-modelamiento/enunciado-teams.md", "Entrega-2-Enunciado", "Entrega 2 · Modelamiento", "Enunciado del profesor"),
    ("docs/proyecto/02-modelamiento/adr-para-excel.md", "Entrega-2-ADR-para-Excel", "Entrega 2 · Modelamiento", "ADR para Excel"),

    ("docs/proyecto/03-implementacion/README.md", "Entrega-3", "Entrega 3 · Implementación", "Implementación, sustentación y defensa"),
    ("docs/proyecto/03-implementacion/rubrica.md", "Entrega-3-Rubrica", "Entrega 3 · Implementación", "Rúbrica del entregable"),
    ("docs/proyecto/03-implementacion/patrones.md", "Entrega-3-Patrones", "Entrega 3 · Implementación", "Patrones utilizados"),
    ("docs/proyecto/03-implementacion/fidelidad-arquitectonica.md", "Entrega-3-Fidelidad-arquitectonica", "Entrega 3 · Implementación", "Fidelidad a los ADR"),
    ("docs/proyecto/03-implementacion/coherencia-implementacion.md", "Entrega-3-Coherencia", "Entrega 3 · Implementación", "Coherencia diseño–código"),
    ("docs/proyecto/03-implementacion/bitacora-de-fallos.md", "Entrega-3-Bitacora-de-fallos", "Entrega 3 · Implementación", "Bitácora de fallos"),
    ("docs/proyecto/03-implementacion/pruebas-de-carga.md", "Entrega-3-Pruebas-de-carga", "Entrega 3 · Implementación", "Pruebas de carga"),

    ("docs/proyecto/decisiones/README.md", "ADR", "Decisiones · ADR", "Índice y formato"),
    ("docs/proyecto/decisiones/0001-idea-de-negocio.md", "ADR-001-Idea-de-negocio", "Decisiones · ADR", "AD-001 Idea de negocio"),
    ("docs/proyecto/decisiones/0002-mensajeria-del-bus-de-eventos.md", "ADR-002-Mensajeria-del-bus-de-eventos", "Decisiones · ADR", "AD-002 Mensajería del bus de eventos"),
    ("docs/proyecto/decisiones/0003-consistencia-por-tipo-de-inventario.md", "ADR-003-Consistencia-por-tipo-de-inventario", "Decisiones · ADR", "AD-003 Consistencia del inventario"),
    ("docs/proyecto/decisiones/0004-datos-personales-almacenamiento-y-acceso.md", "ADR-004-Datos-personales", "Decisiones · ADR", "AD-004 Datos personales"),
    ("docs/proyecto/decisiones/0005-estilo-de-arquitectura.md", "ADR-005-Estilo-de-arquitectura", "Decisiones · ADR", "AD-005 Estilo de arquitectura"),
    ("docs/proyecto/decisiones/0006-escalado-programado-por-ventana-de-venta.md", "ADR-006-Escalado-por-ventana", "Decisiones · ADR", "AD-006 Escalado por ventana"),
    ("docs/proyecto/decisiones/0007-stack-de-implementacion.md", "ADR-007-Stack-de-implementacion", "Decisiones · ADR", "AD-007 Stack de implementación"),
    ("docs/proyecto/decisiones/0008-boleta-en-derecho-de-asistencia.md", "ADR-008-Boleta-en-derecho-de-asistencia", "Decisiones · ADR", "AD-008 Boleta y emisión por puerto"),
    ("docs/proyecto/decisiones-propuesta-tecnica/README.md", "ADP", "Decisiones · ADR", "Antecedentes (ADP)"),
    ("docs/proyecto/decisiones-propuesta-tecnica/0001-arquitectura-compuesta-para-alta-concurrencia.md", "ADP-001-Arquitectura-compuesta", "Decisiones · ADR", "ADP-001 Arquitectura compuesta"),
    ("docs/proyecto/decisiones-propuesta-tecnica/0002-proteccion-y-control-de-admision-en-el-borde.md", "ADP-002-Proteccion-en-el-borde", "Decisiones · ADR", "ADP-002 Protección en el borde"),
    ("docs/proyecto/decisiones-propuesta-tecnica/0003-procesamiento-asincrono-de-la-venta.md", "ADP-003-Procesamiento-asincrono", "Decisiones · ADR", "ADP-003 Procesamiento asíncrono"),
    ("docs/proyecto/decisiones-propuesta-tecnica/0004-autoridad-persistente-y-cache-de-inventario.md", "ADP-004-Autoridad-persistente", "Decisiones · ADR", "ADP-004 Autoridad persistente"),
    ("docs/proyecto/decisiones-propuesta-tecnica/0005-despliegue-elastico-en-contenedores.md", "ADP-005-Despliegue-elastico", "Decisiones · ADR", "ADP-005 Despliegue elástico"),

    ("docs/curso/syllabus.md", "Curso-Syllabus", "Curso", "Syllabus, fechas y evaluación"),
    ("docs/curso/clase-01-02.md", "Curso-Clase-01-02-Fundamentos", "Curso", "Clases 1 y 2 — Fundamentos"),
    ("docs/curso/clase-03-04.md", "Curso-Clase-03-04-Patrones-y-estilos", "Curso", "Clases 3 y 4 — Patrones y estilos"),
    ("docs/curso/clase-03-04-transcripcion.md", "Curso-Clase-03-04-Explicacion-entrega-2", "Curso", "Clases 3 y 4 — Explicación del entregable 2"),
    ("docs/curso/clase-05-06.md", "Curso-Clase-05-06-Evolutivas-patrones-DDD", "Curso", "Clases 5 y 6 — Evolutivas, patrones y DDD"),
    ("docs/curso/fundamentos-arquitectura.md", "Curso-Fundamentos-de-arquitectura", "Curso", "Fundamentos de arquitectura"),
    ("docs/curso/mensajeria-pubsub.md", "Curso-Mensajeria-pubsub", "Curso", "Mensajería pub/sub"),
]


def anchor(heading):
    """Mirror how GitHub turns a heading into an anchor."""
    text = heading.strip().lower()
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[`*_]", "", text)
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    return text.replace(" ", "-")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def github_url(path, is_directory=False):
    kind = "tree" if is_directory else "blob"
    return f"https://github.com/{GITHUB_REPO}/{kind}/{GITHUB_BRANCH}/{path}"


def image_url(path):
    return f"https://raw.githubusercontent.com/{GITHUB_REPO}/{GITHUB_BRANCH}/{path}"


def build_index():
    return {source: page for source, page, _, _ in PAGES}


def resolve_destination(destination, source, page_by_source, problems):
    """Turn a Markdown link destination into its wiki form."""
    if destination.startswith(("http://", "https://", "mailto:", "tel:")):
        return destination
    path, _, fragment = destination.partition("#")
    if not path:
        return destination
    target = posixpath.normpath(posixpath.join(posixpath.dirname(source), path))
    absolute = os.path.normpath(os.path.join(ROOT, target))
    if not os.path.exists(absolute):
        problems.append(f"broken link        {source} → {destination}")
        return destination
    suffix = f"#{fragment}" if fragment else ""
    if os.path.isdir(absolute):
        return github_url(target, is_directory=True) + suffix
    if target.endswith(".md"):
        page = page_by_source.get(target)
        if page:
            return page + suffix
        return github_url(target) + suffix
    if os.path.splitext(target)[1].lower() in IMAGE_EXTENSIONS:
        return image_url(target) + suffix
    return github_url(target) + suffix


def rewrite(content, source, page_by_source, problems):
    def replacement(match):
        bang, label, destination = match.groups()
        new_destination = resolve_destination(
            destination, source, page_by_source, problems
        )
        return f"{bang}[{label}]({new_destination})"

    return LINK.sub(replacement, content)


def validate_anchors(sources, problems):
    """Check that every `#anchor` exists in the target document."""
    anchors = {}
    for source in sources:
        path = os.path.join(ROOT, source)
        if os.path.exists(path):
            anchors[source] = {
                anchor(line.lstrip("#"))
                for line in read(path).splitlines()
                if line.startswith("#")
            }

    for source in sources:
        path = os.path.join(ROOT, source)
        if not os.path.exists(path):
            continue
        for match in LINK.finditer(read(path)):
            destination = match.group(3)
            if destination.startswith(("http://", "https://", "mailto:", "tel:")):
                continue
            path, _, fragment = destination.partition("#")
            if not fragment:
                continue
            target = (
                posixpath.normpath(posixpath.join(posixpath.dirname(source), path))
                if path
                else source
            )
            if not target.endswith(".md"):
                continue
            if target in anchors and fragment not in anchors[target]:
                problems.append(f"missing anchor    {source} → {destination}")


def home_page(date):
    return f"""# TicketRight

Plataforma de venta de boletería para eventos de alta demanda: la correspondencia entre el
dinero y el derecho a entrar no se rompe, ni con una pasarela que responde tarde o dos
veces. Proyecto integrador de **Arquitecturas Avanzadas de Software** (Universidad EAFIT,
septiembre 2026), en su tercera entrega: **implementación, sustentación, simulación y
defensa** (26 de septiembre).

## Por dónde empezar

| Empieza por | Para saber |
|---|---|
| [Estado del repositorio](Estado) | En qué va la Entrega 3 y qué falta |
| [Proyecto](Proyecto) | El arco de las tres entregas |
| [Entrega 2](Entrega-2) | Los once diseños que la implementación convierte en código |
| [ADR](ADR) | Las decisiones con las que se defiende la entrega |
| [Curso](Curso) | El material del curso que sostiene cada argumento |

## Secciones

- **El repositorio** — estado, proyecto, diseño visual y la vista general del curso.
- **Entrega 1 · Caso de negocio** — definición completa, Canvas, atributos de calidad,
  modelo financiero, validaciones e ideas evaluadas.
- **Entrega 2 · Modelamiento** — modelo de dominio, arquitecturas de referencia e
  implementación, diagramas, prototipo, observabilidad, pruebas, volumetría y fallos.
- **Entrega 3 · Implementación** — lo que se entrega el 26 de septiembre.
- **Decisiones · ADR** — los ADR oficiales y los ADP de la propuesta técnica, como
  antecedente.
- **Curso** — clases, transcripciones, fundamentos, mensajería y syllabus.

---

> Espejo de `docs/` generado el {date} con `python3 tools/publish-wiki.py`.
> **No edites esta wiki a mano**: los cambios se hacen en el repositorio y se republican.
"""


def sidebar_page():
    lines = []
    current_section = None
    for _, page, section, label in PAGES:
        label = label or page.replace("-", " ")
        if section != current_section:
            if lines:
                lines.append("")
            lines.append(f"**{section}**")
            current_section = section
        lines.append(f"- [{label}]({page})")
    return "\n".join(lines) + "\n"


def footer_page(date):
    return (
        "> Espejo de `docs/` ([repositorio](https://github.com/"
        f"{GITHUB_REPO})) · generado el {date}. No editar aquí.\n"
    )


def clean_previous_pages(destination):
    list_path = os.path.join(destination, GENERATED_LIST)
    if not os.path.exists(list_path):
        return
    for name in read(list_path).splitlines():
        name = name.strip()
        if name:
            path = os.path.join(destination, name)
            if os.path.exists(path):
                os.remove(path)


def warn_foreign_pages(destination, generated):
    list_path = os.path.join(destination, GENERATED_LIST)
    previous = set()
    if os.path.exists(list_path):
        previous = {line.strip() for line in read(list_path).splitlines() if line.strip()}
    for name in sorted(os.listdir(destination)):
        if not name.endswith(".md"):
            continue
        if name not in generated and name not in previous:
            print(f"warning: keeping a page this script does not generate: {name}")


def publish(destination, push):
    date = datetime.date.today().isoformat()
    page_by_source = build_index()

    page_names = [page for _, page, _, _ in PAGES]
    duplicates = {page for page in page_names if page_names.count(page) > 1}
    if duplicates:
        sys.exit(f"error: duplicate pages in the manifest: {sorted(duplicates)}")

    problems = []
    for source, _, _, _ in PAGES:
        if not os.path.exists(os.path.join(ROOT, source)):
            problems.append(f"missing source {source}")

    validate_anchors([source for source, _, _, _ in PAGES], problems)

    pages = {}
    for source, page, _, _ in PAGES:
        path = os.path.join(ROOT, source)
        if os.path.exists(path):
            pages[page] = rewrite(read(path), source, page_by_source, problems)

    if problems:
        print(f"{len(problems)} problem(s):\n")
        print("\n".join(problems))
        return 1

    if not os.path.isdir(destination):
        sys.exit(f"error: destination {destination} does not exist")
    if not os.path.isdir(os.path.join(destination, ".git")):
        sys.exit(f"error: {destination} is not a git repository")

    generated_files = {f"{page}.md" for page in pages} | {
        "Home.md",
        "_Sidebar.md",
        "_Footer.md",
    }
    warn_foreign_pages(destination, generated_files)
    clean_previous_pages(destination)

    for page, content in pages.items():
        with open(os.path.join(destination, f"{page}.md"), "w", encoding="utf-8") as f:
            f.write(content)
    with open(os.path.join(destination, "Home.md"), "w", encoding="utf-8") as f:
        f.write(home_page(date))
    with open(os.path.join(destination, "_Sidebar.md"), "w", encoding="utf-8") as f:
        f.write(sidebar_page())
    with open(os.path.join(destination, "_Footer.md"), "w", encoding="utf-8") as f:
        f.write(footer_page(date))
    with open(os.path.join(destination, GENERATED_LIST), "w", encoding="utf-8") as f:
        f.write("\n".join(sorted(generated_files)) + "\n")

    print(f"{len(pages)} pages written to {destination}")

    if push:
        subprocess.run(["git", "-C", destination, "add", "-A"], check=True)
        commit = subprocess.run(
            ["git", "-C", destination, "commit", "-m", f"publica la wiki desde docs/ ({date})"],
            capture_output=True,
            text=True,
        )
        if commit.returncode != 0:
            print(commit.stdout.strip() or commit.stderr.strip())
            return 0 if "nothing to commit" in commit.stdout else 1
        subprocess.run(["git", "-C", destination, "push", "origin", "HEAD"], check=True)
        print("wiki published")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dest", default=DEFAULT_DEST, help="local copy of the wiki")
    parser.add_argument("--push", action="store_true", help="commit and publish the wiki")
    args = parser.parse_args()
    return publish(args.dest, args.push)


if __name__ == "__main__":
    sys.exit(main())
