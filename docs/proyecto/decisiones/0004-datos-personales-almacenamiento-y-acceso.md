# AD-004 — Seguridad por capas en el borde, admisión firmada e identidad aislada

**Fecha:** 2026-09-16 · **Estado:** ✅ Aceptado
**Participan:** Alejo, Lina, Quinnie
**Dimensión (rúbrica):** transversal — seguridad y privacidad
**Relacionados:** [AD-005](0005-estilo-de-arquitectura.md) ·
[AD-006](0006-escalado-programado-por-ventana-de-venta.md) ·
[AD-002](0002-mensajeria-del-bus-de-eventos.md)

> **Decisión en palabras simples:** las solicitudes maliciosas se detendrán antes de consumir
> el sistema de compra; la sala de espera entregará un permiso corto y verificable para
> entrar al checkout; y los servicios de inventario nunca recibirán nombres, documentos ni
> datos de tarjeta que no necesitan.

## 1. Decisión arquitectónica

TicketRight aplicará **defensa en profundidad** con controles complementarios en el borde,
la identidad, la admisión y los datos. Ningún control aislado —IP, CAPTCHA, JWT o WAF— se
considerará suficiente.

### 1. Borde público

- Una **CDN** servirá frontend, imágenes y mapas estáticos versionados sin llegar a los
  servicios dinámicos.
- Un **Web Application Firewall (WAF)** aplicará reglas administradas y propias contra
  inyección, XSS, abuso de protocolos y patrones HTTP anómalos.
- Un **API Gateway** será la única entrada a las APIs públicas. Terminará TLS, validará
  tamaño y forma básica de solicitudes, aplicará cuotas y enrutará solo operaciones
  permitidas.
- El *rate limiting* usará **token bucket** con límites diferentes para catálogo, fila y
  checkout. La identidad autenticada y el token de admisión serán señales principales; IP,
  dispositivo y reputación serán señales auxiliares para no castigar a todos los usuarios
  de una red compartida.
- La detección de automatización asignará riesgo a partir de patrones de navegación,
  velocidad, reutilización de sesión y reputación. Riesgo medio recibe un reto o menor tasa;
  riesgo alto y comprobado se bloquea. Ninguna huella por sí sola produce un bloqueo
  permanente.

La implementación candidata es CloudFront + AWS WAF/Bot Control + API Gateway o Kong. La
arquitectura no supone que un WAF elimine todos los bots: reduce tráfico conocido y entrega
señales para decisiones posteriores.

### 2. Autenticación y autorización

- La identidad del usuario se federará mediante **OpenID Connect/OAuth 2.0** con un proveedor
  especializado. TicketRight validará tokens de acceso cortos y aplicará autorización por
  rol y finalidad; no construirá almacenamiento propio de contraseñas.
- La sala de espera emitirá un **token de admisión JWT firmado**, distinto del token de
  identidad. Incluirá `sub` opaco, `event_id`, `aud`, `iat`, `exp`, `jti` y nivel de
  autorización. Tendrá vigencia corta —`[S]` tres minutos—; su `jti` abrirá una sola sesión
  de checkout y los reintentos de esa misma sesión serán idempotentes.
- El gateway validará firma, emisor, audiencia, expiración y evento. El núcleo volverá a
  validar autorización; la existencia del JWT no garantiza disponibilidad de inventario.
- Servicios internos usarán identidad de servicio, TLS y permisos mínimos. Secretos y
  llaves vivirán en un gestor dedicado y rotarán; nunca estarán en código o archivos
  entregados.

### 3. Aislamiento de datos personales y pagos

- Un contexto de **Identidad y Consentimiento** tendrá almacén y credenciales propios. El
  resto del sistema usará un identificador opaco; inventario, Kafka, Redis, OpenSearch,
  métricas y trazas no transportarán nombre, documento, correo o teléfono.
- Los datos se cifrarán en tránsito y en reposo, y los campos especialmente identificables
  usarán llaves administradas fuera de la base. Cada acceso declarará rol y finalidad y
  quedará auditado.
- Desarrollo y pruebas usarán datos sintéticos. Solo producción tendrá datos reales y su
  acceso humano será nominal, temporal y registrado.
- TicketRight no almacenará PAN, CVV ni credenciales de tarjeta: el navegador se integrará
  con la tokenización de la pasarela y el sistema conservará solo referencias de pago.
