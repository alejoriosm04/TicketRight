# Decisiones de arquitectura (ADR)

Esta carpeta es la **fuente oficial** de decisiones de TicketRight. Cada ADR cuenta qué
problema obligó a decidir, cuáles caminos viables se evaluaron, por qué se escogió uno y qué
precio acepta el equipo. La carpeta [`decisiones-propuesta-tecnica/`](../decisiones-propuesta-tecnica/README.md)
queda como antecedente de exploración; sus ADP no se suman al entregable ni sustituyen lo
registrado aquí.

La arquitectura resultante se resume como:

> **Arquitectura híbrida Event-Driven con Space-Based bajo demanda, servicios de dominio de
> grano grueso, núcleo transaccional PostgreSQL y separación CQRS.**

Space-Based absorbe fila, sesiones y consultas masivas en memoria **solo cuando el perfil de
demanda lo necesita**. En la cotidianidad, la admisión funciona en paso directo y esa zona
permanece en capacidad mínima. PostgreSQL conserva siempre la autoridad sobre aforo y
titularidad; una SAGA y eventos durables completan pago, emisión y conciliación en ambos
perfiles. Esta frontera se explica en [AD-005](0005-estilo-de-arquitectura.md).

## Perfiles de operación

La arquitectura lógica no cambia; cambia la capacidad y la política de admisión:

| Perfil | Comportamiento |
|---|---|
| **Cotidiano** | Borde → token inmediato → checkout → PostgreSQL → SAGA. Redis y workers permanecen en mínimo; no hay fila visible |
| **Preparación** | Se carga la política del evento y se precalientan Redis, réplicas, conexiones, particiones y consumidores |
| **Pico** | Borde → sala Space-Based → token por turno → checkout. KEDA escala por trabajo pendiente y la válvula protege al núcleo |
| **Recuperación** | Se detiene el ingreso, se terminan pagos/emisiones y se drenan eventos antes de volver al mínimo |

[AD-006](0006-escalado-programado-por-ventana-de-venta.md) define las transiciones y el modo
de emergencia para un pico no previsto. Seguridad, autoridad del inventario y semántica de
la SAGA no se relajan en ningún perfil.

## Formato: los ocho elementos del profesor

Los ADR siguen la plantilla de la lámina 21 y del Excel entregado por el profesor. Se
conservan ocho secciones aunque otras plantillas, como la de Michael Nygard, agrupen algunos
campos. Así se cumple el formato del curso y se cubren contexto, decisión, alternativas y
consecuencias exigidos por la rúbrica.

```markdown
# AD-NNN — <título corto y descriptivo>

**Fecha:** AAAA-MM-DD · **Estado:** Propuesto | Aceptado | Reemplazado por AD-NNN
**Participan:** <personas que toman la decisión>
**Dimensión:** estructura | datos | integración | despliegue | transversal
**Relacionados:** <otros ADR condicionados>

## 1. Decisión arquitectónica
Declaración clara de la decisión y de sus fronteras.

## 2. Identificador único
AD-NNN

## 3. Problema o asunto
Problema, contexto, restricciones y atributos de calidad en tensión.

## 4. Supuestos
Cada premisa marcada `[V]`, `[S]` o `PENDIENTE`.

## 5. Alternativas
Opciones viables comparadas con los mismos criterios, incluida la opción más simple.

## 6. Decisión
Alternativa seleccionada, escrita de forma inequívoca.

## 7. Justificación
Trazabilidad hasta atributos de calidad y negocio; explica también qué se sacrifica.

## 8. Implicaciones
Consecuencias positivas y negativas, deuda, riesgos, costo de reversión, pruebas y
condiciones de revisión.
```

