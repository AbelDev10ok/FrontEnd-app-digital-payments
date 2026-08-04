import type { InputHTMLAttributes } from 'react';

export const inputBaseClass =
  'w-full px-4 py-2.5 border border-gray-200 rounded-input focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export default function Input({ className = '', invalid = false, ...rest }: InputProps) {
  const invalidClass = invalid
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : '';
  return <input className={`${inputBaseClass} ${invalidClass} ${className}`} {...rest} />;
}
