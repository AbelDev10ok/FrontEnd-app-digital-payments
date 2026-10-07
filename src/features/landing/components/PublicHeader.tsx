import { Link, NavLink } from 'react-router-dom';
import { Wallet } from 'lucide-react';

interface PublicHeaderProps {
  /** Enlaces internos de la landing (anclas de la misma página o rutas). */
  variant?: 'home' | 'page';
}

const NAV_HOME = [
  { label: 'Funciones', href: '/#funciones' },
  { label: 'Cómo funciona', href: '/#como-funciona' },
  { label: 'Preguntas', href: '/#preguntas' },
];

const PublicHeader: React.FC<PublicHeaderProps> = ({ variant = 'home' }) => (
  <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
          <Wallet className="h-5 w-5 text-white" aria-hidden="true" />
        </span>
        <span className="font-display text-lg font-extrabold tracking-tight text-brand-950">
          Cobros<span className="text-brand-600">&amp;</span>Ventas
        </span>
      </Link>

      <nav aria-label="Principal" className="hidden items-center gap-7 md:flex">
        {variant === 'home' &&
          NAV_HOME.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-700"
            >
              {item.label}
            </a>
          ))}
        <NavLink
          to="/precios"
          className={({ isActive }) =>
            `text-sm font-medium transition-colors ${
              isActive ? 'text-brand-700' : 'text-gray-600 hover:text-brand-700'
            }`
          }
        >
          Precios
        </NavLink>
      </nav>

      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-brand-700"
        >
          Entrar
        </Link>
        <Link
          to="/register"
          className="rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Probar la app
        </Link>
      </div>
    </div>
  </header>
);

export default PublicHeader;
