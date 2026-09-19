# TicketRight: definición completa del caso de negocio

> ✅ **Este es el documento que se entregó** el 12 de septiembre de 2026, en su versión
> maquetada [`caso-de-negocio-ticketright.docx`](caso-de-negocio-ticketright.docx). Es la
> fuente: si hay que corregir algo, se corrige aquí y se reexporta. El consolidado de
> trabajo, con la trazabilidad y los anexos técnicos, es
> [`caso-de-negocio.md`](caso-de-negocio.md).

**Entrega 1 del proyecto integrador**  
**Asignatura:** Arquitecturas Avanzadas de Software  
**Universidad:** EAFIT  
**Fecha:** 12 de septiembre de 2026  
**Integrantes:** Alejandro Ríos, Lina Ballesteros y Quinnie Villarreal

TicketRight es una plataforma B2B2C de boletería para eventos de alta demanda. Su propósito
es proteger la relación entre el dinero cobrado y el derecho de asistencia durante todo el
ciclo de la venta, desde la entrada a la fila hasta la emisión, transferencia, reventa o
devolución de la boleta.

## Contenido

| # | Sección | Qué responde |
|---|---|---|
| — | [Convención de evidencia](#convención-de-evidencia) | Qué significa `[V]` y `[S]` en este documento |
| — | [Resumen ejecutivo](#resumen-ejecutivo) | El caso completo en cinco párrafos |
| 1 | [Premisas, supuestos y restricciones](#1-premisas-supuestos-y-restricciones) | ¿Bajo qué condiciones se construyó, y qué se cae si alguna es falsa? |
| 2 | [Alcance y definición del caso](#2-alcance-y-definición-del-caso-de-negocio) | ¿Qué problema, para quién, y hasta dónde llega? |
| 3 | [Business Model Canvas](#3-business-model-canvas) | ¿Cómo se crea, se entrega y se captura valor? |
| 4 | [Modelo de ingresos, costos y viabilidad](#4-modelo-de-ingresos-costos-y-viabilidad) | ¿El negocio se sostiene, y con cuántas boletas? |
| 5 | [Objetivos y resultados clave](#5-objetivos-y-resultados-clave) | ¿Cómo sabremos si está funcionando? |
| — | [Coherencia integral](#coherencia-integral-del-caso) | ¿Se sostiene la cadena de la premisa al indicador? |
| — | [Referencias](#referencias) | Las dieciséis fuentes públicas |

## Convención de evidencia

Los datos identificados con `[V]` fueron verificados en fuentes públicas. Los valores
identificados con `[S]` son supuestos del modelo o metas empresariales que deberán
contrastarse con los resultados de los primeros eventos. Todas las cifras monetarias están
expresadas en pesos colombianos, salvo que se indique lo contrario.

## Resumen ejecutivo

TicketRight atiende un problema de confianza en la venta de eventos de alta demanda. Cuando
la fila, el inventario y la pasarela de pagos avanzan a ritmos diferentes, pueden presentarse
cobros sin boleta, reservas duplicadas, devoluciones difíciles y pérdida de control sobre el
aforo. El promotor asume el impacto reputacional y operativo, mientras que el comprador
enfrenta incertidumbre sobre su dinero y su derecho de entrada.

`[V]` El mercado colombiano de artes escénicas tiene una base formal y verificable. La
boletería estimada pasó de $310 mil millones en 2018 a $1,53 billones en 2023. Además, el
PULEP registra productores, operadores, escenarios y eventos. Estas fuentes permiten
identificar clientes potenciales sin presentar estimaciones de mercado como hechos.

El cliente contractual de TicketRight es el promotor. El fan es el usuario de la plataforma
y quien paga el cargo visible por servicio. La propuesta de valor consiste en ofrecer una
venta confiable y trazable, devolver al promotor control sobre la relación con sus
compradores y convertir la reventa autorizada en una fuente de valor compartido.

`[S]` El modelo se construye sobre eventos de 3.000 a 40.000 asistentes y utiliza como unidad
de análisis un evento de 8.000 puestos, una boleta promedio de $200.000 y una venta del 95%
del aforo. En el escenario base, cada boleta genera $25.120 de ingreso atribuible a la venta,
cuesta cerca de $7.770 en operación variable y deja alrededor de $17.350 para cubrir los
costos fijos y financiar el crecimiento. Los ingresos contratados por evento se excluyen de
esta unidad por prudencia.

El negocio es viable bajo los supuestos actuales. Con el cargo por servicio completo y el
IVA de la pasarela tratado como impuesto descontable, el punto de equilibrio se alcanza con
cerca de 2.990 boletas al mes. Si el cargo se comparte en partes iguales con el promotor, el
punto de equilibrio aumenta a aproximadamente 9.698 boletas, equivalentes a 1,28 eventos
tipo al mes. La validación contractual del reparto y la definición tributaria del cargo por
servicio son las condiciones financieras más importantes del caso.

`[S]` Antes del primer ingreso, TicketRight requiere entre $317,1 y $530,4 millones de
capital para financiar cuatro a seis meses de T0, la habilitación inicial fuera de nómina y
una reserva de liquidez. Los recursos recaudados para el promotor y el Estado no hacen parte
de este capital y deben permanecer segregados.

## 1. Premisas, supuestos y restricciones

### 1.1 Premisas verificadas

1. `[V]` La boletería estimada de artes escénicas pasó de $310 mil millones en 2018 a $1,53
   billones en 2023. El sector creció 22% durante 2023. Fuente:
   [Ámbito Jurídico](https://www.ambitojuridico.com/noticias/general/educacion-y-cultura/eventos-de-artes-escenicas-en-colombia-crecieron-un-22-en-2023).

2. `[V]` El PULEP es el registro oficial de productores, operadores de boletería, escenarios
   y eventos de artes escénicas en Colombia. Fuente:
   [Ministerio de las Culturas](https://pulep.mincultura.gov.co/Paginas/ley1493.aspx).

3. `[V]` El cargo por servicio observado en Colombia se encuentra entre 10% y 15% del valor
   de la boleta. Fuente:
   [El Tiempo](https://www.eltiempo.com/economia/finanzas-personales/que-le-cobran-en-el-cargo-por-servicio-cuando-compra-una-boleta-en-colombia-815191).

4. `[V]` En junio de 2026 la Superintendencia de Industria y Comercio formuló pliego de
   cargos contra Ticket Fast S.A.S., operador de TuBoleta, por presuntas fallas relacionadas
   con información, comercio electrónico, devoluciones y cláusulas abusivas. Este hecho
   representa una investigación en curso y no una condena. Fuente:
   [Superintendencia de Industria y Comercio](https://sedeelectronica.sic.gov.co/comunicado/la-sic-del-cambio-formula-pliego-de-cargos-tuboleta-por-presuntas-fallas-en-el-deber-de-informacion-las-clausulas-abusivas-y-las-reglas).

5. `[V]` En Colombia existen obligaciones específicas sobre contribución parafiscal,
   retracto, devoluciones y tratamiento de datos personales. Estas obligaciones hacen que
   la conciliación y la trazabilidad sean capacidades esenciales del negocio.

### 1.2 Supuestos críticos

**S1. Cargo por servicio.** `[S]` TicketRight cobra 12% del valor de la boleta y conserva
ese cargo completo. Si debe compartirlo en partes iguales con el promotor, el aporte por
boleta se reduce de aproximadamente $17.350 a $5.350 y el punto de equilibrio aumenta de
0,39 a 1,28 eventos al mes.

**S2. Evento representativo.** `[S]` El segmento inicial está compuesto por eventos de
3.000 a 40.000 asistentes. El modelo utiliza un evento tipo de 8.000 puestos, una boleta de
$200.000 y una venta del 95% del aforo. Cambios en estas variables modifican los ingresos,
la contribución parafiscal y el punto de equilibrio.

**S3. Disposición del promotor.** `[S]` Los promotores están dispuestos a cambiar de
operador a cambio de menor riesgo, mayor trazabilidad y participación en la reventa. Si esta
condición no se cumple, TicketRight no obtiene el inventario necesario para operar.

**S4. Procesamiento del pago.** `[S]` TicketRight procesa el valor completo pagado por el
fan. En el evento tipo son $244.000, correspondientes al valor de la boleta, el cargo por
servicio y la contribución parafiscal. Un esquema de recaudo diferente cambia el costo de
pasarela y la responsabilidad de conciliación.

**S5. Reventa autorizada.** `[S]` En estado estable, 8% de las boletas emitidas se revende
dentro de TicketRight. Si la adopción es menor, disminuyen los ingresos secundarios y el
diferencial frente a otros operadores, aunque el negocio principal conserva viabilidad.

**S6. Operación inicial.** `[S]` La operación del primer año requiere cuatro personas con
un costo laboral promedio equivalente a cuatro salarios mínimos por persona, más las cargas
del empleador. Este supuesto determina la mayor parte del costo fijo mensual.

**S7. Tratamiento del IVA.** `[S]` El modelo base supone que el cargo por servicio está
excluido de IVA y que TicketRight puede tratar el IVA facturado por la pasarela como impuesto
descontable. En esta rama se mantienen $25.120 de ingreso atribuible a la venta, $17.350 de
contribución por boleta y un punto de equilibrio de 2.990 boletas, equivalentes a 0,39 eventos
tipo al mes.

Si el cargo de 12% está gravado y el precio de $24.000 incluye IVA, el ingreso neto del cargo
es $20.168. Al descontar también el IVA de la pasarela, la contribución es $13.518 y el punto
de equilibrio es 3.838 boletas, equivalentes a 0,50 eventos al mes. Como cota conservadora,
si además no fuera procedente descontar el IVA de la pasarela, la contribución sería $12.156
y el equilibrio aumentaría a 4.268 boletas, equivalentes a 0,56 eventos al mes. La exclusión
del numeral 18 del artículo 476 del Estatuto Tributario cubre las boletas y los servicios
artísticos definidos por la Ley 1493, pero no permite concluir por sí sola que la
intermediación del operador esté excluida. La validación del cargo, la comisión de reventa y
el IVA descontable se gestiona como riesgo R1 de la sección 4.10. Fuentes: [numeral 18 del artículo 476 del Estatuto
Tributario](https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_900918_2021.htm)
y [artículo 6 de la Ley 1493](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1493_2011.htm).

**S8. Custodia de recursos y ciclo de liquidación.** `[S]` TicketRight recauda el pago antes
del evento y liquida al promotor después, según el plazo contractual. El evento tipo mueve
$1.854,4 millones: $1.520 millones corresponden al promotor, $152 millones a la contribución
parafiscal retenida y $182,4 millones al cargo bruto de TicketRight. Esto exige cuentas
separadas, conciliación diaria y liquidez para devoluciones; el flotante no se considera
ingreso. Los plazos de dispersión, liquidación y devolución y la reserva necesaria se
gestionan como riesgo R2 de la sección 4.10.

### 1.3 Restricciones

1. `[V]` La Ley 1493 de 2011 establece una contribución parafiscal de 10% para boletas cuyo
   precio sea igual o superior a tres UVT. Para 2026, la UVT es de $52.374, por lo que el
   umbral equivale a $157.122. El productor es el sujeto pasivo. TicketRight, como operador
   de boletería, es agente de retención sobre el ingreso mensual por boletería recibido a
   nombre del productor y presenta la declaración de retención mensualmente. El productor
   permanente declara la contribución bimestralmente; el ocasional lo hace por evento.
   TicketRight debe separar y liquidar correctamente el dinero del promotor, de la plataforma
   y del Estado. Fuentes:
   [Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=45246),
   [DIAN](https://www.dian.gov.co/normatividad/Normatividad/Resoluci%C3%B3n%20000238%20de%2015-12-2025.Pdf)
   y [Concepto Unificado 1 de 2018 de la DIAN](https://normograma.dian.gov.co/dian/compilacion/docs/concepto_tributario_dian_0000001_2018.htm).

2. `[V]` La Ley 1480 de 2011 establece el derecho de retracto para ventas a distancia y
   exige la devolución del dinero cuando corresponda. Fuente:
   [Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306).

3. `[V]` La Ley 1581 de 2012 exige autorización previa, expresa e informada para tratar y
   transferir datos personales. Fuente:
   [Función Pública](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981).

4. `[V]` El aforo autorizado no puede excederse. Cada boleta emitida debe corresponder a
   inventario disponible y válido. Fuente:
   [Alcaldía de Bogotá](https://bogota.gov.co/mi-ciudad/cultura-recreacion-y-deporte/proceso-para-pedir-permisos-de-organizacion-de-eventos-en-bogota).

5. `[V]` No basta con registrarse en el PULEP. Antes de vender en línea, cada empresa debe
   obtener del Ministerio de las Culturas una resolución que la autorice como operador de
   boletería en línea, expedida por la Dirección de Artes y con cobertura local, regional o
   nacional. La autorización exige requisitos jurídicos, financieros y tecnológicos y tiene
   vigencia definida. Este trámite crea una etapa preoperativa sin ingresos y puede retrasar
   el inicio de T1. Fuente: [Ministerio de las Culturas](https://mincultura.gov.co/direcciones/artes/Paginas/programas-proyectos/ley-de-espectaculos-publicos.aspx).

### 1.4 Dependencias principales

El negocio depende del inventario suministrado por los promotores, de la aprobación de pagos
por una pasarela externa, de la capacidad de infraestructura durante las ventanas de alta
demanda y de la integración con el sistema de control de acceso. TicketRight administra y
concilia estas relaciones, pero no controla la operación interna de esos terceros.

## 2. Alcance y definición del caso de negocio

### 2.1 Problema y oportunidad

Los promotores deben vender un aforo limitado durante ventanas de alta demanda. En esos
periodos, miles de personas pueden intentar comprar al mismo tiempo, mientras el inventario,
la fila y la pasarela de pagos procesan información a velocidades diferentes. Una respuesta
tardía o repetida de la pasarela puede dejar una compra en un estado incierto.

El impacto es empresarial. Un cobro sin boleta genera reclamos y desconfianza. Una boleta
duplicada afecta el control del aforo. Una devolución mal gestionada aumenta el costo de
soporte y expone al promotor a sanciones y daño reputacional. Además, la reventa informal
puede capturar valor sin participación del promotor y expone al fan a boletas inválidas.

TicketRight aprovecha esta oportunidad mediante una cadena digital trazable que conecta la
fila, la reserva, el pago, la emisión, la transferencia, la reventa, la devolución y la
liquidación.

### 2.2 Clientes, usuarios y actores

**Promotor o productora.** Es el cliente contractual y propietario del inventario. Espera
una venta confiable, liquidación clara, información autorizada sobre sus compradores y
participación en la reventa.

**Fan o comprador.** Es el usuario principal y paga el cargo visible por servicio. Espera
una fila comprensible, una compra sin errores y una boleta válida que pueda transferir o
revender según las reglas del evento.

**Recinto.** Aporta el espacio físico y debe operar dentro del aforo autorizado.

**Artista y equipo de representación.** Influyen en la selección del operador y en las
condiciones de preventa.

**Pasarela de pagos y proveedores tecnológicos.** Procesan pagos, infraestructura,
notificaciones y verificación de identidad.

**Autoridades.** El Ministerio de las Culturas, el PULEP, la SIC y las autoridades locales
vigilan el registro, el cumplimiento y la protección del consumidor.

### 2.3 Solución propuesta

TicketRight permite al promotor configurar eventos, localidades, aforo y reglas de venta.
La plataforma administra la fila, reserva inventario durante un tiempo limitado, procesa y
concilia el pago, emite una boleta nominal y conserva el historial de cada cambio.

Después de la venta, TicketRight permite transferir o revender la boleta dentro de las
condiciones definidas por el promotor. También administra anulaciones, devoluciones y la
liquidación de los recursos correspondientes a cada participante.

### 2.4 Dentro del alcance

- Configuración de eventos, localidades, precios, aforo y reglas de venta.
- Administración de la demanda concentrada y de la fila de compradores.
- Reserva y custodia del inventario disponible.
- Procesamiento, seguimiento y conciliación del pago.
- Emisión de boletas nominales.
- Transferencia y reventa autorizada dentro de TicketRight.
- Gestión de anulaciones y devoluciones.
- Liquidación y reportes para el promotor.

### 2.5 Fuera del alcance

- Producción y logística del evento físico.
- Definición de permisos o del aforo autorizado.
- Operación interna de la pasarela de pagos.
- Control físico de acceso y administración de dispositivos en la entrada.
- Compra, transferencia o reventa realizada fuera de TicketRight.
- Publicidad masiva y representación comercial del artista.
- Eventos de demanda continua, como cine, parques y museos.

En síntesis, TicketRight resuelve para promotores y fans la pérdida de confianza y valor que
ocurre cuando el dinero, la boleta y su titular se desincronizan durante una venta de alta
demanda. El alcance cubre el ciclo digital del derecho de asistencia y termina antes del
control físico en la entrada.

## 3. Business Model Canvas

El Canvas se presenta de forma resumida en la siguiente matriz y se desarrolla en las
secciones 3.1 a 3.9. Como adjunto se entrega
[`canvas-ticketright.xlsx`](canvas-ticketright.xlsx), donde los nueve bloques están expuestos de forma
organizada en el formato suministrado por el profesor. La estructura sigue el concepto visto
en la [lámina 57 del curso](../../curso/clase-01-02.md#el-business-model-canvas-lámina-57).

| Bloques 1, 4 y 7 | Bloques 2, 5 y 8 | Bloques 3, 6 y 9 |
|---|---|---|
| **1. Segmentos de clientes.** Promotores de eventos de 3.000 a 40.000 asistentes; fans como usuarios y pagadores del cargo. | **2. Propuesta de valor.** Correspondencia trazable entre dinero, boleta y titular; reventa autorizada y liquidación clara. | **3. Canales.** Venta consultiva al promotor; PULEP para prospección; canal oficial del evento para el fan. |
| **4. Relaciones con clientes.** Relación contractual y continua con el promotor; autoservicio y soporte resolutivo para el fan. | **5. Fuentes de ingreso.** Cargo por servicio; comisión de reventa; tarifa por evento; datos y reportes; preventa segmentada. | **6. Recursos clave.** Contratos e inventario; autorización como operador; tecnología; trazabilidad; datos; equipo; liquidez y cuentas de custodia. |
| **7. Actividades clave.** Adquirir eventos; operar ventas; conciliar pagos; custodiar boletas y recursos; retener y liquidar la contribución; gestionar reventas y devoluciones. | **8. Socios clave.** Promotores; recintos; pasarela; nube; identidad y notificaciones; control de acceso; artistas y aliados de preventa. | **9. Estructura de costos.** $7.770 variables por boleta en la base y $51.882.000 fijos al mes; inversión, devoluciones, contracargos y contingencias por validar. |

### 3.1 Segmentos de clientes

El cliente contractual es el promotor, la productora, el festival o el recinto con
programación propia. `[S]` El segmento inicial se concentra en eventos de 3.000 a 40.000
asistentes cuya demanda se acumula en una ventana corta. Los usuarios son fans que compran
en el lanzamiento, en grupo o cerca de la fecha del evento.

### 3.2 Propuesta de valor

TicketRight protege la relación entre el dinero y la boleta, incluso cuando un tercero
responde tarde o de forma repetida. Para el promotor ofrece control del inventario,
liquidación trazable, información autorizada y participación en la reventa. Para el fan
ofrece una compra comprensible, una boleta válida y un canal seguro para transferirla o
revenderla.

### 3.3 Canales

La adquisición de promotores se realiza mediante venta consultiva, prospección a partir del
registro PULEP y referencias entre actores del sector. El fan llega a TicketRight mediante
el canal oficial comunicado por el promotor, el artista o los aliados de preventa.

### 3.4 Relaciones con clientes

La relación con el promotor es contractual y continua. Incluye preparación del evento,
acompañamiento durante la venta, liquidación y análisis posterior. La relación con el fan se
basa en autoservicio, información durante la fila y atención resolutiva cuando existe una
disputa.

### 3.5 Fuentes de ingreso

La fuente principal es el cargo por servicio cobrado por cada boleta. Se complementa con
comisiones por reventa autorizada, tarifa de plataforma por evento, paquetes de datos y
reportes, y campañas de preventa segmentada.

### 3.6 Recursos clave

Los recursos principales son los contratos con promotores, el inventario de boletas, la
marca de confianza, la capacidad tecnológica para atender el pico, el registro reconstruible
de cada venta, los datos autorizados y el personal de operación. También son recursos
centrales la autorización vigente como operador y la capacidad financiera para custodiar y
separar los recursos. En el evento tipo se recaudan $1.854,4 millones, de los cuales $1.672
millones pertenecen al promotor y al Estado. Además, el inicio exige entre $317,1 y $530,4
millones de capital propio para T0 y la reserva inicial.

### 3.7 Actividades clave

Las actividades principales son adquirir y retener promotores, administrar aforo e
inventario, operar las ventanas de venta, conciliar pagos, emitir y custodiar boletas,
gestionar transferencias y devoluciones, liquidar recursos y producir información útil para
el promotor. La operación financiera incluye conciliar diariamente los recaudos, retener la
contribución parafiscal, presentar su declaración mensual como agente de retención y mantener
trazabilidad entre las cuentas de custodia y cada evento.

### 3.8 Socios clave

Los socios principales son los promotores, los recintos, la pasarela de pagos, el proveedor
de infraestructura, los servicios de identidad y notificación, los operadores de control de
acceso, los artistas y los aliados de preventa. Las autoridades son organismos de registro
y control, no socios comerciales.

### 3.9 Estructura de costos

La sección 4 cuantifica esta estructura. En el escenario base, cada boleta vendida genera
$7.770 de costo variable: $7.166 de pasarela y $604 de infraestructura, mensajes,
verificación, notificaciones y soporte. Los costos fijos iniciales son $51.882.000 al
mes, de los cuales $42.582.000 corresponden a cuatro personas. La inversión inicial,
los contracargos, las comisiones no recuperables ante devoluciones y la contingencia por
cancelación se mantienen separados hasta validar sus inductores. La adquisición comercial
de $5.000.000 mensuales equivale a un CAC supuesto de $6.000.000 por cada uno de los diez
promotores captados durante el año.

### 3.10 Coherencia del Canvas

El promotor aporta el inventario y asume el impacto de una venta fallida. TicketRight le
ofrece confianza, trazabilidad y nuevas fuentes de valor. La empresa llega al promotor por
venta B2B y cobra principalmente por cada boleta vendida. Para cumplir esa promesa necesita
conciliar pagos, custodiar inventario y recursos, administrar el ciclo completo de la boleta
y cumplir la retención parafiscal. Estas actividades explican los recursos, socios y costos
descritos en el modelo financiero. Esta relación aplica el principio del curso según el cual
las [capacidades se conectan con procesos](../../curso/clase-01-02.md#marco-de-integración-capacidades--procesos-lámina-39),
en vez de presentar cada bloque como una lista independiente.

## 4. Modelo de ingresos, costos y viabilidad

### 4.1 Unidad económica

`[S]` El evento tipo tiene 8.000 puestos, una boleta promedio de $200.000 y una venta del
95% del aforo. Esto equivale a 7.600 boletas vendidas por evento.

| Componente del pago | Destinatario | Valor por boleta | Estado |
|---|---|---:|---|
| Valor de la boleta | Promotor | $200.000 | `[S]` |
| Cargo por servicio de 12% | TicketRight | $24.000 | `[S]` |
| Contribución parafiscal de 10% | Estado | $20.000 | `[V]`, para el precio modelado |
| **Total pagado por el fan** | | **$244.000** | Derivado |

La contribución parafiscal no es ingreso ni costo de TicketRight. Tampoco lo es el valor
nominal de la boleta. El recaudo bruto del evento tipo es $1.854,4 millones. De ese valor,
$1.520 millones son del promotor, $152 millones corresponden a la retención parafiscal y
$182,4 millones son el cargo bruto de TicketRight. Estos flujos deben permanecer separados
durante la custodia y la liquidación.

### 4.2 Fuentes de ingreso

| Fuente | Cálculo del escenario base | Ingreso promedio por evento | Estado |
|---|---|---:|---|
| Cargo por servicio | 7.600 boletas por $24.000 | $182.400.000 | `[S]` |
| Comisión por reventa | 608 reventas por $280.000 × 10% × 50% | $8.512.000 | `[S]` |
| Plataforma por evento | $800.000 por evento activo | $800.000 | `[S]` |
| Datos y reportes | $400.000 en 50% de los eventos | $200.000 | `[S]` |
| Preventa segmentada | $300.000 por campaña, una campaña cada dos eventos | $150.000 | `[S]` |
| **Ingreso promedio total** | | **$192.062.000** | Derivado |

El ingreso promedio total de $192.062.000 equivale a $25.271 por boleta si se dividen todas
las fuentes entre las 7.600 ventas. Para el margen y el punto de equilibrio se usa una medida
más conservadora: el ingreso por boleta atribuible a la venta, compuesto por el cargo y la
reventa, que es $25.120. Se excluyen los $1.150.000 contratados por evento para no convertir
ingresos fijos o de adopción incierta en margen unitario. La reventa de $14.000 se deriva de
un precio secundario de 1,4 veces el nominal, una comisión de 10% y un reparto 50/50 con el
promotor. Los tres parámetros son supuestos pendientes de validación contractual.

### 4.3 Costos variables

| Costo | Inductor | Valor por boleta | Estado |
|---|---|---:|---|
| Pasarela de pagos, antes de IVA | Transacción aprobada sobre $244.000: 2,65% + $700 | $7.166 | Tarifa `[V]`, monto `[S]` |
| Infraestructura, mensajería y almacenamiento | Volumen de usuarios, ventas y eventos registrados | $74 | `[S]` |
| Notificaciones y verificación | Mensajes enviados y compradores nuevos | $180 | `[S]` |
| Soporte, devoluciones y disputas | Agentes por evento e incidentes atendidos | $350 | `[S]` |
| **Total variable por boleta** | | **$7.770** | Derivado |

`[V]` La referencia pública de la pasarela es la tarifa de Wompi de 2,65% más $700 e IVA
por transacción exitosa. Fuente:
[Wompi](https://wompi.com/es/co/planes-tarifas/).

`[S]` El escenario base supone que TicketRight es responsable de IVA, que la factura de la
pasarela cumple los requisitos y que el servicio se destina a operaciones que permiten el
descuento. Por ello, los $1.362 de IVA de la pasarela se registran como impuesto descontable
y no como costo. La procedencia depende de la definición tributaria de S7. Fuente:
[artículos 485 y 488 del Estatuto Tributario, explicados por la DIAN](https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_0483_2026.htm).

### 4.4 Costos fijos mensuales

| Concepto | Valor mensual | Estado |
|---|---:|---|
| Personal: 4 personas × 4 SMMLV × factor prestacional 1,52 | $42.582.000 | SMMLV `[V]`; nivel y factor `[S]` |
| Adquisición comercial de promotores | $5.000.000 | `[S]` |
| Infraestructura base y ambientes | $2.000.000 | `[S]` |
| Cumplimiento legal, contable y de datos | $1.500.000 | `[S]` |
| Licencias y herramientas | $800.000 | `[S]` |
| **Total fijo mensual** | **$51.882.000** | Derivado |

El costo de personal se deriva de cuatro cargos: dos de ingeniería, uno de operación y
soporte y uno comercial-técnico. El salario bruto supuesto por persona es 4 × $1.750.905 =
$7.003.620. Al aplicar el factor prestacional supuesto de 1,52, el costo por persona es
$10.645.502 y el total mensual redondeado es $42.582.000. La validación de nómina y salarios
se gestiona como riesgo R3 de la sección 4.10. El SMMLV de 2026 está fijado transitoriamente
por el [Decreto 159 de 2026](https://dapre.presidencia.gov.co/normativa/normativa/DECRETO%20No.%200159%20DEL%2019%20DE%20FEBRERO%20DE%202026.pdf).
Si el valor definitivo cambia, el costo de personal se desplaza en la misma proporción. Cada
variación de 1% mueve aproximadamente $425.820 al mes y 25 boletas en el punto de equilibrio.
Esta descomposición sigue la distinción del curso y de la rúbrica entre
[el valor del costo y su inductor](../../curso/clase-01-02.md#definición-completa-del-caso-de-negocio-lámina-56).

El canal comercial también tiene una relación económica explícita. Doce meses de adquisición
a $5.000.000 representan $60.000.000 para captar diez promotores, por lo que el CAC supuesto
es $6.000.000 por promotor. Un evento tipo aporta 7.600 × $17.350 = $131.860.000 antes de
costos fijos, cerca de 22 veces ese CAC. Esta comparación supone que cada promotor opera al
menos un evento y no reemplaza el análisis futuro de retención y valor de vida del cliente.

### 4.5 Resultado por boleta y punto de equilibrio

| Indicador | Resultado | Estado |
|---|---:|---|
| Ingreso por boleta atribuible a la venta, cargo más reventa; se excluyen por prudencia los ingresos por evento | $25.120 | `[S]` |
| Costo variable por boleta | $7.770 | `[S]` |
| Dinero disponible por boleta después de costos variables | $17.350 | Derivado |
| Punto de equilibrio con cargo completo | 2.990 boletas o 0,39 eventos al mes | Derivado |
| Punto de equilibrio con cargo compartido 50/50 | 9.698 boletas o 1,28 eventos al mes | Derivado |

La expresión "dinero disponible por boleta" corresponde al ingreso que queda después de
pagar los costos directamente asociados con la venta. Ese valor se utiliza para cubrir los
costos fijos mensuales y financiar el crecimiento. Los puntos de equilibrio se redondean a
la boleta más cercana y no incluyen los ingresos por evento.

### 4.6 Sensibilidad del punto de equilibrio

La sensibilidad modifica una variable a la vez y conserva las demás en el escenario base.
El IVA de la pasarela se trata como descontable. La ocupación no cambia la contribución por
boleta, pero sí cuántas boletas aporta cada evento.

| Escenario | Contribución por boleta | Boletas de equilibrio | Eventos de equilibrio al mes |
|---|---:|---:|---:|
| Cargo 12%, ocupación 95%, boleta $200.000 | $17.350 | 2.990 | 0,39 |
| Cargo 10% | $13.456 | 3.856 | 0,51 |
| Cargo 6% | $5.668 | 9.153 | 1,20 |
| Ocupación 80% | $17.350 | 2.990 | 0,47 |
| Boleta $150.000, por debajo de 3 UVT | $13.084 | 3.965 | 0,52 |

La tabla muestra que el porcentaje del cargo es el inductor de mayor efecto. Un menor aforo
vendido modifica los eventos necesarios, mientras que una boleta de $150.000 también reduce
el cargo, la reventa atribuida y el costo de pasarela; además queda por debajo del umbral
parafiscal modelado.

### 4.7 Necesidad de capital antes del primer ingreso

`[S]` T0 dura entre cuatro y seis meses. El rango no pretende sustituir un presupuesto;
responde cuánto capital debe estar disponible antes de recibir ingresos y hace explícita la
incertidumbre que se cerrará durante T0. La notación T0.1 a T0.6 identifica cada mes de esta
etapa preoperativa.

| Componente | Cálculo | Rango estimado |
|---|---|---:|
| Costos fijos durante T0 | 4 a 6 meses × $51.882.000 | $207.528.000 a $311.292.000 |
| Habilitación inicial fuera de nómina | 0,5 a 1 mes de costo fijo para desarrollo externo, seguridad, asesoría y autorización | $25.941.000 a $51.882.000 |
| Reserva de liquidez | 5% a 10% de los $1.672 millones de terceros en un evento tipo | $83.600.000 a $167.200.000 |
| **Necesidad de capital estimada** | Suma de los tres componentes | **$317.069.000 a $530.374.000** |

La habilitación y la reserva son supuestos de planeación, no cotizaciones verificadas. El
desarrollo realizado por los dos cargos de ingeniería ya está incluido en el costo fijo y no
se suma de nuevo. Los $1.854,4 millones recaudados en un evento tampoco son capital propio:
son fondos originados por las ventas que deben custodiarse. Si el contrato permite girarlos
antes del evento, la exposición por cancelación puede superar la reserva y alcanzar el
recaudo completo.

T0 pide entre ~$317 M y ~$530 M antes del primer peso de ingreso. Con el modelo base, un
evento tipo al mes ya cubre fijos; recuperar ese capital toma del orden de un trimestre de
operación en verde en el ritmo de T1, o varios años si hay que compartir el cargo por
servicio.

### 4.8 Proyección del primer año

La siguiente proyección representa un escenario comercial agresivo `[S]`, no un presupuesto
aprobado. Utiliza la misma unidad económica y aumenta gradualmente de dos a diez promotores
activos. Antes existe un T0 de cuatro a seis meses sin ventas para obtener la autorización
como operador, completar el producto y financiar la operación inicial.

T1, T2, T3 y T4 corresponden al primer, segundo, tercer y cuarto trimestre posteriores a la
autorización. Las cifras trimestrales son promedios mensuales; la última columna acumula los
tres meses de cada trimestre.

| Indicador mensual promedio | T1 | T2 | T3 | T4 | Total año 1 |
|---|---:|---:|---:|---:|---:|
| Promotores activos | 2 | 4 | 7 | 10 | No se suma |
| Eventos pagos | 2 | 4 | 7 | 10 | 69 |
| Boletas vendidas | 15.200 | 30.400 | 53.200 | 76.000 | 524.400 |
| Ingresos aproximados | $384 millones | $768 millones | $1.344 millones | $1.921 millones | $13.252 millones |
| Costos variables | $118 millones | $236 millones | $413 millones | $591 millones | $4.075 millones |
| Costos fijos | $52 millones | $55 millones | $60 millones | $68 millones | $705 millones |
| Resultado antes de impuestos e inversión | $214 millones | $477 millones | $871 millones | $1.262 millones | $8.473 millones |

El resultado proyectado no descuenta el impuesto de renta ni la necesidad de capital de la
sección 4.7. Tampoco deduce los rangos de contracargos, fraude, comisiones de pasarela que no
se recuperen ante retractos, dispersión o cancelación. En una devolución del pago modelado,
TicketRight reintegra hasta $244.000 al fan y ya tuvo una salida de caja de $8.528 por la
pasarela, de la cual $1.362 solo se recupera si procede como IVA descontable. El reglamento
de la pasarela también asigna al comercio riesgos por reclamaciones en ventas no presenciales.
Fuente: [reglamento para comercios de Wompi](https://wompi.com/assets/downloadble/reglamento-Comercios-Colombia.pdf).

Los costos aún no validados y sus responsables se consolidan en la sección 4.10. Hasta
cerrarlos, el resultado anual no representa utilidad neta ni caja disponible.

### 4.9 Evaluación de viabilidad

TicketRight es viable en el modelo operativo actual. El escenario base supera el punto de
equilibrio desde T1 operativo. El escenario con cargo compartido también puede ser viable con
dos eventos tipo al mes, aunque deja un margen mucho menor frente a cambios de aforo, precio
o costos. Esta conclusión no cubre todavía la inversión inicial, los impuestos ni las
contingencias abiertas de la sección 4.10.

El margen antes de impuestos e inversión es cercano a 64% en el año y llega a 66% en T4. Es
alto porque el modelo reconoce como ingreso el cargo completo, excluye el dinero del promotor
y del Estado, mantiene una planta de cuatro personas mientras el volumen crece cinco veces y
aún no incorpora los costos abiertos. No se afirma que este margen sea comparable al de
otros operadores. El contraste con referencias públicas se gestiona como riesgo R7.

La principal sensibilidad del negocio es el porcentaje del cargo por servicio que conserva
TicketRight. La segunda es la capacidad de adquirir eventos de manera recurrente. Por ello,
la decisión de crecer debe basarse en contratos reales con promotores y resultados de los
primeros eventos, no únicamente en la proyección.

### 4.10 Riesgos abiertos del modelo financiero

Los rangos siguientes son supuestos de gestión. No se presentan como datos observados. Cada
responsable debe reemplazarlos por evidencia antes del hito indicado.

| Riesgo por validar | Responsable | Fecha de cierre | Rango estimado y estado | Impacto sobre el equilibrio o la viabilidad |
|---|---|---|---|---|
| R1. IVA del cargo, reventa y pasarela | Contador tributarista | Antes de fijar precios en T0.2 | `[S]` 0% o 19%; equilibrio entre 2.990 y 4.268 boletas | Puede aumentar hasta 43% las boletas necesarias y cambia la facturación. |
| R2. Plazos de dispersión y reserva de liquidez | Alejo, pasarela y promotor piloto | Antes de finalizar T0.3 | `[S]` Reserva de 5% a 10% de $1.672 millones: $83,6 a $167,2 millones | No cambia el equilibrio operativo, pero aumenta la necesidad de capital y condiciona devoluciones. |
| R3. Nómina y SMMLV definitivo | Quinnie y asesor de nómina | Antes de contratar en T0.3 | `[S]` Escenario de ±5%: personal entre $40,5 y $44,7 millones al mes | Lleva el equilibrio aproximado a un rango de 2.868 a 3.113 boletas. |
| R4. Duración y habilitación de T0 | Alejo y Quinnie | Antes de finalizar T0.1 | `[S]` 4 a 6 meses; capital total de $317,1 a $530,4 millones | Cada mes adicional agrega $51.882.000 antes del primer ingreso. |
| R5. Contracargos, fraude, reembolsos y dispersión | Quinnie y proveedor de pagos | Antes de contratar la pasarela en T0.3 | `[S]` Contracargos de 0,1% a 0,5%; $7.166 a $8.528 no recuperables por devolución | Solo los contracargos reducen la contribución promedio entre $244 y $1.220 por boleta y llevan el equilibrio a 3.033 a 3.216 boletas. |
| R6. Cancelación de un evento | Alejo y promotor piloto | Antes del primer contrato en T0.4 | `[S]` Exposición entre $0 y $1.854,4 millones por evento | No altera el equilibrio unitario, pero puede agotar la caja si los recursos ya fueron girados. |
| R7. Impuesto de renta y margen comparable | Contador y Lina | Antes de la decisión de inversión en T0.5 | `[V]` Tarifa general de 35%; `[S]` base igual al resultado operativo; margen comparable por verificar | No cambia el equilibrio operativo. Bajo una aproximación simple, reduce el resultado anual de $8.473 a $5.508 millones antes de inversión. Fuente: [DIAN](https://www.dian.gov.co/impuestos/sociedades/Paginas/Renta-personas-juridicas.aspx). |

## 5. Objetivos y resultados clave

Los OKR se definen para el primer año de operación. Cada objetivo expresa una prioridad
empresarial y cada resultado clave establece una medida, una meta y un plazo. Cuando no
existe historia operativa, el primer trimestre establece la línea base para los indicadores
de experiencia. La formulación aplica la distinción del curso entre un objetivo cualitativo
y un [resultado clave cuantificable](../../curso/clase-01-02.md#cómo-se-construye-lámina-50).

### OKR 1. Confianza del promotor

> **Objetivo:** Convertir la confianza en la razón por la que los promotores eligen y
> mantienen a TicketRight.

- **KR1.1:** Obtener la resolución de autorización como operador de boletería en línea antes
  de finalizar T0.6. Es un resultado binario: sin resolución no puede iniciar T1. `[S]`
- **KR1.2:** Pasar de 0 a 2 promotores que contraten y operen al menos un evento pago antes
  de finalizar T1. `[S]`
- **KR1.3:** Pasar de 0 a 10 promotores activos antes de finalizar T4. Un promotor activo es
  aquel que operó al menos un evento pago durante los últimos 90 días. `[S]`
- **KR1.4:** Conseguir que al menos 80% de los promotores programe un segundo evento con
  TicketRight dentro de los 180 días siguientes a su primera operación, medido desde T3.
  La línea base se establece con la cohorte de T1. `[S]`

### OKR 2. Confianza del fan

> **Objetivo:** Hacer de cada compra de alta demanda una experiencia en la que el fan pueda
> confiar y que quiera recomendar.

- **KR2.1:** Mantener los reclamos procedentes por errores entre dinero y boleta en máximo
  0,1% de las ventas completadas desde T2. La línea base se establece en T1. `[S]`
- **KR2.2:** Lograr que al menos 98% de quienes inician el pago completen la compra sin error
  durante la ventana de mayor demanda desde T2. La línea base se establece en T1. `[S]`
- **KR2.3:** Alcanzar una satisfacción poscompra de al menos 4,2 sobre 5 desde T2. La línea
  base se establece en T1. `[S]`

Para este objetivo, un reclamo procedente es aquel que, después de revisar la trazabilidad
de la operación, confirma una diferencia atribuible a TicketRight entre el dinero cobrado y
la boleta emitida, anulada o devuelta.

### OKR 3. Rentabilidad por evento

> **Objetivo:** Hacer de cada evento vendido una operación rentable que financie el
> crecimiento de TicketRight.

- **KR3.1:** Alcanzar el punto de equilibrio mensual antes de finalizar T1. `[S]`
- **KR3.2:** Mantener un resultado antes de impuestos e inversión igual o superior a cero
  durante tres meses consecutivos antes de finalizar T2. `[S]`
- **KR3.3:** Conservar al menos $10.000 por cada boleta después de pagar sus costos variables,
  medido trimestralmente desde T2. El modelo estima $17.350 en el escenario base y $12.156
  en la cota tributaria conservadora de S7. `[S]`
- **KR3.4:** Alcanzar un promedio de 1,5 eventos pagos por promotor activo durante T4. Este
  indicador mide profundidad de la relación y no repite el número de promotores de KR1.3.
  `[S]`
- **KR3.5:** Mantener diariamente 100% de los recursos de terceros respaldados por saldos
  segregados y conciliados, sin usar el flotante para financiar la operación, desde el primer
  evento. `[S]`

### OKR 4. Servicios complementarios adoptados

> **Objetivo:** Convertir la reventa autorizada y la información consentida en servicios que
> fortalezcan al promotor y generen crecimiento responsable para TicketRight.

- **KR4.1:** Lograr que al menos 8% de las boletas emitidas se revenda dentro de TicketRight
  antes de finalizar T4. `[S]`
- **KR4.2:** Conseguir que al menos 70% de los promotores activos habilite la reventa
  autorizada en uno o más eventos antes de finalizar T4. `[S]`
- **KR4.3:** Conseguir que al menos 50% de los eventos pagos contrate el paquete de datos y
  reportes antes de finalizar T4. `[S]`
- **KR4.4:** Alcanzar al menos $87 millones mensuales combinados por comisiones de reventa y
  paquetes de datos antes de finalizar T4. La meta corresponde a diez eventos tipo con 8%
  de reventa y cinco paquetes de datos de $400.000. `[S]`

### Seguimiento de los OKR

Los resultados se revisan mensualmente. Los indicadores de experiencia se calculan por
evento y se consolidan cada trimestre. Los KR progresivos se califican en una escala de 0,0
a 1,0, en la que 0,7 representa la zona de éxito esperada para una meta ambiciosa. El KR3.5
y el cumplimiento de las obligaciones legales, tributarias, de datos y de aforo se evalúan
de forma binaria: cumplido o incumplido. Su incumplimiento no puede compensarse con el logro
de otro resultado.

## Coherencia integral del caso

El modelo comienza con el promotor, quien aporta el inventario y contrata la plataforma. La
propuesta de confianza busca que ese promotor elija TicketRight y vuelva a utilizarla, lo
que se mide en el OKR 1. El fan completa la venta y paga el cargo por servicio; su confianza,
conversión y satisfacción se miden en el OKR 2.

Los ingresos por boleta deben superar los costos variables y cubrir la operación fija. Esta
relación se mide mediante el punto de equilibrio, el dinero disponible por boleta y el
volumen de eventos por promotor del OKR 3. El mismo objetivo controla que el flotante de
terceros no se convierta en financiación propia. La reventa y los datos no se presentan como
ingresos garantizados. Son hipótesis de diferenciación cuya adopción y aporte económico se
miden en el OKR 4.

De esta manera, clientes, propuesta de valor, ingresos, costos y objetivos describen una sola
lógica empresarial. TicketRight crece únicamente si obtiene inventario, protege la compra,
conserva valor en cada venta y demuestra que sus servicios complementarios son adoptados por
promotores y fans.

## Referencias

1. Ministerio de las Culturas. Portal Único de Espectáculos Públicos de las Artes Escénicas:
   [PULEP](https://pulep.mincultura.gov.co/Paginas/ley1493.aspx).
2. Ámbito Jurídico. Eventos de artes escénicas en Colombia crecieron 22% en 2023:
   [consulta](https://www.ambitojuridico.com/noticias/general/educacion-y-cultura/eventos-de-artes-escenicas-en-colombia-crecieron-un-22-en-2023).
3. Superintendencia de Industria y Comercio. Pliego de cargos contra Ticket Fast S.A.S.:
   [comunicado oficial](https://sedeelectronica.sic.gov.co/comunicado/la-sic-del-cambio-formula-pliego-de-cargos-tuboleta-por-presuntas-fallas-en-el-deber-de-informacion-las-clausulas-abusivas-y-las-reglas).
4. El Tiempo. Composición del cargo por servicio en Colombia:
   [consulta](https://www.eltiempo.com/economia/finanzas-personales/que-le-cobran-en-el-cargo-por-servicio-cuando-compra-una-boleta-en-colombia-815191).
5. Función Pública. [Ley 1493 de 2011](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=45246).
6. Función Pública. [Ley 1480 de 2011](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=44306).
7. Función Pública. [Ley 1581 de 2012](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981).
8. Wompi. [Planes y tarifas](https://wompi.com/es/co/planes-tarifas/).
9. DIAN. [Resolución 000238 de 2025 sobre UVT 2026](https://www.dian.gov.co/normatividad/Normatividad/Resoluci%C3%B3n%20000238%20de%2015-12-2025.Pdf).
10. DIAN. [Oficio 900918 de 2021 sobre la exclusión de IVA](https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_900918_2021.htm).
11. DIAN. [Concepto Unificado 1 de 2018 sobre la contribución parafiscal](https://normograma.dian.gov.co/dian/compilacion/docs/concepto_tributario_dian_0000001_2018.htm).
12. Ministerio de las Culturas. [Autorización de operadores de boletería en línea](https://mincultura.gov.co/direcciones/artes/Paginas/programas-proyectos/ley-de-espectaculos-publicos.aspx).
13. DIAN. [Concepto 483 de 2026 sobre IVA descontable](https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_0483_2026.htm).
14. Wompi. [Reglamento para comercios en Colombia](https://wompi.com/assets/downloadble/reglamento-Comercios-Colombia.pdf).
15. Presidencia de la República. [Decreto 159 de 2026 sobre el SMMLV](https://dapre.presidencia.gov.co/normativa/normativa/DECRETO%20No.%200159%20DEL%2019%20DE%20FEBRERO%20DE%202026.pdf).
16. DIAN. [Impuesto sobre la renta para personas jurídicas](https://www.dian.gov.co/impuestos/sociedades/Paginas/Renta-personas-juridicas.aspx).
