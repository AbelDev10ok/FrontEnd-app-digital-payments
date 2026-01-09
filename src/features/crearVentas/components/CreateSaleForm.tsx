/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import InputWithIcon from '@/features/crearVentas/components/InputWithIcon';
import SelectWithIcon from '@/features/crearVentas/components/SelectWithIcon';
import AutocompleteSeller from '@/shared/components/AutocompleteSeller';
import SubmitBar from '@/features/crearVentas/components/SubmitBar';
import AutocompleteClient from '@/features/crearVentas/components/AutocompleteClient';
import PrimerCuota from '@/features/crearVentas/components/PrimerCuota';
import ProductCategoryIcon from './ProductCategoryIcon';
import { CreditCard, Tv, Calendar, Plus, DollarSign } from 'lucide-react';

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleInputChange: (e: any) => void;
  errors: any;
  isSubmittingDisabled: boolean;
  productTypes: any[];
  sellers: any[];
  displayedClients: any[];
  onSubmit: (e: React.FormEvent) => void;
}

const CreateSaleForm: React.FC<Props> = ({ formData, setFormData, handleInputChange, errors, isSubmittingDisabled, productTypes, sellers, displayedClients, onSubmit }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <form onSubmit={onSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <InputWithIcon id="fecha" name="fecha" label="Fecha *" type="date" value={formData.fecha} onChange={handleInputChange} icon={<Calendar className="w-4 h-4 text-indigo-600" />} error={errors.fecha} />
          </div>

          <div>
            <SelectWithIcon
              id="productTypeId"
              name="productTypeId"
              label={<><CreditCard className="w-4 h-4 text-indigo-600 inline mr-2" /> Tipo de producto *</>}
              value={formData.productTypeId}
              onChange={e => setFormData((prev: any) => ({ ...prev, productTypeId: e.target.value }))}
              options={[{ value: '', label: 'Selecciona un tipo' }, ...productTypes.map(pt => ({ value: String(pt.id), label: pt.name }))]}
              icon={<Tv className="w-5 h-5" />}
              error={errors.productTypeId}
            />
            <ProductCategoryIcon category={formData.productCategory} />
          </div>

          <div>
            <AutocompleteSeller
              value={formData.sellerId}
              sellers={sellers}
              onChange={(id: string) => setFormData((prev: any) => ({ ...prev, sellerId: id, cliente: 0 }))}
              error={errors.sellerId}
            />
          </div>

          <div>
            <AutocompleteClient
              value={Number(formData.cliente)}
              clients={displayedClients}
              onChange={(id: number) => setFormData((prev: any) => ({ ...prev, cliente: id }))}
              error={errors.cliente}
            />
          </div>

          <PrimerCuota
            firstFeeDate={formData.firstFeeDate}
            fecha={formData.fecha}
            payFirstFee={formData.payFirstFee}
            firstFeeAmount={formData.firstFeeAmount}
            onChange={handleInputChange}
            errors={{ firstFeeDate: errors.firstFeeDate, firstFeeAmount: errors.firstFeeAmount }}
          />

          <div>
            <SelectWithIcon id="payments" name="payments" label="Tipo de pago *" value={formData.payments} onChange={handleInputChange} options={[{ value: 'SEMANAL', label: 'Semanal' }, { value: 'QUINCENAL', label: 'Quincenal' }, { value: 'MENSUAL', label: 'Mensual' }, { value: 'CONTADO', label: 'Contado' }]} />
          </div>

          <div>
            <InputWithIcon id="quantityFees" name="quantityFees" label={<><Plus className="inline w-4 h-4 text-indigo-600 mr-2" /> Cantidad de cuotas *</>} type="number" value={formData.quantityFees} onChange={handleInputChange} error={errors.quantityFees} />
          </div>

          <div>
            <InputWithIcon id="amountFee" name="amountFee" label="Valor de la cuota *" type="number" value={formData.amountFee} onChange={handleInputChange} icon={<DollarSign className="w-4 h-4" />} error={errors.amountFee} />
          </div>

          <div>
            <InputWithIcon id="cost" name="cost" label="Costo *" type="number" value={formData.cost} onChange={handleInputChange} icon={<DollarSign className="w-4 h-4" />} error={errors.cost} />
          </div>
        </div>

        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción de producto *
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            rows={2}
            className="w-1/3 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tv samsung 32'..."
          />
        </div>

        <SubmitBar isDisabled={isSubmittingDisabled} />
      </form>
    </div>
  );
};

export default CreateSaleForm;
