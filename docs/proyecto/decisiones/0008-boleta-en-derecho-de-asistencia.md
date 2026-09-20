# AD-008 — Boleta en Derecho de asistencia y emisión por puerto

**Fecha:** 2026-09-20 · **Estado:** ✅ Aceptado — decidido por el equipo al iniciar la Entrega 3
**Dimensión:** estructura — frontera entre contextos; **no cuenta entre las cinco decisiones arquitectónicas**
**Relacionados:** [AD-002](0002-mensajeria-del-bus-de-eventos.md) ·
[AD-004](0004-datos-personales-almacenamiento-y-acceso.md) ·
[AD-007](0007-stack-de-implementacion.md) · [AD-005](0005-estilo-de-arquitectura.md)

> **Decisión en palabras simples:** `Boleta`, su titularidad, su transferencia y su reventa
> viven en el contexto **Derecho de asistencia** (`@ticketright/entitlements`), como manda el
> [modelo de dominio](../02-modelamiento/modelo-de-dominio.md#contextos-acotados). El orquestador de compras
> las emite a través del puerto **`EmisorDeBoletas`**, con un DTO de emisión, en vez de
> importar el agregado de otro contexto.

## 1. Decisión arquitectónica

El agregado `Boleta` y todo su ciclo de vida —emisión, titularidad, transferencia, reventa y
anulación— se implementan en `@ticketright/entitlements`. El servicio de ventas no conoce ese
agregado: su orquestador publica una intención de emisión por el puerto `EmisorDeBoletas`,
cuyo contrato (`DatosDeEmision`, `BoletaEmitida`) vive en `@ticketright/shared-kernel` para
que los dos contextos dependan de un contrato compartido y no uno del otro.

Los puertos del diagrama se ajustan en consecuencia:

- `RepositorioDeBoletas` del servicio de ventas deja de ser un repositorio del agregado y
  pasa a ser el puerto de emisión `EmisorDeBoletas` (patrón *anti-corruption*): el
  orquestador delega, no persiste la boleta.
- El resultado de la emisión se refleja en los datos de la SAGA (`CompraEnCurso`) para que el
  reintento y la discrepancia `cobroSinBoleta` sigan siendo verificables.
- Los repositorios de pagos y compras ganan lecturas por reserva (`porReserva`) para que el
  proceso de expiración de [AD-003](0003-consistencia-por-tipo-de-inventario.md) pueda
  distinguir una reserva abandonada de una con pago confirmado.

## 2. Identificador único

AD-008

## 3. Problema o asunto

El [diagrama de clases](../02-modelamiento/diagrama-de-clases.md) del caso principal dibuja
`Boleta` y `RepositorioDeBoletas` dentro del servicio de ventas, porque la emisión ocurre en
la misma transacción lógica que la venta de inventario. El
[modelo de dominio](../02-modelamiento/modelo-de-dominio.md#contextos-acotados) asigna `Boleta` al contexto
**Derecho de asistencia**, y el [plan de pruebas](../02-modelamiento/plan-de-pruebas.md)
ubica sus casos (UT-14 a UT-16) en ese contexto. Implementar el agregado en ventas dejaría el
contexto de boletas vacío y duplicaría el modelo; implementarlo en derechos sin un contrato
claro obligaría a importar tipos entre paquetes, prohibido por la regla de dependencia.

## 4. Supuestos

- `[S]` La emisión puede resolverse con un contrato de datos (no con el agregado completo);
  si el orquestador necesitara leer el estado de la boleta, se evaluará una consulta de
  lectura por evento, no un repositorio compartido.
- `[V]` Los contextos acotados y sus conceptos son los del modelo aprobado en la Entrega 2.
  Fuente: [`modelo-de-dominio.md`](../02-modelamiento/modelo-de-dominio.md#contextos-acotados).
- `PENDIENTE: regenerar los artefactos del diagrama de clases (JSON y HTML) con el ajuste de
  puertos de este ADR; el Markdown ya trae la nota.`

## 5. Alternativas

| # | Alternativa | A favor | En contra y sacrificio |
|---|---|---|---|
| 1 | **Boleta en entitlements y emisión por puerto** | Respeta el modelo y el plan de pruebas; cada contexto se despliega y evoluciona solo; el fallo de emisión se simula en el doble del puerto (UT-12/13) | Obliga a un contrato de emisión compartido y a un DTO; la consistencia entre vender inventario y emitir exige una unidad de trabajo posterior (outbox/SAGA) |
| 2 | **Todo el ciclo de la boleta en el servicio de ventas** | Es literal al diagrama de clases y evita el contrato | Contradice el modelo y el plan; concentra dos contextos en un servicio y hace que ventas dependa de reglas de titularidad y reventa que no le pertenecen |
| 3 | **Boleta en shared-kernel** | Accesible a todos | Convierte el kernel en un cajón de sastre y rompe la propiedad del agregado; descartada |

## 6. Decisión

Adoptaremos la **alternativa 1**. El contrato de emisión viaja en `shared-kernel`; el puerto
lo declara el servicio de ventas y lo realiza Derecho de asistencia. La venta de inventario
sigue siendo autoridad de `Localidad` en el servicio de ventas durante la compra, tal como lo
ubica el plan de pruebas.

## 7. Justificación

| Necesidad | Respuesta de la decisión |
|---|---|
| **A-3 · unicidad de la titularidad** | El agregado que la custodia es el único que la cambia; ninguna otra capa puede saltarse R7 y R8 |
| **A-12 · modificabilidad** | Cambiar las reglas de reventa o transferencia no toca ventas, inventario ni pago |
| **A-1 · dinero–boleta** | El fallo de emisión es un resultado observable del puerto; el orquestador abre `cobroSinBoleta` y lo cierra al recuperarse |
| **Defensa** | Cada contexto conserva sus reglas y la frontera es explicable con el modelo aprobado |

**Precio aceptado:** una llamada entre contextos con un contrato de datos y el trabajo de
mantenerlos versionados; si el contrato cambia, cambian los dos lados.

## 8. Implicaciones

### Consecuencias positivas

- El código de cada contexto tiene una sola responsabilidad y se prueba solo.
- Los casos UT-14 a UT-16 viven junto al agregado que ejercitan.
- El doble de emisión permite probar los fallos de UT-12 y UT-13 sin infraestructura.

### Consecuencias negativas, riesgos y deuda asumida

- Los artefactos del diagrama de clases (JSON y HTML) quedan desalineados en la fila de
  `RepositorioDeBoletas` hasta regenerarlos.
- La consistencia entre venta de inventario y emisión depende de la unidad de trabajo del
  adaptador (transacción local, outbox), que se implementa en la Entrega 3.
- El contrato compartido debe versionarse si cambia la forma de la emisión.

**Costo de reversión:** medio; mover el agregado de paquete es mecánico mientras no haya
adaptadores reales.
**Revisar si:** el orquestador necesita leer la boleta para decidir algo además de emitir, o
si la llamada entre contextos se vuelve el cuello de botella del pago.

---

**Fuentes:** [modelo de dominio](../02-modelamiento/modelo-de-dominio.md#contextos-acotados) ·
[diagrama de clases](../02-modelamiento/diagrama-de-clases.md#puertos) ·
[plan de pruebas](../02-modelamiento/plan-de-pruebas.md) ·
[atributos de calidad](../01-caso-de-negocio/atributos-de-calidad.md).
