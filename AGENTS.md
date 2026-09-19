# AGENTS.md — Instrucciones para agentes de IA

Fuente única de verdad para cualquier agente que trabaje en este repositorio (Claude Code,
Codex, Cursor, ChatGPT). `CLAUDE.md` solo apunta aquí.

## Qué es este repositorio

**TicketRight**: la implementación del proyecto integrador de **Arquitecturas Avanzadas de
Software** (Universidad EAFIT, septiembre 2026) — la **Entrega 3**. El caso de negocio
(Entrega 1) y el modelamiento (Entrega 2) ya están hechos y **no se rediseñan aquí**: viven
en `docs/`, importados del repositorio `aas`, y son la fuente de verdad de la documentación.
Este repositorio es donde ese diseño se convierte en código, se prueba y se defiende.

**Lee `ESTADO.md` antes de trabajar**: dice qué está hecho, qué sigue y qué está bloqueado.

## Estructura

```
ESTADO.md     Estado vivo del repo y de la Entrega 3. Empieza aquí siempre
docs/         Base de conocimiento importada de aas
  ESTADO.md     Estado del proyecto y del curso hasta la Entrega 2 (bitácora del diseño)
  proyecto/     Entregas 1 y 2, ADRs y decisiones
    decisiones/   Fuente oficial de los ADR (formato de 8 elementos del profesor)
  02-modelamiento/  Diseños que la Entrega 3 implementa (modelo, arquitecturas, pruebas…)
  curso/        Material del curso digitalizado
    material/     Originales del profesor — SOLO LECTURA
  herramientas/ Verificador de enlaces y utilidades de los entregables
herramientas/ publica-wiki.py — publica docs/ como wiki del repositorio
```

El código de la Entrega 3 va en este repositorio; su estructura está
`PENDIENTE` de decisión del equipo.

## La wiki

