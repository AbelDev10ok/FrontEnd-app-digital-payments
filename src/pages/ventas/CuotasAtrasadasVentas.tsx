import React, { useState, useEffect } from 'react';
import { Clock, Loader2, AlertCircle, DollarSign, Calendar, CheckCircle, User, Link } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { salesService, FeeDto, ProductTypeDto } from '../../services/salesServices';
import FeesFilters from '../../components/filters/FeesFilters';
import { useFeesFilters } from '../../hooks/useFeesFilters';

interface OverdueFee extends FeeDto {
  clientName: string;
  saleDescription: string;
  productDescription: string;
  productTypeId: number;
}

const CuotasAtrasadasVentas: React.FC = () => {
  const [overdueFees, setOverdueFees] = useState<OverdueFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingFee, setProcessingFee] = useState<number | null>(null);
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);

  const {
    searchTerm,
    setSearchTerm,
    selectedProductType,
    setSelectedProductType,
    filteredFees
  } = useFeesFilters(overdueFees);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const calculateDaysLate = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = today.getTime() - expDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleMarkAsPaid = async (saleId: number, feeId: number) => {
    try {
      setProcessingFee(feeId);
      await salesService.markFeeAsPaid(saleId, feeId);
      // Recargar datos
      await fetchOverdueFees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como pagada');
    } finally {
      setProcessingFee(null);
    }
  };

  const fetchOverdueFees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener todas las ventas y extraer cuotas atrasadas
      const today = new Date().toISOString().split('T')[0];
      const allSales = await salesService.getFeesDueOn('VENTAS', today);
      
      const overdueFeesData: OverdueFee[] = [];
      
      allSales.forEach(sale => {
        if (sale.fees) {
          sale.fees.forEach(fee => {
            if (!fee.paid && calculateDaysLate(fee.expirationDate) > 0) {
              overdueFeesData.push({
                ...fee,
                clientName: sale.client.name,
                saleDescription: sale.descriptionProduct,
                productDescription: sale.productType.name,
                productTypeId: sale.productType.id
              });
            }
          });
        }
      });
      
      // Ordenar por días de atraso (mayor a menor)
      overdueFeesData.sort((a, b) => 
        calculateDaysLate(b.expirationDate) - calculateDaysLate(a.expirationDate)
      );
      
      setOverdueFees(overdueFeesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las cuotas atrasadas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const types = await salesService.getProductTypes();
        setProductTypes(types);
      } catch (err) {
        console.error('Error al cargar tipos de productos:', err);
      }
    };

    fetchOverdueFees();
    fetchProductTypes();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Cuotas Atrasadas - Ventas">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando cuotas atrasadas...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Cuotas Atrasadas - Ventas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Clock className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Cuotas Atrasadas de Ventas</h2>
            <p className="text-sm text-gray-500">Cuotas individuales con pagos vencidos</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <FeesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedProductType={selectedProductType}
          onProductTypeChange={setSelectedProductType}
          productTypes={productTypes}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cuotas Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{filteredFees.length}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Total Atrasado</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(filteredFees.reduce((sum, fee) => sum + fee.amount, 0))}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Días Promedio Atraso</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredFees.length > 0 ?
                    Math.round(filteredFees.reduce((sum, fee) => sum + calculateDaysLate(fee.expirationDate), 0) / filteredFees.length) : 0}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Fees List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cuotas Vencidas</h3>
            {filteredFees.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm || selectedProductType
                    ? 'No se encontraron cuotas que coincidan con los filtros'
                    : '¡Excelente! No hay cuotas atrasadas'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFees.map((fee) => (
                  <div key={fee.id} className="border border-red-200 rounded-xl p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Cuota #{fee.numberFee}</h4>
                          <p className="text-sm text-gray-600">{fee.clientName}</p>
                          <p className="text-sm text-gray-500">{fee.saleDescription}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{formatCurrency(fee.amount)}</p>
                        <p className="text-sm text-red-600">
                          {calculateDaysLate(fee.expirationDate)} días de atraso
                        </p>
                        <p className="text-sm text-gray-500">
                          Vencía: {formatDate(fee.expirationDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-red-200">
                      <Link
                        to={`/dashboard/ventas/${fee.saleId}`}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Ver Venta Completa
                      </Link>
                      <button
                        onClick={() => handleMarkAsPaid(fee.saleId, fee.id)}
                        disabled={processingFee === fee.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {processingFee === fee.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Marcar como Pagada'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CuotasAtrasadasVentas;