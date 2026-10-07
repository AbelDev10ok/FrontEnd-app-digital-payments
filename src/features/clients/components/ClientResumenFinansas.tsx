import { Badge, Card } from "@/shared/components/ui";

type ClientResumenFinansas = {
  formatCurrency: (amount: number) => string;
  financialStats: {
    deudaVentas: number;
    ventasPagadas: number;
    deudaPrestamos: number;
    prestamosPagados: number;
  }
}

const ClientResumenFinansas: React.FC<ClientResumenFinansas> = ({ formatCurrency, financialStats }) => {
  const deudaTotal = financialStats.deudaVentas + financialStats.deudaPrestamos;
  const pagadoTotal = financialStats.ventasPagadas + financialStats.prestamosPagados;
  const historicoTotal = pagadoTotal + deudaTotal;
  const porcentajePagado = historicoTotal > 0 ? Math.min(Math.round((pagadoTotal / historicoTotal) * 100), 100) : 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-4">Resumen Financiero del Cliente</h3>
      
      {/* Progress bar */}
      {historicoTotal > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-gray-500 font-medium">Progreso de cobro</span>
            <span className="text-xs font-mono tabular-nums text-gray-500">{porcentajePagado}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${deudaTotal > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
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
              {formatCurrency(deudaTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Pagado:</span>
            <span className="font-medium font-mono tabular-nums text-emerald-600">
              {formatCurrency(pagadoTotal)}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Histórico:</span>
            <span className="font-medium font-mono tabular-nums text-gray-900">
              {formatCurrency(historicoTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Estado:</span>
            <Badge tone={deudaTotal > 0 ? 'warning' : 'success'}>
              {deudaTotal > 0 ? 'Con Deuda' : 'Al día'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ClientResumenFinansas;
