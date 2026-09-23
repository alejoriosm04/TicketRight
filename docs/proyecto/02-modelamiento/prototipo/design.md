# Sistema de diseño del prototipo (Entregable 7)

> Identidad visual específica para las pantallas de TicketRight. No sustituye
> [`proyecto/design.md`](../../design.md), que es la identidad común para presentaciones,
> diagramas y documentos gráficos — ese archivo sigue usando la paleta clara con azul
> primario y no se modifica aquí.

**Fuente:** CSS computado del sitio real de la Entrega 1,
[`wondrous-monstera-174b32.netlify.app`](https://wondrous-monstera-174b32.netlify.app/),
inspeccionado el 2026-09-17. A diferencia de `proyecto/design.md`, esta paleta sí coincide
con lo que ya vieron el profesor y los compañeros en la sustentación.

## Por qué un archivo separado

El sitio de la Entrega 1 usa un tema oscuro con acento lima; `proyecto/design.md` describe
un tema claro con acento azul que nunca coincidió con ese sitio. Son dos identidades
distintas y ninguna es un error por sí sola — pero mezclarlas en una sola pieza sí lo sería.
El prototipo de UI/UX (pantallas de fan, promotor y operación interna) usa **esta** paleta
porque es la que el negocio ya mostró en público. Si más adelante el equipo decide unificar
ambos documentos, se hace explícitamente, no por acumulación de parches.

## Tipografía

```css
--font-heading: Figtree, ui-sans-serif, system-ui, sans-serif;
--font-body: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
```

Figtree en títulos y encabezados de pantalla; IBM Plex Sans en navegación, cuerpo, botones,
formularios y etiquetas.

## Color

Los semánticos de éxito/advertencia/peligro no existen en el sitio original — es una
presentación, no una aplicación con estados de operación. Se proponen `[S]` ajustados a un
fondo oscuro; el equipo debe confirmarlos al construir las primeras pantallas con estado de
error (pago rechazado, reserva vencida, aforo agotado).

```css
:root {
  --color-bg: #0b0d10;              /* [V] fondo base del sitio real */
  --color-surface: #12161c;         /* [V] tarjetas y bloques elevados */
  --color-surface-overlay: rgba(11, 13, 16, 0.35); /* [V] paneles sobre imagen o degradado */

  --color-text: #f4f0e8;            /* [V] texto principal */
  --color-text-muted: #a39e93;      /* [V] texto secundario, metadatos */
  --color-border: rgba(244, 240, 232, 0.12); /* [V] líneas divisorias translúcidas */

  --color-primary: #e8ff47;             /* [V] acento lima */
  --color-primary-text-on: #0b0d10;     /* [V] texto sobre fondo lima */
  --color-primary-soft: rgba(232, 255, 71, 0.14); /* [V] fondos suaves de énfasis */

  --color-success: #34d399;   /* [S] no está en el sitio original, ajustado a fondo oscuro */
  --color-warning: #fbbf24;   /* [S] idem */
  --color-danger: #f87171;    /* [S] idem */
}
```

### Reglas de uso

- Fondo de página siempre oscuro (`--color-bg` o `--color-surface`); nunca blanco.
- El lima destaca navegación activa, cifras importantes (posición en la fila, precio) y la
  acción principal de cada pantalla — nunca como color de fondo extenso.
- Texto sobre fondo lima usa `--color-primary-text-on` (oscuro), nunca blanco.
- Los estados (reserva vencida, pago rechazado, aforo agotado) nunca se comunican solo por
  color: van con texto y, cuando aplique, un icono.

## Botones

```css
/* Principal */
background: var(--color-primary);
color: var(--color-primary-text-on);
border-radius: 999px;   /* pill, confirmado contra el sitio real */
padding: 12px 24px;
font-weight: 600;

/* Secundario */
background: transparent; /* o var(--color-surface) */
border: 1px solid var(--color-border);
color: var(--color-text);
border-radius: 999px;
```

## Tarjetas

```css
background: var(--color-surface);
border-radius: 12px;
box-shadow:
  0 24px 60px rgba(0, 0, 0, 0.5),
  0 0 0 1px rgba(255, 255, 255, 0.08);
```

## Tema claro

**Agregado el 2026-09-17,** a pedido del equipo: la barra lateral trae un interruptor
claro/oscuro persistente (`localStorage`). El oscuro sigue siendo el que coincide con el
sitio real; el claro es una variante `[S]` calibrada para mantener contraste legible, no una
fuente verificada:

```css
html[data-tema="light"] {
  --color-bg: #f7f6f2;
  --color-surface: #ffffff;
  --color-text: #14171c;
  --color-text-muted: #5b5750;
  --color-border: rgba(20, 20, 20, 0.12);
  --color-primary: #e8ff47;             /* el lima se conserva como fondo de botón */
  --color-primary-text-on: #14171c;
  --color-accent-text: #7a8a00;         /* lima puro falla el contraste en texto sobre blanco */
}
```

`--color-accent-text` es un token nuevo: úsalo para texto o iconos con el color de marca
(navegación activa, enlaces destacados). `--color-primary` sigue siendo solo para fondos de
botón, donde el texto oscuro siempre es legible sin importar el tema.

## Patrón de navegación: barra lateral

15 de las 16 pantallas comparten `nav.js`, que construye la barra lateral con: un selector
de perfil (Fan / Promotor / Operación interna), la lista de pantallas de ese perfil con la
actual resaltada, el **simulador de estado** (ver siguiente sección) y el interruptor de
tema. Ningún archivo HTML repite ese marcado — lo inyecta el script. Layout: `.app-layout`
(flex) con `.barra-lateral` (fija, 260px) y `.contenido-principal`; en móvil la barra pasa a
ser una franja horizontal arriba. La excepción es `fan-login.html`: es previa a la sesión,
así que no tiene perfil que seleccionar ni pasos que numerar — no carga `nav.js` ni usa
`.app-layout`, es una pantalla centrada y sola.

**Regla del 2026-09-17:** ninguna pantalla puede mostrar controles de "herramienta de
prototipo" dentro del contenido (pills de "vacío/carga/error", notas explicando qué es un
selector). Todo lo que el contenido muestra debe leerse como si ya fuera producción; lo que
sirve para demostrar el prototipo vive exclusivamente en la barra lateral.

