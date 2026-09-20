# AGENTS.md — Instrucciones para agentes de IA

> **Nota de importación (19 sep 2026).** Esta es la guía del espacio de trabajo del curso
> tal como se usó en `aas`; se conserva como referencia y sus rutas siguen siendo válidas
> dentro de `docs/`. La guía vigente del repositorio `TicketRight` es
> [`../AGENTS.md`](../AGENTS.md) y el estado vivo está en [`../ESTADO.md`](../ESTADO.md).

Fuente única de verdad para cualquier agente que trabaje aquí (Claude Code, Codex, Cursor,
ChatGPT). `CLAUDE.md` y `.cursor/rules/` solo apuntan a este archivo.

## Qué es este repositorio

Espacio de trabajo del equipo para **Arquitecturas Avanzadas de Software** (Universidad
EAFIT, septiembre 2026). Dos cosas: el **conocimiento del curso** digitalizado en Markdown,
y los **entregables** del proyecto integrador.

Lee `ESTADO.md` antes de trabajar: dice en qué va el curso y qué está bloqueado.

## Estructura

```
curso/       Todo el material del curso, digitalizado y en Markdown
  material/  Los archivos originales del profesor — SOLO LECTURA
proyecto/    El proyecto integrador (80% de la nota), una carpeta por entrega
  decisiones/  ADRs, en el formato de 8 elementos del profesor
herramientas/  Utilidades del repo (verificador de enlaces)
```

## Dónde está cada cosa

**Busca aquí antes de abrir nada.** Casi todo lo que se necesita está en un archivo
pequeño; los grandes se leen por secciones, nunca enteros.

| Si necesitas… | Abre | Tamaño |
|---|---|---|
| En qué va todo, qué sigue y qué está bloqueado | `ESTADO.md` | 8 KB |
| **Los atributos de calidad con su umbral** | `proyecto/01-caso-de-negocio/atributos-de-calidad.md` | 4 KB |
| El estilo de arquitectura y por qué se eligió | `proyecto/decisiones/0005-estilo-de-arquitectura.md` | 6 KB |
| Cómo se escribe un ADR | `proyecto/decisiones/README.md` | 2 KB |
| Qué se entregó en la Entrega 1 y qué quedó abierto | `proyecto/01-caso-de-negocio/README.md` | 7 KB |
| **Qué pide la Entrega 2 y cómo está organizada** | `proyecto/02-modelamiento/README.md` | 15 KB · con índice |
| Los criterios con los que se califica la Entrega 2 | `proyecto/02-modelamiento/rubrica.md` | 30 KB · con índice |
| El enunciado literal del profesor | `proyecto/02-modelamiento/enunciado-teams.md` | 3 KB |
| **El caso de negocio entregado** | `.../caso-de-negocio-corporativo.md` | 45 KB · con índice |
| Trazabilidad y anexos técnicos (no se entregaron) | `.../caso-de-negocio.md` | 65 KB · con índice |
| Las cifras: costos, equilibrio, escenarios | `.../modelo-financiero.md` | 24 KB · con índice |
| Qué está verificado `[V]` y con qué fuente | `.../validaciones.md` | 17 KB |
| El Canvas bloque por bloque | `.../canvas.md` | 48 KB · con índice |
| Lo que se dijo en la sustentación | `.../presentacion.md` | 22 KB · con índice |
| Qué dijo el profesor en las clases 1 y 2 | `curso/clase-01-02.md` | 57 KB · índice con número de lámina |
| Patrones y estilos de arquitectura (clases 3 y 4) | `curso/clase-03-04.md` | 40 KB · con índice |
| **Lo que el profesor explicó del Entregable 2** | `curso/clase-03-04-transcripcion.md` | 18 KB · con índice |
| Arquitecturas evolutivas, migración, patrones y DDD (clases 5 y 6) | `curso/clase-05-06.md` | 88 KB · con índice |
| **La rúbrica del Entregable 3** | `proyecto/03-implementacion/rubrica.md` | 6 KB |
| Fechas, pesos y evaluación | `curso/syllabus.md` | 3 KB |
| Cómo se calificó la Entrega 1 | `.../rubrica.md` | 15 KB |

