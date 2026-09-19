# ADR técnicos listos para pasar al Excel

Este documento consolida los cinco ADR evaluables de TicketRight. Los nombres de los campos
coinciden con la plantilla [`adr-plantilla.xlsx`](adr-plantilla.xlsx). Cada bloque está
redactado para copiar su contenido en la celda correspondiente.

El orden y los identificadores de esta copia siguen la plantilla: cinco pestañas (`ADR0001`
a `ADR0005`) y cinco decisiones (`AD-0001` a `AD-0005`). El Excel no se actualiza
automáticamente desde este Markdown.

El equipo ratificó las cinco decisiones el 16 de septiembre de 2026. Por eso su estado es
**Aceptado**. Los supuestos, pruebas y validaciones pendientes se conservan como condiciones
de revisión; no impiden registrar la decisión tomada. La decisión sobre la idea de negocio no
se incluye porque no corresponde a una decisión de arquitectura.

## Hoja RESUMEN

| IDENTIFICADOR | ARCHITECTURAL DECISION | STATUS | DATE | DECISION |
|---|---|---|---|---|
| AD-0001 | SAGA orquestada con eventos durables para pago y emisión | Aceptado | 2026-09-16 | Coordinar reserva, pago y emisión desde el servicio de Ventas. Guardar el estado en PostgreSQL y publicar eventos mediante un registro de salida transaccional y Kafka. Usar eventos independientes solo para tareas no críticas, como notificaciones y analítica. |
| AD-0002 | PostgreSQL como autoridad del inventario y CQRS para las consultas | Aceptado | 2026-09-16 | PostgreSQL será la única fuente válida para reservar, vender y transferir boletas. Redis y OpenSearch atenderán consultas rápidas con copias reconstruibles de los datos. Cada reserva volverá a validar el inventario en PostgreSQL. |
| AD-0003 | Seguridad por capas en el borde, admisión firmada e identidad aislada | Aceptado | 2026-09-16 | Proteger la entrada con CDN, WAF y API Gateway; delegar la autenticación a un proveedor de identidad; usar un token de admisión firmado y de corta duración; y aislar los datos personales del inventario, los eventos y la observabilidad. |
| AD-0004 | Arquitectura híbrida con Space-Based bajo demanda y núcleo transaccional | Aceptado | 2026-09-16 | Usar una arquitectura híbrida: una zona distribuida en memoria para absorber la alta demanda, PostgreSQL para proteger inventario y titularidad, CQRS para separar consultas de operaciones críticas y eventos durables para pago, emisión y tareas posteriores. |
| AD-0005 | Activación bajo demanda de la sala Space-Based y escalado elástico | Aceptado | 2026-09-16 | Activar la sala de espera distribuida solo cuando la demanda lo requiera. Preparar capacidad antes de cada venta masiva, ajustar trabajadores según el trabajo pendiente y limitar el ingreso de usuarios a la capacidad segura del núcleo. |

## Hoja ADR0001

### ID

AD-0001

### The architectural decision

SAGA orquestada con eventos durables para pago y emisión

### Status

Aceptado

### Problem/Issue

TicketRight no puede confirmar reserva, cobro y emisión en una sola transacción porque la
pasarela de pago es externa. La pasarela puede aprobar el cobro y responder tarde, repetir
una notificación o no responder. Ante estos casos, el sistema debe evitar cobros duplicados,
boletas pagadas sin emitir y liberaciones incorrectas de inventario. También debe conservar
un responsable claro que indique en qué paso está cada venta y qué acción sigue.

### Context

El proceso incluye reserva, pago, emisión y notificación. Una cadena totalmente síncrona
mantendría recursos ocupados y haría depender la venta de todos sus participantes. Un flujo
sin coordinador repartiría los tiempos de espera y las compensaciones entre varios
servicios, lo que dificultaría seguir una venta incompleta.

La decisión debe cerrar en máximo 15 minutos cualquier diferencia entre dinero recibido y
boleta emitida; liberar en máximo 10 minutos una reserva vencida sin pago confirmado;
completar al menos el 99% de los pagos iniciados durante una saturación; reconstruir durante
24 meses la reserva, la respuesta de la pasarela y la emisión; y mantener el costo de
infraestructura en máximo COP $150 por boleta vendida.

Eventos durables, reintentos, control de flujo e idempotencia aíslan el pago y el inventario
de las tareas secundarias sin perder el estado de una venta.

### Assumptions

- `[S]` La pasarela aceptará claves de idempotencia y enviará notificaciones firmadas.
- `[S]` La pasarela puede responder tarde, enviar respuestas repetidas o cambiar el orden de
  las respuestas. Estos casos deben probarse.
- `[V]` TicketRight depende de una pasarela externa y debe conciliar los recaudos.
- `[S]` Un coordinador dentro del servicio de Ventas será suficiente para el flujo inicial.
- `[S]` Kafka administrado cumplirá el límite de costo.
- `[S]` El costo mínimo del bus y del consumidor crítico será aceptable fuera de las ventas
  masivas.
