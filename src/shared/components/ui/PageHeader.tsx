import type { ReactNode } from 'react';
import { tones, heading, eyebrow, neutral } from '@/shared/theme';

export interface PageHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Etiqueta superior en estilo "eyebrow" de la landing (mayúsculas espaciadas). */
  eyebrow?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, eyebrow: eyebrowContent, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`w-12 h-12 ${tones.brand.bg} border ${tones.brand.border} rounded-2xl flex items-center justify-center`}>
            {icon}
          </div>
        )}
        <div>
          {eyebrowContent && (
            <p className={`${eyebrow.hero} mb-0.5`}>
              {eyebrowContent}
            </p>
          )}
          {title && (
            <h1 className={heading.xl}>
              {title}
            </h1>
          )}
          {subtitle && <p className={`mt-1 text-sm ${neutral.muted}`}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
