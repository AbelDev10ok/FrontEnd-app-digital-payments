import type { InputHTMLAttributes } from 'react';
import { mergeDescribedBy, useFieldA11y } from './fieldA11y';

export const inputBaseClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-input focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';

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
