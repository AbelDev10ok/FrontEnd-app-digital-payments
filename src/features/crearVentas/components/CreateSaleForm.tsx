/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import InputWithIcon from '@/features/crearVentas/components/InputWithIcon';
import SelectWithIcon from '@/features/crearVentas/components/SelectWithIcon';
import AutocompleteSeller from '@/shared/components/AutocompleteSeller';
import SubmitBar from '@/features/crearVentas/components/SubmitBar';
import AutocompleteClient from '@/features/crearVentas/components/AutocompleteClient';
import PrimerCuota from '@/features/crearVentas/components/PrimerCuota';
import { Calendar, Plus, DollarSign, Percent, Package } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { calculateLoanTotals } from '@/features/crearVentas/hooks/useSaleForm';
import { formatCurrency } from '@/shared/utils/formatCurrency';

interface LoanSummaryProps {
  formData: any;
}

const LoanSummary: React.FC<LoanSummaryProps> = ({ formData }) => {
  const totals = calculateLoanTotals(formData);

  return (
    <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
      <p className="text-sm font-medium text-brand-700 mb-2">Resumen del préstamo</p>
      {totals ? (
        <div className="space-y-1 text-sm text-gray-700">
          <p className="flex justify-between">
            <span>Monto entregado (capital)</span>
            <span className="font-semibold">{formatCurrency(Number(formData.cost) || 0)}</span>
          </p>
          <p className="flex justify-between">
            <span>Interés ({Number(formData.interestRate) || 0}%)</span>
            <span className="font-semibold text-brand-600">
              {formatCurrency(Math.max(0, totals.totalToPay - (Number(formData.cost) || 0)))}
            </span>
          </p>
          <p className="flex justify-between border-t border-brand-200 pt-2">
            <span className="font-medium">Total a devolver</span>
            <span className="font-semibold text-brand-700">{formatCurrency(totals.totalToPay)}</span>
          </p>
          <p className="flex justify-between">
            <span>Valor de cada cuota</span>
            <span className="font-semibold">{formatCurrency(totals.amountFee)}</span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Ingresa el monto entregado, el porcentaje de interés y la cantidad de cuotas para ver el total a devolver.
        </p>
      )}
    </div>
  );
};

interface GananciaEstimadaProps {
  formData: any;
  costoTotal: number | null;
  formatCurrency: (n: number) => string;
}

const GananciaEstimada: React.FC<GananciaEstimadaProps> = ({ formData, costoTotal, formatCurrency }) => {
  if (!costoTotal || Number(formData.amountFee) <= 0 || !Number(formData.quantityFees)) return null;
  const totalCobrar = Number(formData.amountFee) * Number(formData.quantityFees);
  const ganancia = totalCobrar - costoTotal;
  return (
    <div className="mt-2 rounded-lg bg-brand-50/30 p-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Total a cobrar</span>
        <span className="font-semibold text-gray-700 font-mono tabular-nums">{formatCurrency(totalCobrar)}</span>
      </div>
      {ganancia > 0 && (
        <div className="flex justify-between text-xs mt-0.5">
          <span className="text-gray-500">Ganancia estimada</span>
          <span className="font-semibold text-emerald-600 font-mono tabular-nums">{formatCurrency(ganancia)}</span>
        </div>
      )}
    </div>
  );
};



interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleInputChange: (e: any) => void;
  errors: any;
  isSubmittingDisabled: boolean;
  products: any[];
  sellers: any[];
  displayedClients: any[];
  onSubmit: (e: React.FormEvent) => void;
  onBackToProductPicker?: () => void;
}

