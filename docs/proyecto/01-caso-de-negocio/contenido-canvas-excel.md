# Contenido definitivo para el Canvas en Excel

Este documento contiene únicamente la información que debe trasladarse a la hoja `CANVAS`
de [`canvas-ticketright.xlsx`](canvas-ticketright.xlsx) — el archivo que se entregó. Las
hojas ocultas `CÁLCULOS` y `sb` no deben modificarse.

> El traspaso ya se hizo y el resultado se entregó el 12 de septiembre. Este documento se
> conserva porque es la única fuente del texto celda por celda: sirve si hay que rehacer el
> Excel o corregir un cuadro. `canvas-puesto.xlsx` es la versión anterior al cambio de marca
> y quedó superada.

Cada sección indica la celda o rango combinado de destino. El texto dentro de cada bloque de
código se copia completo en una sola celda, conservando los saltos de línea. Los títulos que
ya trae la plantilla pueden mantenerse.

## Encabezado

### Negocio, celda combinada I3:M3

```text
NEGOCIO: TicketRight, boletería para eventos de alta demanda
```

### Integrantes, celda combinada O3:S3

```text
NOMBRE: Alejandro Ríos, Lina Ballesteros y Quinnie Villarreal
```

### Fecha, celda W3

```text
FECHA: 2026-09-12
```

## 1. Asociaciones clave, celda combinada E8:E38

```text
ASOCIACIONES CLAVE

• PASARELA DE PAGOS: procesa pagos y estados asíncronos. Es el tercero que puede romper la correspondencia entre dinero y boleta. Referencia: 2,65% + $700 + IVA por transacción exitosa [V]. Fuente: tarifas públicas de Wompi.

• PROMOTORES Y RECINTOS: aportan el inventario, las reglas del evento y el aforo autorizado.

• OPERADOR DE CONTROL DE ACCESO: recibe por integración los eventos de boleta emitida, transferida y anulada. El control físico de ingreso queda fuera de TicketRight.

• PROVEEDOR DE NUBE: aporta capacidad elástica para la ventana de alta demanda.

• SERVICIOS DE IDENTIDAD Y NOTIFICACIÓN: habilitan la boleta nominal, la transferencia, la reventa y las comunicaciones al fan.

• ARTISTAS, MANAGEMENT Y ALIADOS DE PREVENTA: comunican el canal oficial e influyen en la selección del operador.

El Ministerio de las Culturas, el PULEP, la DIAN y la SIC son autoridades de autorización, registro y control; no son socios comerciales.
```

## 2. Actividades clave, celda combinada I8:I21

```text
ACTIVIDADES CLAVE

1. Adquirir y retener promotores e inventario de eventos.
2. Configurar localidades, precios, aforo y reglas de venta.
3. Administrar la fila y demostrar el orden de atención.
4. Reservar inventario, procesar el pago y emitir la boleta.
5. Conciliar la correspondencia entre dinero, boleta y titular.
6. Gestionar transferencias, reventas, anulaciones y devoluciones.
7. Custodiar y separar los recursos del promotor, TicketRight y el Estado.
8. Retener y declarar mensualmente la contribución parafiscal como agente de retención, y entregar al productor los soportes para su declaración bimestral o por evento.
9. Producir datos y reportes autorizados para el promotor.
```

## 3. Propuesta de valor, celda combinada M8:O38

```text
PROPUESTA DE VALOR

TicketRight protege la correspondencia entre el dinero cobrado, la boleta emitida y su titular, incluso cuando la pasarela responde tarde o de forma repetida.

PARA EL PROMOTOR
• Control del inventario y del aforo durante ventas de alta demanda.
• Liquidación trazable de los recursos del promotor, TicketRight y el Estado.
• Participación en el margen de la reventa autorizada.
• Datos y reportes del evento con autorización del titular.
• Menor exposición operativa y reputacional ante pagos inciertos, disputas y devoluciones.

PARA EL FAN
• Una compra comprensible y una boleta válida por cada cobro confirmado.
• Reglas de fila publicadas antes de iniciar la venta.
• Transferencia y reventa dentro de un canal autorizado.
• Trazabilidad y atención resolutiva cuando existe una disputa.

[V] La SIC formuló en junio de 2026 un pliego de cargos contra el operador de TuBoleta por presuntas fallas de información, comercio electrónico, devoluciones y cláusulas abusivas. Es una investigación en curso, no una condena. Fuente: comunicado oficial de la SIC.
```