- `[S]` Negocio aprobará el tratamiento de un cobro confirmado cuya boleta no pueda
  emitirse, incluida la devolución cuando corresponda.

### Alternatives

1. **Cadena síncrona entre reserva, pasarela y emisión.** Es sencilla cuando todos los
   participantes responden, pero una espera o una respuesta perdida deja un resultado
   incierto y mantiene recursos ocupados.
2. **Transacción distribuida de dos fases.** Buscaría confirmar todo como una sola unidad,
   pero la pasarela externa no participa en este mecanismo. No es aplicable al sistema.
3. **SAGA sin coordinador central.** Cada servicio reaccionaría a eventos de otros
   servicios. Favorece la independencia, pero reparte los tiempos de espera y las
   compensaciones, y dificulta saber qué falta para terminar una venta.
4. **SAGA en una plataforma especializada de flujos.** Incluye estado, reintentos y
   seguimiento, pero agrega costo, dependencia de proveedor y aprendizaje para un solo
   flujo crítico inicial.
5. **SAGA coordinada desde Ventas, con PostgreSQL, registro de salida y Kafka.** Mantiene un
   responsable visible y permite reanudar el proceso. A cambio, exige eventos, controles
   contra duplicados, seguimiento y operación de Kafka.

### Decision

Se adopta la alternativa 5. El servicio de Ventas coordinará `reserva → pago → emisión` y
guardará en PostgreSQL el estado de cada venta. El estado y el evento pendiente se guardarán
en la misma transacción mediante un registro de salida. Luego, un proceso publicará el
evento en Kafka.

Cada mensaje tendrá un identificador único y cada operación podrá repetirse sin duplicar el
resultado. No se asumirá una entrega exactamente una vez. Los mensajes que agoten sus
reintentos quedarán en una cola de errores para revisión y reproceso controlado.

Las notificaciones, la analítica y las copias de consulta reaccionarán a eventos de forma
independiente porque sus fallas no deciden dinero, aforo o titularidad. Si la cantidad o la
duración de los flujos supera la capacidad del coordinador propio, se evaluará una plataforma
especializada mediante un nuevo ADR.

### Justification

- El coordinador mantiene visible cada venta incompleta y activa la conciliación antes de
  superar el límite de 15 minutos.
- La reserva se libera mediante un temporizador durable y solo si no existe un pago
  confirmado, para cumplir la liberación máxima de 10 minutos.
- La pasarela y las tareas secundarias no mantienen abiertas las conexiones del inventario,
  lo que protege los pagos iniciados durante el pico.
- Cada cambio conserva estado, fecha e identificadores de seguimiento. Esto permite
  reconstruir la historia completa durante 24 meses.
- El flujo conserva la misma garantía en operación cotidiana y en venta masiva; solo cambia
  la capacidad activa.
- Se acepta que durante algunos minutos exista un pago confirmado con emisión pendiente,
  siempre que el caso esté identificado y tenga un camino de reintento, conciliación o
  devolución.

### Implications

**Consecuencias positivas**

- Una espera agotada en la conexión no se interpreta automáticamente como un pago fallido.
- La caída de notificaciones o analítica no invalida una venta.
- Los mensajes repetidos no duplican cobros, reservas ni boletas si se cumplen los controles
  definidos.
- Soporte puede consultar el estado y el paso pendiente de cada venta.

**Costos y riesgos**

- Se agregan estados intermedios, Kafka, un registro de salida, una cola de errores y
  seguimiento entre servicios.
- El coordinador puede acumular responsabilidades que pertenecen a otros dominios.
- La retención de Kafka no reemplaza el archivo de auditoría de 24 meses.
- Kafka y el consumidor crítico generan un costo base incluso fuera de las ventas masivas.

**Validaciones obligatorias**

- Probar notificación duplicada, respuesta tardía, caída después del cobro, caída antes de
  publicar el evento, emisión no disponible y reproceso de la cola de errores.
- Medir ventas por estado, edad de la diferencia más antigua, duración del proceso,
  reintentos y casos que superen 15 minutos.
- Verificar firma y fecha de las notificaciones de la pasarela. Los eventos no deben incluir
  datos personales.

**Costo de reversión:** medio antes de implementar consumidores; alto después de integrar
pago, emisión y conciliación con estos contratos.

**Revisar si:** queda una diferencia dinero–boleta abierta al cierre o tarda más de 15
minutos en resolverse, el coordinador concentra demasiadas reglas, el costo base
de Kafka rompe el modelo financiero o una plataforma especializada reduce el costo y los
incidentes sin cambiar los contratos.

### Participants

Alejo, Lina, Quinnie

### Date

2026-09-16

## Hoja ADR0002

### ID

AD-0002

### The architectural decision

PostgreSQL como autoridad del inventario y CQRS para las consultas

### Status

Aceptado

### Problem/Issue

