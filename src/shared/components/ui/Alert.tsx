import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const toneConfig: Record<AlertTone, { wrapper: string; icon: ReactNode; iconColor: string }> = {
  info: {
    wrapper: 'bg-brand-50 border-brand-200 text-brand-900',
    icon: <Info className="w-5 h-5" />,
    iconColor: 'text-brand-600',
  },
  success: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="w-5 h-5" />,
    iconColor: 'text-emerald-600',
  },
  warning: {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: 'text-amber-600',
  },
  danger: {
    wrapper: 'bg-red-50 border-red-200 text-red-900',
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: 'text-red-600',
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}

export default function Alert({ tone = 'info', title, children }: AlertProps) {
  const t = toneConfig[tone];
  return (
    <div className={`p-4 border rounded-xl flex items-start gap-3 ${t.wrapper}`}>
      <span className={`flex-shrink-0 ${t.iconColor}`}>{t.icon}</span>
      <div>
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
