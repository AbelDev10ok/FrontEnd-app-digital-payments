import { Badge, Card } from "@/shared/components/ui";
import { hasMoney, mergeMoney } from "@/shared/utils/formatCurrency";
import type { MontosPorMoneda } from "@/shared/types/money";

type ClientResumenFinansas = {
  /** Formatea montos por moneda sin sumar monedas distintas */
  formatMoney: (montos: MontosPorMoneda) => string;
  financialStats: {
    deudaVentas: MontosPorMoneda;
    ventasPagadas: MontosPorMoneda;
    deudaPrestamos: MontosPorMoneda;
    prestamosPagados: MontosPorMoneda;
  }
}

const ClientResumenFinansas: React.FC<ClientResumenFinansas> = ({ formatMoney, financialStats }) => {
  // Sumas por moneda (acumular dentro de cada moneda está permitido)
  const deudaTotal = mergeMoney(financialStats.deudaVentas, financialStats.deudaPrestamos);
  const pagadoTotal = mergeMoney(financialStats.ventasPagadas, financialStats.prestamosPagados);
  const historicoTotal = mergeMoney(deudaTotal, pagadoTotal);

  // El porcentaje solo es honesto con una sola moneda: una proporción entre
  // monedas distintas sería un número inventado.
  const monedas = Object.keys(historicoTotal);
  const unaMoneda = monedas.length === 1 ? monedas[0] : undefined;
  const totalUnica = unaMoneda ? (historicoTotal[unaMoneda] ?? 0) : 0;
  const pagadoUnica = unaMoneda ? (pagadoTotal[unaMoneda] ?? 0) : 0;
  const porcentajePagado =
    unaMoneda && totalUnica > 0 ? Math.min(Math.round((pagadoUnica / totalUnica) * 100), 100) : null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-4">Resumen Financiero del Cliente</h3>
      
      {/* Progress bar (solo con una moneda: no se comparan monedas distintas) */}
      {porcentajePagado != null && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-500 font-medium">Progreso de cobro</span>
            <span className="text-xs font-mono tabular-nums text-gray-500">{porcentajePagado}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ease-out ${hasMoney(deudaTotal) ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${porcentajePagado}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Deuda Pendiente:</span>
            <span className="font-medium font-mono tabular-nums text-red-600">
              {formatMoney(deudaTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Pagado:</span>
            <span className="font-medium font-mono tabular-nums text-emerald-600">
              {formatMoney(pagadoTotal)}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Histórico:</span>
            <span className="font-medium font-mono tabular-nums text-gray-900">
              {formatMoney(historicoTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Estado:</span>
            <Badge tone={hasMoney(deudaTotal) ? 'warning' : 'success'}>
              {hasMoney(deudaTotal) ? 'Con Deuda' : 'Al día'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ClientResumenFinansas;