`docs/` es la fuente de verdad y la [wiki](https://github.com/alejoriosm04/TicketRight/wiki)
es un **espejo generado** con las mismas páginas, enlaces adaptados y un menú de navegación.
**No se edita a mano**: se regenera así.

```bash
python3 herramientas/publica-wiki.py          # escribe la wiki local (../TicketRight.wiki)
python3 herramientas/publica-wiki.py --push   # además la commitea y publica
```

**Consulta la wiki —o `docs/` directamente, es lo mismo— siempre que una tarea necesite
contexto de negocio, arquitectura, pruebas o del curso.** Es más rápido que preguntar y
evita contradecir decisiones ya tomadas. Si cambias un documento de `docs/`, corre el
verificador y republica la wiki.

## Dónde está cada cosa

**Busca aquí antes de abrir nada.** Casi todo lo que se necesita está en un archivo pequeño;
los grandes se leen por secciones, nunca enteros.

| Si necesitas… | Abre | Tamaño |
|---|---|---|
| En qué va el repo, qué sigue y qué está bloqueado | `ESTADO.md` | 6 KB |
| Estado del proyecto y del curso hasta la Entrega 2 | `docs/ESTADO.md` | 24 KB · con índice |
| **Qué pide la Entrega 3** | `docs/proyecto/03-implementacion/README.md` | 4 KB |
| **Los 12 atributos de calidad con su umbral** | `docs/proyecto/01-caso-de-negocio/atributos-de-calidad.md` | 28 KB |
| El estilo de arquitectura y por qué se eligió | `docs/proyecto/decisiones/0005-estilo-de-arquitectura.md` | 20 KB |
| Cómo se escribe un ADR y cuáles son los cinco | `docs/proyecto/decisiones/README.md` | 12 KB |
| **Los diseños que hay que implementar** | `docs/proyecto/02-modelamiento/README.md` | 28 KB · con índice |
| El modelo de dominio (32 conceptos, 12 raíces) | `docs/proyecto/02-modelamiento/modelo-de-dominio.md` | 40 KB · con índice |
| La arquitectura de referencia (capas y patrones) | `docs/proyecto/02-modelamiento/arquitectura-de-referencia.md` | 36 KB · con índice |
| La arquitectura de implementación (AWS, costos, IaC) | `docs/proyecto/02-modelamiento/arquitectura-de-implementacion.md` | 40 KB · con índice |
| El diagrama de clases (39 clases, hexagonal) | `docs/proyecto/02-modelamiento/diagrama-de-clases.md` | 36 KB · con índice |
| El diagrama de secuencia (38 mensajes, errores) | `docs/proyecto/02-modelamiento/diagrama-de-secuencia.md` | 16 KB · con índice |
| **Los 21 casos de prueba unitaria** | `docs/proyecto/02-modelamiento/plan-de-pruebas.md` | 24 KB · con índice |
| La volumetría y los 4 escenarios de carga | `docs/proyecto/02-modelamiento/volumetria.md` | 16 KB · con índice |
| Qué métricas, tableros y alertas | `docs/proyecto/02-modelamiento/observabilidad.md` | 44 KB · con índice |
| El catálogo de fallos y sus hipótesis | `docs/proyecto/02-modelamiento/inyeccion-de-fallos.md` | 28 KB · con índice |
| El prototipo navegable (16 pantallas) | `docs/proyecto/02-modelamiento/prototipo/index.html` | desplegado |
| El caso de negocio entregado | `docs/proyecto/01-caso-de-negocio/caso-de-negocio-corporativo.md` | 48 KB · con índice |
| El Canvas, las cifras y las validaciones legales | `docs/proyecto/01-caso-de-negocio/{canvas,modelo-financiero,validaciones}.md` | 20–48 KB |
| La identidad visual (colores, tipografía) | `docs/proyecto/design.md` | 20 KB |
| Qué dijo el profesor (clases 1–4) | `docs/curso/clase-01-02.md` · `clase-03-04.md` · `clase-03-04-transcripcion.md` | 20–60 KB |
| Fechas, pesos y evaluación | `docs/curso/syllabus.md` | 4 KB |
| Los criterios de calificación | `docs/proyecto/02-modelamiento/rubrica.md` | 32 KB · con índice |

**Material histórico: no lo leas salvo que la tarea sea sobre él.** `docs/proyecto/01-caso-de-negocio/ideas/`,
`evaluacion-ideas.md` y `contenido-canvas-excel.md`.

## Cómo leer sin saturarte de contexto

- **Todo archivo grande de la tabla trae un índice `## Contenido` al principio**, con una
  fila por sección y qué pregunta responde. Localiza la sección y lee ese rango —`grep -n`
  para el número de línea, luego `sed -n 'a,bp'`—: no cargues el archivo entero.
- **Un archivo, una pregunta.** Si tienes que leer tres archivos para responder algo
  sencillo, dilo, o arréglalo.
- **Lo que no está en `ESTADO.md` no está decidido.** Ese archivo manda sobre cualquier plan
  escrito en otro lado; los demás pueden haber quedado desactualizados.
- Si escribes, escribe en **un** archivo: el que te toca.
- **Si mueves, renombras o reescribes algo, corre después
  `python3 docs/herramientas/verifica-enlaces.py`.** Comprueba que todos los enlaces internos
  y las anclas `#seccion` siguen resolviendo, en todo el repo. Un enlace roto manda al
  siguiente agente al archivo equivocado.

## Reglas

**Español.** Todo el contenido. Nombres de archivo en minúscula, sin tildes, con guiones.

**Markdown primero.** La documentación se redacta y se corrige en `docs/`. La wiki y
cualquier conversión (PDF, docx, xlsx) son el último paso.

**No inventes.** Es la regla más importante. Cifras de mercado, costos, competidores,
regulación: marca explícitamente qué es supuesto y qué está verificado.

```markdown
- `[V]` Dato verificado. Fuente: <cuál>.
- `[S]` Supuesto sin validar. Responsable de validar: <quién>.
- `PENDIENTE: <qué falta y quién lo consigue>`
```

Un caso de negocio o una defensa con números inventados se cae. Es mejor un `PENDIENTE` que
un relleno plausible.

**Las decisiones nuevas van a `docs/proyecto/decisiones/`** como ADR, en el formato de 8
elementos del profesor (ver el README de esa carpeta). Una decisión aceptada no se cambia
sin un ADR que la reemplace.

**`docs/curso/material/` no se toca.** Es el original del profesor.

**El diseño manda.** El código implementa lo que documentan el modelo de dominio, las
arquitecturas, los diagramas y el plan de pruebas; si al implementar aparece una
contradicción, se resuelve en `docs/` con un ADR o una corrección explícita, no en silencio.

## La Entrega 3

**26 de septiembre de 2026, 30%: Implementación · Sustentación · Simulación · Defensa.**

- La **defensa pesa tanto como el código**. El material son los ADR de
  `docs/proyecto/decisiones/`: para cada decisión visible en la demo hay que poder responder
  **qué atributo de calidad la justifica y qué se cedió a cambio**.
- Lo que la implementación debe cerrar: los 21 casos del
  [plan de pruebas](docs/proyecto/02-modelamiento/plan-de-pruebas.md), los 4 escenarios de la
  [volumetría](docs/proyecto/02-modelamiento/volumetria.md), la
  [observabilidad](docs/proyecto/02-modelamiento/observabilidad.md) instrumentada y el módulo
  de [inyección de fallos](docs/proyecto/02-modelamiento/inyeccion-de-fallos.md) con bitácora.
- `PENDIENTE: confirmar qué se espera de «simulación» y el formato de la sustentación.`

## Git

Rama `main`. Commits en español, imperativo: `agrega el esqueleto del servicio de ventas`.
Un commit por unidad de trabajo con sentido.
