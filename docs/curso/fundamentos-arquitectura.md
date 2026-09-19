# Fundamentos de arquitectura

> Destilado del cuestionario interactivo de fundamentos: sus 15 preguntas reorganizadas
> por tema. Fuente: `material/cuestionario-fundamentos-arquitectura.html` (ábrelo en el
> navegador para hacerlo).
>
> Complementa [`clase-01-02.md`](clase-01-02.md), que digitaliza las láminas. Donde ambos
> se contradicen —la definición de «política»— está anotado.

---

## 1. Qué es la arquitectura

La arquitectura es el **conjunto de decisiones estructurales significativas** —componentes,
relaciones y atributos de calidad— **cuyo costo de reversión es alto**. Es un conjunto de
*decisiones*, no de artefactos ni de herramientas.

Tres confusiones frecuentes, y por qué son confusiones:

- **El stack no es la arquitectura.** Las tecnologías son *consecuencia* de decisiones
  arquitectónicas.
- **El diagrama no es la arquitectura.** Es una *representación* parcial de ella.
- **El documento no es la arquitectura.** Es un *registro*.

Todo sistema tiene arquitectura aunque nadie la haya escrito. La diferencia está en si
fue **elegida** o si **ocurrió por accidente**.

> **Prueba de fuego en mentoría:** si alguien describe la arquitectura de su sistema
> nombrando un stack, la siguiente pregunta es *qué atributo de calidad justificó ese stack*.

### El límite de la definición de Fowler

La formulación clásica —«la arquitectura es aquello que es difícil de cambiar»— es una
excelente **herramienta de diagnóstico**: permite reconocer qué decisiones son
estructurales en un sistema dado. Pero describe el sistema tal como está, y puede leerse
como una invitación al fatalismo: *«esto es caro de cambiar, luego hay que acertar a la
primera»*. Ese razonamiento es exactamente el que produce diseño anticipado exhaustivo.

La **arquitectura evolutiva** reencuadra la responsabilidad: además de tomar bien las
decisiones costosas, el trabajo consiste en **hacer que menos decisiones sean costosas**.
Los medios son concretos: modularidad con fronteras bien puestas, contratos versionados,
aislamiento de dependencias, funciones de aptitud que protegen las características
deseadas, y el hábito de decidir en el **último momento responsable**.

Las dos visiones no compiten: la primera dice *dónde mirar*, la segunda dice *qué hacer
con lo que se encuentra*.

---

## 2. Arquitectura vs. diseño

El criterio **no** es el cargo de quien decide, ni si aparece en un diagrama formal, ni
cuánto se discutió.

| | Decisión arquitectónica | Decisión de diseño |
|---|---|---|
| Costo de reversión | Alto | Bajo |
| Alcance | Varios componentes o equipos | Local a un componente |
| Reversibilidad | Requiere renegociar contratos, coordinar despliegues | Reversible por su propio equipo |
| Efecto | Condiciona decisiones posteriores | Sin efecto en contratos externos |

Que una decisión involucre a varios equipos es un buen **síntoma**, pero no el criterio:
hay decisiones de un solo equipo que son claramente arquitectónicas, como el **modelo de
consistencia** de su almacén de datos.

**La frontera es contextual, no absoluta.** Herencia vs. composición dentro de un
microservicio es diseño: se refactoriza sin renegociar contratos. Esa misma decisión en
un monolito de un solo módulo puede ser arquitectónica, porque no hay otro lugar donde
vivan las decisiones estructurales. Y que una decisión afecte la mantenibilidad no la
vuelve arquitectónica: casi toda decisión de diseño afecta algún atributo de calidad.

---

## 3. Trade-offs

**No existen soluciones buenas en abstracto; existen soluciones adecuadas a un contexto.**
Todo lo que se gana en un eje —latencia, disponibilidad, costo, simplicidad operativa,
autonomía de equipos— se paga en otro.

El trade-off **no es un defecto del diseño sino su naturaleza**. El defecto es no verlo.
Un equipo que no puede enunciar qué está cediendo probablemente no eligió: heredó una
decisión ajena.

