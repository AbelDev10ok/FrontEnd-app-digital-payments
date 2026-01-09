type ClientResumenFinansas = {
  formatCurrency: (amount: number) => string;  
  financialStats: {
    deudaVentas: number;
    ventasPagadas: number;
    deudaPrestamos: number;
    prestamosPagados: number;
  }
}


const ClientResumenFinansas:React.FC<ClientResumenFinansas> = ({formatCurrency,financialStats}) => {
  return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero del Cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Deuda Pendiente:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(financialStats.deudaVentas + financialStats.deudaPrestamos)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Pagado:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(financialStats.ventasPagadas + financialStats.prestamosPagados)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Balance del Cliente:</span>
                <span className={`font-medium ${
                  (financialStats.ventasPagadas + financialStats.prestamosPagados) >= 
                  (financialStats.deudaVentas + financialStats.deudaPrestamos) 
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(
                    (financialStats.ventasPagadas + financialStats.prestamosPagados) - 
                    (financialStats.deudaVentas + financialStats.deudaPrestamos)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estado:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  (financialStats.deudaVentas + financialStats.deudaPrestamos) === 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {(financialStats.deudaVentas + financialStats.deudaPrestamos) === 0 ? 'Sin Deudas' : 'Con Deudas'}
                </span>
              </div>
            </div>
          </div>
        </div>
  )
}

export default ClientResumenFinansas;