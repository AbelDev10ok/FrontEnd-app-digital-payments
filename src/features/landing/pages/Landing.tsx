import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  HandCoins,
  BarChart3,
  CalendarClock,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  Coins,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import CronogramaDemo from '../components/CronogramaDemo';
import { tones, eyebrow, neutral } from '@/shared/theme';

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: 'Cronograma automático',
    description:
      'Registrás la venta o el préstamo con cliente, monto y cuotas. Las fechas de cobro quedan calculadas y a la vista.',
  },
  {
    icon: HandCoins,
    title: 'Cobro con un toque',
    description:
      'Cuando el cliente paga, marcás la cuota como pagada y el total pendiente se actualiza solo.',
  },
  {
    icon: CalendarClock,
    title: 'Posponer sin romper el plan',
    description:
      'El cliente no pudo pagar: movés la cuota a otra fecha y el resto del cronograma se reordena.',
  },
  {
    icon: BarChart3,
    title: 'Tus números claros',
    description:
      'Cuánto vendiste, cuánto cobraste y cuánto te deben este mes, con alertas de cuotas vencidas.',
  },
];

const CONFIANZA = [
  {
    icon: Smartphone,
    texto: 'Funciona en el celular',
  },
  {
    icon: ShieldCheck,
    texto: 'Tus datos son privados',
  },
  {
    icon: CheckCircle2,
    texto: 'Probá antes de pagar',
  },
];

const PASOS = [
  {
    titulo: 'Registrá la venta o el préstamo',
    descripcion: 'Cliente, monto y cantidad de cuotas. El cronograma de pagos sale solo.',
  },
  {
    titulo: 'Cobrá cada semana',
    descripcion: 'Entrás a la venta, marcás la cuota pagada o la posponés si hace falta.',
  },
  {
    titulo: 'Mirá tus números',
    descripcion: 'El dashboard te muestra lo vendido, lo cobrado y lo pendiente del mes.',
  },
];

/** Ejemplo de cifras del dashboard; los importes suman: 840 + 320 + 40 = 1.200. */
const NUMEROS_EJEMPLO = [
  {
    etiqueta: 'Vendido',
    valor: '$1.200.000',
    detalle: '12 ventas al crédito y 3 préstamos',
    accent: tones.neutral.accent,
    valorClass: neutral.primary,
  },
  {
    etiqueta: 'Cobrado',
    valor: '$840.000',
    detalle: '8 de 10 cuotas pagadas',
    accent: tones.success.accent,
    valorClass: tones.success.text,
  },
  {
    etiqueta: 'Próximo',
    valor: '$320.000',
    detalle: '4 cuotas para este mes',
    accent: tones.warning.accent,
    valorClass: tones.warning.text,
  },
  {
    etiqueta: 'Vencido',
    valor: '$40.000',
    detalle: '1 cuota a cobrar',
    accent: tones.danger.accent,
    valorClass: tones.danger.text,
  },
];

const NEGOCIOS = [
  {
    icon: ShoppingBag,
    titulo: 'Ventas a crédito',
    descripcion:
      'Vendés hoy y cobrás en cuotas semanales o mensuales. Cada venta lleva su cronograma y su estado: activa, completada o a cobrar.',
  },
  {
    icon: Coins,
    titulo: 'Préstamos',
    descripcion:
      'Definís capital, interés y cantidad de cuotas; el total a pagar y el valor de cada cuota quedan calculados.',
  },
];

const FAQ = [
  {
    pregunta: '¿Necesito saber de números?',
    respuesta:
      'No. Vos cargás la venta y las cuotas; la app calcula totales, interés del préstamo y lo que falta cobrar.',
  },
  {
    pregunta: '¿Funciona en el celular?',
    respuesta:
      'Sí, está pensada para usarse desde el teléfono: cobrás en la calle y consultás tus números en cualquier momento.',
  },
  {
    pregunta: '¿Mis clientes pueden ver mis datos?',
    respuesta:
      'No. Tu cuenta es privada: solo vos ves tus clientes, tus ventas y tus cobros.',
  },
  {
    pregunta: '¿Qué pasa si dejo de pagar la suscripción?',
    respuesta:
      'Tu cuenta queda pausada pero no se borra nada. Cuando volvés a pagar, todo sigue donde lo dejaste.',
  },
  {
    pregunta: '¿Cuánto cuesta?',
    respuesta:
      'Un único plan mensual con todo incluido. Mirá el detalle en la página de precios.',
  },
];

