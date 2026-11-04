import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'brandSoft'
  | 'dangerOutline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  /** Desactiva el scale-on-press donde el movimiento distraería. */
  static?: boolean;
}

/** Enlace de navegación con la apariencia de un botón (mismo estilo y press feedback). */
export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  to: string;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

// Feedback táctil al presionar: siempre 0.96 (nunca por debajo de 0.95).
const tapScale = 'active:scale-[0.96] motion-reduce:active:scale-100';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-action text-white shadow-lg shadow-brand-600/20 hover:bg-action-hover focus-visible:outline-brand-600',
  secondary:
    'border border-gray-200 bg-surface text-brand-800 hover:bg-brand-50 focus-visible:outline-brand-600',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-gray-400',
  danger:
    'bg-danger-solid text-white shadow-lg shadow-red-600/20 hover:bg-danger-solid-hover focus-visible:outline-red-600',
  brandSoft:
    'bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100 focus-visible:outline-brand-600',
  dangerOutline:
    'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 focus-visible:outline-red-600',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  children,
  disabled,
  className = '',
  type = 'button',
  static: isStatic = false,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${isStatic ? '' : tapScale} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  to,
  children,
  className = '',
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={`${base} ${tapScale} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
