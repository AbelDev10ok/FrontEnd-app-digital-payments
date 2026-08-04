import React, { useState, useEffect } from 'react';
import { Pencil, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { clientService } from '@/features/clients/services/clientServices';
import { useClients } from '@features/clients/hooks/useClients';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import ClientForm, { ClientFormData } from '@features/clients/components/ClientForm';
import Load from '@/shared/components/feedback/Load';
import { Alert, PageHeader } from '@/shared/components/ui';

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

  return (
    <DashboardLayout title="Editar Cliente" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <PageHeader
          title="Editar Cliente"
          subtitle="Modifica la información del cliente"
          icon={<Pencil className="w-6 h-6 text-brand-600" />}
          actions={
            <Link
              to="/dashboard/clientes"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          }
        />

        {error && <Alert tone="danger">{error}</Alert>}

        {success && (
          <Alert tone="success">Cliente actualizado exitosamente. Redirigiendo...</Alert>
        )}

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