TicketRight debe responder miles de consultas de disponibilidad sin vender dos veces la
misma silla ni superar el aforo de una localidad. Si todas las consultas y reservas llegan a
la misma base, la exploración del catálogo consume la capacidad necesaria para comprar. Si
el inventario se controla solo en memoria, una pérdida o diferencia de datos puede afectar
el aforo y la titularidad.

### Context

El sistema administra dos tipos de inventario: sillas numeradas, que son unidades únicas, y
localidades generales, que se controlan como una cantidad disponible. Ambos requieren reglas
distintas. Además, la disponibilidad que ve el usuario puede tener unos segundos de retraso,
pero la confirmación de reserva debe ser exacta.

La decisión debe impedir cualquier venta sobre el aforo y cualquier doble titularidad;
liberar una reserva vencida en máximo 10 minutos; proteger los pagos iniciados frente al
tráfico de consulta; reconstruir la historia de la boleta durante 24 meses; y confirmar o
rechazar una reserva con latencia P95 de máximo 2 segundos y menos de 1% de error técnico.
También debe evitar distribución innecesaria y mantener la infraestructura en máximo COP
$150 por boleta vendida.

CQRS separa las consultas rápidas de las operaciones que protegen el inventario.

### Assumptions

- `[V]` El aforo autorizado no puede excederse.
- `[S]` El evento de referencia tiene 8.000 puestos y vende 7.600.
- `[S]` PostgreSQL soportará las reservas si el control de admisión limita los comandos. Se
  debe probar con muchos usuarios intentando tomar las mismas sillas o localidades.
- `[S]` Los usuarios aceptarán una disponibilidad visual atrasada por pocos segundos si la
  interfaz aclara que la reserva es la confirmación definitiva.
- `[S]` Redis y OpenSearch reducirán suficiente carga para justificar su costo. OpenSearch
  podrá omitirse en la primera versión si PostgreSQL cubre el catálogo.
- `[S]` Redis podrá reducirse fuera del pico porque sus datos se reconstruirán desde fuentes
  durables.
- `[V]` Las notificaciones de expiración de Redis pueden perderse. Por eso no garantizan por
  sí solas la liberación de reservas. Fuente:
  [documentación de Redis](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/).

### Alternatives

1. **PostgreSQL para operaciones y consultas.** Ofrece una sola fuente de datos y menor
   complejidad, pero las búsquedas y mapas compiten con las reservas durante el pico.
2. **Redis como autoridad del inventario.** Reduce la latencia, pero una pérdida o diferencia
   en memoria puede afectar el aforo, la expiración o la titularidad.
3. **PostgreSQL con control optimista para todos los casos.** Evita esperas cuando hay pocas
   colisiones, pero produce muchos rechazos y reintentos cuando varias personas eligen la
   misma silla. Tampoco separa las consultas.
4. **Permitir sobreventa y corregir después.** Favorece la disponibilidad, pero contradice
   el requisito de cero sobreventas y una sola titularidad válida. Una devolución no
   corrige una infracción de aforo o doble titularidad.
5. **CQRS con PostgreSQL como autoridad y Redis/OpenSearch para consultas.** Protege las
   operaciones críticas y descarga las lecturas. A cambio, duplica datos y exige actualizar,
   reconstruir y comparar las copias de consulta.

### Decision

Se adopta la alternativa 5. PostgreSQL será la única fuente válida para reservar, liberar,
vender, transferir y anular boletas. Las operaciones serán cortas, atómicas y repetibles sin
duplicar resultados.

Para una silla numerada se usará una actualización condicionada por estado y versión, junto
con una restricción que impida dos asignaciones activas. Para una localidad general se usará
un contador que solo aumente si todavía existe capacidad. Cada reserva tendrá estado, fecha
de vencimiento y versión en almacenamiento durable.

Redis mantendrá sesiones y disponibilidad aproximada. OpenSearch podrá atender búsqueda y
filtros. Estas copias se actualizarán desde cambios ya confirmados en PostgreSQL y podrán
reconstruirse. Antes de iniciar el pago, la reserva siempre se confirmará en PostgreSQL.

### Justification

- PostgreSQL rechaza una reserva cuando no existe capacidad y garantiza cero boletas por
  encima del aforo.
- La combinación de estado, versión y restricción única garantiza que solo una operación
  obtenga la silla y que exista un único titular válido.
- La fecha de vencimiento y un proceso durable permiten liberar reservas aunque Redis pierda
  una notificación, dentro del límite de 10 minutos.
- Redis y OpenSearch reciben el tráfico de consulta; PostgreSQL conserva capacidad para las
  operaciones de compra y los pagos iniciados.
- Las copias de consulta no contienen historia irremplazable y pueden reconstruirse para
  conservar la historia de la boleta durante 24 meses.
- El control de admisión y la separación de lecturas permiten comprobar la reserva con P95
  de máximo 2 segundos y error técnico menor al 1%.
- Se evita dividir PostgreSQL antes de demostrar que es necesario, lo que reduce costo y
  complejidad.
