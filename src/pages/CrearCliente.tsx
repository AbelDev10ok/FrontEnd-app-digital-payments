import React, { useEffect, useState } from 'react';
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashBoardLayout';
import { useClients } from '../hooks/useClients';
import { clientService } from '../services/clientServices';
import InputWithIcon from '../components/form/InputWithIcon';
import AutocompleteSeller from '../components/autocomplete/AutocompleteSeller';
import SubmitBar from '../components/form/SubmitBar';

// Asumimos que esta es la interfaz que representa tanto a un cliente como a un vendedor
export interface Client {
  id: number;
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  sellerId?: number;
  vendedor: boolean;
}

const CrearCliente: React.FC = () => {
  const navigate = useNavigate();
  const { createClient } = useClients();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [sellers, setSellers] = useState<Client[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefono: '',
    direccion: '',
    sellerId: '', 
    dni: ''
  });




  // useEffect para cargar los vendedores cuando el componente se monta
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await clientService.getVendedores()
        setSellers(response);
        console.log("Cargando vendedores..."); // Simulación
      } catch (err) {
        console.error("Error al cargar los vendedores:", err);
      } finally {
        setSellersLoading(false);
      }
    };

    fetchSellers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // limpiamos error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.length < 2 || formData.name.length > 15) {
      newErrors.name = 'El nombre debe tener entre 2 y 15 caracteres';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^[0-9]{10,15}$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono debe contener solo números y tener entre 10 y 15 dígitos';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email debe tener un formato válido';
    }

    if (formData.direccion && formData.direccion.length > 20) {
      newErrors.direccion = 'La dirección no puede exceder los 20 caracteres';
    }

    if (!/^[0-9]{7,8}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe contener solo números y tener entre 7 y 8 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
        clientData.sellerId = parseInt(formData.sellerId, 10);
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
    <DashboardLayout title="Crear Nuevo Cliente">
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

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">Cliente creado exitosamente. Redirigiendo...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <InputWithIcon id="name" name="name" label="Nombre Completo *" value={formData.name} onChange={handleInputChange} placeholder="Ingresa el nombre completo" error={errors.name} />
              </div>

              <div>
                <InputWithIcon id="dni" name="dni" label="DNI *" value={formData.dni} onChange={handleInputChange} placeholder="Ingresa el DNI" error={errors.dni} />
              </div>

              {/* Email */}
              <div>
                <InputWithIcon id="email" name="email" label="Email *" type="email" value={formData.email} onChange={handleInputChange} placeholder="cliente@email.com" error={errors.email} />
              </div>

              {/* Teléfono */}
              <div>
                <InputWithIcon id="telefono" name="telefono" label="Teléfono *" value={formData.telefono} onChange={handleInputChange} placeholder="1234567890" error={errors.telefono} />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <InputWithIcon id="direccion" name="direccion" label="Dirección" value={formData.direccion} onChange={handleInputChange} placeholder="Dirección completa" error={errors.direccion} />
            </div>

            {/* Vendedor (Opcional) */}
            <div>
              <AutocompleteSeller
                value={formData.sellerId}
                sellers={sellers}
                onChange={(id) => setFormData(prev => ({ ...prev, sellerId: id }))}
                error={errors.sellerId}
              />
              {sellersLoading && <p className="text-sm text-gray-500 mt-1">Cargando vendedores...</p>}
            </div>

            {/* Buttons */}
            <SubmitBar cancelTo="/dashboard/clientes" isDisabled={loading} submitLabel={loading ? 'Creando...' : 'Crear Cliente'} />
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CrearCliente;