const CreateSaleForm: React.FC<Props> = ({ formData, setFormData, handleInputChange, errors, isSubmittingDisabled, products, sellers, displayedClients, onSubmit, onBackToProductPicker }) => {
  const isPrestamo = formData.tipo === 'PRESTAMO';
  const selectedProduct = !isPrestamo ? products.find((p) => p.id === Number(formData.productId)) : undefined;
  const cantidad = Number(formData.cantidad) || 1;
  const costoTotal = selectedProduct?.price != null && Number(formData.cantidad) > 0
    ? selectedProduct.price * cantidad
    : null;

  const today = new Date().toISOString().split('T')[0];
  const paymentOptions = isPrestamo
    ? [
        { value: 'SEMANAL', label: 'Semanal' },
        { value: 'QUINCENAL', label: 'Quincenal' },
        { value: 'MENSUAL', label: 'Mensual' },
      ]
    : [
        { value: 'SEMANAL', label: 'Semanal' },
        { value: 'QUINCENAL', label: 'Quincenal' },
        { value: 'MENSUAL', label: 'Mensual' },
        { value: 'CONTADO', label: 'Contado' },
      ];

  return (
    <div className="bg-white rounded-card shadow-card border border-gray-100">
      <form onSubmit={onSubmit} className="p-6 space-y-8">
        {/* Sección: Producto o Préstamo */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{isPrestamo ? 'Datos del préstamo' : 'Producto'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <InputWithIcon id="fecha" name="fecha" label="Fecha *" type="date" value={formData.fecha} onChange={handleInputChange} icon={<Calendar className="w-4 h-4 text-brand-600" />} error={errors.fecha} max={today} />
            </div>

            {isPrestamo ? (
              <div>
                <SelectWithIcon
                  id="payments"
                  name="payments"
                  label="Tipo de pago *"
                  value={formData.payments}
                  onChange={e => {
                    const { name, value } = e.target;
                    setFormData((prev: any) => ({
                      ...prev,
                      [name]: value,
                      quantityFees: value === 'CONTADO' ? 1 : prev.quantityFees,
                    }));
                  }}
                  options={paymentOptions}
                />
              </div>
            ) : (
              <>
                {/* Resumen del producto elegido en el paso anterior */}
                {formData.productId && onBackToProductPicker && (
                  <div className="md:col-span-2 bg-brand-50 border border-brand-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-6 h-6 text-brand-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{formData.descripcion || 'Producto seleccionado'}</p>
                          <p className="text-xs text-gray-500">
                            Costo total: {costoTotal != null ? formatCurrency(costoTotal) : formatCurrency(Number(formData.cost)) || '—'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={onBackToProductPicker}>
                        Cambiar
                      </Button>
                    </div>
                    {selectedProduct?.stock != null && (
                      <p className="mt-1 text-xs text-gray-500">Stock registrado: {selectedProduct.stock}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sección: Cliente y vendedor */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Cliente y vendedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AutocompleteSeller
                value={formData.sellerId}
                sellers={sellers}
                onChange={(id: string | number) => setFormData((prev: any) => ({ ...prev, sellerId: Number(id), cliente: 0 }))}
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
          </div>
        </div>

        {/* Sección: Condiciones de pago */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Condiciones de pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isPrestamo && (
              <div>
                <SelectWithIcon
                  id="payments"
                  name="payments"
                  label="Tipo de pago *"
                  value={formData.payments}
                  onChange={e => {
                    const { name, value } = e.target;
                    setFormData((prev: any) => ({
                      ...prev,
                      [name]: value,
                      quantityFees: value === 'CONTADO' ? 1 : prev.quantityFees,
                    }));
                  }}
                  options={paymentOptions}
                />
              </div>
            )}

            {formData.payments !== 'CONTADO' && (
              <div>
                <InputWithIcon id="quantityFees" name="quantityFees" label={<><Plus className="inline w-4 h-4 text-brand-600 mr-2" /> Cantidad de cuotas *</>} type="number" value={formData.quantityFees} onChange={handleInputChange} error={errors.quantityFees} />
              </div>
            )}

            {isPrestamo && (
              <div>
                <InputWithIcon id="interestRate" name="interestRate" label="Porcentaje de interés (%) *" type="number" value={formData.interestRate} onChange={handleInputChange} icon={<Percent className="w-4 h-4" />} error={errors.interestRate} />
              </div>
            )}

            {!isPrestamo && !(formData.payments === 'CONTADO' && formData.payFirstFee) && (
              <div>
                <InputWithIcon id="amountFee" name="amountFee" label="Valor de la cuota *" type="number" value={formData.amountFee} onChange={handleInputChange} icon={<DollarSign className="w-4 h-4" />} error={errors.amountFee} />
              </div>
            )}

            <div>
              {isPrestamo ? (
                <InputWithIcon id="cost" name="cost" label="Monto entregado *" type="number" value={formData.cost} onChange={handleInputChange} icon={<DollarSign className="w-4 h-4" />} error={errors.cost} />
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo del producto
                  </label>
                  <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-input text-gray-700 font-medium">
                    {costoTotal != null ? formatCurrency(costoTotal) : '—'}
                  </div>
                  <GananciaEstimada formData={formData} costoTotal={costoTotal} formatCurrency={formatCurrency} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primera cuota */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Primera cuota</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PrimerCuota
              firstFeeDate={formData.firstFeeDate}
              fecha={formData.fecha}
              payFirstFee={formData.payFirstFee}
              firstFeeAmount={formData.firstFeeAmount}
              onChange={handleInputChange}
              errors={{ firstFeeDate: errors.firstFeeDate, firstFeeAmount: errors.firstFeeAmount }}
            />
          </div>
        </div>

        {isPrestamo && (
          <LoanSummary formData={formData} />
        )}

        <SubmitBar isDisabled={isSubmittingDisabled} />
      </form>
    </div>
  );
};

export default CreateSaleForm;
