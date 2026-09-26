# Autoevaluación del equipo — Entrega 3

## Cómo entendemos el resultado

Sentimos que la implementación quedó muy compatible con lo que pensamos y modelamos, y creemos
que eso no fue casualidad: entendimos que el modelamiento y la implementación tienen propósitos
distintos. En el modelamiento diseñamos la solución completa y correcta —la arquitectura que el
problema merece—, y ese modelo nos sigue pareciendo sólido. En la implementación el trabajo no
era copiar ese modelo pieza por pieza, sino decidir con criterio de ingeniería qué construir
primero y hasta dónde, priorizando por valor para el negocio, por riesgo y por las garantías que
no eran negociables para nuestro caso: nunca vender por encima del aforo, nunca cobrar sin
entregar la boleta y nunca perder la titularidad. El modelo fue el norte; la implementación fue
la ruta y la decisión de hasta qué punto llegar en esta entrega. Preferimos construir bien,
probar y poder defender un núcleo sólido, antes que dejar muchas piezas a medias por querer
tenerlo todo.

## Qué nos propusimos y qué entregamos

Nos propusimos explorar un caso de negocio que nos llamaba mucho la atención: las tiqueteras.
Queríamos entender de verdad cómo funciona esto por detrás y todo lo que involucra. Terminamos
yendo más allá de entenderlo: propusimos una arquitectura original que toma las problemáticas
reales del sector —avalanchas de tráfico, sobreventa, dinero cobrado sin boleta— y las resuelve
con decisiones justificadas. Entregamos una aplicación que hace el recorrido completo de compra
(fila de espera, reserva, pago y emisión de la boleta) sobre PostgreSQL, Redis y Kafka; una
plataforma web que muestra ese recorrido; las reglas de negocio del modelo cubiertas por pruebas
unitarias; observabilidad con métricas, tableros y alertas; y cuatro experimentos de inyección
de fallos ejecutados y analizados.

## Qué implementamos y qué no, frente al modelamiento

Somos explícitos aquí para poder responder por todo lo que propusimos:

Lo que quedó implementado y probado: el núcleo transaccional en PostgreSQL como autoridad del
aforo; la SAGA orquestada de la compra con sus caminos de error; el patrón de mensajería con
outbox transaccional, Kafka y cola de no procesables; la separación de lecturas y escrituras
(CQRS); la sala de espera en Redis como válvula de admisión; la idempotencia del pago; la
arquitectura hexagonal por contextos; y toda la plataforma de observabilidad.

Lo que quedó como equivalente de piloto: los servicios de nube que propusimos en la arquitectura
de implementación (Cognito, KMS, API Gateway, CloudTrail, MSK, ElastiCache, EKS) se realizaron
con homólogos locales que aplican el mismo patrón con otra tecnología: JWT firmado en lugar de
Cognito, cifrado AES-256-GCM en lugar de KMS, un borde propio con control de tasa y detección de
bots en lugar de API Gateway más WAF, Kafka y Redis en contenedor, y minikube en lugar de EKS.
Esto es coherente con lo que la propia arquitectura de implementación separa: una cosa es el
diseño para la nube y otra es el piloto que corre el equipo.

Lo que decidimos no incluir, a conciencia: la reventa de boletas quedó modelada pero sin flujo
de aplicación, porque el foco era la venta primaria de alta demanda, no el mercado secundario.
No llevamos la solución a una nube más robusta (alta disponibilidad multi-zona, réplicas, IaC
completo) por tiempo y por las capacidades del equipo. El buscador dedicado del catálogo
(OpenSearch) no se implementó; la búsqueda se resuelve sobre PostgreSQL. El disyuntor completo
(circuit breaker con apertura y medio-abierto) quedó como reintentos acotados y compensación. Y
la gestión del catálogo por parte del promotor tiene el dominio implementado pero no el flujo de
administración. Nada de esto era una garantía de negocio: son alcance que acotamos, no cosas que
se nos olvidaron.

## Logros de los que respondemos con evidencia

