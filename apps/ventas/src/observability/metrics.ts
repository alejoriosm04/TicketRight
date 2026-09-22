import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";

/**
 * Registro central de métricas de TicketRight. Las variables usan los nombres exactos
 * fijados en el diseño de observabilidad (docs/proyecto/02-modelamiento/observabilidad.md)
 * y en la tabla de las seis métricas de la Entrega 3
 * (docs/proyecto/03-implementacion/README.md#2-observabilidad--20).
 *
 * La instrumentación vive en la capa de composición (apps/ventas) para no acoplar el
 * dominio hexagonal a Prometheus: el dominio publica hechos, la app los mide.
 */
export const registro = new Registry();

registro.setDefaultLabels({ service: "ventas", service_version: "0.0.0" });

// Métricas técnicas de proceso: CPU, memoria, event loop, GC (A-6 · A-9).
collectDefaultMetrics({
  register: registro,
  prefix: "ticketright_",
});

// --- Métricas de negocio e integridad ---------------------------------------

/** Valor acumulado de ventas confirmadas, por moneda. OKR-3 · A-1. */
export const ventasConfirmadas = new Counter({
  name: "ticketright_sales_amount_total",
  help: "Valor acumulado en centavos de pagos confirmados, separado por moneda",
  labelNames: ["currency"] as const,
  registers: [registro],
});

/**
 * Desglose del dinero confirmado: cuánto es valor nominal (va a la promotora), cuánto
 * cargo por servicio (ingreso de la ticketera) y cuánto contribución parafiscal (impuesto).
 * Es la vista del acuerdo con la promotora y de la liquidación. OKR-3.
 */
export const desgloseDeVentas = new Counter({
  name: "ticketright_sales_breakdown_total",
  help: "Dinero confirmado en centavos por componente (nominal, cargo de servicio, parafiscal)",
  labelNames: ["component"] as const,
  registers: [registro],
});

/** Boletas vendidas (confirmadas), por localidad. Complementa el aforo. OKR-3. */
export const boletasVendidas = new Counter({
  name: "ticketright_tickets_sold_total",
  help: "Boletas efectivamente vendidas (pago confirmado), por localidad",
  labelNames: ["localidad"] as const,
  registers: [registro],
});

/** Discrepancias abiertas entre pago y boleta (dinero sin derecho resuelto). A-1. */
export const discrepanciasAbiertas = new Gauge({
  name: "ticketright_open_discrepancies",
  help: "Pagos confirmados sin boleta emitida ni compensación completada",
  registers: [registro],
});

/** Antigüedad, en segundos, de la discrepancia abierta más antigua. Meta ≤ 900 s. A-1. */
export const edadDiscrepanciaMasAntigua = new Gauge({
  name: "ticketright_oldest_discrepancy_age_seconds",
  help: "Segundos desde la confirmación del pago pendiente más antiguo; cero si no hay discrepancias",
  registers: [registro],
});

/**
 * Sobreventas detectadas: unidades comprometidas (reservas vivas + boletas válidas) por
 * encima del aforo autorizado. Lo alimenta el colector desde las tablas, no desde el
 * contador de la localidad. Meta cero. A-2.
 */
export const sobreventas = new Counter({
  name: "ticketright_oversell_total",
  help: "Unidades comprometidas (reservas vivas + boletas válidas) por encima del aforo autorizado",
  labelNames: ["localidad"] as const,
  registers: [registro],
});

/** Conflictos de titularidad: una boleta con más de un derecho vigente. Meta cero. A-3. */
export const titularidadesInvalidas = new Counter({
  name: "ticketright_invalid_ownership_total",
  help: "Casos en que una boleta aparece con más de una titularidad activa al mismo tiempo",
  registers: [registro],
});

/** Movimientos de boletas por estado (emitida, transferida, revendida, anulada). */
export const transicionesDeBoleta = new Counter({
  name: "ticketright_ticket_state_transitions_total",
  help: "Transiciones confirmadas hacia cada estado de una boleta",
  labelNames: ["state"] as const,
  registers: [registro],
});

/** Pagos por estado final: confirmado, rechazado, enConciliacion, compensado. A-6. */
export const pagosPorEstado = new Counter({
  name: "ticketright_payments_total",
  help: "Pagos que alcanzan cada estado durante el periodo observado",
  labelNames: ["state"] as const,
  registers: [registro],
});

/** Reservas vencidas que aún retienen inventario sin haberse liberado. Meta cero. A-5. */
export const reservasVencidasSinLiberar = new Gauge({
  name: "ticketright_overdue_reservations",
  help: "Reservas no pagadas que superaron su vencimiento y siguen reteniendo inventario",
  registers: [registro],
});

// --- Métricas técnicas de servicio ------------------------------------------

/** Tiempo de confirmación de una reserva. Meta P95 ≤ 2 s. A-10. */
export const duracionReserva = new Histogram({
  name: "ticketright_reservation_duration_seconds",
  help: "Segundos entre la recepción de la solicitud de reserva y su confirmación o rechazo",
  labelNames: ["result"] as const,
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registro],
});

