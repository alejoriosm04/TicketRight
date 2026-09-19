#!/usr/bin/env python3
"""Publica docs/ como la wiki del repositorio.

`docs/` es la fuente de verdad de la documentación; la wiki de GitHub es un espejo
generado: páginas planas, enlaces internos reescritos a nombres de página y un menú
lateral con las secciones. La wiki **no se edita a mano**: se regenera con este script.

Comprueba, antes de escribir nada:
  1. que cada archivo del manifiesto exista;
  2. que cada enlace interno del Markdown resuelva a otro documento o a un archivo real;
  3. que cada ancla `#seccion` corresponda a un encabezado real del archivo destino.

Uso:
  python3 herramientas/publica-wiki.py                 # escribe ../TicketRight.wiki
  python3 herramientas/publica-wiki.py --push          # además la commitea y publica
  python3 herramientas/publica-wiki.py --dest RUTA     # otra copia local de la wiki
"""

import argparse
import datetime
import os
import posixpath
import re
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO_POR_DEFECTO = os.path.normpath(os.path.join(RAIZ, "..", "TicketRight.wiki"))
REPO_GITHUB = "alejoriosm04/TicketRight"
RAMA_GITHUB = "main"
LISTA_GENERADOS = ".paginas-generadas"

ENLACE = re.compile(r"(!?)\[([^\]]*)\]\(([^)\s]+)\)")
EXTENSIONES_IMAGEN = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}

# (fuente, página, sección, etiqueta). El orden manda: define el menú lateral.
MANIFIESTO = [
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

    ("docs/proyecto/decisiones/README.md", "ADR", "Decisiones · ADR", "Índice y formato"),
    ("docs/proyecto/decisiones/0001-idea-de-negocio.md", "ADR-001-Idea-de-negocio", "Decisiones · ADR", "AD-001 Idea de negocio"),
    ("docs/proyecto/decisiones/0002-mensajeria-del-bus-de-eventos.md", "ADR-002-Mensajeria-del-bus-de-eventos", "Decisiones · ADR", "AD-002 Mensajería del bus de eventos"),
    ("docs/proyecto/decisiones/0003-consistencia-por-tipo-de-inventario.md", "ADR-003-Consistencia-por-tipo-de-inventario", "Decisiones · ADR", "AD-003 Consistencia del inventario"),
    ("docs/proyecto/decisiones/0004-datos-personales-almacenamiento-y-acceso.md", "ADR-004-Datos-personales", "Decisiones · ADR", "AD-004 Datos personales"),
    ("docs/proyecto/decisiones/0005-estilo-de-arquitectura.md", "ADR-005-Estilo-de-arquitectura", "Decisiones · ADR", "AD-005 Estilo de arquitectura"),
    ("docs/proyecto/decisiones/0006-escalado-programado-por-ventana-de-venta.md", "ADR-006-Escalado-por-ventana", "Decisiones · ADR", "AD-006 Escalado por ventana"),
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
    ("docs/curso/fundamentos-arquitectura.md", "Curso-Fundamentos-de-arquitectura", "Curso", "Fundamentos de arquitectura"),
    ("docs/curso/mensajeria-pubsub.md", "Curso-Mensajeria-pubsub", "Curso", "Mensajería pub/sub"),
]


def ancla(titulo):
    """Replica cómo GitHub convierte un encabezado en ancla."""
    t = titulo.strip().lower()
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"[`*_]", "", t)
    t = re.sub(r"[^\w\s-]", "", t, flags=re.UNICODE)
    return t.replace(" ", "-")


def leer(ruta):
    with open(ruta, encoding="utf-8") as f:
        return f.read()


def url_github(ruta, es_directorio=False):
    tipo = "tree" if es_directorio else "blob"
    return f"https://github.com/{REPO_GITHUB}/{tipo}/{RAMA_GITHUB}/{ruta}"


def url_imagen(ruta):
    return f"https://raw.githubusercontent.com/{REPO_GITHUB}/{RAMA_GITHUB}/{ruta}"