- Se acepta que la pantalla muestre durante unos segundos una silla que otra persona acaba
  de tomar. La reserva, no la consulta, entrega la respuesta definitiva.

### Implications

**Consecuencias positivas**

- PostgreSQL resuelve cualquier diferencia entre las fuentes de datos.
- Cada tipo de inventario usa una regla adecuada a su naturaleza.
- Redis y OpenSearch pueden reconstruirse sin cambiar ventas confirmadas.
- Una reserva vence sin depender del navegador ni de una notificación de Redis.

**Costos y riesgos**

- Habrá datos duplicados y un retraso breve en la disponibilidad visible.
- El equipo debe operar actualización, reconstrucción y comparación de las copias de
  consulta.
- Una consulta mal diseñada puede aumentar bloqueos y esperas en PostgreSQL.
- OpenSearch agrega costo y podrá aplazarse si no aporta valor suficiente.
- Una copia fría no puede devolver de golpe todas las consultas a PostgreSQL.

**Validaciones obligatorias**

- Probar doble clic, reintento, 100 usuarios sobre la misma silla, agotamiento de localidad,
  caída de Redis, copia atrasada, reserva vencida y recuperación del proceso de liberación.
- Medir conflictos, duración de bloqueos, retraso de las copias, reservas vencidas sin
  liberar y diferencias detectadas.
- Verificar que ningún pago comience con una reserva existente solo en Redis.

**Costo de reversión:** medio mientras las copias sean descartables; alto si se incorpora
lógica de negocio exclusiva en ellas.

**Revisar si:** PostgreSQL impide completar al menos el 99% de los pagos iniciados bajo
saturación o la reserva supera P95 de 2 segundos, la tasa de conflictos supera el umbral acordado,
el costo mínimo de Redis/OpenSearch rompe el modelo financiero o una copia más simple ofrece
el mismo resultado.

### Participants

Alejo, Lina, Quinnie

### Date

2026-09-16

## Hoja ADR0003

### ID

AD-0003

### The architectural decision

Seguridad por capas en el borde, admisión firmada e identidad aislada

### Status

Aceptado

### Problem/Issue

Durante una venta masiva llegan usuarios reales, solicitudes repetidas, recolectores
automáticos, bots de reventa y ataques. Si el sistema los identifica dentro del servicio de
compra, ya consumieron recursos críticos. Un bloqueo basado solo en la dirección IP también
puede rechazar familias, universidades o usuarios de una misma red móvil.

El sistema, además, tratará datos personales. Propagarlos por inventario, eventos, cachés o
registros aumenta la exposición y dificulta controlar quién los consulta y para qué.

### Context

La seguridad debe proteger la equidad de la fila, los pagos iniciados, la disponibilidad y
la privacidad sin crear barreras innecesarias para compradores legítimos. La Ley 1581 exige
autorización y medidas de protección para el tratamiento de datos personales. La boleta
puede ser nominal y el promotor solo debe recibir información autorizada.

La decisión debe hacer que el 100% de los turnos siga la política publicada y pueda
reconstruirse; permitir que al menos el 99% de los pagos iniciados termine bajo saturación;
mantener 99,9% de disponibilidad durante la ventana y un costo máximo de COP $150 por
boleta; y reconstruir las ventas durante 24 meses sin exponer datos personales.

Además, las pruebas deben aceptar cero operaciones con tokens inválidos, vencidos o
repetidos; el 100% de los datos sensibles debe estar cifrado en tránsito y reposo, el 100%
de los accesos privilegiados debe quedar auditado y TicketRight debe almacenar cero PAN o
CVV de tarjetas.

### Assumptions

- `[S]` Una parte relevante de la demanda será automatizada o repetida. TicketRight todavía
  no tiene una medición propia.
- `[S]` Cinco solicitudes por segundo por usuario autenticado serán un punto inicial. El
  límite cambiará según la operación y los resultados de las pruebas.
- `[S]` La mayoría de las ventas cotidianas podrá admitir al usuario sin espera, aunque la
  decisión quedará registrada.
- `[S]` Tres minutos serán suficientes para usar el token de admisión. La sesión de compra
  tendrá su propio vencimiento.
- `[S]` Nombre, documento, correo y teléfono serán el mínimo para una boleta nominal. Cada
  dato adicional necesitará una finalidad documentada.
- `[V]` La Ley 1581 exige autorización previa e informada.
- `[S]` TicketRight será responsable de sus propios usos de los datos y el promotor de los
  suyos. Esta interpretación debe validarse con una persona competente en asuntos jurídicos.
- `[S]` Los servicios administrados de identidad, firewall y llaves reducirán el riesgo,
  pero su costo debe respetar el máximo de COP $150 por boleta y su dependencia debe
  evaluarse.

### Alternatives

1. **Controles en cada servicio y datos personales en la base de ventas.** Requiere menos
   infraestructura, pero el abuso llega al núcleo, las reglas se duplican y una credencial
   comprometida expone más información.
