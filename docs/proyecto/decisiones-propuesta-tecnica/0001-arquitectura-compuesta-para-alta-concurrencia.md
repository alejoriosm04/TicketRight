# ADP-001 — Arquitectura híbrida Space-Based y Event-Driven

**Fecha:** 2026-09-14 · **Estado:** 🟣 Antecedente consolidado en
[AD-005](../decisiones/0005-estilo-de-arquitectura.md)
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** estructura

> **Decisión en palabras simples:** Space-Based absorbe la multitud en memoria; PostgreSQL
> decide quién obtiene la boleta; los eventos permiten terminar y reconstruir la venta sin
> mantener todos los componentes bloqueados.

> **Nota de vigencia:** el ADR oficial precisa que Space-Based se activa bajo demanda y no
> permanece dimensionado para el pico durante la operación cotidiana.

## 1. Decisión arquitectónica

TicketRight usará una **arquitectura híbrida Space-Based y Event-Driven, con servicios de
dominio, núcleo transaccional y CQRS**. Cada estilo tendrá una frontera explícita:

1. **Zona Space-Based.** Sala de espera, tokens y disponibilidad aproximada vivirán en
   memoria distribuida y serán procesados por workers paralelos. Esta zona absorbe las
   consultas y accesos masivos, pero no emite boletas.
2. **Núcleo transaccional.** PostgreSQL será la única autoridad para reservar, liberar y
   asignar boletas. El aforo no se coordinará entre varios servicios.
3. **CQRS.** Los comandos —reservar, pagar, emitir, transferir— usarán el modelo
   transaccional. Las consultas —catálogo, búsqueda, mapa y disponibilidad aproximada— usarán
   proyecciones que se actualizan después de cada cambio confirmado.
4. **Zona Event-Driven.** Pago, emisión, conciliación y notificaciones se desacoplarán
   mediante eventos durables cuando no necesiten ocurrir dentro de la misma transacción.
5. **Servicios de dominio de grano grueso.** Admisión, inventario, venta y emisión tendrán
   despliegues distintos solo cuando necesiten escalar o fallar de manera independiente. No
   habrá un microservicio por cada tabla o función.

Vista conceptual:

```text
Fan → Borde → Zona Space-Based → Comando de reserva → Núcleo PostgreSQL
                  │                                        │
                  └→ consultas CQRS                         └→ SAGA Event-Driven
                       Redis/OpenSearch                          pago → emisión → conciliación
```

