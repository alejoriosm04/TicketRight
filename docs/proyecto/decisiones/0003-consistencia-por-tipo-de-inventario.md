# AD-003 — PostgreSQL como autoridad del inventario y CQRS para las consultas

**Fecha:** 2026-09-16 · **Estado:** ✅ Aceptado
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** datos
**Relacionados:** [AD-005](0005-estilo-de-arquitectura.md) ·
[AD-002](0002-mensajeria-del-bus-de-eventos.md) ·
[AD-006](0006-escalado-programado-por-ventana-de-venta.md)

> **Decisión en palabras simples:** Redis puede responder rápido qué parece libre, pero
> PostgreSQL es el único componente autorizado para decir “esta silla quedó reservada” o
> “este cupo fue vendido”. El pago nunca se inicia con una reserva que solo exista en caché.

## 1. Decisión arquitectónica

TicketRight aplicará **CQRS** para separar el modelo de escritura que protege el negocio de
los modelos de lectura que absorben el pico.

### Modelo de comandos: autoridad durable en PostgreSQL

El núcleo transaccional almacenará eventos, localidades, sillas, reservas, órdenes, pagos,
boletas y titularidad en **PostgreSQL** —Aurora PostgreSQL Multi-AZ es la implementación
candidata en AWS—. Toda transición crítica será corta, atómica e idempotente.

- **Silla numerada.** La reserva ejecutará una actualización condicional o un bloqueo corto
  de su fila (`SELECT … FOR UPDATE`) dentro de una transacción. Solo podrá pasar de
  `libre` a `reservada` si el estado y la versión esperados siguen vigentes. Una
  restricción única impedirá más de una asignación activa por `evento_id + silla_id`.
- **Localidad general.** Una actualización atómica incrementará `reservados` únicamente si
  `capacidad - vendidos - reservados >= cantidad_solicitada`. Así se protege el aforo sin
  materializar miles de sillas inexistentes. Si la prueba muestra contención, el contador
  podrá dividirse en lotes cuya suma nunca exceda la capacidad; no se introduce esa
  complejidad antes de medirla.
- **Reserva temporal.** Cada reserva tendrá `estado`, `expires_at`, `version` y referencia a
  la SAGA. Un worker durable liberará las reservas vencidas que no tengan pago confirmado.
  La reserva deja de retener inventario a los diez minutos exactos de su creación; el
  worker corre con un periodo `[S]` ≤ 30 s, que es el retraso máximo de la liberación
  efectiva.
- **Propiedad de la boleta.** Emisión, transferencia, reventa y anulación cambiarán una
  cadena de titularidad versionada dentro del mismo límite transaccional, de modo que solo
  exista un titular válido a la vez. En la emisión, la venta de la silla en la localidad
  (`reservada → vendida`) y la creación de la boleta ocurren en esa misma transacción: la
  localidad sigue siendo la única autoridad sobre la asignación y la boleta solo registra el
  `sillaId` ya vendido.

No se mantendrá una transacción abierta mientras el usuario paga. Se confirma la reserva,
se cierra la transacción y la SAGA continúa el proceso.

### Modelo de consultas: proyecciones reconstruibles

- **Redis Cluster** mantendrá bitmaps o estructuras compactas para disponibilidad
  aproximada, sesiones, fila y tokens. Un script Lua puede cambiar atómicamente un bit de
  intención o limitar colisiones, pero ese bit **no crea una reserva legal ni emite una
  boleta**.
- **OpenSearch** indexará catálogo, artistas, ciudades, recintos y filtros. No participará
  en el comando de reserva.
- Un **outbox transaccional** publicará los cambios confirmados; consumidores idempotentes
  actualizarán Redis y OpenSearch. Las proyecciones siempre fluyen desde PostgreSQL y podrán
  reconstruirse desde el registro durable.

La respuesta definitiva a `POST /reservas` provendrá del núcleo. Las consultas podrán ser
rápidas y eventualmente consistentes; el comando volverá a validar antes de prometer la
boleta.

### Comportamiento según la demanda

La autoridad y los invariantes no cambian entre perfiles:

- En operación **cotidiana**, PostgreSQL conserva capacidad transaccional base. Redis puede
  operar con un tamaño pequeño para sesiones y caché; OpenSearch es opcional en el MVP y el
  modelo de consultas puede usar una proyección simple mientras el volumen lo permita.
- En **preparación**, se reconstruyen y precargan las proyecciones del evento, se verifican
  índices y conexiones y se aumenta la capacidad de Redis/OpenSearch sin modificar el
  modelo de comandos.
- En **pico**, mapas, disponibilidad y búsquedas se sirven desde las proyecciones; solo los
  comandos ya admitidos alcanzan PostgreSQL.
- En **recuperación**, los consumidores terminan de aplicar eventos, se compara cada
  proyección contra la autoridad y después se reduce su capacidad.

No habrá una regla de inventario “rápida” para el pico y otra “segura” para el día normal.
Usar el mismo comando transaccional en ambos perfiles evita que una transición operativa
cambie la semántica de la reserva.

