import type { ReactNode } from 'react';
import Card from './Card';
import { tones, neutral, eyebrow, radius } from '@/shared/theme';

export type StatTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const toneConfig: Record<StatTone, { accent: string; iconBg: string; iconText: string; value: string }> = {
  brand: { accent: tones.brand.accent, iconBg: tones.brand.bg, iconText: tones.brand.icon, value: neutral.primary },
  success: { accent: tones.success.accent, iconBg: tones.success.bg, iconText: tones.success.icon, value: tones.success.text },
  warning: { accent: tones.warning.accent, iconBg: tones.warning.bg, iconText: tones.warning.icon, value: tones.warning.text },
  danger: { accent: tones.danger.accent, iconBg: tones.danger.bg, iconText: tones.danger.icon, value: tones.danger.text },
  neutral: { accent: tones.neutral.accent, iconBg: tones.neutral.bg, iconText: tones.neutral.icon, value: neutral.primary },
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  footnote?: ReactNode;
}

export default function StatCard({ label, value, icon, tone = 'brand', footnote }: StatCardProps) {
  const t = toneConfig[tone];
  return (
    <Card className="relative overflow-hidden p-6">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${t.accent}`} />
      <div className="flex items-center justify-between">
        <div>
          <p className={`${eyebrow.section} ${neutral.muted}`}>{label}</p>
          <p className={`mt-1.5 text-2xl font-display font-extrabold tracking-tight ${t.value}`}>{value}</p>
        </div>
        {icon && (
          <div className={`p-3 ${radius.md} ${t.iconBg}`}>
            <span className={`block ${t.iconText}`}>{icon}</span>
          </div>
        )}
      </div>
      {footnote && <div className={`mt-3 text-sm ${neutral.muted}`}>{footnote}</div>}
    </Card>
  );
}