**Ampliación del 2026-09-17:** la misma regla aplica al texto, no solo a los controles.
Ningún copy debe explicarle al usuario una decisión de implementación ("por qué este campo
no se puede editar", "por qué esta casilla es obligatoria") — un campo deshabilitado ya se
ve deshabilitado, una casilla marcada y bloqueada ya se ve bloqueada; una app real confía en
esas convenciones y no las narra. Se quitaron, por sobreexplicativos: el bloque "Por qué no
se edita aquí" de `fan-identidad.html` (el campo gris ya lo dice), las notas "Es
obligatoria…" / "Es opcional…" bajo las casillas de consentimiento (lo dice el propio
estado del checkbox), y el botón "Actualizar con tu proveedor de identidad" se volvió un
enlace de una línea ("Editar en tu proveedor de identidad ↗") — así es como Google o
Facebook resuelven "esto no se edita aquí": un enlace que saca de la app, no un botón que
necesita una tarjeta entera explicando la relación con el proveedor. La única explicación
que sobrevive es la que cambia lo que el usuario haría ("Por qué lo confirmamos" en
`fan-datos.html`: le dice que la boleta queda a nombre de esa identidad, algo que no es
obvio con solo ver el campo). Regla práctica: si tapar el texto de ayuda no cambia lo que el
usuario haría en la pantalla, el texto de ayuda no debería existir.

### El simulador de estado, y por qué no vive en el contenido

Varias pantallas necesitan mostrar más de un estado (`EstadoPago`, `EstadoTurno`…) sin tener
una pantalla por estado. Antes había una fila de botones dentro del contenido para elegirlos
— eso rompía la ilusión de producto real. Ahora cada página que lo necesita declara sus
estados antes de cargar `nav.js`:

```html
<script>
  window.ESTADOS_SIMULADOS = {
    grupo: "fila",
    inicial: "vacio",
    opciones: [{ valor: "vacio", etiqueta: "Antes de abrir" }, /* … */]
  };
</script>
<script src="nav.js"></script>
```

`nav.js` lee ese objeto y agrega el `<select>` "Simular estado" a la barra lateral —nunca al
contenido—, y expone `window.aplicarEstadoSimulado(grupo, valor)` para que la propia página
lo dispare (por ejemplo, el botón **Pagar** de `fan-pago.html` ya no depende del selector:
hace clic → `procesando` → después de 1.8 s, `confirmado`, como pasaría con una pasarela
real. El selector solo queda para llegar directo a los estados de borde —rechazado,
conciliación— sin repetir el flujo feliz cada vez).

**Ajuste del 2026-09-18:** al mover el selector a la barra lateral, las opciones perdieron
la palabra "Error" que tenían los botones originales, y se volvieron difíciles de encontrar
—parecían una opción más de la lista, no el caso de borde que hay que revisar—. Los estados
que representan una falla real vuelven a decir explícitamente **"Error — …"** (turno
vencido, aforo agotado, reserva vencida, pago rechazado) o **"Alerta — …"** cuando no es un
error sino una demora (pago en conciliación); los estados normales del flujo (antes de
abrir, conectando, en cola…) no llevan prefijo.

**Ajuste del 2026-09-18 (segunda vuelta):** dos correcciones más de discoverability y de
consistencia visual:

- El simulador ya no vive en un bloque genérico "SIMULAR ESTADO" al final de la barra —
  aparece **debajo del ítem de la pantalla actual**, dentro de la misma lista de navegación,
  para que sea obvio a qué pantalla pertenece.
- El `<select>` nativo (persona y estado) se reemplazó por un menú propio
  (`crearMenuDesplegable` en `nav.js`): botón + lista flotante con la tipografía, los radios
  y los estados de hover del resto de la app. Un `<select>` de sistema operativo nunca se ve
  "de la app", sin importar cuánto se le cambie el borde.

### Fila de venta: pista gráfica

**Ajuste del 2026-09-18:** la posición ya no es solo un número que baja — hay una pista con
un icono 🎫 que avanza hacia una meta 🏁, con `transition` en `width` y en `left`, calculado
como `1 − posición / posiciónInicial`. Es puramente ilustrativo (no representa la fila real
de otros fans), pero comunica "te estás acercando" mejor que un contador.

### Notificarme: correo real, no un interruptor

**Ajuste del 2026-09-18:** el interruptor on/off no dejaba escribir nada — mostraba un correo
inventado (`n***@correo.com`). Ahora es un formulario real: `<input type="email">` +
botón **Notificarme**, y la confirmación repite el correo que la persona escribió. Sin
backend, sigue siendo texto en pantalla, pero ya no finge un dato que nadie dio.

### `fan-datos.html` — la identidad se pide antes de pagar, no después

