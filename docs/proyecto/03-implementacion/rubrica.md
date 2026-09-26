# Rúbrica del Entregable 3 — Proyecto Integrador

**De la arquitectura al valor real: construimos, medimos, probamos y aprendemos**

> El Entregable 3 evalúa una solución que funciona, se observa, resiste fallos, aplica
> patrones y es coherente con todo lo definido.

> Fuente: diapositiva 46 de [`clase-05-06.md`](../../curso/clase-05-06.md#diapositiva-46--rúbrica-entregable-3-proyecto-integrador)
> y el documento completo de la rúbrica publicado por el profesor. No se edita; el plan de
> trabajo está en el [README de la entrega](README.md).

## Pesos

| # | Criterio | Peso | Qué exige |
|---|---|---|---|
| 1 | **Aplicación funcionando** | **40%** | Funcionalidades principales operativas, despliegue en el entorno definido, experiencia de usuario estable y evidencias de ejecución (video/demo, accesos, ejemplos de uso) |
| 2 | **Observabilidad** | **20%** | **3 métricas de negocio y 3 métricas técnicas funcionando de forma real**, con definición, recolección, visualización en tiempo real, herramientas y evidencias (dashboards, logs, trazas, alertas) |
| 3 | **Simulación y análisis de fallos** | **30%** | **4 escenarios de fallo de tipos diferentes** ejecutados y analizados: comportamiento (métricas, recuperación, degradación), conclusiones, aprendizajes y evidencias (registros, capturas, dashboards) |
| 4 | **Patrones utilizados** | **10%** | Identificación y justificación de los patrones de diseño/arquitectura, su relación con los atributos de calidad y evidencia en la implementación y la documentación |
| 5 | **Autoevaluación** (adicional) | **+10%** | Reflexión crítica del equipo: logros, dificultades, mejoras y propuestas de evolución, coherentes con la evidencia |
| 6 | **Coherencia** (descuento) | **hasta -10%** | Consistencia con ADR, supuestos, alcance y entregables anteriores; entregables del 2 ejecutados y consistentes; documentación fiel al estado real |

## 1. Aplicación funcionando — 40%

La aplicación se ejecuta de forma correcta y cumple con los escenarios definidos.

**Se valora:**

- Funcionalidades principales operativas.
- Despliegue en el entorno definido.
- Experiencia de usuario estable.
- Evidencias de ejecución (video/demo, accesos, ejemplos de uso).

## 2. Observabilidad — 20%

3 métricas de negocio y 3 métricas técnicas funcionando de forma real.

**Se valora:**

- Definición y justificación de las métricas.
- Recolección y visualización en tiempo real.
- Uso de herramientas de observabilidad.
- Evidencias (dashboards, logs, trazas, alertas).

## 3. Simulación y análisis de fallos — 30%

Se simulan 4 fallos y se analiza el comportamiento de la aplicación.

**Se valora:**

- Ejecución de 4 escenarios de fallo (tipos diferentes).
- Análisis del comportamiento del sistema (métricas, recuperación, degradación, etc.).
- Conclusiones y aprendizajes.
- Evidencias (registros, capturas, dashboards).

## 4. Patrones utilizados — 10%

Explicación de los patrones de diseño/arquitectura utilizados en la solución.

**Se valora:**

- Identificación de patrones.
- Justificación de su uso.
- Relación con atributos de calidad (escalabilidad, resiliencia, mantenibilidad, etc.).
- Evidencias en la implementación y en la documentación.

## 5. Autoevaluación (valor adicional) — +10%

Reflexión crítica del equipo sobre el resultado, aprendizajes y oportunidades de mejora.

**Se valora:**

- Análisis honesto y fundamentado.
- Identificación de logros, dificultades y mejoras.
- Propuestas concretas de evolución.
- Coherencia con la evidencia del proyecto.

## 6. Coherencia (resta puntos) — Hasta -10%

El resultado debe ser coherente con las decisiones de arquitectura, los supuestos, el alcance
y los entregables anteriores.

**Se descuentan puntos si:**

- La solución implementada no es coherente con las decisiones de arquitectura, los supuestos
  o los ADR.
- Faltan entregables del Entregable 2 (por ejemplo, ejecución de pruebas unitarias,
  información de observabilidad, modelo de dominio, diagramas) o no son consistentes con la
  solución implementada.
- La documentación no refleja el estado real del proyecto.

## Evidencias de entrega

Código, despliegue, dashboards, registros, documentación, video demo, entre otras.

## Evaluación

Cada criterio se califica según los niveles de desempeño definidos en la rúbrica detallada.

**Resultado del entregable:** la calificación se calcula sobre 100 puntos, se aplica el
descuento por coherencia (si aplica) y luego se pondera al 30% del proyecto.

```
Nota Entregable 3 = ( Puntos base (0–100) + Puntos adicionales (0–10) − Puntos de descuento (0–10) ) × 30%
```

## Preguntas abiertas de la rúbrica

- La diapositiva trae una nota manuscrita «¿Máximo?» junto al título, sin más contexto.
- ~~Confirmar el formato y la duración esperados del video demo.~~ Sin respuesta; el video
  quedó listo el 25 de septiembre.

---

*Universidad EAFIT — Proyecto Integrador*
*«Conocimiento aplicado para un futuro posible.»*