/** Errores técnicos de reserva (para la tasa de error < 1%). A-10. */
export const erroresReserva = new Counter({
  name: "ticketright_reservation_errors_total",
  help: "Errores al intentar crear una reserva, por tipo",
  labelNames: ["kind"] as const,
  registers: [registro],
});

/** Latencia de la emisión de boletas (parte final de la SAGA). A-1. */
export const duracionEmision = new Histogram({
  name: "ticketright_issuance_duration_seconds",
  help: "Segundos que toma emitir las boletas de una compra confirmada",
  labelNames: ["result"] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [registro],
});

// --- Embudo de la venta (conversión) ----------------------------------------
// El diseño pide seguir "usuarios, admitidos, reservas, pagos y boletas emitidas
// como embudo" y la "conversión desde pago iniciado". Estos contadores construyen
// ese embudo sin datos personales.

/** Reservas creadas, por resultado (ok | rechazada). */
export const reservasCreadas = new Counter({
  name: "ticketright_reservations_total",
  help: "Reservas creadas, por resultado",
  labelNames: ["result"] as const,
  registers: [registro],
});

/** Pagos iniciados: denominador de la conversión frente a pagos confirmados. */
export const pagosIniciados = new Counter({
  name: "ticketright_payments_started_total",
  help: "Pagos iniciados con la pasarela; denominador de la conversión de compra",
  registers: [registro],
});

// --- Inventario en vivo (gauge desde PostgreSQL) ----------------------------
// El diseño pide mostrar "inventario autorizado, reservado, vendido y restante".
// Es la métrica central del atributo A-2 (integridad del aforo).

/** Aforo por localidad y estado: autorizado, reservado, vendido, disponible. A-2. */
export const aforoPorEstado = new Gauge({
  name: "ticketright_seat_capacity",
  help: "Aforo por localidad y estado (autorizado, reservado, vendido, disponible)",
  labelNames: ["localidad", "tipo", "state"] as const,
  registers: [registro],
});

// --- HTTP (método RED: tasa, errores, duración) -----------------------------
// El diseño técnico pide "tasa de solicitudes, errores y duración por servicio y
// operación". Se etiqueta por ruta y estado, nunca por identificadores de persona.

/** Solicitudes HTTP totales, por método, ruta y código de estado. */
export const solicitudesHttp = new Counter({
  name: "ticketright_http_requests_total",
  help: "Solicitudes HTTP atendidas, por método, ruta y código de estado",
  labelNames: ["method", "route", "status"] as const,
  registers: [registro],
});

/** Duración de las solicitudes HTTP, por método y ruta. */
export const duracionHttp = new Histogram({
  name: "ticketright_http_request_duration_seconds",
  help: "Duración de las solicitudes HTTP, por método y ruta",
  labelNames: ["method", "route"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registro],
});

// --- PostgreSQL (saturación de la autoridad transaccional) ------------------
// El diseño técnico pide vigilar "conexiones, bloqueos ... de PostgreSQL".

/** Conexiones del pool de PostgreSQL, por estado (total, idle, esperando). A-6. */
export const conexionesPostgres = new Gauge({
  name: "ticketright_pg_pool_connections",
  help: "Conexiones del pool de PostgreSQL, por estado",
  labelNames: ["state"] as const,
  registers: [registro],
});

// --- Kafka (bus de eventos durable, AD-002) ---------------------------------

/** Eventos publicados al bus por el relay de outbox, por tipo. A-1. */
export const eventosPublicados = new Counter({
  name: "ticketright_events_published_total",
  help: "Eventos publicados a Kafka por el relay de outbox, por tipo",
  labelNames: ["tipo"] as const,
  registers: [registro],
});

/** Eventos consumidos e integrados por el proyector, por tipo (idempotente). A-1. */
export const eventosConsumidos = new Counter({
  name: "ticketright_events_consumed_total",
  help: "Eventos consumidos e integrados por el proyector, por tipo",
  labelNames: ["tipo"] as const,
  registers: [registro],
});

/** Eventos enviados a la DLQ tras agotar reintentos, por tipo. Meta baja. A-1. */
export const eventosEnDlq = new Counter({
  name: "ticketright_events_dlq_total",
  help: "Eventos enviados a la cola de no procesables (DLQ), por tipo",
  labelNames: ["tipo"] as const,
  registers: [registro],
});

/** Retraso del grupo consumidor de Kafka: señal de escalado de KEDA. A-6. */
export const lagConsumidor = new Gauge({
  name: "ticketright_consumer_lag",
  help: "Mensajes pendientes de consumir en el grupo (lag), señal de escalado (KEDA)",
  labelNames: ["grupo"] as const,
  registers: [registro],
});

// --- Borde y seguridad (AD-004) ---------------------------------------------

/** Solicitudes bloqueadas en el borde, por motivo (bot | rate_limit). A-11. */
export const solicitudesBloqueadas = new Counter({
  name: "ticketright_requests_blocked_total",
  help: "Solicitudes bloqueadas en el borde de seguridad, por motivo",
  labelNames: ["motivo"] as const,
  registers: [registro],
});

