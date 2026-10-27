import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import Load from '@/shared/components/feedback/Load';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import { Select, Button } from '@/shared/components/ui';
import { sellerService } from '@/features/vendedores/services/sellerServices';
import type { SellerMetricDto, SellerMetricsDto } from '@/shared/types/sellers';
import type { SaleKind } from '@/shared/types/sales';
import type { MontosPorMoneda } from '@/shared/types/money';
import { formatMoneyByCurrency, hasMoney } from '@/shared/utils/formatCurrency';
import { eyebrow, neutral, neutralBg } from '@/shared/theme';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

/** Valor del selector de moneda que incluye todas las monedas */
const TODAS = 'TODAS';

type SortKey = 'nombre' | 'cartera' | 'operaciones' | 'anuladas' | 'vendido' | 'cobrado' | 'deuda';

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);
const currentMonth = new Date().getMonth() + 1;

/**
 * Clave de orden para un monto agrupado por moneda. Con "TODAS" se comparan
 * las sumas entre monedas SOLO para ordenar (nunca se muestran sumadas); con
 * una moneda elegida, su monto. Las monedas distintas nunca se agregan en la
 * tabla.
 */
const claveDeOrden = (montos: MontosPorMoneda, currency: string): number => {
  if (currency === TODAS) {
    return Object.values(montos).reduce((acc, monto) => acc + monto, 0);
  }
  return montos[currency] ?? 0;
};

