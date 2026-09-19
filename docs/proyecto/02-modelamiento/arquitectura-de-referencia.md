# Arquitectura de referencia de TicketRight

## Propósito y alcance

Este documento presenta la estructura lógica de TicketRight y explica cómo sus componentes
colaboran para vender boletas bajo demanda concentrada sin perder el control del aforo, del
dinero ni de la titularidad. La vista responde qué responsabilidades existen, qué interfaces
las conectan, qué reglas protegen sus fronteras y qué patrones soportan los atributos de
calidad del sistema.

La arquitectura de referencia es independiente del proveedor. Por esa razón emplea
capacidades tecnológicas —almacenamiento relacional transaccional, grilla distribuida en
memoria, mensajería durable, búsqueda indexada y orquestación de contenedores—, pero no fija
productos comerciales ni servicios de nube. Esas correspondencias pertenecen a la
arquitectura de implementación, como diferencia el [material de
clase](../../curso/clase-03-04-transcripcion.md#8-arquitectura-de-referencia-vs-arquitectura-de-implementación).

## Artefactos

- [Diagrama interactivo y exportable](arquitectura-de-referencia.html).
- [Fuente validada del diagrama](arquitectura-de-referencia.json).
- [Versión editable en Mermaid](arquitectura-de-referencia.mmd).
- [Versión XML para importar en diagrams.net](arquitectura-de-referencia.drawio).
- [Modelo de dominio relacionado](modelo-de-dominio.md).

Comprobaciones del 18 de septiembre: `validate` con perfil `standard` da 9/9 con 0 errores y
16 advertencias de composición; `visual-check` no reporta desbordamiento en 1440×900,
1600×1000, 1920×1080 ni 2048×1320. Archivos actuales: fuente `sha256 dff47b25a00ff8bd…`,
HTML `sha256 9c59018b7432e12a…`.

El diagrama adopta una notación inspirada en C4 para presentar las capacidades ejecutables,
los almacenes de datos y sus relaciones. No se declara como un diagrama C4 formal ni representa
pods, máquinas, zonas de disponibilidad o instancias concretas: cada caja expresa una
responsabilidad lógica que deberá corresponderse con uno o varios elementos desplegables en la
arquitectura de implementación.

Las tres representaciones mantienen la misma arquitectura, pero ofrecen dos niveles de lectura.
Mermaid agrupa las capacidades del backend en un bloque para conservar una vista compacta; la
vista interactiva y diagrams.net expanden ese bloque en los servicios de identidad, catálogo,
admisión, inventario, compra y boletas. Ninguna versión desciende a clases, métodos o código.

## Contenido

| Sección | Pregunta que responde |
|---|---|
| [Síntesis arquitectónica](#síntesis-arquitectónica) | ¿Cuál es la forma general de la solución? |
| [Convención del diagrama](#convención-del-diagrama) | ¿Cómo debe leerse la vista? |
| [Capas y reglas de dependencia](#capas-y-reglas-de-dependencia) | ¿Qué puede atravesar cada frontera? |
| [Componentes e interfaces](#componentes-e-interfaces) | ¿Qué responsabilidad tiene cada pieza? |
| [Flujos principales](#flujos-principales) | ¿Cómo se consultan, compran y emiten las boletas? |
| [Patrones arquitectónicos](#patrones-arquitectónicos) | ¿Qué problema resuelve cada patrón y qué costo introduce? |
| [Tecnologías de referencia](#tecnologías-de-referencia) | ¿Qué capacidades tecnológicas requiere la solución? |
| [Escenarios de calidad](#escenarios-de-calidad) | ¿Cómo se verificará que la arquitectura cumple? |
| [Trazabilidad](#trazabilidad-con-el-dominio-y-las-decisiones) | ¿Cómo se relaciona la vista con el dominio y los ADR? |
| [Alineación con prácticas de industria](#alineación-con-prácticas-de-industria) | ¿Qué estándares orientan la forma de describir y validar la solución? |

## Síntesis arquitectónica

TicketRight adopta una **arquitectura híbrida Event-Driven con Space-Based bajo demanda,
núcleo transaccional y CQRS**, de acuerdo con
[AD-005](../decisiones/0005-estilo-de-arquitectura.md). La combinación no aplica todos los
estilos a todo el sistema:

1. La **admisión y la fila** absorben la multitud mediante estado distribuido en memoria y
   procesos paralelos. Su función es ordenar y regular cuántas personas pueden intentar una
   compra; un turno nunca equivale a una reserva.
2. El **núcleo de inventario y venta** conserva la única autoridad para reservar, liberar y
   vender una boleta. Las operaciones que modifican aforo son cortas, atómicas y durables.
3. Las **consultas** usan proyecciones reconstruibles para que catálogo, mapas, disponibilidad
   aproximada y posición en fila no compitan con los comandos de inventario.
4. Después de confirmar una reserva, **pago, emisión y conciliación** avanzan mediante una
   SAGA y eventos durables. Una respuesta tardía de la pasarela no mantiene abierta una
   transacción ni convierte un *timeout* de red en una decisión sobre el dinero.
5. Identidad, seguridad, privacidad, observabilidad y auditoría son responsabilidades
   transversales. Se aplican en todas las modalidades de operación y no se desactivan cuando
   disminuye la demanda.

La misma estructura opera en cuatro perfiles: cotidiano, preparación, pico y recuperación.
Cambian la capacidad activa y la visibilidad de la fila, pero no los contratos, la autoridad
del inventario ni las reglas de negocio. Este principio evita mantener una ruta rápida para
el pico y otra distinta para la operación habitual.

## Convención del diagrama

| Elemento visual | Significado |
|---|---|
| Región con título | Capa lógica y frontera de responsabilidad. |
| Caja de componente | Contenedor lógico con una responsabilidad principal; no implica una instancia física. |
| Flecha continua | Solicitud o comando que necesita una respuesta inmediata. Las tres versiones rotulan protocolo o intención; la tabla de interfaces precisa el contrato completo. |
| Flecha discontinua | Comunicación asíncrona mediante un contrato durable. |
| Componente de datos | Fuente durable o modelo de consulta; no significa que todos los servicios compartan tablas. |
| Componente externo | Sistema con dueño y disponibilidad independientes de TicketRight. |

Las siglas del diagrama describen mecanismos arquitectónicos, no productos: **CDN** es la red
de entrega de contenido; **WAF**, el firewall de aplicaciones web; **TLS**, el cifrado de las
conexiones; **OIDC/OAuth 2.0**, los protocolos de identidad y autorización; **DLQ**, la cola que
aísla mensajes que no pudieron procesarse; **CI/CD**, la automatización de integración y entrega;
**IaC**, la definición de infraestructura como código; y **OTLP**, el protocolo para transportar
telemetría de OpenTelemetry.

El diagrama prioriza el recorrido de compra. Integraciones posteriores, como el sistema de
control de acceso del recinto, se conservan en la tabla de interfaces para evitar mezclar el
flujo de venta con el uso de la boleta en la puerta.

## Capas y reglas de dependencia

### 1. Canales

Contiene las experiencias del fan, del promotor y del equipo de operación. Los canales
presentan información, capturan intenciones y muestran estados; no deciden aforo, no calculan
liquidaciones y no consideran una respuesta visual como prueba de que una operación quedó
confirmada.

### 2. Acceso, entrega y protección perimetral

Es la única entrada a las interfaces públicas. Distribuye contenido estático, termina la
conexión segura, filtra tráfico anómalo, aplica cuotas, valida la forma básica de la solicitud
y enruta hacia la capacidad correspondiente. Puede rechazar tráfico inválido, pero no
contiene reglas como “esta silla se puede vender” o “este pago quedó conciliado”.

### 3. Servicios de aplicación y dominio

Implementa las capacidades de Oferta de eventos, Admisión e identidad, Venta y recaudo y
Derecho de asistencia definidas en el [modelo de dominio](modelo-de-dominio.md#contextos-acotados).
Los componentes se separan por responsabilidad, patrón de carga y necesidad de aislamiento,
no por cada tabla o entidad. Cada agregado se modifica únicamente a través del componente que
lo posee.

### 4. Integración y procesamiento asíncrono

El bus de eventos y las colas durables transportan hechos confirmados mediante contratos
versionados. Los procesadores asíncronos ejecutan reintentos, conciliación y actualización de
proyecciones sin bloquear la respuesta inmediata al usuario. La entrega es al menos una vez,
por lo que productores y consumidores deben usar identificadores de evento, idempotencia y
transiciones condicionales. La mensajería comunica contextos; no se convierte en la fuente
definitiva del aforo, del dinero ni de la titularidad.

### 5. Persistencia y modelos de lectura

Separa el modelo de escritura que protege invariantes de las vistas optimizadas para leer:

- la **autoridad transaccional** conserva estado durable y ejecuta las transacciones que
  confirman inventario, pagos y derechos;
- las **vistas operativas** mantienen fila, sesiones, disponibilidad aproximada, catálogo y
  búsqueda. Pueden retrasarse o reconstruirse sin cambiar una venta confirmada.

### 6. Capacidades transversales de plataforma

La plataforma de ejecución proporciona contenedores, orquestación y autoescalado para los
componentes que requieren capacidad variable. Seguridad administra secretos, cifrado y mínimo
privilegio; observabilidad centraliza métricas, logs, trazas y alertas; y la entrega automatizada
promueve artefactos versionados mediante CI/CD e infraestructura como código. Estas capacidades
soportan todas las capas, pero no contienen reglas de aforo, pago o titularidad.

### Reglas que no pueden romperse

1. Los canales solo acceden a capacidades internas a través del borde; nunca consultan
   directamente los almacenes.
2. El borde autentica, limita y enruta, pero no duplica reglas del dominio.
3. Un componente no escribe en las tablas o agregados que pertenecen a otro contexto. La
   colaboración ocurre mediante una interfaz publicada o un evento versionado.
4. Solo el Servicio de inventario y reservas, respaldado por la base de datos transaccional, puede confirmar una
   reserva y afectar el aforo. Una vista en memoria jamás autoriza el pago.
5. Ninguna transacción permanece abierta mientras el fan interactúa con la pasarela.
6. La pasarela puede responder tarde, repetido o fuera de orden. Todas sus respuestas se
   autentican y procesan de manera idempotente.
7. Los datos personales permanecen bajo el Servicio de identidad y consentimiento. Los demás componentes,
   eventos, logs y trazas utilizan identificadores opacos.
8. Las vistas de lectura reciben cambios confirmados; no publican estados aproximados de
   regreso como si fueran hechos de negocio.
9. La Plataforma de observabilidad y el archivo de auditoría reciben telemetría, pero no modifican el resultado de una
   venta ni se convierten en una dependencia para confirmar inventario.

## Componentes e interfaces

| Componente | Responsabilidad única | Interfaces que expone | Interfaces que consume |
|---|---|---|---|
| **Portal web** | Presentar la experiencia del fan y las funciones autorizadas para promotores y operación interna. | Consulta de eventos, fila, compra, boletas y funciones visibles según el rol. | Punto de entrada público y canal autorizado de tokenización de pagos. |
| **API Gateway y entrega perimetral** | Distribuir contenido, terminar TLS, filtrar tráfico con WAF, aplicar cuotas y enrutar cada solicitud hacia la capacidad autorizada. | HTTPS para contenido y APIs; errores controlados de autenticación, cuota o formato. | Servicio de identidad, servicios de negocio y modelos de lectura autorizados. |
| **Servicio de identidad y consentimiento** | Autenticar actores, autorizar por rol y finalidad y custodiar datos personales y consentimientos. | Validación de identidad, referencia opaca y consulta de consentimiento vigente. | Proveedor de identidad federada, almacén aislado, gestor de llaves y auditoría. |
| **Servicio de catálogo y configuración de eventos** | Administrar promotores, recintos, eventos, localidades, aforo autorizado y reglas de venta. | Comandos de configuración, consultas de catálogo y eventos de oferta publicada o modificada. | Identidad y base de datos transaccional. |
| **Servicio de admisión y fila virtual** | Aplicar la política publicada, registrar el orden, calcular la posición y regular el ingreso al núcleo transaccional. | Ingreso idempotente, consulta de turno y token firmado que autoriza a intentar reservar. | Identidad opaca, reglas del evento, registro durable y caché distribuida. |
| **Servicio de inventario y reservas** | Crear, confirmar, vencer o liberar reservas y proteger el aforo mediante operaciones atómicas. | Comando de reserva, consulta definitiva y eventos de reserva confirmada, vencida o liberada. | Token de admisión, reglas de oferta y base de datos transaccional. |
| **Orquestador de compra y pagos** | Coordinar la SAGA desde una reserva confirmada hasta la emisión o compensación y resolver respuestas ambiguas de pago. | Estado de compra, eventos de pago y operaciones de conciliación o reproceso. | Inventario, pasarela externa, bus de eventos y base de datos transaccional. |
| **Servicio de boletas y titularidad** | Emitir la boleta, mantener una sola titularidad vigente y gestionar transferencia, reventa, anulación y devolución. | Comandos sobre la boleta y eventos de estado para canales, liquidación y control de acceso. | Pago confirmado, reglas del evento, identidad opaca y base de datos transaccional. |
| **Bus de eventos y colas durables** | Conservar y distribuir hechos entre capacidades sin acoplar su disponibilidad ni ritmo de procesamiento. | Publicación y suscripción por contratos versionados, relectura, reintentos y DLQ. | Publicación confiable mediante outbox y consumidores idempotentes. |
| **Procesadores asíncronos** | Ejecutar conciliación, reintentos y construcción de proyecciones fuera del recorrido síncrono. | Consumidores de eventos, tareas reintentables y actualización idempotente de vistas. | Bus de eventos, base transaccional y modelos de lectura. |
| **Base de datos transaccional** | Conservar el estado durable y garantizar las invariantes de aforo, pago, titularidad y liquidación. | Transacciones ACID, restricciones de integridad y registro de salida transaccional. | Tecnología relacional con concurrencia, aislamiento y recuperación. |
| **Caché distribuida y modelos de lectura** | Atender consultas de alto volumen y estado temporal sin competir con las escrituras críticas. | Posición de fila, sesión, disponibilidad aproximada, catálogo, mapas y búsqueda. | Eventos confirmados y procesos de reconstrucción desde registros durables. |
| **Plataforma de ejecución** | Ejecutar, aislar y escalar contenedores según los perfiles de operación y el trabajo pendiente. | Programación de cargas, comprobaciones de salud y autoescalado. | Imágenes versionadas, configuración y capacidad de infraestructura. |
| **Seguridad de plataforma** | Aplicar gestión de secretos, cifrado y mínimo privilegio de manera transversal. | Identidades de servicio, llaves, políticas y registro de accesos. | Proveedor de identidad, gestor de secretos y capacidades criptográficas. |
| **Plataforma de observabilidad** | Correlacionar salud técnica, resultado de negocio y evidencia de las transiciones críticas. | Métricas, alertas, logs y trazas vinculadas por `trace_id` y `correlation_id`. | Telemetría de aplicación, mensajería, datos y plataforma de ejecución. |
| **Entrega automatizada** | Construir, verificar y promover artefactos e infraestructura de forma repetible y auditable. | Canal CI/CD, repositorio de artefactos e infraestructura como código. | Código fuente, controles de calidad y ambientes autorizados. |

### Sistemas externos

| Sistema | Contrato con TicketRight | Regla de frontera |
|---|---|---|
| **Pasarela de pago** | Solicitud con clave de idempotencia; respuesta o webhook autenticado; consulta y compensación cuando aplique. | Un *timeout* no significa que el pago fue rechazado. TicketRight conserva el proceso abierto hasta conocer o conciliar el resultado. |
| **Control de acceso del recinto** | Consulta o recepción de estados `emitida`, `transferida` y `anulada`, con versión del código verificable. | Valida el derecho en la puerta, pero no modifica pagos, inventario ni titularidad dentro de TicketRight. |
| **Identidad federada** | Protocolo estándar de autenticación y entrega de tokens de acceso de corta duración. | TicketRight no almacena contraseñas del usuario; sí aplica su propia autorización y consentimiento. |
| **Autoridades y registros** | Intercambio de referencias y reportes autorizados sobre evento, aforo y obligaciones. | La autoridad define o verifica obligaciones; TicketRight no determina permisos ni aforo legal. |

## Flujos principales

### Consulta, fila y reserva

1. El canal entra por el borde y obtiene una identidad opaca autorizada.
2. Admisión registra la solicitud según la política del evento. En operación cotidiana entrega
   el token de inmediato; durante el pico mantiene la fila y libera turnos a la tasa que el
   núcleo puede atender.
3. Catálogo, posición y disponibilidad aproximada se leen de vistas operativas.
4. El token permite **intentar** la reserva. Inventario vuelve a validar reglas y disponibilidad
   en la autoridad transaccional antes de confirmar.
5. Si otro comprador obtuvo primero la boleta, se rechaza la solicitud de forma explícita;
   nunca se corrige una sobreventa después de ocurrida.

### Pago, emisión y conciliación

1. Una reserva durable inicia la SAGA de pago; la conexión del usuario no permanece abierta
   esperando todos los pasos.
2. El Orquestador de compra y pagos registra la intención y solicita el cobro con idempotencia.
3. La respuesta o webhook se autentica y persiste antes de publicar el resultado.
4. Un pago confirmado ordena la emisión. El Servicio de boletas y titularidad crea la boleta y su titularidad
   una sola vez, aunque el evento se vuelva a entregar.
5. Si la emisión falla, la SAGA reintenta y escala a conciliación. No libera la reserva como si
   el cobro nunca hubiera ocurrido.
6. Pago rechazado o reserva vencida sin confirmación inicia la compensación que libera el
   inventario. Todo cobro confirmado termina en boleta o compensación trazable.

### Actualización y reconstrucción de vistas

1. El cambio de negocio y su registro de salida se confirman en la misma transacción local.
2. El evento durable se publica después de la confirmación.
3. Consumidores idempotentes actualizan fila, catálogo, disponibilidad y búsqueda.
4. Si una vista se pierde o queda atrasada, se reconstruye desde la historia durable. Mientras
   tanto puede mostrarse como temporalmente no disponible, pero no reemplaza la autoridad.

## Patrones arquitectónicos

| Patrón | Problema que resuelve en TicketRight | Aplicación y límite consciente |
|---|---|---|
| **Arquitectura híbrida por zonas** | Fila, inventario y pago requieren combinaciones distintas de velocidad, certeza y aislamiento. | Space-Based se limita al camino de la multitud; el núcleo transaccional conserva la certeza y Event-Driven desacopla el trabajo posterior. Aumenta modelos operativos y exige fronteras explícitas. |
| **Servicios de dominio de grano grueso** | Separar cada entidad produciría demasiados saltos, despliegues y fallos distribuidos. | Se separan capacidades con carga, datos o fallos diferentes. Administración y reportería pueden permanecer como módulos; no se crean microservicios por tabla. |
| **Space-Based bajo demanda** | Miles de usuarios consultando fila y disponibilidad podrían llevar toda la presión a la base transaccional. | Estado temporal distribuido y trabajadores paralelos absorben el pico. No se usa para confirmar aforo ni se mantiene sobredimensionado en operación cotidiana. |
| **CQRS** | Las lecturas masivas y los comandos con invariantes tienen necesidades incompatibles. | Comandos usan la autoridad; consultas usan proyecciones eventualmente consistentes. El costo es duplicación, reconstrucción y una posible diferencia temporal visible. |
| **Event-Driven** | Pago, emisión, notificación y proyecciones no deben compartir disponibilidad ni permanecer en una cadena síncrona. | Eventos durables conectan capacidades. No reemplazan una transacción local donde sí se necesita consistencia inmediata. |
| **SAGA orquestada** | La pasarela externa no participa en una transacción ACID con inventario y emisión. | Un coordinador durable decide continuar, reintentar o compensar. Acepta estados intermedios visibles; no promete atomicidad distribuida instantánea. |
| **Outbox transaccional e idempotencia** | Una caída entre guardar el estado y publicar un evento puede perder o duplicar trabajo. | Estado y salida se confirman juntos; entrega al menos una vez y consumidores idempotentes. No se afirma “exactamente una vez” de extremo a extremo. |
| **Back pressure y circuit breaker** | Admitir trabajo sin límite propaga la saturación del núcleo o de la pasarela. | La válvula reduce admisiones y el circuito contiene dependencias degradadas. La contrapartida es una espera o rechazo temporal explícito para nuevos usuarios. |
| **Defensa en profundidad** | Bots, credenciales comprometidas o un control aislado pueden afectar disponibilidad y privacidad. | Borde, identidad, autorización, aislamiento de datos, cifrado y auditoría se complementan. Ninguna señal aislada produce una confianza absoluta. |

## Tecnologías de referencia

La selección expresa tipos de tecnología compatibles entre sí. Los productos y servicios
concretos se decidirán y mostrarán en la arquitectura de implementación.

| Capacidad tecnológica | Uso en la arquitectura | Razón de selección | Estado |
|---|---|---|---|
| **Aplicación web adaptable y APIs seguras** | Canales del fan, promotor y operación. | Permite una entrada común, accesible desde distintos dispositivos y separada de la lógica de negocio. | Decisión conceptual. |
| **Distribución de contenido, firewall de aplicación y mediación de APIs** | Borde público. | Reduce tráfico innecesario, contiene abuso y centraliza contratos, cuotas y autenticación de entrada. | Decidido en AD-004; producto pendiente de implementación. |
| **Identidad federada y tokens firmados de corta duración** | Identidad de usuario y autorización de admisión. | Evita almacenar contraseñas y separa autenticación del derecho temporal a intentar una reserva. | Decidido en AD-004. |
| **Contenedores y orquestación con escalado horizontal** | Procesos de aplicación, consumidores y perfiles operativos. | Permite preparar capacidad, aislar recursos y reemplazar réplicas sin cambiar contratos. | Decidido en AD-006; topología pendiente de implementación. |
| **Base de datos relacional transaccional** | Autoridad de inventario, reserva, pago, boleta y liquidación. | Sus transacciones, restricciones e índices son apropiados para proteger aforo y unicidad. | Decidido en AD-003. |
| **Grilla distribuida en memoria** | Fila, sesiones, tokens y disponibilidad aproximada. | Responde el camino de alto volumen sin dirigir cada lectura a la autoridad transaccional. | Decidido para el perfil de pico en AD-005 y AD-006. |
| **Índice de lectura y búsqueda reconstruible** | Catálogo, recintos, artistas, mapas y filtros. | Descarga consultas variables y se puede regenerar desde hechos confirmados. | `[S]` Puede simplificarse en el MVP si la volumetría no lo justifica. |
| **Plataforma de eventos durables** | SAGA, proyecciones, auditoría operativa y efectos secundarios. | Conserva orden por compra, admite relectura y desacopla ritmos y fallos. | Decidido en AD-002. |
| **Telemetría interoperable** | Métricas, logs y trazas correlacionadas. | Permite observar el recorrido completo sin acoplar el diseño a un único proveedor. | Definida conceptualmente aquí; materialización en [observabilidad](observabilidad.md). |

La compatibilidad entre estas capacidades depende de cuatro contratos: identificadores
opacos comunes, propagación de contexto, eventos versionados e idempotencia. Sin ellos, el
listado tecnológico no conformaría una arquitectura coherente.

## Escenarios de calidad

Los objetivos cuantitativos continúan marcados como `[S]` hasta su ratificación mediante
pruebas. Cada escenario conserva la estructura fuente → estímulo → entorno → artefacto →
respuesta → medida definida en [atributos de
calidad](../01-caso-de-negocio/atributos-de-calidad.md).

| Escenario | Estímulo y entorno | Respuesta arquitectónica | Medida objetivo `[S]` | Soporte principal |
|---|---|---|---|---|
| **A-1 · Pago y boleta** | La pasarela responde tarde o repite una confirmación durante cualquier perfil. Afecta el Orquestador de compra y pagos. | La SAGA conserva un único proceso, procesa idempotentemente y emite o compensa con evidencia. | Cero discrepancias al cierre; resolución automática en **≤ 15 min**. | SAGA, eventos durables, idempotencia, conciliación y base de datos transaccional. |
| **A-2 · Integridad del aforo** | Solicitudes concurrentes compiten por las últimas sillas o cupos durante el pico. Afecta el Servicio de inventario y reservas. | La operación atómica acepta únicamente el inventario disponible y rechaza el resto antes del pago. | **Cero** boletas emitidas por encima del aforo. | Núcleo transaccional, restricciones e ingreso regulado. |
| **A-4 · Equidad de la fila** | Se pierde una vista en memoria o se reinicia un procesador mientras existen turnos. Afecta el Servicio de admisión y fila virtual. | Se reconstruye la posición desde el registro durable sin inventar un orden nuevo. | **100%** de turnos conformes con la política y reconstruibles. | Secuencia durable, proyección Space-Based y token firmado. |
| **A-6 · Degradación controlada** | La demanda o una dependencia satura la plataforma durante una venta. Afecta el recorrido crítico. | Se reducen catálogo y nuevas admisiones antes de quitar recursos a reservas y pagos iniciados. | **≥ 99%** de pagos iniciados alcanza un estado final controlado. | Back pressure, aislamiento de recursos, SAGA y circuit breaker. |
| **A-7 · Eficiencia de costos** | Finaliza la ventana de alta demanda y disminuye la carga. Afecta la capacidad desplegada. | Se drena el trabajo crítico y luego se reduce la zona caliente al mínimo seguro. | Infraestructura **≤ COP $150 por boleta vendida**. | Perfiles operativos y escalado selectivo. |
| **A-9 · Disponibilidad** | Falla una réplica o dependencia durante una ventana declarada. Afecta canales y servicios críticos. | Se reemplaza la réplica, se contiene la dependencia y se activa la degradación prevista sin perder el estado durable. | Disponibilidad **≥ 99,9%** durante la ventana. | Réplicas, comprobaciones, precalentamiento, eventos y autoridad durable. |
| **A-10 · Rendimiento** | **30.000 usuarios** concurren en 60 segundos por **5.000 boletas**. Afecta fila y reserva. | La mayoría permanece fuera del núcleo; las lecturas usan vistas y la válvula regula los comandos. | Posición de fila **P95 ≤ 1 s**; reserva **P95 ≤ 2 s**. | Space-Based, CQRS, caché de borde y control de admisión. |
| **A-11 · Seguridad y privacidad** | Un actor usa credenciales inválidas o intenta acceder a datos sin finalidad autorizada. Afecta cualquier perfil. | El borde o Identidad rechaza, no expone el dato y registra el intento con contexto auditable. | Cero accesos inválidos aceptados; **100%** de datos sensibles protegidos y accesos auditados. | Defensa en profundidad, identidad aislada, cifrado y mínimos privilegios. |
| **A-12 · Modificabilidad** | El negocio incorpora una política de venta antes de un evento. Afecta Oferta y Admisión. | La política cambia en su módulo y configuración sin alterar contratos de inventario o pago ni interrumpir ventas activas. | Un módulo funcional afectado; cero cambios en esos contratos y cero interrupción. | Límites de dominio, contratos versionados y servicios de grano grueso. |

## Trazabilidad con el dominio y las decisiones

### Correspondencia con los contextos acotados

| Contexto del dominio | Componentes de referencia | Regla conservada |
|---|---|---|
| **Oferta de eventos** | Servicio de catálogo y configuración de eventos | Define evento, localidades, aforo autorizado y reglas; no procesa pagos ni decide turnos. |
| **Admisión e identidad** | Servicio de identidad y consentimiento; Servicio de admisión y fila virtual | Decide quién puede intentar comprar y protege datos personales; el turno no garantiza inventario. |
| **Venta y recaudo** | Servicio de inventario y reservas; Orquestador de compra y pagos | Separa la reserva durable de la espera de la pasarela y conserva la relación dinero–boleta. |
| **Derecho de asistencia** | Servicio de boletas y titularidad | Mantiene una sola titularidad vigente y el ciclo posterior de la boleta. |

### Correspondencia con los ADR aceptados

| Decisión | Componentes afectados | Manifestación en esta arquitectura |
|---|---|---|
| [AD-002](../decisiones/0002-mensajeria-del-bus-de-eventos.md) | Orquestador de compra y pagos; Bus de eventos y colas; Base de datos transaccional | SAGA orquestada, outbox, entrega al menos una vez, idempotencia, DLQ y compensaciones explícitas. |
| [AD-003](../decisiones/0003-consistencia-por-tipo-de-inventario.md) | Servicio de inventario y reservas; Base de datos transaccional; Modelos de lectura | Una autoridad de escritura y proyecciones CQRS reconstruibles; ninguna vista confirma aforo. |
| [AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) | API Gateway y borde; Servicio de identidad y consentimiento; todos los contratos | Defensa en profundidad, token de admisión separado, datos personales aislados e identificadores opacos. |
| [AD-005](../decisiones/0005-estilo-de-arquitectura.md) | Estructura completa | Composición selectiva de Space-Based, núcleo transaccional, CQRS y Event-Driven. |
| [AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md) | Servicio de admisión y fila virtual; Modelos de lectura; Plataforma de ejecución | Precalentamiento, control de flujo, escalado por trabajo pendiente y cuatro perfiles operativos. |

## Alineación con prácticas de industria

La arquitectura se contrastó con estándares y guías reconocidas para comprobar que la vista
sea comprensible, trazable y verificable. La comparación no reemplaza las decisiones del
proyecto: se usa para revisar la calidad de su descripción y detectar aquello que todavía debe
concretarse en la implementación.

| Referente | Criterio relevante | Aplicación en TicketRight | Alcance o trabajo posterior |
|---|---|---|---|
| **ISO/IEC/IEEE 42010:2022** | Una descripción de arquitectura debe responder a las preocupaciones de sus interesados mediante vistas, puntos de vista y modelos identificables. | Esta vista delimita el sistema, muestra actores y sistemas externos, explica las responsabilidades y relaciona la estructura con dominio, atributos de calidad y ADR. | La arquitectura de implementación deberá añadir las vistas de despliegue, operación y seguridad física sin mezclar esos detalles con esta referencia lógica. |
| **Modelo C4** | Una vista de contenedores presenta aplicaciones y almacenes principales, sus responsabilidades, tecnologías generales y relaciones; la infraestructura se documenta en una vista de despliegue distinta. | Las cajas tienen una responsabilidad principal, las dependencias son dirigidas y las versiones Mermaid y diagrams.net incluyen etiquetas y una leyenda. Las capacidades tecnológicas se expresan sin seleccionar productos. | La correspondencia exacta entre capacidades lógicas y unidades desplegables se definirá cuando exista una arquitectura de implementación; por eso esta vista se declara inspirada en C4 y no como cumplimiento estricto del modelo. |
| **Escenarios de calidad del SEI** | Un atributo debe formularse con fuente, estímulo, entorno, artefacto, respuesta y medida, para poder evaluarlo con evidencia. | Los escenarios A-1 a A-12 se enlazan con los componentes que responden y con una medida observable; su definición completa se conserva en el documento de atributos de calidad. | Los umbrales marcados `[S]` deben validarse mediante pruebas de carga, resiliencia, seguridad y costo. |
| **AsyncAPI 3.0** | Los sistemas dirigidos por eventos necesitan contratos legibles por personas y herramientas que definan canales, mensajes, operaciones y mecanismos de seguridad. | La arquitectura exige eventos versionados, identificadores opacos, idempotencia, trazabilidad y reglas de publicación y consumo. | `PENDIENTE: formalizar durante la implementación los contratos de eventos en documentos AsyncAPI y validarlos automáticamente en integración continua.` |

El contraste confirma que el planteamiento sigue una separación adecuada entre descripción
lógica, decisiones y futura topología. También evita asumir que un diagrama demuestra por sí
solo el cumplimiento: la disponibilidad, el rendimiento, la resiliencia y el costo deberán
comprobarse con las medidas declaradas en los escenarios de calidad.

## Implicaciones y límites

La arquitectura protege primero aquello que no puede corregirse después: aforo, dinero,
titularidad y evidencia. A cambio acepta consistencia eventual en consultas, estados
intermedios durante la SAGA y una mayor exigencia de operación, contratos y observabilidad.

También evita dos extremos. No concentra fila, pago e inventario en un único proceso que
pueda caer por saturación compartida, pero tampoco divide cada entidad en un microservicio.
La separación se justifica cuando cambia el patrón de carga, la sensibilidad del dato, el
ritmo de escalado o el modo de fallo.

Quedan fuera de la frontera la operación de la pasarela, el control físico de acceso, la
organización del evento y la determinación legal del aforo. TicketRight integra esos actores
y conserva evidencia de sus interacciones, pero no afirma controlar su disponibilidad o sus
decisiones.

## Supuestos y pendientes

- Los objetivos de calidad identificados con `[S]` deben ratificarse con volumetría, pruebas
  de concurrencia e [inyección de fallos](inyeccion-de-fallos.md).
- `[S]` El índice especializado de búsqueda se incorporará únicamente si las consultas y el
  volumen medidos superan una proyección más simple.
- `PENDIENTE: especificar en la arquitectura de implementación los productos, topología,
  protocolos, puertos, zonas, réplicas, políticas de escalado y recuperación que materializan
  cada componente de referencia.`
- `PENDIENTE: validar que el costo de la topología elegida satisface A-7 sin reducir las
  garantías de disponibilidad, aforo o conciliación.`

## Referencias

- [Material de clase sobre estilos Event-Driven y Space-Based](../../curso/clase-03-04.md#12-estilo-event-driven-basado-en-eventos).
- [Explicación de arquitectura de referencia e implementación](../../curso/clase-03-04-transcripcion.md#8-arquitectura-de-referencia-vs-arquitectura-de-implementación).
- [Modelo de dominio](modelo-de-dominio.md).
- [Escenarios de atributos de calidad](../01-caso-de-negocio/atributos-de-calidad.md).
- [Alcance del caso de negocio](../01-caso-de-negocio/alcance.md).
- [Decisiones de arquitectura aceptadas](../decisiones/README.md).
- [ISO/IEC/IEEE 42010:2022 — Architecture description](https://www.iso.org/standard/74393.html).
- [C4 Model — Container diagram](https://c4model.com/diagrams/container) y [notación](https://c4model.com/diagrams/notation).
- [SEI — Quality Attribute Workshops](https://insights.sei.cmu.edu/documents/5465/2013_018_101_60984.pdf).
- [AsyncAPI Specification 3.0.0](https://www.asyncapi.com/docs/reference/specification/v3.0.0).
