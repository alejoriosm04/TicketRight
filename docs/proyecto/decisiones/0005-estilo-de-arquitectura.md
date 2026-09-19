# AD-005 — Arquitectura híbrida con Space-Based bajo demanda y núcleo transaccional

**Fecha:** 2026-09-16 · **Estado:** ✅ Aceptado
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** estructura
**Relacionados:** [AD-002](0002-mensajeria-del-bus-de-eventos.md) ·
[AD-003](0003-consistencia-por-tipo-de-inventario.md) ·
[AD-004](0004-datos-personales-almacenamiento-y-acceso.md) ·
[AD-006](0006-escalado-programado-por-ventana-de-venta.md)

> **Decisión en palabras simples:** la parte que recibe a la multitud trabajará con estado
> distribuido en memoria; la parte que decide quién obtiene una boleta conservará una única
> verdad transaccional; y las tareas que pueden terminar después se conectarán mediante
> eventos durables.

## 1. Decisión arquitectónica

TicketRight adoptará una **arquitectura híbrida Event-Driven con una zona Space-Based
activada según el perfil de demanda**, organizada en servicios de dominio de grano grueso,
con un núcleo transaccional y separación CQRS entre comandos y consultas. No se aplicará un
único estilo a todo el sistema: cada estilo tendrá una frontera y una responsabilidad
explícitas.

1. **Zona Space-Based para el camino caliente.** La sala de espera, los tokens de admisión,
   las sesiones de venta y las vistas de disponibilidad aproximada se mantendrán en una
   grilla de datos distribuida en memoria. Unidades de procesamiento sin estado podrán
   multiplicarse alrededor de esa memoria para absorber el pico sin enviar cada lectura a
   la base transaccional.
2. **Núcleo transaccional para el inventario.** Un servicio modular de inventario y ventas,
   respaldado por PostgreSQL, será la única autoridad para reservar, liberar, vender y
   transferir una boleta. Redis nunca confirmará aforo ni titularidad.
3. **CQRS para separar presión de lectura y escritura.** Catálogo, búsqueda, mapa del recinto
   y disponibilidad visible consultarán proyecciones reconstruibles en Redis y OpenSearch.
   Los comandos críticos siempre volverán a validar el estado en PostgreSQL.
4. **Zona Event-Driven después de la reserva.** Pago, emisión, conciliación, notificaciones
   y actualización de proyecciones intercambiarán eventos durables. El flujo monetario se
   controlará con la SAGA de [AD-002](0002-mensajeria-del-bus-de-eventos.md); los efectos no
   críticos podrán reaccionar por coreografía.
5. **Servicios por capacidad de negocio, no por tabla.** Admisión, inventario/venta,
   identidad, emisión y notificaciones se separarán solo cuando necesiten escalar, desplegar
   o fallar de manera independiente. La administración de perfiles y reportería podrá
   permanecer como **monolito modular**, pues no comparte el patrón de carga del camino de
   compra.

### Una arquitectura lógica, cuatro perfiles operativos

No se construirán dos soluciones distintas. Los contratos, límites de dominio y fuentes de
verdad son los mismos; cambia la cantidad de capacidad activa y si la admisión necesita
formar una fila.

| Perfil | Ruta y capacidad | Qué permanece activo |
|---|---|---|
| **Cotidiano** | El control de admisión funciona en paso directo: valida y entrega el token sin hacer esperar. La zona Space-Based queda en capacidad mínima y Redis actúa como caché/sesión, no como una grilla sobredimensionada | Borde, identidad, núcleo PostgreSQL, outbox, SAGA, conciliación y auditoría. Los workers no críticos pueden bajar a cero o al mínimo seguro |
| **Preparación de venta masiva** | Antes de abrir se precalientan réplicas, conexiones, cachés, particiones y consumidores; se habilita la fila, pero todavía no se admite compra | Todos los componentes críticos y las comprobaciones de capacidad de AD-006 |
| **Pico** | La sala Space-Based retiene la multitud, calcula posiciones y libera usuarios al ritmo seguro del núcleo. KEDA ajusta workers por trabajo pendiente | Núcleo, SAGA y seguridad conservan capacidad reservada; catálogo y nuevos ingresos se degradan primero |
| **Recuperación** | Se cierra el ingreso masivo, se drenan colas, se reconstruyen proyecciones y se concilian discrepancias antes de reducir capacidad | Pago, emisión, conciliación y auditoría permanecen activos hasta dejar el trabajo pendiente en cero |

