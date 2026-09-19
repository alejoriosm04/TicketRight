PlateOS / NutriChain
**Plataforma de nutrición clínica con planes ejecutables, adherencia y agenda de citas**
Propuesta de producto, catálogo, casos de uso, viabilidad de implementación y modelo de precios  
Arquitecturas Avanzadas de Software · Escenario LATAM (USD)
---
## 1. Visión y problema
**Pitch:** plataforma B2B2C que convierte planes nutricionales clínicos en menús ejecutables (compras, prep, adherencia y tele-seguimiento), con agenda de citas presencial/teleconsulta y arquitectura event-driven multi-tenant.
### Problema
- El nutricionista prescribe en PDF/Excel; el paciente no lo ejecuta.
- No hay trazabilidad entre plan → compra → cocina → resultado clínico.
- Las clínicas no escalan el seguimiento ni la agenda.
- Las citas viven en WhatsApp u herramientas desconectadas del plan.
### Solución
- Motor clínico de planes (macros, restricciones, patologías, preferencias).
- Generador de menús semanales adaptativos + lista de compra.
- Adherencia y outcomes (check-ins, wearables opcionales).
- Agenda y teleconsulta integradas al flujo clínico.
- Portal B2B multi-tenant para clínicas y wellness corporativo.
---
## 2. Catálogo de productos
| Producto | Qué es | Actor | Incluye |
|---|---|---|---|
| PlateOS Core | App base de nutrición | Paciente + Pro | Perfil, restricciones, menús, lista de compra |
| Clinical Plans | Motor de planes clínicos | Profesional | Macros, patologías, versionado, plantillas |
| Agenda & Citas | Reservas y gestión | Ambos | Slots, reserva, cancelación, recordatorios |
| Teleconsulta | Consulta por video | Ambos | Link de sesión, sala de espera, notas |
| Adherence Coach | Seguimiento de cumplimiento | Ambos | Check-ins, alertas, rachas, progreso |
| Clinic Hub | Panel multi-tenant | Admin clínica | Equipo, roles, sedes, reportes, branding |
| Payments | Cobros y suscripciones | Ambos | Pago de cita, planes Pro, facturación |
| Integrations Pack | Conectores externos | Admin | Wearables, calendarios, retail, labs |
| Wellness Business | Programas corporativos | Empresa | Seats, campañas, reportes anonimizados |
### Empaquetado comercial
| Plan | Target | Incluye | Precio orientativo |
|---|---|---|---|
| Paciente Free | Usuario individual | Core básico + reserva de citas | $0 |
| Paciente Pro | Usuario comprometido | Core completo + Adherence + historial | $9–15 / mes |
| Profesional | Nutricionista independiente | Plans + Agenda + Teleconsulta | $49–79 / mes |
| Clínica | Centros / equipos | Clinic Hub + multiprofesional + Payments | $149–399 / mes |
| Enterprise Wellness | Empresas | Wellness Business + reportes/API | Cotización anual |
---
## 3. Usos desde el profesional / clínica
Operación diaria: configurar agenda, confirmar reservas, atender consulta (presencial o video), crear/ajustar plan nutricional, monitorear adherencia y programar seguimiento. Admin clínica: equipo, roles, cobros, protocolos y reportes.
| ID | Caso de uso | Resultado |
|---|---|---|
| P-01 | Configurar disponibilidad semanal | Slots publicables para pacientes |
| P-02 | Confirmar / cancelar / reprogramar cita | Agenda sin doble booking |
| P-03 | Iniciar teleconsulta | Sesión con registro de asistencia |
| P-04 | Crear plan nutricional versionado | Plan publicado y auditable |
| P-05 | Sustituir alimentos del menú | Menú regenerado con restricciones |
| P-06 | Revisar adherencia semanal | Intervención temprana si hay abandono |
| P-07 | Registrar notas post-cita | Historial clínico actualizado |
| P-08 | Cobrar consulta | Pago confirmado o factura pendiente |
| P-09 | Generar reporte de clínica | Métricas operativas y clínicas |
| P-10 | Activar plantilla por patología | Plan inicial en minutos |
### Historias de usuario (profesional)
- Como nutricionista, quiero publicar mi disponibilidad para que los pacientes reserven sin mensajes manuales.
- Como nutricionista, quiero publicar un plan después de la cita para que el paciente reciba menú y lista de compra automáticamente.
- Como admin de clínica, quiero ver tasa de asistencia y adherencia por profesional para operar mejor.
---
## 4. Usos desde el paciente
| ID | Caso de uso | Resultado |
|---|---|---|
| U-01 | Completar onboarding nutricional | Perfil listo para personalización |
| U-02 | Reservar cita (presencial/video) | Cita confirmada (+pago si aplica) |
| U-03 | Unirse a teleconsulta | Acceso a sesión en horario |
| U-04 | Consultar menú del día | Indicaciones claras de qué comer |
| U-05 | Generar lista de compra | Lista exportable / por tienda |
| U-06 | Registrar adherencia diaria | Progreso visible para ambos |
| U-07 | Solicitar ajuste de plan | Profesional notificado |
| U-08 | Cancelar / reprogramar cita | Slot liberado + notificaciones |
| U-09 | Ver historial de planes y citas | Trazabilidad personal |
| U-10 | Actualizar restricciones | Próximos menús recalculados |
### Historias de usuario (paciente)
- Como paciente, quiero reservar una teleconsulta y pagar en la misma app.
- Como paciente, quiero ver qué cocinar hoy según mi plan y mis restricciones.
- Como paciente, quiero marcar si cumplí mis comidas para que mi nutricionista vea mi progreso.
### Mapa producto → valor por actor
| Producto | Valor profesional | Valor paciente |
|---|---|---|
| Core / Menús | Menos tiempo armando dietas | Plan accionable, no solo PDF |
| Clinical Plans | Estandariza criterio clínico | Plan confiable y personalizado |
| Agenda & Citas | Llena agenda y reduce no-shows | Reserva fácil 24/7 |
| Teleconsulta | Atiende remoto sin apps extra | Consulta sin traslado |
| Adherence | Ve quién necesita intervención | Hábitos con feedback continuo |
| Payments | Cobra y concilia | Paga en un solo lugar |
| Clinic Hub | Escala operación multiprofesional | Experiencia consistente de marca |
---
 
