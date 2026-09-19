# ADP-005 — Despliegue multi-zona con escalado programado y reactivo

**Fecha:** 2026-09-14 · **Estado:** 🟣 Antecedente consolidado en
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md)
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** despliegue

> **Decisión en palabras simples:** la capacidad se prepara antes de abrir la venta, se
> distribuye para que la caída de una zona no detenga el sistema y se ajusta durante el pico
> según el trabajo pendiente.

> **Nota de vigencia:** AD-006 añade el perfil cotidiano, en el que la fila opera en paso
> directo y la capacidad Space-Based vuelve al mínimo.

## 1. Decisión arquitectónica

Se propone desplegar los servicios en contenedores sobre un orquestador, distribuidos al
menos entre dos **zonas de disponibilidad** y con dos mecanismos complementarios de
escalado:

1. **Escalado programado:** antes de la hora de apertura se aumentan réplicas de gateway,
   sala de espera, consulta y workers; se verifica que estén listas antes de admitir fans.
2. **Escalado reactivo:** durante la venta, un escalador basado en eventos ajusta workers
   según retraso de consumidores y tamaño de cola. CPU, memoria y latencia actúan como
   señales adicionales y límites de seguridad.

El núcleo transaccional, PostgreSQL, Redis y el log mantendrán capacidad base replicada. La
zona Space-Based de Redis y workers podrá escalar horizontalmente, pero PostgreSQL no se
escalará con la misma regla que la sala de espera. Los grupos de admisión, checkout y
procesamiento asíncrono tendrán límites de recursos separados para que la saturación de uno
no consuma la capacidad de los demás; esta es la táctica de aislamiento de fallos que
protege A-6.

La implementación candidata de producción es AWS: CloudFront y WAF en el borde; API Gateway
o Kong; EKS para contenedores; KEDA para métricas de Kafka; servicio administrado de Kafka;
Redis; Aurora PostgreSQL Multi-AZ; OpenSearch y SES. La demostración podrá ejecutarse en
Kubernetes local, como autorizó el profesor.

“Multi-zona” en este ADR significa redundancia entre zonas de disponibilidad del proveedor,
no las seis zonas funcionales de ADP-001. La arquitectura de referencia mostrará
contenedores, balanceo, réplicas y almacenes; los nombres AWS solo aparecerán en la
arquitectura de implementación.

## 2. Identificador único

ADP-005

## 3. Problema o asunto

El pico llega más rápido que el tiempo necesario para iniciar pods. El autoescalado basado
solo en CPU empieza después de que el tráfico ya afecta al usuario. Mantener todo al máximo
evita ese retraso, pero cobra capacidad ociosa durante la mayor parte del mes.

La hora de apertura es conocida, por lo que TicketRight puede prepararse. Sin embargo, una
configuración incorrecta, un cambio de horario o falta de capacidad del proveedor pueden
dejar la venta fría. La arquitectura necesita un mecanismo principal y un respaldo.

## 4. Supuestos

- `[S]` La carga objetivo es 30.000 usuarios en 60 segundos contra 5.000 boletas.
- `[S]` Una instancia atiende 500 usuarios concurrentes y la capacidad de pico requiere 60
  instancias durante tres horas. Debe medirse.
