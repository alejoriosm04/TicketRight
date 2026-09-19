# Alcance y definición del caso de negocio

> **Componente 2 de la rúbrica · 15% del entregable.**
>
> **Responsable:** Lina · **Cierra:** miércoles 9 de septiembre
> **Se consolida en** [`caso-de-negocio.md`](caso-de-negocio.md) el viernes.
>
> Vive en archivo aparte por la misma razón que el canvas y el modelo financiero: **un
> componente, un dueño, un archivo.** Así nadie —ni ningún agente— reescribe encima del
> trabajo de otro.
>
> Marca todo `[V]` verificado con fuente o `[S]` supuesto sin validar.

**Negocio:** **TicketRight** — venta de boletería para eventos de alta demanda.
[La idea completa](ideas/idea-lina.md) · [AD-001](../decisiones/0001-idea-de-negocio.md) ·
[validaciones con fuente](validaciones.md)

---

> **15% de la nota.** Rúbrica: problema u oportunidad, contexto y actores, dolor del
> cliente, solución a alto nivel, **qué entra y qué queda fuera**, y relación con los
> supuestos.
>
> **Pregunta de control de la rúbrica** — quien lea esta sección tiene que poder responder:
> *«¿Qué problema estamos resolviendo, para quién, por qué y exactamente hasta dónde llega
> este proyecto?»* Si no puede, el alcance no está definido.

> 📌 **Este componente no existía en la estructura anterior y vale 15%.** Casi todo el
> material ya está escrito en [`ideas/idea-lina.md`](ideas/idea-lina.md): esto es
> **selección y síntesis**, no investigación nueva. Dos páginas bien escritas.

## El orden de trabajo, si sirve

1. Leer [`rubrica.md`](rubrica.md) §2 — son siete puntos evaluados y la pregunta de control.
2. Leer [`ideas/idea-lina.md`](ideas/idea-lina.md) completo: es tu propio documento y de ahí
   sale el 80% de esta sección.
3. Sacar de [`validaciones.md`](validaciones.md) lo que va en «la oportunidad»: es lo único
   `[V]` fuerte que tenemos.
4. Escribir las siete secciones **en orden**. La 6 (fuera de alcance) y la 7 (de qué
   supuesto sale cada exclusión) son las que casi nadie escribe y las que suben la nota.
5. Releer respondiendo la pregunta de control en voz alta. Si no sale, falta algo.

## 1. El problema

