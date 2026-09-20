# Arquitecturas Avanzadas de Software — EAFIT 2026

> **Importado desde el repositorio `aas` el 19 de septiembre de 2026.** Esta carpeta es la
> base de conocimiento del proyecto dentro de `TicketRight`; su espejo navegable es la
> [wiki](https://github.com/alejoriosm04/TicketRight/wiki). Las instrucciones vigentes para
> agentes están en [`../AGENTS.md`](../AGENTS.md) y el estado vivo en
> [`../ESTADO.md`](../ESTADO.md).

Repositorio del equipo. Todo el material del curso digitalizado en Markdown y los
entregables del proyecto integrador. Pensado para trabajarse con agentes de IA (Claude
Code, Codex, Cursor, ChatGPT) sin tener que explicarles el contexto cada vez.

**Equipo:** Alejo · Lina · Quinnie
**Curso:** cuatro sábados de septiembre de 2026. Profesor José Daniel Medina Solano.

---

## Si es la primera vez que entras, lee esto

1. **[`ESTADO.md`](ESTADO.md)** — en qué va todo y qué te toca a ti ahora mismo. Es el
   único archivo que hay que leer siempre.
2. **[`proyecto/02-modelamiento/README.md`](proyecto/02-modelamiento/README.md)** — la
   entrega activa: once entregables, sábado 19 de septiembre a las 3 p.m.
3. **[`proyecto/01-caso-de-negocio/caso-de-negocio-corporativo.md`](proyecto/01-caso-de-negocio/caso-de-negocio-corporativo.md)**
   — el caso de negocio entregado. Todo lo demás cuelga de ahí.

Si vas a discutir arquitectura, agrega
**[`curso/clase-01-02.md`](curso/clase-01-02.md)**: son las 57 láminas de la clase 1-2
digitalizadas, e incluye la rúbrica real de la Entrega 1.

## Dónde estamos

**Proyecto elegido: «TicketRight»**, una plataforma de venta de boletería para eventos de alta
demanda ([AD-001](proyecto/decisiones/0001-idea-de-negocio.md)). La tesis del proyecto no
es «no sobrevender» —eso lo resuelve un candado— sino **no romper nunca la correspondencia
entre el dinero y el derecho a entrar**, con una pasarela de pagos que se demora, responde
tarde y responde dos veces.

*Hasta el 10 de septiembre el negocio se llamó «Puesto». Aparece así en el historial de git.*

| # | Entrega | Peso | Fecha | Estado |
|---|---|---|---|---|
| 1 | Caso de negocio | 20% | sáb 12 sep, 8 a.m. | ✅ Entregada |
| 2 | Modelamiento de la solución | 30% | sáb 19 sep, 3 p.m. | 🟡 Activa — 11 entregables |
| 3 | Implementación, sustentación y defensa | 30% | sáb 26 sep | ⚪ Sin empezar |

**La Entrega 1 se entregó:** documento, Canvas en el Excel del profesor y
[presentación](https://wondrous-monstera-174b32.netlify.app/). Lo que deja servido para la
Entrega 2 —atributos de calidad con umbral, estilo de arquitectura y cadenas de
trazabilidad— está listado en [`ESTADO.md`](ESTADO.md).

## Estructura

```
ESTADO.md                 Dónde vamos y qué está bloqueado. Empieza aquí siempre
AGENTS.md                 Instrucciones para agentes de IA — y para nosotros

curso/                    Material del curso, digitalizado
  clase-01-02.md          Las 57 láminas de las clases 1 y 2
  clase-03-04.md          Patrones y estilos de arquitectura (clases 3 y 4)
  clase-03-04-transcripcion.md  Lo que el profesor explicó del Entregable 2
  clase-05-06.md          Arquitecturas evolutivas, migración, patrones y DDD (clases 5 y 6)
  fundamentos-arquitectura.md   Cuestionario de fundamentos, destilado por tema
  mensajeria-pubsub.md    Paper Kafka vs. RabbitMQ, destilado
  syllabus.md             Evaluación, fechas y ruta crítica
  material/               Originales del profesor — SOLO LECTURA

proyecto/                 Proyecto integrador (80%)
  01-caso-de-negocio/     Entrega 1 — entregada el sáb 12 sep
    README.md             Qué se entregó, dónde está y qué quedó abierto. Empieza ahí
    caso-de-negocio-corporativo.md   EL ENTREGABLE, en Markdown. Se corrige aquí y se reexporta
    caso-de-negocio-ticketright.docx El anterior maquetado: lo que vio el profesor
    canvas-ticketright.xlsx          El Canvas en la plantilla del profesor
    presentacion.md       La sustentación, transcrita del sitio desplegado
    atributos-de-calidad.md  Los 12 atributos con su umbral ← el insumo de la Entrega 2
    caso-de-negocio.md    Consolidado de trabajo: trazabilidad y los anexos A, B y C
    rubrica.md            La rúbrica del profesor: pesos y niveles
    alcance.md            Problema, actores, solución y qué queda fuera
    canvas.md             Los 9 bloques del Canvas, con sus trampas
    modelo-financiero.md  Ingresos, costos por inductor, punto de equilibrio
    validaciones.md       Todo lo verificado, con fuente
    ideas/                Las cuatro ideas que se evaluaron. La elegida es idea-lina.md
    evaluacion-ideas.md   Por qué se eligió esa y no las otras
  02-modelamiento/        Entrega 2 — sáb 19 sep, 3 p.m.
    README.md             Los 11 entregables organizados. Empieza ahí
    rubrica.md            La rúbrica del profesor, digitalizada
    enunciado-teams.md    El enunciado literal. No se edita
    adr-plantilla.xlsx    La plantilla de ADR del profesor
  03-implementacion/      Entrega 3 — sáb 26 sep ← LA ENTREGA ACTIVA
  decisiones/             ADRs, formato de 8 elementos del profesor

herramientas/             Utilidades del repo
  verifica-enlaces.py     Comprueba que ningún enlace ni ancla quedó roto
```

**¿Dónde está cada cosa?** La tabla de enrutamiento —qué archivo abrir según lo que
necesites, con su tamaño— está en [`AGENTS.md`](AGENTS.md#dónde-está-cada-cosa), que es lo
que los agentes leen solos al arrancar.

## Las cuatro reglas

**Español.** Todo el contenido. Nombres de archivo en minúscula, sin tildes, con guiones.

**Markdown primero.** Los entregables se redactan aquí. La conversión al formato del
profesor (xlsx, docx, PDF) es el último paso.

**No se inventan datos.** Es la regla más importante. El profesor pide explícitamente
«use datos y supuestos validados» (lámina 56), y un caso de negocio con números inventados
se cae en la sustentación.

```markdown
[V] Dato verificado. Fuente: <cuál>.
[S] Supuesto sin validar. Responsable de validar: <quién>.
PENDIENTE: <qué falta y quién lo consigue>
```

**`curso/material/` no se toca.** Es el original del profesor.

## Cómo trabajar aquí

**Un entregable:** lee `ESTADO.md` → el `README.md` de la entrega → los archivos de
`curso/` que apliquen → escribe marcando `[V]`/`[S]`/`PENDIENTE` → **actualiza
`ESTADO.md`**. Ese último paso es el que hace que el repo le sirva al siguiente.

**Una decisión:** no se entierra en un párrafo. Va a
[`proyecto/decisiones/`](proyecto/decisiones/) como ADR, en el formato de 8 elementos del
profesor. La Entrega 3 incluye **defensa**, y esa carpeta es el material con el que se
defiende.

**Con agentes de IA:** las instrucciones están en [`AGENTS.md`](AGENTS.md) y son las mismas
para todos. Claude Code, Codex y Cursor las leen solos. Para ChatGPT u otro chat sin acceso
al repo, sube `AGENTS.md`, `ESTADO.md` y lo que necesites de `curso/`.

**Git:** rama `main`. Commits en español y en imperativo —`agrega el bloque de segmentos
del canvas`—, uno por unidad de trabajo con sentido.
