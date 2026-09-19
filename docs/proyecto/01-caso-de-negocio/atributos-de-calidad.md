# Atributos de calidad de TicketRight

## Propósito del documento

Este documento define **cómo debe comportarse TicketRight**, además de indicar qué funciones
ofrece. Por ejemplo, «reservar una boleta» es una función; «impedir que dos personas reserven
la misma boleta, aun cuando ambas lo intenten al mismo tiempo» es una exigencia de calidad.

Los atributos se expresan como **escenarios verificables** porque la arquitectura no puede
evaluarse con adjetivos como «rápida», «segura» o «escalable». Para cada escenario se indica:

- **estímulo:** qué situación debe soportar el sistema;
- **entorno:** en qué condición ocurre, por ejemplo, operación normal, alta demanda o fallo;
- **respuesta:** qué debe hacer el sistema; y
- **medida:** el resultado observable que permite aprobar o rechazar una prueba.

Esta estructura separa el resultado verificable de las tácticas que se elijan para
conseguirlo y satisface la evidencia de «estímulo, respuesta y medida» exigida por la
[rúbrica de arquitectura de referencia](../02-modelamiento/rubrica.md#3-arquitectura-de-referencia).

Los atributos **no prescriben una tecnología**. Las secciones «Implicaciones para la
solución» explican qué capacidades debe incorporar la implementación, pero las decisiones
concretas y sus alternativas permanecen en los ADR. Esta separación evita confundir el
resultado requerido con el mecanismo elegido para alcanzarlo.

## Estado y reglas de interpretación

- Los objetivos numéricos se marcan `[S]` porque son compromisos propuestos por el equipo,
  no resultados ya demostrados. Deben ratificarse antes de presentar la Entrega 2 y medirse
  durante la Entrega 3.
- Las obligaciones respaldadas por el caso de negocio o por una fuente legal se marcan
  `[V]`. Esto verifica la necesidad, **no** demuestra que la solución ya la cumpla.
- «Cero» significa que una sola ocurrencia incumple el atributo; no significa que una
  prueba pueda demostrar matemáticamente la ausencia de fallos futuros.
- La pasarela de pagos y otros terceros están fuera del control de TicketRight. Los
  escenarios evalúan cómo responde TicketRight ante su lentitud, duplicidad o caída, no la
  disponibilidad interna del tercero.
- Los códigos A-1 a A-12 son el índice de este catálogo. En los ADR y en los demás
  entregables cada atributo se cita con su código **y** su nombre —`A-2 · cero boletas sobre
  el aforo`— la primera vez que aparece en cada documento y, cuando la decisión depende de
  él, con su umbral; en las menciones siguientes del mismo documento basta el código. Así
  se entiende sin consultar este catálogo y sigue siendo trazable.

`PENDIENTE: el equipo debe ratificar cada umbral marcado [S] y registrar cualquier cambio
antes de cerrar la arquitectura de referencia.`

## Vista general

Los nombres de la segunda columna corresponden a categorías habituales en ingeniería de
software. La tercera columna las traduce al problema concreto de TicketRight.

| ID | Atributo de ingeniería | Qué significa en TicketRight | Umbral principal `[S]` |
|---|---|---|---|
| A-1 | Confiabilidad y consistencia | Un pago confirmado termina asociado a una boleta o a una compensación explícita | Cero discrepancias abiertas al cierre; cierre automático en ≤ 15 min |
| A-2 | Integridad de datos | El sistema nunca vende por encima del aforo autorizado | Cero boletas emitidas sobre el aforo |
| A-3 | Integridad y unicidad | Una boleta solo tiene un titular válido a la vez | Cero titularidades válidas simultáneas |
| A-4 | Equidad y auditabilidad | La fila aplica la política publicada y puede demostrarlo | 100% de turnos conformes y reconstruibles |
| A-5 | Recuperabilidad del inventario | Una reserva abandonada no bloquea indefinidamente una boleta | Liberación en ≤ 10 min |
| A-6 | Resiliencia y degradación controlada | La saturación protege las compras ya iniciadas antes de aceptar trabajo nuevo | ≥ 99% de pagos iniciados completados |
| A-7 | Eficiencia de costos | La capacidad para el pico no vuelve inviable cada venta | ≤ COP $150 de infraestructura por boleta vendida |
| A-8 | Trazabilidad | Una venta puede reconstruirse de principio a fin | 100% de ventas; retención de 24 meses |
| A-9 | Disponibilidad | La plataforma está operativa cuando la venta lo requiere | ≥ 99,9% durante la ventana declarada |
| A-10 | Rendimiento | La fila y la reserva responden a tiempo bajo la carga objetivo | Posición P95 ≤ 1 s; reserva P95 ≤ 2 s |
| A-11 | Seguridad y privacidad | Solo actores autorizados acceden a datos y operaciones permitidas | Cero accesos aceptados con credenciales inválidas; 100% de datos sensibles protegidos y accesos auditados |
| A-12 | Modificabilidad y desplegabilidad | Una nueva política de venta no obliga a cambiar inventario ni pagos | Un módulo funcional afectado; cero cambios en contratos de inventario y pago; cero interrupción de ventas activas |

No se incluyen todos los atributos posibles de un sistema de software. Se priorizan los que
son **arquitectónicamente significativos** para este negocio: alta concurrencia concentrada,
inventario finito, dinero, datos personales, dependencias externas, costo variable y un
equipo pequeño. La usabilidad y la accesibilidad deberán aparecer como criterios del
prototipo, pero aún no existe información validada para convertirlas en compromisos
arquitectónicos numéricos.

## Escenarios de calidad

### A-1 — Confiabilidad de la relación entre pago y boleta

**En palabras simples.** Si la pasarela confirma un cobro, TicketRight no puede perder esa
respuesta ni dejar al comprador indefinidamente sin boleta. Cada pago debe terminar en uno
de dos estados explícitos: boleta emitida o compensación gestionada.

**Por qué importa.** El caso de negocio nace de los cobros sin boleta y de la pérdida de
confianza que producen. La plataforma depende de una pasarela externa que puede responder
tarde, dos veces o fuera de orden.

| Parte del escenario | Definición |
|---|---|
| Estímulo | La pasarela confirma, repite o entrega tarde la respuesta de un pago mientras la emisión falla o el proceso se reinicia. |
| Entorno | Operación normal, alta demanda, recuperación después de una caída o reproceso manual controlado. |
| Respuesta esperada | TicketRight reconoce una sola vez la respuesta, conserva el estado de la compra y reanuda la emisión o la compensación sin duplicar cobros ni boletas. |
| Medida `[S]` | Al cierre del día hay **cero discrepancias abiertas**. Toda discrepancia detectada se resuelve automáticamente en **≤ 15 minutos** desde la respuesta de la pasarela. |

**Implicaciones para la solución.** Se necesita un estado durable de la venta, operaciones
idempotentes, reintentos limitados, conciliación y una ruta visible para los casos que no
puedan procesarse automáticamente. La implementación debe medir la edad de la discrepancia
más antigua y alertar antes de incumplir los 15 minutos. La decisión y sus alternativas se
documentan en [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md).

**Prueba mínima.** Simular una respuesta duplicada, una respuesta tardía y una caída entre
el cobro y la emisión; verificar que existe una sola boleta o compensación y que el caso se
cierra dentro del umbral.

### A-2 — Integridad del aforo

**En palabras simples.** TicketRight puede rechazar una compra cuando se agota una localidad,
pero nunca puede crear una boleta adicional sobre el límite autorizado.

**Por qué importa.** `[V]` El aforo es una restricción legal y operativa del evento, no una
preferencia de interfaz. El promotor configura el límite y TicketRight debe preservarlo aun
cuando muchas personas compitan por las últimas boletas. Fuente:
[validación de aforo y datos personales](validaciones.md#validación-4--aforo-y-datos-personales).

| Parte del escenario | Definición |
|---|---|
| Estímulo | Muchos compradores intentan reservar simultáneamente la misma silla o las últimas unidades de una localidad. También pueden existir reintentos, dobles clics o despliegues durante la operación. |
| Entorno | Carga normal, pico, fallo parcial y recuperación. |
| Respuesta esperada | El sistema acepta únicamente las reservas que caben en el aforo y rechaza las demás de forma explícita; una proyección o caché nunca puede autorizar la emisión. |
| Medida `[S]` | **Cero** boletas emitidas por encima del aforo configurado, en el **100%** de los eventos y escenarios de prueba. |

**Implicaciones para la solución.** Debe existir una única autoridad transaccional del
inventario y una operación atómica para reservar. Las vistas rápidas pueden estar atrasadas,
pero la confirmación final no. La solución propuesta está en
[AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md).

**Prueba mínima.** Enfrentar cien solicitudes concurrentes a una sola silla y agotar una
localidad general; comprobar que la cantidad de reservas y emisiones nunca supera el límite.

### A-3 — Unicidad de la titularidad de una boleta

**En palabras simples.** Una boleta puede cambiar de dueño por transferencia o reventa, pero
en ningún instante puede habilitar simultáneamente a dos titulares.

**Por qué importa.** La reventa autorizada es parte de la propuesta de valor y una fuente de
ingreso. Sin una titularidad inequívoca, el comprador no sabe si podrá ingresar y el recinto
no sabe qué credencial aceptar.

| Parte del escenario | Definición |
|---|---|
| Estímulo | Dos operaciones concurrentes intentan emitir, transferir, revender, anular o devolver la misma boleta. |
| Entorno | Cualquier momento del ciclo de vida, incluidos reintentos y recuperación de fallos. |
| Respuesta esperada | Solo una transición válida modifica la titularidad; las demás reciben el estado vigente y no crean un segundo derecho de entrada. |
| Medida `[S]` | **Cero** casos con dos titulares o credenciales válidas simultáneamente para la misma boleta. |

**Implicaciones para la solución.** La boleta requiere identidad única, versión y reglas
explícitas de transición. Transferir o revender debe invalidar la credencial anterior en la
misma operación lógica. La autoridad de estos cambios se define en
[AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md).

**Prueba mínima.** Ejecutar transferencias y reventas concurrentes sobre la misma boleta,
incluidos reintentos, y validar que solo una transición gana.

### A-4 — Equidad y auditabilidad de la fila

**En palabras simples.** La fila debe atender según la regla anunciada para el evento. Un
usuario no gana ventaja por recargar la página ni pierde su turno por reconectarse o porque
se despliegue una nueva versión.

**Por qué importa.** La política puede ser por orden de llegada, preventa segmentada u otra
regla acordada con el promotor. La confianza depende tanto de aplicarla como de poder
demostrar después qué ocurrió.

| Parte del escenario | Definición |
|---|---|
| Estímulo | Miles de usuarios ingresan, consultan su posición, se desconectan, reintentan o intentan automatizar el acceso. |
| Entorno | Apertura de una venta de alta demanda, reinicio de un componente o reconstrucción posterior del incidente. |
| Respuesta esperada | TicketRight asigna y conserva cada turno conforme a la política publicada, reconoce al mismo participante en sus reintentos y registra la razón de cada admisión, expiración o rechazo. |
| Medida `[S]` | El **100%** de los turnos sigue la política configurada y el **100%** puede reconstruirse después. |

**Implicaciones para la solución.** El orden debe quedar en un registro durable; la vista de
baja latencia puede reconstruirse sin inventar posiciones. La admisión necesita identidad
idempotente y un comprobante firmado, no puede depender solo de IP o de una sesión del
navegador. Véanse [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md)
y [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md).

**Prueba mínima.** Ingresar usuarios conocidos, repetir solicitudes, reiniciar la proyección
de la fila y comparar el orden final con la política y el registro original.

### A-5 — Liberación oportuna de reservas abandonadas

**En palabras simples.** Una persona que abandona la compra no puede dejar una boleta
bloqueada indefinidamente mientras otros usuarios esperan.

**Por qué importa.** El inventario es finito y la venta ocurre en una ventana corta. Una
reserva vencida que no vuelve a estar disponible reduce conversión e ingreso sin proteger a
ningún comprador.

| Parte del escenario | Definición |
|---|---|
| Estímulo | El usuario cierra el navegador, pierde conexión, no paga o el sistema se reinicia con una reserva pendiente. |
| Entorno | Operación normal, pico o recuperación. |
| Respuesta esperada | Al vencer el plazo, el sistema cambia de manera idempotente el estado de la reserva y devuelve la unidad al inventario, excepto cuando existe un pago confirmado que deba conciliarse. |
| Medida `[S]` | Toda reserva no pagada **deja de retener** inventario a los **10 minutos** exactos de su creación (`venceEn`, R3 del modelo de dominio); la liberación efectiva la ejecuta el proceso de expiración en su siguiente ciclo, **≤ 30 s** después. Una reserva con pago confirmado nunca se libera como si estuviera abandonada. |

**Implicaciones para la solución.** La expiración debe persistirse como dato de negocio y
procesarse aunque se pierda una notificación o se reinicie un worker; no puede depender de
un temporizador del navegador ni de una caché volátil. Véase
[AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md).

**Prueba mínima.** Crear reservas, detener el procesador de vencimientos, reiniciarlo y
verificar tanto la liberación dentro del plazo como la protección de una compra pagada.

### A-6 — Resiliencia y degradación controlada

**En palabras simples.** Si el sistema se satura, protege primero a quien ya está pagando.
Puede limitar el ingreso o mostrar una versión reducida del catálogo antes de perder una
compra en curso.

**Por qué importa.** Aceptar trabajo nuevo mientras fallan los pagos aumenta las
discrepancias, empeora la experiencia y desperdicia capacidad en el momento más valioso de
la venta.

| Parte del escenario | Definición |
|---|---|
| Estímulo | La demanda supera la capacidad, aumenta la latencia de una dependencia o falla un componente no crítico. |
| Entorno | Pico de venta y recuperación posterior. |
| Respuesta esperada | TicketRight reduce o detiene nuevas admisiones, limita consultas exploratorias y mantiene recursos para inventario, pagos iniciados, emisión y conciliación. |
| Medida `[S]` | Se completa correctamente **≥ 99%** de los pagos iniciados antes o durante la saturación; las nuevas admisiones y el catálogo se degradan primero. |

**Implicaciones para la solución.** Se requieren control de admisión, contrapresión,
aislamiento de recursos, tiempos de espera, circuitos de fallo y señales operativas que
permitan reducir carga antes del colapso. La estrategia se distribuye entre
[AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md),
[AD-005](../decisiones/0005-estilo-de-arquitectura.md) y
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md).

**Prueba mínima.** Saturar catálogo y admisión e introducir latencia en la pasarela; medir
por separado pagos iniciados, pagos completados, errores y solicitudes rechazadas.

### A-7 — Eficiencia de costos por boleta vendida

**En palabras simples.** TicketRight debe soportar el pico sin mantener todo el mes la
capacidad que solo utiliza durante una venta excepcional.

**Por qué importa.** El costo de infraestructura afecta directamente la viabilidad por
evento y es un resultado clave del negocio. Escalar técnicamente sin controlar el costo no
es una solución aceptable.

| Parte del escenario | Definición |
|---|---|
| Estímulo | Llegan **30.000 usuarios concurrentes en 60 segundos** para competir por **5.000 boletas**. |
| Entorno | Preparación, ejecución y recuperación de una venta de alta demanda. |
| Respuesta esperada | La plataforma activa la capacidad necesaria, controla la admisión y luego reduce recursos sin comprometer pagos o conciliaciones pendientes. |
| Medida `[S]` | El costo de infraestructura atribuible a la corrida es **≤ COP $150 por boleta vendida**. El cálculo incluye preparación, pico y recuperación, no solo los minutos de venta. |

**Implicaciones para la solución.** La implementación debe separar capacidad base y de pico,
definir techos de escalado, etiquetar costos por evento y evitar que las consultas masivas
escalen el núcleo transaccional. Véanse
[AD-005](../decisiones/0005-estilo-de-arquitectura.md) y
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md).

