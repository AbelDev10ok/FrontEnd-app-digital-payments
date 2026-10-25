// src/features/ventas/components/SaleForm.tsx

import React, { useState, useEffect } from 'react';
import InputWithIcon from '@/features/crearVentas/components/InputWithIcon';
import SubmitBar from '@/features/crearVentas/components/SubmitBar';
import { SaleResponseDto, ProductTypeDto } from '@/shared/types/sales';
import { formatCurrency, getCurrencySymbol } from '@/shared/utils/formatCurrency';
import { getLocalDateString, toInputDate } from '@/shared/utils/formatDate';
import SelectWithIcon from '@/features/crearVentas/components/SelectWithIcon';
import { Select } from '@/shared/components/ui';
import ErrorAnnouncer from '@/shared/components/feedback/ErrorAnnouncer';
import useFormErrorA11y from '@/shared/hooks/useFormErrorA11y';
import { Tv } from 'lucide-react';

export interface SaleFormData {
  descriptionProduct: string;
  amountFee: number;
  dateSale: string;
  clientId?: number;
  quantityFees: number;
  payments: string;
  cost: number;
  productTypeId: number | null;
}

interface SaleFormState {
  descriptionProduct: string;
  amountFee: string | number;
  dateSale: string;
  clientId?: number;
  quantityFees: string | number;
  payments: string;
  cost: string | number;
  productTypeId: number | null;
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
  productTypeLocked?: boolean;
  descriptionProductLocked?: boolean;
}

const SaleForm: React.FC<SaleFormProps> = ({
  initialValues,
  onSubmit,
  loading,
  submitLabel,
  cancelTo,
  productTypes,
  onDelete,
  showFinancialFields = true,
  productTypeLocked = false,
  descriptionProductLocked = false
}) => {
  const [formData, setFormData] = useState<SaleFormState>({
    descriptionProduct: '',
    amountFee: '',
    dateSale: getLocalDateString(),
    quantityFees: '',
    payments: 'MENSUAL',
    cost: '',
    productTypeId: null
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Enfoca el primer campo inválido y anuncia los errores tras un envío fallido
  const { formRef, errorAnnouncement, reportErrors } = useFormErrorA11y();

  // Determinar si la transacción es un préstamo por su kind (no por categoría)
  const isPrestamo = initialValues?.kind === 'PRESTAMO';
  // Los importes ya guardados conservan su moneda: el símbolo del campo la sigue.
  const simbolo = getCurrencySymbol(initialValues?.currency ?? undefined);

  useEffect(() => {
    if (initialValues) {
      setFormData({
        descriptionProduct: initialValues.descriptionProduct || '',
        amountFee: initialValues.amountFee,
        // Aseguramos formato YYYY-MM-DD para el input date
        dateSale: initialValues.dateSale ? toInputDate(initialValues.dateSale) : getLocalDateString(),
        clientId: initialValues.client?.id,
        quantityFees: initialValues.quantityFees || 1,
        payments: initialValues.typePayments,
        cost: initialValues.cost,
        productTypeId: initialValues.productType?.id ?? null
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
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : (parseInt(value) || null) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    const amountFee = Number(formData.amountFee);
    const quantityFees = Number(formData.quantityFees);
    const cost = Number(formData.cost);

    if (!formData.descriptionProduct.trim() && !isPrestamo) {
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
          newErrors.amountFee = `El monto no puede ser menor a lo ya pagado (${formatCurrency(amountPaid, initialValues?.currency ?? undefined)})`;
        }
      }

      if (!formData.dateSale) {
        newErrors.dateSale = 'La fecha es obligatoria';
      }
    }

    if (!isPrestamo && !formData.productTypeId) {
      newErrors.productTypeId = 'El tipo de producto es obligatorio';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // evita doble envío mientras hay una petición en curso
    if (loading) return;
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      // Convertir a números antes de enviar para cumplir con la interfaz SaleFormData
      const submitData: SaleFormData = {
        ...formData,
        amountFee: Number(formData.amountFee),
        quantityFees: Number(formData.quantityFees),
        cost: Number(formData.cost),
        clientId: formData.clientId
      };
      await onSubmit(submitData);
    } else {
      // enfoca el primer campo inválido y anuncia los errores (aria-live)
      reportErrors(newErrors);
    }
  };

  const today = getLocalDateString();


  return (
    <div className="bg-white rounded-card shadow-card">
      <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
        <ErrorAnnouncer message={errorAnnouncement} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Descripción */}
          <div className="md:col-span-2">
            <InputWithIcon
              id="descriptionProduct"
              name="descriptionProduct"
              label="Descripción del Producto *"
              value={formData.descriptionProduct}
              onChange={handleInputChange}
              placeholder="Ej: Televisor Samsung 50'"
              error={errors.descriptionProduct}
              disabled={descriptionProductLocked}
            />
          </div>

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
                symbol={simbolo}
                error={errors.amountFee}
              />
              {initialValues && (
                <p className="text-xs text-gray-500 mt-1">
                  Deuda actual: {formatCurrency(initialValues.remainingAmount, initialValues.currency ?? undefined)} (Pagado: {formatCurrency(initialValues.amountFee - initialValues.remainingAmount, initialValues.currency ?? undefined)})
                </p>
              )}
            </div>
          )}

          {/* Tipo de Producto (solo ventas) */}
          {!isPrestamo && (
            <div>
              <SelectWithIcon
                id="productTypeId"
                name="productTypeId"
                label="Tipo de Producto *"
                value={formData.productTypeId ?? ''}
                onChange={handleInputChange}
                options={[{ value: '', label: 'Selecciona un tipo' }, ...productTypes.map(pt => ({ value: String(pt.id), label: pt.name }))]}
                icon={<Tv className="w-4 h-4 text-brand-600" />}
                error={errors.productTypeId}
                disabled={productTypeLocked}
              />
            </div>
          )}

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
                symbol={simbolo}
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
