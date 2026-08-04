import React, { useState } from 'react';
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useClients } from '@/features/clients/hooks/useClients';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import ClientForm, { ClientFormData } from '@features/clients/components/ClientForm';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const CrearCliente: React.FC<PageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { createClient } = useClients();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: ClientFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const clientData: {
        name: string;
        telefono: string;
        email: string;
        direccion: string;
        sellerId?: number;
        dni?: string;
      } = {
        dni: formData.dni.trim().toLowerCase().replace(/\s+/g, ''),
        name: formData.name.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim() || '',
        direccion: formData.direccion.trim() || '',
      };

      if (formData.sellerId) {
        clientData.sellerId = Number(formData.sellerId);
      }

      await createClient(clientData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/clientes');
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cliente');
    } finally {
      setLoading(false);
    }
  };

  // if (error) {
  //   return (
  //         <div className="bg-red-50 border border-red-200 rounded-xl p-4">
  //           <div className="flex items-center text-red-800">
  //             <AlertCircle className="w-5 h-5 mr-3" />
  //             <span className="text-sm">{error}</span>
  //           </div>
  //         </div>
  //       )
  // }

  if (success) {
    return (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">Cliente creado exitosamente. Redirigiendo...</span>
            </div>
          </div>
        )      
  }


  return (
    <DashboardLayout title="Crear Nuevo Cliente" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/clientes"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <UserPlus className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Cliente</h2>
              <p className="text-sm text-gray-500">Completa la información del cliente</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center text-green-800">  
              <CheckCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">Cliente creado exitosamente. Redirigiendo...</span>
            </div>
          </div>
        )}


        {/* Form */}
        <ClientForm
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Crear Cliente"
          cancelTo="/dashboard/clientes"
        />
      </div>
    </DashboardLayout>
  );
};

export default CrearCliente;