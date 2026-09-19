# Entrega 1 — Definición completa del caso de negocio

**Peso:** 20% del proyecto integrador
**Venció:** sábado 12 de septiembre de 2026, 8:00 a.m.
**Estado:** ✅ **Entregada.** Documento, Canvas y sustentación arriba.
`PENDIENTE: la nota y la retroalimentación del profesor no han llegado.`

El negocio se llama **TicketRight**. Hasta el 10 de septiembre el nombre de trabajo fue
«Puesto»: aparece así en el historial de git y en algunos documentos de respaldo.

---

## Qué se entregó

| Artefacto | Archivo en el repo | Nombre con el que se subió |
|---|---|---|
| **Documento del caso de negocio** | [`caso-de-negocio-ticketright.docx`](caso-de-negocio-ticketright.docx) | `TicketRight - Caso de Negocio.docx` |
| **Business Model Canvas**, en el formato del profesor | [`canvas-ticketright.xlsx`](canvas-ticketright.xlsx) | `Modelo_canvas_excel_2026.xlsx` |
| **Sustentación** | [`presentacion.md`](presentacion.md) — transcripción | <https://wondrous-monstera-174b32.netlify.app/> |

**La fuente del documento** es [`caso-de-negocio-corporativo.md`](caso-de-negocio-corporativo.md):
el `.docx` es ese Markdown maquetado en Word. Si algo hay que corregir, se corrige en el
Markdown y se vuelve a exportar — no al revés.

Dos cosas que quedaron desalineadas en lo entregado y conviene saber antes de que alguien
las note en la sustentación:

- El `.docx` dice que el Canvas adjunto se llama `canvas-puesto.xlsx`. El archivo que se
  subió es el de TicketRight. El Markdown ya está corregido; el Word no se volvió a exportar.
- Nunca se generó el PDF. Se entregó en `.docx`, que era la alternativa contemplada.

## El mapa de archivos

**Lo entregado** — se toca solo para corregir errores, y siempre desde el Markdown:

| Archivo | Qué es |
|---|---|
| [`caso-de-negocio-corporativo.md`](caso-de-negocio-corporativo.md) | **El entregable.** Los cinco componentes, 4 OKR con 16 KR, fuentes y coherencia integral |
| [`caso-de-negocio-ticketright.docx`](caso-de-negocio-ticketright.docx) | El anterior, maquetado. Lo que vio el profesor |
| [`canvas-ticketright.xlsx`](canvas-ticketright.xlsx) | Los nueve bloques en la plantilla del profesor |
| [`presentacion.md`](presentacion.md) | La sustentación, transcrita del sitio desplegado |

**El material de trabajo** que produjo el entregable. Sigue siendo la mejor fuente de detalle
—el entregable resume, estos documentos sustentan— y es de donde arranca la Entrega 2:

| Archivo | Qué es | Para la Entrega 2 |
|---|---|---|
| [`atributos-de-calidad.md`](atributos-de-calidad.md) | **Los nueve atributos con su umbral y su condición de medición.** Salió del anexo A para poder leerse sin cargar 65 KB | ⭐ **el insumo n.º 1** |
| [`caso-de-negocio.md`](caso-de-negocio.md) | El consolidado de trabajo. Tiene lo que el entregable dejó fuera: **§6 trazabilidad** y los anexos A (estilo de arquitectura), B (estrategia de implementación) y C (DAFO) | El razonamiento detrás del estilo elegido |
| [`alcance.md`](alcance.md) | Problema, actores, solución y qué queda fuera, en detalle | Frontera del sistema |
| [`canvas.md`](canvas.md) | Los nueve bloques con sus trampas y dependencias | Capacidades del bloque 7 |
| [`modelo-financiero.md`](modelo-financiero.md) | Ingresos, costos por inductor, equilibrio, escenarios | El costo por boleta como atributo de calidad |
| [`contenido-canvas-excel.md`](contenido-canvas-excel.md) | El texto definitivo del Canvas y a qué celda va cada cuadro | Si hay que rehacer el xlsx |
| [`validaciones.md`](validaciones.md) | Todo lo `[V]` con su fuente | Las restricciones legales que la arquitectura tiene que respetar |
| [`rubrica.md`](rubrica.md) | La rúbrica del profesor para esta entrega | Referencia de nivel de exigencia |
| [`evaluacion-ideas.md`](evaluacion-ideas.md) | Por qué se eligió esta idea y no las otras tres | Sustento de [AD-001](../decisiones/0001-idea-de-negocio.md) |
| [`ideas/`](ideas/) | Las cuatro ideas presentadas el 7 de septiembre | Historial |
| `canvas-puesto.xlsx` | **Superado.** Es el Canvas anterior al cambio de marca. Se conserva como historial: no editarlo ni entregarlo | — |

