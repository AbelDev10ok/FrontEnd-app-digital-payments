import { CheckCircle, Loader2 } from "lucide-react";
import { SaleResponseDto } from "../services/salesServices";

interface CronogramaFeesProps{
    transaction: SaleResponseDto
    formatDate: (amount: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    formatCurrency:(amount: number) => string;
    getStatusBadge: (status: string) => React.ReactNode;
    handleMarkAsPaid:(feeId: number) => void;
    processingFee: number | null;
}

export default function CronogramaFees({transaction, formatDate, getStatusIcon, formatCurrency, getStatusBadge, handleMarkAsPaid, processingFee}: CronogramaFeesProps ) {
    return (
        <section>
        {transaction.fees.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cronograma de Cuotas</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cuota
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Información de Pago
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transaction.fees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(fee.status)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            Cuota {fee.numberFee}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(fee.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(fee.expirationDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(fee.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {fee.paid ? (
                          <div className="text-green-600">
                            <div className="font-medium flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {formatCurrency(fee.paidAmount || fee.amount)}
                            </div>
                            {fee.paymentDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Pagado el {formatDate(fee.paymentDate)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Pendiente</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {!fee.paid && (
                          <button
                            onClick={() => handleMarkAsPaid(fee.id)}
                            disabled={processingFee === fee.id}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          >
                            {processingFee === fee.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Marcar como pagada'
                            )}
                          </button>
                        )}
                        {fee.paid && (
                          <span className="text-green-600 text-sm font-medium">
                            ✓ Completada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </section>
    )
}