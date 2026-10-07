import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const SECCIONES = [
  {
    titulo: '1. Qué es Cobros&Ventas',
    cuerpo:
      'Cobros&Ventas es una aplicación web para gestionar ventas a crédito y préstamos: registro de clientes, cronogramas de cuotas, cobros y reportes del negocio.',
  },
  {
    titulo: '2. Cuenta y suscripción',
    cuerpo:
      'El uso de la aplicación requiere una suscripción mensual vigente, que se administra mediante MercadoPago. La suscripción puede cancelarse en cualquier momento; al cancelar, la cuenta queda pausada pero los datos no se eliminan.',
  },
  {
    titulo: '3. Responsabilidad sobre los datos',
    cuerpo:
      'Cada usuario es responsable de la veracidad de la información que registra (clientes, ventas, pagos) y de mantener la confidencialidad de sus credenciales de acceso.',
  },
  {
    titulo: '4. Uso aceptable',
    cuerpo:
      'La aplicación no puede utilizarse para actividades ilícitas ni para operar como entidad financiera regulada. Cada usuario opera bajo su propia responsabilidad legal y fiscal.',
  },
  {
    titulo: '5. Disponibilidad del servicio',
    cuerpo:
      'Trabajamos para que el servicio esté disponible de forma continua, aunque no garantizamos ausencia total de interrupciones por mantenimiento o causas ajenas.',
  },
  {
    titulo: '6. Cambios en estos términos',
    cuerpo:
      'Estos términos pueden actualizarse. Los cambios relevantes se comunicarán dentro de la aplicación antes de entrar en vigor.',
  },
];

const Terminos: React.FC = () => {
  useEffect(() => {
    document.title = 'Términos y condiciones · Cobros&Ventas';
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <PublicHeader variant="page" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Link>

        <h1 className="font-display mt-6 text-3xl font-black tracking-tight text-brand-950">
          Términos y condiciones
        </h1>
        <p className="mt-2 text-sm text-gray-500">Última actualización: agosto de 2026</p>

        <div className="mt-8 space-y-6">
          {SECCIONES.map((seccion) => (
            <section key={seccion.titulo}>
              <h2 className="text-base font-bold text-gray-900">{seccion.titulo}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{seccion.cuerpo}</p>
            </section>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Terminos;
