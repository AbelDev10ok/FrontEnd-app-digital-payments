import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, HandCoins, ListChecks, Search } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Paginación from '@/shared/components/ui/Paginacion';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import {
  collectionsService,
  type CuotasFilters,
} from '@/features/cobros/services/collectionsService';
import PayFeeModal from '@/features/cobros/components/PayFeeModal';
import CuotaEstadoBadge from '@/features/cobros/components/CuotaEstadoBadge';
import type { CuotaEstadoFiltro, CuotaItem } from '@/shared/types/business';

interface CuotasProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const ESTADOS: { value: string; label: string }[] = [
  { value: 'PENDING', label: 'Todas las pendientes' },
  { value: 'TODAY', label: 'Vencen hoy' },
  { value: 'DELAYED', label: 'Vencidas' },
  { value: 'UPCOMING', label: 'Próximas' },
  { value: 'PAID', label: 'Pagadas' },
];

const formatearFecha = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '—');

const Cuotas: React.FC<CuotasProps> = ({ user, onLogout }) => {
  const [estado, setEstado] = useState<CuotaEstadoFiltro>('PENDING');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<CuotaItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuotaACobrar, setCuotaACobrar] = useState<CuotaItem | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: CuotasFilters = { page, size: 20, estado };
      if (desde) filters.desde = desde;
      if (hasta) filters.hasta = hasta;
      const respuesta = await collectionsService.getCuotas(filters);
      setItems(respuesta.content ?? []);
      setTotalPages(Math.max(1, respuesta.totalPages ?? 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las cuotas');
    } finally {
      setLoading(false);
    }
  }, [page, estado, desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarFiltros = (aplicar: () => void) => {
    setPage(0);
    aplicar();
  };

  return (
    <DashboardLayout title="Cuotas" user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Operación · Historial"
        title="Cuotas"
        subtitle="Todas las cuotas de tus ventas y préstamos, con filtros por estado y fecha"
        icon={<ListChecks className="w-6 h-6 text-brand-600" />}
      />

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-56">
            <label htmlFor="filtro-estado" className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <Select
              id="filtro-estado"
              value={estado}
              onChange={(e) =>
                cambiarFiltros(() => setEstado(e.target.value as CuotaEstadoFiltro))
              }
            >
              {ESTADOS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="filtro-desde" className="block text-sm font-medium text-gray-700 mb-2">
              Vence desde
            </label>
            <Input
              id="filtro-desde"
              type="date"
              value={desde}
              onChange={(e) => cambiarFiltros(() => setDesde(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="filtro-hasta" className="block text-sm font-medium text-gray-700 mb-2">
              Vence hasta
            </label>
            <Input
              id="filtro-hasta"
              type="date"
              value={hasta}
              onChange={(e) => cambiarFiltros(() => setHasta(e.target.value))}
            />
          </div>
          {(desde || hasta || estado !== 'PENDING') && (
            <Button
              variant="ghost"
              onClick={() =>
                cambiarFiltros(() => {
                  setDesde('');
                  setHasta('');
                  setEstado('PENDING');
                })
              }
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">Cargando cuotas…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Search className="w-10 h-10 text-gray-300 mb-3" />
            <h2 className="font-display text-lg font-bold text-brand-950">Sin resultados</h2>
            <p className="mt-1 text-sm text-gray-500">No hay cuotas que coincidan con los filtros elegidos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  {['Cliente', 'Cuota', 'Vencimiento', 'Estado', 'Monto', ''].map((th, i) => (
                    <th
                      key={i}
                      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 ${
                        i === 4 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((cuota) => (
                  <tr key={cuota.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/dashboard/clientes/${cuota.clientId}`}
                        className="text-sm font-semibold text-brand-800 hover:text-brand-600 hover:underline"
                      >
                        {cuota.clientName}
                      </Link>
                      <span className="block text-xs text-gray-400 truncate max-w-[220px]">
                        {cuota.saleDescription || 'Venta'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                      {cuota.numeroCuota}
                      {cuota.totalCuotas ? ` / ${cuota.totalCuotas}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap tabular-nums">
                      {formatearFecha(cuota.fechaVencimiento)}
                    </td>
                    <td className="px-5 py-3.5">
                      <CuotaEstadoBadge cuota={cuota} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-sm font-semibold tabular-nums text-brand-950 whitespace-nowrap">
                      {formatCurrency(cuota.monto ?? 0)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/dashboard/ventas/${cuota.saleId}`}
                          aria-label={`Ver detalle de la venta de ${cuota.clientName}`}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-brand-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {!cuota.pagada && (
                          <Button
                            size="sm"
                            variant="brandSoft"
                            leftIcon={<HandCoins className="w-4 h-4" />}
                            onClick={() => setCuotaACobrar(cuota)}
                          >
                            Cobrar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!loading && totalPages > 1 && (
        <Paginación page={page} setPage={setPage} totalPages={totalPages} />
      )}

      <PayFeeModal cuota={cuotaACobrar} onClose={() => setCuotaACobrar(null)} onPaid={cargar} />
    </DashboardLayout>
  );
};

export default Cuotas;