def construir_indice():
    por_fuente = {}
    for fuente, pagina, seccion, etiqueta in MANIFIESTO:
        por_fuente[fuente] = pagina
    return por_fuente


def resolver_destino(destino, fuente, por_fuente, problemas):
    """Convierte el destino de un enlace Markdown a su forma en la wiki."""
    if destino.startswith(("http://", "https://", "mailto:", "tel:")):
        return destino
    camino, _, fragmento = destino.partition("#")
    if not camino:
        return destino if not fragmento else destino
    objetivo = posixpath.normpath(
        posixpath.join(posixpath.dirname(fuente), camino)
    )
    completo = os.path.normpath(os.path.join(RAIZ, objetivo))
    if not os.path.exists(completo):
        problemas.append(f"enlace roto        {fuente} → {destino}")
        return destino
    sufijo = f"#{fragmento}" if fragmento else ""
    if os.path.isdir(completo):
        return url_github(objetivo, es_directorio=True) + sufijo
    if objetivo.endswith(".md"):
        pagina = por_fuente.get(objetivo)
        if pagina:
            return pagina + sufijo
        return url_github(objetivo) + sufijo
    if os.path.splitext(objetivo)[1].lower() in EXTENSIONES_IMAGEN:
        return url_imagen(objetivo) + sufijo
    return url_github(objetivo) + sufijo


def reescribir(contenido, fuente, por_fuente, problemas):
    def reemplazo(m):
        signo, texto, destino = m.groups()
        nuevo = resolver_destino(destino, fuente, por_fuente, problemas)
        return f"{signo}[{texto}]({nuevo})"

    return ENLACE.sub(reemplazo, contenido)


def validar_anclas(fuentes, por_fuente, problemas):
    """Comprueba que cada `#ancla` exista en el documento destino."""
    anclas = {}
    for fuente in fuentes:
        ruta = os.path.join(RAIZ, fuente)
        if os.path.exists(ruta):
            anclas[fuente] = {
                ancla(l.lstrip("#")) for l in leer(ruta).splitlines() if l.startswith("#")
            }

    for fuente in fuentes:
        ruta = os.path.join(RAIZ, fuente)
        if not os.path.exists(ruta):
            continue
        for m in ENLACE.finditer(leer(ruta)):
            destino = m.group(3)
            if destino.startswith(("http://", "https://", "mailto:", "tel:")):
                continue
            camino, _, fragmento = destino.partition("#")
            if not fragmento:
                continue
            objetivo = posixpath.normpath(
                posixpath.join(posixpath.dirname(fuente), camino)
            ) if camino else fuente
            if not objetivo.endswith(".md"):
                continue
            if objetivo in anclas and fragmento not in anclas[objetivo]:
                problemas.append(f"ancla inexistente  {fuente} → {destino}")


def generar_home(fecha):
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
| [ADR](ADR) | Las cinco decisiones con las que se defiende la entrega |
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