## 2. Identificador único

AD-003

## 3. Problema o asunto

El sistema debe atender miles de consultas sobre mapas y disponibilidad sin permitir que
dos compradores obtengan la misma silla o que una localidad supere el aforo. Estos objetivos
entran en tensión: consultar y escribir todo en una única base simplifica la consistencia,
pero deja que el tráfico exploratorio consuma la capacidad de las reservas; trasladar el
inventario a memoria reduce latencia, pero convierte el failover, la expiración y la
sincronización de Redis en parte de un invariante legal.

También existen dos naturalezas de inventario. Una silla numerada es una unidad irrepetible;
una localidad general es una capacidad agregada. Forzar el mismo modelo físico para ambos
añade costo o contención sin mejorar su garantía.

Las fuerzas que obligan a decidir son:

- **Integridad del aforo:** cero boletas por encima del aforo en el 100% de los eventos, incluso con fallos y
  reintentos.
- **A-3:** cero casos de dos titulares válidos sobre la misma boleta.
- **A-5:** liberar reservas no pagadas en máximo diez minutos aunque el navegador se cierre.
- **A-6:** proteger pagos en curso y degradar primero la exploración del catálogo.
- **A-8:** reconstruir completamente la vida de la boleta durante 24 meses.
- **A-7:** evitar una solución distribuida costosa antes de demostrar que es necesaria y
  mantener la infraestructura en máximo COP $150 por boleta vendida.
- **A-10:** confirmar o rechazar una reserva con latencia P95 de máximo dos segundos y una
  tasa de error técnico menor al 1% bajo la carga objetivo.

CQRS separa las lecturas optimizadas de las escrituras que protegen el negocio. Aquí se usa
para retirar de PostgreSQL las consultas masivas y el estado temporal, sin relajar el aforo
ni la respuesta definitiva de la reserva.

## 4. Supuestos

