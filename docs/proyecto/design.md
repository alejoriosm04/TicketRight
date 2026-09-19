# Sistema de diseño de TicketRight

> Fuente única de verdad visual para las presentaciones, diagramas, prototipos, documentos
> gráficos y sitios web de TicketRight.

**Referencia de origen:** [sitio del caso de negocio de la Entrega 1](https://wondrous-monstera-174b32.netlify.app/).

Esta especificación se construyó a partir del lenguaje visual de las diapositivas HTML de
la Entrega 1. Las piezas nuevas deben conservar esa identidad. Cuando una regla específica
de un formato entre en conflicto con este documento —por ejemplo, una notación UML—, se
conserva la semántica del formato y se aplican la tipografía, los colores, el espaciado y la
jerarquía visual de TicketRight.

## 1. Identidad del producto

TicketRight se presenta como una solución de negocio profesional, moderna y estructurada.
La interfaz debe priorizar la lectura de la información sobre la decoración.

El lenguaje visual debe sentirse:

- profesional y confiable;
- moderno y orientado a tecnología;
- limpio y espacioso;
- fácil de recorrer visualmente;
- consistente en secciones extensas;
- apropiado para presentaciones académicas y de negocio.

## 2. Principios de diseño

### Claridad primero

Cada sección debe tener una jerarquía visible. El título de la página, los títulos de
sección, el texto de apoyo, las tarjetas y las métricas destacadas deben distinguirse de
inmediato.

### Densidad controlada

El contenido de negocio puede ser extenso. Se deben usar espacios amplios, líneas de texto
cortas, tarjetas, columnas y separadores visuales en lugar de bloques largos sin cortes.

### Consistencia

Las tarjetas, botones, títulos, etiquetas y contenedores deben reutilizar los mismos radios,
espacios y reglas visuales.

### Jerarquía visual

Primero se usan tamaño, peso, espacio y contraste. La decoración adicional solo se agrega
cuando ayuda a comprender el contenido.

### Adaptación desde el inicio

El contenido debe conservar su legibilidad en escritorio, tableta y móvil sin producir
desplazamiento horizontal.

## 3. Estructura general de una página

Orden recomendado:

1. encabezado y navegación;
2. presentación del proyecto;
3. contexto de negocio;
4. problema u oportunidad;
5. solución propuesta;
6. Business Model Canvas;
7. objetivos y resultados clave;
8. información de soporte;
9. conclusiones o siguientes pasos;
10. pie de página.

Cada tema principal debe formar una sección visual independiente, con suficiente separación
vertical para facilitar el recorrido.

## 4. Sistema de distribución

### Contenedor principal

```css
max-width: 1200px;
margin: 0 auto;
padding-inline: 24px;
```

Las secciones con mucho texto usan una columna de lectura más estrecha:

```css
max-width: 760px;
```

### Cuadrícula

En escritorio se usa como referencia una cuadrícula de 12 columnas.

Distribuciones habituales:

- una columna para introducciones y textos extensos;
- dos columnas para comparaciones o contenidos complementarios;
- tres columnas para características o métricas compactas;
- cuadrículas adaptables para grupos de tarjetas.

```css
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
gap: 24px;
```

### Separación de secciones

- Escritorio: `padding-block: 72px`.
- Móvil: `padding-block: 48px`.
- Entre el título de una sección y su contenido: entre `24px` y `32px`.

## 5. Escala de espaciado

Se usa una escala basada en múltiplos de 8 px.

| Token | Valor | Uso habitual |
|---|---:|---|
| `space-1` | 4 px | Separación interna mínima |
| `space-2` | 8 px | Espacio entre icono y texto |
| `space-3` | 12 px | Controles compactos |
| `space-4` | 16 px | Espacio interno estándar |
| `space-5` | 24 px | Relleno de tarjetas y separación de cuadrículas |
| `space-6` | 32 px | Grupos de componentes |
| `space-7` | 48 px | Separación de subsecciones |
| `space-8` | 64 px | Separación amplia |
| `space-9` | 72–96 px | Secciones principales |

## 6. Tipografía

Se usa una tipografía sans serif limpia, adecuada para interfaces y presentaciones.

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Jerarquía tipográfica

| Estilo | Tamaño | Peso | Uso |
|---|---:|---:|---|
| Título destacado | 48–64 px | 700–800 | Título de apertura |
| H1 | 40–48 px | 700 | Título principal de página |
| H2 | 30–36 px | 700 | Secciones principales |
| H3 | 22–24 px | 600–700 | Tarjetas y subsecciones |
| H4 | 18–20 px | 600 | Grupos pequeños |
| Cuerpo grande | 18 px | 400 | Introducciones |
| Cuerpo | 16 px | 400 | Texto estándar |
| Pequeño | 14 px | 400–500 | Información de apoyo |
| Etiqueta | 12–14 px | 600 | Metadatos y categorías |

El texto de cuerpo usa `line-height: 1.6`. Los títulos usan `line-height: 1.1`.

Los párrafos deben ocupar aproximadamente entre 60 y 80 caracteres por línea. No se deben
crear columnas de texto demasiado anchas.

## 7. Sistema de color

Se usa una paleta sobria, orientada a negocio y tecnología. Los componentes deben consumir
tokens semánticos; no deben repetir colores literales.

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-surface-strong: #f1f5f9;

  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;

  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-soft: #eff6ff;

  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #dc2626;
}
```

### Reglas de uso

- Los fondos principales son blancos o neutros muy claros.
- El color primario destaca navegación, enlaces, iconos, cifras importantes y llamadas a
  la acción.
- El texto oscuro se reserva para títulos e información importante.
- El gris apagado se usa en descripciones y metadatos secundarios.
- Los fondos de color deben ser suaves, no saturados.
- Un mismo bloque de contenido no debe usar más de un color de acento fuerte.
- Los estados nunca se comunican solo mediante color: deben incluir texto, símbolo o ambos.

## 8. Encabezado y navegación

El encabezado debe ser simple y compacto.

### Escritorio

- Nombre o marca del proyecto a la izquierda.
- Navegación a la derecha.
- Espacio horizontal cómodo.
- Comportamiento fijo opcional.
- Borde fino o sombra discreta para separarlo del contenido.
- Altura mínima: `64px`.

Los enlaces tienen peso medio, color neutro por defecto y color primario al estar activos o
al pasar el cursor. Solo una acción real debe parecer un botón.

### Móvil

La navegación se agrupa en un menú cuando no cabe. Las áreas táctiles deben medir al menos
44 px de ancho y alto.

## 9. Sección de apertura

La apertura presenta TicketRight y el caso de negocio. Puede contener:

- una etiqueta pequeña de categoría;
- el título principal de TicketRight;
- una propuesta de valor breve;
- metadatos de apoyo;
- una acción de navegación;
- una ilustración o tarjeta destacada.

Debe tener más espacio que una sección corriente. No debe concentrar todos los detalles del
proyecto.

## 10. Encabezados de sección

Cada sección principal sigue este patrón:

1. etiqueta opcional;
2. título de sección;
3. introducción de una o dos frases;
4. contenido principal.

El título debe ser destacado, pero menor que el título de apertura. Puede usarse un único
recurso de acento de forma consistente: etiqueta de color, icono pequeño, línea corta o
palabra destacada. No se mezclan los cuatro.

## 11. Tarjetas

Las tarjetas son el contenedor principal para agrupar información.

```css
background: var(--color-bg);
border: 1px solid var(--color-border);
border-radius: 16px;
padding: 24px;
```

Sombra opcional:

```css
box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
```

Una tarjeta puede incluir etiqueta o icono, título, texto de apoyo, métrica o estado y una
acción opcional. Se debe evitar anidar varias tarjetas con borde.

Solo las tarjetas interactivas reaccionan al cursor:

```css
transform: translateY(-2px);
box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10);
```

La transición debe durar entre 150 y 250 ms.

## 12. Business Model Canvas

El Canvas debe ser una de las secciones más estructuradas.

### Escritorio

Se usa una cuadrícula inspirada en la distribución convencional del Canvas, con bloques
claramente separados. Cada bloque incluye el nombre de la categoría, contenido breve y un
icono opcional. Se prefieren frases cortas a párrafos.

### Tableta y móvil

No se conserva una cuadrícula ilegible en miniatura. Las categorías se convierten en
tarjetas y se apilan en este orden:

1. segmentos de clientes;
2. propuestas de valor;
3. canales;
4. relaciones con clientes;
5. fuentes de ingresos;
6. recursos clave;
7. actividades clave;
8. socios clave;
9. estructura de costos.

## 13. Presentación de OKR

Los objetivos deben distinguirse visualmente de sus resultados clave.

```text
Objetivo
  ├── KR 1
  ├── KR 2
  └── KR 3
