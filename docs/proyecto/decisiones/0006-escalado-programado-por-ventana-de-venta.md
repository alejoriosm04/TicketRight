# AD-006 — Activación bajo demanda de la sala Space-Based y escalado elástico

**Fecha:** 2026-09-16 · **Estado:** ✅ Aceptado
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** despliegue
**Relacionados:** [AD-005](0005-estilo-de-arquitectura.md) ·
[AD-003](0003-consistencia-por-tipo-de-inventario.md) ·
[AD-004](0004-datos-personales-almacenamiento-y-acceso.md)

> **Decisión en palabras simples:** TicketRight no intentará hacer más grande la base de
> datos cada vez que llegue una multitud. Preparará capacidad antes de abrir, mantendrá a la
> mayoría en una sala de espera distribuida y admitirá solo la cantidad que el núcleo puede
> procesar sin arriesgar pagos ya iniciados.

## 1. Decisión arquitectónica

TicketRight combinará **control de admisión**, una **sala de espera Space-Based** y dos
mecanismos complementarios de escalado: programado antes de la venta y reactivo durante la
operación. La zona Space-Based no permanecerá dimensionada para alta concurrencia en la
cotidianidad.

### Sala de espera y control de flujo

1. Después de superar los controles de [AD-004](0004-datos-personales-almacenamiento-y-acceso.md),
   cada solicitud de ingreso recibirá un identificador idempotente. Un topic durable de
   admisión, particionado por `event_id`, establecerá la secuencia de ese evento según su
   política publicada; no se prometerá orden global entre eventos.
2. Ese registro conservará `ingreso`, `posición`, `admisión`, `expiración` y `rechazo`.
   **Redis Cluster** mantendrá la proyección operativa de baja latencia: estado, posición
   aproximada, sesión y token. Si Redis se pierde, la proyección se reconstruye desde el
   registro y no se inventa un orden nuevo.
3. Workers sin estado leerán grupos de turnos y admitirán usuarios a una tasa limitada por
   la capacidad medida del checkout y del inventario. Esta válvula implementa *back
   pressure*: si suben la latencia o los errores del núcleo, se reduce o detiene la admisión.
4. Al ser admitido, el fan recibirá un **JWT firmado, corto, de un solo uso lógico**, ligado
   al evento, usuario, audiencia y expiración. El token autoriza a intentar reservar; no
   promete inventario.
5. El navegador consultará su estado a intervalos controlados o recibirá actualizaciones
   agrupadas. Ese tráfico nunca consultará PostgreSQL.

Esta zona aplica Space-Based mediante memoria distribuida, unidades de procesamiento
paralelas y ausencia de la base transaccional en el camino de la multitud. La memoria
sostiene el rendimiento; el registro durable permite reconstruir el 100% de los turnos.

### Despliegue y escalado

- Los servicios se ejecutarán en **contenedores** sobre un orquestador distribuido entre al
  menos dos zonas de disponibilidad.
- Antes de la ventana se realizará **precalentamiento programado** de gateway, fila,
  consultas y workers. La venta no abrirá hasta verificar réplicas, conexiones y
  dependencias críticas.
- Durante la venta, **KEDA** ajustará consumidores a partir del *lag* de Kafka o del trabajo
  pendiente. CPU, memoria, latencia y tasa de error serán señales de protección, no la única
  fuente de escalado.
- Inventario, pagos en curso y conciliación tendrán mínimos y presupuestos de recursos
  distintos de catálogo y fila. Escalar admisión no escalará PostgreSQL sin límite.
- Habrá un techo de réplicas y una tasa máxima de admisión para mantener el costo de
  infraestructura en máximo COP $150 por boleta vendida y evitar que el autoescalado
  convierta el cuello de botella en una avalancha contra la base.

La implementación candidata en AWS es EKS + KEDA, Amazon MSK o Kafka compatible, Redis
administrado y Aurora PostgreSQL Multi-AZ. La prueba de la Entrega 3 podrá ejecutarse en
Kubernetes local. La referencia mostrará las capacidades sin marcas y la implementación
documentará estas correspondencias.

### Perfiles operativos y transiciones

La misma arquitectura se desplegará con cuatro perfiles. No se cambiarán endpoints,
contratos de token, reglas de inventario ni semántica de eventos al pasar de uno a otro.