## 4. Relación con clientes, celda combinada S8:S21

```text
RELACIÓN CON CLIENTES

CON EL PROMOTOR
• Relación B2B contractual y continua.
• Preparación y configuración del evento.
• Acompañamiento durante la ventana de venta.
• Conciliación, liquidación y análisis posterior.
• Seguimiento para lograr nuevos eventos y una relación recurrente.

CON EL FAN
• Autoservicio para comprar, consultar, transferir y revender.
• Información de posición y estado durante la fila.
• Soporte concentrado en la ventana de venta.
• Atención resolutiva de pagos inciertos, devoluciones y disputas.

La transferencia y la reventa solo se habilitan bajo las reglas definidas por el promotor.
```

## 5. Segmentos de clientes, celda combinada W8:W38

```text
SEGMENTOS DE CLIENTES

CLIENTE CONTRACTUAL
Promotores, productoras, festivales y recintos con programación propia que venden eventos de 3.000 a 40.000 asistentes y concentran la demanda en una ventana corta [S].

Perfiles iniciales:
• Promotora independiente de música en vivo.
• Organizador de festivales.
• Recinto con programación propia.

USUARIO Y PAGADOR DEL CARGO
Fans que compran en el lanzamiento, en grupo o cerca de la fecha del evento.

Comportamientos relevantes:
• Comprador de minuto uno, que concentra la carga y el riesgo reputacional.
• Comprador grupal, que necesita transferir boletas.
• Comprador de última hora, que necesita una reventa segura.

No son clientes objetivo los revendedores profesionales ni los eventos de demanda continua, como cine, parques y museos.

[V] La boletería estimada de artes escénicas alcanzó $1,53 billones en 2023. Fuente: Ámbito Jurídico. El PULEP publica el universo formal de productores y eventos. Fuente: Ministerio de las Culturas.
```

## 6. Recursos clave, celda combinada I26:I38

```text
RECURSOS CLAVE

1. Contratos con promotores e inventario autorizado para vender.
2. Resolución vigente del Ministerio de las Culturas que autorice a TicketRight como operador de boletería en línea [V]. Fuente: procedimiento de autorización publicado por el Ministerio.
3. Capacidad tecnológica elástica para las ventanas de alta demanda.
4. Registro reconstruible de cada fila, reserva, pago, emisión, transferencia y devolución.
5. Identidad verificada del comprador y datos tratados con autorización.
6. Equipo de cuatro personas: dos de ingeniería, una de operación y soporte y una comercial-técnica [S].
7. Capital propio estimado entre $317,1 y $530,4 millones para financiar T0 y la reserva inicial [S].
8. Cuentas de custodia y capacidad de conciliación. En el evento tipo, $1.672 millones pertenecen al promotor y al Estado [S].
9. Marca de confianza e histórico de ventas por promotor.
```

## 7. Canales, celda combinada S26:S38

```text
CANALES

ADQUISICIÓN DE PROMOTORES
• Venta consultiva B2B.
• Prospección a partir del registro público del PULEP [V].
• Referencias de promotores, recintos, artistas y aliados del sector.
• Inversión comercial de $5.000.000 al mes [S].
• CAC estimado: $6.000.000 por promotor, suponiendo diez promotores captados en el primer año [S].

ACCESO DEL FAN
• Canal digital oficial enlazado desde la comunicación del promotor, artista o evento.
• Sitio de venta y sala de espera de TicketRight.

OPERACIÓN DEL PROMOTOR
• Consola para configurar inventario y reglas, consultar ventas y recibir reportes y liquidaciones.

El modelo no depende de publicidad masiva dirigida al fan.
```