**Prueba mínima.** Ejecutar la volumetría declarada, registrar recursos consumidos desde el
precalentamiento hasta el drenaje final y dividir el costo calculado entre boletas vendidas.

### A-8 — Trazabilidad completa de una venta

**En palabras simples.** Ante un reclamo, TicketRight debe explicar qué ocurrió y en qué
orden, sin reconstruir la historia a partir de capturas de pantalla o registros dispersos.

**Por qué importa.** La plataforma debe resolver disputas, conciliar dinero, demostrar el
respeto del aforo y explicar decisiones de la fila. Esta evidencia también permite operar y
auditar el sistema.

| Parte del escenario | Definición |
|---|---|
| Estímulo | Soporte, conciliación, auditoría o una autoridad solicita la historia de una compra o boleta. |
| Entorno | Durante la venta o hasta 24 meses después, incluso si los datos operativos de caché ya expiraron. |
| Respuesta esperada | El sistema relaciona, en orden temporal, ingreso y admisión, reserva, pago, emisión, transferencia, reventa, anulación o compensación, con su resultado y marca de tiempo. |
| Medida `[S]` | El **100%** de las ventas de prueba puede reconstruirse sin saltos durante **24 meses**. |

**Implicaciones para la solución.** Todos los pasos necesitan identificadores de correlación,
eventos o registros durables y relojes consistentes. La auditoría de largo plazo debe estar
separada de logs efímeros y no duplicar datos personales innecesarios. Véanse
[AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) y
[AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md).