| Perfil | Sala y ruta del usuario | Capacidad |
|---|---|---|
| **Cotidiano** | La admisión funciona en *pass-through*: registra la decisión y entrega el token inmediatamente. No se crea una fila visible | Redis y servicios conservan el mínimo seguro; workers de fila quedan en cero o mínimo; PostgreSQL, borde, SAGA, auditoría y seguridad permanecen activos |
| **Preparación** | Se cierra temporalmente la apertura hasta completar la comprobación; se carga la política y se reconstruye la proyección de turnos | Se precalientan Redis, gateway, consultas, particiones y consumidores; se reservan conexiones y capacidad de pago |
| **Pico** | La fila es obligatoria. Los usuarios reciben posición y solo obtienen token cuando la válvula los admite | Space-Based escala horizontalmente; KEDA ajusta workers; inventario y pagos conservan cuotas protegidas |
| **Recuperación** | No se incorporan nuevos usuarios a la venta cerrada; quienes ya pagaban terminan y los estados intermedios se concilian | Se mantiene capacidad hasta drenar *lag*, emisiones, DLQ y discrepancias; después se reduce gradualmente |

Las transiciones se gobernarán así:

```text
Cotidiano ──evento marcado como alta demanda + T−N──> Preparación
Preparación ──comprobaciones aprobadas + hora de apertura──> Pico
Pico ──cierre de ventana o inventario agotado──> Recuperación
Recuperación ──trabajo crítico drenado y conciliado──> Cotidiano

Cotidiano ──umbral inesperado de tráfico/error──> Emergencia
Emergencia ──cerrar admisión, preparar fila──> Pico controlado
```

El modo de emergencia prioriza seguridad: primero limita nuevas admisiones y protege pagos;
después aumenta capacidad. No intenta enviar la demanda inesperada a PostgreSQL mientras
arrancan los componentes Space-Based.

## 2. Identificador único

AD-006

## 3. Problema o asunto

La carga llega en una ráfaga más corta que el tiempo necesario para detectar CPU alta,
programar pods y dejarlos listos. El autoescalado tradicional actúa cuando el usuario ya
siente la saturación. Mantener la capacidad máxima todo el mes elimina el arranque frío,
pero contradice el costo por boleta y la decisión deliberada de ofrecer menor disponibilidad
fuera de la ventana.

Además, escalar los servidores web no elimina la capacidad finita del inventario. Sin una
válvula, más réplicas pueden enviar más comandos concurrentes a PostgreSQL y empeorar la
contención. El problema real es controlar **cuándo está lista la capacidad y cuánto trabajo
entra al núcleo**, no solo cuántos pods existen.

Las fuerzas son:

- **Equidad y auditabilidad:** el 100% de los turnos debe seguir la política publicada y ser reconstruible.
- **Degradación controlada:** bajo saturación se completará al menos el 99% de los pagos iniciados; catálogo y
  nuevos ingresos se degradan primero.
- **A-7:** costo de infraestructura máximo de COP $150 por boleta vendida en la carga
  declarada.
- **A-9:** disponibilidad de al menos 99,9% durante la ventana de venta.
- **A-8:** la posición y la admisión forman parte de la historia de la venta, reconstruible
  durante 24 meses.
- **A-10:** consultar la posición debe responder con P95 de máximo un segundo y confirmar o
  rechazar una reserva con P95 de máximo dos segundos; el error técnico debe ser menor al 1%.
- **A-11:** cero tokens inválidos, vencidos o repetidos aceptados en las pruebas.
- **Restricción operativa:** el equipo debe poder demostrar y operar el mecanismo sin
  depender de una plataforma que no comprende.

## 4. Supuestos

- `[S]` La carga objetivo es 30.000 usuarios en 60 segundos contra 5.000 boletas.
- `[S]` La hora de apertura se conoce y el promotor debe configurarla con antelación.
- `[S]` El promotor marcará el evento como cotidiano o de alta demanda. La plataforma podrá
  elevarlo a emergencia por tasa de solicitudes, latencia o errores, pero no degradarlo
  automáticamente mientras exista trabajo crítico.