## 8. Estructura de costos, celda combinada E43:M59

```text
ESTRUCTURA DE COSTOS

COSTO VARIABLE POR BOLETA: $7.770 [S]
• Pasarela antes de IVA: transacción aprobada sobre $244.000 × 2,65% + $700 = $7.166.
• Infraestructura, mensajería y almacenamiento: $74.
• Notificaciones y verificación: $180.
• Soporte, devoluciones y disputas: $350.
• El IVA de la pasarela se trata como descontable en el escenario base [S].

COSTO FIJO MENSUAL: $51.882.000 [S]
• Personal: 4 personas × 4 SMMLV × factor prestacional 1,52 = $42.582.000.
• Adquisición comercial de promotores: $5.000.000.
• Infraestructura base y ambientes: $2.000.000.
• Cumplimiento legal, contable y de datos: $1.500.000.
• Licencias y herramientas: $800.000.

CAPITAL ANTES DEL PRIMER INGRESO: $317,1 A $530,4 MILLONES [S]
• T0 de 4 a 6 meses: $207,5 a $311,3 millones.
• Habilitación externa: $25,9 a $51,9 millones.
• Reserva de liquidez: $83,6 a $167,2 millones.

RIESGOS ABIERTOS
IVA del cargo, contracargos, fraude, comisiones no recuperables, dispersión, cancelación del evento, impuesto de renta y cambio del SMMLV transitorio.
```

## 9. Fuentes de ingreso, celda combinada O43:W59

```text
FUENTES DE INGRESO

PAGO DEL FAN EN EL EVENTO TIPO
• Boleta para el promotor: $200.000 [S].
• Cargo por servicio de TicketRight: 12% = $24.000 [S].
• Contribución parafiscal para el Estado: 10% = $20.000 [V]. Fuente: Ley 1493 de 2011.
• Total pagado: $244.000.

INGRESO PROMEDIO POR EVENTO: $192.062.000 [S]
1. Cargo por servicio: $182.400.000, aproximadamente 95,0%.
2. Comisión por reventa: $8.512.000, aproximadamente 4,4%.
3. Plataforma por evento: $800.000, aproximadamente 0,4%.
4. Datos y reportes: $200.000 en promedio, aproximadamente 0,1%.
5. Preventa segmentada: $150.000 en promedio, aproximadamente 0,1%.

La reventa supone 608 boletas × $280.000 × 10% de comisión × 50% para TicketRight = $8.512.000 [S].

UNIDAD ECONÓMICA CONSERVADORA
• Ingreso por boleta atribuible a la venta: $25.120. Incluye cargo y reventa; excluye por prudencia $1.150.000 de ingresos por evento.
• Costo variable por boleta: $7.770.
• Contribución por boleta: $17.350.
• Punto de equilibrio: 2.990 boletas o 0,39 eventos tipo al mes.
• Si el cargo de $24.000 incluye IVA y el IVA de la pasarela es descontable: contribución de $13.518 y equilibrio de 3.838 boletas [S].
• En la cota conservadora con cargo gravado e IVA de la pasarela no descontable: contribución de $12.156 y equilibrio de 4.268 boletas [S].

El valor nominal de la boleta y la contribución parafiscal no son ingresos de TicketRight.
```

## Control final después del traspaso

El agente que complete el Excel debe verificar lo siguiente:

1. Solo modificó la hoja visible `CANVAS`.
2. Conservó las celdas combinadas, colores, bordes, fórmulas y dimensiones de la plantilla.
3. Reemplazó la marca `Puesto` por `TicketRight` en el encabezado y en los nueve bloques.
4. El costo variable figura como $7.770, no como $8.528, $9.132 ni $9.173.
5. La contribución por boleta figura como $17.350 y el equilibrio como 2.990 boletas.
6. El costo fijo utiliza la notación $51.882.000.
7. El capital requerido antes del primer ingreso figura entre $317,1 y $530,4 millones.
8. El texto cabe en cada cuadro y permanece legible al imprimir la hoja en una página.