```

### Objetivo

- Título fuerte.
- Enunciado breve.
- Indicador o icono de acento.
- Resultados clave agrupados debajo.

### Resultado clave

- Identificador, como `KR1` o `KR2`.
- Resultado medible.
- Meta o porcentaje, cuando corresponda.
- Progreso opcional.

Las métricas deben poder leerse rápidamente y no quedar escondidas dentro de párrafos.

## 14. Métricas y datos destacados

Las cifras importantes usan tarjetas de métrica. Una cifra aislada no necesita una gráfica
si comunica el resultado por sí sola.

```text
85 %
Meta de adopción

+30 %
Mejora esperada
```

- Número: entre 32 y 40 px, negrita, color primario o semántico.
- Etiqueta: entre 14 y 16 px, breve y con color de texto secundario.

## 15. Botones y enlaces

### Botón principal

```css
background: var(--color-primary);
color: white;
border-radius: 10px;
padding: 12px 18px;
font-weight: 600;
```

### Botón secundario

Usa fondo blanco o claro, borde neutro y texto oscuro.

### Enlace de texto

Usa el color primario y un estado visible al recibir foco o al pasar el cursor.

Los botones representan acciones. Una etiqueta informativa no debe parecer un botón.

## 16. Iconos

Se usa una única familia de iconos, preferiblemente Lucide o Heroicons.

- Tamaño estándar: entre 18 y 24 px.
- Trazo consistente.
- Los iconos complementan el significado; no reemplazan etiquetas necesarias.
- No se mezclan emojis con iconos de interfaz dentro de una misma pieza.

## 17. Bordes, radios y sombras

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
```

