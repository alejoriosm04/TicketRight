# AD-007 — Stack de implementación: TypeScript sobre Node.js

**Fecha:** 2026-09-19 · **Estado:** 🟣 Propuesto — pendiente de ratificación del equipo
**Participan:** Alejo, Lina, Quinnie
**Dimensión:** implementación — **no cuenta entre las cinco decisiones arquitectónicas**
**Relacionados:** [AD-005](0005-estilo-de-arquitectura.md) ·
[AD-002](0002-mensajeria-del-bus-de-eventos.md) ·
[AD-003](0003-consistencia-por-tipo-de-inventario.md) ·
[AD-004](0004-datos-personales-almacenamiento-y-acceso.md) ·
[AD-006](0006-escalado-programado-por-ventana-de-venta.md)

> **Decisión en palabras simples:** los cuatro contextos acotados se implementan en
> **TypeScript sobre Node.js**, en un monorepo con un paquete por contexto y la misma
> separación hexagonal que ya fija el
> [diagrama de clases](../02-modelamiento/diagrama-de-clases.md); las pruebas unitarias se
> escriben con **Vitest** junto al dominio. La arquitectura de referencia y la de
> implementación no cambian: este ADR solo fija la pieza —lenguaje, runtime y herramientas—
> que el [plan de pruebas](../02-modelamiento/plan-de-pruebas.md#automatización) dejó
> explícitamente pendiente.

## 1. Decisión arquitectónica

La implementación de la Entrega 3 usará:

- **Node.js 24 LTS** como runtime y **TypeScript en modo estricto** (`strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) con módulos ESM.
- **Un monorepo con npm workspaces**, un paquete por contexto acotado del modelo de dominio
  —Oferta de eventos, Admisión e identidad, Venta y recaudo, Derecho de asistencia— más un
  paquete `kernel` para los tipos compartidos. Los paquetes son desplegables por separado;
  el límite entre contextos es verificable porque un paquete no importa a otro.
- **Arquitectura hexagonal dentro de cada paquete**, como la documenta el
  [diagrama de clases](../02-modelamiento/diagrama-de-clases.md): `dominio/`, `aplicacion/`,
  `puertos/` y `adaptadores/`. El dominio no importa infraestructura; los adaptadores
  implementan los puertos.
- **Vitest** como marco de pruebas y **V8 como herramienta de cobertura**, con las pruebas
  junto al código de cada contexto, como exige el
  [plan de pruebas](../02-modelamiento/plan-de-pruebas.md#automatización).
- **Docker Compose** para el ambiente local de desarrollo con PostgreSQL, Redis y Kafka,
  alineado con [AD-003](0003-consistencia-por-tipo-de-inventario.md) y
  [AD-002](0002-mensajeria-del-bus-de-eventos.md); la topología de producción sigue siendo la
  de la [arquitectura de implementación](../02-modelamiento/arquitectura-de-implementacion.md).

No se fijan aquí las bibliotecas de los adaptadores —servidor HTTP, cliente de PostgreSQL,
cliente de Kafka, SDK de OpenTelemetry—: se eligen al escribir cada adaptador y quedan
registradas en el `package.json` del paquete correspondiente. La decisión de lenguaje y
runtime es la que condiciona el resto; elegir un ORM o un router no cambia la arquitectura
porque el dominio depende de puertos, no de esos detalles.

## 2. Identificador único

AD-007

## 3. Problema o asunto

El plan de pruebas lo dejó escrito: `PENDIENTE: fijar el lenguaje, el marco de pruebas
(equivalente a xUnit) y la herramienta de cobertura`. Sin esa decisión no se puede empezar el
código que la Entrega 3 exige —los veintiún casos unitarios, la SAGA, el outbox, los
adaptadores y la instrumentación— y la entrega vence el 26 de septiembre.

Las fuerzas en tensión:

- **A-12 · modificabilidad de políticas de venta:** el código debe permitir cambiar una
  política sin tocar inventario ni pago; eso se protege con el límite hexagonal, y el stack
  debe hacerlo económico de mantener.
- **A-10 · rendimiento de fila y reserva:** el pico es de 30.000 usuarios en 60 s contra
  5.000 boletas; el runtime debe sostener E/S concurrente masiva con la válvula de admisión
  de [AD-006](0006-escalado-programado-por-ventana-de-venta.md).
- **A-7 · costo por boleta:** menos runtimes y menos imágenes base distintas reducen el costo
  operativo; un solo lenguaje simplifica el equipo.
- **A-1, A-2 y A-3 · dinero, aforo y unicidad:** la garantía no viene del lenguaje sino de
  las transacciones y restricciones de PostgreSQL ([AD-003](0003-consistencia-por-tipo-de-inventario.md))
  y del dominio; el stack solo no debe estorbarla.
- **La restricción real del equipo:** una semana, tres personas y agentes de IA; y una
  **defensa** en la que hay que explicar y sostener el código, no solo mostrarlo.

El material del curso se evalúa por arquitectura, no por sintaxis
([rúbrica](../02-modelamiento/rubrica.md)), así que el stack debe elegirse por velocidad de
entrega, encaje con el diseño y capacidad de defensa, no por preferencia.

## 4. Supuestos

- `[V]` El prototipo, el publicador de la wiki y las utilidades del repositorio ya son
  JavaScript/TypeScript; el equipo trabaja a diario en ese ecosistema. Fuente: este
  repositorio.
- `[V]` El profesor aceptó Kubernetes local o un ambiente simulado con herramientas open
  source para la implementación
  ([transcripción, §16](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación)).
- `[S]` Node.js sostiene los umbrales de A-10 con la válvula de admisión y escalado
  horizontal. Es la hipótesis que la volumetría de la Entrega 3 debe confirmar;
  `PENDIENTE: corridas de carga`.
- `[S]` Ningún contexto de esta entrega es intensivo en CPU (criptografía pesada, video o
  generación masiva de PDF). Si aparece, se aísla en un worker aparte.
- `[S]` El equipo puede defender las decisiones de código igual de bien que con cualquier
  otro lenguaje, porque el curso evalúa arquitectura y no sintaxis.
- `PENDIENTE: fijar la versión LTS exacta de Node y la herramienta de cobertura al iniciar el
  código.`

## 5. Alternativas

Se comparan con los mismos criterios: velocidad de entrega en una semana, encaje con el
diseño hexagonal y DDD, ecosistema para PostgreSQL, Redis, Kafka y OpenTelemetry, concurrencia
para el pico, costo operativo, curva del equipo y defendibilidad.

| # | Alternativa | A favor | En contra y sacrificio |
|---|---|---|---|
| 1 | **TypeScript sobre Node.js** | Un solo lenguaje en todo el proyecto; E/S concurrente natural; ecosistema completo para PostgreSQL, Redis, Kafka y OpenTelemetry; agentes de IA muy productivos; el equipo ya trabaja en JS/TS | Un solo hilo para CPU; los tipos no existen en ejecución y obligan a validar en las fronteras; exige disciplina de estructura para que el monorepo no se vuelva un enredo |
| 2 | **Java con Spring Boot** | El estándar empresarial para DDD y hexagonal; Kafka, PostgreSQL y OTel maduros; hilos virtuales | Más ceremonia, arranque y consumo por servicio; el equipo tendría que sostener en la defensa un código que no usa en el resto del proyecto; setup más lento para una semana |
| 3 | **Python con FastAPI** | Desarrollo rápido, tipado gradual, buen soporte de OTel y Kafka | Tipos sin verificación en ejecución; GIL para cargas de CPU; sumaría un tercer lenguaje al repositorio junto a TS y Python |
| 4 | **Kotlin con Ktor** | JVM con menos ceremonia que Spring; buen encaje con DDD | Menos material, ejemplos y entrenamiento de agentes; incorporación más lenta para el equipo en una semana |

## 6. Decisión

Adoptaremos la **alternativa 1**.

TypeScript estricto sobre Node.js para los cuatro contextos acotados, en un monorepo de npm
workspaces con la estructura hexagonal del diagrama de clases, pruebas con Vitest junto al
dominio y un ambiente local de Docker Compose con PostgreSQL, Redis y Kafka. La topología de
producción no cambia: esta decisión es la capa de lenguaje y herramientas de la
[arquitectura de implementación](../02-modelamiento/arquitectura-de-implementacion.md), que
sigue siendo la referencia para AWS.

El **estado es propuesto**: el equipo debe ratificarlo antes de escribir la lógica de
dominio, igual que se hizo con los cinco ADR técnicos el 16 de septiembre. Si se ratifica,
pasa a **Aceptado** y el esqueleto ya puede crecer con los veintiún casos del plan de
pruebas.

## 7. Justificación

| Necesidad | Respuesta de la decisión |
|---|---|
| **A-12 · cambiar una política sin tocar inventario ni pago** | Un paquete por contexto y la regla de dependencia hexagonal hacen visible el límite; cambiar una política vive en `dominio/` y no toca los puertos de otros contextos |
| **A-10 · sostener el pico** | Node atiende E/S concurrente con poco costo por conexión; la admisión de AD-006 acota el trabajo que llega al núcleo y el escalado es horizontal. Queda por demostrar en la volumetría |
| **A-7 · costo por boleta** | Un solo toolchain y una sola familia de imágenes base reducen operación; los servicios pueden escalar a cero salvo el camino crítico |
| **A-1, A-2 y A-3 · dinero, aforo y unicidad** | La garantía sigue en PostgreSQL y en el dominio, y las transacciones locales del outbox se escriben con el mismo cliente de base; el lenguaje no introduce una segunda semántica |
| **Entrega en una semana** | El equipo y los agentes ya producen TS/JS; no hay curva de lenguaje ni dos ecosistemas que instalar en CI |
| **Defensa** | El código es legible y el equipo puede explicarlo; las decisiones de arquitectura siguen siendo el material de la defensa |

**Precio aceptado:** un runtime de un solo hilo para CPU, tipos que no protegen en ejecución
—se compensa con validación en adaptadores y esquemas en las fronteras— y la disciplina de
mantener el monorepo ordenado. Si la volumetría muestra que Node no alcanza A-10, la decisión
se revisa antes de la entrega, no después.

## 8. Implicaciones

### Consecuencias positivas

- Un solo lenguaje para código, pruebas, carga y utilidades: menos contexto para el equipo y
  para los agentes.
- Los límites del diseño (contextos y hexágono) son verificables en la estructura de
  carpetas y en las dependencias de los paquetes.
- Las pruebas unitarias corren rápido y en cada commit, como exige el plan de pruebas.
- Los paquetes pueden desplegarse por separado cuando la entrega lo pida, sin reescribir.

### Consecuencias negativas, riesgos y deuda asumida

- Los tipos desaparecen en ejecución: toda frontera —HTTP, Kafka, base de datos— necesita
  validación explícita, coherente con [AD-004](0004-datos-personales-almacenamiento-y-acceso.md).
- Trabajo intensivo de CPU bloquearía el proceso; cualquier aparición se aísla en un worker.
- Se asume deuda en herramientas de calidad: lint, formato, cobertura y CI deben configurarse
  y mantenerse; sin ellas el monorepo se degrada.
- Las bibliotecas de cada adaptador quedan pendientes y cada elección sumará su propio ADR si
  compromete un atributo.

### Contratos, seguridad y pruebas

- Ninguna credencial en el repositorio: el ambiente local usa `.env` ignorado por git y
  variables para las claves; los valores de ejemplo van en `.env.example`.
- La validación de entrada vive en los adaptadores; el dominio recibe tipos ya validados.
- Los veintiún casos del [plan de pruebas](../02-modelamiento/plan-de-pruebas.md) se escriben
  con Vitest y sus cuatro dobles (pasarela simulada, reloj, emisor de eventos y repositorio en
  memoria) viven junto al dominio.
- CI ejecuta `typecheck` y pruebas en cada push y cada pull request.

**Costo de reversión:** bajo mientras el esqueleto no tenga lógica; alto una vez escritos el
dominio, la SAGA y los adaptadores.
**Revisar si:** la volumetría no alcanza A-10; aparece carga intensiva de CPU en un contexto;
la defensa revela que el equipo no domina el stack; o los parámetros de la Entrega 3 exigen un
lenguaje específico.

---

**Fuentes:** [plan de pruebas](../02-modelamiento/plan-de-pruebas.md#automatización) ·
[atributos de calidad](../01-caso-de-negocio/atributos-de-calidad.md) ·
[diagrama de clases](../02-modelamiento/diagrama-de-clases.md) ·
[arquitectura de referencia](../02-modelamiento/arquitectura-de-referencia.md) ·
[arquitectura de implementación](../02-modelamiento/arquitectura-de-implementacion.md) ·
[transcripción §16](../../curso/clase-03-04-transcripcion.md#16-pregunta-de-un-estudiante-infraestructura-para-la-implementación) ·
[rúbrica ADR](../02-modelamiento/rubrica.md#2-adr--architectural-decision-record).
