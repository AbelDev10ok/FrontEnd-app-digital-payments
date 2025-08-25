import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, DollarSign, CreditCard, Banknote, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/DashBoardLayout';
import { clientService, Client } from '../services/clientServices';

const ClienteDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialStats, setFinancialStats] = useState({
    deudaVentas: 0,
    ventasPagadas: 0,
    deudaPrestamos: 0,
    prestamosPagados: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  useEffect(() => {
    const fetchClientData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        
        const clientData = await clientService.getClientById(parseInt(id));
        setClient(clientData);
        
        // Cargar estadísticas financieras del cliente
        setLoadingStats(true);
        const [deudaVentas, ventasPagadas, deudaPrestamos, prestamosPagados] = await Promise.all([
          clientService.calcularDeudaTotalVentas(parseInt(id)),
          clientService.calcularTotalVentasPagadas(parseInt(id)),
          clientService.calcularDeudaTotalPrestamos(parseInt(id)),
          clientService.calcularTotalPrestamosPagados(parseInt(id))
        ]);

        console.log({ deudaVentas, ventasPagadas, deudaPrestamos, prestamosPagados });
        setFinancialStats({
          deudaVentas,
          ventasPagadas,
          deudaPrestamos,
          prestamosPagados
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el cliente');
      } finally {
        setLoading(false);
        setLoadingStats(false);
      }
    };

    fetchClientData();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Detalle del Cliente">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando información del cliente...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout title="Detalle del Cliente">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/clientes"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error || 'Cliente no encontrado'}</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Cliente: ${client.name}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard/clientes"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {client.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{client.name}</h2>
            <p className="text-sm text-gray-500">ID: {client.id}</p>
          </div>
        </div>

        {/* INFORMACIÓN DEL CLIENTE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email || 'No especificado'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{client.telefono}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 md:col-span-2">
              <div className="bg-orange-50 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900">{client.direccion || 'No especificada'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        {loadingStats ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-gray-600">Cargando estadísticas financieras...</span>
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {/* Financial Summary */}
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

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Link
              to={`/dashboard/clientes/editar/${client.id}`}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
          >Editar Cliente
          </Link>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200">
            Nueva Transacción
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClienteDetalle;