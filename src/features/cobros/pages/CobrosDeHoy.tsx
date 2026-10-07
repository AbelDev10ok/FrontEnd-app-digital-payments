import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Eye, HandCoins, Phone, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import PayFeeModal from '@/features/cobros/components/PayFeeModal';
import CuotaEstadoBadge from '@/features/cobros/components/CuotaEstadoBadge';
import type { CobrosHoyResponse, CuotaItem } from '@/shared/types/business';

interface CobrosDeHoyProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const formatearFecha = (iso: string) => iso.split('-').reverse().join('/');

const ResumenChip = ({
  titulo,
  cantidad,
  monto,
  tono,
}: {
  titulo: string;
  cantidad: number;
  monto: number;
  tono: 'amber' | 'red';
}) => (
  <Card className="flex-1 min-w-[220px] p-5">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{titulo}</p>
      <span
        className={`w-2 h-2 rounded-full ${tono === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`}
      />
    </div>
    <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-brand-950 tabular-nums">
      {formatCurrency(monto)}
    </p>
    <p className="mt-0.5 text-sm text-gray-500">
      {cantidad} {cantidad === 1 ? 'cuota pendiente' : 'cuotas pendientes'}
    </p>
  </Card>
);

const CobrosDeHoy: React.FC<CobrosDeHoyProps> = ({ user, onLogout }) => {
  const [data, setData] = useState<CobrosHoyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuotaACobrar, setCuotaACobrar] = useState<CuotaItem | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await collectionsService.getCobrosHoy());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los cobros del día');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <DashboardLayout title="Cobros de hoy" user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Operación · Agenda"
        title="Cobros de hoy"
        subtitle={
          data
            ? `Cuotas que vencen hoy y las ya vencidas · ${formatearFecha(data.fecha)}`
            : 'Cuotas que vencen hoy y las ya vencidas'
        }
        icon={<CalendarClock className="w-6 h-6 text-brand-600" />}
        actions={
          <Button variant="secondary" onClick={cargar} isLoading={loading} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Actualizar
          </Button>
        }
      />

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</Card>
      )}

      {data && (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <ResumenChip titulo="Vencen hoy" cantidad={data.hoy.cantidad} monto={data.hoy.monto} tono="amber" />
            <ResumenChip titulo="Vencidas" cantidad={data.vencidas.cantidad} monto={data.vencidas.monto} tono="red" />
          </div>

          <Card>
            {data.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                <h2 className="font-display text-lg font-bold text-brand-950">No hay cuotas por cobrar</h2>
                <p className="mt-1 text-sm text-gray-500">
                  No tenés cuotas vencidas ni con vencimiento en el día de la fecha.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-dashed divide-gray-100">
                {data.items.map((cuota) => (
                  <li key={cuota.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                    <div className="min-w-[180px] flex-1">
                      <p className="font-semibold text-brand-950">{cuota.clientName}</p>
                      <p className="mt-0.5 text-xs text-gray-500 truncate max-w-[280px]">
                        {cuota.saleDescription || 'Venta'}
                      </p>
                      {cuota.clientPhone && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="w-3 h-3" />
                          {cuota.clientPhone}
                        </p>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 whitespace-nowrap">
                      Cuota <span className="font-semibold text-brand-800">{cuota.numeroCuota}</span>
                      {cuota.totalCuotas ? ` de ${cuota.totalCuotas}` : ''}
                      <span className="block text-xs text-gray-400 mt-0.5">
                        Vencía el {formatearFecha(cuota.fechaVencimiento)}
                      </span>
                    </div>

                    <CuotaEstadoBadge cuota={cuota} />

                    <p className="font-mono text-base font-semibold tabular-nums text-brand-950 min-w-[110px] text-right">
                      {formatCurrency(cuota.monto ?? 0)}
                    </p>

                    <div className="flex items-center gap-2 ml-auto">
                      <Link
                        to={`/dashboard/ventas/${cuota.saleId}`}
                        aria-label={`Ver detalle de la venta de ${cuota.clientName}`}
                        className="p-2 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-brand-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Button size="sm" leftIcon={<HandCoins className="w-4 h-4" />} onClick={() => setCuotaACobrar(cuota)}>
                        Cobrar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {!loading && data.items.length > 0 && (
            <p className="mt-3 text-xs text-gray-400">
              Se muestran como máximo las 200 cuotas más antiguas pendientes de cobro.
            </p>
          )}
        </>
      )}

      <PayFeeModal cuota={cuotaACobrar} onClose={() => setCuotaACobrar(null)} onPaid={cargar} />
    </DashboardLayout>
  );
};

export default CobrosDeHoy;
