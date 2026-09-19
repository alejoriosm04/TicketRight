#!/usr/bin/env python3
"""Verifica los enlaces internos de los .md propios del repositorio.

Comprueba dos cosas que se rompen solas cuando alguien mueve, renombra o reescribe
un archivo, y que dejan a un agente leyendo el documento equivocado:

  1. que el archivo enlazado exista;
  2. que el ancla `#seccion` corresponda a un encabezado real de ese archivo.

Uso:  python3 docs/herramientas/verifica-enlaces.py [raiz]
Sale con código 1 si encuentra algo roto, para poder usarlo en un hook o en CI.
Sin argumento recorre todo el repositorio TicketRight (docs/ incluido).
"""

import os
import re
import sys

RAIZ_POR_DEFECTO = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
RAIZ = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else RAIZ_POR_DEFECTO
ENLACE = re.compile(r"\]\(([^)]+)\)")
DIRECTORIOS_EXTERNOS = {
    ".git",
    ".agents",
    ".claude",
    ".kiro",
    ".venv",
    "node_modules",
}


def ancla(titulo: str) -> str:
    """Replica cómo GitHub convierte un encabezado en ancla."""
    t = titulo.strip().lower()
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)   # [texto](url) -> texto
    t = re.sub(r"[`*_]", "", t)
    t = re.sub(r"[^\w\s-]", "", t, flags=re.UNICODE)
    return t.replace(" ", "-")


def archivos_md():
    for raiz, dirs, archivos in os.walk(RAIZ):
        # Las skills instaladas conservan enlaces relativos a su repositorio de origen.
        # No forman parte del conocimiento del curso y se validan en su propio paquete.
        dirs[:] = [d for d in dirs if d not in DIRECTORIOS_EXTERNOS]
        for a in sorted(archivos):
            if a.endswith(".md"):
                yield os.path.join(raiz, a)


def main() -> int:
    anclas = {}
    for ruta in archivos_md():
        with open(ruta, encoding="utf-8") as f:
            anclas[os.path.normpath(ruta)] = {
                ancla(l.lstrip("#")) for l in f if l.startswith("#")
            }

    problemas = []
    for ruta in archivos_md():
        carpeta = os.path.dirname(ruta)
        with open(ruta, encoding="utf-8") as f:
            contenido = f.read()
        for m in ENLACE.finditer(contenido):
            destino = m.group(1)
            if destino.startswith(("http", "mailto", "tel:")):
                continue
            camino = destino.split("#")[0]
            completo = (
                os.path.normpath(os.path.join(carpeta, camino))
                if camino
                else os.path.normpath(ruta)
            )
            rel = os.path.relpath(ruta, RAIZ)
            if camino and not os.path.exists(completo):
                problemas.append(f"archivo inexistente  {rel} → {destino}")
                continue
            if "#" in destino:
                seccion = destino.split("#", 1)[1]
                if completo in anclas and seccion not in anclas[completo]:
                    problemas.append(f"ancla inexistente    {rel} → {destino}")

    if problemas:
        print(f"{len(problemas)} enlace(s) roto(s):\n")
        print("\n".join(problemas))
        return 1
    print("Todos los enlaces internos resuelven.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
