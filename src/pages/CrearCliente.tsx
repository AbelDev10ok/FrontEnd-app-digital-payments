import React, { useEffect, useState } from 'react';
import { UserPlus, ArrowLeft, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashBoardLayout';
import { useClients } from '../hooks/useClients';
import { clientService } from '../services/clientServices';

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefono: '',
    direccion: '',
    sellerId: '', 
    dni: ''
  });

  // Estado para la lista de vendedores y su carga
  const [sellers, setSellers] = useState<Client[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // useEffect para cargar los vendedores cuando el componente se monta
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        // AQUÍ DEBES HACER EL FETCH REAL A TU API PARA OBTENER LOS VENDEDORES
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
  }, []); // El array vacío asegura que se ejecute solo una vez

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.name 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Ingresa el nombre completo"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
                  DNI *
                </label>
                <input
                  type="text"
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.dni
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Ingresa el DNI"
                />
                {errors.dni && (
                  <p className="mt-1 text-sm text-red-600">{errors.dni}</p>
                )}
              </div>



              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="cliente@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.telefono 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="1234567890"
                />
                {errors.telefono && (
                  <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.direccion 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                placeholder="Dirección completa"
              />
              {errors.direccion && (
                <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
              )}
            </div>

            {/* Vendedor (Opcional) */}
            <div>
              <label htmlFor="sellerId" className="block text-sm font-medium text-gray-700 mb-2">
                Vendedor (Opcional)
              </label>
              <select
                id="sellerId"
                name="sellerId"
                value={formData.sellerId}
                onChange={handleInputChange}
                disabled={sellersLoading}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors bg-white ${
                  sellersLoading ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-200 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              >
                <option value="">-- Sin Vendedor --</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
              {sellersLoading && <p className="text-sm text-gray-500 mt-1">Cargando vendedores...</p>}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to="/dashboard/clientes"
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Cliente
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CrearCliente;