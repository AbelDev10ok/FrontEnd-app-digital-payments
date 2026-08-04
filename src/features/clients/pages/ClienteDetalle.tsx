import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import Load from '@/shared/components/feedback/Load';
import { Client } from '@/shared/types/client';
import InfoCliente from '@features/clients/components/InfoCliente';
import ClientEstadoFinansa from '@features/clients/components/ClientEstadoFinansa';
import ClientResumenFinansas from '@features/clients/components/ClientResumenFinansas';
import { clientService } from '@features/clients/services/clientServices';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { Alert, Card } from '@/shared/components/ui';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const ClienteDetalle: React.FC<PageProps> = ({ user, onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialStats, setFinancialStats] = useState({
    deudaVentas: 0,
    ventasPagadas: 0,
    deudaPrestamos: 0,
    prestamosPagados: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);



  const handleHabilitarVendedor  = async () => {
    // Aseguramos que tenemos el id y el cliente antes de continuar
    if (!id || !client) return;
    
    try {
      // Opcional: podrías mostrar un spinner en el botón mientras se procesa
      await clientService.habilitarVendedor(parseInt(id));

      
      // Actualizamos el estado del cliente localmente para reflejar el cambio.
      // Esto hará que la UI se actualice instantáneamente sin recargar la página.
      setClient((prev) => (prev ? { ...prev, seller: true } : prev));
    } catch (err) {
      // Mejoramos el manejo de errores para obtener más detalles si es posible.
      // A menudo, los errores de API vienen con un objeto `response` que contiene más información.
      let errorMessage = 'Ocurrió un error inesperado.';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message as string;
      }
      
      setError(`Error al habilitar como vendedor: ${errorMessage}`);
      // Hacemos un console.error del objeto de error completo para tener más contexto en la consola.
    }
  }

  const handleDeshabilitarVendedor = async () => {
    if (!id || !client) return;
    try {
      // TODO: Asegúrate de que `deshabilitarVendedor` exista en tu clientService.
      await clientService.desabilitarVendedor(parseInt(id));
      setClient((prev) => (prev ? { ...prev, seller: false } : prev));
    } catch (err) {
      let errorMessage = 'Ocurrió un error inesperado.';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message as string;
      }
      setError(`Error al deshabilitar como vendedor: ${errorMessage}`);
    }
  };

  const handleEliminarCliente = async () => {
    if (!client) return;
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) {
      try {
        setLoading(true);
        await clientService.deleteClient(client.id);
        navigate('/dashboard/clientes');
      } catch (err) {
        setLoading(false);
        let errorMessage = 'Ocurrió un error inesperado.';
        if (err && typeof err === 'object' && 'message' in err) {
          errorMessage = err.message as string;
        }
        setError(`Error al eliminar el cliente: ${errorMessage}`);
      }
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



        // Cargar estadísticas financieras del cliente
        setLoadingStats(true);
        const [deudaVentas, ventasPagadas, deudaPrestamos, prestamosPagados] = await Promise.all([
          clientService.calcularDeudaTotalVentas(parseInt(id)),
          clientService.calcularTotalVentasPagadas(parseInt(id)),
          clientService.calcularDeudaTotalPrestamos(parseInt(id)),
          clientService.calcularTotalPrestamosPagados(parseInt(id))
        ]);

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
        <Alert tone="danger">{error}</Alert>
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
          <div className="w-12 h-12 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full flex items-center justify-center">
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
          <Card className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                <span className="text-gray-600">Cargando estadísticas financieras...</span>
              </div>
            </div>
          </Card>
        ) : (
          <ClientEstadoFinansa financialStats={financialStats} formatCurrency={formatCurrency} />
        )}

        {/* Financial Summary */}
        <ClientResumenFinansas financialStats={financialStats} formatCurrency={formatCurrency} />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Link
            to={`/dashboard/ventas/todas?clientName=${encodeURIComponent(client.name)}`}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Ver Ventas
          </Link>
          <Link
              to={`/dashboard/clientes/editar/${client.id}`}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
          >Editar Cliente
          </Link>
          {client.seller ? (
            <button
              onClick={handleDeshabilitarVendedor}
              className="px-6 py-3 border border-red-200 text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors duration-200">
              Deshabilitar Vendedor
            </button>
          ) : (
            <button
              onClick={handleHabilitarVendedor}
              className="px-6 py-3 border border-brand-200 text-brand-700 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors duration-200">
              Habilitar como Vendedor
            </button>
          )}
          <button
            onClick={handleEliminarCliente}
            className="px-6 py-3 border border-red-200 text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors duration-200 flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Eliminar Cliente
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClienteDetalle;