# Estado del curso

> **Nota de importación (19 sep 2026).** Estado del proyecto y del curso hasta la Entrega 2,
> importado desde `aas`. El estado vivo del repositorio y de la Entrega 3 está en
> [`../ESTADO.md`](../ESTADO.md).

> Archivo vivo. Quien avance algo, lo actualiza.
> Última actualización: **2026-09-18**. El
> [modelo de dominio](proyecto/02-modelamiento/modelo-de-dominio.md) se revisó contra la
> rúbrica, el alcance, las validaciones legales y los cinco ADR, y se completó con el
> criterio «un atributo, una regla»: 32 conceptos —22 cajas entre raíces y entidades, 10
> objetos de valor anidados—, doce raíces de agregado (entran **Identidad**,
> **Discrepancia**, y Promotor y Recinto como agregados propios), dieciséis relaciones, catorce invariantes, una sección de tipos y
> enumeraciones, y el desglose del precio en nominal, cargo por servicio y parafiscal. En
> el diagrama cada agregado va enmarcado dentro de su contexto y los atributos se toman del
> propio Markdown; se entrega con el perfil `standard` de Archify porque `showcase` exige
> un lienzo que no cabe con 22 cajas. La composición del diagrama se corrigió ese mismo
> día: el texto de **Fan** ya no se sale de su caja, la conexión Fan → Reserva corre por
> encima de los títulos de contexto, los agregados **Fan** y **Reserva** dejaron de
> quedar pegados bajo los títulos —la relación Fan → Fila de venta se rotuló «recibe
> turno»—, y se separaron los puertos que compartían línea (promotor y recinto → Evento,
> Pago → Boleta y Reventa → Pago). El equipo decidió conservar **Titular** como entidad
> y que un **Pago** pueda originarse en una reserva o en una reventa. Los cinco ADR
> técnicos siguen **aceptados** (16 de septiembre); sus supuestos y pruebas pendientes se
> conservan como condiciones de revisión. Los cinco ADR y
> [`adr-para-excel.md`](proyecto/02-modelamiento/adr-para-excel.md) quedaron alineados con
> los doce atributos de calidad: cada uno se cita con código y nombre la primera vez que
> aparece en un documento, y con su umbral cuando la decisión depende de él. La plantilla `adr-plantilla.xlsx` está
> sincronizada campo a campo con ese Markdown (verificado el 17 de septiembre). La identidad visual común está en
> [`proyecto/design.md`](proyecto/design.md). También están completos los diseños de
> [observabilidad](proyecto/02-modelamiento/observabilidad.md),
> [inyección de fallos](proyecto/02-modelamiento/inyeccion-de-fallos.md) y el
> [diagrama de clases](proyecto/02-modelamiento/diagrama-de-clases.md) del caso «Comprar
> en la ventana de alta demanda» —39 clases en arquitectura hexagonal (aplicación, dominio,
> puertos y adaptadores), decisión que la arquitectura de referencia debe respetar; la
> notación UML la genera `herramientas/postprocesa-diagrama-clases.mjs` desde las tablas del
> Markdown; tras una revisión externa, `Localidad → Silla` pasó a composición, los puertos
> inyectados a agregación compartida, la tabla de relaciones escribe la multiplicidad en
> cada extremo, el visor trae cuatro vistas guiadas y los atributos de calidad se citan por
> nombre y umbral; el 18 de septiembre se dividió en dos vistas de una sola pantalla —dominio y aplicación, puertos y
> adaptadores— porque el profesor advirtió que los diagramas imposibles de ver completos no se
> entienden; el 17 de septiembre, en la rama `consistencia-modelo`, se corrigió
> R2 —la hace cumplir Localidad en `reservar` y `vender`, no Boleta—, R3 fija `venceEn`
> inclusive, R9 deja de exigir una elegibilidad que no existe, entra el VO `Convenio` en
> Promotor y se definen `PasoDeCompra` y los tipos de los adaptadores—, y el mismo día se
> corrigió la composición del diagrama: las dependencias del orquestador ya no corren sobre
> el borde de «Capa de aplicación», los dos «use»/«create» superiores no comparten puerto y
> el grupo «Dominio: eventos y excepciones» quedó anclado por `EventoDeDominio`. Además del
> [plan de pruebas unitarias](proyecto/02-modelamiento/plan-de-pruebas.md) y la
> [volumetría](proyecto/02-modelamiento/volumetria.md). Estos dos últimos —entregables 9 y
> 10, a cargo de Quinnie— definen veintiún casos de prueba deliberados sobre el caso de uso
> elegido y los cuatro escenarios de carga (nominal, pico, estrés, resistencia) sobre los
> 30.000 usuarios en 60 s contra 5.000 boletas ya declarados en A-7 y A-10; el código, la
> ejecución y las corridas quedan para la Entrega 3, igual que ya aplica a observabilidad,
> inyección de fallos y diagrama de clases. UT-07 prueba el vencimiento a los diez minutos
> exactos y UT-19 a UT-21 cubren R11, R12 y R13, con lo que cada regla R1–R14 tiene caso.
> El [diagrama de secuencia](proyecto/02-modelamiento/diagrama-de-secuencia.md) del mismo
> caso quedó completo: 38 mensajes numerados sobre las clases del diagrama 5, siete
> fragmentos de error y compensación, y precondiciones y postcondiciones; la notación de
> fragmentos la genera `herramientas/postprocesa-diagrama-secuencia.mjs`. El mismo día se
> corrigió su legibilidad: el texto del tema claro cumple contraste WCAG AA, las notas y
> las guardas llevan halo del color del fondo, y los cuatro pares nota–rótulo que se
> montaban ganaron aire. El 18 de septiembre se dividió en **dos vistas de una sola
> pantalla** —*reservar y cobrar* y *confirmar, emitir y compensar*— con la misma numeración y
> los mismos participantes, y el [modelo de dominio](proyecto/02-modelamiento/modelo-de-dominio.md)
> ganó un [mapa de contextos y raíces](proyecto/02-modelamiento/modelo-de-dominio-mapa.html) de
> una pantalla —con dos atributos clave por raíz— más cuatro vistas guiadas por contexto: las
> tres piezas —dominio, clases y secuencia— se leen completas sin zoom. La
> [arquitectura de referencia](proyecto/02-modelamiento/arquitectura-de-referencia.md)
> también quedó completa: representa por capas el estilo híbrido Event-Driven con
> Space-Based bajo demanda, núcleo transaccional y CQRS; relaciona componentes, interfaces,
> capacidades tecnológicas, escenarios de calidad y los cinco ADR. Se entrega como vista
> interactiva, fuente Archify, Mermaid y XML importable en diagrams.net, y se contrastó con
> ISO 42010, C4, escenarios de calidad del SEI y AsyncAPI. El 17 de septiembre se compactó
> la composición para verla completa desde 1440×900, se dejó un único portal web y se
> reorganizaron los corredores del Draw.io para evitar líneas sobre las cajas. La
> [arquitectura de implementación](proyecto/02-modelamiento/arquitectura-de-implementacion.md)
> quedó completa el 18 de septiembre: topología de producción en AWS us-east-1 con tres
> zonas, VPC y subredes privadas, correspondencia de cada componente de la referencia con su
> servicio (EKS + KEDA + Karpenter + Fargate, Aurora Multi-AZ con RDS Proxy, ElastiCache,
> MSK Serverless, OpenSearch, Cognito, WAF, KMS), tabla de integraciones con protocolo,
> formato, contrato y errores, IaC con Terraform y GitOps, seguridad con modelo de amenazas,
> perfiles de escalado y costos anclados en el dato `[V]` de Fargate. Se entrega como
> `.drawio` con los iconos oficiales de AWS y los logos de las demás tecnologías —más su
> render de verificación—, como vista interactiva de Archify con cuatro vistas guiadas y
> recibo de validación, y como documento con la matriz de trazabilidad referencia →
> implementación → ADR. La ejecución real sigue siendo de la Entrega 3.
> El [prototipo de interfaz](proyecto/02-modelamiento/prototipo/index.html) —16 pantallas, tres
> roles, mapa de navegación con casos de error y guía de estilo— está en el repo y desplegado
> en <https://harmonious-empanada-797c2e.netlify.app/>. Se aplicó la revisión externa del 17
> de septiembre: la identidad se muestra federada desde la primera pantalla del fan y
> «Datos del comprador» pasó a ser «Confirmar titular» con los datos precargados y casillas
> de consentimiento por finalidad (R11); «Resumen de compra» se renombró a «Tu reserva»;
> `fan-boleta.html` pagina una boleta por código en vez de compartir uno entre dos; y
> `limitePorFan` más `inicioVenta`/`finVenta` quedaron correctos en las pantallas del fan y de
> especificaciones. También se separó la autenticación de la barra lateral a un chip en la
> esquina superior derecha (`.barra-superior`), y se agregó una pantalla nueva,
> [`fan-identidad.html`](proyecto/02-modelamiento/prototipo/fan-identidad.html) («Tu
> identidad»), accesible desde ese chip en cualquier pantalla del fan: muestra los datos de
> la cuenta y permite revisar/revocar los consentimientos por finalidad — ninguna pantalla
> del fan nombra al proveedor externo ni al gestor de identidad que hay entre TicketRight y
> ese proveedor; de cara al fan, iniciar sesión es una acción de TicketRight. No es un paso
> numerado del flujo (sigue siendo de 1 a 8): es satélite, como
> refleja el mapa de navegación. Una autorevisión posterior del prototipo contra el modelo
> encontró seis discrepancias más, ya corregidas: `fan-fila.html` pedía un correo que ya
> conocíamos (el fan está autenticado desde la pantalla 1); `Aforo.reservado` no se mostraba
> en `fan-seleccion.html` ni en `promotor-ocupacion.html` (R1 es `reservado + vendido ≤
> autorizado`, no solo vendido); `EstadoTurno.rechazado` no tenía pantalla; `ReglasReventa`
> (comisión, ventana) no era configurable en ningún lado; las dos filas de
> `operacion-discrepancias.html` abrían siempre el mismo caso en el detalle; y la insignia de
> `fan-eventos.html` mezclaba `EstadoEvento` con una señal de demanda aparte. Todo
> documentado en [`design.md`](proyecto/02-modelamiento/prototipo/design.md). `PENDIENTE:
> volver a desplegar en Netlify con estos cambios.`
>
> **Resuelto al fusionar `consistencia-modelo`:** el hallazgo #3 de esa misma revisión —la
> pantalla «Convenio comercial» agrupa campos (cargo por servicio, comisión de reventa,
> vigencia, estado firmado) que no existían en el modelo— ya no aplica. Esa rama agregó el
> VO `Convenio` dentro de `Promotor` (`cargoServicio`, `comisionReventa`, `vigencia`,
> `estado: EstadoConvenio`), que corresponde campo a campo con lo que ya mostraba
> `operacion-convenio.html`. `PENDIENTE: revisión formal de que los cuatro campos de esa
> pantalla coincidan uno a uno con el VO ya fusionado — a simple vista coinciden.`
>
> El equipo pidió llevar el estilo del sitio un poco más cerca de Ticketmaster y conectar de
> verdad los tres borradores que salieron de esa conversación. El
> [prototipo de interfaz](proyecto/02-modelamiento/prototipo/index.html) ahora tiene **16
> pantallas**: `fan-login.html` es nueva (previa al flujo del fan, no un paso numerado —
> iniciar sesión es de la cuenta, no de la compra); `fan-eventos.html` (pantalla 1) absorbió
> el contenido de inicio (hero, buscador, categorías) sin cambiar de archivo; y
> `fan-seleccion.html` (pantalla 4) reemplazó las tarjetas de localidad por el mapa del
> recinto con contador y barra de total. Los tres archivos `-borrador.html` ya no existen —
> su contenido se movió a las pantallas reales. De paso se aplicó una pasada de minimalismo
> (mismo tema oscuro/lima, solo menos ruido visual) a esas tres pantallas; el resto del
> prototipo no se tocó. Detalle completo en
> [`design.md`](proyecto/02-modelamiento/prototipo/design.md).

