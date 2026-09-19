# Syllabus, evaluación y fechas

**Curso:** Arquitecturas Avanzadas de Software · **Universidad EAFIT** · Septiembre 2026
**Profesor:** José Daniel Medina Solano — consultor, líder de arquitectura y mentor

> Fuente: lámina 5 de `material/2026-09-05-clase-01-02.pdf`. Contenido completo de las
> clases en [`clase-01-02.md`](clase-01-02.md).

## Modelo de evaluación

| | Componente | Peso | Fecha |
|---|---|---|---|
| | **Proyecto integrador** | **80%** | |
| 1 | Definición completa de un caso de negocio | 20% | Sábado 12 de septiembre |
| 2 | Modelamiento de una solución basada en arquitecturas modernas | 30% | Sábado 19 de septiembre |
| 3 | Implementación – Sustentación – Simulación – Defensa | 30% | Sábado 26 de septiembre |
| 4 | Ensayos | 10% | Viernes 11 y 18 de septiembre — **fuera del alcance de este repositorio** |
| 5 | Extras | 10% | Todo el tiempo |

## Objetivos del curso

1. Conocer los conceptos fundamentales de las arquitecturas avanzadas de software.
2. Reconocer la importancia del diseño de la arquitectura como estrategia de alto nivel.
3. Aplicar patrones de diseño y frameworks para el desarrollo de las arquitecturas.
4. Identificar cómo reducir la deuda técnica de los proyectos de software.
5. Concebir, diseñar y desarrollar arquitecturas avanzadas de software.

**Metodología:** ejemplos de la vida real; implementación basada en casos, lecturas y
*hands on*. **Fuentes:** documentación de AWS, Azure y GCP; O'Reilly; assets públicos.

## Calendario — septiembre 2026

```
Lun  Mar  Mié  Jue  Vie  Sáb  Dom
                       05*  06
07*  08   09   10   11   12■  13
14   15   16   17   18   19■  20
21   22   23   24   25   26■  27
```

`*` clase / reunión · `■` entrega del proyecto

| Fecha | Qué pasa |
|---|---|
| Sáb 5 sep | Clases 1 y 2 — Fundamentos de arquitectura |
| **Lun 7 sep** | **Reunión de equipo: elección de la idea de negocio** |
| **Sáb 12 sep** | **Entrega 1 — Caso de negocio** (20%) |
| **Sáb 19 sep** | **Entrega 2 — Modelamiento de la solución** (30%) |
| **Sáb 26 sep** | **Entrega 3 — Implementación, sustentación y defensa** (30%) |

## Cómo leemos esto

**El proyecto es uno solo y se acumula.** Las tres entregas son fases del mismo trabajo:
el caso de negocio define el problema, el modelamiento propone la arquitectura, la tercera
la implementa y la defiende. Un caso de negocio flojo en la semana 1 se paga en las
semanas 2 y 3, porque no hay atributos de calidad de dónde derivar la arquitectura. La
Entrega 1 merece más esfuerzo del que su 20% sugiere.

**La Entrega 1 ya incluye arquitectura.** La lámina 55 pide identificar el estilo de
arquitectura y una estrategia de implementación, además del modelo de negocio y 3 OKR. No
es solo el Canvas.

**La defensa pesa tanto como el código.** La Entrega 3 dice «Implementación – Sustentación
– Simulación – Defensa». El material con el que se defiende son los ADRs de
`proyecto/decisiones/`, que se empiezan a acumular desde ahora.

**El curso dura cuatro sábados y las entregas caen en los tres últimos.** La semana 1 es
la única con holgura, y se está gastando en decidir la idea. Cada día de indecisión sale
del tiempo del caso de negocio.
