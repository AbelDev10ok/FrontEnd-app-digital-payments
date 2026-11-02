import type { HTMLAttributes } from 'react';

export default function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-surface rounded-card shadow-card border border-gray-100 ${className}`} {...rest} />;
}
