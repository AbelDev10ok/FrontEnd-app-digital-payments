import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, History, Plus, RefreshCw, Search } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import { Alert, Button, ButtonLink, Card, Input } from '@/shared/components/ui';
import IngresoStockModal from '@/features/inventario/components/IngresoStockModal';
import MovimientosStockModal from '@/features/inventario/components/MovimientosStockModal';
import { salesService } from '@/features/ventas/services/salesServices';
import type { ProductDto } from '@/shared/types/sales';
import { normalizarBusqueda } from '@/shared/utils/busqueda';
import { formatCurrency, initCurrency } from '@/shared/utils/formatCurrency';
import { especificacionesDe } from '@/shared/utils/productSpecs';

interface InventarioProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

/**
 * Inventario: una fila por SKU con su stock actual. El stock no se edita acá
 * (se cambia con un movimiento); desde el catálogo se ajusta por conteo y acá
 * se carga mercadería o se mira el historial del SKU.
 */
const Inventario: React.FC<InventarioProps> = ({ user, onLogout }) => {
  const [productos, setProductos] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [movimientosDe, setMovimientosDe] = useState<ProductDto | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setProductos(await salesService.getProducts());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initCurrency();
    void cargar();
  }, [cargar]);

  // El aviso de éxito se retira solo: informa sin estorbar en la próxima tarea.
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  // Una fila por variante: el stock vive en el SKU, no en el producto base.
  const skus = useMemo(() => productos.filter((p) => p.variantId != null), [productos]);

  const filtrados = useMemo(() => {
    const consulta = normalizarBusqueda(search);
    if (!consulta) return skus;
    return skus.filter((p) =>
      normalizarBusqueda(
        [p.name, p.sku ?? '', p.variantLabel ?? '', p.productTypeName ?? '', ...especificacionesDe(p)].join(' '),
      ).includes(consulta),
    );
  }, [skus, search]);

  const stockTotal = useMemo(
    () => skus.reduce((total, p) => total + (p.stock ?? 0), 0),
    [skus],
  );

  return (
    <DashboardLayout title="Inventario" user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Stock"
        title="Inventario"
        subtitle="Las existencias salen de un libro de movimientos: cada ingreso, venta, anulación y ajuste deja su rastro."
        icon={<Boxes className="w-6 h-6 text-brand-600" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              aria-label="Recargar inventario"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => void cargar()}
              disabled={loading}
            >
              Recargar
            </Button>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIngresoOpen(true)}
              disabled={skus.length === 0}
            >
              Ingreso de mercadería
            </Button>
          </div>
        }
      />

      {feedback && <Alert tone="success">{feedback}</Alert>}
      {loadError && <Alert tone="danger">{loadError}</Alert>}

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              aria-label="Buscar en el inventario"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por producto, SKU o atributo…"
              className="pl-9"
            />
          </div>
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {skus.length === 1 ? '1 SKU' : `${skus.length} SKU`}
            {' · '}
            {stockTotal === 1 ? '1 unidad' : `${stockTotal} unidades`}
          </p>
        </div>

        {loading ? (
          <p role="status" className="py-10 text-center text-sm text-gray-500">
            Cargando inventario...
          </p>
        ) : filtrados.length === 0 ? (
          <div className="py-10 text-center">
            {skus.length === 0 ? (
              <>
                <p className="text-sm text-gray-500">No hay SKUs en el catálogo todavía.</p>
                <ButtonLink to="/dashboard/productos" size="sm" className="mt-3">
                  Ir al catálogo
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">No hay SKUs que coincidan con la búsqueda.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => setSearch('')}>
                  Limpiar búsqueda
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  {['Producto', 'SKU', 'Stock', 'Costo', 'Precio', ''].map((th, i) => (
                    <th
                      key={th || 'acciones'}
                      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 ${
                        i >= 2 && i <= 4 ? 'text-right' : i === 5 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((sku) => {
                  const specs = especificacionesDe(sku);
                  const detalle = [specs.join(' · '), sku.productTypeName].filter(Boolean).join(' · ');
                  return (
                    <tr
                      key={sku.variantId ?? `${sku.id}-${sku.sku}`}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="block text-sm font-semibold text-gray-900">{sku.name}</span>
                        {detalle && <span className="block text-xs text-gray-500">{detalle}</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {sku.sku ?? 'Sin SKU'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-heading whitespace-nowrap">
                        {sku.stock ?? 0}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-sm tabular-nums text-gray-600 whitespace-nowrap">
                        {sku.cost != null ? formatCurrency(sku.cost, sku.currency ?? undefined) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-sm tabular-nums text-gray-900 whitespace-nowrap">
                        {sku.price != null ? formatCurrency(sku.price, sku.currency ?? undefined) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Movimientos de ${sku.sku ?? sku.name}`}
                          leftIcon={<History className="w-4 h-4" />}
                          onClick={() => setMovimientosDe(sku)}
                        >
                          Movimientos
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <IngresoStockModal
        isOpen={ingresoOpen}
        variants={skus}
        onClose={() => setIngresoOpen(false)}
        onSaved={(mensaje) => {
          setFeedback(mensaje);
          void cargar();
        }}
      />

      <MovimientosStockModal
        isOpen={movimientosDe != null}
        variant={movimientosDe}
        onClose={() => setMovimientosDe(null)}
      />
    </DashboardLayout>
  );
};

export default Inventario;
