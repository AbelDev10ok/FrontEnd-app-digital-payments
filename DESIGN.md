---
name: Cobros&Ventas
description: Registro operativo y claro de ventas a cuotas, préstamos y cobros.
colors:
  brand-primary: "#1a8059"
  brand-deep: "#07261c"
  brand-soft: "#eefaf4"
  neutral-bg: "#f9fafb"
  neutral-surface: "#ffffff"
  neutral-text: "#111827"
  neutral-muted: "#6b7280"
  neutral-border: "#f3f4f6"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.1em"
rounded:
  control: "0.75rem"
  card: "1rem"
  nav: "0.5rem"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.brand-deep}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input-field:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.card}"
  navigation-active:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-primary}"
    rounded: "{rounded.nav}"
  filter-chip-selected:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-primary}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  section-label:
    textColor: "{colors.brand-primary}"
    typography: "600 11px ui-sans-serif, system-ui, sans-serif"
---

# Design System: Cobros&Ventas

## Overview

**Creative North Star: “Libro de caja vivo”**

La interfaz acompaña una operación cotidiana: registrar una venta o préstamo, ordenar sus cuotas y dejar asentado cada cobro. Su carácter es preciso y operativo. La identidad verde le da continuidad de marca, mientras el espacio, la jerarquía y los estados ayudan a encontrar rápido lo que el negocio necesita atender.

El sistema combina tipografía de títulos con personalidad y controles familiares de aplicación. Las superficies son claras; los acentos intensos se reservan para acciones, navegación activa y datos de estado. La densidad debe permitir revisar listas y cifras con rapidez en escritorio y seguir usando las tareas principales desde móvil.

**Key Characteristics:**
- Verde comercial activo como señal de marca y acción.
- Jerarquía compacta, títulos Archivo y etiquetas de sección espaciadas.
- Superficies claras con capas y sombras discretas.
- Estados semánticos distinguibles sin competir con el contenido.

## Colors

La paleta parte de un verde comercial profundo y lo equilibra con neutrales fríos, blancos y tonos semánticos convencionales.

### Primary
- **Verde comercial activo** (`brand-primary`): acciones principales, navegación seleccionada, iconos de marca y datos que requieren énfasis.
- **Verde bosque** (`brand-deep`): títulos de página y texto de alto contraste sobre fondos claros.
- **Menta de marca** (`brand-soft`): fondos de selección, agrupaciones suaves y estados activos de navegación.

### Neutral
- **Niebla clara** (`neutral-bg`): fondo general de la aplicación.
- **Papel blanco** (`neutral-surface`): tarjetas, campos y superficies de trabajo.
- **Tinta de trabajo** (`neutral-text`): títulos y valores principales.
- **Grafito secundario** (`neutral-muted`): ayudas, metadatos y etiquetas secundarias.
- **Borde vaporoso** (`neutral-border`): separación sutil entre superficies.

### Named Rules
**The Green Has a Job Rule.** El verde más intenso identifica marca, acción o selección; no sustituye los tonos semánticos de éxito, advertencia y error.

## Typography

**Display Font:** Archivo (con ui-sans-serif como fallback)  
**Body Font:** ui-sans-serif / system-ui (con los fallbacks del sistema)  
**Label/Mono Font:** system-ui para etiquetas; monoespaciada del sistema para importes y cifras tabulares.

**Character:** Archivo da presencia a los encabezados sin convertir la aplicación en una pieza editorial. El cuerpo del sistema mantiene lectura familiar y eficiente; los importes usan cifras tabulares para que las columnas se comparen con facilidad.

### Hierarchy
- **Display** (800, 24px, tracking ajustado): encabezados de página y títulos principales.
- **Headline** (700–800, 20px, tracking ajustado): títulos de tarjetas y bloques importantes.
- **Title** (600–700, 16–18px): títulos de modales y elementos de navegación.
- **Body** (400, 14–16px, line-height 1.5): formularios, descripciones y lectura general.
- **Label** (600, 11–12px, tracking amplio, mayúsculas cuando es eyebrow): etiquetas de sección, tablas y metadatos.

### Named Rules
**The Scan Before Read Rule.** En listados y resúmenes, los nombres, estados y montos deben poder localizarse antes de leer el texto auxiliar.

## Layout

