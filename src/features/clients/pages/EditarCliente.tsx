import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { clientService } from '@/features/clients/services/clientServices';
import { useClients } from '@features/clients/hooks/useClients';
import { DashboardLayout } from '@/shared/components/layout';
import ClientForm, { ClientFormData } from '@features/clients/components/ClientForm';
import Load from '@/shared/components/feedback/Load';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const EditarCliente: React.FC<PageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { updateClient } = useClients();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { id } = useParams<{ id: string }>(); // Access the client ID from the URL

  const [initialValues, setInitialValues] = useState<ClientFormData | undefined>(undefined);

  useEffect(() => {
    const fetchClient = async () => {
      if (id) {
        setInitialLoading(true);
        try {
          const client = await clientService.getClientById(Number(id));
          setInitialValues({
            name: client.name,
            email: client.email || '',
            telefono: client.telefono,
            direccion: client.direccion || '',
            dni: client.dni || '',
            sellerId: client.sellerId || '',
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al cargar el cliente');
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchClient();
  }, [id]);

  const handleSubmit = async (formData: ClientFormData) => {
    try {
      setLoading(true);
      setError(null);

      const clientData = {
        name: formData.name.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim() || '',
        direccion: formData.direccion.trim() || '',
        dni: formData.dni.trim().toLowerCase().replace(/\s+/g, ''),
        sellerId: formData.sellerId ? Number(formData.sellerId) : undefined,
      };

      if (id) {
        await updateClient(Number(id), clientData);
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/clientes');
        }, 1500);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el cliente');
    } finally {
      setLoading(false);
    }
  };

  if(error){
    return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )
  }

  if(success){
      return (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">Cliente actualizado exitosamente. Redirigiendo...</span>
            </div>
          </div>
        )
  }

  return (
    <DashboardLayout title="Editar Cliente" user={user} onLogout={onLogout}>
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Editar Cliente</h2>
              <p className="text-sm text-gray-500">Modifica la información del cliente</p>
            </div>
          </div>
        </div>

        {/* Form */}
        {initialLoading ? (
          <Load />
        ) : (
          <ClientForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel="Guardar Cambios"
            cancelTo="/dashboard/clientes"
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditarCliente;
