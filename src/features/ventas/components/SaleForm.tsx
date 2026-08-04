// src/features/ventas/components/SaleForm.tsx

import React, { useState, useEffect } from 'react';
import InputWithIcon from '@/features/crearVentas/components/InputWithIcon';
import SubmitBar from '@/features/crearVentas/components/SubmitBar';
import { SaleResponseDto, ProductTypeDto } from '@/shared/types/sales';
import SelectWithIcon from '@/features/crearVentas/components/SelectWithIcon';
import { Select } from '@/shared/components/ui';
import { Tv, DollarSign } from 'lucide-react';

export interface SaleFormData {
  descriptionProduct: string;
  amountFee: number;
  dateSale: string;
  clientId?: number;
  quantityFees: number;
  payments: string;
  cost: number;
  productTypeId: number;
}

interface SaleFormState {
  descriptionProduct: string;
  amountFee: string | number;
  dateSale: string;
  clientId?: number;
  quantityFees: string | number;
  payments: string;
  cost: string | number;
  productTypeId: number;
}

interface SaleFormProps {
  initialValues?: SaleResponseDto;
  onSubmit: (data: SaleFormData) => Promise<void>;
  loading: boolean;
  submitLabel: string;
  cancelTo: string;
  productTypes: ProductTypeDto[];
  onDelete?: () => Promise<void> | void;
  showFinancialFields?: boolean;
}

