import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import { Alert } from '@/shared/components/ui';
import { salesService } from '@/features/ventas/services/salesServices';
import type { PriceChangeDto } from '@/shared/types/sales';
import { formatCurrency } from '@/shared/utils/formatCurrency';

interface PriceHistoryModalProps {
  /** Producto base a consultar; null cierra el modal. */
  productId: number | null;
  productName: string;
  onClose: () => void;
}

const formatearFecha = (valor: string): string => {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
};

const describirAjuste = (cambio: PriceChangeDto): string => {
  if (cambio.adjustmentValue == null || !cambio.adjustmentMode) return '—';
  const valor = cambio.adjustmentValue;
  const signo = valor > 0 ? '+' : '';
  return cambio.adjustmentMode === 'PERCENT' ? `${signo}${valor}%` : `${signo}${valor}`;
};

/** Historial de precios de un producto: quién cambió cada SKU, cuándo y desde/hacia qué valor. */
const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ productId, productName, onClose }) => {
  const [cambios, setCambios] = useState<PriceChangeDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId == null) return;
    let cancelado = false;
    setCambios([]);
    setError(null);
    setCargando(true);
    salesService
      .getPriceHistory(productId)
      .then((historial) => {
        if (!cancelado) setCambios(historial);
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [productId]);

  return (
    <Modal
      isOpen={productId != null}
      onClose={onClose}
      title={productName ? `Historial de precios · ${productName}` : 'Historial de precios'}
      size="lg"
    >
      {cargando ? (
        <p role="status" className="text-sm text-gray-500">
          Cargando historial…
        </p>
      ) : error ? (
        <Alert tone="danger">{error}</Alert>
      ) : cambios.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay cambios de precio registrados para este producto.</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Fecha</th>
                <th className="px-3 py-2 font-semibold">SKU</th>
                <th className="px-3 py-2 font-semibold">Precio</th>
                <th className="px-3 py-2 font-semibold">Costo</th>
                <th className="px-3 py-2 font-semibold">Ajuste</th>
                <th className="px-3 py-2 font-semibold">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cambios.map((cambio) => (
                <tr key={cambio.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {formatearFecha(cambio.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-gray-900">{cambio.sku ?? 'Sin SKU'}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-gray-600">
                    {formatCurrency(cambio.oldPrice, cambio.currency ?? undefined)}
                    <span className="mx-1 text-gray-400">→</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(cambio.newPrice, cambio.currency ?? undefined)}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-gray-600">
                    {cambio.oldCost === cambio.newCost ? (
                      <span className="text-gray-400">sin cambio</span>
                    ) : (
                      <>
                        {formatCurrency(cambio.oldCost, cambio.currency ?? undefined)}
                        <span className="mx-1 text-gray-400">→</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(cambio.newCost, cambio.currency ?? undefined)}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">{describirAjuste(cambio)}</td>
                  <td className="px-3 py-2 text-gray-600">{cambio.createdBy ?? 'Sin registrar'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default PriceHistoryModal;