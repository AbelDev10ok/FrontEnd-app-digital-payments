import { Banknote, CreditCard, DollarSign, TrendingUp } from "lucide-react";

type ClientFinansaProps = {
  formatCurrency: (amount: number) => string;  
  financialStats: {
    deudaVentas: number;
    ventasPagadas: number;
    deudaPrestamos: number;
    prestamosPagados: number;
  }
}

const ClientEstadoFinansa:React.FC<ClientFinansaProps> = ({financialStats,formatCurrency}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Deuda Ventas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(financialStats.deudaVentas)}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-xl">
                  <CreditCard className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ventas Pagadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialStats.ventasPagadas)}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Deuda Préstamos</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(financialStats.deudaPrestamos)}
                  </p>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl">
                  <Banknote className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Préstamos Pagados</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(financialStats.prestamosPagados)}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )
}


export default ClientEstadoFinansa;