- La transferencia de datos al promotor dependerá de un consentimiento específico y
  vigente. `PENDIENTE: validar con asesor jurídico la interpretación de Responsable,
  Encargado, finalidades y retención conforme a la Ley 1581.`

[AD-006](0006-escalado-programado-por-ventana-de-venta.md) decide el orden y la cantidad de
usuarios admitidos. Este ADR decide **qué tráfico es confiable, cómo se autoriza y qué datos
puede ver cada componente**.

### Comportamiento según la demanda

Los controles de identidad, privacidad, cifrado y autorización permanecen iguales en todos
los perfiles; bajar la demanda no reduce la seguridad.

- En el perfil **cotidiano**, CDN, WAF y gateway siguen activos con límites acordes al
  tráfico normal. El servicio de admisión valida la política y emite el JWT inmediatamente,
  sin mostrar una fila al usuario.
- En **preparación**, se cargan reglas específicas del evento, listas de preventa, claves,
  límites y capacidad antifraude; se comprueba la rotación y validación de tokens.
- En **pico**, se endurecen límites de rutas exploratorias, se habilitan retos por riesgo y
  el token solo se emite cuando [AD-006](0006-escalado-programado-por-ventana-de-venta.md)
  autoriza el turno.
- En **recuperación**, los tokens no usados expiran, se conservan auditorías y se vuelven a
  los límites cotidianos únicamente después de cerrar la ventana.

El contrato del token es el mismo. Cambia el momento de emisión: inmediato en demanda
normal y posterior al turno en alta demanda. Esto evita mantener dos mecanismos de
autorización y permite activar la fila sin cambiar el checkout.

## 2. Identificador único

AD-004

## 3. Problema o asunto

En una venta masiva compiten fans, refrescos involuntarios, scrapers, bots de reventa y
ataques HTTP. Si se detectan dentro del servicio de compra, ya consumieron conexiones,
CPU y capacidad del inventario. Si se bloquea agresivamente por IP, se puede excluir a
familias, universidades o redes móviles completas y romper la equidad que el negocio
promete.

La seguridad también abarca el dato. La boleta puede ser nominal y la propuesta de valor
incluye información **autorizada** para el promotor. Un nombre en Kafka, una copia de
producción en desarrollo o un documento en un log crea exposición legal y dificulta ejercer
los derechos del titular. Centralizar todo simplifica las consultas, pero amplía el impacto
de una credencial comprometida.

Las fuerzas son:

- **Equidad de la fila:** el 100% de las admisiones debe seguir una política publicada y
  poder reconstruirse; refrescar o automatizar no puede
  comprar un mejor turno.
- **Degradación y disponibilidad:** el tráfico abusivo no puede quitar capacidad a pagos ya
  iniciados —al menos 99% debe terminar bajo saturación— ni reducir la disponibilidad por
  debajo de 99,9% durante la ventana de venta.
- **Costo:** servir archivos o rechazar bots desde cómputo dinámico pone en riesgo el límite
  de COP $150 de infraestructura por boleta vendida.
- **Trazabilidad:** la auditoría debe reconstruir el 100% de las ventas durante 24 meses sin
  exponer datos personales en cada
  componente.
- **A-11:** cero operaciones aceptadas con credenciales o tokens inválidos, vencidos o
  repetidos; datos personales cifrados en tránsito y reposo, accesos privilegiados auditados
  al 100% y cero PAN o CVV de tarjetas almacenados.
- **Ley 1581 `[V]`:** tratamiento y transferencia requieren autorización y medidas de
  protección; una suspensión del tratamiento impediría operar la boletería.
- **Conversión y accesibilidad:** los falsos positivos también son fallos del negocio.

La decisión combina controles delegados con autorización propia, cifrado, aislamiento y
acceso auditado. Además, evita que una solicitud hostil llegue a los componentes que
protegen los datos y las operaciones críticas.

## 4. Supuestos

- `[S]` Una parte relevante de la demanda será automatizada o repetida; no existe una
  medición propia de la proporción de bots.
- `[S]` Un límite inicial de cinco solicitudes por segundo por usuario autenticado permite
  el flujo normal. Se ajustará mediante pruebas y no se aplicará igual a todos los endpoints.
- `[S]` La mayoría de las ventas cotidianas podrá emitir el token sin espera, pero toda
  admisión seguirá dejando una decisión auditable.