**El trade-off existe se documente o no.** Un equipo que migra a microservicios «porque
es el estándar de la industria» va a pagar la complejidad distribuida —transacciones
distribuidas, latencia entre servicios, carga operativa— igual que si la hubiera
analizado. Lo que distingue el trabajo arquitectónico es hacerlo explícito *antes*, y
verificar que el beneficio buscado (autonomía de despliegue, escalado independiente,
aislamiento de fallos) es el que la organización realmente necesita y **puede sostener**.

Adoptar una práctica por imitación, sin el contexto que la hizo válida en otra parte, es
una decisión por defecto disfrazada de buena práctica.

> **La pregunta correcta nunca es «¿es esto un buen patrón?» sino «¿qué estoy comprando
> y con qué lo estoy pagando?».**

---

## 4. Principios, políticas y estándares

La cadena de gobierno técnico tiene tres eslabones, y cada uno se cambia con una
cadencia y una autoridad distintas:

| Nivel | Función | Cadencia de cambio | Ejemplo |
|---|---|---|---|
| **Principio** | Orienta: *por qué* y *hacia dónde* | Rara vez | «La privacidad del cliente prevalece sobre la conveniencia del equipo de desarrollo» |
| **Política** | Obliga: *qué es aceptable y qué no* | Revisión periódica | «Toda información personal debe cifrarse en reposo con llaves gestionadas por la organización» |
| **Estándar** | Especifica: *cómo se hace exactamente* | Con la evolución tecnológica | «AES-256 con el servicio de llaves corporativo y rotación cada 90 días» |

### Qué es y qué no es un principio

Un principio es una **regla general y duradera**, independiente de una tecnología
concreta y de un momento en el tiempo, que orienta decisiones futuras. Se enuncia como
norma de comportamiento del sistema y **sobrevive a cualquier cambio de tecnología**.

No son principios:
- «Usamos PostgreSQL para el catálogo» → es una **decisión de arquitectura**: concreta,
  fechada, con alternativas descartadas.
- «Aplazamos el release a la próxima semana» → es un **acuerdo de plan**.
- «El P99 de la API está en 240 ms» → es una **medición**.

### Un principio incompleto hace daño

Un principio útil no es una consigna. Incluye **enunciado, razón, implicaciones y
relación con los demás principios**, incluyendo un **orden de prelación**. Sin prelación
explícita, cualquier principio puede citarse para justificar cualquier cosa, y en la
práctica se usa para *cerrar* discusiones en lugar de orientarlas.

*Ejemplo:* un equipo invoca «preferimos soluciones simples» para rechazar un circuit
breaker en una integración con un tercero inestable. El error es doble. Primero, se está
midiendo la simplicidad **sobre el código en lugar de sobre el sistema en operación**: un
fallo en cascada por ausencia de aislamiento es incomparablemente más complejo de
diagnosticar y operar que un circuit breaker. Segundo, derogar el principio tampoco
resuelve nada: el problema no es el principio, es su formulación incompleta.

Un principio también debe **declarar su alcance y sus dominios de excepción**. «Ante
conflicto entre disponibilidad y consistencia, priorizamos disponibilidad» es razonable
como comportamiento por defecto, y desastroso aplicado a un módulo de débito de cuentas:
un sobregiro por consistencia eventual no es una molestia de experiencia de usuario, es
un impacto contable, regulatorio y de confianza. Y cuando el requisito de disponibilidad
sobre el débito es real, la salida no es escoger uno de los dos extremos, sino **diseñar
el mecanismo** —reserva de fondos, transacción compensatoria, saga con límite de
exposición— que preserve ambos atributos dentro de un margen conocido. Dejar registro de
la decisión es necesario, pero no vuelve correcta una decisión equivocada.

### Anatomía de una política bien formada

Cinco elementos. Si falta alguno, la política falla de una forma predecible:

1. **Alcance** — a qué aplica y a qué no.
2. **Enunciado obligatorio** — verificable de forma binaria.
3. **Mecanismo de verificación** — *si falta, es un deseo*.
4. **Ruta formal de excepción** — *si falta, se incumple en silencio*.
5. **Dueño responsable** — *si falta, nadie la mantiene y envejece*.

### Excepciones: el mecanismo que mantiene vivo el gobierno

Una política sin ruta formal de excepción tiene solo dos destinos: volverse letra muerta,
o incumplirse en silencio —que es peor, porque destruye la trazabilidad.

La excepción bien gobernada conserva el control **y genera información**: si el mismo
tipo de excepción se solicita repetidamente, la señal es que la política está mal
calibrada y debe revisarse. Esa es la retroalimentación que mantiene vivo el marco.