Uso recomendado:

- botones: entre 8 y 10 px;
- elementos pequeños: 8 px;
- tarjetas: entre 12 y 16 px;
- paneles destacados: entre 20 y 24 px;
- bordes: `1px solid var(--color-border)`.

Las sombras se usan con moderación. La mayor parte de la jerarquía debe provenir del
espacio, el fondo y los bordes.

## 18. Tratamiento de fondos

Las secciones extensas pueden alternar sutilmente sus fondos:

```text
Blanco
↓
Neutro claro
↓
Blanco
↓
Fondo primario suave
```

No se asigna un color diferente a cada sección. Los degradados, si se usan, deben ser
discretos y no pueden reducir el contraste del texto.

## 19. Comportamiento adaptable

### Escritorio — desde 1024 px

- Navegación completa.
- Cuadrículas de varias columnas.
- Canvas con distribución estructurada.
- Espacios amplios.

### Tableta — entre 768 y 1023 px

- Menos columnas.
- Entre 20 y 24 px de espacio horizontal.
- Simplificación de distribuciones complejas.

### Móvil — menos de 768 px

- Una columna por defecto.
- Entre 16 y 20 px de espacio horizontal.
- Títulos de apertura más pequeños.
- Tarjetas apiladas.
- Canvas convertido en tarjetas secuenciales.
- Botones de ancho completo cuando ayuden a la interacción.

```css
font-size: clamp(2.25rem, 6vw, 4rem);
```

## 20. Accesibilidad

Requisitos mínimos:

- contraste de texto y fondo conforme a WCAG AA;
- estados comunicados con texto o símbolos, no solo con color;
- foco visible en todos los elementos interactivos;
- orden semántico de títulos: `h1` → `h2` → `h3`;
- texto alternativo útil en imágenes informativas;
- texto alternativo vacío en imágenes decorativas;
- enlaces distinguibles del texto corriente;
- objetivos interactivos de al menos 44 × 44 px cuando sea posible;
- respeto por `prefers-reduced-motion`.

```css
:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.35);
  outline-offset: 3px;
}
```

## 21. Movimiento

El movimiento debe ser discreto y funcional.

```css
transition-duration: 180ms;
transition-timing-function: ease;
```

Usos apropiados:

- estados de botones y navegación;
- tarjetas interactivas;
- apertura de secciones plegables;
- aparición sutil de secciones.

Se deben evitar efectos amplios de paralaje, animaciones constantes, rebotes excesivos o
movimientos que retrasen el acceso a la información.

## 22. Estilo de contenido

El contenido debe ser directo, conciso, fácil de recorrer y consistente en su terminología.

Se prefiere:

> Aumentar en 30 % la adopción de boletería digital.

En lugar de:

> Buscamos alcanzar posiblemente un aumento en la cantidad de usuarios que deciden adoptar
> soluciones de boletería digital.

Los párrafos deben ser breves. La información compleja se divide en tarjetas, métricas o
grupos estructurados.

## 23. Componentes reutilizables

La implementación debe favorecer componentes reutilizables:

