# Entrega 3 — Implementación · Sustentación · Simulación · Defensa

**Peso:** 30% · **Fecha:** sábado 26 de septiembre de 2026 · **Estado:** 🟡 Activa
**Rúbrica:** [`rubrica.md`](rubrica.md) — criterios, pesos, evidencias y fórmula
**Material de clase:** [Clases 5 y 6](../../curso/clase-05-06.md#diapositiva-46--rúbrica-entregable-3-proyecto-integrador)

> *«De la arquitectura al valor real: construimos, medimos, probamos y aprendemos.»*

## La rúbrica, en una tabla

| # | Criterio | Peso | Lo que exige | Nuestro estado |
|---|---|---|---|---|
| 1 | **Aplicación funcionando** | 40% | Operativa, desplegada y con evidencias (video/demo, accesos) | 🟡 Dominio y SAGA en verde; faltan adaptadores reales y despliegue |
| 2 | **Observabilidad** | 20% | 3 métricas de negocio y 3 técnicas reales, con tableros y alertas | 🟡 Diseño completo; falta instrumentar y recolectar |
| 3 | **Simulación de fallos** | 30% | 4 escenarios de tipos diferentes, analizados y documentados | 🟢 Los 4 ejecutados y aprobados; bitácora en [`bitacora-de-fallos.md`](bitacora-de-fallos.md) |
| 4 | **Patrones utilizados** | 10% | Identificados, justificados y relacionados con atributos | ✅ [`patrones.md`](patrones.md) mapea patrón → código → atributo |
| 5 | **Autoevaluación** | +10% | Reflexión crítica con logros, dificultades y evolución | ⚪ Por escribir al cierre |
| 6 | **Coherencia** | hasta -10% | Consistencia con ADR, supuestos, alcance y entregables del 2 | 🟢 Los 21 casos ejecutados y los diagramas reconciliados; mantener al día |

## 1. Aplicación funcionando — 40%

**Ya existe:** los cuatro paquetes del dominio con los 21 casos del
[plan de pruebas](../02-modelamiento/plan-de-pruebas.md) en verde y CI en GitHub Actions; el
prototipo de 16 pantallas; la topología de producción documentada en la
[arquitectura de implementación](../02-modelamiento/arquitectura-de-implementacion.md).

**Falta:** Redis y Kafka reales (el outbox ya escribe en PostgreSQL), las rutas restantes
—fila, reventa y devolución—, el despliegue en el clúster y el video demo.

**Incremento 1 entregado (20 de septiembre de 2026):** la composición vive en
[`apps/ventas`](../../../apps/ventas/README.md) —Fastify + PostgreSQL, repositorios, outbox y
pasarela simulada—. Verificado en local: compra completa con dos boletas, webhook repetido sin
duplicar y rechazo con el inventario liberado (`npm run e2e -w @ticketright/ventas`).

**Ambiente decidido:** **local con k3d o minikube** — el mínimo es el ambiente local; si el
tiempo alcanza, se evalúa un despliegue en AWS siguiendo la
[arquitectura de implementación](../02-modelamiento/arquitectura-de-implementacion.md). El
profesor aceptó Kubernetes local o un ambiente simulado
([transcripción §16](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación)).
`PENDIENTE: elegir k3d o minikube; de eso depende el mecanismo de los 4 fallos (Chaos Mesh
sobre el clúster local o su equivalente).`

**Herramientas compartidas por Quinnie, por evaluar:**

- **k6** para las corridas de la [volumetría](../02-modelamiento/volumetria.md). Se propuso
  `ramping-vus`; al implementarlo se usó `constant-arrival-rate`, porque la carga del diseño
  es de llegadas (30.000 fans en 60 s) y no de usuarios que esperan su turno para pedir. El
  arnés, los resultados y el porqué están en [`pruebas-de-carga.md`](pruebas-de-carga.md).
- **Tailscale** (plan gratuito para ambientes compartidos) para dar acceso al ambiente local
  al equipo o al profesor y sostener las evidencias de «accesos» de la rúbrica, si no hay
  despliegue público.

**Escenario de la demo:** comprar en la ventana de alta demanda — turno → reserva → pago con
pasarela lenta/repetida → emisión → compensación, con los mismos dobles convertidos en
adaptadores simulados.

## 2. Observabilidad — 20%

**Ya existe:** el [diseño completo](../02-modelamiento/observabilidad.md) con la plataforma
Grafana + OpenTelemetry + Prometheus + Loki + Tempo, catálogo de métricas, tableros y alertas.

**Falta:** instrumentar la aplicación y demostrar datos reales. Las **seis métricas de la
entrega** salen del catálogo ya diseñado:

| Tipo | Métrica (variable) | Qué demuestra | Atributo |
|---|---|---|---|
| Negocio | `ticketright_sales_amount_total{currency}` | Dinero confirmado, no intenciones | OKR-3 · A-1 |
| Negocio | `ticketright_open_discrepancies` + `ticketright_oldest_discrepancy_age_seconds` | No hay dinero sin boleta; la conciliación cierra en ≤ 15 min | A-1 |
| Negocio | `ticketright_oversell_total` y `ticketright_invalid_ownership_total` | Aforo y titularidad íntegros, también bajo fallo | A-2 · A-3 |
| Técnica | `ticketright_reservation_duration_seconds` (P95) y errores de reserva | El inventario responde a tiempo | A-10 |
| Técnica | CPU, memoria, reinicios y réplicas por servicio | Saturación y capacidad real del ambiente | A-6 · A-9 |
| Técnica | *Lag* de Kafka, reintentos/DLQ y conexiones/bloqueos de PostgreSQL | La mensajería y la base sostienen la SAGA | A-1 · A-6 |

**Evidencias:** tablero en vivo (captura y video), una alerta disparada, una traza completa
por `correlation_id` y logs correlacionados.

## 3. Simulación y análisis de fallos — 30%

**Ya existe:** el [catálogo de fallos](../02-modelamiento/inyeccion-de-fallos.md) con cinco
experimentos (IF-01 a IF-05), sus hipótesis, criterios de aborto, reversión y evidencia.

**Los cuatro de la entrega** (tipos diferentes, como pide la rúbrica):

| # | Experimento | Tipo de fallo | Qué se observa |
|---|---|---|---|
| IF-01 | La pasarela responde tarde y repite la confirmación | Tercero / negocio | Una sola boleta, una sola transición, conciliación ≤ 15 min |
| IF-02 | Reinicio del coordinador de pago (PodChaos) | Proceso | Reanudación sin perder el estado ni duplicar efectos |
| IF-03 | PostgreSQL no disponible para nuevas reservas (NetworkChaos) | Red / datos | Cero confirmaciones sin transacción durable; admisión regulada |
| IF-05 | Saturación de CPU en admisión (StressChaos) | Recursos | Degradación controlada; pagos en curso conservan su tasa |

IF-04 (pérdida de la proyección de Redis) queda como respaldo o quinto experimento.

**Hecho:** los cuatro se ejecutaron sobre el ambiente local con el arnés de
[`chaos/`](../../../chaos/) (mecanismos equivalentes a Chaos Mesh en `docker compose`) y
quedaron **aprobados**, midiendo con la observabilidad instrumentada. La
[bitácora de fallos](bitacora-de-fallos.md) recoge cada uno con el
[ciclo de experimento](../02-modelamiento/inyeccion-de-fallos.md#ciclo-de-un-experimento):
estado estable, perturbación, resultado, evidencia y aprendizaje. IF-03 encontró y corrigió
una debilidad real de resiliencia. `PENDIENTE: capturas del tablero durante cada fallo para el video.`

## 4. Patrones utilizados — 10%

[`patrones.md`](patrones.md) relaciona cada patrón con su archivo de código, la decisión que
lo justifica y el atributo de calidad que sostiene. Incluye los patrones de la clase 5-6 que
sí aplican: idempotencia, *back pressure* y *circuit breaker*.

`PENDIENTE: revisarlo contra la demo final y añadir las capturas de código.`

## 5. Autoevaluación — +10%

Se escribe al cierre, con la evidencia en la mano: qué se logró, qué no, qué deuda técnica se
asumió de forma deliberada y cuál es el plan para pagarla (insumo: diapositivas 30 a 32 de la
[clase 5-6](../../curso/clase-05-06.md) sobre documentación y deuda técnica).

## 6. Coherencia — hasta -10%

La trazabilidad decisión → implementación → evidencia está en
[`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md), con el mapeo AWS → equivalente
local y lo que quedó fuera de alcance.

Checklist antes de entregar:

- [x] Cada decisión visible en la demo se rastrea hasta un ADR y un atributo de calidad ([`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md))
- [ ] Los 21 casos del plan de pruebas corren en CI y el reporte de cobertura está anexo
- [ ] Los diagramas y el modelo viven en las versiones regeneradas ([AD-008](../decisiones/0008-boleta-en-derecho-de-asistencia.md))
- [ ] La observabilidad ejecutada corresponde a las métricas diseñadas
- [ ] El prototipo desplegado corresponde al último estado del repositorio
- [ ] [`ESTADO.md`](../../../ESTADO.md) y la wiki reflejan el estado real, sin pendientes vencidos
- [ ] No hay credenciales en el repositorio

## Evidencias que hay que producir

Cómo sacarlas paso a paso en Codespaces: [`guia-codespaces.md`](guia-codespaces.md).

| Evidencia | Criterio | Herramienta o formato |
|---|---|---|
| Video demo de la aplicación | 1 | Guion: compra completa + un fallo en vivo |
| Ejemplos de uso y accesos | 1 | URLs, capturas, README de arranque; Tailscale si el ambiente es local |
| Tablero de observabilidad | 2 | Grafana en vivo + capturas + video |
| Alerta disparada y traza completa | 2 | Captura y `correlation_id` de prueba |
| Bitácora de los 4 fallos | 3 | Un documento por experimento |
| Catálogo de patrones con evidencia | 4 | [`patrones.md`](patrones.md) + código |
| Autoevaluación | +10 | Documento corto y honesto |
| Reporte de pruebas y cobertura | 6 | Salida de `npm test` y `npm run test:coverage` |

## Plan de trabajo hasta el 26 de septiembre

| Día | Foco |
|---|---|
| Dom 20 – Lun 21 | Clúster local (k3d o minikube); adaptadores HTTP, PostgreSQL, outbox y pasarela simulada; app corriendo |
| Mar 22 | Instrumentación OTel, las 6 métricas, tablero de Grafana y alertas |
| Mié 23 | Los 4 fallos, con evidencia y bitácora |
| Jue 24 | [`patrones.md`](patrones.md) final, video demo y guion |
| Vie 25 | Autoevaluación, checklist de coherencia y ensayo de la defensa |
| Sáb 26 | Entrega y sustentación |

## Preguntas para el profesor

- `PENDIENTE: la diapositiva 46 trae una nota manuscrita «¿Máximo?». ¿La nota del entregable
  tiene tope?`
- `PENDIENTE: formato y duración del video demo.`
- `PENDIENTE: ¿basta un ambiente local con la demo en video, o espera accesos a un despliegue?`

## Dónde vive el código

El código está en `packages/` de este repositorio —un paquete por contexto acotado, hexagonal
([AD-007](../decisiones/0007-stack-de-implementacion.md))—. El detalle de qué está implementado
y qué falta está en [`../../../ESTADO.md`](../../../ESTADO.md).

## La defensa es la mitad del trabajo

El nombre de la entrega pone «Sustentación» y «Defensa» al mismo nivel que «Implementación».
El material con el que se defiende es [`../decisiones/`](../decisiones/README.md).

**Regla práctica: para cada decisión visible en la demo, poder responder qué atributo de
calidad la justifica y qué se cedió a cambio.**

Preguntas que conviene tener respondidas de antemano:

- ¿Por qué esta arquitectura y no la obvia más simple?
- ¿Qué se cedió en cada decisión? ¿Cuál fue el costo de oportunidad?
- ¿Qué pasa si el volumen se multiplica por diez?
- ¿Qué falla primero y cómo se enteran?
- ¿Se cumplieron los OKR del caso de negocio?
- ¿Qué decisión cara volverían barata, y cómo?