Todas las entregas quedaron consistentes y enlazadas: propusimos una idea y un caso de negocio
bien conectados, y cada entregable fue fiel a lo que nos planteamos desde el inicio. Cada
elemento cumplió su propósito para hacer evolucionar un producto cada vez mejor. Construimos una
aplicación que resistió más de lo esperado: uno de los escenarios de fallo que diseñamos para
tumbarla no lo logró, y tuvimos que subir la intensidad del experimento para forzar la
degradación. Además, la inyección de fallos cumplió su propósito real: encontró una debilidad
verdadera —el servicio se colgaba cuando la base de datos dejaba de responder— que corregimos y
volvimos a verificar. Y al probar bajo concurrencia detectamos y corregimos una sobreventa que
solo aparecía con varias confirmaciones simultáneas; el diseño ya la anticipaba, pero solo el
código bajo carga la hizo visible.

## Dificultades y cómo las enfrentamos

La dificultad de fondo fue traducir cada problemática real de una tiquetera —a nivel de
infraestructura y de experiencia— en decisiones concretas de arquitectura. Para eso definimos
primero, en conjunto, nuestros objetivos y los atributos de calidad que no íbamos a negociar para
este negocio, y a partir de ahí tomamos las decisiones. También enfrentamos límites prácticos:
las máquinas del equipo no soportaban todo el stack, así que trabajamos en la nube con
Codespaces; y aprendimos que un cambio transversal, como el borde de seguridad, puede romper una
prueba en silencio si no se vuelve a correr toda la campaña.

## Aprendizajes

Lo que más valoramos como aprendizaje va más allá del código:

Entender la estructura del negocio antes de diseñar. Estudiar cómo opera una tiquetera, construir
el caso de negocio y hacer un modelo financiero nos cambió la forma de diseñar: la arquitectura
no salió de preferencias técnicas, sino de lo que el negocio necesita sostener —volumen en el
pico, márgenes por boleta, riesgo de sobreventa—. El modelo financiero y el diseño quedaron
articulados: las decisiones de capacidad y de escalado responden a números del negocio, no a
gustos.

Los ADR nacen de los atributos de calidad. Cada decisión de arquitectura que registramos surgió
de un atributo de calidad concreto y de lo que estábamos dispuestos a sacrificar a cambio. Esa
cadena —atributo de calidad → decisión (ADR) → mecanismo en el código— es la que nos permite hoy
defender por qué el sistema es como es y no de la forma más simple.

Aprendizajes técnicos: una arquitectura hexagonal se paga sola bajo fallo, porque el estado del
negocio vive en la base y el dominio no conoce la infraestructura; la idempotencia y las
transacciones no son opcionales en venta de alta demanda; una métrica solo sirve si de verdad
reacciona (una alerta sobre una señal que nunca cambia da falsa confianza); y mantener la
documentación al día con lo que hay en el código es parte de la calidad, no un extra.

El aprendizaje más transversal: un modelo ambicioso es una guía, no una lista de obligaciones
inmediatas. Implementar es priorizar con criterio, no rebajar el diseño.

## Mejoras que reconocemos

Tomamos en cuenta la retroalimentación que recibimos en las entregas anteriores:

Sobre la proyección poco realista que se nos señaló: aprendimos a ser más conservadores y a
sustentar las cifras y los supuestos con datos, en lugar de proyectar escenarios demasiado
optimistas. Esto se refleja en cómo acotamos el alcance y en cómo presentamos los resultados de
esta entrega, sin sobrevender lo logrado.

Sobre la observación de implementación: la atendimos ajustando el enfoque hacia un núcleo
funcional, probado y coherente con el diseño, en lugar de intentar abarcar cada componente. La
brecha entre lo diseñado y lo construido quedó documentada y justificada, no escondida.

Otras mejoras que identificamos por nosotros mismos: completar el disyuntor de la pasarela;
habilitar la gestión del catálogo por el promotor; desplegar en un clúster real para demostrar el
autoescalado en vez de solo declararlo; y avanzar en rotación de llaves y pruebas de seguridad
automatizadas.

## Cierre

Estamos conformes con el resultado y, sobre todo, con lo aprendido: entendimos un sector desde el
negocio y las finanzas, propusimos y defendimos una arquitectura derivada de atributos de
calidad, y la llevamos a código siendo honestos sobre su alcance. Lo que funciona, funciona de
verdad y está probado; lo que no incluimos, está dicho y justificado.
