import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import { Alert, Badge, Paginación } from '@/shared/components/ui';
import { salesService } from '@/features/ventas/services/salesServices';
import type { ProductDto, StockMovementDto, StockMovementType } from '@/shared/types/sales';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { especificacionesDe } from '@/shared/utils/productSpecs';

const PAGE_SIZE = 10;

const ETIQUETA_TIPO: Record<StockMovementType, string> = {
  INGRESO: 'Ingreso',
  VENTA: 'Venta',
  ANULACION: 'Anulación',
  AJUSTE: 'Ajuste',
};

const TONO_TIPO: Record<StockMovementType, 'success' | 'brand' | 'warning' | 'neutral'> = {
  INGRESO: 'success',
  VENTA: 'brand',
  ANULACION: 'warning',
  AJUSTE: 'neutral',
};

/** Fecha y hora cortas en la zona del negocio. */
const formatearFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

const motivoDe = (movimiento: StockMovementDto) => {
  if (movimiento.reason) return movimiento.reason;
  if (movimiento.saleId != null) return `Venta N° ${movimiento.saleId}`;
  return '—';
};

interface MovimientosStockModalProps {
  isOpen: boolean;
  /** Fila del catálogo (un SKU) cuyo historial se muestra. */
  variant: ProductDto | null;
  onClose: () => void;
}

/**
 * Historial de un SKU: el libro de movimientos es la verdad del stock, así que
 * cada ingreso, venta, anulación y ajuste queda listado con su fecha y autor.
 */
export default function MovimientosStockModal({
  isOpen,
  variant,
  onClose,
}: MovimientosStockModalProps) {
  const [movimientos, setMovimientos] = useState<StockMovementDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La respuesta de una página vieja no debe pisar la de la actual.
  const pedidoActual = useRef(0);
  const variantId = variant?.variantId ?? null;

  const cargar = useCallback(async (id: number, pagina: number) => {
    const pedido = ++pedidoActual.current;
    setLoading(true);
    setError(null);
    try {
      const resultado = await salesService.getStockMovements({
        variantId: id,
        page: pagina,
        size: PAGE_SIZE,
      });
      if (pedido !== pedidoActual.current) return;
      setMovimientos(resultado.content);
      setTotalPages(Math.max(1, resultado.totalPages));
      setTotalElements(resultado.totalElements);
    } catch (err) {
      if (pedido !== pedidoActual.current) return;
      setError(err instanceof Error ? err.message : 'Error al obtener los movimientos de stock');
    } finally {
      if (pedido === pedidoActual.current) setLoading(false);
    }
  }, []);

  // Cada apertura (o cambio de SKU) arranca en la primera página.
  useEffect(() => {
    if (!isOpen || variantId == null) return;
    setPage(0);
    setMovimientos([]);
    setTotalElements(0);
    void cargar(variantId, 0);
  }, [isOpen, variantId, cargar]);

  const cambiarPagina = (siguiente: number | ((actual: number) => number)) => {
    if (variantId == null) return;
    const destino = typeof siguiente === 'function' ? siguiente(page) : siguiente;
    if (destino === page) return;
    setPage(destino);
    void cargar(variantId, destino);
  };

  const specs = variant ? especificacionesDe(variant) : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Movimientos · ${variant?.sku ?? variant?.name ?? 'stock'}`}
      size="lg"
    >
      {variant && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{variant.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {[specs.join(' · '), variant.sku, variant.productTypeName].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            Stock actual: <strong className="tabular-nums">{variant.stock ?? 0}</strong>
            {totalElements > 0 && (
              <span className="text-gray-500">
                {' · '}
                {totalElements === 1 ? '1 movimiento' : `${totalElements} movimientos`}
              </span>
            )}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <p role="status" className="py-6 text-center text-sm text-gray-500">
          Cargando movimientos…
        </p>
      ) : movimientos.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Todavía no hay movimientos para este SKU.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                {['Fecha', 'Tipo', 'Cantidad', 'Motivo', 'Usuario'].map((th, i) => (
                  <th
                    key={th}
                    className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-500 ${
                      i === 2 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimientos.map((movimiento) => (
                <tr key={movimiento.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap tabular-nums">
                    {formatearFecha(movimiento.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={TONO_TIPO[movimiento.type]}>{ETIQUETA_TIPO[movimiento.type]}</Badge>
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right text-sm font-semibold tabular-nums whitespace-nowrap ${
                      movimiento.delta > 0 ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {movimiento.delta > 0 ? `+${movimiento.delta}` : movimiento.delta}
                    {movimiento.unitCost != null && (
                      <span className="block text-xs font-normal text-gray-400">
                        {formatCurrency(movimiento.unitCost, variant?.currency ?? undefined)} c/u
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600">{motivoDe(movimiento)}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{movimiento.createdBy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Paginación page={page} setPage={cambiarPagina} totalPages={totalPages} />
      )}
    </Modal>
  );
}
