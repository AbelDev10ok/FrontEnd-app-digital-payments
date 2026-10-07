import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

/**
 * Precio placeholder: se define definitivamente junto con la integración
 * de MercadoPago (Fase 12). Cambiar solo este valor.
 */
const PRECIO_PLAN_MENSUAL = '$15.000';

const INCLUYE = [
  'Ventas a crédito y préstamos ilimitados',
  'Clientes y vendedores sin límite',
  'Cronograma de cuotas con cobro y posposición',
  'Dashboard con tus números del mes',
];

const Precios: React.FC = () => {
  useEffect(() => {
    document.title = 'Precios · Cobros&Ventas';
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <PublicHeader variant="page" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Link>

        <h1 className="font-display mt-6 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl">
          Un plan. Todo incluido.
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-gray-600">
          Sin niveles ni sorpresas: una suscripción mensual con todas las funciones
          de la app para tu negocio.
        </p>

        <article className="mt-10 overflow-hidden rounded-card border border-gray-200 shadow-card">
          <div className="border-b border-dashed border-gray-200 bg-brand-950 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">
              Plan único
            </p>
            <p className="font-display mt-2 text-5xl font-black tracking-tight">
              {PRECIO_PLAN_MENSUAL}
              <span className="ml-1 text-base font-semibold text-brand-200">/mes</span>
            </p>
          </div>

          <div className="bg-white p-8">
            <ul className="space-y-3">
              {INCLUYE.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="mt-8 block rounded-lg bg-brand-600 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Empezar ahora
            </Link>
            <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
              El pago se administra con MercadoPago. Podés cancelar cuando quieras;
              tus datos no se borran.
            </p>
          </div>
        </article>

        <section aria-label="Preguntas sobre el plan" className="mt-12 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              ¿Puedo probar antes de pagar?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              Sí. Al crear tu cuenta podés usar la app y decidir después si te sirve.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              ¿Qué pasa si cancelo?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              La cuenta queda pausada y tus datos se conservan: al volver a suscribirte,
              todo sigue donde lo dejaste.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Precios;