**Prueba mínima.** Seleccionar ventas exitosas, rechazadas y compensadas; reconstruirlas
usando solo la evidencia almacenada y comprobar que cada transición tiene causa y resultado.

### A-9 — Disponibilidad durante la ventana de venta

**En palabras simples.** La disponibilidad debe concentrarse cuando el negocio la necesita:
desde la apertura anunciada hasta el cierre de la venta. Una plataforma disponible todo el
mes pero caída durante esos minutos no cumple el objetivo.

**Por qué importa.** Las ventas concentran demanda e ingreso en ventanas cortas y públicas.
Fuera de ellas se acepta un objetivo menor para no pagar capacidad o redundancia sin valor.

| Parte del escenario | Definición |
|---|---|
| Estímulo | Ocurre una falla de instancia, zona, red o dependencia durante la ventana declarada. |
| Entorno | Desde el inicio de la preparación operativa hasta que terminan pagos y conciliaciones de la venta. |
| Respuesta esperada | La plataforma mantiene o recupera las funciones críticas de fila, inventario, pago y emisión; una función no crítica puede degradarse sin convertir el evento en una caída total. |
| Medida `[S]` | Disponibilidad de **≥ 99,9%**, calculada sobre el total de minutos que pertenecen a ventanas de venta declaradas durante el periodo de medición y verificada mediante solicitudes sintéticas al flujo crítico. Las pausas planificadas dentro de la ventana también cuentan como indisponibilidad. |