/** Retos emitidos por riesgo medio de automatización (429 con Retry-After). A-11. */
export const retosEmitidos = new Counter({
  name: "ticketright_challenges_total",
  help: "Retos emitidos por sospecha de automatización (riesgo medio)",
  registers: [registro],
});

/** Tokens de admisión rechazados en el checkout, por motivo. Meta cero aceptados inválidos. A-11. */
export const tokensRechazados = new Counter({
  name: "ticketright_admission_tokens_rejected_total",
  help: "Tokens de admisión rechazados al validar en checkout, por motivo",
  labelNames: ["motivo"] as const,
  registers: [registro],
});

/** Perfil operativo actual (0=cotidiano,1=preparación,2=pico,3=recuperación,4=emergencia). AD-006. */
export const perfilOperativo = new Gauge({
  name: "ticketright_operational_profile",
  help: "Perfil operativo actual (0 cotidiano, 1 preparación, 2 pico, 3 recuperación, 4 emergencia)",
  registers: [registro],
});

// --- Sala de espera y fila de admisión --------------------------------------
// El diseño define la fila como el regulador de admisión (AD-006, back pressure) y
// pide seguir "usuarios activos", la posición en fila y la tasa de admisión.

/** Personas que han interactuado con la venta en los últimos minutos. */
export const sesionesActivas = new Gauge({
  name: "ticketright_active_sale_sessions",
  help: "Personas activas en la venta (fila o recorrido de compra) en la ventana reciente",
  registers: [registro],
});

/** Personas esperando en la fila (turno en estado enEspera). AD-006. */
export const personasEnFila = new Gauge({
  name: "ticketright_queue_waiting",
  help: "Turnos en espera dentro de la fila de admisión",
  labelNames: ["evento"] as const,
  registers: [registro],
});

/** Personas admitidas y aún sin usar su turno (pueden comprar ya). */
export const personasAdmitidas = new Gauge({
  name: "ticketright_queue_admitted",
  help: "Turnos admitidos que todavía pueden usarse para comprar",
  labelNames: ["evento"] as const,
  registers: [registro],
});

/** Ingresos a la fila, por resultado. */
export const ingresosAFila = new Counter({
  name: "ticketright_queue_entries_total",
  help: "Ingresos a la fila de admisión",
  labelNames: ["evento"] as const,
  registers: [registro],
});

/** Admisiones concedidas (turnos que pasan de enEspera a admitido). */
export const admisionesConcedidas = new Counter({
  name: "ticketright_queue_admissions_total",
  help: "Turnos admitidos desde la fila hacia la compra",
  labelNames: ["evento"] as const,
  registers: [registro],
});

/** Tiempo de consulta de la posición en fila. Meta P95 ≤ 1 s. A-10. */
export const duracionConsultaFila = new Histogram({
  name: "ticketright_queue_position_duration_seconds",
  help: "Segundos que tarda TicketRight en devolver la posición en la fila",
  buckets: [0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [registro],
});

/** Incumplimientos de la política de orden de la fila. Meta cero. A-4. */
export const violacionesPoliticaFila = new Counter({
  name: "ticketright_queue_policy_violations_total",
  help: "Turnos admitidos en un orden distinto al de la política publicada",
  registers: [registro],
});

// --- Pagos en curso (in-flight) ---------------------------------------------

/** Pagos que están procesándose ahora mismo (esperando a la pasarela). A-1 · A-6. */
export const pagosEnCurso = new Gauge({
  name: "ticketright_payments_in_flight",
  help: "Pagos en proceso en este momento (solicitados y aún sin confirmar ni rechazar)",
  registers: [registro],
});

// --- Recorrido crítico (sonda sintética) ------------------------------------

/** Recorridos sintéticos de compra, por resultado. Disponibilidad ≥ 99,9%. A-9. */
export const recorridosCriticos = new Counter({
  name: "ticketright_critical_journey_checks_total",
  help: "Recorridos sintéticos del camino crítico de compra, por resultado (ok | fallo)",
  labelNames: ["result"] as const,
  registers: [registro],
});

/**
 * Costo de infraestructura por boleta vendida. Meta ≤ COP $150. A-7.
 * En la demo el costo por hora es un parámetro (INFRA_COSTO_HORA_COP); la métrica
 * lo reparte entre las boletas vendidas para vigilar la viabilidad económica bajo carga.
 */
export const costoInfraPorBoleta = new Gauge({
  name: "ticketright_infrastructure_cost_per_ticket_cop",
  help: "Costo estimado de infraestructura por boleta vendida, en pesos",
  registers: [registro],
});

// Inicializa en cero los contadores de integridad para que aparezcan siempre en /metrics
// (prom-client omite un contador con etiquetas hasta su primer incremento). Así los
// paneles de "sobreventa" y "titularidad inválida" muestran 0 desde el arranque, que es
// justamente su meta. También los recorridos sintéticos.
sobreventas.inc({ localidad: "ninguna" }, 0);
titularidadesInvalidas.inc(0);
violacionesPoliticaFila.inc(0);
recorridosCriticos.inc({ result: "ok" }, 0);
recorridosCriticos.inc({ result: "fallo" }, 0);