El Excel separa `Problem/Issue` y `Context`; al exportar se dividirá la sección 3 en esos dos
campos. La correspondencia completa está en el
[README de la Entrega 2](../02-modelamiento/README.md#el-adr-es-el-25--y-tiene-formato-propio).

## Los cinco ADR técnicos del entregable

El profesor pidió **máximo cinco decisiones importantes**
([transcripción, §4](../../curso/clase-03-04-transcripcion.md#4-cuántos-adr-se-esperan)).
AD-001 registra la selección previa de la idea de negocio y **no cuenta** como decisión
arquitectónica. Los cinco evaluables son AD-002 a AD-006.

| ID | Decisión | Dimensión principal | Estado |
|---|---|---|---|
| [AD-002](0002-mensajeria-del-bus-de-eventos.md) | SAGA orquestada con eventos durables para pago y emisión | Integración | ✅ Aceptado el 16 sep 2026 |
| [AD-003](0003-consistencia-por-tipo-de-inventario.md) | PostgreSQL como autoridad del inventario y CQRS para consultas | Datos | ✅ Aceptado el 16 sep 2026 |
| [AD-004](0004-datos-personales-almacenamiento-y-acceso.md) | Seguridad por capas, admisión firmada e identidad aislada | Transversal | ✅ Aceptado el 16 sep 2026 |
| [AD-005](0005-estilo-de-arquitectura.md) | Arquitectura híbrida Event-Driven con Space-Based bajo demanda | Estructura | ✅ Aceptado el 16 sep 2026 |
| [AD-006](0006-escalado-programado-por-ventana-de-venta.md) | Activación bajo demanda de la sala Space-Based y escalado elástico | Despliegue | ✅ Aceptado el 16 sep 2026 |
| [AD-007](0007-stack-de-implementacion.md) | Stack de implementación: TypeScript sobre Node.js | Implementación | 🟣 Propuesto el 19 sep 2026. No cuenta entre las cinco arquitectónicas |

[AD-001](0001-idea-de-negocio.md) permanece **Aceptada** como antecedente: explica por qué el
equipo eligió una boletería de alta demanda, no cómo se estructura el software.
[AD-007](0007-stack-de-implementacion.md) registra la decisión de lenguaje y herramientas que
el [plan de pruebas](../02-modelamiento/plan-de-pruebas.md#automatización) dejó pendiente para
la Entrega 3; no compite con las cinco decisiones arquitectónicas y espera ratificación del
equipo.

## Cómo se complementan sin duplicarse

| Pregunta | ADR responsable | Respuesta corta |
|---|---|---|
| ¿Cómo se divide el sistema? | AD-005 | Event-Driven y núcleo transaccional permanentes; Space-Based se activa para el camino caliente cuando la demanda lo exige |
| ¿Quién decide si una silla o cupo se puede vender? | AD-003 | Solo PostgreSQL; Redis y OpenSearch son proyecciones reconstruibles |
| ¿Cómo sobrevive la compra a una pasarela lenta o duplicada? | AD-002 | SAGA orquestada, outbox, Kafka, idempotencia y compensaciones explícitas |
| ¿Cómo se evita que la multitud derribe el núcleo sin pagar esa capacidad a diario? | AD-006 | Paso directo cotidiano; sala en memoria, back pressure, precalentamiento y KEDA durante el pico |
| ¿Cómo se filtran bots y se protege al comprador? | AD-004 | CDN/WAF/gateway, límites por múltiples señales, JWT de admisión e identidad aislada |

## Trazabilidad de atributos de calidad

Los umbrales siguen en estado `[S]` hasta que el equipo los ratifique. El detalle está en
[`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md).

| Atributo | Decisiones que lo sostienen | Mecanismo principal |
|---|---|---|
| A-1 · dinero–boleta | AD-002, AD-003, AD-005 | Estado durable de SAGA, idempotencia y conciliación ≤ 15 min |
| A-2 · aforo | AD-003, AD-005 | Transacciones y operaciones atómicas en PostgreSQL |
| A-3 · unicidad | AD-003, AD-005 | Restricción única, transición versionada y única cadena de titularidad |
| A-4 · equidad de fila | AD-004, AD-006 | Secuencia durable, estado distribuido y token de admisión firmado |
| A-5 · retención ≤ 10 min | AD-002, AD-003 | `expires_at` durable y worker idempotente de liberación |
| A-6 · degradación con prioridad | AD-002, AD-005, AD-006 | Aislamiento de recursos, back pressure y eventos asíncronos |
| A-7 · costo ≤ COP $150 | AD-004, AD-005, AD-006 | Caché en el borde y capacidad alta solo durante la ventana |
| A-8 · reconstrucción 24 meses | AD-002, AD-003, AD-006 | Eventos correlacionados, estados durables y archivo de auditoría |
| A-9 · disponibilidad ≥ 99,9% | AD-004, AD-005, AD-006 | Borde, réplicas multi-zona y precalentamiento |
| A-10 · rendimiento de fila y reserva | AD-003, AD-006 | Proyecciones Redis/OpenSearch fuera del núcleo; válvula de admisión que acota el trabajo que llega a PostgreSQL |
| A-11 · seguridad y privacidad | AD-004 | Validación de token en gateway y núcleo; datos personales cifrados y aislados con acceso auditado |
| A-12 · modificabilidad de políticas | AD-005 | «Política de venta modificable sin cambiar inventario ni pago»: la política vive en un módulo y configuración propios (AD-005, tabla de atributos). El [diagrama de clases](../02-modelamiento/diagrama-de-clases.md#capas-y-patrones) da el mecanismo: las reglas viven en el dominio y el orquestador solo depende de puertos, así que cambiar una política no toca inventario ni pasarela. Ampliar AD-006 con una frase explícita queda opcional |

## Tecnologías: decisión frente a implementación

Los ADR nombran tecnologías para mostrar que la propuesta es realizable, pero conservan la
distinción explicada por el profesor entre arquitectura de referencia e implementación
([transcripción, §8](../../curso/clase-03-04-transcripcion.md#8-arquitectura-de-referencia-vs-arquitectura-de-implementación)):

| Capacidad de referencia | Implementación candidata | Decisión que la justifica |
|---|---|---|
| Autoridad transaccional | PostgreSQL / Aurora PostgreSQL Multi-AZ | AD-003 |
| Grilla y proyecciones en memoria | Redis Cluster administrado | AD-003, AD-006 |
| Búsqueda | OpenSearch, aplazable en el MVP | AD-003 |
| Eventos durables | Apache Kafka / Amazon MSK | AD-002 |
| Publicación confiable | Outbox PostgreSQL + relay o CDC | AD-002 |
| Borde | CloudFront, AWS WAF/Bot Control, API Gateway o Kong | AD-004 |
| Identidad y llaves | Proveedor OIDC, KMS y gestor de secretos | AD-004 |
| Contenedores, perfiles y escalado | Kubernetes/EKS + KEDA | AD-006 |

Estas marcas no son una autorización automática de compra. Donde no existe costo verificado
se conserva `[S]` o `PENDIENTE`; la arquitectura de implementación debe comparar servicios
administrados con opciones más simples y comprobar A-7.

## Validaciones posteriores a la aceptación

El equipo aceptó los cinco ADR el 16 de septiembre de 2026. La aceptación registra la
decisión arquitectónica; no convierte los supuestos en datos verificados. Antes de cerrar la
implementación, el equipo debe:

1. ratificar los doce umbrales de calidad;
2. aprobar las compensaciones de la SAGA y la política de fila;
3. demostrar en una prueba de carga que PostgreSQL mantiene los invariantes bajo colisión;
4. demostrar la pérdida y reconstrucción de Redis, consumidores y proyecciones;
5. calcular el costo conjunto —no solo el cómputo— bajo la volumetría acordada;
6. validar la interpretación sobre datos personales con una persona competente;
7. probar las transiciones cotidiano → preparación → pico → recuperación y el modo de
   emergencia sin cambiar las garantías del checkout.

Un ADR no se borra al cambiar de opinión: se marca como reemplazado y se enlaza la nueva
decisión. La fecha, el estado y las condiciones de revisión permiten reevaluar sin inventar
después las razones originales.

---

**Fuentes de evaluación y método:** [rúbrica del ADR](../02-modelamiento/rubrica.md#2-adr--architectural-decision-record) ·
[formato y ejemplo de clase](../../curso/clase-03-04-transcripcion.md#5-plantilla-del-adr) ·
[fundamentos y trade-offs](../../curso/fundamentos-arquitectura.md) ·
[enunciado de Teams](../02-modelamiento/enunciado-teams.md).