**Ajuste del 2026-09-18:** faltaba el paso que registra `Identidad` y
`Documento de identidad` del [modelo de dominio](../modelo-de-dominio.md#admisión-e-identidad)
— nombre completo, tipo y número de documento, correo. Se agregó entre "Resumen de compra" y
"Pago": tiene sentido de negocio (el control de acceso valida el documento en la puerta, no
la tarjeta) y de UX (nadie quiere escribir su cédula justo después de que la tarjeta fue
rechazada).

**Corrección del 2026-09-17 (revisión externa):** ese diseño seguía pidiendo los datos como
si el fan no tuviera identidad hasta ese punto, y eso contradice el modelo — `Turno.fanId` y
`Reserva.fanId` ya existen desde antes de esta pantalla, porque la identidad se federa al
entrar a la fila
([AD-004](../../decisiones/0004-datos-personales-almacenamiento-y-acceso.md)). Un chip con
avatar de iniciales y nombre ("QV — Quinn Villa") aparece en la esquina superior derecha del
contenido en toda pantalla del fan (`nav.js`, función `construirBarraSuperior`, clase
`.barra-superior`), y
`fan-datos.html` pasó de pedir datos a **confirmarlos**: los campos de `Identidad` llegan
precargados y deshabilitados —se editan en la Identidad, no aquí—. También se agregó una
casilla de consentimiento por cada `FinalidadTratamiento` que aplica en este punto (emisión,
notificación, transferencia al promotor), como exige R11 y la Ley 1581 `[V]`.

**Segunda corrección del 2026-09-17:** el chip vivía primero dentro de la barra lateral,
junto al selector de perfil — pero esa barra ya es "herramienta de navegación del
prototipo" (numeración de pasos, simulador de estado), y mezclar ahí un dato real del
dominio (la sesión del fan) confundía las dos cosas. Se movió a `.barra-superior`, una fila
propia arriba del contenido, alineada a la derecha, fuera de `.barra-lateral`. El chip
enlaza a una pantalla nueva, **`fan-identidad.html`** ("Tu identidad"): muestra los datos
que vienen del proveedor federado (solo lectura — se editan allá, no en TicketRight, según
el mismo AD-004) y la lista de `Consentimiento` del fan con la opción de revocar los que no
son obligatorios (`Consentimiento.revocadoEn`, R11). No es un paso numerado del flujo de
compra —sigue siendo 1 a 8—, así que en el mapa de navegación (`index.html`) se dibuja como
un nodo satélite, con borde punteado neutro y sin flechas, en vez de sumarse a la fila
principal.

**Tercera corrección del 2026-09-17:** las frases de las tres casillas eran descriptivas
("Notificación por correo sobre...") en vez de una autorización. [validaciones.md](../../01-caso-de-negocio/validaciones.md#datos-personales-en-boleta-nominal)
exige que la Ley 1581 se cumpla con "autorización previa, expresa e informada" — una
etiqueta no autoriza nada, un verbo en primera persona sí. Se reescribieron como "Autorizo
el tratamiento de mis datos personales para..." + la finalidad exacta, iguales en
`fan-datos.html` y `fan-identidad.html` (antes decían cosas distintas para el mismo
consentimiento). A la casilla obligatoria y a la de transferencia se les agregó una nota
corta debajo explicando por qué es obligatoria o que es revocable — la explicación no cabe
en el texto de la autorización misma sin volverlo ilegible.

**Cuarta corrección del 2026-09-17:** dos ajustes más, pedidos después de ver la pantalla.
Las notas de ayuda sonaban a texto legal ("Obligatorio para comprar — sin esta autorización
no hay boleta que emitir ni puerta que validar.") en vez de a alguien explicándotelo; se
reescribieron en un tono más directo ("Es obligatoria: sin ella no podemos emitirte la
boleta ni dejarte entrar en la puerta."). Y `fan-identidad.html` mostraba cada
consentimiento como una insignia "otorgado"/"no otorgado" con un botón "Revocar" aparte —
dos formas de decir lo mismo que ya existía como casilla en `fan-datos.html`. Se unificó:
`fan-identidad.html` también usa `.casilla`, así que otorgar o revocar es marcar o
desmarcar la misma casilla, no dos patrones de interacción distintos para la misma acción.

**Quinta corrección del 2026-09-17:** la palabra "Autenticado" en el chip era redundante —
ver tu propio nombre en la esquina superior ya comunica que hay una sesión activa, decirlo
además con una insignia aparte no agrega información, solo ruido. Se reemplazó la insignia
por un avatar de iniciales (`.avatar-iniciales`, círculo con "QV"), el patrón que cualquier
fan ya reconoce de otras apps como "esta es tu cuenta" sin tener que leer una palabra.

### `promotor-metricas.html` — gráficas lado a lado, expandibles, con ayuda

**Ajuste del 2026-09-18:** `.rejilla-graficos` pone el embudo y la tendencia en dos columnas
(una sola en móvil). Cada tarjeta tiene un botón `⤢` que le agrega la clase `.expandida`
(`grid-column: 1 / -1`) y dispara `window.dispatchEvent(new Event('resize'))` para que
Chart.js recalcule su tamaño — sin ese evento, el canvas se queda con las dimensiones viejas.
El ícono ⓘ junto a cada título abre, al pasar el mouse, un globo con la lectura de la
gráfica: qué significa la caída entre barras, qué significa que la curva se aplane. Chart.js
ya pone su propio tooltip por punto; este globo explica el concepto completo, no un dato.

### Operación interna: el convenio va antes que las especificaciones

**Ajuste del 2026-09-18:** el orden original sugería que el evento podía especificarse
suelto. Se corrigió para que refleje la regla real: **ningún evento existe sin un promotor
asociado a través de un convenio comercial vigente** (`Promotor → Evento`, cardinalidad
`1:0..*` en el modelo de dominio). `operacion-convenio.html` es ahora el primer paso de la
consola, y `operacion-especificaciones.html` muestra explícitamente a qué convenio pertenece
el evento que se está configurando, con enlace de vuelta.

### Por qué `cobroSinBoleta` no es una boleta vendida sin registro

**Pregunta del 2026-09-18, respondida y documentada en la pantalla:** el temor era que el
sistema pudiera cobrar sin nunca haber apartado inventario. No es así — R1/R3/R4 obligan a
que la **Reserva** exista y descuente `Aforo.reservado` *antes* de que el pago pueda
iniciarse. `cobroSinBoleta` describe el hueco entre "la pasarela confirmó el cobro" y "el
sistema terminó de crear el registro `Boleta`" — un problema de contabilidad entre dos
eventos, no de inventario. `operacion-detalle.html` ahora lo dice explícitamente en la línea
de tiempo y en una nota aparte: el inventario de la reserva de origen estuvo retenido desde
el primer evento, nunca disponible para otro comprador mientras el caso estuvo abierto.

**Corrección del 2026-09-17 (revisión externa):** esa nota decía "las 2 sillas de General"
— pero General es una localidad `general`, sin `Silla`; solo `Aforo.reservado` cuenta
cupos. Se corrigió a "los 2 cupos de General". También se quitó el código interno `(A-1)`
del indicador de edad del caso: es un identificador de la rúbrica, no del lenguaje ubicuo,
y no debería aparecer en una pantalla que usa un analista.

### El mapa de navegación (`index.html`) es un diagrama, no una lista

**Ajuste del 2026-09-18 (tercera vuelta):** la lista de tarjetas apiladas no mostraba los
estados de error, y no se leía como un flujo. Se rehizo como un tablero fijo (nodos HTML
posicionados por coordenadas + un `<svg>` de líneas superpuesto, al estilo de un frame de
Figma): un marco punteado por perfil, flechas sólidas para el flujo principal y flechas
rojas o ámbar punteadas hacia los nodos de error/alerta. Para que un nodo de error abra la
pantalla ya en ese estado, `nav.js` ahora lee `?estado=` de la URL y lo usa como estado
inicial del simulador si es una opción válida de esa pantalla —
`fan-fila.html?estado=vencido` abre la fila directo en "turno vencido"—.

Solo se dibujaron ramas de error donde realmente existe un estado `EstadoPago`/`EstadoTurno`
etc. marcado "Error —" o "Alerta —" en el propio `ESTADOS_SIMULADOS` de esa pantalla — el
mapa no inventa casos que el prototipo no tiene.

### El mapa de navegación es responsive: se ajusta o cambia de forma

**Ajuste del 2026-09-18 (cuarta vuelta):** el diagrama horizontal tiene coordenadas fijas
(1650×650px) — en una pantalla angosta simplemente no cabe. Dos soluciones, no una:

- **Ajuste de escala:** `index.html` mide `clientWidth` del contenedor y aplica
  `transform: scale()` al diagrama completo para que siempre quepa en el ancho disponible,
  recalculando en cada `resize`. Es el mismo truco de "zoom to fit" de Figma.
- **Vista vertical alternativa:** para pantallas realmente angostas, escalar deja de servir
  —el texto se vuelve ilegible—. Se agregó una segunda vista, construida con el mismo
  componente de línea de tiempo de `operacion-detalle.html` (`.linea-tiempo-mapa`,
  `.nodo-tiempo`): cada persona es una columna vertical fluida, sin ancho fijo, con los
  nodos de error intercalados e indentados en rojo/ámbar. No repite coordenadas absolutas,
  así que es responsive por naturaleza, no por cálculo.

**Ajuste del 2026-09-18 (quinta vuelta):** el control manual `↔ Horizontal / ↕ Vertical`
resultó innecesario una vez que el cambio automático por ancho ya funcionaba bien — se quitó,
junto con el párrafo de instrucciones bajo el título. La vista cambia sola en
`window.innerWidth < 860` (el mismo punto de quiebre que ya usa la barra lateral para pasar a
franja horizontal), sin botón ni preferencia guardada que mantener.

### El convenio comercial no necesita explicar su propia regla

**Ajuste del 2026-09-18:** `operacion-convenio.html` tenía una alerta explicando "todo
evento nace de un convenio" — obvio para quien ya trabaja ahí. Se quitó: el orden de la
barra lateral (convenio antes que especificaciones) y el enlace en
`operacion-especificaciones.html` ya comunican la regla sin tener que decírsela al usuario
que la aplica todos los días.

### Las gráficas del promotor: expandir de verdad, no solo el contenedor

**Ajuste del 2026-09-18:** el botón `⤢` cambiaba el ancho de la tarjeta pero Chart.js
mantenía el canvas con la altura calculada en el primer render, porque el contenedor no
tenía una altura propia — sin `position: relative` y una altura explícita en el padre,
`maintainAspectRatio` no tiene contra qué crecer. Se agregó `.cuerpo-grafico` (alto fijo,
240px → 440px al expandir, con `transition`) y `maintainAspectRatio: false` en ambos
`Chart.js`; ahora el canvas ocupa exactamente esa caja y sí se ve más grande.

### Transiciones entre pantallas

Como son páginas HTML estáticas (sin router), `nav.js` intercepta los clics en enlaces
internos: atenúa `.contenido-principal` a opacidad 0 y navega 150 ms después; al cargar, la
misma zona aparece con la animación `aparecer` que ya existía para los paneles de estado.
El resultado se siente como una transición de una sola aplicación aunque cada pantalla sea
un archivo distinto.

## Responsabilidades por perfil — revisado el 2026-09-17

El reparto original (README de la Entrega 2) asumía que el promotor se autogestionaba el
evento desde una consola propia. El equipo lo corrigió: el promotor **no** configura el
evento ni el convenio — eso lo hace el equipo comercial e interno de TicketRight, porque son
quienes tienen la relación contractual y los datos verificados. El promotor solo consulta
resultados.

| Perfil | Pantallas | Qué hace |
|---|---|---|
| **Fan** | Eventos disponibles, evento, fila, selección, tu reserva, confirmar titular, pago, boleta | Ejecuta el caso de uso principal, de punta a punta |
| **Promotor** | Resumen de ventas, ocupación y velocidad de venta | Solo lectura: KPIs, embudo de conversión, ocupación por localidad. No edita nada |
| **Operación interna** | Convenio comercial, especificaciones del evento, discrepancias abiertas, detalle de discrepancia | Registra el convenio comercial (requisito previo de cualquier evento), monta el evento (incluida la configuración de sillas cuando la localidad es `numerada`) y resuelve las excepciones de A-1 |

`PENDIENTE: el equipo debe decidir si "operación interna" en el negocio real es un solo rol
o si especificaciones/convenio y conciliación de discrepancias los hacen personas distintas
dentro de TicketRight — aquí se prototipan como una sola consola por simplicidad.`

### Por qué el detalle de discrepancia trae línea de tiempo y precedentes

Ajuste del 2026-09-17: la primera versión mostraba una sola fila de tabla y un párrafo — no
había suficiente información para que un analista decidiera entre reintentar la emisión,
devolver el dinero o marcar sin acción. `operacion-detalle.html` ahora trae: un indicador
circular de edad del caso contra el umbral de 15 minutos (A-1), una línea de tiempo con cada
evento del pago (turno → reserva → pago → reintento de la pasarela → discrepancia), el
detalle de lo que compró el fan, y una lista de **casos similares resueltos hoy** con la
acción que funcionó — el mismo patrón que usaría un panel de soporte real para decidir por
precedente, no a ciegas.

### `promotor-ocupacion.html` — separar "vendido" de "rápido"

Ajuste del 2026-09-18: la primera versión pintaba de rojo tanto la barra de una localidad
agotada como la celda "caliente" del mapa de velocidad, y usaba la misma escala
verde-ámbar-rojo para ambas. Dos problemas: rojo se lee como *error* en el resto del
prototipo (aforo agotado del fan, pago rechazado), pero para el promotor **agotar una
localidad es la mejor noticia posible**, no una falla; y al repetir la escala, las dos
secciones parecían mostrar el mismo dato dos veces. Se separaron:

- **"Cuánto se ha vendido"** ya no usa rojo. La barra siempre rellena en lima (color de
  marca, neutro-positivo) y "agotado" se marca con una insignia ámbar con 🔥, no con un
  color de alerta.
- **"Velocidad de venta"** (antes "temperatura de ocupación") cambió su extremo frío de
  verde a azul (`--color-calor-fria`), para que su escala se lea como un mapa de calor
  literal (frío → caliente) y no como un semáforo de estado (bien → mal).
- Se agregó una tarjeta destacada al inicio ("🔥 Platino se agotó primero…") que cuenta el
  dato más interesante en una frase, en vez de obligar al promotor a leer dos tablas para
  encontrarlo.

### La pantalla del fan ya no se llama "Liquidación de precio"

El pedido original usaba esa frase, pero **"Liquidación" ya es un término del dominio** —el
cierre conciliado de lo que le corresponde al promotor (agregado `Liquidación`, ver
[modelo de dominio](../modelo-de-dominio.md#venta-y-recaudo)—, y no tiene relación con el
desglose de precio que ve el fan. Usar la misma palabra para dos conceptos distintos
rompería el lenguaje ubicuo y penaliza el criterio de alineación con el dominio de la
rúbrica. La pantalla se llama **"Resumen de compra"** y muestra el `Desglose de precio`
(valor nominal, cargo por servicio, contribución parafiscal) con ese nombre exacto.

**Corrección del 2026-09-17 (revisión externa):** "Resumen de compra" tampoco era exacto —
todavía no hay compra, solo un compromiso temporal sobre inventario (agregado `Reserva`,
`EstadoReserva.vigente`); la compra solo existe si el pago se confirma. Se renombró a
**"Tu reserva"**, que sí es el nombre del agregado que la pantalla muestra.

## Gráficas: Chart.js con respaldo sin internet

Las pantallas del promotor cargan Chart.js desde un CDN. Si la sustentación no tiene
internet o el CDN falla, `graficos.js` dibuja la misma información en SVG/CSS hecho a mano
—sin librería— para que el prototipo nunca dependa de la conexión. El mapa de calor de
ocupación no usa Chart.js: siempre es SVG/CSS, porque una cuadrícula de celdas no lo
necesita.

### Un solo dato mock, no uno por pantalla

Ajuste del 2026-09-17: los números de `promotor-metricas.html` y `promotor-ocupacion.html`
ahora salen de un único juego de datos coherente, para que las gráficas "tengan sentido"
entre sí en vez de ser cifras sueltas:

| Dato | Valor | De dónde sale |
|---|---|---|
| Aforo total | 5.800 | General (5.000) + Platino (800) |
| Boletas vendidas | 5.500 | General 4.700 (94%) + Platino 800 (100%) — mismas cifras en el embudo, el KPI y las barras de ocupación |
| Reservas activas de General | 180 | `Aforo.reservado`: fans en checkout que aún no pagaron. `disponibles = autorizado − vendido − reservado` (R1), no solo `autorizado − vendido` — mismas cifras en `fan-seleccion.html` y `promotor-ocupacion.html` |
| Pagos confirmados | 5.501 | Boletas vendidas + 1, para que cuadre con la única discrepancia abierta |
| Discrepancias abiertas | 1 | Pagos confirmados − boletas emitidas |
| Conversión turno → boleta | 60% | Boletas emitidas ÷ turnos ingresados (5.500 ÷ 9.200) |
| Ingresos brutos | $1.586M | Nominal (5.500 boletas a sus precios) + cargo por servicio (12%) + parafiscal (10% sobre ≥ 3 UVT) |

Todo `[S]`: son datos de demostración, no una corrida real. Lo que importa es que un
revisor pueda seguir la cuenta de una tarjeta a otra sin encontrar contradicciones.

## Revisión externa del 2026-09-17: boleta y reglas de venta

- **`fan-boleta.html` — una boleta por pantalla, no dos boletas con un solo código.** La
  versión anterior mostraba "2 boletas" compartiendo un único `CodigoBoleta` — pero
  `Pago → Boleta` es `1:1..*` y el control de acceso valida cada `Boleta` por separado
  (`operacion-detalle.html`, A-3). Se agregó un paginador simple (`‹ Boleta anterior` /
  `Siguiente boleta ›`) que recorre un arreglo de boletas, cada una con su propio
  `codigo` y `version`.
- **`fan-evento.html`, `fan-seleccion.html` y `operacion-especificaciones.html` — "por fan",
  no "por compra".** `ReglasVenta.limitePorFan` limita a la persona, no a la transacción;
  llamarlo "por compra" deja abierta la evasión obvia de comprar dos veces. Se corrigió el
  rótulo en las tres pantallas.
- **`operacion-especificaciones.html` — faltaban `inicioVenta` y `finVenta`.** La sección
  "Reglas de venta" solo tenía el límite por fan, la transferencia y la reventa; el `VO`
  `ReglasVenta` del [modelo de dominio](../modelo-de-dominio.md#tipos-y-enumeraciones)
  también fija cuándo abre y cierra la venta (`fan-fila.html` ya mostraba la apertura, pero
  quien la configura no la editaba). Se agregaron los dos campos de fecha.

## Autorevisión contra el modelo de dominio del 2026-09-17

Contraste de las 15 pantallas contra [`modelo-de-dominio.md`](../modelo-de-dominio.md),
pedido después de la revisión externa, para encontrar lo que esa revisión no cubrió.

- **`fan-fila.html` pedía un correo que ya conocíamos.** El widget "Notificarme por
  correo" era un `<input type="email">` en blanco, aunque el fan está autenticado desde la
  pantalla 1 (`Fan.identidadRef` → `Identidad.correo`). Contradice la misma corrección de
  identidad federada que ya se había hecho para la pantalla 6. Se reemplazó por un texto
  pasivo que usa el correo conocido ("Te avisamos a quinn.villa@ejemplo.com"); se quitó el
  formulario y su JS (`enviarNotificacion`), que ya no tenían función.
- **`Aforo.reservado` no se mostraba en ningún lado.** `fan-seleccion.html` y
  `promotor-ocupacion.html` calculaban "disponible" como `autorizado − vendido`, pero R1 es
  `reservado + vendido ≤ autorizado`: con reservas activas en checkout, lo disponible es
  menor. Se agregó una línea de detalle con ambas cifras (180 reservadas, 120 disponibles)
  en las dos pantallas, con el mismo número — documentado en la tabla de dato mock único más
  abajo.
- **`EstadoTurno.rechazado` no tenía pantalla.** El simulador de `fan-fila.html` cubría
  `enEspera/admitido/vencido` pero no `rechazado`, aunque AD-004 dedica toda su defensa por
  capas a rechazar tráfico no confiable en la admisión. Se agregó el estado, con un mensaje
  corto que no explica el mecanismo de detección — decirlo ayudaría a quien intenta hacer
  bypass, no al fan legítimo. Nuevo nodo satélite en el mapa (`?estado=rechazado`), con el
  mismo estilo `nodo-error` que los demás, en el hueco bajo el marco del fan junto a "Tu
  identidad" — no había espacio en la fila de errores ya llena.
- **`ReglasReventa` (`comision`, `ventana`) no vivía en ninguna pantalla.** Distinto del
  hallazgo #3 de la revisión externa (ese es sobre `Promotor`): `fan-evento.html` le decía
  al fan "hasta el valor nominal" como si `precioMaximo` fuera fijo, pero el modelo permite
  que sea otro valor, y ni la comisión ni la ventana de reventa eran configurables. Se
  agregó una subsección en `operacion-especificaciones.html` (precio máximo, comisión,
  ventana) que se muestra u oculta según el select de reventa, con el mismo patrón que ya
  usa "Configuración de sillas".
- **`operacion-discrepancias.html` navegaba siempre al mismo caso.** Las dos filas de la
  tabla llamaban a `irA('operacion-detalle.html')` sin distinguir cuál se clickeó, así que
  `pg_3a90 · respuestaTardiaPasarela` abría el detalle de `pg_7f21 · cobroSinBoleta`. Se
  parametrizó con `?caso=`, y `operacion-detalle.html` ahora lee un objeto `CASOS` con las
  dos discrepancias completas (línea de tiempo, qué compró, acciones de resolución) en vez
  de tener el contenido de un solo caso escrito a mano. El caso de `respuestaTardiaPasarela`
  usa una silla de `Platino` (localidad numerada) a propósito, para que el mismo componente
  distinga `sillas` de `cupos` según el tipo de localidad — y su pago queda en
  `pendientePasarela`, no `confirmado`, porque ese tipo de discrepancia es justamente que la
  pasarela no ha respondido.
- **La insignia de `fan-eventos.html` mezclaba `EstadoEvento` con una señal de demanda.**
  "Venta abierta" y "Próximamente" leen como estado del evento; "Alta demanda" no es un
  estado, es otra dimensión. La tarjeta de Cardio Fest mostraba solo "Alta demanda", como si
  no tuviera estado de venta, y de hecho contradecía a `fan-fila.html` (que la abre en "la
  fila todavía no abre"). Ahora la tarjeta muestra las dos insignias por separado:
  "Próximamente" + "Alta demanda".
- **Menor:** `fan-pago.html` no daba ninguna señal de que el dato de la tarjeta se procesa
  de forma segura. Se agregó una línea corta ("🔒 Pago procesado de forma segura") — es
  información que un fan real espera ver en este punto exacto, no una explicación de cómo
  funciona la tokenización (eso sí violaría la regla de no sobreexplicar).

## Referencias de Ticketmaster del 2026-09-17

El equipo trajo dos capturas de Ticketmaster (mapa de asientos y resumen de compra) pidiendo
un estilo parecido. Dos borradores sin conectar al flujo (`fan-inicio-borrador.html`,
`fan-mapa-asientos-borrador.html`) quedaron en el repo para decidir si se integran; no están
en `index.html` ni en `nav.js` a propósito, para no comprometer el flujo numerado 1–8 sin
antes aprobarlos.

- **`fan-mapa-asientos-borrador.html`:** SVG del recinto con las localidades como zonas
  clickeables (coloreadas por disponibilidad, no por estado de venta —esa insignia es otra
  cosa, ver el hallazgo de `fan-eventos.html` más arriba—), un contador `+`/`−` que respeta
  `limitePorFan` en vez de un `<select>`, y una barra de total fija abajo que recalcula el
  `DesglosePrecio` completo (nominal + cargo 12% + parafiscal 10%) en cada clic — las mismas
  fórmulas de R13, no una simplificación nueva.
  La forma pasó por varias vueltas: primero dos rectángulos apilados (no leía como
  recinto), luego arcos concéntricos y un diamante intentando copiar capturas de
  Ticketmaster a mano —sin herramienta de trazado vectorial, cada intento era una
  aproximación geométrica, no una medición real de la imagen—, hasta que el equipo pidió
  bajar la ambición: un semicírculo con dos anillos concéntricos (Platino chico junto al
  escenario, General mucho más grande envolviéndolo, en la proporción real 800 contra
  5.000) y líneas radiales decorativas que lo dividen en gradas. Sigue siendo una sola
  zona clickeable por anillo — las divisiones son textura visual, no localidades nuevas.
- **`fan-login-borrador.html`:** pantalla 0, sin conectar al flujo. Un solo botón "Iniciar
  sesión" — ningún campo de usuario o contraseña, porque
  [AD-004](../../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) federa la
  autenticación a un proveedor OIDC externo y TicketRight no la renderiza. Al hacer clic
  simula la redirección (spinner breve) y salta directo a `fan-eventos.html`, ya
  autenticado — el mismo chip de identidad que las demás pantallas del fan.

  **Corrección del mismo día:** la primera versión decía "Continuar con tu proveedor de
  identidad" y explicaba "TicketRight nunca ve tu contraseña" — dos problemas. Primero,
  sobreexplicaba una decisión de arquitectura (la regla ya documentada: si tapar el texto
  no cambia lo que el usuario haría, no debería estar). Segundo, y más importante:
  el fan no debería saber que existe un proveedor externo — entre TicketRight y el
  proveedor OIDC hay un gestor de identidad propio que absorbe esa federación; de cara al
  fan, "iniciar sesión" es una acción de TicketRight, punto. Por la misma razón,
  `fan-identidad.html` dejó de decir "federada con tu proveedor" (ahora "Cuenta
  verificada") y "Editar en tu proveedor de identidad" (ahora "Actualizar mis datos") —
  ninguna pantalla del fan debe nombrar al proveedor.
- **`fan-reserva.html` ("Tu reserva"):** se adoptó el layout del resumen lateral de
  Ticketmaster —nombre del evento como link, línea `N x Localidad (precio c/u)`, cargo por
  servicio, insignia cuadrada con la cantidad junto a "Total"— y se agregó "Cancelar
  reserva", que sí tiene dónde vivir en el modelo (`EstadoReserva.cancelada`). Se dejó fuera
  a propósito la pantalla de Ticketmaster "cómo deseas recibir tus entradas": `Boleta` en
  TicketRight siempre es digital, no existe un concepto de método de entrega que mostrarle
  al fan — copiar esa pantalla habría sido inventar una decisión de negocio que nadie tomó.

## Los tres borradores se integraron de verdad — 2026-09-17

Los tres `-borrador.html` dejaron de ser borradores: su contenido se movió a pantallas
reales y los archivos `-borrador.html` se borraron (ya no existen en el repo).

- **`fan-login.html`** es nueva — pantalla previa al flujo del fan, no un paso numerado en
  la barra lateral (sigue siendo 1 a 8; iniciar sesión es de la cuenta, no de la compra).
  `nav.js` la enlaza desde el acceso rápido "Ir al flujo del fan" en `index.html`.

  **Ajuste del 2026-09-18:** en el mapa de navegación quedó primero como nodo satélite sin
  flecha (mismo trato que "Tu identidad"), para no correr a mano las coordenadas de un
  lienzo con la fila ya llena. El equipo prefirió pagar ese costo y conectarla de verdad:
  se recorrieron los 8 nodos del flujo principal, sus líneas, sus ramas de error y el marco
  "Fan · flujo principal" 200px a la derecha, y "Iniciar sesión" ocupa el puesto que dejaron
  libre al inicio de la fila, con flecha real hacia "1 · Inicio". El lienzo pasó de
  1650×650 a 1850×650 (el ancho de un nodo más su separación), y el divisor de escala del
  script de `index.html` se actualizó de 1650 a 1850 para que siga ajustando bien en
  pantallas angostas. Verificado con `getBoundingClientRect()` en cada nodo: ningún nodo
  se superpone con otro ni con los marcos.
- **`fan-eventos.html`** (pantalla 1, se mantiene el nombre de archivo para no romper los
  ocho enlaces que ya apuntaban a ella) absorbió el contenido de inicio: hero con buscador,
  categorías, y la misma rejilla de tres eventos que ya tenía — sin la sección "Alta
  demanda esta semana" separada del borrador, que duplicaba a Cardio Fest sin agregar nada.
  La barra lateral pasó de llamarla "Eventos disponibles" a "Inicio".
- **`fan-seleccion.html`** (pantalla 4) reemplazó las dos tarjetas de localidad por el
  mapa del recinto, el contador y la barra de total — el estado simulado "Error — aforo
  agotado" se conservó intacto porque vive en un `data-estado-panel` separado del mapa.
- Pasada de minimalismo (pedida junto con la integración, sin tocar el tema oscuro/lima):
  el hero de `fan-eventos.html` perdió el degradado y quedó con fondo plano de
  `--color-surface`; se unificó en una sola rejilla de eventos en vez de dos secciones
  parecidas; `fan-login.html` no tiene nada más que el botón. El resto de las pantallas no
  se tocó — si se quiere extender el mismo criterio a las demás, es un paso aparte.

## QR ficticio y tarjetas de evento más limpias — 2026-09-18

Dos hallazgos sobre la misma captura: la portada de cada tarjeta repetía en mayúsculas el
nombre del evento que el `<h3>` de abajo ya decía, y el pie mezclaba dos insignias
("Próximamente" + "Alta demanda") compitiendo con el precio — se veía saturado sin decir
nada que el usuario no tuviera ya.

- **`fan-eventos.html`:** la portada dejó de tener texto. Ahora tiene la insignia de
  estado como overlay (esquina superior izquierda, sobre la imagen, no en el pie) y un QR
  ficticio (`.qr-ficticio`, un `<svg>` con tres marcadores de esquina y celdas sueltas —
  ni escanea ni pretende ser un QR real, es la misma idea visual que ya usa
  `fan-boleta.html`) como el contenido de la portada. "🔥 Alta demanda" bajó de insignia a
  texto pequeño bajo el lugar/fecha — deja de competir visualmente con el precio, que ahora
  es lo único en el pie.
- **`fan-boleta.html`:** el placeholder de texto "CÓDIGO QR" se reemplazó por el mismo
  `<svg>` (`.qr-boleta`, más grande, con el borde punteado que antes envolvía el texto). La
  paginación entre boletas sigue funcionando igual — cada boleta muestra el mismo dibujo,
  solo cambia el código y la versión impresos debajo, que es lo que de verdad las
  distingue.
- El resto de las pantallas (fila, reserva, pago, promotor, operación) no se tocó en esta
  pasada.

**Corrección del mismo día:** el QR de `fan-eventos.html` no duró — el usuario pidió
ilustraciones en su lugar, no un segundo QR (el de `fan-boleta.html` sí se queda: ahí el
código es real dentro de la ficción del prototipo, en la portada del evento no representaba
nada). Cada tarjeta tiene ahora una escena plana (`.ilustracion-evento`, un `<svg>` con 2-4
formas: una multitud con los brazos arriba para Cardio Fest, dos notas musicales para Jazz
al Parque, un micrófono con foco para la comedia) en vez del QR. Mismo motivo de fondo:
nada de fotografías ni imágenes de banco — formas planas del mismo lenguaje visual que ya
usan el avatar de iniciales y el propio QR de la boleta.

También se corrigió un bug real en `fan-seleccion.html`: `.zona.seleccionada` le pone
`stroke` al `<g>` de la zona para dibujar el borde de selección, y ese `stroke` se heredaba
al texto (`.zona-etiqueta`, `.zona-subetiqueta`) porque SVG hereda `stroke` a los hijos que
no lo sobrescriben — el contorno de 3px sobre letras en negrita las volvía ilegibles. Se
corrigió con `stroke: none` explícito en las dos clases de texto.

Los filtros de categoría (`.categoria`) no tenían fondo propio ni respuesta al pasar el
mouse — se veían planos, más como texto que como controles. Se les dio fondo
(`--color-surface`), un `hover` que aclara el fondo y oscurece el borde, y un ícono por
categoría (🎵 Conciertos, 🎭 Teatro, ⚽ Deporte, 👨‍👩‍👧 Familia, 😂 Comedia) para que se
lean más rápido y se sientan más de producto que de lista de texto.

**Segunda vuelta:** la pastilla con fondo y borde tampoco convenció. Se cambió a pestañas
con subrayado: sin fondo ni borde propio, apoyadas sobre una línea divisoria completa
(`border-bottom` en `.categorias`), donde la activa se distingue por color de texto
(`--color-accent-text`) y un subrayado de 2px (`--color-primary`) — el mismo patrón de
pestañas que usa la mayoría de sitios editoriales y de e-commerce, sin la "cajita" de
botón que se sentía pesada para un simple filtro.

## Botones e insignias: de píldora a geométrico — 2026-09-18

Pedido sobre `guia-de-estilo.html`: que botones e insignias fueran más minimalistas, más
cerca de Ticketmaster, con bordes geométricos pero livianos — es decir, lo mismo que ya se
había hecho con los filtros de categoría (quitarles la forma de píldora), aplicado a los
dos componentes base que usa toda pantalla.

`--radius-pill` (999px) hacía doble trabajo: barras de progreso (que sí deben ser
cápsulas) y botones/insignias (que no tenían por qué serlo). Se separó en dos tokens
nuevos — `--radius-btn: 8px` para `.btn` y `--radius-chip: 6px` para `.insignia` — y
`--radius-pill` quedó reservado para lo que de verdad es una barra o un círculo (`.pista-cola`,
`.barra-disponibilidad .pista`, `.avatar-iniciales`, `.chip-identidad`). Las insignias
también bajaron de `font-weight: 600` a `500`: con la esquina ya geométrica, el texto no
necesitaba tanto peso para leerse como una etiqueta. `guia-de-estilo.html` muestra ahora
cuatro muestras de radio en vez de dos, una por token, para que quede trazable cuál es
cuál.

## Los mismos radios, en todo el sitio — 2026-09-18

Pedido: extender la lógica de `--radius-btn`/`--radius-chip` (geométrico pero liviano) a
cada forma del prototipo, no solo botones e insignias, y dejar el sitio entero coherente
con un único vocabulario de esquinas.

Se auditaron todos los `border-radius` con valor fijo en `estilos.css` (más uno inline en
`operacion-especificaciones.html`) y se reemplazaron por el token semánticamente correcto
según el tamaño: `--radius-chip` (6px) en elementos pequeños tipo etiqueta —
`insignia-cantidad`, `muestra-color`, `chip-icono`, `code`, opciones de menú desplegable—;
`--radius-btn` (8px) en controles interactivos — `contador`, `boton-expandir`, botón de
menú desplegable, `nodo-mapa`/`nodo-tiempo` del mapa de navegación, input y select de
formulario—; `--radius-card` (12px) en contenedores — `mapa-recinto`, `mapa-marco`,
`hero`, `globo` de ayuda, `qr-boleta`, el cuadro de convenio en especificaciones del
evento—.

Quedaron sin tocar, a propósito, las formas que sí son círculos o cápsulas reales:
avatares, interruptor de tema, chip de sesión, barras de progreso (`--radius-pill`) y los
swatches de 3-4px de mapas de calor y leyendas, demasiado pequeños para que un radio mayor
se note.

## Qué se mantiene igual que `proyecto/design.md`

Estructura de página, escala de espaciado (múltiplos de 8px), reglas de accesibilidad,
comportamiento adaptable (escritorio/tableta/móvil) y componentes reutilizables se heredan
sin cambio — solo cambian los valores de color y tipografía. No se duplican aquí; ver
[`proyecto/design.md`](../../design.md) secciones 4, 5, 19 y 20.

## Pendiente

`PENDIENTE: confirmar los tres colores semánticos [S] al diseñar la primera pantalla de
error del flujo de compra en alta demanda.`

`PENDIENTE: decidir si esta paleta reemplaza a la de proyecto/design.md para todo el
proyecto, o si conviven — hoy conviven a propósito.`

## `guia-de-estilo.html` — esta especificación, pero viva

**Agregado el 2026-09-18,** a pedido del equipo de diseño: una pantalla del propio
prototipo (no un documento aparte) que muestra tipografía, paleta, espaciado, radios,
sombra, componentes (botones, insignias, alertas, formulario, tarjetas, nodos del mapa,
barra de progreso, anillo) e iconografía, todo tomado en vivo de `estilos.css` — no hay un
solo valor copiado a mano.

Dos cosas la hacen "viva" en vez de una captura:

- **La paleta se recalcula con `getComputedStyle`**, no con hex escritos aquí. Un
  `MutationObserver` sobre `data-tema` en `<html>` la vuelve a dibujar en el momento en que
  alguien cambia el tema con el botón de la barra lateral — los valores de esta sección
  cambian de dark a light sin recargar la página.
- **La tipografía lee `getComputedStyle` de los propios elementos** (`h1`, `h2`, `h3`,
  cuerpo, `code`), así que si algún día cambia una regla en `estilos.css`, esta página lo
  refleja sola en el siguiente refresh — no hay que acordarse de mantenerla sincronizada.

Es accesible desde el dropdown de "Perfil" de cualquier pantalla ("Guía de estilo") y desde
la lista de accesos rápidos de `index.html` y `guia-de-estilo.html` mismos, igual que el
mapa de navegación — es una herramienta de referencia, no una pantalla del producto.

## Plataforma `/app` — revisión de uso y accesibilidad del 2026-09-22

Revisión de la plataforma funcional recorriéndola con Chrome en escritorio (1440 px) y móvil
(390 px), con capturas y una auditoría automática por pantalla. **La identidad no cambió:**
la plataforma conserva su tipografía (Sora + Inter) y sus emojis, por decisión del equipo,
aunque difieren de este archivo y de §16 de [`proyecto/design.md`](../../design.md).
`PENDIENTE: decidir si se documenta esa divergencia como definitiva o se alinea después de la Entrega 3.`

Lo que se corrigió:

- **Elegir localidad.** Los rótulos de los anillos van sobre una píldora oscura (lima sobre
  lima no se leía); la localidad elegida resalta y las demás se atenúan (antes el estilo
  «seleccionada» adelgazaba el anillo). Bajo el mapa hay una **lista de localidades** con el
  estado escrito —«Disponible · 2.600», «Pocas», «Agotado»—, porque el estado nunca se dice
  solo con color. Mapa y lista eligen lo mismo, con clic o con teclado.
- **Móvil.** La barra de total es compacta (una línea) y, al elegir localidad, el panel con la
  cantidad sube a la vista; antes la barra fija tapaba el selector. En el carrusel el banner
  se ve completo y el título va debajo, no encima de la imagen.
- **Boleta.** El QR es real (código de la boleta), sobre blanco en ambos temas para que un
  lector de acceso lo lea; se genera con `vendor/qrcode-generator.js` (MIT), servido desde el
  repositorio para que la demo funcione sin internet, igual que Chart.js.
- **Panel del promotor.** «Pagos confirmados» salía en 0: el lector de `/metrics` comparaba la
  línea completa y la métrica trae etiquetas extra. «Boletas vendidas» contaba también lo
  reservado; el catálogo ahora expone `vendidas` por localidad.
- **Teclado y lectores de pantalla.** Tarjetas, categorías, carrusel, menú de cuenta y logo
  se usan con Tab, Enter y espacio; el modal de ingreso se cierra con Escape y devuelve el
  foco; todos los campos tienen su `label` asociado y `autocomplete`; cada pantalla tiene un
  `h1`; la fila anuncia la posición solo cuando cambia; el foco visible usa el acento
  (`--color-accent-text`), porque el azul translúcido de `estilos.css` casi no se ve en oscuro.
