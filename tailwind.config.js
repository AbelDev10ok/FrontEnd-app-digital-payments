/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /*
         * Tokens tematizados: sus valores viven como variables CSS en
         * `src/index.css` (`:root` claro / `html.dark` oscuro) y por eso
         * cambian sin tocar componentes. Los pasos no listados conservan la
         * escala literal de Tailwind (se usan para rellenos sólidos cuyo
         * contraste debe mantenerse en ambos temas).
         */
        page: 'rgb(var(--c-page) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        heading: 'rgb(var(--c-heading) / <alpha-value>)',
        // Acciones sólidas: verde de marca con texto blanco en ambos temas.
        action: {
          DEFAULT: '#1a8059',
          hover: '#166749',
        },
        'danger-solid': {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
        },
        // Superposición clara translúcida sobre paneles oscuros (landing).
        'on-dark': '#ffffff',
        gray: {
          50: 'rgb(var(--c-gray-50) / <alpha-value>)',
          100: 'rgb(var(--c-gray-100) / <alpha-value>)',
          200: 'rgb(var(--c-gray-200) / <alpha-value>)',
          300: 'rgb(var(--c-gray-300) / <alpha-value>)',
          400: 'rgb(var(--c-gray-400) / <alpha-value>)',
          500: 'rgb(var(--c-gray-500) / <alpha-value>)',
          600: 'rgb(var(--c-gray-600) / <alpha-value>)',
          700: 'rgb(var(--c-gray-700) / <alpha-value>)',
          800: 'rgb(var(--c-gray-800) / <alpha-value>)',
          900: 'rgb(var(--c-gray-900) / <alpha-value>)',
        },
        brand: {
          50: 'rgb(var(--c-brand-50) / <alpha-value>)',
          100: 'rgb(var(--c-brand-100) / <alpha-value>)',
          200: 'rgb(var(--c-brand-200) / <alpha-value>)',
          300: '#7fd2ac',
          400: '#4cb98a',
          500: '#2a9e70',
          600: 'rgb(var(--c-brand-600) / <alpha-value>)',
          700: 'rgb(var(--c-brand-700) / <alpha-value>)',
          800: 'rgb(var(--c-brand-800) / <alpha-value>)',
          900: 'rgb(var(--c-brand-900) / <alpha-value>)',
          950: '#07261c',
        },
        red: {
          50: 'rgb(var(--c-red-50) / <alpha-value>)',
          100: 'rgb(var(--c-red-100) / <alpha-value>)',
          200: 'rgb(var(--c-red-200) / <alpha-value>)',
          300: 'rgb(var(--c-red-300) / <alpha-value>)',
          600: 'rgb(var(--c-red-600) / <alpha-value>)',
          700: 'rgb(var(--c-red-700) / <alpha-value>)',
          800: 'rgb(var(--c-red-800) / <alpha-value>)',
          900: 'rgb(var(--c-red-900) / <alpha-value>)',
        },
        emerald: {
          50: 'rgb(var(--c-emerald-50) / <alpha-value>)',
          100: 'rgb(var(--c-emerald-100) / <alpha-value>)',
          200: 'rgb(var(--c-emerald-200) / <alpha-value>)',
          300: 'rgb(var(--c-emerald-300) / <alpha-value>)',
          600: 'rgb(var(--c-emerald-600) / <alpha-value>)',
          700: 'rgb(var(--c-emerald-700) / <alpha-value>)',
          800: 'rgb(var(--c-emerald-800) / <alpha-value>)',
          900: 'rgb(var(--c-emerald-900) / <alpha-value>)',
        },
        amber: {
          50: 'rgb(var(--c-amber-50) / <alpha-value>)',
          100: 'rgb(var(--c-amber-100) / <alpha-value>)',
          200: 'rgb(var(--c-amber-200) / <alpha-value>)',
          300: 'rgb(var(--c-amber-300) / <alpha-value>)',
          600: 'rgb(var(--c-amber-600) / <alpha-value>)',
          700: 'rgb(var(--c-amber-700) / <alpha-value>)',
          800: 'rgb(var(--c-amber-800) / <alpha-value>)',
          900: 'rgb(var(--c-amber-900) / <alpha-value>)',
        },
        purple: {
          50: 'rgb(var(--c-purple-50) / <alpha-value>)',
          100: 'rgb(var(--c-purple-100) / <alpha-value>)',
          200: 'rgb(var(--c-purple-200) / <alpha-value>)',
          300: 'rgb(var(--c-purple-300) / <alpha-value>)',
          600: 'rgb(var(--c-purple-600) / <alpha-value>)',
          700: 'rgb(var(--c-purple-700) / <alpha-value>)',
          800: 'rgb(var(--c-purple-800) / <alpha-value>)',
          900: 'rgb(var(--c-purple-900) / <alpha-value>)',
        },
      },
      borderRadius: {
        card: '1rem',
        input: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.08)',
        'card-hover': '0 4px 6px -1px rgb(16 24 40 / 0.08), 0 2px 4px -2px rgb(16 24 40 / 0.06)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Entrada de diálogos: aparecen, no saltan.
        'modal-overlay': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'modal-panel': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Confirmación de cobro: la fila cobrada se tiñe y se apaga.
        'paid-flash': {
          '0%': { backgroundColor: 'rgb(215 242 228)' },
          '100%': { backgroundColor: 'rgb(255 255 255 / 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'modal-overlay': 'modal-overlay 0.16s ease-out both',
        'modal-panel': 'modal-panel 0.18s cubic-bezier(0.2, 0, 0, 1) both',
        'paid-flash': 'paid-flash 1.4s ease-out both',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