2. **CDN, WAF y límites solo por IP, con identidad compartida con Ventas.** Detiene ataques
   conocidos, pero la IP no representa a una persona y no reduce la exposición de datos.
3. **Delegar borde, fila e identidad a un proveedor.** Aporta capacidades especializadas,
   pero crea dependencia en rutas críticas, costo sin validar y menor control sobre la
   política de equidad.
4. **Seguridad por capas, identidad federada, token de admisión y datos personales
   aislados.** Detiene abuso temprano, combina varias señales y limita la propagación de
   datos. A cambio, integra más controles y puede producir falsos positivos.

### Decision

Se adopta la alternativa 4. Una CDN servirá archivos estáticos. Un firewall de aplicaciones
web filtrará patrones conocidos y un API Gateway será la única entrada a las APIs públicas.
Los límites de uso combinarán usuario, token de admisión, dispositivo, reputación e IP. El
riesgo medio recibirá un reto o un límite menor; el riesgo alto comprobado será bloqueado.

La autenticación se delegará a un proveedor que use estándares abiertos. TicketRight
mantendrá la autorización del negocio, los consentimientos y la auditoría. La sala emitirá
un token firmado, corto, ligado al usuario, evento y sesión. El token permite intentar una
reserva, pero no garantiza inventario.

Los datos personales tendrán un almacén y credenciales propios. Los otros servicios usarán
un identificador opaco. TicketRight no guardará números ni códigos de seguridad de tarjetas;
conservará solo la referencia entregada por la pasarela. Los datos estarán cifrados en
tránsito y almacenamiento, y cada acceso humano será limitado y auditado.

### Justification

- La fila y el token firmado pesan más que la cantidad de actualizaciones del navegador, lo
  que permite demostrar el orden del 100% de los turnos.
- La CDN, el firewall y el gateway detienen tráfico antes de que compita con inventario y
  pago, y ayudan a completar al menos el 99% de los pagos iniciados y mantener 99,9% de
  disponibilidad durante la ventana.
- Servir archivos y rechazar abuso en el borde ayuda a mantener la infraestructura en
  máximo COP $150 por boleta vendida.
- Separar los datos personales limita el impacto de una credencial comprometida y facilita
  registrar la finalidad de cada acceso.
- Firma, expiración, uso lógico único, cifrado y auditoría permiten comprobar cero tokens
  inválidos aceptados y protección completa de los datos sensibles.
- La pasarela procesa los datos de tarjeta y reduce la información sensible dentro de
  TicketRight.
- El mismo token protege el proceso cotidiano y el masivo. Solo cambia si se entrega de
  inmediato o después de la fila.
- Se acepta que algunos usuarios legítimos deban resolver un reto. La tasa de falsos
  positivos se medirá y será condición de revisión.

### Implications

**Consecuencias positivas**

- El tráfico estático y parte del tráfico hostil no llegan al núcleo.
- Un token robado tiene duración, destino y alcance limitados.
- Inventario, eventos y observabilidad usan identificadores opacos.
- Una caída de identidad después de autenticar no cancela un pago que ya está en curso.

**Costos y riesgos**

- La integración de CDN, firewall, gateway, identidad, llaves y consentimiento agrega
  configuración y puntos de fallo.
- Los controles pueden afectar redes compartidas o herramientas de accesibilidad.
- Separar identidad elimina consultas directas y exige interfaces autorizadas.
- Los servicios administrados generan dependencia y un costo base fuera del pico.

**Validaciones obligatorias**

- Probar token vencido, firma inválida, repetición, rotación de llaves, bot distribuido,
  usuarios detrás de una misma red y caída del proveedor de identidad.
- Confirmar que registros, eventos, métricas y trazas no contengan nombres, documentos,
  correos, teléfonos, tokens completos ni datos de tarjeta.
- Medir solicitudes bloqueadas, retos superados, falsos positivos, tokens reutilizados y
  tráfico que llega al proceso de compra.
- Validar con una persona competente la responsabilidad sobre los datos, las
  finalidades, el consentimiento y la retención conforme a la Ley 1581.

**Costo de reversión:** medio si se conservan estándares abiertos; alto si la detección se
acopla a señales de un proveedor o si los datos personales se mezclan con otros almacenes.

**Revisar si:** los falsos positivos reducen la conversión, el costo base incumple el modelo
financiero, la revisión jurídica cambia las reglas o el token puede reutilizarse para
acaparar inventario.

### Participants

Alejo, Lina, Quinnie

### Date

2026-09-16

## Hoja ADR0004

### ID

AD-0004

### The architectural decision

Arquitectura híbrida con Space-Based bajo demanda y núcleo transaccional

### Status

Aceptado

### Problem/Issue

TicketRight debe recibir decenas de miles de usuarios en pocos segundos, asegurar que el
aforo y la titularidad sean exactos y continuar una venta aunque la pasarela responda tarde.
Una solución enfocada solo en velocidad puede comprometer el inventario; una enfocada solo
en consistencia puede colapsar ante las consultas; y una enfocada solo en disponibilidad
puede mantener costos de pico durante todo el mes.

