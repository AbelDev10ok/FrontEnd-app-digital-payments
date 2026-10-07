import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { tones, neutral, radius } from '@/shared/theme';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const toneConfig: Record<AlertTone, { wrapper: string; icon: ReactNode; iconColor: string }> = {
  info: {
    wrapper: `${tones.brand.bg} ${tones.brand.border} text-brand-900`,
    icon: <Info className="w-5 h-5" />,
    iconColor: tones.brand.icon,
  },
  success: {
    wrapper: `${tones.success.bg} ${tones.success.border} text-emerald-900`,
    icon: <CheckCircle2 className="w-5 h-5" />,
    iconColor: tones.success.icon,
  },
  warning: {
    wrapper: `${tones.warning.bg} ${tones.warning.border} text-amber-900`,
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: tones.warning.icon,
  },
  danger: {
    wrapper: `${tones.danger.bg} ${tones.danger.border} text-red-900`,
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: tones.danger.icon,
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
    <div className={`p-4 border ${radius.md} flex items-start gap-3 ${t.wrapper}`}>
      <span className={`flex-shrink-0 ${t.iconColor}`}>{t.icon}</span>
      <div>
        {title && <p className={`font-semibold mb-1 ${neutral.primary}`}>{title}</p>}
        <div className={`text-sm ${neutral.body}`}>{children}</div>
      </div>
    </div>
  );
}
