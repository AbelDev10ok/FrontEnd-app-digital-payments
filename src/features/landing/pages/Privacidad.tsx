import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const SECCIONES = [
  {
    titulo: '1. Qué datos recolectamos',
    cuerpo:
      'Los datos necesarios para crear tu cuenta (nombre, email) y los datos de tu negocio que cargás en la aplicación: clientes, vendedores, ventas, préstamos y cuotas.',
  },
  {
    titulo: '2. Para qué los usamos',
    cuerpo:
      'Exclusivamente para prestar el servicio: mostrar tu información dentro de tu cuenta, calcular cronogramas y reportes, y gestionar la suscripción.',
  },
  {
    titulo: '3. Quién puede ver tus datos',
    cuerpo:
      'Solo vos. Tu cuenta es privada: ningún otro usuario accede a tus clientes, ventas o cobros. No vendemos ni compartimos datos con terceros, salvo obligación legal.',
  },
  {
    titulo: '4. Proveedores que nos ayudan',
    cuerpo:
      'Usamos proveedores de hosting, base de datos y pagos (MercadoPago). Estos proveedores procesan datos únicamente para operar el servicio.',
  },
  {
    titulo: '5. Cuánto tiempo conservamos los datos',
    cuerpo:
      'Mientras la cuenta exista. Si cancelás la suscripción, la cuenta queda pausada y los datos se conservan; podés solicitar la eliminación definitiva cuando quieras.',
  },
  {
    titulo: '6. Seguridad',
    cuerpo:
      'Las contraseñas se guardan cifradas y el acceso usa tokens de sesión. Aun así, ninguna sistema es infalible: te recomendamos usar una contraseña única.',
  },
  {
    titulo: '7. Tus derechos',
    cuerpo:
      'Podés pedir en cualquier momento una copia de tus datos, su corrección o su eliminación definitiva escribiendo a soporte.',
  },
];

const Privacidad: React.FC = () => {
  useEffect(() => {
    document.title = 'Política de privacidad · Cobros&Ventas';
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
          Política de privacidad
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

export default Privacidad;