Dos elementos suelen olvidarse y son los que marcan la diferencia: la **vigencia
temporal** y la **condición de retorno**. Sin ellas, toda excepción se vuelve permanente
y el marco se erosiona excepción por excepción, hasta que la política solo se aplica a
quienes no saben pedir excepciones.

> **Indicador útil:** la *tasa de excepciones por política* mide la calidad del marco de
> gobierno, no la disciplina de los equipos.

---

## 5. Atributos de calidad y tácticas

Un **atributo de calidad** expresa un requisito **medible sin prescribir cómo se logra**:
RTO de 4 horas, P99 por debajo de 300 ms, disponibilidad del 99,95%.

Una **táctica** es un medio para alcanzarlo: réplica activa-pasiva, caché, circuit
breaker, bulkhead.

Confundirlos **cierra el análisis de alternativas antes de abrirlo**. El mismo RTO de 4
horas puede alcanzarse con backup y restauración, con *pilot light*, con *warm standby* o
con activo-activo, y el rango de costo entre esas opciones puede ser **de diez a uno**.

> Cuando el requisito llega ya escrito como solución, el primer trabajo del arquitecto es
> **traducirlo de vuelta a atributo**.

---

## 6. ATAM: puntos de sensibilidad y puntos de trade-off

| Concepto | Definición | Qué se hace con él |
|---|---|---|
| **Punto de sensibilidad** | Decisión cuyo ajuste mueve significativamente **un** atributo de calidad | Se **optimiza** |
| **Punto de trade-off** | Decisión que es punto de sensibilidad para **dos o más** atributos que se mueven en direcciones **opuestas** | Se **negocia** con los interesados |

Todo punto de trade-off es también punto de sensibilidad; no al revés.

*Ejemplos:* subir el tamaño de la caché mejora la latencia de lectura sin afectar de
forma relevante a otro atributo → **punto de sensibilidad**. Subir el factor de
replicación mejora la disponibilidad y degrada la latencia de escritura → **punto de
trade-off**.

La distinción tiene valor práctico inmediato:

- **Llevar a un comité un punto de sensibilidad es hacerle perder el tiempo.**
- **Resolver en solitario un punto de trade-off es tomar por cuenta propia una decisión
  de negocio** —implica decidir qué se sacrifica y a nombre de quién.

---

## 7. La arquitectura es una decisión sociotécnica

La **ley de Conway** sostiene que el diseño de un sistema tiende a reproducir la
estructura de comunicación de la organización que lo construye.

La **maniobra inversa de Conway** invierte la relación: se **reorganizan los equipos**
para que sus fronteras coincidan con las fronteras arquitectónicas deseadas.

La razón por la que hay que hacerlo es económica, no cultural: **coordinar dentro del
equipo siempre es más barato que coordinar entre equipos**, así que el diseño migra hacia
donde la comunicación fluye. Una organización con equipos por capa —frontend, backend,
base de datos, integración— que intenta migrar a dominios de negocio sin reorganizarse
obtiene un resultado predecible: cada cambio de dominio requiere coordinar cuatro
agendas, y salen servicios que **en el diagrama parecen dominios y en la práctica se
comportan como capas**.

> Tesis central: **la estructura organizacional es material de diseño, no contexto dado.**

---

## 8. Cómo se usa esto en el proyecto

| Concepto | Dónde aplica en el proyecto |
|---|---|
| Atributos de calidad medibles | Entrega 1, paso 3. Entrega 2: de ahí se deriva la arquitectura |
| Trade-offs explícitos | Entrega 2 y defensa: cada decisión debe decir qué se cedió |
| ADRs con alternativas descartadas | `proyecto/decisiones/` — es el insumo de la defensa (Entrega 3) |
| Puntos de sensibilidad vs. trade-off | Entrega 2: separar lo que se optimiza de lo que se negocia |
| Ley de Conway | Entrega 2: si se proponen dominios, hay que decir quién los opera |
| Principio vs. política vs. estándar | Si el proyecto define gobierno, no mezclar los tres niveles |

Regla práctica para la defensa: **para cada decisión de la Entrega 2, poder responder qué
atributo de calidad la justifica y qué se cedió a cambio.** Es la pregunta que el
material del curso repite en todas sus formas.