- `[S]` Tres minutos son suficientes para canjear el token de admisión. El checkout tendrá
  su propia sesión y no dependerá de prolongar ese JWT.
- `[S]` Nombre, documento, correo y teléfono son el mínimo necesario para una boleta nominal.
  Cada dato adicional requerirá finalidad documentada.
- `[V]` La Ley 1581 exige autorización previa e informada y distingue responsabilidades en
  el tratamiento. Fuente:
  [`validaciones.md`](../01-caso-de-negocio/validaciones.md#datos-personales-en-boleta-nominal).
- `[S]` TicketRight será Responsable para sus finalidades y el promotor lo será para las
  suyas; la transferencia requerirá autorización específica. **Es interpretación del
  equipo, no concepto jurídico.**
- `[S]` Un proveedor administrado de identidad, WAF y llaves resulta menos riesgoso que
  construir esas capacidades, pero su costo debe compararse con el límite de COP $150 por
  boleta vendida y con la dependencia del proveedor.

## 5. Alternativas

Se comparan **reducción de abuso antes del cómputo, falsos positivos, privacidad, costo,
trazabilidad y capacidad del equipo**.

| # | Alternativa | A favor | En contra y sacrificio |
|---|---|---|---|
| 1 | **Controles dentro de cada servicio y datos personales en la misma base de ventas** | Menor infraestructura y consultas directas | El abuso consume recursos antes de bloquearse; reglas duplicadas; una credencial o copia expone inventario, pagos e identidad juntos |
| 2 | **CDN/WAF y rate limiting solo por IP; identidad compartida con ventas** | Fácil de implementar, detiene ataques conocidos y reduce archivos dinámicos | IP no identifica una persona; bots rotan direcciones y usuarios legítimos comparten una. No limita exposición de datos ni asegura finalidad |
| 3 | **Delegar completamente borde, fila e identidad a un proveedor especializado** | Capacidades maduras de bots, identidad y escalado; menos desarrollo propio | Mayor costo y dependencia en dos rutas críticas. Señales personales quedan en un tercero y la política de equidad puede volverse opaca |
| 4 | **Defensa por capas en el borde + identidad federada + JWT de admisión + almacén personal aislado** | Detiene abuso temprano, combina señales, reduce privilegios y evita propagar datos; cada decisión queda auditable | Integra varios controles, puede generar falsos positivos, exige gestión de llaves/consentimientos y conserva dependencia parcial de proveedores |

## 6. Decisión

Adoptaremos la **alternativa 4**.

La seguridad se aplicará por riesgo progresivo y no mediante bloqueo binario por IP. La
autenticación y las credenciales se delegarán a un proveedor OIDC; TicketRight conservará la
autorización de negocio, los consentimientos y la auditoría. El token de admisión será una
credencial separada y de alcance mínimo.

La detección avanzada de bots es parte del diseño objetivo, pero podrá implementarse en el
MVP con reglas, rate limiting y retos antes de contratar un producto especializado. Esta
reducción de alcance deberá quedar explícita y medirse; no se fingirá capacidad de machine
learning propia.

## 7. Justificación

| Necesidad | Respuesta de la decisión |
|---|---|
| **Fila conforme y reconstruible en el 100% de los turnos** | El turno y el token firmado pesan más que el número de refrescos; las decisiones de riesgo dejan motivo auditable |
| **≥ 99% de pagos iniciados finalizados y ≥ 99,9% de disponibilidad en la ventana** | CDN, WAF y gateway absorben tráfico antes de que compita con inventario y pago |
| **Infraestructura ≤ COP $150 por boleta vendida** | Los estáticos se sirven en el borde y las solicitudes abusivas no escalan servicios de negocio |
| **Cero tokens inválidos aceptados y 100% de datos sensibles protegidos** | Firma, expiración, uso lógico único, cifrado y auditoría limitan el acceso a operaciones y datos |
| **Privacidad y Ley 1581** | El dato personal existe en una frontera con credenciales, finalidad y auditoría propias; los demás contextos no pueden filtrarlo porque no lo poseen |
| **Seguridad del pago** | La tokenización evita almacenar datos de tarjeta y reduce el alcance de una intrusión |
| **A-11 · seguridad y privacidad** | El gateway y el núcleo validan firma, emisor, audiencia y expiración antes de autorizar; los datos personales viven cifrados en un contexto aislado con acceso auditado y sin PAN/CVV |
| **Operabilidad** | Identidad, WAF y llaves usan capacidades especializadas; el equipo se concentra en políticas de negocio y evidencia |
| **Dos perfiles, una seguridad** | El mismo token y las mismas reglas de identidad protegen checkout; solo cambia si se emite inmediatamente o después de la fila |

No se selecciona un único “producto antibot” como solución mágica. La defensa por capas
acepta que cada señal falla de una manera distinta: IP comparte usuarios, comportamiento
puede confundir accesibilidad, JWT puede robarse y WAF reconoce patrones, no intenciones. La
combinación reduce la probabilidad de que una falla individual comprometa la venta.

**Precio aceptado:** algunos fans legítimos enfrentarán un reto o una espera adicional, y
los cruces entre ventas e identidad ya no serán un `JOIN`. Se acepta esa fricción porque el
daño de permitir acaparamiento, exponer datos o dejar que un ataque derribe pagos es mayor;
la tasa de falsos positivos será un criterio de revisión, no una consecuencia invisible.

## 8. Implicaciones

### Consecuencias positivas

- El tráfico estático y hostil se detiene fuera del núcleo de negocio.
- Un token robado tiene vigencia, audiencia y alcance limitados.
- Inventario, eventos y observabilidad trabajan con identificadores opacos.
- Una falla del servicio de identidad después de autenticar no obliga a cancelar un pago en
  curso, pues el flujo conserva la referencia opaca necesaria.

### Consecuencias negativas, riesgos y deuda asumida

- La integración de CDN, WAF, gateway, OIDC, llaves y consentimiento agrega configuración y
  puntos de fallo.
- Los modelos de riesgo pueden discriminar redes compartidas o herramientas de accesibilidad.
- Separar identidad elimina consultas directas y exige APIs autorizadas y datos sintéticos.
- La dependencia de capacidades administradas puede aumentar costo y dificultar migración.
- Se asume deuda en pruebas de seguridad automatizadas, revisión de reglas y proceso de
  respuesta a falsos positivos.
- Mantener WAF, identidad y gestión de llaves fuera del pico tiene costo base, pero apagarlos
  crearía una ruta cotidiana menos segura y dos modelos de autorización.

### Reglas y evidencias obligatorias

- Ningún log, evento, traza o métrica contendrá documento, nombre, correo, teléfono, token
  completo o dato de tarjeta.
- Producción tendrá credenciales y redes separadas; desarrollo y pruebas usarán datos
  sintéticos.
- Cada acceso humano a datos personales será nominal, temporal, mínimo y auditado.
- Se medirán solicitudes bloqueadas, retos superados, falsos positivos, tokens reutilizados,
  latencia del gateway y tráfico que alcanza checkout.
- Se probarán token vencido, firma inválida, repetición, rotación de llaves, bot distribuido,
  usuarios detrás de NAT, caída del proveedor de identidad y aparición accidental de datos
  sensibles en logs.
- Se probará que un token emitido en paso directo y otro emitido después de la fila producen
  exactamente las mismas validaciones en checkout.
- La política de retención personal y el texto de consentimiento quedan
  `PENDIENTE` de validación jurídica; no se inventarán en el ADR.

**Costo de reversión:** medio si se usan OIDC, JWT y reglas portables; alto si la detección
queda acoplada a señales propietarias o los datos se mezclan después con otros almacenes.
**Revisar si:** los falsos positivos perjudican la conversión; el costo base cotidiano
incumple el modelo financiero; una evaluación jurídica cambia finalidades o retención; o
una prueba demuestra que el token puede reutilizarse para acaparar inventario.

---

**Fuentes:** [`atributos-de-calidad.md`](../01-caso-de-negocio/atributos-de-calidad.md) ·
[datos personales y boleta nominal](../01-caso-de-negocio/validaciones.md#datos-personales-en-boleta-nominal) ·
[caso de negocio](../01-caso-de-negocio/caso-de-negocio-corporativo.md) ·
[seguridad de implementación en la rúbrica](../02-modelamiento/rubrica.md#4-arquitectura-de-implementación) ·
[rúbrica ADR](../02-modelamiento/rubrica.md#2-adr--architectural-decision-record).
