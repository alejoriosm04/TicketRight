# Arquitectura implementada — el piloto frente al diseño

> Diagrama de Archify de **lo que corre hoy** en el piloto de la Entrega 3, para ponerlo al
> lado de los diagramas de la Entrega 2 y mostrar que la implementación sigue lo definido.
> Cada componente enlaza a su código en el repositorio, en un commit fijo, y Archify verifica
> que esos enlaces existen.

**Abrir:** [`arquitectura-implementada.html`](arquitectura-implementada.html) ·
**fuente:** [`arquitectura-implementada.json`](arquitectura-implementada.json).

## Contenido

| Sección | Qué responde |
|---|---|
| [Cómo leerlo](#cómo-leerlo) | ¿Qué muestra el diagrama y cómo se navega? |
| [Del diseño al piloto](#del-diseño-al-piloto) | ¿Dónde quedó cada componente de la arquitectura de referencia? |
| [Verificación](#verificación) | ¿Con qué se comprobó que el diagrama es correcto y fiel al código? |
| [Cómo regenerarlo](#cómo-regenerarlo) | ¿Cómo se valida y se vuelve a generar? |

## Cómo leerlo

El camino de compra va de izquierda a derecha: **plataforma web → borde de seguridad → API
de ventas → orquestador de compra → PostgreSQL**. Encima está lo que el camino consulta (la
sala de espera en Redis y la pasarela simulada) y debajo lo que produce (emisión de boletas,
eventos en Kafka, telemetría). Todo corre dentro del piloto en GitHub Codespaces, con minikube
y KEDA o con `docker compose`.

- **Clic en un componente:** muestra su ADR y sus enlaces al código (`SRC n` indica cuántos).
- **Vistas guiadas** (arriba): *Camino de compra*, *Eventos y escalado* y *Observabilidad*.
- **Tarjetas** (abajo): equivalencias con AWS, garantías verificadas y lo que quedó fuera.

## Del diseño al piloto

Los 21 componentes de la
[arquitectura de referencia](../02-modelamiento/arquitectura-de-referencia.md) y dónde
quedaron. La correspondencia servicio por servicio con AWS, con su ADR, está en
[`fidelidad-arquitectonica.md`](fidelidad-arquitectonica.md).

| Componente de referencia (Entrega 2) | En el piloto | Estado |
|---|---|---|
| Portal web | Plataforma web `/app` | Hecho |
| API Gateway y protección perimetral | Borde de seguridad: token bucket por ruta y detección de bots (AD-004) | Equivalente local |
| Identidad y consentimiento | Cuentas con rol y sesión JWT; `Fan` y `Consentimiento` en el dominio | Equivalente local |
| Catálogo y reglas de eventos | `GET /catalogo` como lectura CQRS; dominio de Oferta de eventos | Parcial: sin gestión por el promotor |
| Admisión y fila virtual | Sala de espera en Redis con JWT de admisión de un uso (AD-006) | Hecho |
| Inventario y reservas | Orquestador de compra sobre `Localidad`, con `FOR UPDATE` (AD-003) | Hecho |
| Compra y pagos | Orquestador de compra: SAGA con unidad de trabajo e idempotencia (AD-002) | Hecho |
| Boletas y titularidad | Emisión de boletas por el puerto `EmisorDeBoletas` (AD-008) | Hecho |
| Bus de eventos y colas | Kafka: `ventas.v1.eventos` y DLQ, alimentado por el outbox | Hecho |
| Procesadores asíncronos | Consumidor idempotente de Kafka y worker de expiración de reservas | Hecho |
| Base de datos transaccional | PostgreSQL 18, autoridad del aforo con `CHECK` en la tabla | Hecho |
| Datos de identidad | Tabla `cuentas` con nombre y documento cifrados (AES-256-GCM) | Equivalente local: sin almacén aislado |
| Grilla en memoria y modelos de lectura | Redis para la fila | Parcial: sin OpenSearch |
| Proveedor de identidad | JWT firmado propio | Equivalente local: sin proveedor federado |
| Pasarela de pago | Pasarela simulada: tardía, repetida o rechaza | Equivalente local |
| Ejecución y escalado | minikube + KEDA, escalado por el lag del consumidor | Equivalente local |
| Seguridad de plataforma | Secret de Kubernetes y cifrado de PII | Parcial: sin rotación de llaves |
| Observabilidad | OpenTelemetry + Alloy, Prometheus, Tempo, Loki y Grafana con 15 alertas | Hecho |
| Entrega automatizada | CI en GitHub Actions: tipos, migraciones y pruebas con cobertura | Parcial: sin Argo CD ni Terraform |
| Control de acceso del recinto | — | Fuera del piloto |
| Autoridades y registros | — (el parafiscal existe como componente del precio) | Fuera del piloto |

## Verificación

Recibo de `deliver` (26 de septiembre de 2026):

| Comprobación | Resultado |
|---|---|
| Perfil de calidad | `showcase`, el más estricto de Archify |
| Comprobaciones del artefacto | 9 de 9: sin cruces, sin corredores ambiguos, sin etiquetas sobre rutas |
| Composición | 0 errores y 0 advertencias |
| Enlaces al código | **24 referencias verificadas** en el commit `b88d201` de `main` |
| Navegador (`visual-check`) | Sin desbordamiento y con texto legible en 1440×900, 1600×1000, 1920×1080 y 2048×1320 |

Fuente `sha256 0e2bfaafa4a4…` → HTML `sha256 e5807db62280…`.

La verificación de enlaces lee cada archivo **en el commit fijado**, no en la copia de trabajo:
si un componente apuntara a un archivo o a una línea que no existe, la entrega falla.

## Cómo regenerarlo

```bash
node tools/archify/bin/archify.mjs validate architecture \
  docs/proyecto/03-implementacion/arquitectura-implementada.json \
  --quality showcase --repo-root . --json
node tools/archify/bin/archify.mjs deliver architecture \
  docs/proyecto/03-implementacion/arquitectura-implementada.json \
  docs/proyecto/03-implementacion/arquitectura-implementada.html \
  --quality showcase --repo-root . --json
```

Si el código cambia, se actualiza `meta.repository.revision` al nuevo commit y se vuelve a
entregar: la verificación dirá si algún enlace quedó apuntando a código que ya no existe.
