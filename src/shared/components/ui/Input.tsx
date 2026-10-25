import type { InputHTMLAttributes } from 'react';
import { mergeDescribedBy, useFieldA11y } from './fieldA11y';

// El foco solo cambia borde y anillo: se nombran esas propiedades (nunca
// `transition-all`) y se limita a 150ms por ser una interacción frecuente.
export const inputBaseClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-input transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export default function Input({ className = '', invalid = false, ...rest }: InputProps) {
  const field = useFieldA11y();
  const isInvalid = invalid || Boolean(field.invalid);
  const invalidClass = isInvalid
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : '';
  // El campo (Field) aporta el id del mensaje de error/hint; lo sumamos a lo
  // que ya traiga el control para no pisar descripciones explícitas.
  const describedBy = mergeDescribedBy(rest['aria-describedby'], field.describedBy);
  return (
    <input
      {...rest}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
      className={`${inputBaseClass} ${invalidClass} ${className}`}
    />
  );
}