> De [«El problema»](ideas/idea-lina.md#el-problema) — los seis puntos. **No se copian los
> seis:** se eligen los que sostienen la propuesta de valor y se escriben en prosa.
> El corazón es el 3: *la plata y la boleta se desincronizan*.

Los promotores y recintos que venden eventos de alta demanda deben convertir un aforo
limitado en derechos de asistencia durante una ventana de compra muy corta. En ese pico,
la fila, el inventario y la pasarela de pagos pueden avanzar a ritmos diferentes. El
resultado es un problema de negocio: una persona puede recibir un cobro sin recibir su
boleta, una boleta puede quedar emitida sin un cobro confirmado o el mismo inventario puede
quedar comprometido dos veces.

El dolor es mayor porque el promotor responde ante el artista, el recinto y los compradores
por la venta, el aforo y las devoluciones. Además, la reventa informal puede quedarse con
parte del margen y exponer al comprador a boletas falsas o duplicadas. La oportunidad para
TicketRight es custodiar la correspondencia entre dinero y derecho de entrada, desde la fila
hasta la transferencia o reventa autorizada.

`[S]` La frecuencia exacta de estos incidentes y la fracción de boletas revendidas en
Colombia aún deben cuantificarse. Responsable de validar: Lina y el equipo.

## 2. La oportunidad, y por qué ahora

> Aquí va el argumento más fuerte que tenemos, y es `[V]`: **un operador relevante del
> mercado está formalmente imputado por el regulador** —Resolución 38063 del 4 de junio de 2026, nueve
> expedientes, cinco cargos— y uno de los cargos es **trasladarle el riesgo al promotor con
> una cláusula abusiva**. Ese es el hueco exacto que llenamos.
> [Detalle y fuentes](validaciones.md#validación-5--está-el-mercado-insatisfecho-con-lo-que-existe-hoy).
>
> ⚠️ **Es un pliego de cargos, no una condena.** Hay que escribirlo así o el dato se vuelve
> atacable en la sustentación.

`[V]` Existe un contexto regulado y formal para este negocio. El PULEP publica información
de productores, operadores autorizados de venta en línea, eventos y escenarios; además,
define a los operadores como quienes comercializan las boletas y entregan los derechos de
asistencia. Fuente: [PULEP](https://pulep.mincultura.gov.co/PaginasHtml/reportes.html).

`[V]` La SIC abrió en junio de 2026 una investigación formal contra Ticket Fast S.A.S.,
operadora de TuBoleta, a partir de nueve expedientes y por presuntas infracciones sobre
información, comercio electrónico, devoluciones y cláusulas abusivas. Es un pliego de
cargos, no una condena. Fuente: [SIC, Resolución 38063 de 2026](https://sedeelectronica.sic.gov.co/comunicado/la-sic-del-cambio-formula-pliego-de-cargos-tuboleta-por-presuntas-fallas-en-el-deber-de-informacion-las-clausulas-abusivas-y-las-reglas).

`[V]` Como referencia externa de mercado, Ticketmaster documenta una fila virtual para ventas de
alta demanda, transferencia de boletas y reventa condicionada por evento. La fila no
garantiza una boleta; en una transferencia aceptada, la boleta del remitente deja de ser
válida. Fuentes: [fila virtual](https://help.ticketmaster.com/hc/en-us/articles/9781366115985-What-is-the-queue-and-how-do-I-join),
[transferencia](https://help.ticketmaster.com/hc/en-us/articles/9612097694481-How-do-I-transfer-tickets-)
y [reventa](https://help.ticketmaster.com/hc/en-us/articles/9672915828881-How-do-I-sell-tickets).

TicketRight no se diferenciará solo por tener fila, venta digital o boletas móviles: son
capacidades conocidas del sector. La diferencia que se evaluará es tratar fila, pago,
emisión, transferencia y reventa como una sola cadena auditable para proteger al promotor
y al fan.

## 3. Contexto y actores

> La tabla de [«Quién lo padece»](ideas/idea-lina.md#quién-lo-padece), más los actores que
> no pagan pero mandan: el artista (influye en qué plataforma elige el promotor) y la
> autoridad que controla el aforo.

| Actor | Rol | Su dolor | ¿Paga? |
|---|---|---|---|
| Promotor o productora | Define el evento, inventario y reglas de venta | Caídas, reclamos, falta de datos y pérdida del margen de reventa | Sí; cliente primario |
| Recinto o escenario | Aporta el espacio y debe respetar el aforo autorizado | Riesgo operativo y regulatorio si se excede el aforo | Puede pagar o contratar junto al promotor `[S]`; responsable de validar: Quinnie |
| Fan o comprador | Entra a la fila, compra y recibe la boleta | Cobro sin boleta, boleta falsa e incertidumbre sobre la fila | `[V]` Paga el cargo visible por servicio junto con la boleta en los modelos observables de Ticketmaster Colombia y TuBoleta. El promotor sigue siendo el cliente contractual; el reparto interno del cargo es `[S]` y lo valida Quinnie. Fuentes: [Ticketmaster](https://www.ticketmaster.co/event/jamiroquai-tyc) y [TuBoleta](https://tuboleta.com/es/faq/preguntas-frecuentes) |
| Artista y management | Influyen en la plataforma y reglas de preventa | Boletas que no llegan a fans reales y daño reputacional | No directamente `[S]`; responsable de validar: Lina |
| Operador de control de acceso | Valida el derecho de entrada | Necesita el estado correcto de la boleta | No; socio de integración |
| Pasarela de pagos | Autoriza o confirma el cobro | Reintentos, respuestas tardías y conciliación | Proveedor |
| Ministerio, PULEP y autoridades territoriales | Registran, autorizan o controlan aspectos del espectáculo | Incumplimiento de registro, aforo o deberes legales | No |

`[S]` El segmento inicial comprende promotores de eventos de alta demanda con capacidad
comercial entre 3.000 y 40.000 asistentes. El tamaño por sí solo no basta: el evento debe
concentrar la demanda en una ventana corta y justificar una fila, un inventario controlado
y una operación de pagos trazable. El modelo financiero usa un evento tipo de 8.000
asistentes y una sensibilidad de 3.000; el rango 3.000–40.000 define el segmento, no cuatro
escenarios financieros ya calculados. Responsable de ratificar: Lina y Quinnie.

## 4. La solución a alto nivel

> **A nivel de negocio, no de arquitectura.** El flujo de siete pasos de
> [la idea](ideas/idea-lina.md#la-solución-propuesta) más lo que le agregamos: boleta
> nominal, política de fila publicada, y vida de la boleta después de la venta.
> Aquí **no** se habla de tecnología: eso es el anexo A de
> [`caso-de-negocio.md`](caso-de-negocio.md).

TicketRight ofrece al promotor una plataforma para publicar el evento, configurar localidades y
reglas de venta, administrar la fila, reservar inventario por tiempo limitado, procesar el
pago, emitir una boleta nominal y conservar la trazabilidad de cada cambio. Luego permite
transferir o revender la boleta dentro de las reglas definidas por el evento y gestionar la
devolución cuando corresponda.

Para el fan, la propuesta es una compra con reglas de fila publicadas, estado claro de la
reserva y una boleta verificable asociada a su identidad. Para el promotor, es una cadena
que permite saber qué pasó con cada intento de compra y conservar el control sobre el
inventario, los datos autorizados y el margen de la reventa.

El alcance se formula primero como capacidades estables del negocio y no como una lista de
funcionalidades. Esto sigue el principio de la lámina 44: las capacidades son el lenguaje
común entre negocio y solución y deben definirse antes de detallar los procesos. El flujo
de compra se usará después para precisar esos procesos, no para ampliar este alcance.

## 5. Alcance — qué entra

| Capacidad | Por qué entra |
|---|---|
| Gestión comercial del evento | Permite que el promotor defina el evento, las localidades, el aforo y las reglas de venta. `[V]` El PULEP publica información de productores, operadores, eventos y escenarios. |
| Gestión de la demanda concentrada | Permite aplicar una política de fila publicada y asignar turnos durante el pico de venta. La existencia de la fila virtual en Ticketmaster es una referencia externa `[V]`, no una validación de nuestro mercado objetivo. |
| Custodia del inventario | Mantiene la disponibilidad y el derecho sobre una silla numerada o una localidad general sin comprometer el aforo. |
| Custodia de la transacción | Mantiene trazable la relación entre reserva, pago, confirmación y emisión, incluyendo respuestas tardías o repetidas de la pasarela. |
| Gestión del derecho de asistencia | Permite emitir una boleta nominal y gestionar su transferencia según las reglas del evento. |
| Gestión de la reventa autorizada | Permite que el promotor defina si aplica y bajo qué reglas de precio, comisión y elegibilidad `[S]`; responsable de validar: Quinnie. La reventa fuera de la plataforma no queda bajo control de TicketRight. |
| Gestión de devoluciones y anulaciones | Permite cerrar el ciclo de la venta cuando el evento se cancela o una boleta debe invalidarse. |
| Trazabilidad y liquidación para el promotor | Permite conciliar inventario, pagos, titulares, transferencias, reventas y reclamos. |

## 6. Fuera de alcance — y por qué

> **Esta tabla es la que hace que el evaluador confíe en el resto.** Un alcance que no
> excluye nada es un alcance que no se pensó. Ya tenemos la exclusión más valiosa:
> **el control de acceso en la puerta —el caso de la lámina 53— no es parte de este
> sistema**; se integra por contrato de eventos.
> [Por qué declararla nos suma](ideas/idea-lina.md#la-frontera-con-la-lámina-53--y-por-qué-declararla-nos-suma).

| Qué queda fuera | Por qué | Cómo se cubre si alguien lo necesita |
|---|---|---|
| Control de acceso en puerta | Otro sistema, otro dueño, otros atributos | Contrato de eventos: *emitida*, *transferida*, *anulada* |
| Eventos de demanda continua (cine, parques, museos) | TicketRight se concentra en eventos cuya demanda se acumula en una ventana corta `[S]`; responsable de validar: Lina | — |
| Eventos de menos de 3.000 asistentes `[S]` | `[S]` Se supone que la operación directa o una solución más simple puede ser suficiente para el segmento inicial; el umbral debe validarse con datos del PULEP y un promotor. Responsable: Lina y Quinnie | Se revisa el segmento si la validación contradice el supuesto |
| Gestión integral del evento físico | TicketRight vende y custodia el derecho; no organiza seguridad, montaje, taquilla física ni logística | Contratos y proveedores del promotor |
| Determinación de permisos, aforo o autorización | La responsabilidad es del productor, recinto y autoridades | El promotor registra y obtiene autorizaciones |
| Operación de la pasarela de pagos | Es un tercero externo que TicketRight no controla | Integración contractual y conciliación de estados |
| Compra o reventa fuera de la plataforma | No podemos garantizar autenticidad ni titularidad | Se soportan solo transferencias y reventas dentro de TicketRight |
| Publicidad masiva y representación del artista | No es el mecanismo principal de adquisición definido | Promotor, artista y aliados realizan la promoción |

## 7. De qué supuestos y restricciones se deriva este alcance

> La rúbrica evalúa explícitamente «relación con los supuestos y restricciones». Dos o tres
> frases que digan **qué exclusión sale de qué restricción**. Ejemplo listo: R6 (equipo de
> 3 personas, 3 semanas) es lo que deja la reventa *modelada* en la Entrega 2 y no
> implementada.

El alcance se deriva de estas condiciones:

- `[V]` El PULEP separa los roles de productor, operador de boletería, escenario y
  autoridad. Por eso TicketRight se limita a la venta y custodia de la boleta y se integra con
  los demás actores; no reemplaza sus responsabilidades. Fuente: [PULEP](https://pulep.mincultura.gov.co/PaginasHtml/reportes.html).
- `[V]` El caso de la lámina 53 muestra que el control de acceso tiene otro flujo, otro
  dueño y atributos propios como disponibilidad, resiliencia y auditoría. Por eso TicketRight
  termina en el estado válido de la boleta y se integra con el sistema de acceso, pero no
  controla puertas, dispositivos ni zonas. Referencia: [casos de ejemplo del curso](../../curso/clase-01-02.md#dos-casos-de-ejemplo-del-profesor).
- `[S]` El segmento inicial son eventos de alta demanda entre 3.000 y 40.000 asistentes.
  Ambos límites son hipótesis de segmentación y deben validarse con el PULEP, la estructura
  de costos y un promotor. Los eventos de 1.000 a 2.999 podrían ser una expansión futura,
  pero no hacen parte del caso financiero ni del alcance inicial. Responsable: Lina y
  Quinnie.
- `[V]` El fan es usuario y pagador del cargo visible por servicio; el promotor es el
  cliente contractual que firma. `[S]` El reparto financiero interno del cargo requiere
  ratificación de Quinnie, pero el alcance no depende de que el fan sea el cliente primario.
- `[S]` El equipo tiene tres semanas y la Entrega 1 define el caso, no un producto
  comercial completo. Por eso la reventa se define como capacidad y regla de negocio, solo
  si el promotor la habilita. El modelo financiero la usa como escenario base `[S]`, pero
  también prueba la viabilidad con reventa igual a cero; no es ingreso garantizado. Su
  implementación detallada queda para la Entrega 2/3.
- `[V]` La lámina 44 indica que primero deben modelarse capacidades y después procesos o
  tecnología. Por eso la tabla de alcance describe capacidades; la arquitectura y sus
  decisiones se dejan para la Entrega 2.
- `[V]` Ticketmaster muestra que fila, transferencia y reventa pueden ser capacidades
  separadas y condicionadas por evento. TicketRight las usa como referencia funcional, sin
  afirmar que sus condiciones sean automáticamente aplicables en Colombia.

---

---

## Antes de dar esto por cerrado

**Revisión de Lina (9 de septiembre de 2026):** contenido revisado contra la rúbrica y las
fuentes enlazadas. El rango y la frecuencia de eventos siguen siendo supuestos de
segmentación explícitos; no se presentan como hechos de mercado.

- [x] Quien lo lea puede responder: **qué problema, para quién, por qué y hasta dónde**
- [x] El problema está en prosa, no como lista copiada de la idea
- [x] La oportunidad usa el pliego de cargos de la SIC, **y dice que es pliego, no condena**
- [x] La tabla de actores incluye a los que no pagan pero mandan (artista, autoridad)
- [x] La solución está a nivel de negocio: **ni una palabra de tecnología**
- [x] Hay tabla de **fuera de alcance** con una razón por fila
- [x] Está escrito qué exclusión sale de qué restricción (sección 7)
- [x] Todo supuesto relevante está marcado `[V]` o `[S]`, y cada `[S]` tiene responsable
