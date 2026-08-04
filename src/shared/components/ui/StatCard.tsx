import type { ReactNode } from 'react';
import Card from './Card';

export type StatTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const toneConfig: Record<StatTone, { accent: string; iconBg: string; iconText: string; value: string }> = {
  brand: { accent: 'bg-brand-500', iconBg: 'bg-brand-50', iconText: 'text-brand-600', value: 'text-gray-900' },
  success: { accent: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', value: 'text-emerald-700' },
  warning: { accent: 'bg-amber-500', iconBg: 'bg-amber-50', iconText: 'text-amber-600', value: 'text-amber-700' },
  danger: { accent: 'bg-red-500', iconBg: 'bg-red-50', iconText: 'text-red-600', value: 'text-red-700' },
  neutral: { accent: 'bg-gray-400', iconBg: 'bg-gray-100', iconText: 'text-gray-600', value: 'text-gray-900' },
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
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${t.value}`}>{value}</p>
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${t.iconBg}`}>
            <span className={`block ${t.iconText}`}>{icon}</span>
          </div>
        )}
      </div>
      {footnote && <div className="mt-3 text-sm text-gray-500">{footnote}</div>}
    </Card>
  );
}
