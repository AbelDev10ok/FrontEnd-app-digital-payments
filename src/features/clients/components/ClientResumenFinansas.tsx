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

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero del Cliente</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Deuda Pendiente:</span>
            <span className="font-medium text-red-600">
              {formatCurrency(deudaTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Pagado:</span>
            <span className="font-medium text-emerald-600">
              {formatCurrency(pagadoTotal)}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Histórico:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(pagadoTotal + deudaTotal)}
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