const Landing: React.FC = () => {
  useEffect(() => {
    document.title = 'Cobros&Ventas · Gestioná tus ventas y préstamos a cuotas';
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_-10%,#d7f2e4_0%,transparent_60%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2">
          <div>
            <p
              className={`animate-fade-up ${eyebrow.hero} motion-reduce:animate-none`}
            >
              Para quien vende al crédito
            </p>
            <h1
              className="animate-fade-up font-display mt-3 text-4xl font-black leading-tight tracking-tight text-brand-950 sm:text-5xl motion-reduce:animate-none"
              style={{ animationDelay: '80ms' }}
            >
              Dejá de anotar las cuotas a mano
            </h1>
            <p
              className="animate-fade-up mt-5 max-w-md text-lg leading-relaxed text-gray-600 motion-reduce:animate-none"
              style={{ animationDelay: '160ms' }}
            >
              Registrá ventas y préstamos, cobrá cada cuota con un toque y mirá
              cuánto te deben. Todo desde el celular.
            </p>
            <div
              className="animate-fade-up mt-8 flex flex-wrap items-center gap-3 motion-reduce:animate-none"
              style={{ animationDelay: '240ms' }}
            >
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Probar la app
              </Link>
              <a
                href="#como-funciona"
                className="rounded-lg px-6 py-3 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
              >
                Cómo funciona
              </a>
            </div>
            <ul
              className="animate-fade-up mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 motion-reduce:animate-none"
              style={{ animationDelay: '320ms' }}
            >
              {CONFIANZA.map((item) => (
                <li key={item.texto} className="flex items-center gap-1.5">
                  <item.icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  {item.texto}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <CronogramaDemo />
          </div>
        </div>
      </section>

      {/* Funciones */}
      <section id="funciones" className="scroll-mt-16 border-t border-gray-100 bg-gray-50/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <p className={`${eyebrow.section} text-brand-600`}>Funciones</p>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
            Lo que hacés todos los días, más rápido
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-card border border-gray-100 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <feature.icon className="h-6 w-6 text-brand-600" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona (secuencia real: 1 → 2 → 3) */}
      <section id="como-funciona" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
            Cómo funciona
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {PASOS.map((paso, index) => (
              <li
                key={paso.titulo}
                className="rounded-card border border-gray-100 bg-white p-6 shadow-card"
              >
                <span
                  aria-hidden="true"
                  className="font-display flex h-10 w-10 items-center justify-center rounded-xl bg-brand-950 text-base font-extrabold text-brand-100"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-bold text-gray-900">{paso.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{paso.descripcion}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Números del mes (datos de ejemplo, misma semántica que el dashboard) */}
      <section className="border-t border-gray-100 bg-gray-50/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="max-w-md">
            <p className={`${eyebrow.section} text-brand-600`}>Tus números</p>
            <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
              Tu mes a un vistazo
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Así se mira en el dashboard: lo vendido, lo cobrado y lo que falta.
              Datos de ejemplo.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {NUMEROS_EJEMPLO.map((n) => (
              <div
                key={n.etiqueta}
                className="relative overflow-hidden rounded-card border border-gray-100 bg-white p-5 shadow-card"
              >
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${n.accent}`} />
                <p className={`${eyebrow.section} text-gray-500`}>{n.etiqueta}</p>
                <p
                  className={`mt-2 font-mono text-xl font-bold tabular-nums sm:text-2xl ${n.valorClass}`}
                >
                  {n.valor}
                </p>
                <p className="mt-1 text-xs text-gray-500">{n.detalle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dos negocios: el modelo real del dominio */}
      <section className="bg-brand-950">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <p className={`${eyebrow.section} text-brand-300`}>El producto</p>
          <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Hecho para dos negocios
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {NEGOCIOS.map((negocio) => (
              <article key={negocio.titulo} className="rounded-card border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <negocio.icon className="h-5 w-5 text-brand-300" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-white">{negocio.titulo}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-brand-100/90">
                  {negocio.descripcion}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section id="preguntas" className="scroll-mt-16">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-20">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
            Preguntas frecuentes
          </h2>
          <div className="mt-8 divide-y divide-gray-200 rounded-card border border-gray-200 bg-white">
            {FAQ.map((item) => (
              <details key={item.pregunta} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  {item.pregunta}
                  <span
                    aria-hidden="true"
                    className="text-brand-600 transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-gray-100 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
            Probalo hoy, cobrá mejor mañana
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
            Cargá tu primera venta en minutos y dejá la libreta de papel.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/precios"
              className="inline-block rounded-lg bg-brand-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Ver precios y empezar
            </Link>
            <a
              href="#como-funciona"
              className="inline-block rounded-lg px-6 py-3 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              Cómo funciona
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Landing;
