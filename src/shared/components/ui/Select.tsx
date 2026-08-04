import type { SelectHTMLAttributes } from 'react';

export default function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-4 py-2.5 border border-gray-200 rounded-input bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${className}`}
      {...rest}
    />
  );
}
