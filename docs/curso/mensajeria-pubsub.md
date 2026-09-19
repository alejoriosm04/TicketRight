# Mensajería publish/subscribe: Kafka vs. RabbitMQ

> Destilado de: Dobbelaere, P. & Sheykh Esmaili, K. (Nokia Bell Labs).
> *Industry Paper: Kafka versus RabbitMQ — A comparative study of two industry reference
> publish/subscribe implementations.*
> Archivo: `material/dobbelaere-2017-kafka-vs-rabbitmq.pdf`
>
> Nota: el paper es de 2017. Las cifras de rendimiento son de esa época y ambos sistemas
> han evolucionado. Lo que sigue vigente es el **marco de comparación** y la lógica de
> elección. Si se usa una cifra concreta en un ensayo o en la defensa, hay que fecharla.

---

## Por qué este tema es útil para el curso

Es un caso de trade-off arquitectónico de manual: dos sistemas etiquetados igual
(«pub/sub»), con historias y objetivos de diseño distintos, donde la pregunta «¿cuál es
mejor?» no tiene respuesta y la pregunta correcta es **«¿qué estoy comprando y con qué lo
estoy pagando?»** (ver [`fundamentos-arquitectura.md`](fundamentos-arquitectura.md#3-trade-offs) y
la lámina 22 en [`clase-01-02.md`](clase-01-02.md#trade-off-en-arquitectura-lámina-22)).

---

## Diferencia estructural de fondo

| | RabbitMQ | Kafka |
|---|---|---|
| **Modelo** | Broker de mensajes con enrutamiento | Log de commits distribuido |
| **Camino del mensaje** | El productor publica con una *routing key* a una red de *exchanges*, donde ocurre la decisión de enrutamiento, y termina en una cola | El productor publica a un *append log* en disco, específico por *topic* |
| **Consumo** | Los consumidores reciben por *push* (preferido) o *pull* | Cualquier número de consumidores hace *pull* mediante un índice |
| **Estado del consumidor** | Lo gestiona el broker | Kafka **no guarda estado** de los consumidores |
| **Dónde vive la inteligencia** | En el broker (enrutamiento complejo) | En el consumidor (offset propio) |

Casi todo lo demás se deriva de esta diferencia.

---

## Capacidades exclusivas

### Solo Kafka

- **Almacenamiento a largo plazo.** Los mensajes van a disco. La purga es automática y se
  configura por topic: por tiempo de retención o por cuota de disco.
- **Reproducción de mensajes (*replay*).** Consecuencia directa de no guardar estado del
  consumidor más el almacenamiento largo. Muy útil para la **tolerancia a fallos de los
  sistemas aguas abajo**: un consumidor que falló puede reprocesar.
- **Kafka Connect.** Framework para mover colecciones grandes de datos dentro y fuera de
  Kafka con conectores declarativos.
- **Log compaction.** Garantiza retener al menos el último valor conocido de cada clave
  dentro de una partición. Es lo que habilita los *change feeds*.

### Solo RabbitMQ

- **TTL de mensajes**, aplicable a la cola en su creación o al mensaje individual en la
  publicación, para datos que dejan de ser relevantes pasado cierto tiempo.
- **Soporte explícito para request/response**: *correlation ID* y *direct reply-to*, que
  permiten al cliente RPC recibir la respuesta directamente del servidor sin montar una
  cola de respuesta dedicada.
- **Enrutamiento complejo** en el broker y garantías de ordenamiento más fuertes.

---

## Rendimiento (según el paper, 2017)

- **Latencia.** Ambos entregan latencias bajas (media/mediana en torno a **10 ms**). En
  RabbitMQ la diferencia entre *at most once* y *at least once* no es significativa; en
  Kafka el modo *at least once* **duplica** la latencia aproximadamente, y si debe leer
  de disco puede crecer **hasta un orden de magnitud**.
- **Throughput.** En la configuración más básica —un nodo, un productor/canal, una
  partición, sin réplica— **RabbitMQ supera a Kafka**. Pero **aumentar el número de
  particiones de Kafka en el mismo nodo mejora su rendimiento de forma notable**,
  mientras que aumentar productores/canales en RabbitMQ solo mejora moderadamente.

> **Lectura arquitectónica:** el titular no es «Kafka es más rápido». Es que RabbitMQ
> gana en el caso simple y Kafka escala mejor cuando se le da con qué. Citar un
> benchmark sin decir la configuración es exactamente el error que el curso señala.

---

## Cuándo usar cada uno

### Kafka encaja bien en

- **Pub/sub** cuando la lógica de enrutamiento es **simple** (el concepto de *topic*
  alcanza) y cuando el throughput por topic supera lo que RabbitMQ puede manejar —el caso
  del *event firehose*.
- **Ingesta escalable.** En muchas plataformas de Big Data el cuello de botella no es el
  procesamiento sino la carga de datos. Kafka ya está integrado con Spark, Flink y otras.
- **Infraestructura de capa de datos.** Por durabilidad y multicast eficiente, sirve como
  sustrato que conecta servicios batch y streaming de toda la empresa.
- **Change feeds.** Secuencias de eventos de actualización sobre un estado inicial. El
  diseño *log-centric* de Kafka es un backend excelente para aplicaciones de este estilo.
- **Procesamiento de streams**, con Kafka Streams o Apache Samza.

### RabbitMQ encaja bien en

- **Pub/sub**, que es exactamente para lo que fue creado. Más aún en escenarios de
  enrutamiento *edge/core* con brokers en una topología de interconexión particular.
- **Request/response**, por el soporte explícito de RPC y sus garantías de ordenamiento
  más fuertes.
- **Métricas operativas en tiempo real**, por el filtrado complejo que el broker puede
  aplicar. (Kafka sería la elección para la analítica *offline* sobre esas mismas
  métricas, por su retención larga.)

### Combinarlos

El paper señala que hay casos donde ninguno solo es la mejor opción. Dos combinaciones
comunes: usar RabbitMQ donde se necesita enrutamiento sofisticado y Kafka donde se
necesita almacenamiento largo y capacidad de stream, o poner RabbitMQ delante para el
enrutamiento y Kafka detrás cuando el throughput por topic excede lo que un broker
maneja. Existe un conector AMQP-Kafka para el puente.

---

## Cómo se conecta con el proyecto

Si el modelamiento de la Entrega 2 incluye mensajería, la decisión debe llegar a la
defensa con: el **atributo de calidad** que la justifica, la **alternativa descartada** y
**qué se cedió**. Va como ADR en [`../proyecto/decisiones/`](../proyecto/decisiones/).

Nota: el ejemplo de ADR que usó el profesor en la lámina 21 es justamente una decisión de
integración por mensajería.

Preguntas que ordenan la elección:
1. ¿El enrutamiento es simple (topic) o necesita reglas en el broker?
2. ¿Hace falta *replay* o retención larga?
3. ¿El throughput por topic supera lo que un broker único maneja?
4. ¿Es request/response o es flujo de eventos?
5. ¿Quién opera esto? (Kafka trae más carga operativa. Ver ley de Conway.)