> Espejo de `docs/` generado el {fecha} con `python3 herramientas/publica-wiki.py`.
> **No edites esta wiki a mano**: los cambios se hacen en el repositorio y se republican.
"""


def generar_sidebar():
    lineas = []
    seccion_actual = None
    for _, pagina, seccion, etiqueta in MANIFIESTO:
        etiqueta = etiqueta or pagina.replace("-", " ")
        if seccion != seccion_actual:
            if lineas:
                lineas.append("")
            lineas.append(f"**{seccion}**")
            seccion_actual = seccion
        lineas.append(f"- [{etiqueta}]({pagina})")
    return "\n".join(lineas) + "\n"


def generar_footer(fecha):
    return (
        "> Espejo de `docs/` ([repositorio](https://github.com/"
        f"{REPO_GITHUB})) · generado el {fecha}. No editar aquí.\n"
    )


def limpiar_paginas_previas(destino):
    ruta_lista = os.path.join(destino, LISTA_GENERADOS)
    if not os.path.exists(ruta_lista):
        return
    for nombre in leer(ruta_lista).splitlines():
        nombre = nombre.strip()
        if nombre:
            ruta = os.path.join(destino, nombre)
            if os.path.exists(ruta):
                os.remove(ruta)


def avisar_paginas_ajenas(destino, generados):
    ruta_lista = os.path.join(destino, LISTA_GENERADOS)
    anteriores = set()
    if os.path.exists(ruta_lista):
        anteriores = {l.strip() for l in leer(ruta_lista).splitlines() if l.strip()}
    for nombre in sorted(os.listdir(destino)):
        if not nombre.endswith(".md"):
            continue
        if nombre not in generados and nombre not in anteriores:
            print(f"aviso: se conserva una página que no genera este script: {nombre}")


def publicar(destino, empujar):
    fecha = datetime.date.today().isoformat()
    por_fuente = construir_indice()

    duplicadas = {p for _, p, _, _ in MANIFIESTO if [x[1] for x in MANIFIESTO].count(p) > 1}
    if duplicadas:
        sys.exit(f"error: páginas duplicadas en el manifiesto: {sorted(duplicadas)}")

    problemas = []
    for fuente, _, _, _ in MANIFIESTO:
        if not os.path.exists(os.path.join(RAIZ, fuente)):
            problemas.append(f"fuente inexistente {fuente}")

    validar_anclas([f for f, _, _, _ in MANIFIESTO], por_fuente, problemas)

    paginas = {}
    for fuente, pagina, _, _ in MANIFIESTO:
        ruta = os.path.join(RAIZ, fuente)
        if os.path.exists(ruta):
            paginas[pagina] = reescribir(
                leer(ruta), fuente, por_fuente, problemas
            )

    if problemas:
        print(f"{len(problemas)} problema(s):\n")
        print("\n".join(problemas))
        return 1

    if not os.path.isdir(destino):
        sys.exit(f"error: no existe el destino {destino}")
    if not os.path.isdir(os.path.join(destino, ".git")):
        sys.exit(f"error: {destino} no es un repositorio git")

    archivos_generados = {f"{p}.md" for p in paginas} | {
        "Home.md",
        "_Sidebar.md",
        "_Footer.md",
    }
    avisar_paginas_ajenas(destino, archivos_generados)
    limpiar_paginas_previas(destino)

    for pagina, contenido in paginas.items():
        with open(os.path.join(destino, f"{pagina}.md"), "w", encoding="utf-8") as f:
            f.write(contenido)
    with open(os.path.join(destino, "Home.md"), "w", encoding="utf-8") as f:
        f.write(generar_home(fecha))
    with open(os.path.join(destino, "_Sidebar.md"), "w", encoding="utf-8") as f:
        f.write(generar_sidebar())
    with open(os.path.join(destino, "_Footer.md"), "w", encoding="utf-8") as f:
        f.write(generar_footer(fecha))
    with open(os.path.join(destino, LISTA_GENERADOS), "w", encoding="utf-8") as f:
        f.write("\n".join(sorted(archivos_generados)) + "\n")

    print(f"{len(paginas)} páginas escritas en {destino}")

    if empujar:
        subprocess.run(["git", "-C", destino, "add", "-A"], check=True)
        commit = subprocess.run(
            ["git", "-C", destino, "commit", "-m", f"publica la wiki desde docs/ ({fecha})"],
            capture_output=True,
            text=True,
        )
        if commit.returncode != 0:
            print(commit.stdout.strip() or commit.stderr.strip())
            return 0 if "nothing to commit" in commit.stdout else 1
        subprocess.run(["git", "-C", destino, "push", "origin", "HEAD"], check=True)
        print("wiki publicada")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dest", default=DESTINO_POR_DEFECTO, help="copia local de la wiki")
    parser.add_argument("--push", action="store_true", help="commitea y publica la wiki")
    args = parser.parse_args()
    return publicar(args.dest, args.push)


if __name__ == "__main__":
    sys.exit(main())
