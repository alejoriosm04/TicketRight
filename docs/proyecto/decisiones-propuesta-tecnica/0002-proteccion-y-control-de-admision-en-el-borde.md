# ADP-002 — Protección en el borde y zona Space-Based de admisión

**Fecha:** 2026-09-14 · **Estado:** 🟣 Antecedente consolidado en
[AD-004](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) y
[AD-006](../decisiones/0006-escalado-programado-por-ventana-de-venta.md)
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** transversal

> **Decisión en palabras simples:** no todas las personas que llegan al sitio pueden entrar
> a comprar al mismo tiempo. El borde filtra y la sala de espera deja pasar únicamente la
> cantidad que el checkout puede atender sin poner en riesgo pagos ya iniciados.

> **Nota de vigencia:** en demanda cotidiana la admisión emite el mismo token sin formar una
> fila; la zona Space-Based completa se activa solo para picos programados o de emergencia.

## 1. Decisión arquitectónica

Se propone combinar **protección en el borde** con una **zona Space-Based de control de
admisión**. La CDN, el firewall y el gateway forman el borde. Detrás de ellos, la sala de
espera cumple la definición Space-Based de clase porque mantiene estado temporal en memoria
distribuida y usa workers paralelos para absorber concurrencia sin llevarla al núcleo
transaccional:

1. Una **CDN** sirve frontend, imágenes y mapas estáticos sin consultar la aplicación.
2. Un **firewall de aplicaciones** bloquea patrones conocidos de ataque.
3. Un mecanismo de **detección de automatización** asigna riesgo y aplica retos o bloqueo a
   comportamientos compatibles con bots.
4. Un **API gateway** aplica un *token bucket* por identidad y, como señal secundaria, por
   IP. Este algoritmo permite ráfagas pequeñas, pero limita la tasa sostenida.
5. La **sala de espera** conserva el orden definido por la política de A-4. Un worker deja
   salir usuarios a una tasa controlada —comportamiento equivalente a un *leaky bucket* a
   escala del sistema— y entrega un token de admisión firmado, corto y ligado al evento y
   al usuario.

Redis Cluster mantiene el estado temporal de la fila y los tokens; varios workers sin
estado procesan particiones o grupos de usuarios. Si esta zona se degrada, puede detener
nuevas admisiones sin interrumpir reservas y pagos que ya llegaron al núcleo.

Para cumplir A-4, cada ingreso, posición asignada, admisión, rechazo y expiración dejará un
registro durable fuera de Redis. La memoria distribuida sostiene la operación rápida; el
registro durable permite reconstruir la fila después de una caída.

Token bucket y leaky bucket no son sinónimos en este diseño: el primero limita solicitudes
individuales en el gateway; el segundo describe cómo la sala amortigua una llegada abrupta
y alimenta checkout a una tasa estable. El límite inicial de cinco solicitudes por segundo,
la tasa de admisión y una vigencia de tres minutos se mantienen como `[S]` hasta probar el
flujo real.

Implementación candidata: CloudFront, AWS WAF, un servicio especializado de bot management
y API Gateway o Kong. La arquitectura de referencia solo mostrará las capacidades.

## 2. Identificador único

ADP-002

## 3. Problema o asunto

En una venta de alta demanda, solicitudes legítimas, refrescos repetidos, scrapers, bots de
reventa y ataques HTTP llegan al mismo punto de entrada. Si todos alcanzan checkout, consumen
la capacidad que A-6 reserva para pagos iniciados y pueden alterar la política de fila de
A-4.

Bloquear agresivamente protege el sistema, pero puede excluir fans reales detrás de NAT,
redes móviles o herramientas de accesibilidad. Las huellas de navegador también introducen
tratamiento de datos y riesgo de privacidad. La decisión debe equilibrar seguridad,
equidad, conversión y costo.

El API Gateway aparece en el material de clase como patrón de entrada a microservicios. La
sala de espera y los algoritmos de tasa son tácticas elegidas porque A-4 y A-6 las
necesitan, no porque la clase obligue a usarlas.

## 4. Supuestos

- `[S]` Una parte relevante del tráfico de una venta masiva será automatizada o repetida.
  El caso de negocio no mide esa proporción.
- `[S]` Un límite inicial de cinco solicitudes por segundo por usuario permite completar el
  flujo normal. Debe validarse con el prototipo.
- `[S]` IP no identifica de forma confiable a una persona; se usará solo como una de varias
  señales.
