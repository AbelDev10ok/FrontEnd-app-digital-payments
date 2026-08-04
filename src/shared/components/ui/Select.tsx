import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export default function Select({ className = '', invalid = false, ...rest }: SelectProps) {
  const invalidClass = invalid
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : '';
  return (
    <select
      className={`w-full px-4 py-2.5 border border-gray-200 rounded-input bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${invalidClass} ${className}`}
      {...rest}
    />
  );
}