## 5. Modelo de negocio

### Fuentes de ingreso

- SaaS Profesional / Clínica (MRR).
- Suscripción Paciente Pro.
- Comisión 5–15% por cita cobrada en plataforma.
- Add-on teleconsulta / políticas de no-show.
- Licencias Enterprise Wellness.
- Revenue share con partners (retail, labs, wearables) en fase 2.

### Go-to-market

- Entrada por clínicas y nutricionistas (B2B2C).
- El profesional trae pacientes → CAC más bajo que paid ads.
- Upsell Paciente Pro tras 1–2 citas.
- Luego vertical wellness corporativo.

---

## 6. Viabilidad de implementación

**Veredicto:** viable como MVP en 12–16 semanas con monolito modular + eventos internos. Microservicios completos se justifican después de product-market fit, no al día 1.

### Fases

| Fase | Alcance | Arquitectura | Riesgo |
|---|---|---|---|
| MVP (0–4 meses) | Planes, menús, citas, pagos básicos, multi-tenant simple | Monolito modular + outbox + BFF | Bajo–medio |
| Growth (4–9 meses) | Adherence avanzada, teleconsulta estable, reportes | Separar Scheduling, Billing, Notificaciones | Medio |
| Scale (9–18 meses) | Integraciones retail/labs, wellness B2B, analytics | Event bus, CQRS lectura, multi-región opcional | Alto (complejidad) |

### Patrones a defender en clase

- DDD / bounded contexts: Clinical Plans, Menu Generation, Scheduling, Adherence, Billing, Tenancy.
- Hexagonal / ports & adapters para el motor nutricional y supermercados.
- CQRS: escritura de planes vs lectura de dashboards.
- Event-driven + saga: reserva → pago → confirmación → notificaciones.
- Invariante de agenda: un slot no se confirma dos veces (lock optimista).
- Multi-tenant, auditoría clínica, privacy by design (LFPDPPP/GDPR).

### MVP vs fuera de alcance

| Incluir en MVP | Diferir (post-MVP) |
|---|---|
| Onboarding + restricciones | Visión de platos con IA |
| Plan semanal + menú + lista compra | Video nativo (usar Meet/Zoom al inicio) |
| Agenda básica + recordatorios | Sync bidireccional Google Calendar |
| Check-in de adherencia | Meal kits / dark kitchen |
| Dashboard clínico simple | Labs e interoperabilidad FHIR |
| Multi-tenant (1 clínica = 1 tenant) | Lista de espera inteligente |
| Pago de cita | Marketplace de profesionales |

### Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Baja adherencia del paciente | Churn B2C y clínicas | Recordatorios, UX simple, valor en lista de compra |
| Doble booking en citas | Confianza operacional | Lock optimista / versión de slot + pruebas de concurrencia |
| Datos de salud / compliance | Legal y reputacional | Consentimiento, cifrado, minimización, retención |
| Complejidad de menús | Retraso de MVP | Motor de reglas primero; ML después |
| CAC alto en B2C puro | Unit economics rotos | Adquisición vía profesionales (B2B2C) |

### Equipo estimado (MVP)

| Rol | FTE | Responsabilidad |
|---|---|---|
| Backend / arquitectura | 1–2 | Dominio, APIs, eventos, tenancy |
| Frontend (web) | 1–2 | Apps paciente, profesional, admin |
| Mobile (opcional) | 0–1 | PWA primero para reducir costo |
| Diseño / UX | 0.5–1 | Flujos reserva + menú diario |
| QA / DevOps | 0.5 | CI, ambientes, observabilidad básica |

Costo equipo referencia LATAM (orden de magnitud): **USD 18k–45k / mes**. Burn de 4 meses MVP ≈ **USD 72k–180k** antes de marketing.

---

## 7. Datos a calcular — precios y unit economics

Escenario base para la propuesta (hipótesis de clase; ajustar a tu mercado). Moneda: USD.