const SaleForm: React.FC<SaleFormProps> = ({
  initialValues,
  onSubmit,
  loading,
  submitLabel,
  cancelTo,
  productTypes,
  onDelete,
  showFinancialFields = true
}) => {
  const [formData, setFormData] = useState<SaleFormState>({
    descriptionProduct: '',
    amountFee: '',
    dateSale: new Date().toISOString().split('T')[0],
    quantityFees: '',
    payments: 'MENSUAL',
    cost: '',
    productTypeId: 0
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determinar si el tipo seleccionado es PRESTAMO para ocultar la descripción
  const selectedProductType = productTypes.find(pt => pt.id === formData.productTypeId);
  const isPrestamo = selectedProductType?.name === "PRESTAMO";

  // Auto-completar descripción si es préstamo
  useEffect(() => {
    if (isPrestamo) {
      setFormData(prev => ({ ...prev, descriptionProduct: 'Préstamo personal' }));
    }
  }, [isPrestamo]);

  useEffect(() => {
    if (initialValues) {
      setFormData({
        descriptionProduct: initialValues.descriptionProduct || '',
        amountFee: initialValues.amountFee,
        // Aseguramos formato YYYY-MM-DD para el input date
        dateSale: initialValues.dateSale ? new Date(initialValues.dateSale).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        clientId: initialValues.client?.id,
        quantityFees: initialValues.quantityFees || 1,
        payments: initialValues.typePayments,
        cost: initialValues.cost,
        productTypeId: initialValues .productType?.id 
      });
    }
  }, [initialValues]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amountFee' || name === 'cost') {
      // Permitir solo números y un punto decimal
      if (/^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'quantityFees') {
      // Permitir solo números enteros
      if (/^\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'productTypeId') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const amountFee = Number(formData.amountFee);
    const quantityFees = Number(formData.quantityFees);
    const cost = Number(formData.cost);

    if (!formData.descriptionProduct.trim()) {
      newErrors.descriptionProduct = 'La descripción es obligatoria';
    }

    if (showFinancialFields) {
      if (!amountFee || amountFee <= 0) {
        newErrors.amountFee = 'El monto debe ser mayor a 0';
      }

      if (!quantityFees || quantityFees <= 0) {
        newErrors.quantityFees = 'La cantidad de cuotas debe ser mayor a 0';
      }

      if (!cost || cost <= 0) {
        newErrors.cost = 'El costo debe ser mayor a 0';
      }

      // Validación crítica: El nuevo monto no puede ser menor a lo que ya se pagó
      if (initialValues) {
        const totalAmount = initialValues.amountFee
        const amountPaid = totalAmount - initialValues.remainingAmount;
        if (amountFee < amountPaid) {
          newErrors.amountFee = `El monto no puede ser menor a lo ya pagado ($${amountPaid})`;
        }
      }

      if (!formData.dateSale) {
        newErrors.dateSale = 'La fecha es obligatoria';
      }
    }

    if (!formData.productTypeId) {
      newErrors.productTypeId = 'El tipo de producto es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Convertir a números antes de enviar para cumplir con la interfaz SaleFormData
      const submitData: SaleFormData = {
        ...formData,
        amountFee: Number(formData.amountFee),
        quantityFees: Number(formData.quantityFees),
        cost: Number(formData.cost),
        clientId: formData.clientId
      };
      await onSubmit(submitData);
    }
  };

  const today = new Date().toISOString().split('T')[0];


  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Descripción */}
          {!isPrestamo ? (
            <div className="md:col-span-2">
              <InputWithIcon
                id="descriptionProduct"
                name="descriptionProduct"
                label="Descripción del Producto *"
                value={formData.descriptionProduct}
                onChange={handleInputChange}
                placeholder="Ej: Televisor Samsung 50'"
                error={errors.descriptionProduct}
              />
            </div>
          ) : null}

          {/* Monto Total */}
          {showFinancialFields && (
            <div>
              <InputWithIcon
                id="amountFee"
                name="amountFee"
                label="Monto de Cuota *"
                type="text"
                value={formData.amountFee}
                onChange={handleInputChange}
                placeholder="0.00"
                error={errors.amountFee}
              />
              {initialValues && (
                <p className="text-xs text-gray-500 mt-1">
                  Deuda actual: ${initialValues.remainingAmount} (Pagado: ${(initialValues.amountFee - initialValues.remainingAmount)})
                </p>
              )}
            </div>
          )}

          {/* Tipo de Producto */}
          <div>
            <SelectWithIcon
              id="productTypeId"
              name="productTypeId"
              label="Tipo de Producto *"
              value={formData.productTypeId}
              onChange={handleInputChange}
              options={[{ value: '', label: 'Selecciona un tipo' }, ...productTypes.map(pt => ({ value: String(pt.id), label: pt.name }))]}
              icon={<Tv className="w-4 h-4 text-brand-600" />}
              error={errors.productTypeId}
            />
          </div>

          {/* Costo */}
          {showFinancialFields && (
            <div>
              <InputWithIcon
                id="cost"
                name="cost"
                label="Costo *"
                type="text"
                value={formData.cost}
                onChange={handleInputChange}
                placeholder="0.00"
                icon={<DollarSign className="w-4 h-4" />}
                error={errors.cost}
              />
            </div>
          )}

          {/* Cantidad de Cuotas */}
          {showFinancialFields && (
            <div>
              <InputWithIcon
                id="quantityFees"
                name="quantityFees"
                label="Cantidad de Cuotas *"
                type="text"
                value={formData.quantityFees}
                onChange={handleInputChange}
                placeholder="1"
                error={errors.quantityFees}
              />
            </div>
          )}

          {/* Frecuencia de Pago */}
          {showFinancialFields && (
            <div>
              <label htmlFor="payments" className="block text-sm font-medium text-gray-700 mb-1">
                Frecuencia de Pago *
              </label>
              <div className="relative">
                <Select
                  id="payments"
                  name="payments"
                  value={formData.payments}
                  onChange={handleInputChange}
                  className="appearance-none"
                >
                  <option value="SEMANAL">Semanal</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                  <option value="CONTADO">Contado</option>
                </Select>
              </div>
            </div>
          )}

          {/* Fecha de Venta */}
          {showFinancialFields && (
            <div>
              <InputWithIcon
                id="dateSale"
                name="dateSale"
                label="Fecha de Venta *"
                type="date"
                value={formData.dateSale}
                onChange={handleInputChange}
                error={errors.dateSale}
                max={today}
              />
            </div>
          )}
          
          
          {/* Cliente (Solo lectura para evitar inconsistencias complejas por ahora) */}
          {initialValues && (
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <div className="p-3 bg-gray-50 rounded-xl text-gray-700 border border-gray-200">
                    {initialValues.client.name} <span className="text-gray-400 text-sm">({initialValues.client.telefono})</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Para cambiar el cliente, es recomendable cancelar esta venta y crear una nueva.</p>
             </div>
          )}
        </div>

          <div className="flex-1">
            <SubmitBar
              onDelete={onDelete}
              cancelTo={cancelTo}
              isDisabled={loading}
              submitLabel={loading ? 'Guardando...' : submitLabel}
            />
          </div>
      </form>
    </div>
  );
};

export default SaleForm;