**Implicaciones para la solución.** La implementación debe eliminar puntos únicos de falla
en el flujo crítico, distribuir capacidad, comprobar salud real, precalentar antes de abrir
y conservar recursos hasta drenar el trabajo pendiente. El diseño se registra en
[AD-005](../decisiones/0005-estilo-de-arquitectura.md) y
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md).

**Prueba mínima.** Durante una venta de carga, retirar una réplica o dependencia simulada y
medir desde fuera del sistema si el flujo crítico continúa disponible.

### A-10 — Rendimiento de fila y reserva

**En palabras simples.** Soportar muchos usuarios no basta: los admitidos deben poder
consultar su turno y confirmar una reserva en un tiempo que no provoque recargas, dobles
clics ni abandono.

**Por qué importa.** La alta concurrencia es la condición principal del negocio. La
arquitectura propuesta separa consultas y comandos precisamente para que la multitud no
quite capacidad a la confirmación del inventario.

| Parte del escenario | Definición |
|---|---|
| Estímulo | **30.000 usuarios concurrentes llegan en 60 segundos** y consultan la fila mientras los admitidos compiten por **5.000 boletas**. |
| Entorno | Perfil de pico, con cachés precalentadas y políticas de admisión activas. |
| Respuesta esperada | Las consultas de posición se atienden sin acceder al núcleo transaccional; una solicitud de reserva recibe confirmación o rechazo definitivo sin quedar ambigua. |
| Medida `[S]` | Latencia **P95 ≤ 1 segundo** para consultar la posición y **P95 ≤ 2 segundos** para confirmar o rechazar una reserva, medidas de extremo a extremo. La tasa de error técnico de esas operaciones debe ser **< 1%**. |