El perfil se seleccionará por evento. Una venta no marcada como masiva inicia en cotidiano;
una venta de alta demanda pasa a preparación según su calendario. Un pico inesperado puede
activar un modo de emergencia que cierre temporalmente nuevas admisiones mientras prepara la
fila. Volver al perfil cotidiano exige comprobar que no quedan pagos, emisiones o eventos
rezagados.

Esto significa que TicketRight es **híbrido por diseño**, pero no paga una operación
Space-Based completa todos los días. Un Redis pequeño usado como caché no convierte por sí
solo el perfil cotidiano en Space-Based; el estilo aparece plenamente cuando la grilla en
memoria y los workers paralelos sacan a la multitud del camino de PostgreSQL.

```text
Cotidiano: Fan → Borde → admisión directa ──────────→ Núcleo PostgreSQL → SAGA/Eventos
Pico:      Fan → Borde → zona Space-Based → token ─→ Núcleo PostgreSQL → SAGA/Eventos
                               └→ Redis/CQRS
```

En la arquitectura de referencia aparecerán estas responsabilidades sin marcas. En la
arquitectura de implementación se evaluarán PostgreSQL/Aurora, Redis Cluster, OpenSearch,
Apache Kafka administrado y contenedores en Kubernetes. Nombrar esas tecnologías aquí
explica cómo se materializa la decisión, pero no convierte el *stack* en la arquitectura,
distinción enfatizada en
[`fundamentos-arquitectura.md`](../../curso/fundamentos-arquitectura.md#1-qué-es-la-arquitectura).

## 2. Identificador único

AD-005

## 3. Problema o asunto

TicketRight combina tres fuerzas que se estorban entre sí. En la apertura llegan decenas de
miles de usuarios y consultas en segundos; al mismo tiempo, el aforo y la titularidad no
admiten aproximaciones; finalmente, el pago depende de una pasarela externa que puede
responder tarde, repetido o no responder. Una arquitectura que optimice solo una de esas
fuerzas deja expuestas las otras.

- **Consistencia:** deben existir cero boletas por encima del aforo y cero
  titulares válidos simultáneos sobre la misma boleta.
- **Pico y equidad:** el 100% de los turnos debe seguir la política y poder reconstruirse;
  la ventana de venta debe
  alcanzar al menos 99,9% de disponibilidad.
- **Fallo parcial y trazabilidad:** al menos 99% de los pagos iniciados debe terminar bajo
  saturación; el 100% de las ventas debe poder reconstruirse durante 24 meses y cualquier
  discrepancia entre dinero y boleta debe cerrarse automáticamente en máximo 15 minutos.
- **Costo:** la infraestructura no puede superar COP $150 por boleta vendida bajo la carga
  objetivo ni mantenerse dimensionada para el pico durante el resto del mes.
- **Rendimiento:** consultar la posición debe responder con P95 de máximo un segundo y
  confirmar o rechazar una reserva con P95 de máximo dos segundos; el error técnico debe
  permanecer por debajo del 1%.
- **Seguridad y privacidad:** ningún token inválido, vencido o repetido puede autorizar una
  operación; todos los datos sensibles y accesos privilegiados deben estar protegidos y
  auditados.
- **Modificabilidad:** cambiar una política de venta debe afectar como máximo un módulo y su
  configuración o pruebas, sin cambiar contratos de inventario y pago ni interrumpir una
  venta activa.
- **Capacidad del equipo:** una distribución extrema sería difícil de desarrollar, probar y
  operar para los tres participantes que toman estas decisiones.

Space-Based retira la base de datos del camino de las lecturas masivas; Event-Driven separa
procesos y contiene fallos; y la separación por capacidades permite escalar solo lo que lo
necesita. Estas decisiones reducen simplicidad y aumentan el costo operativo. Por eso se
aplican únicamente donde su beneficio supera ese costo.

## 4. Supuestos

- `[S]` La prueba de referencia tendrá 30.000 usuarios concurrentes en 60 segundos contra
  5.000 boletas. Con esa carga se comprobarán el costo máximo de COP $150 por boleta y los
  objetivos de rendimiento; debe ratificarse.
- `[S]` Las consultas de catálogo, mapas, posición y disponibilidad superarán ampliamente a
  los comandos de reserva y pago. `PENDIENTE: confirmar la proporción en la volumetría.`
- `[V]` El aforo autorizado no se puede exceder. Fuente:
  [`validaciones.md`](../01-caso-de-negocio/validaciones.md#aforo-y-evento-masivo).
- `[V]` La pasarela de pago y el control de acceso son dependencias externas. Fuente:
  [caso de negocio, §1.4](../01-caso-de-negocio/caso-de-negocio-corporativo.md#14-dependencias-principales).
- `[S]` El equipo puede operar cinco capacidades de dominio de grano grueso, pero no una
  colección de microservicios finos ni varias tecnologías equivalentes para el mismo fin.
- `[S]` La disponibilidad visible puede atrasarse unos segundos siempre que el comando de
  reserva sea definitivo y la interfaz lo explique.
- `[S]` La mayoría de los eventos podrá operar en perfil cotidiano sin fila. El promotor
  clasificará la demanda esperada y las métricas podrán activar el modo de emergencia.

## 5. Alternativas

Se comparan con los criterios comunes **consistencia del inventario, absorción del pico,
aislamiento de fallos, costo y operabilidad**. La primera conserva el camino más simple y
sirve como referencia para justificar cada componente adicional.

| # | Alternativa | A favor | En contra y sacrificio |
|---|---|---|---|
| 1 | **Monolito modular por dominios y una base relacional** | Menor costo, despliegue y depuración sencillos; aforo y venta caben en una transacción | Fila, consultas y pagos compiten con el inventario. Escalar el pico obliga a escalar todo y una pasarela lenta consume recursos del mismo proceso |
| 2 | **Microservicios sincrónicos con base por servicio** | Despliegue y escalado independientes por dominio | La compra depende de una cadena de red; multiplica puntos de fallo y traslada el problema a una transacción distribuida. Excede la capacidad operativa inicial |
| 3 | **Space-Based en todo el sistema, incluida la autoridad del inventario** | Máxima elasticidad y baja latencia en memoria | Convierte replicación, failover y reconciliación de memoria en parte del invariante legal. Es la opción de mayor costo y menor simplicidad |
| 4 | **Event-Driven puro, incluidos los comandos de inventario** | Alto desacoplamiento y absorción de ráfagas mediante colas | Una reserva necesita respuesta definitiva antes del pago. Aceptar consistencia eventual en ese comando permitiría conflictos u obligaría a compensar una sobreventa, aunque el umbral permitido es cero |
| 5 | **Híbrida selectiva: Space-Based en el camino caliente, núcleo transaccional, CQRS y Event-Driven después de reservar** | Descarga lecturas y admisión, mantiene una autoridad durable y aísla procesos lentos; cada componente escala según su carga | Combina modelos, duplica datos de lectura y exige eventos versionados, observabilidad, reconciliación e idempotencia |

## 6. Decisión

Adoptaremos la **alternativa 5**.

El nombre que se usará de forma consistente en los ADR, diagramas y sustentación será:
**“arquitectura híbrida Event-Driven con Space-Based bajo demanda, núcleo transaccional y
CQRS”**.
CQRS y SAGA se tratarán como patrones internos, no como estilos globales. Tampoco se llamará
“arquitectura fragmentada” porque PostgreSQL no se dividirá inicialmente en *shards*, ni
“puramente reactiva” porque reservar inventario seguirá siendo un comando síncrono y
transaccional.

## 7. Justificación

La alternativa elegida distribuye la certeza y la velocidad según su valor para el negocio:

| Necesidad verificable | Respuesta arquitectónica |
|---|---|
| **Cero sobreventas y una sola titularidad válida** | PostgreSQL y el núcleo transaccional son la única autoridad de inventario |
| **100% de turnos conformes y reconstruibles** | La zona Space-Based soporta el estado operativo; un registro durable conserva la secuencia |
| **≥ 99% de pagos iniciados finalizados bajo saturación** | Admisión, catálogo y pago tienen recursos y circuitos de fallo separados |
| **Discrepancias resueltas en ≤ 15 min y ventas reconstruibles durante 24 meses** | Los eventos durables y la SAGA registran cada transición y permiten reanudar trabajo |
| **Costo ≤ COP $150 por boleta y disponibilidad ≥ 99,9% en la ventana** | La operación cotidiana conserva capacidad mínima; solo la zona caliente se prepara y escala masivamente durante la ventana |
| **Posición P95 ≤ 1 s y reserva P95 ≤ 2 s** | La fila y las consultas rápidas se separan del comando transaccional de reserva |
| **Cero tokens inválidos aceptados y datos sensibles protegidos** | El borde, la admisión firmada y la identidad aislada limitan acceso y exposición |
| **Política de venta modificable sin cambiar inventario ni pago** | La política vive en un módulo y configuración propios, separados de los contratos críticos |

La memoria distribuida absorbe la multitud y reduce la presión de las lecturas, pero no
posee la boleta porque la asignación final admite cero sobreventas y cero titularidades
simultáneas. La decisión también evita distribuir por defecto: TicketRight separa solo las
capacidades con patrones de carga o fallo distintos y conserva módulos internos para el
resto.

**Precio aceptado:** menor simplicidad, consistencia eventual en consultas, más contratos y
observabilidad distribuida. Se acepta porque esas consecuencias son recuperables; exceder el
aforo o perder la relación dinero–boleta no lo es.

## 8. Implicaciones

### Consecuencias positivas

- Las consultas y la fila no compiten directamente con las transacciones que protegen el
  aforo.
- La caída de notificaciones, búsqueda o analítica no impide terminar una compra ya iniciada.
- Redis y OpenSearch son reconstruibles; perderlos no cambia la propiedad de una boleta.
- Cada servicio puede escalar de acuerdo con su patrón real, no por el volumen total del
  sistema.
- Los eventos cotidianos no pagan la capacidad Space-Based reservada para una venta masiva.

### Consecuencias negativas, riesgos y deuda asumida

- El sistema tendrá datos duplicados y ventanas de consistencia eventual en las vistas.
- Se necesitan contratos de eventos versionados, claves de idempotencia, trazas distribuidas
  y procesos de reconciliación.
- Space-Based, Kafka, PostgreSQL y OpenSearch pueden exceder el presupuesto operativo del
  equipo; la arquitectura de implementación deberá simplificar o usar servicios administrados.
- La interfaz puede mostrar una silla como disponible y recibir un rechazo al reservarla.
- Los cambios de perfil agregan estados operativos, alarmas y riesgo de abrir una venta con
  una clasificación incorrecta.
- Se asume deuda en automatización de despliegues, pruebas de concurrencia y recuperación de
  proyecciones antes de añadir más servicios.

### Decisiones y entregables condicionados

- [AD-003](0003-consistencia-por-tipo-de-inventario.md) define la frontera exacta entre
  PostgreSQL y las proyecciones en memoria.
- [AD-006](0006-escalado-programado-por-ventana-de-venta.md) materializa Space-Based y el
  control de admisión, y define las transiciones entre cotidiano, preparación, pico y
  recuperación.
- [AD-002](0002-mensajeria-del-bus-de-eventos.md) define la SAGA y el uso de Kafka.
- La arquitectura de referencia deberá mostrar capacidades y patrones sin proveedores; la
  arquitectura de implementación trazará cada capacidad a tecnologías concretas.

**Costo de reversión:** alto después de implementar eventos y proyecciones; medio durante el
modelamiento.
**Revisar si:** un monolito modular completa al menos 99% de los pagos iniciados bajo
saturación, mantiene la infraestructura en máximo COP $150 por boleta y alcanza 99,9% de
disponibilidad durante la ventana; el costo cotidiano
de los componentes mínimos supera el presupuesto; la zona Space-Based no puede activarse a
tiempo; o el equipo no puede operar los cambios de perfil con recuperación aceptable.

---

**Fuentes:** [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[caso de negocio](../01-caso-de-negocio/caso-de-negocio-corporativo.md) ·
[trazabilidad](../01-caso-de-negocio/caso-de-negocio.md#6-trazabilidad) ·
[rúbrica ADR](../02-modelamiento/rubrica.md#2-adr--architectural-decision-record).
