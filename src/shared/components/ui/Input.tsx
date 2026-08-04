import type { InputHTMLAttributes } from 'react';

export default function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-2.5 border border-gray-200 rounded-input focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${className}`}
      {...rest}
    />
  );
}
