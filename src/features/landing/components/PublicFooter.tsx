import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';

const PublicFooter: React.FC = () => (
  <footer className="border-t border-gray-100 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:px-6 md:flex-row">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
          <Wallet className="h-4 w-4 text-white" aria-hidden="true" />
        </span>
        <span className="font-display text-sm font-extrabold tracking-tight text-brand-950">
          Cobros<span className="text-brand-600">&amp;</span>Ventas
        </span>
      </div>

      <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
        <Link to="/precios" className="transition-colors hover:text-brand-700">
          Precios
        </Link>
        <Link to="/terminos" className="transition-colors hover:text-brand-700">
          Términos y condiciones
        </Link>
        <Link to="/privacidad" className="transition-colors hover:text-brand-700">
          Política de privacidad
        </Link>
      </nav>

      <p className="text-sm text-gray-400">
        © {new Date().getFullYear()} Cobros&amp;Ventas
      </p>
    </div>
  </footer>
);

export default PublicFooter;
