import type { ReactNode } from 'react';
import { tones } from '@/shared/theme';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const toneClass: Record<BadgeTone, string> = {
  brand: `${tones.brand.bg} ${tones.brand.text} ${tones.brand.border.replace('border-', 'ring-')}`,
  success: `${tones.success.bg} ${tones.success.text} ${tones.success.border.replace('border-', 'ring-')}`,
  warning: `${tones.warning.bg} ${tones.warning.text} ${tones.warning.border.replace('border-', 'ring-')}`,
  danger: `${tones.danger.bg} ${tones.danger.text} ${tones.danger.border.replace('border-', 'ring-')}`,
  neutral: `${tones.neutral.bg} ${tones.neutral.text} ${tones.neutral.border.replace('border-', 'ring-')}`,
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export default function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