**Material histórico: no lo leas salvo que la tarea sea sobre él.** `ideas/` (78 KB, las
cuatro ideas del 7 de septiembre), `evaluacion-ideas.md`, `contenido-canvas-excel.md` y
`canvas-puesto.xlsx`.

## Cómo leer sin saturarte de contexto

- **Todo archivo grande de la tabla de arriba trae un índice `## Contenido` al principio**,
  con una fila por sección y qué pregunta responde. Localiza la sección y lee ese rango —`grep -n` para
  el número de línea, luego `sed -n 'a,bp'`—: no cargues el archivo entero.
- **Un archivo, una pregunta.** Si tienes que leer tres archivos para responder algo
  sencillo, el problema es del repo: dilo, o arréglalo.
- **Lo que no está en `ESTADO.md` no está decidido.** Ese archivo manda sobre cualquier plan
  que encuentres escrito en otro lado; los demás pueden haber quedado desactualizados.
- Si escribes, escribe en **un** archivo: el que te toca. Ver la regla de abajo.
- **Si mueves, renombras o reescribes algo, corre después
  `python3 herramientas/verifica-enlaces.py`.** Comprueba que todos los enlaces internos y
  las anclas `#seccion` siguen resolviendo. Un enlace roto manda al siguiente agente al
  archivo equivocado, que es justo lo que este repo intenta evitar.

## Reglas

**Español.** Todo el contenido. Nombres de archivo en minúscula, sin tildes, con guiones.

**Markdown primero.** Los entregables se redactan en Markdown. La conversión al formato
del profesor (xlsx, docx, PDF) es el último paso.

**No inventes.** Es la regla más importante. Cifras de mercado, costos, competidores,
regulación: marca explícitamente qué es supuesto y qué está verificado.

```markdown
- `[V]` Dato verificado. Fuente: <cuál>.
- `[S]` Supuesto sin validar. Responsable de validar: <quién>.
- `PENDIENTE: <qué falta y quién lo consigue>`
```

El profesor pide explícitamente «use datos y supuestos validados» (lámina 56). Un caso de
negocio con números inventados se cae en la sustentación. Es mejor un `PENDIENTE` que un
relleno plausible.

**Aplica los conceptos del curso, y enlázalos.** El material está digitalizado en
`curso/`. Cuando un argumento se apoye en algo de clase, enlaza al archivo. El curso
evalúa que el proyecto use los conceptos vistos, no que suene bien.

**`curso/material/` no se toca.** Es el original del profesor.

**Las decisiones van a `proyecto/decisiones/`** como ADR, en el formato de 8 elementos que
enseñó el profesor. No enterradas en un párrafo.

## Cómo trabajar cada cosa

**Un entregable:** lee `ESTADO.md` → el `README.md` de la entrega → los archivos de
`curso/` que apliquen → escribe marcando `[V]`/`[S]`/`PENDIENTE` → actualiza `ESTADO.md`.

**Material nuevo de clase:** el archivo original va a `curso/material/` con nombre
`AAAA-MM-DD-<tema>.<ext>`. Luego se digitaliza a `curso/<tema>.md`. Si las láminas son
imágenes —lo son casi siempre, las genera NotebookLM—, hay que renderizarlas y leerlas
una por una:

```bash
pdftoppm -png -r 100 curso/material/<archivo>.pdf /tmp/slides/p   # luego leer cada PNG
pdftotext -layout curso/material/<archivo>.pdf -                  # solo si tiene texto real
```

La digitalización debe ser **completa y fiel**: es la única forma de que una IA lea el
material. Indica la lámina de origen de cada sección y marca lo que sea interpretación.

**Una decisión:** `proyecto/decisiones/NNNN-<titulo>.md`, formato en el README de esa
carpeta.

## Git

Rama `main`. Commits en español, imperativo: `agrega canvas de la idea seleccionada`.
Un commit por unidad de trabajo con sentido.