**Implicaciones para la solución.** La lectura de fila y catálogo necesita proyecciones de
baja latencia; la admisión debe limitar la concurrencia que llega al inventario; y las
métricas deben separar tiempo de cola, red, aplicación y almacenamiento. Véanse
[AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md) y
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md).

**Prueba mínima.** Ejecutar la carga objetivo y reportar percentiles P50, P95 y P99 por
operación, no solo un promedio. Los rechazos por inventario agotado son respuestas válidas;
los timeouts y errores 5xx no lo son.

### A-11 — Seguridad y privacidad de datos y operaciones

**En palabras simples.** Una persona o servicio solo puede acceder a los datos y acciones
que necesita. Un token alterado, vencido o repetido no debe permitir saltarse la fila,
reservar inventario ni consultar datos personales.

**Por qué importa.** `[V]` TicketRight trata datos personales sujetos a la Ley 1581 de 2012,
procesa operaciones de valor y está expuesto a automatización abusiva durante las ventas.
La seguridad no puede reducirse al inicio de sesión. Fuente:
[validación de aforo y datos personales](validaciones.md#validación-4--aforo-y-datos-personales).

| Parte del escenario | Definición |
|---|---|
| Estímulo | Un actor presenta credenciales inválidas, altera o repite un token, intenta una operación sin permiso o accede a datos personales sin finalidad autorizada. |
| Entorno | Todos los perfiles operativos y ambientes, incluidos logs, métricas, copias y pruebas. |
| Respuesta esperada | El sistema rechaza la acción, limita intentos, registra la decisión sin exponer información sensible y alerta ante patrones de abuso. Los datos permanecen cifrados y separados según su finalidad. |
| Medida `[S]` | **Cero** operaciones aceptadas con tokens inválidos, vencidos o repetidos en las pruebas de seguridad; **100%** de los flujos con datos personales cifrados en tránsito y reposo; **100%** de los accesos privilegiados auditados. TicketRight almacena **cero** PAN o CVV de tarjetas. |

**Implicaciones para la solución.** Se requieren defensa en profundidad, autenticación y
autorización diferenciadas, identidad de servicio, secretos fuera del código, cifrado,
segmentación, datos sintéticos fuera de producción y tokenización en la pasarela. El modelo
completo y sus pendientes jurídicos están en
[AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md).

**Prueba mínima.** Probar tokens alterados, expirados y repetidos; permisos insuficientes;
secretos ausentes del repositorio; cifrado de conexiones y almacenamiento; y ausencia de
datos personales en eventos, cachés, trazas y logs que no los requieran.

### A-12 — Modificabilidad de políticas de venta

**En palabras simples.** TicketRight debe poder cambiar cómo se admite a los compradores de
un evento —por orden de llegada, preventa o una regla futura— sin reescribir la reserva, el
pago o la emisión.

**Por qué importa.** Distintos promotores y eventos requieren políticas diferentes. El
equipo inicial es pequeño y no puede asumir cambios coordinados en toda la plataforma ni
arriesgar una venta activa para configurar la siguiente.

| Parte del escenario | Definición |
|---|---|
| Estímulo | Un promotor solicita agregar o ajustar una política de admisión antes de abrir su evento. |
| Entorno | Desarrollo y despliegue mientras otros eventos pueden seguir operando. |
| Respuesta esperada | El equipo modifica la política dentro del límite funcional de admisión, conserva los contratos de inventario y pago, ejecuta regresión y despliega sin interrumpir ventas activas. |
| Medida `[S]` | El cambio afecta **como máximo un módulo funcional y su configuración/pruebas**, requiere **cero cambios** en los contratos públicos de inventario y pago, y causa **cero minutos de indisponibilidad** a ventas activas. |

**Implicaciones para la solución.** Las políticas deben estar aisladas de la autoridad del
inventario y del flujo de pago, con contratos versionados, configuración por evento y
pruebas automatizadas de las políticas existentes. Esto no obliga a crear un microservicio
por política; obliga a mantener clara la frontera de cambio. La separación propuesta se
relaciona con [AD-005](../decisiones/0005-estilo-de-arquitectura.md) y
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md).

