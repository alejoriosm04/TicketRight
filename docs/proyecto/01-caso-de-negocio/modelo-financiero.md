# Modelo de costos e ingresos

> **Componente 4 de la rúbrica · 25% del entregable.**
>
> **Responsable:** Quinnie · **Fecha límite:** jueves 10 de septiembre
> **Estado:** borrador completo 2026-09-09 — cifras listas para revisión del equipo
> **Depende de:** bloques 6, 7 y 8 del [canvas](canvas.md) (Alejo) y del
> [`alcance.md`](alcance.md) (Lina). Mientras esos archivos cierran, cada costo se ancla
> al recurso/actividad/socio **que el canvas ya describe como esperado**.
>
> Los bloques 5 y 9 del canvas son **el resumen** de este documento: se copian al final.

**Marca cada cifra** `[V]` con fuente · `[S]` supuesto con responsable · `PENDIENTE` con
ruta concreta. Un `PENDIENTE` honesto vale más que un número inventado.

Moneda: **COP**. Año de referencia de costos laborales y UVT: **2026**.

---

## Contenido

> ⚠️ **La Entrega 1 ya se entregó.** Las cifras de este archivo son las que sustentan
> [`caso-de-negocio-corporativo.md` §4](caso-de-negocio-corporativo.md#4-modelo-de-ingresos-costos-y-viabilidad),
> que es el resumen entregado. Las secciones marcadas *(histórico)* son el plan de esa
> semana: no son trabajo pendiente.

| # | Sección | Qué responde |
|---|---|---|
| — | [La unidad del modelo](#la-unidad-del-modelo-el-evento-tipo) | ¿Sobre qué evento se hacen todas las cuentas? |
| — | [Datos ancla verificados](#datos-ancla-verificados-los-de-quinnie--el-rango-de-mercado) | ¿Qué cifras son `[V]` y de dónde salen? |
| 1 | [Fuentes de ingreso](#1-fuentes-de-ingreso) | ¿De dónde entra la plata y cuánta? |
| 2 | [Costos variables por inductor](#2-costos-variables--por-inductor) | ¿Qué cuesta cada boleta vendida, y por qué? |
| 3 | [Costos fijos](#3-costos-fijos) | ¿Qué cuesta el mes aunque no se venda nada? |
| 4 | [Unit economics](#4-unit-economics--contribución-por-boleta) | ¿Cuánto deja cada boleta? |
| 5 | [Punto de equilibrio](#5-punto-de-equilibrio) | ¿Cuántas boletas hay que vender para no perder? |
| 6 | [Proyección a 12 meses](#6-proyección-a-12-meses) | ¿Cómo se ve el año 1? |
| 7 | [Escenarios y sensibilidad](#7-escenarios-y-sensibilidad) | ¿Qué pasa si el cargo baja o el aforo no se llena? |
| 8 | [Supuestos de este modelo](#8-supuestos-de-este-modelo) | ¿Qué hay que validar para que esto se sostenga? |
| — | [Cómo se conecta con el resto](#cómo-se-conecta-con-el-resto--la-cadena-que-la-rúbrica-quiere-ver) | La cadena de trazabilidad |
| — | [Números por fijar](#los-números-que-hay-que-fijar-antes-del-jueves-10) · [Insumos para OKR](#insumos-listos-para-la-sesión-de-okr-jueves--no-reemplazan-5) · [Antes de cerrar](#antes-de-dar-esto-por-cerrado) | *(histórico)* |

## La regla que define la nota de este componente

> Los estudiantes deben diferenciar **«¿cuánto cuesta?»** de **«¿qué genera el costo?»**
>
> ❌ Menos útil: *Servidores: $X*
> ✅ Más útil: *100.000 transacciones/mes × costo por transacción = $X*

Uno de los cinco diferenciadores del proyecto es que **el costo por boleta vendida es un
atributo de calidad con meta**
([tesis](ideas/idea-lina.md#la-tesis-que-nos-separa-del-montón)). Este documento lo vuelve
número.

Formato obligatorio de cada fila de costo:

```
<concepto>  =  <driver del negocio>  ×  <costo unitario>
```

---

## La unidad del modelo: el evento tipo

Este negocio no factura por usuario mensual: factura **por evento**. Todo se modela por
evento tipo y después se multiplica por eventos al mes.

| Parámetro del evento tipo | Valor | Estado | De dónde sale |
|---|---|---|---|
| Aforo | **8.000** | `[S]` | Punto medio del segmento 3.000–40.000 del [bloque 1](canvas.md#1-clientes-segmentos-de-mercado--lina). **Responsable de validar:** Lina (corte PULEP) |
| Precio promedio de boleta | **COP $200.000** | `[S]` | Por encima del umbral de 3 UVT para que el desglose muestre los tres bolsillos. **Responsable de validar:** Lina (PULEP / programación pública) |
| % del aforo que se vende | **95%** | `[S]` | Evento de alta demanda; el segmento se define por agotar. Responsable: equipo |
| Boletas vendidas por evento | **7.600** | derivado | 8.000 × 95% |
| Boletas en el pico (primeros 10 min) | **40% del aforo = 3.200** | `[S]` | Alimenta el costo de cómputo de pico. Responsable: equipo |
| Eventos al mes (escenario base, año 1 estabilizado) | ver §6 | `[S]` | Depende de promotores firmados |

> **Por qué $200.000 y no menos.** `[V]` La parafiscal aplica a boletas ≥ **3 UVT**. UVT
> 2026 = **COP $52.374** (DIAN, Resolución 000238 de 15-dic-2025). Umbral:
> **3 × $52.374 = $157.122**. Un precio tipo de $200.000 queda por encima y permite mostrar
> el desglose completo. Si el precio promedio real del segmento cayera bajo $157.122, la
> parafiscal deja de aplicar en esa fila —el modelo se recalcula; no se inventa el umbral.

---

## Datos ancla verificados (los de Quinnie + el rango de mercado)

| # | Dato | Valor | Estado | Fuente |
|---|---|---|---|---|
| 3 | Tarifa pasarela (referencia Wompi Plan Avanzado) | **2,65% + $700 + IVA (19%)** por transacción exitosa | `[V]` | [Wompi – Planes y tarifas](https://wompi.com/es/co/planes-tarifas/) · consultado 2026-09-09. *Otras pasarelas (PayU, Mercado Pago) tienen rangos similares; usamos Wompi como referencia pública y nombrada.* |
| 4 | UVT 2026 | **$52.374** | `[V]` | DIAN, [Resolución 000238 de 2025](https://www.dian.gov.co/normatividad/Normatividad/Resoluci%C3%B3n%20000238%20de%2015-12-2025.Pdf) |
| 4b | Umbral parafiscal (3 UVT) | **$157.122** | `[V]` | Ley 1493 de 2011 + UVT 2026 |
| 5 | SMMLV 2026 | **$1.750.905** | `[V]` | Decreto 1469 de 2025 (vigente tras revocatoria de suspensión, jul-2026). Auxilio de transporte: **$249.095** (Decreto 1470 de 2025) |
| 5b | Carga patronal adicional sobre salario | **~52%** (sin exoneración 114-1) | `[S]` | Composición legal: prestaciones ~21,83% + pensión 12% + salud 8,5% + caja 4% + SENA 2% + ICBF 3% + ARL riesgo I ~0,52%. Fuente de estructura: [BUK – costo empleado](https://www.buk.co/blog/como-calcular-costo-empleado-colombia). **Usamos 52% como factor conservador.** |
| — | Cargo por servicio de mercado | **10–15%** del valor de la boleta | `[V]` | [validación 2](validaciones.md#validación-2--comisión-del-mercado-y-quién-opera) · El Tiempo, 2023 |
| 7 | Nuestro *take rate* | **12%** (propuesta) | `[S]` | Decisión de equipo pendiente de ratificar. Justificación: punto medio del rango `[V]`; deja margen frente a Tuboleta/Ticketmaster sin competir solo por precio |
| 6 | Precio de cómputo nube | ver §2 | `PENDIENTE` / `[S]` provisional | Dueño: **Alejo**. Mientras tanto se usa una cota pública gruesa (abajo) |
| 8 | Meta costo infra por boleta | **≤ COP $200** | `[S]` | Propuesta para KR de OKR. Dueño formal: Alejo; Quinnie propone el número para desbloquear |

---

## 1. Fuentes de ingreso

`[V]` El cargo por servicio del mercado está entre 10% y 15%
([validación 2](validaciones.md#validación-2--comisión-del-mercado-y-quién-opera)).

### El desglose del precio (tres bolsillos)

```
Precio final que ve el fan  =  valor de la boleta        → del promotor          $200.000
                            +  cargo por servicio (12%)  → NUESTRO ingreso         $24.000
                            +  contribución parafiscal   → del Estado (10%)       $20.000
                                                    ─────────────────────────────────
                                                    Total fan                     $244.000
```

> ⚠️ **La parafiscal no es ingreso nuestro ni costo nuestro: es dinero que pasa por el
> sistema.** Va en el desglose y en el flujo de caja operacional (liquidación), **nunca** en
> la línea de ingreso. Lo que sí es nuestro: la **obligación de liquidarla sin equivocarse**
> (tercer bolsillo de la tesis).

| # | Fuente | Quién paga | Base de cálculo | Aporte al ingreso (base) | Estado |
|---|---|---|---|---|---|
| 1 | Comisión de servicio por boleta | El fan | boletas × precio × 12% | **~86%** | `[S]` take rate 12% |
| 2 | Comisión por reventa en plataforma | Revendedor / fan comprador | boletas revendidas × precio reventa × 10%, de lo cual **nos quedamos el 50%** y el otro 50% va al promotor | **~7%** | `[S]` fracción revendida y split |
| 3 | Plataforma multi-tenant para el promotor | El promotor | tarifa por evento activo | **~4%** | `[S]` |
| 4 | Datos / reportes del evento | El promotor | incluido en plan o add-on | **~2%** | `[S]` |
| 5 | Preventa segmentada como producto | El promotor / aliado | tarifa por campaña | **~1%** | `[S]` |

### Cálculo de la fuente 1 (por boleta emitida)

| Concepto | Valor | Estado |
|---|---|---|
| Precio boleta | $200.000 | `[S]` |
| Take rate | 12% | `[S]` propuesto |
| **Ingreso bruto por boleta (fuente 1)** | **$24.000** | derivado |

### Cálculo de la fuente 2 (reventa) — el diferenciador

| Parámetro | Valor | Estado |
|---|---|---|
| % de boletas que se revenden dentro de la plataforma | **8%** del aforo vendido | `[S]` — no hay cifra pública en Colombia ([validación 3](validaciones.md#validación-3--reventa)); se modela como escenario |
| Precio de reventa / nominal | **1,4×** ($280.000) | `[S]` — el +500% del Mundial es cota superior, no parámetro |
| Comisión de plataforma sobre reventa | **10%** del precio de reventa = $28.000 | `[S]` |
| Split TicketRight / promotor | **50 / 50** | `[S]` — coherente con «devolver margen al promotor» |
| **Ingreso neto TicketRight por boleta revendida** | **$14.000** | derivado |
| **Ingreso atribuido de reventa por boleta emitida** | 8% × $14.000 = **$1.120** | derivado |

> **Pregunta de viabilidad (rúbrica):** ¿el negocio se sostiene **sin** la fuente 2?
> **Sí, en el escenario base** (ver §5 y §7). La reventa mejora el margen y es el
> diferenciador comercial; no es el único piso de supervivencia. Si la fuente 2 tiende a
> cero, el negocio sigue siendo una boletera con invariante monetario —menos diferencial,
> aún viable con el take rate—.

### Fuentes 3–5 (por evento / mes)

| Fuente | Supuesto base | Ingreso | Estado |
|---|---|---|---|
| 3 · SaaS / plataforma por evento | $800.000 por evento activo | $800.000 × eventos/mes | `[S]` |
| 4 · Pack de datos | $400.000 por evento (o incluido en plan premium) | modelado como 50% de eventos lo pagan | `[S]` |
| 5 · Preventa segmentada | $300.000 por campaña; 1 campaña cada 2 eventos | | `[S]` |

En el escenario base del §6, las fuentes 3–5 aportan ~5–7% del ingreso total; la tesis
comercial no depende de inflarlas.

---

## 2. Costos variables — por inductor

| Concepto | Inductor (driver) | Fórmula | Costo unitario | Por boleta (base) | Estado |
|---|---|---|---|---|---|
| Comisión de la pasarela | transacciones aprobadas | (monto cobrado al fan × 2,65% + $700) × 1,19 | ver abajo | **~$8.528** | `[V]` tarifa · `[S]` monto |
| Cómputo del pico | instancias-hora en ventana de venta | instancias × horas × $/hora | cota `[S]` | **~$50** | `PENDIENTE` Alejo; cota abajo |
| Cómputo base (fuera del pico) | eventos activos en el mes | prorrateo mensual / boletas | | **~$30** | `[S]` |
| Mensajería / bus de eventos | eventos de dominio por venta | ~10 eventos × costo msg | | **~$20** | `[S]` |
| Almacenamiento y auditoría | boletas × meses de retención | | | **~$15** | `[S]` |
| Notificaciones (correo/SMS) | boletas + cambios de estado | 1 SMS + 2 correos tip. | SMS ~$50 | **~$80** | `[S]` |
| Verificación de identidad | compradores nuevos | % nuevos × costo KYC light | | **~$100** | `[S]` |
| Soporte en ventana de venta | agentes-hora por evento | (4 h × 2 agentes × costo/h) / boletas | | **~$200** | `[S]` |
| Devoluciones y disputas | % de transacciones en disputa | 1,5% × (costo pasarela + ops) | | **~$150** | `[S]` |
| **Total variable por boleta (aprox.)** | | | | **~$9.173** | |

### Pasarela — la fila que manda

```
Monto cobrado al fan     = $244.000
Comisión Wompi           = $244.000 × 2,65% + $700 = $7.166
Con IVA 19%              = $7.166 × 1,19           = $8.528  por transacción exitosa
```

`[V]` Estructura tarifaria. `[S]` Que el cobro pase por nosotros por el monto completo
(boleta + cargo + parafiscal). Si el promotor liquidara la boleta por otro riel, el
inductor cambia: hay que recalcular.

> **Hallazgo para la sustentación.** Con este evento tipo, **~90% del costo variable por
> boleta es la pasarela**, no el cómputo. El pico es un problema de **arquitectura y de
> reputación**; en pesos por boleta es casi ruido frente a Wompi. Eso conecta el modelo
> financiero con el bloque 8 (la pasarela como socio crítico) y con el momento estrella 6
> de la demo.

### Cómputo del pico — cota provisional (dueño: Alejo)

```
Pico                     = 3.200 boletas / 10 min ≈ 5,3 boletas/s
Hipótesis de capacidad   = 40 instancias × 3 horas de ventana = 120 instancia-hora
Cota de precio           = ~USD $0,20 / hora ≈ COP $800 / hora   [S]
Costo por evento         ≈ 120 × $800 = $96.000
Costo por boleta vendida ≈ $96.000 / 7.600 ≈ $13   → usamos $50 con margen de seguridad
```

`PENDIENTE: Alejo reemplaza esta cota con la calculadora del proveedor elegido y la meta
del dato 8.`

---

## 3. Costos fijos

| Concepto | Mensual (COP) | Por qué es fijo | Estado |
|---|---|---|---|
| Equipo de desarrollo y operación (4 FTE) | **$42.582.000** | No depende de boletas ese mes | `[S]` — ver desglose |
| Infraestructura base y entornos | **$2.000.000** | Corre haya o no evento | `[S]` / `PENDIENTE` Alejo |
| Cumplimiento (habeas data, PULEP, contable) | **$1.500.000** | Obligación permanente | `[S]` |
| Adquisición de promotores (comercial B2B) | **$5.000.000** | **Reemplaza publicidad masiva** — coherente con bloque 3 del canvas | `[S]` |
| Licencias y herramientas | **$800.000** | | `[S]` |
| **Total fijo mensual** | **~$51.882.000** | | |

### Desglose del equipo

```
Salario bruto medio por FTE     = 4 × SMMLV = 4 × $1.750.905 = $7.003.620     [S]
Costo empleador (× 1,52)        = $10.645.502                                 [S] factor
4 FTE (2 eng + 1 ops/soporte + 1 comercial-técnico)
                                = $42.582.008 / mes
```

`[V]` SMMLV 2026. `[S]` Nivel salarial (4 SMMLV) y tamaño del equipo año 1 — supuesto del
equipo; si se opera solo con los 3 del curso + freelancers, el fijo baja y el punto de
equilibrio también.

> **Por qué la adquisición de promotores va aquí.** Del canvas: el fan no nos busca; llega
> porque el artista anunció. El canal real es el promotor. Este negocio **no tiene línea de
> ads masivos**; tiene línea comercial B2B.

---

## 4. Unit economics — contribución por boleta

| Concepto | Valor por boleta | Estado |
|---|---|---|
| Ingreso por boleta (cargo por servicio) | **$24.000** | `[S]` |
| (+) Ingreso atribuido de reventa por boleta emitida | **$1.120** | `[S]` |
| (−) Costo variable por boleta | **~$9.173** | mixto |
| **= Margen de contribución por boleta** | **~$15.947** | |
| **Margen de contribución (%)** | **~63%** sobre ingreso por boleta (+ reventa atrib.) | |

Sin fuente 2 (reventa = 0):

| Concepto | Valor |
|---|---|
| Margen de contribución | **~$14.827** |
| Margen % | **~62%** sobre los $24.000 |

### Meta de atributo de calidad

| Atributo | Meta | Estado |
|---|---|---|
| Costo de infraestructura por boleta vendida | **≤ COP $200** | `[S]` propuesto — **este número es KR de un OKR** |
| Costo variable total dominado por pasarela | pasarela ≥ 85% del variable | `[V]` con la tarifa actual y el evento tipo |

---

## 5. Punto de equilibrio

```
Boletas/mes para equilibrio  =  costos fijos mensuales ÷ margen de contribución por boleta
                             ≈  $51.882.000 ÷ $15.947  ≈  3.253 boletas/mes

Eventos/mes para equilibrio  =  3.253 ÷ 7.600  ≈  0,43 eventos/mes

Promotores para llegar ahí   ≈  1 promotor con ~1 evento cada dos meses
                              o  1 promotor con 1 evento/mes (holgado)
```

| Indicador | Con reventa (base) | Sin reventa | Estado |
|---|---|---|---|
| Boletas/mes para equilibrio | **~3.250** | **~3.500** | derivado |
| **Eventos/mes para equilibrio** | **~0,43** | **~0,46** | derivado |
| **Promotores mínimos** | **1 activo** | **1 activo** | `[S]` ritmo de eventos |
| Mes en que se alcanza (proyección §6) | **T1** | **T1** | `[S]` |

> **La frase para la sustentación:** *«Con un solo promotor que haga un evento de ~8.000
> aforos al mes, el modelo base no pierde plata.»* Conecta bloque 1 (segmentos) → este
> modelo → OKR de adquisición.

---

## 6. Proyección a 12 meses

Supuestos de ritmo comercial `[S]` — responsable: equipo / Lina (universo PULEP):

| | T1 (meses 1–3) | T2 (4–6) | T3 (7–9) | T4 (10–12) |
|---|---|---|---|---|
| Promotores firmados (fin de trimestre) | 2 | 5 | 10 | 18 |
| Eventos / mes (promedio del trimestre) | 2 | 6 | 12 | 20 |
| Boletas / mes | 15.200 | 45.600 | 91.200 | 152.000 |
| Ingresos (fuentes 1+2+3–5)* | ~$390 M | ~$1.170 M | ~$2.340 M | ~$3.900 M |
| Costos variables | ~$139 M | ~$418 M | ~$836 M | ~$1.394 M |
| Costos fijos | ~$52 M | ~$55 M** | ~$60 M** | ~$68 M** |
| **Resultado mensual aprox.** | **~$200 M** | **~$700 M** | **~$1.440 M** | **~$2.440 M** |

\*Ingreso ≈ boletas × ($24.000 + $1.120) + eventos × (~$1.150.000 de fuentes 3–5).
\*\*El fijo sube al contratar más soporte comercial e infra; no se deja plano.

### Por qué cada salto (no es «crece 30% porque sí»)

| Salto | Razón escrita |
|---|---|
| T1 → T2 | Dos promotores piloto demuestran un evento sin caída; el comercial cierra tres referencias del mismo circuito (Medellín / Bogotá). |
| T2 → T3 | El argumento SIC + datos devueltos abren a promotoras medianas; se activa reventa en todos los eventos. |
| T3 → T4 | Capacidad de pico industrializada (meta ≤ $200/boleta); se firma al menos un recinto con programación propia. |

> Si el corte PULEP de Lina muestra menos eventos alcanzables de lo supuesto, **se baja el
> eje de eventos/mes**, no se inventa penetración. El punto de equilibrio del §5 sigue
> siendo el ancla.

---

## 7. Escenarios y sensibilidad

| Variable | Pesimista | Base | Optimista | Por qué manda |
|---|---|---|---|---|
| *Take rate* | 10% | **12%** | 15% | Ingreso puro; mueve el margen linealmente |
| % boletas revendidas en plataforma | **2%** | **8%** | 15% | Diferenciador; si → 0, el negocio es «boletera con invariante» |
| Eventos al mes (año 1 estable) | 1 | **6** | 15 | Variable comercial, no técnica |
| Costo infra por boleta | $500 | **$50–200** | $30 | Variable de arquitectura; hoy no rompe el BE |

### ¿Se sostiene el pesimista sin fuente 2?

| Caso | Margen/boleta | BE boletas/mes | ¿Viable? |
|---|---|---|---|
| Base (12%, 8% reventa) | ~$15.950 | ~3.250 | Sí |
| Take 10%, reventa 0% | ~$10.954 | ~4.737 | Sí — ~0,62 eventos/mes |
| Take 10%, reventa 0%, evento pequeño (3.000 × 90% = 2.700 bol.) | ~$10.954 | ~4.737 → **~1,75 eventos/mes** | Sí, más justo |
| **Cargo por servicio compartido 50/50 con el promotor** (supuesto S1) | ~$3.947 | ~13.143 → **~1,73 eventos/mes** | Sí — es el peor escenario razonable |

> **Corrección de aritmética (Alejo, 9 sep).** La fila de «take 10%, reventa 0%» decía
> ~$12.800 de margen y ~4.050 boletas de equilibrio. El número correcto es **~$10.954 y
> ~4.737 boletas**: al bajar el take rate también baja el monto que cobra la pasarela
> ($8.401 en vez de $8.528), pero el ingreso cae más de lo que cae el costo. No cambia la
> conclusión —sigue siendo viable— pero el margen del escenario pesimista es **un 14% menor**
> de lo que decía.

**Respuesta explícita:** el negocio **sí se sostiene en pesimista sin fuente 2**, siempre
que se firme al menos un evento mediano al mes. La fuente 2 no es el piso de caja; es el
**techo diferencial** y el argumento frente a Tuboleta.

---

## 8. Supuestos de este modelo

| # | Supuesto | Valor asumido | Impacto si es falso | Cómo se validaría |
|---|---|---|---|---|
| F1 | Aforo tipo 8.000 y precio $200.000 representan el segmento | ver unidad | Si el precio medio < 3 UVT, cae parafiscal del desglose; si aforo es 3.000, sube el BE en eventos | Corte PULEP · Lina |
| F2 | Take rate 12% es aceptable para el promotor/fan | 12% | Cada punto = $2.000/boleta de ingreso | Decisión equipo + comparación contratos |
| F3 | La pasarela cobra sobre el monto total al fan | Wompi 2,65%+$700+IVA | Si solo cobramos sobre el cargo, el % sobre base chica sube el costo relativo | Contrato pasarela · Alejo |
| F4 | 8% de reventa intra-plataforma en estado estable | 8% | Empeora margen ~$1.100/boleta; no tumba el BE | Piloto · métrica post-MVP |
| F5 | Equipo año 1 = 4 FTE a 4 SMMLV con factor 1,52 | $42,6 M/mes | Si son 3 personas del curso sin nómina completa, el BE baja | Decisión del equipo |
| F6 | Meta infra ≤ $200/boleta es alcanzable con elasticidad | $200 | Si el pico obliga a capacidad fija todo el mes, el atributo de calidad falla | Calculadora nube · Alejo · demo estrella 6 |

Estos supuestos alimentan el [componente 1 – premisas](caso-de-negocio.md#1-premisas-supuestos-y-restricciones)
(Alejo): no se duplican allá; se referencian.

---

## Los números que hay que fijar antes del jueves 10

| # | Dato | Dónde se consigue | Dueño | Estado |
|---|---|---|---|---|
| 1 | Eventos por rango de aforo (3.000-40.000) | [PULEP informes](https://pulepapp.mincultura.gov.co/Informespublicos/eventos) | Lina | `PENDIENTE` |
| 2 | Precio promedio de boleta del segmento | PULEP / programación pública | Lina | `PENDIENTE` — hoy usamos `$200.000` `[S]` |
| 3 | Tarifas de pasarela | [Wompi](https://wompi.com/es/co/planes-tarifas/) | Quinnie | ✅ `[V]` 2,65%+$700+IVA |
| 4 | UVT 2026 | DIAN Res. 000238/2025 | Quinnie | ✅ `[V]` $52.374 |
| 5 | SMMLV 2026 + factor | Decreto 1469/2025 + estructura legal | Quinnie | ✅ `[V]` $1.750.905 · factor `[S]` 52% |
| 6 | Precio de cómputo | [AWS Fargate](https://aws.amazon.com/fargate/pricing/) · [Vantage](https://www.vantage.sh/blog/fargate-pricing) | Alejo | ✅ `[V]` USD $0,04048/vCPU-h + $0,004445/GB-h (us-east-1, consultado 9-sep-2026). Cálculo en [canvas bloque 8](canvas.md#8-asociaciones-clave--alejo) |
| 7 | Take rate dentro del 10-15% | **Decisión del equipo** | Los tres | 🟡 **propuesto 12%** — ratificar |
| 8 | Meta costo infra por boleta | **Decisión del equipo** | Alejo | 🟡 **Alejo propone bajarla a ≤ $150 medida bajo carga declarada** — con la cota real (~$9/boleta de cómputo) la de $200 no aprieta. Ratificar el miércoles |

---

## Insumos listos para la sesión de OKR (jueves) — no reemplazan §5

La rúbrica castiga KR que son tareas. Estos son **resultados medibles** que ya salen de
este modelo y de la tesis; la sesión los convierte en Objectives:

| Objetivo tentativo (de la idea) | KR candidatos con cifra | Traza |
|---|---|---|
| O1 · Agotar sin terror | 100% eventos sin exceder aforo · ≤ X% compras fallidas en pico | invariante + demo |
| O2 · Reventa que no robe | ≥ **8%** boletas revendidas *dentro* de plataforma (meta año 1) · split visible al promotor | fuente 2 |
| O3 · El pico no cuesta más de lo que deja | Costo infra/boleta **≤ $200** · margen contribución **≥ 55%** | §4 y dato 8 |

---

## Cómo se conecta con el resto — la cadena que la rúbrica quiere ver

```
Bloque 1 del canvas (segmentos)  →  eventos/mes y boletas por evento
Bloques 6-7-8 (recursos, actividades, socios)  →  costos fijos y variables
Este modelo  →  bloques 5 y 9 del canvas (resumen)
Este modelo  →  KR de los OKR 2 y 3
```

| Costo de este documento | Ancla esperada en el canvas |
|---|---|
| Pasarela | Socio clave (bloque 8) |
| Cómputo pico / base | Recurso: capacidad elástica (bloque 6) |
| Bus de eventos / auditoría | Actividad: custodiar vínculo dinero–boleta (bloque 7) |
| Soporte en ventana | Relación con el fan (bloque 4) |
| Adquisición de promotores | Canal de adquisición (bloque 3) |
| Cumplimiento habeas data | Restricción Ley 1581 → AD-004 |

`PENDIENTE: cuando Alejo cierre 6–7–8, verificar que no quede ningún costo huérfano ni
ningún recurso sin costo.`

---

## Antes de dar esto por cerrado

- [x] Toda línea de costo variable tiene inductor y fórmula
- [x] Costos fijos y variables separados
- [x] Cada fuente de ingreso dice cuánto aporta al total (orden de magnitud)
- [x] La parafiscal aparece en el desglose y **no** en ingresos
- [x] Punto de equilibrio en boletas, eventos y promotores
- [x] Proyección a 12 meses con razón por salto
- [x] Tres escenarios; se responde si aguanta sin fuente 2
- [x] Cifras `[V]` / `[S]` / `PENDIENTE`
- [ ] Ratificar take rate 12% y meta $200/boleta con el equipo
- [ ] Sustituir cota de cómputo por número de Alejo
- [ ] Sustituir aforo/precio por corte PULEP de Lina
- [x] Bloques 5 y 9 del canvas escritos **desde** este documento