### Context

La arquitectura debe equilibrar consistencia, absorción del pico, aislamiento de fallas,
costo y capacidad operativa de un equipo de tres personas. Debe garantizar cero
sobreventas, una sola titularidad válida, turnos conformes y reconstruibles, conciliación
en máximo 15 minutos, liberación de reservas en máximo 10 minutos, al menos 99% de pagos
iniciados finalizados bajo saturación, trazabilidad por 24 meses, costo máximo de COP $150
por boleta y disponibilidad mínima de 99,9% durante la ventana.

También debe alcanzar P95 de máximo 1 segundo para consultar posición y 2 segundos para
confirmar o rechazar una reserva; aceptar cero tokens inválidos; proteger y auditar todos
los datos sensibles; y permitir cambiar una política de venta sin modificar contratos de
inventario y pago ni interrumpir ventas activas.

Space-Based reduce la presión sobre la base durante picos y Event-Driven separa procesos y
contiene fallas. Ambos aumentan la complejidad, por lo que se aplicarán solo donde resuelven
una necesidad medible.

### Assumptions

- `[S]` La prueba de referencia tendrá 30.000 usuarios concurrentes en 60 segundos para
  5.000 boletas. El equipo debe ratificar esta condición.
- `[S]` Las consultas de catálogo, mapas, posición y disponibilidad serán mucho más
  numerosas que las reservas y los pagos.
- `[V]` El aforo autorizado no se puede exceder.
- `[V]` La pasarela de pago y el control de acceso son dependencias externas.
- `[S]` El equipo puede operar cinco capacidades de negocio de grano grueso, pero no una
  colección amplia de servicios pequeños.
- `[S]` La disponibilidad visible puede atrasarse unos segundos si la reserva entrega la
  respuesta definitiva.
- `[S]` La mayoría de los eventos funcionará sin una fila visible. El promotor clasificará
  la demanda esperada y las métricas podrán activar un modo de emergencia.

### Alternatives

1. **Monolito modular con una base relacional.** Es la opción más sencilla y económica,
   pero fila, consultas y pagos compiten con el inventario, y todo el sistema debe crecer
   para atender el pico.
2. **Servicios separados con llamadas síncronas.** Permiten escalar por dominio, pero la
   compra depende de una cadena de red y aumenta los puntos de fallo y la operación.
3. **Space-Based en todo el sistema.** Ofrece baja latencia y alto crecimiento horizontal,
   pero convierte la memoria distribuida en autoridad del aforo y la titularidad. También es
   la opción más costosa y compleja.
4. **Event-Driven para todas las operaciones.** Desacopla y absorbe ráfagas, pero la reserva
   necesita una respuesta definitiva antes del pago. Una respuesta posterior permitiría
   conflictos u obligaría a compensar una sobreventa.
5. **Arquitectura híbrida selectiva.** Usa memoria distribuida para fila y consultas,
   PostgreSQL para inventario, CQRS para separar consultas y eventos después de reservar.
   Conserva las garantías, pero exige copias de datos, contratos, seguimiento y
   reconciliación.

### Decision

Se adopta la alternativa 5. El nombre común en documentos y diagramas será **arquitectura
híbrida Event-Driven con Space-Based bajo demanda, núcleo transaccional y CQRS**.

La sala, las sesiones y la disponibilidad aproximada usarán una zona distribuida en
memoria. PostgreSQL será la única autoridad para reservar, vender y transferir boletas. Las
consultas usarán copias reconstruibles. Pago, emisión, conciliación y notificaciones se
conectarán mediante eventos durables después de confirmar la reserva.

Los componentes se separarán por capacidad de negocio solo cuando necesiten crecer,
desplegarse o fallar de manera independiente. Las funciones administrativas podrán seguir
en un monolito modular. La arquitectura lógica será la misma en operación cotidiana y en
venta masiva; solo cambiarán la capacidad activa y el uso visible de la fila.

### Justification

- PostgreSQL garantiza cero boletas por encima del aforo y una sola titularidad válida.
- La zona en memoria absorbe la fila y las consultas sin convertirlas en autoridad de la
  boleta; el registro durable conserva el orden de todos los turnos y la preparación previa
  sostiene 99,9% de disponibilidad durante la ventana.
- Separar admisión, inventario y pago permite reducir primero las consultas y los nuevos
  ingresos, y conservar recursos para finalizar al menos 99% de los pagos iniciados.
- Los eventos durables y la SAGA registran y reanudan cada paso para resolver discrepancias
  en máximo 15 minutos y reconstruir la venta durante 24 meses.
- La capacidad alta se activa alrededor de una venta masiva, lo que apoya el límite de costo
  de COP $150 por boleta vendida.
- La fila y las consultas rápidas permiten medir P95 de 1 segundo para posición y 2 segundos
  para reserva.
- El borde, la admisión firmada y la identidad aislada rechazan tokens inválidos y protegen
  datos sensibles.