- `[V]` El aforo autorizado no puede excederse. Fuente:
  [`validaciones.md`](../01-caso-de-negocio/validaciones.md#aforo-y-evento-masivo).
- `[S]` El evento tipo tiene 8.000 puestos y vende 7.600; se desconoce la mezcla real de
  silla numerada y localidad general. `PENDIENTE: validar la mezcla con el promotor piloto.`
- `[S]` PostgreSQL soportará el caudal definitivo de reservas porque el control de admisión
  limita los comandos; debe probarse con colisiones altas sobre las mismas sillas y
  localidades.
- `[S]` Los fans aceptarán una disponibilidad visual atrasada por pocos segundos si el
  sistema explica que la reserva es la confirmación definitiva.
- `[S]` Redis y OpenSearch reducirán suficiente carga para justificar su costo. La
  arquitectura podrá omitir OpenSearch en el MVP si PostgreSQL cubre el catálogo.
- `[S]` Redis podrá reducirse a capacidad mínima fuera del pico sin perder datos necesarios,
  porque todo su estado será reconstruible desde fuentes durables.
- `[V]` Las notificaciones de expiración de Redis pueden perderse cuando el consumidor está
  desconectado; por eso no garantizan por sí solas la liberación en máximo diez minutos. Fuente:
  [documentación de Redis](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/).
- `[V]` PostgreSQL puede abortar transacciones serializables y exige reintentar la
  transacción completa. Fuente:
  [documentación de PostgreSQL](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html).

## 5. Alternativas

Los criterios de comparación son **certeza del aforo, latencia, recuperación, complejidad y
costo**.

| # | Alternativa | A favor | En contra y sacrificio |
|---|---|---|---|
| 1 | **PostgreSQL para comandos y consultas, con bloqueos pesimistas** | Una sola fuente y modelo mental; garantías ACID claras; menor operación | Mapas, búsqueda y sondeo compiten con reservas. Un bloqueo amplio o una transacción mantenida durante el pago serializa el pico |
| 2 | **Redis + Lua como autoridad del inventario y persistencia asíncrona** | Reserva en memoria con latencia muy baja; bitmaps compactos; excelente absorción del pico | Una pérdida, failover o divergencia de la memoria afecta aforo y titularidad. La expiración podría liberar una silla pagada. La reconciliación se vuelve parte del camino legal |
| 3 | **PostgreSQL con concurrencia optimista únicamente** | Evita esperar bloqueos y funciona bien cuando hay pocas colisiones | En una venta caliente muchos usuarios seleccionan las mismas sillas; aumentan conflictos, reintentos y latencia. Sigue sin separar las consultas masivas |
| 4 | **Consistencia eventual con sobreventa y compensación posterior** | Máxima disponibilidad y velocidad de escritura | Incompatible con cero sobreventas y una sola titularidad válida. Reembolsar después no corrige el incumplimiento de aforo ni la doble titularidad |
| 5 | **CQRS: PostgreSQL como autoridad, operaciones atómicas por tipo de inventario y Redis/OpenSearch como proyecciones** | Mantiene invariantes durables y descarga las lecturas; permite reconstruir la capa Space-Based | Duplica datos, admite vistas atrasadas y exige outbox, invalidación, reintentos y reconciliación |

## 6. Decisión

Adoptaremos la **alternativa 5**.

Se usará una estrategia concreta por tipo de inventario: operación condicional y unicidad
para silla numerada; contador atómico acotado para localidad general. No se aplicará
aislamiento serializable a toda la aplicación ni se mantendrán bloqueos durante el pago.
Tampoco se fragmentará PostgreSQL inicialmente: el particionamiento se considerará solo si
una prueba demuestra que la autoridad transaccional es el cuello de botella después del
control de admisión.

## 7. Justificación

La alternativa seleccionada separa lo que puede estar atrasado de lo que debe ser exacto.

| Criterio | Razón de la elección |
|---|---|
| **A-2 · aforo** | Una actualización atómica rechaza la reserva si no existe capacidad; ninguna proyección puede emitir de más |
| **A-3 · unicidad** | La transición de estado, la versión y la restricción única hacen que una sola transacción gane la silla |
| **A-5 · liberación** | `expires_at` vive en almacenamiento durable y un worker idempotente recupera el trabajo aun si Redis pierde una notificación |
| **A-6 · prioridad** | Las consultas se sirven fuera de PostgreSQL y pueden degradarse antes que el comando de inventario |
| **A-8 · reconstrucción** | Cada transición durable genera un evento correlacionado; Redis y OpenSearch no contienen historia irremplazable |
| **A-10 · rendimiento** | El control de admisión limita los comandos y las proyecciones descargan las lecturas antes de confirmar en PostgreSQL |
| **A-7 · costo** | Se evita una base global distribuida y el *sharding* prematuro; las tecnologías adicionales deben demostrar ahorro bajo carga |
| **Operación cotidiana** | PostgreSQL mantiene una única ruta de comandos; las proyecciones reducen capacidad sin obligar a sostener una grilla Space-Based completa |

Se descarta Redis como autoridad, aunque sea más rápido, porque la latencia no compensa
convertir una caché en el árbitro legal de la boleta. Se descarta PostgreSQL solo porque las
lecturas de la multitud no deberían compartir presupuesto con la escritura. La combinación
es más compleja, pero pone cada garantía donde puede demostrarse mejor.

**Precio aceptado:** la pantalla puede mostrar una silla que otra persona acaba de tomar;
el rechazo se descubre al reservar. Se acepta una inconsistencia de experiencia durante
segundos para no aceptar una inconsistencia de propiedad.

## 8. Implicaciones

### Consecuencias positivas

- Existe una regla inequívoca para resolver divergencias: siempre manda PostgreSQL.
- Silla numerada y localidad general conservan invariantes adecuados a su naturaleza.
- Redis u OpenSearch pueden perderse y reconstruirse sin cambiar ventas confirmadas.
- La reserva dura diez minutos sin depender de que el navegador permanezca abierto.

### Consecuencias negativas, riesgos y deuda asumida

- Habrá duplicación de datos y consistencia eventual en la experiencia de consulta.
- El equipo debe operar procesos de proyección, reconciliación y limpieza de reservas.
- Los bloqueos y actualizaciones condicionales deben instrumentarse; una mala consulta puede
  crear *deadlocks* o contención.
- Los lotes para localidad general quedan como optimización pendiente, no como parte inicial.
- OpenSearch agrega costo y podrá aplazarse si no demuestra beneficio para el catálogo MVP.
- Reducir y ampliar proyecciones exige automatizar calentamiento y reconciliación; una caché
  fría no debe provocar que miles de consultas regresen de golpe a PostgreSQL.

### Reglas y pruebas obligatorias

- Ningún pago empezará con una reserva existente solo en Redis.
- La expiración será una transición de estado idempotente; nunca un borrado silencioso.
- La interfaz identificará la disponibilidad como orientativa y la reserva como definitiva.
- Se probarán doble clic, reintento, cien usuarios sobre la misma silla, agotamiento de una
  localidad, caída de Redis, proyección atrasada, reserva vencida y recuperación del worker.
- También se probará la transición cotidiano → preparación → pico → recuperación, incluyendo
  caché fría y reducción posterior, sin variar el resultado de los comandos.
- La observabilidad medirá conflictos, duración de bloqueos, retraso de proyección, reservas
  vencidas sin liberar y divergencias detectadas.

**Costo de reversión:** medio mientras las proyecciones sigan siendo descartables; alto si
se introduce lógica exclusiva en ellas.
**Revisar si:** PostgreSQL impide completar al menos el 99% de los pagos iniciados bajo
saturación o la reserva supera P95 de dos segundos; la tasa de conflictos
optimistas supera el umbral que se establezca; el costo mínimo cotidiano de Redis/OpenSearch
hace incumplir el modelo financiero; o una proyección más simple ofrece el mismo resultado.

---

**Fuentes:** [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[aforo y datos personales](../01-caso-de-negocio/validaciones.md#validación-4--aforo-y-datos-personales) ·
[alcance](../01-caso-de-negocio/alcance.md) ·
[rúbrica ADR](../02-modelamiento/rubrica.md#2-adr--architectural-decision-record).
