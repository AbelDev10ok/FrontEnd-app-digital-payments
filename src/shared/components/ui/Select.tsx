import type { SelectHTMLAttributes } from 'react';
import { mergeDescribedBy, useFieldA11y } from './fieldA11y';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export default function Select({ className = '', invalid = false, ...rest }: SelectProps) {
  const field = useFieldA11y();
  const isInvalid = invalid || Boolean(field.invalid);
  const invalidClass = isInvalid
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : '';
  const describedBy = mergeDescribedBy(rest['aria-describedby'], field.describedBy);
  return (
    <select
      {...rest}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
      className={`w-full px-4 py-2.5 border border-gray-200 rounded-input bg-surface transition-[border-color,box-shadow] duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${invalidClass} ${className}`}
    />
  );
}