- Las políticas de venta se aíslan de los contratos de inventario y pago para cambiarlas sin
  interrumpir ventas activas.
- Se evita dividir el sistema en más servicios de los que el equipo puede operar.
- Se acepta menor simplicidad y un retraso breve en las consultas porque esas consecuencias
  se pueden corregir; exceder el aforo o perder la relación dinero-boleta no.

### Implications

**Consecuencias positivas**

- La fila y las consultas no compiten directamente con las transacciones de inventario.
- La caída de búsqueda, analítica o notificaciones no impide terminar una compra iniciada.
- Redis y OpenSearch pueden reconstruirse sin cambiar la propiedad de una boleta.
- Cada capacidad puede crecer según su carga.
- Los eventos cotidianos no mantienen capacidad de pico todo el mes.

**Costos y riesgos**

- Habrá datos duplicados y un retraso breve en las consultas.
- Se necesitan contratos de eventos, controles contra duplicados, seguimiento entre
  servicios y procesos de comparación de datos.
- PostgreSQL, Redis, Kafka y OpenSearch pueden superar el presupuesto y la capacidad
  operativa del equipo.
- Los cambios entre operación cotidiana y pico agregan estados, alarmas y riesgo de
  clasificación incorrecta.
- Se requiere automatizar despliegues y pruebas de concurrencia y recuperación.

**Validaciones obligatorias**

- Ratificar los doce umbrales de calidad descritos en este ADR y la volumetría.
- Probar concurrencia, pérdida y reconstrucción de las copias de consulta, fallas parciales
  y cambios entre los perfiles cotidiano, preparación, pico y recuperación.
- Comparar el costo completo de la arquitectura, no solo el cómputo durante el pico.
- Mantener en la arquitectura de referencia capacidades sin marcas de proveedor y mostrar
  tecnologías concretas solo en la arquitectura de implementación.

**Costo de reversión:** medio durante el modelamiento; alto después de implementar eventos y
copias de consulta.

**Revisar si:** un monolito modular completa al menos 99% de los pagos iniciados bajo
saturación, mantiene la infraestructura en máximo COP $150 por boleta y alcanza 99,9% de
disponibilidad durante la ventana; si el costo mínimo supera el presupuesto, la zona
Space-Based no puede prepararse a tiempo o el equipo no puede operar los cambios de perfil.

### Participants

Alejo, Lina, Quinnie

### Date

2026-09-16

## Hoja ADR0005

### ID

AD-0005

### The architectural decision

Activación bajo demanda de la sala Space-Based y escalado elástico

### Status

Aceptado

### Problem/Issue

La demanda puede llegar en menos tiempo del que tarda el sistema en detectar carga, iniciar
nuevas instancias y dejarlas listas. El escalado reactivo actúa cuando los usuarios ya
sienten la saturación. Mantener la capacidad máxima todo el mes evita ese retraso, pero
aumenta el costo. Además, agregar servidores de aplicación sin limitar las reservas puede
enviar más trabajo a PostgreSQL y empeorar la contención.

### Context

Las ventas masivas tienen una hora de apertura conocida. TicketRight necesita preparar la
capacidad antes de esa hora, conservar a la mayoría de los usuarios fuera del núcleo y
admitir solo el volumen que inventario y pago puedan procesar. La solución debe mantener una
fila reconstruible, proteger pagos en curso, cumplir el costo por boleta y sostener la
disponibilidad de la ventana.

La sala de espera aplica Space-Based: el estado operativo vive en memoria distribuida y
trabajadores paralelos atienden a la multitud sin consultar PostgreSQL.

### Assumptions

- `[S]` La carga objetivo es 30.000 usuarios en 60 segundos para 5.000 boletas.
- `[S]` La hora de apertura se conoce y el promotor la configurará con antelación.
- `[S]` El promotor marcará cada evento como cotidiano o de alta demanda. La plataforma
  podrá elevarlo a emergencia según solicitudes, latencia o errores.
- `[S]` La preparación empezará 30 minutos antes y la capacidad alta durará tres horas.
  Estos valores se ajustarán con pruebas y costos.
- `[S]` Actualizar la posición cada 10 a 15 segundos no perjudicará la percepción de
  equidad.