- `[S]` El precalentamiento comenzará 30 minutos antes y la ventana de capacidad alta durará
  tres horas. Estos valores se ajustarán con costo y pruebas.
- `[S]` La posición puede actualizarse cada 10–15 segundos sin perjudicar la percepción de
  equidad. `PENDIENTE: validar en el prototipo.`
- `[S]` La tasa inicial de admisión se derivará del percentil 95 de capacidad segura del
  núcleo; no se copiarán cifras de Ticketmaster ni de otra plataforma.
- `[V]` El escalador de Kafka de KEDA usa el retraso del grupo consumidor y el número de
  particiones condiciona el paralelismo útil. Fuente:
  [documentación de KEDA](https://keda.sh/docs/latest/scalers/apache-kafka/).
- `[S]` La prueba de la Entrega 3 podrá ejecutarse en Kubernetes local y documentará la
  correspondencia con el destino en nube.
- `[S]` El costo conjunto de EKS, Kafka, Redis y PostgreSQL Multi-AZ será máximo COP $150
  por boleta vendida.
  `PENDIENTE: calcular el total; hoy solo existe una referencia parcial de cómputo.`

## 5. Alternativas

Se comparan **preparación para el segundo cero, protección del núcleo, costo, recuperación y
operabilidad**.

| # | Alternativa | A favor | En contra y sacrificio |
|---|---|---|---|
| 1 | **Capacidad fija dimensionada al pico, sin sala de espera** | Operación simple y sin arranque frío | Se paga capacidad ociosa la mayor parte del mes, se pone en riesgo el límite de COP $150 por boleta y toda la ráfaga compite con los pagos iniciados |
| 2 | **Autoescalado de Kubernetes solo por CPU y memoria** | Mecanismo estándar, portable y fácil de observar | Es reactivo: detecta la carga después de que llegó. No conoce el tamaño de la cola ni limita cuánto trabajo entra a PostgreSQL |
| 3 | **Serverless para toda la ruta de venta** | Pago por uso y escalado por solicitud | Arranques en frío y límites del proveedor en el segundo crítico; una explosión de funciones también puede saturar el inventario. Introduce otro modelo operativo |
| 4 | **Servicio externo administrado de sala de espera y escalado de contenedores** | Tecnología especializada y menor desarrollo de la fila | Dependencia adicional en el camino crítico, costo sin validar y menor control para demostrar que el 100% de los turnos sigue la política publicada |
| 5 | **Space-Based bajo demanda + precalentamiento programado + KEDA + límites de admisión** | Fuera del pico conserva capacidad mínima; durante la ventana absorbe la multitud fuera de PostgreSQL y protege pagos mediante back pressure | Requiere Redis, registro durable, máquina de estados operativa, calendario, métricas confiables y pruebas de transición/recuperación |

## 6. Decisión

Adoptaremos la **alternativa 5**. Space-Based será una capacidad **selectiva y programable**,
no el perfil permanente de operación.

El mecanismo principal será el precalentamiento programado porque la apertura es conocida.
KEDA será el respaldo reactivo y ajustará principalmente workers asíncronos; no abrirá la
válvula de admisión por sí solo. La tasa de admisión se calculará a partir de la capacidad
segura observada del núcleo y podrá reducirse automáticamente ante saturación.

No se afirma que KEDA sea “predictivo”: la anticipación proviene del calendario del negocio;
KEDA reacciona al trabajo pendiente. Tampoco se asume que más réplicas siempre dan más
capacidad: Kafka limita consumidores útiles por particiones y PostgreSQL tiene un límite de
conexiones y contención.

## 7. Justificación

| Criterio | Respuesta de la decisión |
|---|---|
| **A-9 · disponibilidad** | El sistema comprueba capacidad antes de la apertura y distribuye réplicas entre zonas de fallo |
| **A-7 · costo** | La capacidad masiva se activa solo alrededor de la ventana y tiene techo presupuestal |
| **A-4 · equidad** | La secuencia durable determina el turno; Redis acelera la vista, pero no puede reordenar silenciosamente la historia |
| **A-6 · prioridad** | La válvula reduce nuevos ingresos cuando inventario o pago se degradan; los pagos iniciados conservan recursos reservados |
| **A-8 · reconstrucción** | El registro de admisión permite reconstruir posición, token y momento de entrada aunque Redis se pierda |
| **A-10 · rendimiento** | La fila se atiende en memoria y la válvula limita el trabajo enviado al núcleo |
| **A-11 · seguridad** | El token de admisión firmado, corto y de uso lógico único protege el ingreso a la reserva |
| **Operación cotidiana** | La fila queda en paso directo y la grilla en mínimo; las garantías transaccionales y Event-Driven continúan sin pagar capacidad de pico |

En TicketRight, 30.000 personas actualizan un estado temporal en memoria mientras solo una
fracción controlada alcanza el núcleo. El escalado basado en *lag* observa demanda
acumulada, una señal más útil para los workers que la CPU aislada; el calendario resuelve el
arranque previo que ninguna señal reactiva puede anticipar por sí sola.

**Precio aceptado:** se paga capacidad antes de vender, la posición visible puede atrasarse
y el sistema incorpora Redis/Kafka/KEDA. Se acepta porque perder el primer minuto o dejar
que la fila derribe el inventario tiene un impacto mayor en conversión y reputación.

## 8. Implicaciones

### Consecuencias positivas

- La multitud queda desacoplada de PostgreSQL y no determina directamente la tasa de compra.
- Una falla de catálogo o fila puede detener nuevas admisiones sin cancelar pagos en curso.
- El sistema aprovecha una señal real del negocio —la hora de apertura— y responde también a
  cambios no previstos.
- El estado operativo de la fila puede reconstruirse a partir de su registro durable.
- Los eventos comunes usan el mismo checkout sin mantener encendida la capacidad masiva.

### Consecuencias negativas, riesgos y deuda asumida

- Un horario mal configurado puede abrir la venta sin capacidad; se necesita aprobación y
  alarma previa, no solo código.
- Una clasificación equivocada de un evento cotidiano puede obligar a entrar en emergencia;
  mientras escala la fila habrá menor admisión, pero no se expondrá PostgreSQL a la ráfaga.
- Redis y el registro de turnos deben reconciliarse; una posición mostrada puede ser
  aproximada.
- KEDA no crea paralelismo infinito: particiones, conexiones y límites externos deben
  dimensionarse conjuntamente.
- Multi-zona y servicios administrados pueden superar COP $150 por boleta vendida. El costo
  total sigue pendiente.
- Se asume deuda en automatización de pruebas de pico, capacidad y recuperación antes de
  confiar en los valores de configuración.

### Reglas operativas y pruebas

- La venta no abrirá si gateway, fila, PostgreSQL, Redis o el bus no superan la comprobación
  previa.
- Se declararán mínimos, máximos, prioridad y señal de escalado por grupo de trabajo.
- Se probarán pico programado, cambio de hora, pico imprevisto, caída de un worker, pérdida
  de Redis, retraso creciente de Kafka y saturación deliberada de PostgreSQL.
- Se probarán demanda cotidiana prolongada, emisión directa de token, escalado desde mínimo,
  las cuatro transiciones y la imposibilidad de volver a cotidiano con trabajo crítico.
- La observabilidad medirá usuarios en fila, antigüedad del primer turno, tasa de admisión,
  *lag*, capacidad lista, latencia de reserva, pagos protegidos y costo por boleta.
- Se medirá el presupuesto de latencia de A-10 —consulta de posición P95 ≤ 1 s, confirmación
  de reserva P95 ≤ 2 s, error técnico < 1%— durante la carga objetivo, no solo en promedio.

**Costo de reversión:** medio mientras la fila dependa de contratos portables; alto si el
token o el orden se acoplan a un proveedor especializado.
**Revisar si:** el costo mínimo cotidiano o el costo de pico supera COP $150 por boleta;
el precalentamiento no permite alcanzar 99,9% de disponibilidad en la ventana; la transición
de emergencia pierde solicitudes; el estado
de fila no se reconstruye al 100%; o una plataforma administrada reduce riesgo con costo
aceptable.

---

**Fuentes:** [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[alcance](../01-caso-de-negocio/alcance.md) ·
[costo de cómputo existente](../01-caso-de-negocio/canvas.md#dato-6--precio-de-cómputo-y-qué-sale-de-él) ·
[escalador Kafka de KEDA](https://keda.sh/docs/latest/scalers/apache-kafka/).
