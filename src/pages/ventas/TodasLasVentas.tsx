import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Loader2, AlertCircle, DollarSign, TrendingUp, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashBoardLayout';
import { salesService, SaleResponseDto } from '../../services/salesServices';

const TodasLasVentas: React.FC = () => {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const statusOptions = ['Todos', 'Completada', 'Pendiente', 'Atrasada'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadge = (transaction: SaleResponseDto) => {
    if (transaction.completed) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completada</span>;
    }
    if (transaction.daysLate > 0) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Atrasada ({transaction.daysLate}d)</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
  };

  const filteredSales = sales.filter(sale => {
    const searchMatch = 
      sale.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.descriptionProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toString().includes(searchTerm);

    const statusMatch = (() => {
      if (selectedStatus === 'Todos') return true;
      if (selectedStatus === 'Completada') return sale.completed;
      if (selectedStatus === 'Pendiente') return !sale.completed && sale.daysLate === 0;
      if (selectedStatus === 'Atrasada') return !sale.completed && sale.daysLate > 0;
      return true;
    })();

    return searchMatch && statusMatch;
  });

  const fetchAllSales = async () => {
    try {
      setLoading(true);
      setError(null);
      // Aquí necesitarías un endpoint específico para todas las ventas
      // Por ahora usamos el endpoint general
      const today = new Date().toISOString().split('T')[0];
      const salesData = await salesService.getFeesDueOn('VENTAS', today);
      setSales(salesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSales();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Todas las Ventas">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando ventas...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Todas las Ventas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Todas las Ventas</h2>
              <p className="text-sm text-gray-500">Gestión completa de ventas</p>
            </div>
          </div>
          
          <Link
            to="/dashboard/ventas/crear"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Venta
          </Link>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {sales.filter(s => s.completed).length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(sales.filter(s => s.completed).reduce((sum, s) => sum + s.priceTotal, 0))}
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
                <p className="text-sm font-medium text-gray-600">Pendiente Cobro</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(sales.reduce((sum, s) => sum + s.remainingAmount, 0))}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar ventas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || selectedStatus !== 'Todos' 
                        ? 'No se encontraron ventas que coincidan con los filtros' 
                        : 'No hay ventas registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">#{sale.id}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{sale.descriptionProduct}</div>
                            <div className="text-sm text-gray-500">{formatDate(sale.dateSale)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sale.client.name}</div>
                        <div className="text-sm text-gray-500">{sale.client.telefono}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(sale.priceTotal)}</div>
                        {!sale.completed && (
                          <div className="text-sm text-gray-500">Pendiente: {formatCurrency(sale.remainingAmount)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.typePayments !== 'UNICO' ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.paidFeesCount}/{sale.totalFees} cuotas
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(sale.paidFeesCount / sale.totalFees) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Pago único</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          to={`/dashboard/ventas/${sale.id}`}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TodasLasVentas;