- `[S]` La tasa inicial de admisión se calculará con la capacidad segura medida del núcleo.
- `[V]` El escalador de Kafka de KEDA usa el trabajo pendiente del grupo consumidor y el
  número de particiones limita el paralelismo. Fuente:
  [documentación de KEDA](https://keda.sh/docs/latest/scalers/apache-kafka/).
- `[S]` El costo conjunto de contenedores, Kafka, Redis y PostgreSQL con alta disponibilidad
  será máximo COP $150 por boleta vendida. `PENDIENTE: calcular el total.`

### Alternatives

1. **Capacidad fija para el pico, sin sala.** Evita el arranque en frío, pero paga recursos
   ociosos y permite que toda la ráfaga llegue al inventario.
2. **Escalado solo por CPU y memoria.** Es estándar y fácil de observar, pero reacciona
   después de la llegada de la carga y no limita el trabajo enviado a PostgreSQL.
3. **Funciones bajo demanda para toda la venta.** Cobran por uso, pero pueden tener demoras
   de inicio y límites del proveedor. Muchas funciones también pueden saturar el inventario.
4. **Sala de espera administrada por un proveedor.** Reduce desarrollo propio, pero agrega
   costo, dependencia y menor control sobre la evidencia de equidad.
5. **Space-Based bajo demanda, preparación programada, KEDA y límite de admisión.** Absorbe
   la multitud fuera de PostgreSQL y reduce capacidad fuera del pico. A cambio, necesita
   Redis, un registro durable, calendario, métricas y pruebas de cambio y recuperación.

### Decision

Se adopta la alternativa 5. La sala de espera distribuida será una capacidad selectiva, no
el modo permanente de operación. En eventos cotidianos registrará la admisión y entregará el
token de inmediato. En ventas masivas mantendrá la fila en Redis y conservará la secuencia
en un registro durable que permita reconstruirla.

La preparación programada será el mecanismo principal porque la apertura se conoce. KEDA
ajustará trabajadores según el trabajo pendiente, pero no abrirá por sí solo el ingreso al
núcleo. Una válvula limitará la admisión según la capacidad segura de inventario y pago, y
la reducirá cuando aumenten la latencia o los errores.

La operación tendrá cuatro perfiles: cotidiano, preparación, pico y recuperación. Un pico
inesperado activará emergencia: primero se cerrarán nuevas admisiones, luego se preparará la
sala y finalmente se reabrirá el ingreso de forma controlada.

### Justification

- La capacidad se verifica antes de abrir y se distribuye entre zonas de fallo, lo que
  permite alcanzar al menos 99,9% de disponibilidad durante la ventana.
- La capacidad masiva solo se activa alrededor de la ventana y tiene un límite, lo que
  ayuda a mantener la infraestructura en máximo COP $150 por boleta vendida.
- El registro durable conserva la secuencia y Redis acelera su consulta sin poder cambiarla,
  de modo que el 100% de los turnos puede explicarse y la venta puede reconstruirse durante
  24 meses.
- La válvula reduce nuevos ingresos si inventario o pago se degradan. Los pagos iniciados
  conservan recursos para que al menos 99% alcance un resultado final bajo saturación.
- La fila en memoria y la admisión controlada permiten medir P95 de máximo 1 segundo para
  consultar posición y 2 segundos para confirmar o rechazar una reserva.
- El token firmado, corto y de uso lógico único permite comprobar cero tokens inválidos,
  vencidos o repetidos aceptados.
- En operación cotidiana, la fila funciona en paso directo y Redis conserva el mínimo
  seguro.
- Se acepta pagar capacidad antes de la apertura y mostrar una posición con algunos segundos
  de retraso porque perder el primer minuto o saturar el inventario tendría mayor impacto.

### Implications

**Consecuencias positivas**

- La multitud no determina directamente la carga de PostgreSQL.
- Una falla de catálogo o fila puede detener nuevas admisiones sin cancelar pagos en curso.
- El sistema usa la hora de apertura y también puede responder a picos inesperados.
- La fila puede reconstruirse si Redis se pierde.
- Los eventos cotidianos usan el mismo proceso de compra sin mantener capacidad masiva.

**Costos y riesgos**

- Un horario mal configurado puede dejar la venta sin capacidad preparada.
- Una clasificación equivocada obliga a entrar en emergencia y reduce temporalmente la
  admisión.
- Redis y el registro durable deben compararse; la posición mostrada puede ser aproximada.
- KEDA no crea capacidad ilimitada: debe respetar particiones, conexiones y límites de
  terceros.
- La operación en varias zonas y los servicios administrados pueden superar COP $150 por
  boleta vendida.

**Validaciones obligatorias**

- La venta no abrirá hasta verificar gateway, fila, PostgreSQL, Redis y bus de eventos.
- Probar pico programado, cambio de hora, pico inesperado, caída de un trabajador, pérdida
  de Redis, acumulación de eventos y saturación deliberada de PostgreSQL.
- Probar los cambios entre cotidiano, preparación, pico y recuperación, y evitar el regreso
  a cotidiano mientras exista trabajo crítico.
- Medir usuarios en fila, antigüedad del primer turno, tasa de admisión, trabajo pendiente,
  capacidad lista, latencia de reserva, pagos protegidos y costo por boleta.

**Costo de reversión:** medio mientras la fila use contratos portables; alto si el token o
el orden dependen de un proveedor especializado.

**Revisar si:** el costo mínimo o de pico supera COP $150 por boleta, la preparación no
permite alcanzar 99,9% de disponibilidad durante la ventana, la transición de emergencia
pierde solicitudes, la fila no se reconstruye por completo o una plataforma administrada
reduce el riesgo con un costo aceptable.

### Participants

Alejo, Lina, Quinnie

### Date

2026-09-16
