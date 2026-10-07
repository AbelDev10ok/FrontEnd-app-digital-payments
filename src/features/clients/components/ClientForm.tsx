import React, { useState, useEffect } from 'react';
import { Client } from '@/shared/types/client';
import InputWithIcon from '@/features/crearVentas/components/InputWithIcon';
import AutocompleteSeller from '@/shared/components/AutocompleteSeller';
import SubmitBar from '@/features/crearVentas/components/SubmitBar';
import { clientService } from '@features/clients/services/clientServices';

// Definimos la estructura de los datos del formulario
export interface ClientFormData {
  name: string;
  email: string;
  telefono: string;
  direccion: string;
  sellerId: string | number;
  dni: string;
}

interface ClientFormProps {
  initialValues?: ClientFormData;
  onSubmit: (data: ClientFormData) => Promise<void>;
  loading: boolean;
  submitLabel: string;
  cancelTo: string;
}

const ClientForm: React.FC<ClientFormProps> = ({
  initialValues,
  onSubmit,
  loading,
  submitLabel,
  cancelTo
}) => {
  // Valores por defecto si no se pasan initialValues
  const defaultValues: ClientFormData = {
    name: '',
    email: '',
    telefono: '',
    direccion: '',
    sellerId: '',
    dni: ''
  };

  const [formData, setFormData] = useState<ClientFormData>(initialValues || defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sellers, setSellers] = useState<Client[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);

  // Cargar vendedores al montar el componente
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await clientService.getVendedoresActivos();
        setSellers(response);
      } catch (err) {
        console.error("Error al cargar los vendedores:", err);
      } finally {
        setSellersLoading(false);
      }
    };

    fetchSellers();
  }, []);

  // Actualizar el formulario si cambian los valores iniciales (útil para EditarCliente cuando terminan de cargar los datos)
  useEffect(() => {
    if (initialValues) {
      setFormData(prev => ({ ...prev, ...initialValues }));
    }
  }, [initialValues]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card border border-gray-100">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div>
            <InputWithIcon 
              id="name" 
              name="name" 
              label="Nombre Completo *" 
              value={formData.name} 
              onChange={handleInputChange} 
              placeholder="Ingresa el nombre completo" 
              error={errors.name} 
            />
          </div>

          {/* DNI */}
          <div>
            <InputWithIcon 
              id="dni" 
              name="dni" 
              label="DNI *" 
              value={formData.dni} 
              onChange={handleInputChange} 
              placeholder="Ingresa el DNI" 
              error={errors.dni} 
            />
          </div>

          {/* Email */}
          <div>
            <InputWithIcon 
              id="email" 
              name="email" 
              label="Email *" 
              type="email" 
              value={formData.email} 
              onChange={handleInputChange} 
              placeholder="cliente@email.com" 
              error={errors.email} 
            />
          </div>

          {/* Teléfono */}
          <div>
            <InputWithIcon 
              id="telefono" 
              name="telefono" 
              label="Teléfono *" 
              value={formData.telefono} 
              onChange={handleInputChange} 
              placeholder="1234567890" 
              error={errors.telefono} 
            />
          </div>
        </div>

        {/* Dirección */}
        <div>
          <InputWithIcon 
            id="direccion" 
            name="direccion" 
            label="Dirección" 
            value={formData.direccion} 
            onChange={handleInputChange} 
            placeholder="Dirección completa" 
            error={errors.direccion} 
          />
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
        <SubmitBar 
          cancelTo={cancelTo} 
          isDisabled={loading} 
          submitLabel={loading ? 'Guardando...' : submitLabel} 
        />
      </form>
    </div>
  );
};

export default ClientForm;
