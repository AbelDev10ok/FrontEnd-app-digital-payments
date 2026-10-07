/**
 * Tokens de diseño del design-system.
 *
 * Centralizan los estilos semánticos (estados, métricas, encabezados, bordes)
 * que antes estaban hardcodeados en cada componente, para que las decisiones
 * visuales (tonos, fondos de badge en -50, tipografía de eyebrows) vivan en un
 * único lugar.
 *
 * Se consumen como clases Tailwind: `tokens.tones.brand.bg`, etc.
 */

/** Neutrales: escala de texto/fondos primarios del producto. */
export const neutral = {
  /** Texto principal (títulos, valores destacados). */
  primary: 'text-gray-900',
  /** Texto de cuerpo y descripciones. */
  body: 'text-gray-700',
  /** Texto secundario (subtítulos, metadatos). */
  secondary: 'text-gray-600',
  /** Texto atenuado (hints, footnotes, placeholders). */
  muted: 'text-gray-500',
  /** Texto casi invisible (etiquetas decorativas). */
  subtle: 'text-gray-400',
} as const;

/** Fondos neutros para zonas/agrupaciones suaves. */
export const neutralBg = {
  soft: 'bg-gray-50',
  hover: 'hover:bg-gray-50',
  /** Cabecera de tablas (thead). */
  tableHeader: 'bg-gray-50/80',
} as const;

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

interface ToneConfig {
  /** Fondo suave (badge/stat/alerta). Decisión: usar -50, no -100. */
  bg: string;
  /** Barra/acento fuerte superior (StatCard) o marca sólida. */
  accent: string;
  /** Texto principal del tono (título, valor). */
  text: string;
  /** Texto sobre fondo `bg` (badge). Usa -700. */
  textStrong: string;
  /** Color del icono. */
  icon: string;
  /** Borde sutil del tono. */
  border: string;
}

const toneTokens: Record<Tone, ToneConfig> = {
  brand: {
    bg: 'bg-brand-50',
    accent: 'bg-brand-500',
    text: 'text-brand-700',
    textStrong: 'text-brand-700',
    icon: 'text-brand-600',
    border: 'border-brand-200',
  },
  success: {
    bg: 'bg-emerald-50',
    accent: 'bg-emerald-500',
    text: 'text-emerald-700',
    textStrong: 'text-emerald-700',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  warning: {
    bg: 'bg-amber-50',
    accent: 'bg-amber-500',
    text: 'text-amber-700',
    textStrong: 'text-amber-700',
    icon: 'text-amber-600',
    border: 'border-amber-200',
  },
  danger: {
    bg: 'bg-red-50',
    accent: 'bg-red-500',
    text: 'text-red-700',
    textStrong: 'text-red-700',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
  neutral: {
    bg: 'bg-gray-100',
    accent: 'bg-gray-400',
    text: 'text-gray-700',
    textStrong: 'text-gray-700',
    icon: 'text-gray-600',
    border: 'border-gray-200',
  },
} as const;

/** Tonos semánticos para badges, stats, alertas y chips de estado. */
export const tones: Record<Tone, ToneConfig> = toneTokens;

/** Tono del estado "Pagada" → emerald (decisión cerrada: NO brand). */
export const tonePaid: ToneConfig = toneTokens.success;

/** Eyebrows: etiquetas mayúsculas espaciadas en distintos contextos. */
export const eyebrow = {
  /** Eyebrow de sección (stats, bloques, páginas). */
  section: 'text-[11px] font-semibold uppercase tracking-widest',
  /** Eyebrow de cabecera de tabla (th). */
  table: 'text-[11px] font-semibold uppercase tracking-widest text-gray-500',
  /** Eyebrow de hero/landing (brand, más aire). */
  hero: 'text-xs font-semibold uppercase tracking-widest text-brand-600',
} as const;

/** Jerarquía de títulos en font-display. */
export const heading = {
  /** Título grande de página. */
  xl: 'font-display text-2xl font-extrabold tracking-tight text-brand-950',
  /** Segundo nivel (secciones dentro de la página). */
  lg: 'font-display text-xl font-extrabold tracking-tight text-brand-950',
} as const;

/** Radios de esquina del sistema. */
export const radius = {
  card: 'rounded-card',
  input: 'rounded-input',
  /** Contenedores/iconos medianos. */
  md: 'rounded-xl',
  /** Chips/badges de estado y pills. */
  pill: 'rounded-full',
} as const;