**Prueba mínima.** Implementar una política de ejemplo o variar una existente, registrar los
archivos y componentes afectados, ejecutar la regresión de fila, inventario y pago y hacer
un despliegue mientras una venta sintética permanece activa.

## Cómo se usan en la Entrega 2

Cada artefacto debe responder una pregunta distinta:

| Artefacto | Uso de estos atributos |
|---|---|
| ADR | Explica qué atributos están en tensión, qué alternativa se elige y qué se sacrifica. |
| Arquitectura de referencia | Muestra los componentes y responsabilidades que soportan cada escenario, sin nombres de proveedor. |
| Arquitectura de implementación | Asigna tecnologías, topología, configuración, redundancia y controles concretos a esos componentes. |
| Observabilidad | Convierte las medidas en pocas métricas con umbral, alarma y responsable. |
| Volumetría y pruebas | Reproduce el estímulo y el entorno para verificar la respuesta y la medida. |
| Inyección de fallos | Comprueba A-1, A-5, A-6 y A-9 bajo respuestas tardías, reinicios y pérdida controlada de dependencias. |

Una decisión no queda justificada por decir que «mejora la escalabilidad». Debe indicar, por
ejemplo, que controla la admisión para mantener la latencia de reserva de A-10, proteger los
pagos de A-6 y respetar el costo de A-7. Del mismo modo, una tecnología no «garantiza» un
atributo por aparecer en el diagrama: el cumplimiento solo se acepta cuando una prueba
produce la medida definida aquí.

## Ratificación pendiente del equipo

Para cerrar este documento, el equipo debe confirmar o modificar explícitamente:

1. Los nueve umbrales heredados: 15 minutos, aforo y titularidad sin excepciones, 100% de
   turnos, 10 minutos de reserva, 99% de pagos, COP $150, 24 meses y 99,9%.
2. La volumetría común de **30.000 usuarios en 60 segundos y 5.000 boletas**.
3. Los nuevos umbrales de A-10: P95 de 1 y 2 segundos y error técnico menor al 1%.
4. El alcance verificable de A-11, en especial retención de datos y resultado de la revisión
   jurídica pendiente en AD-004.
5. El criterio de cambio de A-12: un módulo funcional, contratos estables y despliegue sin
   interrupción.

Hasta esa ratificación, todos estos números son metas `[S]`; no deben presentarse como
capacidad ya probada ni como dato validado del mercado.
