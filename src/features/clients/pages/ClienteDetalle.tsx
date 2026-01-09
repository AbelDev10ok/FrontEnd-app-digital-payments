import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, CreditCard, Banknote, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import Load from '@/shared/components/feedback/Load';
import { Client } from '@/types/client';
import InfoCliente from '../components/InfoCliente';
import { clientService } from '../services/clientServices';
import { DashboardLayout } from '@/shared/components/layout';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const ClienteDetalle: React.FC<PageProps> = ({ user, onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  // const navigate = useNavigate();
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

  const handleHabilitarVendedor  = async () => {
    // Aseguramos que tenemos el id y el cliente antes de continuar
    if (!id || !client) return;
    
    try {
      // Opcional: podrías mostrar un spinner en el botón mientras se procesa
      await clientService.habilitarVendedor(parseInt(id));

      console.log(client + "asdasdasd")
      
      // Actualizamos el estado del cliente localmente para reflejar el cambio.
      // Esto hará que la UI se actualice instantáneamente sin recargar la página.
      setClient({ ...client, vendedor: true });
    } catch (err) {
      // Mejoramos el manejo de errores para obtener más detalles si es posible.
      // A menudo, los errores de API vienen con un objeto `response` que contiene más información.
      let errorMessage = 'Ocurrió un error inesperado.';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message as string;
      }
      
      setError(`Error al habilitar como vendedor: ${errorMessage}`);
      // Hacemos un console.error del objeto de error completo para tener más contexto en la consola.
      console.error("Detalles del error al habilitar como vendedor:", err);
    }
  }

  const handleDeshabilitarVendedor = async () => {
    if (!id || !client) return;
    try {
      // TODO: Asegúrate de que `deshabilitarVendedor` exista en tu clientService.
      await clientService.desabilitarVendedor(parseInt(id));
      setClient({ ...client, vendedor: false });
    } catch (err) {
      let errorMessage = 'Ocurrió un error inesperado.';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message as string;
      }
      setError(`Error al deshabilitar como vendedor: ${errorMessage}`);
      console.error("Detalles del error al deshabilitar como vendedor:", err);
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);


        
        const clientData = await clientService.getClientById(parseInt(id));
        setClient(clientData);
        
        console.log(clientData.vendedor + "asdasdasdas");


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

  if(loading) {
    return (
      <DashboardLayout title="Detalles de Cliente" user={user} onLogout={onLogout}>
        <Load />
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout title="Gestión de Clientes" user={user} onLogout={onLogout}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-5 h-5 mr-3" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Cliente: ${client.name}`} user={user} onLogout={onLogout}>
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
        <InfoCliente client={client} />

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
          {client.vendedor ? (
            <button
              onClick={handleDeshabilitarVendedor}
              className="px-6 py-3 border border-red-200 text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors duration-200">
              Deshabilitar Vendedor
            </button>
          ) : (
            <button
              onClick={handleHabilitarVendedor}
              className="px-6 py-3 border border-green-200 text-green-700 bg-green-50 rounded-xl hover:bg-green-100 transition-colors duration-200">
              Habilitar como Vendedor
            </button>
          )}
          {/* <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200">
            Nueva Transacción
          </button> */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClienteDetalle;