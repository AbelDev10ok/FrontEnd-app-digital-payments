/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { ShoppingCart, Search, Plus, TrendingUp, Loader2, AlertCircle, DollarSign, CreditCard, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { useSales } from '../../hooks/useSales';
import { formatCurrency } from '../../utils/formatCurrency';
import { ProductTypeDto } from '../../services/salesServices';

const Ventas: React.FC = () => {
  const { allTransactions, loading, error, stats, deleteSale } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  // const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const typeOptions = ['Todos', 'Venta', 'Préstamo'];
  const statusOptions = ['Todos', 'Completada', 'Pendiente', 'Atrasada'];

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      const searchMatch = 
        transaction.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.descriptionProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toString().includes(searchTerm);

      const typeMatch = selectedType === 'Todos' || 
        (selectedType === 'Venta' && transaction.productType.name !== 'PRESTAMO') ||
        (selectedType === 'Préstamo' && transaction.productType.name === 'PRESTAMO');

      const statusMatch = (() => {
        if (selectedStatus === 'Todos') return true;
        if (selectedStatus === 'Completada') return transaction.completed;
        if (selectedStatus === 'Pendiente') return !transaction.completed && transaction.daysLate === 0;
        if (selectedStatus === 'Atrasada') return !transaction.completed && transaction.daysLate > 0;
        return true;
      })();

      return searchMatch && typeMatch && statusMatch;
    });
  }, [allTransactions, searchTerm, selectedType, selectedStatus]);

  // Use shared formatCurrency util (defaults to ARS)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      timeZone: 'UTC'
    });
  };

  const getStatusBadge = (transaction: any) => {
    if (transaction.completed) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completada</span>;
    }
    if (transaction.daysLate > 0) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Atrasada ({transaction.daysLate}d)</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
  };

  const getTypeBadge = (productType: ProductTypeDto) => {
    const isLoan = productType.name === 'PRESTAMO';
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        isLoan ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
      }`}>
        {isLoan ? 'Préstamo' : 'Venta'}
      </span>
    );
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      try {
        setDeletingId(id);
        await deleteSale(id);
      } catch (err) {
        console.error('Error al eliminar transacción:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Ventas y Préstamos">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando transacciones...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ventas y Préstamos">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ventas y Préstamos</h2>
              <p className="text-sm text-gray-500">Gestiona todas tus transacciones</p>
            </div>
          </div>
          
          <Link
            to="/dashboard/ventas/crear"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Transacción
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Préstamos</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendiente Cobro</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalOutstanding)}</p>
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
                placeholder="Buscar por cliente, producto o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {typeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-transparent md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="hidden md:table-header-group bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transacción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
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
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
                      {searchTerm || selectedType !== 'Todos' || selectedStatus !== 'Todos' 
                        ? 'No se encontraron transacciones que coincidan con los filtros' 
                        : 'No hay transacciones registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="block mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 md:table-row md:border-none md:shadow-none md:mb-0 md:hover:bg-gray-50 transition-colors duration-200">
                      
                      {/* Transacción Info */}
                      <td className="p-4 flex items-center border-b border-gray-200 md:border-b-0 md:table-cell md:px-6 md:py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">#{transaction.id}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{transaction.descriptionProduct}</div>
                            <div className="text-sm text-gray-500">{formatDate(transaction.dateSale)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Cliente:">
                        <div className="text-sm font-medium text-gray-900">{transaction.client.name}</div>
                        <div className="text-sm text-gray-500">{transaction.client.telefono}</div>
                      </td>

                      {/* Tipo */}
                      <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Tipo:">
                        {getTypeBadge(transaction.productType)}
                      </td>

                      {/* Monto */}
                      <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Monto:">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.priceTotal)}</div>
                        {!transaction.completed && (
                          <div className="text-sm text-gray-500">Pendiente: {formatCurrency(transaction.remainingAmount)}</div>
                        )}
                      </td>

                      {/* Progreso */}
                      <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Progreso:">
                        {transaction.typePayments === 'SEMANAL' ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.paidFeesCount}/{transaction.totalFees} cuotas
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(transaction.paidFeesCount / transaction.totalFees) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Pago único</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Estado:">
                        {getStatusBadge(transaction)}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 block md:table-cell text-right md:text-left relative before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Acciones:">
                        <div className="flex justify-end md:justify-start space-x-2">
                          <Link 
                            to={`/dashboard/ventas/${transaction.id}`}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Ver
                          </Link>
                          <button 
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            disabled={deletingId === transaction.id}
                            className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                          >
                            {deletingId === transaction.id ? (
                              <Loader2 className="w-4 h-4 animate-spin inline" />
                            ) : (
                              'Eliminar'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        {filteredTransactions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Transacciones Filtradas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{filteredTransactions.length}</p>
                <p className="text-sm text-gray-500">Total Transacciones</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredTransactions.filter(t => t.completed).reduce((sum, t) => sum + t.priceTotal, 0))}
                </p>
                <p className="text-sm text-gray-500">Ingresos Completados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(filteredTransactions.filter(t => !t.completed).reduce((sum, t) => sum + t.remainingAmount, 0))}
                </p>
                <p className="text-sm text-gray-500">Pendiente de Cobro</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Ventas;