## Cómo se calificó

Cinco componentes ([`rubrica.md`](rubrica.md)), y así quedaron en el entregable:

| # | Componente | Peso | Dónde quedó |
|---|---|---|---|
| 1 | Premisas, supuestos y restricciones | 10% | [§1](caso-de-negocio-corporativo.md#1-premisas-supuestos-y-restricciones) — 5 premisas `[V]`, 8 supuestos con impacto, 5 restricciones, dependencias |
| 2 | Alcance y definición del caso | 15% | [§2](caso-de-negocio-corporativo.md#2-alcance-y-definición-del-caso-de-negocio) — problema, actores, solución, dentro y fuera |
| 3 | Business Model Canvas | 25% | [§3](caso-de-negocio-corporativo.md#3-business-model-canvas) + el xlsx |
| 4 | Modelo de costos e ingresos | 25% | [§4](caso-de-negocio-corporativo.md#4-modelo-de-ingresos-costos-y-viabilidad) — unidad económica, inductores, equilibrio, sensibilidad, capital, proyección, 7 riesgos |
| 5 | Definición de OKR | 25% | [§5](caso-de-negocio-corporativo.md#5-objetivos-y-resultados-clave) — 4 objetivos, 16 KR con línea base, meta y horizonte |
| — | Coherencia transversal | *decide los cinco* | [Coherencia integral](caso-de-negocio-corporativo.md#coherencia-integral-del-caso) y las tres cadenas de la presentación |

La regla que decidía la nota de los cinco: el caso tiene que ser **trazable**.

```
PREMISAS → SUPUESTOS → RESTRICCIONES → PROBLEMA → ALCANCE → CANVAS
        → INGRESOS ── COSTOS → VIABILIDAD → OKR
```

> *«Si cada sección parece haber sido construida independientemente, debería penalizarse la
> calificación, aunque cada documento, considerado aisladamente, se vea bien.»*

**Los pasos 5 y 6 de la lámina 55** —estilo de arquitectura y estrategia de implementación—
no estaban en la rúbrica y **no se incluyeron en el entregable corporativo**. Están escritos
en los [anexos A y B de `caso-de-negocio.md`](caso-de-negocio.md#anexos) y en
[AD-005](../decisiones/0005-estilo-de-arquitectura.md). Ahí empieza la Entrega 2.

## Lo que quedó abierto

No bloquea la nota de esta entrega; sí condiciona las siguientes.

| # | Qué | Quién | Por qué importa |
|---|---|---|---|
| 1 | **Reparto del cargo por servicio** (S1 / R1) — ¿se conserva completo o se comparte con el promotor? | Alejo | Es el inductor n.º 1 del caso. Cambia el equilibrio de 2.990 a 9.698 boletas |
| 2 | **Tratamiento de IVA** del cargo, la reventa y la pasarela (S7 / R1) | Contador tributarista | Mueve el equilibrio hasta 4.268 boletas |
| 3 | **Los nueve umbrales de [`atributos-de-calidad.md`](atributos-de-calidad.md)** están escritos y con número, pero no quedó registro de que el equipo los ratificara | los tres | **Sin ellos la Entrega 2 no tiene contra qué evaluar la arquitectura.** Es lo más urgente |
| 4 | Nadie abrió `canvas-ticketright.xlsx` en Excel para confirmar que el texto cabe en las celdas combinadas | Alejo | Se entregó sin esa verificación |
| 5 | Disponibilidad de dominio y marca de «TicketRight» | — | `PENDIENTE` desde la idea original |

## Referencias del curso

- **Lámina 55** — los seis pasos para definir una solución alineada al negocio. Los cuatro
  primeros son los componentes 1, 2, 3 y 5 de la rúbrica; los pasos 5 y 6 son los
  [anexos](caso-de-negocio.md#anexos) y el arranque de la Entrega 2.
- **Lámina 56** — los tips: específico y concreto · valor para el negocio · **datos y
  supuestos validados** · impacto a corto y largo plazo.
- **Láminas 49 a 51** — OKR: qué es un Objective, qué es un Key Result, y por qué 0.7 es la
  zona de éxito.
- **Láminas 53 y 54** — los dos casos del profesor, que calibran el nivel de detalle
  esperado. Ver [`../../curso/clase-01-02.md`](../../curso/clase-01-02.md#dos-casos-de-ejemplo-del-profesor).