| Métrica | Valor |
|---|---|
| ARPU Paciente Pro / mes | $12 |
| ARPU Profesional / mes | $64 |
| ARPU Clínica / mes | $249 |
| Take-rate citas | 10% |

### Supuestos del escenario base (mes 12)

| Variable | Valor | Notas |
|---|---|---|
| Clínicas activas | 40 | Cuentas B2B plan Clínica |
| Profesionales independientes | 120 | Plan Profesional |
| Profesionales en clínicas | 160 | 4 avg por clínica |
| Pacientes Pro | 2,400 | Avg 8 Pro por profesional activo |
| Citas cobradas / mes | 3,200 | Ticket promedio cita $35 |
| Take-rate plataforma | 10% | Comisión sobre cita |
| CAC blended | $45 | Mayoría vía canal profesional |
| Churn mensual B2C | 6% | Vida media ~16.7 meses |
| Churn mensual B2B | 3% | Vida media ~33 meses |

### Fórmulas

```text
MRR = (N_pro × P_pro) + (N_clinic × P_clinic) + (N_paciente × P_paciente)
Ingreso_citas = Citas × Ticket × TakeRate
LTV = ARPU / Churn_mensual
LTV/CAC = LTV / CAC   (meta > 3)
Contribución = Ingresos − COGS (pagos, SMS, video, cloud)
```

### Cálculo escenario base — mes 12

| Línea | Cálculo | USD / mes |
|---|---|---|
| SaaS Profesionales | 120 × $64 | 7,680 |
| SaaS Clínicas | 40 × $249 | 9,960 |
| Suscripciones Paciente Pro | 2,400 × $12 | 28,800 |
| Comisiones por citas | 3,200 × $35 × 10% | 11,200 |
| **MRR total aproximado** | Suma de líneas | **57,640** |
| **ARR run-rate** | 57,640 × 12 | **691,680** |

### Unit economics derivados

| Segmento | LTV | CAC est. | LTV/CAC |
|---|---|---|---|
| Paciente Pro | $200 (= 12 / 0.06) | $45 | ≈ 4.4 |
| Profesional | ≈ $2,133 (= 64 / 0.03) | $250 | ≈ 8.5 |
| Clínica | ≈ $8,300 (= 249 / 0.03) | $800 | ≈ 10.4 |

**Conclusión:** el canal B2B (profesional/clínica) tiene unit economics más saludables; priorizar ventas a clínicas y usar al profesional como canal de adquisición de pacientes.

### Sensibilidad de precio

| Palanca | Si sube | Si baja | Qué medir |
|---|---|---|---|
| Precio Paciente Pro | Más margen, más churn | Más conversión, menos ARPU | Conversion Free→Pro, churn 30d |
| Precio Profesional | Menos adopción early | Más seats, menos revenue/seat | Trial→paid, pacientes/pro |
| Take-rate citas | Fricción con clínicas | Menos ingreso variable | % citas pagadas en plataforma |
| Ticket promedio cita | Más comisión absoluta | Depende del mercado local | Mix presencial vs video |

### COGS a presupuestar

| Concepto | Costo | Detalle |
|---|---|---|
| Pasarela de pagos | 2.9% + $0.30 / cargo | Suscripciones y citas |
| SMS / WhatsApp | $0.02–0.08 / msg | Recordatorios de cita y comida |
| Video (API terceros) | $0.01–0.04 / min | O link externo $0 en MVP |
| Cloud (compute + DB) | 8–15% ingresos tempranos | Baja con escala |
| Soporte | 1 FTE / ~150 clínicas | O self-service + chatbot |

**Break-even simplificado:** con burn de equipo ~USD 30k/mes y margen de contribución ~70%, se necesitan ≈ USD 43k de ingreso mensual para cubrir opex de producto (sin marketing pesado). El escenario mes 12 (≈ USD 58k MRR) queda por encima; el riesgo está en llegar ahí con CAC controlado vía canal profesional.

---

## 8. Arquitectura lógica (resumen)

```text
Apps (Paciente | Profesional | Admin)
        → API Gateway + BFF
        → Identity | Plan Service | Menu Engine
          | Appointment Service | Adherence | Billing
        → Event Bus
        → Notification | Analytics
          | Adapters (Calendar, Payments, Video, Retail)
```

**Eventos clave:** `AppointmentConfirmed`, `AppointmentCompleted`, `PlanPublished`, `MenuGenerated`, `AdherenceLogged`, `PaymentCaptured`, `NoShowRecorded`.

**Flujo demo:** crear disponibilidad → reservar cita → completar consulta → publicar plan → generar menú → check-in de adherencia.

---

## 9. Estructura sugerida del entregable de clase

1. Visión y problema  
2. Stakeholders y personas  
3. Catálogo de productos y casos de uso  
4. Modelo de negocio y pricing  
5. Viabilidad, roadmap MVP y riesgos  
6. Arquitectura C4 + dominio + eventos  
7. Calidad: seguridad, multi-tenant, observabilidad  
8. Trade-offs y demo del flujo cita → plan → menú  

---

*Nota: precios y volúmenes son hipótesis de trabajo para calcular escenarios académicos, no una cotización real de mercado.*
