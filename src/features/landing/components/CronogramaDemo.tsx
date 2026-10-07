import { CheckCircle2, AlertTriangle, CircleDashed } from 'lucide-react';
import { tones, eyebrow, neutral, neutralBg } from '@/shared/theme';

interface CuotaDemo {
  numero: number;
  fecha: string;
  monto: string;
  estado: 'pagada' | 'vencida' | 'proxima';
}

const CUOTAS: CuotaDemo[] = [
  { numero: 1, fecha: '05 may', monto: '$15.000', estado: 'pagada' },
  { numero: 2, fecha: '12 may', monto: '$15.000', estado: 'pagada' },
  { numero: 3, fecha: '19 may', monto: '$15.000', estado: 'vencida' },
  { numero: 4, fecha: '26 may', monto: '$15.000', estado: 'proxima' },
];

const ESTADO_STYLES: Record<CuotaDemo['estado'], { label: string; icon: React.ReactNode; row: string; badge: string }> = {
  pagada: {
    label: 'Pagada',
    icon: <CheckCircle2 className={`h-5 w-5 ${tones.success.icon}`} aria-hidden="true" />,
    row: '',
    badge: `${tones.success.bg} ${tones.success.text}`,
  },
  vencida: {
    label: 'Vencida',
    icon: <AlertTriangle className={`h-5 w-5 ${tones.danger.icon}`} aria-hidden="true" />,
    row: `${tones.danger.bg}/70 -mx-3 px-3 rounded-lg`,
    badge: `${tones.danger.bg} ${tones.danger.text}`,
  },
  proxima: {
    label: 'Próxima',
    icon: <CircleDashed className={`h-5 w-5 ${tones.warning.icon}`} aria-hidden="true" />,
    row: '',
    badge: `${tones.warning.bg} ${tones.warning.text}`,
  },
};

/**
 * Elemento distintivo de la landing: el cronograma de cuotas del producto,
 * presentado como la libreta de cobros que reemplaza (estilo ticket).
 */
const CronogramaDemo: React.FC = () => (
  <div
    className="w-full max-w-sm rotate-1 rounded-card border border-gray-200 bg-white shadow-xl motion-reduce:rotate-0"
    aria-label="Ejemplo de cronograma de cuotas"
  >
    {/* Cabecera del ticket */}
    <div className="flex items-start justify-between p-5">
      <div>
        <p className={`${eyebrow.section} text-brand-600`}>
          Cronograma · Préstamo #12
        </p>
        <p className={`font-display mt-0.5 text-lg font-bold ${neutral.primary}`}>Ana Giménez</p>
      </div>
      <span className={`rounded-full ${neutralBg.soft} px-2.5 py-1 text-xs font-semibold ${neutral.secondary}`}>
        $60.000 total
      </span>
    </div>

    {/* Filas de cuotas */}
    <ul className="divide-y divide-dashed divide-gray-200 border-t border-dashed border-t-gray-300">
      {CUOTAS.map((cuota, index) => {
        const style = ESTADO_STYLES[cuota.estado];
        return (
          <li
            key={cuota.numero}
            className={`animate-fade-up flex items-center gap-3 py-3.5 pl-5 pr-5 motion-reduce:animate-none ${style.row}`}
            style={{ animationDelay: `${250 + index * 110}ms` }}
          >
            {style.icon}
            <span className={`text-sm font-medium ${neutral.primary}`}>Cuota {cuota.numero}</span>
            <span className={`font-mono text-xs ${neutral.subtle}`}>{cuota.fecha}</span>
            <span className={`ml-auto font-mono text-sm tabular-nums ${neutral.primary}`}>{cuota.monto}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}>
              {style.label}
            </span>
          </li>
        );
      })}
    </ul>

    {/* Progreso */}
    <div className="border-t border-dashed border-t-gray-300 p-5">
      <div className={`mb-2 flex items-center justify-between text-xs font-medium ${neutral.muted}`}>
        <span>Cobrado</span>
        <span className="font-mono tabular-nums">$30.000 de $60.000</span>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${neutralBg.soft}`}>
        <div
          className={`animate-fade-up h-full rounded-full ${tones.brand.accent} motion-reduce:animate-none`}
          style={{ width: '50%', animationDelay: '720ms' }}
        />
      </div>
    </div>
  </div>
);

export default CronogramaDemo;