La clase describe Space-Based como un estilo para concurrencia extrema mediante estado en
memoria y procesamiento paralelo, y Event-Driven como fuerte en escalabilidad y tolerancia
a fallos. CQRS y SAGA no son estilos globales: son patrones dentro de esta composición. La
combinación incremental sigue la idea de arquitecturas compuestas explicada en
[MASA](../../curso/clase-03-04.md#19-arquitecturas-compuestas-masa).

## 2. Identificador único

ADP-001

## 3. Problema o asunto

En la apertura de una venta, muchas personas consultan el evento y el mapa, pero solo una
fracción llega a reservar y pagar. Si todas esas lecturas usan la misma base y los mismos
recursos que el inventario, una búsqueda repetida puede perjudicar el camino que protege el
dinero y el aforo.

Al mismo tiempo, dividir el sistema en muchos microservicios introduce llamadas de red,
consistencia eventual y operación distribuida. El equipo es pequeño y el curso advierte que
microservicios compran escalabilidad a cambio de complejidad y mayor costo. La estructura
debe separar únicamente las capacidades que tengan una razón medible para hacerlo.

Las fuerzas principales son:

- **A-1:** cerrar automáticamente una diferencia dinero-boleta en máximo 15 minutos.
- **A-2 y A-3:** nunca exceder el aforo ni tener dos titulares válidos para una boleta.
- **A-6:** completar al menos 99% de los pagos en curso bajo saturación.
- **A-7:** no superar COP $150 de infraestructura por boleta bajo la carga definida.
- **A-8:** reconstruir el 100% de la historia de una venta.
- **A-9:** disponibilidad mínima de 99,9% durante la ventana de venta.

## 4. Supuestos

- `[S]` La prueba de referencia tendrá 30.000 usuarios en 60 segundos contra 5.000 boletas.
- `[S]` Las consultas a catálogo, mapa y estado de fila serán mucho más numerosas que los
  comandos de reserva y pago. Debe comprobarse con volumetría.
- `[V]` El aforo autorizado no puede excederse. Fuente:
  [`validaciones.md`](../01-caso-de-negocio/validaciones.md#aforo-y-evento-masivo).
- `[V]` El negocio depende de una pasarela externa y de un sistema externo de control de
  acceso. Fuente: [caso de negocio, §1.4](../01-caso-de-negocio/caso-de-negocio-corporativo.md#14-dependencias-principales).
- `[S]` El equipo puede operar pocos servicios de grano grueso, un almacén transaccional,
  proyecciones de lectura y un mecanismo de eventos dentro del plazo del proyecto.

## 5. Alternativas

| # | Alternativa | A favor | En contra |
|---|---|---|---|
| 1 | **Monolito modular con una base relacional** | Menor costo y complejidad; inventario y venta caben en una sola transacción | Consultas y pico comparten despliegue con los comandos; el aislamiento y escalado independiente son menores |
| 2 | **Microservicios sincrónicos con una base por servicio** | Alta autonomía y escalado por dominio | Una venta cruza varias llamadas y datos; exige coordinación distribuida y puede propagar el fallo de la pasarela |
| 3 | **Space-based completo con el estado principal en memoria** | El material de clase lo ubica como fuerte en escalabilidad y rendimiento | Es el estilo más costoso del cuadro comparativo y complica la autoridad durable sobre dinero, aforo y boleta |
| 4 | **Híbrida: Space-Based para el camino caliente, núcleo transaccional y Event-Driven para completar la venta** | Absorbe concurrencia sin entregar a la memoria distribuida la autoridad del aforo; aísla procesos posteriores | Combina estilos, duplica modelos de lectura y exige observabilidad, contratos y reconciliación |

## 6. Decisión

Se propone la **alternativa 4**.

El nombre corto para documentos y sustentación será **“arquitectura híbrida Space-Based y
Event-Driven con núcleo transaccional y CQRS”**. No se llamará “arquitectura fragmentada”
porque la base transaccional no está dividida en shards, ni “puramente reactiva” porque los
comandos de inventario siguen siendo síncronos y transaccionales.

## 7. Justificación

| Necesidad del negocio | Decisión que la responde |
|---|---|
| Miles de consultas y accesos no deben afectar una compra | Space-Based y CQRS los atienden desde memoria y proyecciones separadas |
| El aforo es una restricción legal | Un único núcleo confirma cualquier cambio de inventario |
| La pasarela puede responder tarde o repetido | Una SAGA y eventos durables permiten reanudar y conciliar |
| El pico es breve y conocido | Admisión y consultas escalan aparte del núcleo |
| Una caída parcial no debe tumbar toda la venta | Los servicios de grano grueso aíslan fallos por capacidad |

La elección aplica el criterio de la clase: Space-Based ofrece escalabilidad y rendimiento,
mientras Event-Driven aporta escalabilidad y tolerancia a fallos; ambos sacrifican
simplicidad y costo. El núcleo transaccional limita Space-Based al tramo donde una lectura
aproximada es aceptable y evita trasladar ese sacrificio al aforo y al dinero.

**Qué se sacrifica:**

- Las vistas de consulta pueden quedar atrasadas durante algunos segundos.
- Hay más despliegues, contratos, datos duplicados y puntos de observación.
- El flujo completo ya no cabe en una única transacción; necesita estados intermedios y
  compensaciones.
- El equipo debe aprender a diagnosticar una operación que cruza varios componentes.

## 8. Implicaciones

- La zona Space-Based contiene estado reconstruible; una caída no puede cambiar la propiedad
  durable de una boleta.
- El modelo de comandos es la autoridad; una proyección CQRS nunca confirma inventario.
- El mapa debe advertir que su disponibilidad es orientativa y volver a validar al reservar.
- Los servicios se separarán por capacidad de negocio, siguiendo el particionamiento por
  dominios de la clase, no por capas técnicas como “servicio de controladores”.
- Los contratos y eventos tendrán versión y dueño.
- ADP-003 definirá la SAGA; ADP-004 definirá comandos, proyecciones y expiración; ADP-005
  definirá dónde se despliega cada componente.
- **Deuda asumida:** consistencia eventual de lecturas, operación distribuida y
  reconciliación de proyecciones.
- **Costo de reversión:** alto después de separar almacenes y contratos; medio durante el
  modelamiento.
- **Revisar si:** un monolito modular cumple A-6, A-7 y A-9 con menos costo, o el equipo no
  puede operar la cantidad de componentes propuesta.

---

**Fuentes de clase:** [estilo frente a patrón](../../curso/clase-03-04.md#5-relación-estilo--patrón-style--pattern) ·
[CQRS y API Gateway](../../curso/clase-03-04.md#3-patrones-de-arquitectura) ·
[microservicios](../../curso/clase-03-04.md#13-estilo-microservicios) ·
[event-driven](../../curso/clase-03-04.md#12-estilo-event-driven-basado-en-eventos) ·
[space-based](../../curso/clase-03-04.md#14-estilo-space-based-architecture) ·
[arquitecturas compuestas — MASA](../../curso/clase-03-04.md#19-arquitecturas-compuestas-masa).

**Fuentes del negocio:** [caso de negocio](../01-caso-de-negocio/caso-de-negocio-corporativo.md) ·
[`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[alcance](../01-caso-de-negocio/alcance.md).