- `[V]` El cálculo existente usa la tarifa de AWS Fargate consultada el 9 de septiembre de
  2026 y estima cerca de COP $9 de cómputo por boleta bajo sus supuestos. Fuente:
  [`canvas.md`, dato 6](../01-caso-de-negocio/canvas.md#dato-6--precio-de-cómputo-y-qué-sale-de-él).
- `[S]` EKS, Kafka administrado, Redis Multi-AZ y Aurora cumplen A-7 en conjunto. El repo no
  contiene ese costo total; debe calcularse antes de aceptar el ADR.
- `[V]` El escalador Kafka de KEDA usa el retraso del grupo consumidor y limita por defecto
  las réplicas según las particiones disponibles. Fuente:
  [documentación oficial de KEDA](https://keda.sh/docs/latest/scalers/apache-kafka/).
- `[V]` La Entrega 3 puede ejecutarse localmente y explicar el destino en nube. Fuente:
  [transcripción, §16](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación).

## 5. Alternativas

| # | Alternativa | A favor | En contra |
|---|---|---|---|
| 1 | **Capacidad fija al máximo** | Ningún arranque frío y operación predecible | Costo ocioso alto y mala alineación con A-7 |
| 2 | **Autoescalado por CPU y memoria** | Es estándar y simple de configurar | Reacciona tarde y no observa directamente el trabajo pendiente en el stream |
| 3 | **Escalado programado más KEDA por retraso de consumidores** | Llega preparado y se adapta a variaciones durante la venta | Requiere calendario correcto, métricas confiables, límites y pruebas de precalentamiento |
| 4 | **Serverless para los componentes de pico** | Escala por solicitud y reduce capacidad base | Introduce otro modelo operativo, límites del proveedor y posible latencia de arranque en el instante crítico |
| 5 | **Plataforma administrada de contenedores sin Kubernetes** | Menor carga operativa, mantiene contenedores y puede programar capacidad | Menor portabilidad de manifiestos y ecosistema de escaladores; requiere verificar cómo escala por retraso del stream |

## 6. Decisión

Se propone la **alternativa 3**: Kubernetes multi-zona, precalentamiento programado y KEDA
como respaldo reactivo. KEDA es un mecanismo basado en eventos; la parte predictiva proviene
del calendario de venta y del precalentamiento, no de KEDA.

EKS es la implementación candidata, no una decisión aceptada. Antes de adoptarlo se debe
comparar con una plataforma administrada de contenedores más simple, porque el equipo tiene
tres personas y el material de clase advierte que microservicios compran escalabilidad y
despliegue independiente a cambio de costo y complejidad.

## 7. Justificación

| Criterio | Respuesta de la alternativa elegida |
|---|---|
| **A-9 · disponibilidad** | Los pods y dependencias se verifican antes de abrir la venta |
| **A-7 · costo** | La capacidad masiva se mantiene solo durante la ventana y se limita por presupuesto |
| **A-6 · prioridad** | Workers de pago y emisión tienen grupos, mínimos y límites distintos de catálogo y fila |
| **Recuperación** | El retraso del consumidor permite escalar después de una caída sin perder eventos |
| **Aislamiento de fallos** | Réplicas multi-zona y presupuestos de recursos separados evitan que una falla única o la saturación de catálogo consuma checkout |

**Qué se sacrifica:** configuración y operación. EKS, KEDA y servicios stateful administrados
pueden exceder la capacidad del equipo o el costo por boleta. El precalentamiento también
paga recursos antes de vender.

## 8. Implicaciones

- Cada grupo de trabajo tendrá mínimos, máximos, señal de escalado y prioridad declarados.
- La zona Space-Based tendrá particionamiento, réplicas y límites propios; aumentar workers
  por encima del número de particiones útiles no contará como escalado efectivo.
- Las réplicas de un mismo servicio se distribuirán entre zonas y dominios de fallo; ningún
  componente crítico dependerá de una sola instancia.
- La venta no abrirá si capacidad, PostgreSQL, Redis o log no pasan la comprobación previa.
- Se alertará si a T−N minutos no están listas las réplicas requeridas.
- KEDA observará retraso por grupo de consumidores; un millón de personas en la fila no
  implica escalar sin límite los workers de pago.
- El escalado tendrá un techo para proteger A-7 y la base de datos.
- Se ejecutarán pruebas normal, pico, estrés, cambio de horario, pérdida de nodo y falta de
  capacidad del proveedor.
- La selección de lenguajes queda fuera de este ADR. Se preferirá un lenguaje principal
  conocido por el equipo; Go, Rust, Java o TypeScript requieren perfilamiento y una razón
  verificable antes de introducir poliglotismo.
- **Costo de reversión:** medio entre orquestadores compatibles con contenedores; alto si se
  usan extensiones propietarias en cada servicio.
- **Revisar si:** el costo total no cumple A-7, el precalentamiento no cumple A-9 o una
  plataforma más administrada reduce riesgo sin perder control de la política de fila.

---

**Fuentes:** [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[`canvas.md`, costo del pico](../01-caso-de-negocio/canvas.md#dato-6--precio-de-cómputo-y-qué-sale-de-él) ·
[escalador Kafka de KEDA](https://keda.sh/docs/latest/scalers/apache-kafka/) ·
[microservicios](../../curso/clase-03-04.md#13-estilo-microservicios) ·
[comparación de costo, escalabilidad y simplicidad](../../curso/clase-03-04.md#15-resumen-comparativo-de-estilos) ·
[referencia frente a implementación](../../curso/clase-03-04-transcripcion.md#8-arquitectura-de-referencia-vs-arquitectura-de-implementación) ·
[implementación local permitida](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación).