- `[V]` A-4 exige que el 100% de los turnos siga una política publicada y reconstruible.
  Fuente: [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md).
- `[S]` La detección avanzada de bots se modelará en la Entrega 2, pero puede quedar fuera
  de la implementación de la Entrega 3 por alcance.

## 5. Alternativas

| # | Alternativa | A favor | En contra |
|---|---|---|---|
| 1 | **Sin capa especializada:** validaciones dentro de cada servicio | Menos infraestructura y proveedores | El tráfico indeseado ya consumió conexiones y cómputo; las reglas quedan duplicadas e inconsistentes |
| 2 | **CDN, WAF y rate limiting por IP** | Es simple, barato y bloquea ataques conocidos | Una IP puede representar cientos de usuarios y un bot puede rotar direcciones; aumenta falsos positivos y evasión |
| 3 | **Servicio administrado de sala de espera y bots** | Reduce desarrollo y transfiere parte de la operación al proveedor | Mayor dependencia, costo y tratamiento de señales de comportamiento por un tercero |
| 4 | **Zona Space-Based con defensa por capas, estado distribuido y token de admisión** | Absorbe el pico en memoria, combina señales y alimenta checkout a una tasa controlada | Más integración, estado distribuido y observabilidad; los modelos de riesgo pueden discriminar o equivocarse |

## 6. Decisión

Se propone la **alternativa 4**. Space-Based queda limitado a fila, tokens y admisión; no
reserva ni vende inventario. Los bloqueos permanentes no dependerán de una sola señal.
Los casos de riesgo intermedio recibirán un reto o una reducción de tasa antes de ser
rechazados.

## 7. Justificación

| Criterio | Respuesta de la alternativa elegida |
|---|---|
| **A-4 · equidad** | La admisión depende de una política registrada, no de quién refresca más veces |
| **A-6 · prioridad** | El borde absorbe tráfico que no debe competir con un pago en curso |
| **A-7 · costo** | Caché y filtrado evitan escalar servicios dinámicos para servir archivos o rechazar ataques |
| **Seguridad** | Combina firmas, límites, identidad y comportamiento en lugar de confiar en una sola barrera |
| **Aislamiento** | La zona puede cerrar la admisión sin detener pagos que ya están en curso |

**Qué se sacrifica:** conversión por falsos positivos, privacidad por las señales de riesgo,
complejidad de soporte y dependencia de un proveedor si se usa detección administrada.

## 8. Implicaciones

- El frontend y los mapas de estadio deberán publicarse como artefactos versionados y
  cacheables; la disponibilidad de una silla nunca se servirá como dato estático definitivo.
- El token incluirá evento, usuario, instante de admisión, expiración y un identificador
  único; no contendrá datos personales innecesarios.
- El gateway validará firma, expiración, audiencia y reutilización del token.
- Las reglas de rate limiting se medirán por usuario, token e IP, con límites diferentes
  para fila, consulta y checkout.
- La tasa de salida de la fila se calculará desde la capacidad medida del checkout; no se
  fijará copiando una cifra de otra plataforma.
- Se registrarán motivos de bloqueo y tasas de falsos positivos sin guardar huellas
  personales en logs técnicos.
- AD-004 oficial sigue gobernando el tratamiento de datos personales.
- El estado de Redis debe poder reconstruirse desde la secuencia de fila y las reglas de
  admisión; no será una fuente irremplazable.
- **Costo de reversión:** medio si las reglas son portables; alto si la detección queda
  acoplada a señales propietarias del proveedor.
- **Revisar si:** los falsos positivos reducen KR2.2, el costo rompe A-7 o la evaluación de
  privacidad prohíbe alguna señal.

---

**Fuentes:** [alcance y actores](../01-caso-de-negocio/alcance.md#3-contexto-y-actores) ·
[`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[AD-004 oficial](../decisiones/0004-datos-personales-almacenamiento-y-acceso.md) ·
[patrones de arquitectura y API Gateway](../../curso/clase-03-04.md#3-patrones-de-arquitectura) ·
[microservicios detrás de un gateway](../../curso/clase-03-04.md#13-estilo-microservicios) ·
[space-based para concurrencia extrema](../../curso/clase-03-04.md#14-estilo-space-based-architecture) ·
[atributos frente a tácticas](../../curso/fundamentos-arquitectura.md#5-atributos-de-calidad-y-tácticas).