- `AppHeader`
- `NavLink`
- `HeroSection`
- `SectionHeader`
- `ContentSection`
- `InfoCard`
- `FeatureCard`
- `MetricCard`
- `CanvasGrid`
- `CanvasCard`
- `ObjectiveCard`
- `KeyResultItem`
- `Badge`
- `PrimaryButton`
- `SecondaryButton`
- `Footer`

Los componentes reciben el contenido mediante datos o propiedades. No se duplica la misma
estructura para cada sección.

## 24. Tokens de diseño

```css
:root {
  /* Distribución */
  --container-max: 1200px;
  --reading-max: 760px;

  /* Espaciado */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Radio */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Color */
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-surface-strong: #f1f5f9;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-soft: #eff6ff;

  /* Movimiento */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
}
```

## 25. Aplicación en presentaciones

- Usar una sola idea principal por diapositiva.
- Conservar una zona segura mínima de 48 px en los cuatro bordes.
- Mantener el título y el número de sección en posiciones consistentes.
- Usar fondo blanco o neutro claro para contenido y fondo primario suave para pausas o
  conclusiones.
- Limitar cada diapositiva a una cifra destacada, una comparación o un grupo breve de
  argumentos.
- Convertir párrafos extensos en una secuencia de diapositivas; no reducir la tipografía para
  hacerlos caber.
- Usar el azul primario para guiar la lectura, no para colorear todo el contenido.
- Mantener el contraste y un tamaño legible al proyectar. El texto de cuerpo no debe ser
  menor de 20 px en una diapositiva de 16:9.

## 26. Aplicación en diagramas

Los diagramas de arquitectura, secuencia, clases, estados y flujo deben conservar su
notación técnica y adoptar la identidad visual de TicketRight.

### Colores semánticos

- Componentes principales o camino destacado: `--color-primary`.
- Componentes secundarios: `--color-surface-strong` con texto oscuro.
- Límites, grupos y relaciones: `--color-border` y `--color-text-muted`.
- Resultado correcto: `--color-success` acompañado de una etiqueta.
- Riesgo o atención: `--color-warning` acompañado de una etiqueta.
- Falla o rechazo: `--color-danger` acompañado de una etiqueta.

### Reglas

- Cada diagrama debe tener título, propósito, leyenda y nivel de abstracción declarado.
- Los nombres deben coincidir con el modelo de dominio y los ADR.
- Se usan rectángulos con radio entre 8 y 12 px, borde de 1 px y rellenos suaves.
- Las flechas deben indicar dirección y, cuando sea necesario, protocolo o dato transportado.
- El color no sustituye el tipo de línea, la etiqueta o el símbolo de una relación.
- Se evita cruzar líneas y mezclar arquitectura de referencia con implementación.
- Un diagrama debe poder leerse en una pantalla o diapositiva sin ampliar de forma extrema.
- Si el contenido no cabe, se divide por vista, escenario o nivel de detalle.
- La exportación debe mantener contraste, nitidez y márgenes en fondo claro.

## 27. Reglas de implementación

Al extender o recrear una pieza de TicketRight:

- conservar la jerarquía visual existente;
- reutilizar patrones antes de crear otros;
- mantener constante la separación entre secciones;
- no introducir colores fuera de los tokens sin justificarlo;
- usar una sola familia de iconos;
- priorizar la lectura del negocio sobre la decoración;
- evitar tarjetas grandes para contenidos mínimos;
- mantener estructurados el Canvas y los OKR;
- probar escritorio, tableta y móvil;
- mantener accesibilidad y foco de teclado visible;
- preferir variables y tokens frente a valores repetidos;
- conservar animaciones discretas;
- evitar desplazamiento horizontal en todos los tamaños admitidos.

## 28. Lista de verificación visual

Una pieza es consistente con este sistema cuando:

- usa un contenedor centrado o una retícula equivalente;
- distingue con claridad el título principal y los títulos de sección;
- mantiene cómodo el ancho de lectura;
- usa bordes, radios y rellenos coherentes;
- reserva el color de acento para información importante;
- deja suficiente separación entre secciones;
- mantiene legible el Canvas en móvil;
- distingue objetivos de resultados clave;
- ofrece estados visibles al cursor y al foco de teclado;
- no introduce un estilo ajeno en un componente;
- evita desplazamiento horizontal;
- usa efectos decorativos que no compiten con el contenido;
- mantiene presentaciones y diagramas dentro de la misma identidad visual.

## 29. Resultado esperado

La experiencia final debe sentirse como una presentación digital de negocio cuidada, no
como un panel genérico ni como un documento académico denso.

La información de TicketRight debe poder comprenderse en pocos minutos y, al mismo tiempo,
permitir una lectura más profunda de cada sección.