## Dónde vamos

**Semana 2 de 4.** La Entrega 1 se entregó el sábado 12 de septiembre: documento en Word,
Canvas en el Excel del profesor y sustentación con presentación propia.

**Entrega activa: Entrega 2 — Modelamiento de la solución.** Vence el **sábado 19 de
septiembre de 2026 a las 3:00 p.m.** — no a medianoche. Se admiten varias entregas.

> **Pasada la Entrega 2, la activa es la Entrega 3** (sáb 26 de septiembre). Su rúbrica llegó
> con las [clases 5 y 6](curso/clase-05-06.md#diapositiva-46--rúbrica-entregable-3-proyecto-integrador)
> y está en [`proyecto/03-implementacion/rubrica.md`](proyecto/03-implementacion/rubrica.md);
> el plan por criterios y el catálogo de patrones están en esa misma carpeta. El estado vivo
> del repositorio de código es [`../ESTADO.md`](../ESTADO.md).

**Son once entregables**, no uno. El enunciado, la rúbrica con sus criterios, la plantilla
de ADR del profesor y lo que explicó en clase están organizados en
[`proyecto/02-modelamiento/README.md`](proyecto/02-modelamiento/README.md). **Los
entregables 2, 3 y 4 —ADR, arquitectura de referencia y arquitectura de implementación—
concentran el 65% de la nota.**

> **El alcance está confirmado: los once entregables son de esta entrega, y todos son de
> definición y diseño.** No hay código ni infraestructura: se entrega *cómo va a ser*, *qué
> se va a tener en cuenta* y *cómo se haría* — observabilidad, pruebas, volumetría e
> inyección de fallos incluidas. **La implementación real es la Entrega 3.** Por eso la
> rúbrica pide evidencia de ejecución en varios criterios: es la rúbrica del proyecto
> completo, no la de esta semana.

`PENDIENTE: la nota y la retroalimentación de la Entrega 1 no han llegado.`

## Entrega 1 — qué se entregó ✅

Todo el detalle en el [README de la entrega](proyecto/01-caso-de-negocio/README.md).

| Artefacto | Archivo | Se subió como |
|---|---|---|
| Documento del caso de negocio | [`caso-de-negocio-ticketright.docx`](proyecto/01-caso-de-negocio/caso-de-negocio-ticketright.docx) | `TicketRight - Caso de Negocio.docx` |
| Business Model Canvas | [`canvas-ticketright.xlsx`](proyecto/01-caso-de-negocio/canvas-ticketright.xlsx) | `Modelo_canvas_excel_2026.xlsx` |
| Sustentación | [`presentacion.md`](proyecto/01-caso-de-negocio/presentacion.md) | <https://wondrous-monstera-174b32.netlify.app/> |

La fuente del documento es
[`caso-de-negocio-corporativo.md`](proyecto/01-caso-de-negocio/caso-de-negocio-corporativo.md):
cinco componentes, cuatro OKR con 16 KR, dieciséis fuentes públicas y una conclusión de
coherencia integral. **Si hay que corregir algo, se corrige en el Markdown y se reexporta.**

Nunca se generó el PDF —`pandoc` no está instalado— y se entregó en `.docx`, que era la
alternativa prevista. Dos detalles que quedaron desalineados están anotados en el README de
la entrega.

### El cambio de nombre

El negocio se llamaba **«Puesto»**; se entregó como **TicketRight**. Todo el repositorio
está actualizado, incluidos [AD-001](proyecto/decisiones/0001-idea-de-negocio.md) y la idea
original, que además dejan nota de cómo se llamaba antes. El archivo
`proyecto/01-caso-de-negocio/canvas-puesto.xlsx` es el Canvas anterior al cambio: **quedó
superado, no se edita ni se entrega**.

`PENDIENTE: nadie ha verificado disponibilidad de dominio y marca de «TicketRight».`

## Lo que la Entrega 1 le deja servido a la Entrega 2

Esto es lo que hay que tener abierto el lunes. **No hay que empezar de cero: hay que
consumir lo que ya está escrito.**

| Insumo | Dónde | Por qué importa |
|---|---|---|
| **Los doce atributos de calidad con umbral y condición de medición** | [`atributos-de-calidad.md`](proyecto/01-caso-de-negocio/atributos-de-calidad.md) | ⭐ Es el insumo n.º 1. Sin umbrales no hay contra qué evaluar la arquitectura |
| **El estilo de arquitectura aceptado**, con alternativas y sacrificios | [AD-005](proyecto/decisiones/0005-estilo-de-arquitectura.md) | Arquitectura híbrida Event-Driven con Space-Based bajo demanda, núcleo PostgreSQL y CQRS. La cotidianidad opera en mínimo y sin fila visible |
| **Estrategia de implementación** y seis hitos | [anexo B](proyecto/01-caso-de-negocio/caso-de-negocio.md#anexo-b--estrategia-de-implementación) | Alimenta la Entrega 3 |
| **Las cadenas de trazabilidad**, incluida la de vuelta hacia la arquitectura | [§6](proyecto/01-caso-de-negocio/caso-de-negocio.md#6-trazabilidad) | «Del negocio → sale este atributo → fuerza esta decisión → y cuesta esto» |
| **Los OKR entregados** | [§5 del entregable](proyecto/01-caso-de-negocio/caso-de-negocio-corporativo.md#5-objetivos-y-resultados-clave) | Dos KR son atributos técnicos disfrazados: el costo por boleta y la conversión en el pico |
| **Las restricciones legales `[V]`** | [`validaciones.md`](proyecto/01-caso-de-negocio/validaciones.md) | Parafiscal, retracto, datos personales y aforo no son contexto: son requisitos que la arquitectura tiene que sostener |
| **El sistema de diseño visual** | [`proyecto/design.md`](proyecto/design.md) | Colores, tipografía, espaciado y reglas comunes para presentaciones, diagramas, prototipos y sitios |

Y la pregunta con la que cerramos la sustentación, que es literalmente el enunciado de la
Entrega 2:

> **¿Qué decisiones arquitectónicas se justifican a partir de este modelo de negocio?**

El guion propuesto para la entrega está en
[`proyecto/02-modelamiento/README.md`](proyecto/02-modelamiento/README.md).

## Lo primero que hay que hacer

**Todo lo que falta se decide en una reunión de equipo.** La agenda, con la base para
llegar con algo que revisar en vez de una hoja en blanco, está en el
[README de la Entrega 2](proyecto/02-modelamiento/README.md#la-reunión-de-equipo):

| # | Qué hay que sacar de la reunión |
|---|---|
| 1 | ✅ **Cinco decisiones de ADR ratificadas** — AD-002 a AD-006, aceptadas el 16 de septiembre de 2026 |
| 2 | ✅ **El caso de uso**: *Comprar en la ventana de alta demanda*, del turno admitido a la boleta emitida, con capas hexagonales — decidido el 17 de septiembre; principal, con revender y devolver el dinero como complementarios |
| 3 | **Ratificar los doce umbrales de [`atributos-de-calidad.md`](proyecto/01-caso-de-negocio/atributos-de-calidad.md)** — leer los doce compromisos y decir sí o cambiarlos |
| 4 | **Repartir el trabajo** — el 65% está en tres entregables, así que no puede ser uno por persona |

**Los ADR son el entregable de más peso**, no un trámite paralelo: AD-005 define la
estructura híbrida y sus perfiles cotidiano/pico; AD-003 la autoridad del inventario y
CQRS; AD-006 la activación de la fila Space-Based y el escalado; AD-002 la SAGA de pago y
emisión; y AD-004 la seguridad en el borde, la admisión y la identidad. Juntos cubren
estructura, datos, despliegue, integración y transversales.

## Lo que está sin registrar en este repo

No son bloqueos del proyecto, pero alguien tiene que responderlos:

- **El código fuente de la presentación** de la Entrega 1 no está en el repo, solo el
  despliegue en Netlify.
- **La nota de la Entrega 1.**

## Tablero

| # | Entrega | Peso | Fecha | Estado |
|---|---|---|---|---|
| 1 | Caso de negocio | 20% | sáb 12 sep 2026 | ✅ **Entregada.** Falta la nota |
| 2 | Modelamiento de la solución | 30% | **sáb 19 sep 2026, 3 p.m.** | 🟡 **Activa.** Los once entregables están listos y el paquete final quedó organizado en `exportaciones/entrega-02-modelamiento/` (más el ZIP hermano). Falta redesplegar el prototipo y subir a Teams |
| 3 | Implementación, sustentación, simulación y defensa | 30% | sáb 26 sep 2026 | 🟡 **Activa.** Rúbrica y plan en [`proyecto/03-implementacion/`](proyecto/03-implementacion/README.md); el código vive en el repositorio [TicketRight](https://github.com/alejoriosm04/TicketRight) |

> **Paquete de la Entrega 2.** La entrega final está en `exportaciones/entrega-02-modelamiento/`
> (carpeta ignorada por git), con su ZIP en `exportaciones/entrega-02-modelamiento.zip`.
> Cada PDF lleva portada, el documento y sus vistas de diagrama; el ADR va en PDF —con la
> matriz de alternativas y la trazabilidad a componentes— y en el Excel del profesor; el
> prototipo va como carpeta navegable más el enlace desplegado. `herramientas/prepara-entrega-02.py`
> reconstruye la versión base en `exportaciones/entrega-02/` por si hay que regenerar los PDF.
> Dos cosas antes de subir: **redesplegar el prototipo en Netlify** (pendiente desde el 18 de
> septiembre; el despliegue actual no corresponde al último estado del repo) y verificar la
> URL. La copia de entrega del Excel quedó alineada a `AD-002`…`AD-006`; el archivo fuente
> `adr-plantilla.xlsx` del repo todavía usa `AD-0001`…`AD-0005` y hay que alinearlo también.

## Decisiones

| ADR | Decisión | Estado |
|---|---|---|
| [AD-001](proyecto/decisiones/0001-idea-de-negocio.md) | Idea de negocio: boletería de alta demanda | ✅ Aceptada, 7 sep |
| [AD-002](proyecto/decisiones/0002-mensajeria-del-bus-de-eventos.md) | SAGA orquestada con eventos durables para pago y emisión | ✅ **Aceptado**, 16 sep — prueba de fallos pendiente |
| [AD-003](proyecto/decisiones/0003-consistencia-por-tipo-de-inventario.md) | PostgreSQL como autoridad del inventario y CQRS para consultas | ✅ **Aceptado**, 16 sep — prueba de concurrencia pendiente |
| [AD-004](proyecto/decisiones/0004-datos-personales-almacenamiento-y-acceso.md) | Seguridad por capas, admisión firmada e identidad aislada | ✅ **Aceptado**, 16 sep — validación jurídica y antifraude pendientes |
| [AD-005](proyecto/decisiones/0005-estilo-de-arquitectura.md) | Arquitectura híbrida Event-Driven con Space-Based bajo demanda | ✅ **Aceptado**, 16 sep |
| [AD-006](proyecto/decisiones/0006-escalado-programado-por-ventana-de-venta.md) | Activación de la sala Space-Based y escalado elástico por perfil | ✅ **Aceptado**, 16 sep — pruebas de capacidad, transición y costo pendientes |
| — | ~~Dónde vive el código de la Entrega 3~~ | ✅ **Repositorio aparte.** `PENDIENTE: la URL` |

El cambio de nombre a TicketRight **no se registró como ADR**: se aplicó en todo el repo y
se dejó nota en AD-001 y en la idea original. Si el equipo quiere el ADR, hace falta lo que
un agente no puede inventar — por qué se cambió y qué alternativas se consideraron.

## Dudas para el profesor

- **La diapositiva 46 de las clases 5 y 6 trae una nota manuscrita «¿Máximo?»** junto al
  título de la rúbrica. ¿El puntaje del entregable tiene tope (por ejemplo, antes de
  ponderar) o se refiere al tope de los +10 adicionales?
- **¿Formato y duración del video demo del Entregable 3?** ¿Basta un ambiente local con la
  demo grabada o se esperan accesos a un despliegue?
- **¿El `.docx` estuvo bien como formato de entrega?** Se entregó Word y no PDF.
- La definición de **política** de la lámina 17 (externa, sin excepciones) contradice la del
  cuestionario de fundamentos (interna, con ruta de excepción). ¿Cuál aplica?
- Lámina 47: ¿cuál es la respuesta correcta sobre el valor de la arquitectura?
- ¿El **DAFO** del xlsx hacía parte del entregable? No se incluyó y la rúbrica no lo
  menciona; está escrito en el
  [anexo C](proyecto/01-caso-de-negocio/caso-de-negocio.md#anexo-c--análisis-de-posición-dafo).