La aplicación usa un shell operativo con navegación lateral fija de 256px en escritorio y menú lateral desplegable en móvil. El encabezado permanece visible durante el desplazamiento; el contenido principal empieza con padding de 16px y pasa a 24px desde el breakpoint `md` de Tailwind. Se usan grids responsive de una o dos columnas para formularios y tarjetas, y las tablas conservan una jerarquía compacta.

El ritmo parte de la escala de 4px de Tailwind: 8px para agrupaciones cercanas, 16px para padding estándar, 24px para separación de secciones y 32px para cambios de bloque. Mantener aire alrededor de los grupos, no entre cada dato individual.

## Elevation & Depth

La profundidad es de **capas suaves**. El fondo gris muy claro distingue el espacio de trabajo; tarjetas blancas y bordes tenues crean agrupaciones. Las sombras de tarjeta son ambientales y ligeras, con un refuerzo pequeño al pasar el cursor. Encabezados sticky y modales usan elevación funcional; evitar que cada elemento parezca flotante.

### Shadow Vocabulary
- **Tarjeta** (`shadow-card`): separación sutil y estable sobre el fondo de la página.
- **Tarjeta interactiva** (`shadow-card-hover`): elevación breve al pasar el cursor sobre superficies accionables.
- **Acción primaria** (`shadow-lg` tintada en marca): realce localizado del botón principal.
- **Modal** (`shadow-xl`): separación clara respecto del overlay oscurecido.

### Named Rules
**The Surface Does the Grouping Rule.** Priorizar fondo y borde para agrupar; reservar sombras más fuertes para modales o acciones elevadas.

## Shapes

Las formas son redondeadas, consistentes y funcionales: tarjetas de 16px, campos y botones de 12px, navegación de 8px y chips completamente redondeados. Los bordes son finos y de bajo contraste. Evitar contornos gruesos que añadan ruido a tablas y formularios.

## Components

### Buttons
- **Shape:** esquinas suaves y compactas (12px), peso semibold y área de interacción cómoda.
- **Primary:** verde de marca con texto blanco; tamaño medio de 16px horizontal y 10px vertical.
- **Hover / Focus:** oscurecimiento de marca y anillo visible con offset; estados disabled reducen opacidad y bloquean el cursor.
- **Secondary / Ghost / Tertiary:** secundaria blanca con borde neutro; ghost usa texto neutro y fondo solo al interactuar; variantes de peligro usan rojo semántico.

### Chips
- **Style:** etiquetas compactas; filtros con texto neutro y puntos de estado semánticos.
- **State:** selección con fondo menta, texto verde y aro/borde suave; no seleccionado sin superficie persistente.

### Cards / Containers
- **Corner Style:** redondeo consistente de 16px.
- **Background:** blanco sobre el fondo gris de la aplicación.
- **Shadow Strategy:** sombra tenue más borde neutro; hover solo cuando la tarjeta es interactiva.
- **Internal Padding:** varía entre 16px y 24px según la densidad del contenido.

### Inputs / Fields
- **Style:** fondo blanco, borde gris fino, esquinas de 12px y padding de 16px horizontal.
- **Focus:** anillo de 2px en verde de marca con cambio de borde.
- **Error / Disabled:** error rojo semántico; disabled con opacidad y cursor bloqueado.

### Navigation
- **Style:** lateral en escritorio, drawer en móvil; tipografía de 14px, iconos lineales y etiquetas de sección en eyebrow verde.
- **Default / Hover / Active:** texto gris; hover sobre fondo neutro; activo sobre menta con texto verde y sombra mínima.

### Summary Cards
- **Style:** métricas e importes usan cifras tabulares; el estado se comunica mediante tonos semánticos y no solo por color.

## Do's and Don'ts

### Do:
- **Do** usar el verde de marca para acciones principales y navegación activa.
- **Do** usar `font-mono tabular-nums` para importes y columnas numéricas alineadas.
- **Do** mantener visibles los estados con color semántico, texto y una etiqueta comprensible.
- **Do** preferir fondo y borde para agrupar; aplicar elevación según la función.
- **Do** conservar layouts responsive y áreas táctiles utilizables en móvil.

### Don't:
- **Don't** usar el verde de marca como sustituto de colores de éxito, advertencia o error.
- **Don't** añadir sombras fuertes a todas las tarjetas o controles.
- **Don't** reducir la jerarquía de estados a color sin texto o forma auxiliar.
- **Don't** inventar nuevas escalas de radio o tipografías cuando los tokens existentes cubren el componente.
