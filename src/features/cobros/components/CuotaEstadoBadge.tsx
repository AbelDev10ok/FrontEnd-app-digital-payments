import type { CuotaItem } from '@/shared/types/business';
import { tones } from '@/shared/theme';

const TONOS: Record<string, string> = {
  TODAY: `${tones.warning.bg} ${tones.warning.text} ${tones.warning.border}`,
  DELAYED: `${tones.danger.bg} ${tones.danger.text} ${tones.danger.border}`,
  UPCOMING: 'bg-gray-50 text-gray-600 border-gray-200',
  PAID: `${tones.success.bg} ${tones.success.text} ${tones.success.border}`,
};

const ETIQUETAS: Record<string, string> = {
  TODAY: 'Vence hoy',
  DELAYED: 'Vencida',
  UPCOMING: 'Próxima',
  PAID: 'Pagada',
};

export default function CuotaEstadoBadge({ cuota }: { cuota: CuotaItem }) {
  const tono = TONOS[cuota.estado] ?? TONOS.UPCOMING;
  let etiqueta = ETIQUETAS[cuota.estado] ?? cuota.estado;
  if (cuota.estado === 'DELAYED' && cuota.diasAtraso > 0) {
    etiqueta = `${etiqueta} · ${cuota.diasAtraso} ${cuota.diasAtraso === 1 ? 'día' : 'días'}`;
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tono}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {etiqueta}
    </span>
  );
}