const Vendedores: React.FC<PageProps> = ({ user, onLogout }) => {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [currency, setCurrency] = useState(TODAS);
  const [kind, setKind] = useState<SaleKind>('VENTA');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'vendido',
    dir: 'desc',
  });

  const [metrics, setMetrics] = useState<SellerMetricsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchMetrics = useCallback(async () => {
    // Guard de carrera: si cambian los filtros rápido, solo la última respuesta pinta.
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await sellerService.getSellerMetrics(year, month);
      if (requestId !== requestIdRef.current) return;
      setMetrics(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Error al cargar las métricas de vendedores');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const montoTexto = (montos: MontosPorMoneda): string => {
    if (!hasMoney(montos)) return '—';
    if (currency !== TODAS) {
      const monto = montos[currency];
      return monto != null ? formatMoneyByCurrency({ [currency]: monto }) : '—';
    }
    return formatMoneyByCurrency(montos);
  };

  const valorDeOrden = (fila: SellerMetricDto, key: SortKey): number | string => {
    switch (key) {
      case 'nombre':
        return fila.sellerName.toLowerCase();
      case 'cartera':
        return fila.clientesCartera;
      case 'operaciones':
        return fila.operaciones[kind];
      case 'anuladas':
        return fila.anuladas[kind];
      case 'vendido':
        return claveDeOrden(fila.vendido[kind], currency);
      case 'cobrado':
        return claveDeOrden(fila.cobrado[kind], currency);
      case 'deuda':
        return claveDeOrden(fila.deuda[kind], currency);
    }
  };

  const ordenados = useMemo(() => {
    if (!metrics) return [];
    const filas = [...metrics.vendedores];
    const factor = sort.dir === 'asc' ? 1 : -1;
    filas.sort((a, b) => {
      const va = valorDeOrden(a, sort.key);
      const vb = valorDeOrden(b, sort.key);
      if (typeof va === 'string' || typeof vb === 'string') {
        return String(va).localeCompare(String(vb)) * factor;
      }
      if (va === vb) return a.sellerName.localeCompare(b.sellerName);
      return (va - vb) * factor;
    });
    return filas;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, sort, kind, currency]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'nombre' ? 'asc' : 'desc' },
    );
  };

  const indicador = (key: SortKey) => (sort.key === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '');

  const thOrdenable = (key: SortKey, label: string, alineacion = 'text-left') => (
    <th className={`px-4 py-3 ${alineacion} ${eyebrow.table}`}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="hover:text-brand-700 transition-colors"
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        {indicador(key)}
      </button>
    </th>
  );

  const links = (fila: SellerMetricDto) => {
    const operaciones = fila.sellerId != null
      ? `/dashboard/ventas/todas?kind=${kind}&sellerId=${fila.sellerId}`
      : `/dashboard/ventas/todas?kind=${kind}&withoutSeller=true`;
    const clientes = fila.sellerId != null
      ? `/dashboard/clientes?vendedor=${fila.sellerId}`
      : '/dashboard/clientes?sinVendedor=true';
    return (
      <div className="flex items-center justify-end gap-3">
        <Link to={operaciones} className="text-brand-700 hover:text-brand-900 font-medium">
          Operaciones
        </Link>
        <Link to={clientes} className="text-brand-700 hover:text-brand-900 font-medium">
          Clientes
        </Link>
      </div>
    );
  };

  const filaDe = (fila: SellerMetricDto, esSinVendedor = false) => (
    <tr
      key={fila.sellerId ?? 'sin-vendedor'}
      className={`hover:bg-gray-50/60 transition-colors ${esSinVendedor ? 'bg-gray-50/40' : ''}`}
    >
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${neutral.primary}`}>{fila.sellerName}</span>
          {!fila.activo && !esSinVendedor && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              Deshabilitado
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-700 tabular-nums">{fila.clientesCartera}</td>
      <td className="px-4 py-4 text-sm text-gray-700 tabular-nums">{fila.operaciones[kind]}</td>
      <td className="px-4 py-4 text-sm text-gray-700 tabular-nums">{fila.anuladas[kind]}</td>
      <td className="px-4 py-4 text-sm text-gray-700 tabular-nums">{montoTexto(fila.vendido[kind])}</td>
      <td className="px-4 py-4 text-sm text-gray-700 tabular-nums">{montoTexto(fila.cobrado[kind])}</td>
      <td className="px-4 py-4 text-sm text-gray-700 tabular-nums">{montoTexto(fila.deuda[kind])}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm">{links(fila)}</td>
    </tr>
  );

  const monedas = metrics?.monedasDisponibles ?? [];

  return (
    <DashboardLayout title="Vendedores" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-brand-950">Vendedores</h1>
            <p className="text-sm text-gray-500 mt-1">
              Vendido y cobrado siguen la autoría sellada de cada operación; la deuda es la
              cartera que cada vendedor maneja hoy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Conmutador de tipo: ventas y préstamos se miden por separado */}
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden" role="group" aria-label="Tipo de operación">
              <Button
                variant={kind === 'VENTA' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setKind('VENTA')}
              >
                Ventas
              </Button>
              <Button
                variant={kind === 'PRESTAMO' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setKind('PRESTAMO')}
              >
                Préstamos
              </Button>
            </div>

            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="sm:w-auto"
              aria-label="Moneda"
            >
              <option value={TODAS}>Todas las monedas</option>
              {monedas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>

            <Select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="sm:w-auto"
              aria-label="Mes"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>

            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="sm:w-auto"
              aria-label="Año"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <Load />
        ) : !metrics ? (
          <ErrorMessage message="No se pudieron cargar las métricas" />
        ) : (
          <div className="bg-white rounded-card shadow-card overflow-x-auto">
            <table className="w-full">
              <thead className={neutralBg.tableHeader}>
                <tr>
                  {thOrdenable('nombre', 'Vendedor')}
                  {thOrdenable('cartera', 'Clientes en cartera')}
                  {thOrdenable('operaciones', 'Operaciones')}
                  {thOrdenable('anuladas', 'Anuladas')}
                  {thOrdenable('vendido', 'Vendido')}
                  {thOrdenable('cobrado', 'Cobrado')}
                  {thOrdenable('deuda', 'Deuda de cartera')}
                  <th className={`px-4 py-3 text-right ${eyebrow.table}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenados.map((fila) => filaDe(fila))}
                {metrics.sinVendedor && filaDe(metrics.sinVendedor, true)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Vendedores;
