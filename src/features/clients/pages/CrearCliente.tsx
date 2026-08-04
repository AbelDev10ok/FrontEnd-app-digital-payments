import React, { useState } from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useClients } from '@/features/clients/hooks/useClients';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import ClientForm, { ClientFormData } from '@features/clients/components/ClientForm';
import { Alert, PageHeader } from '@/shared/components/ui';

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

  return (
    <DashboardLayout title="Crear Nuevo Cliente" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <PageHeader
          title="Nuevo Cliente"
          subtitle="Completa la información del cliente"
          icon={<UserPlus className="w-6 h-6 text-brand-600" />}
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
          <Alert tone="success">Cliente creado exitosamente. Redirigiendo...</Alert>
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