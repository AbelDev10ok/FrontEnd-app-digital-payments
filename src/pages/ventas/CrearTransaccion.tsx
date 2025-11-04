import React from 'react';
import { Plus, ArrowLeft, Tv, Watch, Sofa, CreditCard, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import useSaleForm from '../../hooks/useSaleForm';
import InputWithIcon from '../../components/form/InputWithIcon';
import SelectWithIcon from '../../components/form/SelectWithIcon';
import AutocompleteSeller from '../../components/autocomplete/AutocompleteSeller';
import AutocompleteClient from '../../components/autocomplete/AutocompleteClient';
import SubmitBar from '../../components/form/SubmitBar';

interface CrearTransaccionProps {
  type: 'VENTA' | 'PRESTAMO';
}

const CrearTransaccion = ({ type }: CrearTransaccionProps) => {
  const navigate = useNavigate();

  const {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    errors,
    isSubmittingDisabled,
    productTypes,
    sellers,
    displayedClients,
  } = useSaleForm(type);

  const submitWrapper = async (e: React.FormEvent) => {
    const ok = await handleSubmit(e);
    if (ok) navigate('/dashboard/ventas');
    else {
      if (!formData.cliente) {
        alert(formData.sellerId ? 'Selecciona un cliente del vendedor seleccionado' : 'Selecciona un cliente');
      }
    }
  };

  return (
    <DashboardLayout title="Nueva Transacción">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard/ventas" className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <Plus className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nueva Transacción</h2>
              <p className="text-sm text-gray-500">Crear nueva venta</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={submitWrapper} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha */}
              <div>
                <InputWithIcon id="fecha" name="fecha" label="Fecha *" type="date" value={formData.fecha} onChange={handleInputChange} icon={<Calendar className="w-4 h-4 text-indigo-600" />} error={errors.fecha} />
              </div>

              {/* Tipo de producto */}
              <div>
                <SelectWithIcon
                  id="productTypeId"
                  name="productTypeId"
                  label={<><CreditCard className="w-4 h-4 text-indigo-600 inline mr-2" /> Tipo de producto *</>}
                  value={formData.productTypeId}
                  onChange={e => setFormData(prev => ({ ...prev, productTypeId: e.target.value }))}
                  options={[{ value: '', label: 'Selecciona un tipo' }, ...productTypes.map(pt => ({ value: String(pt.id), label: pt.name }))]}
                  icon={<Tv className="w-5 h-5" />}
                  error={errors.productTypeId}
                />
                <div className="mt-2 min-h-[28px]">
                  {formData.productCategory === 'SMART TV' && <Tv className="inline w-6 h-6 text-indigo-500" />}
                  {formData.productCategory === 'RELOJ' && <Watch className="inline w-6 h-6 text-indigo-500" />}
                  {formData.productCategory === 'MUEBLE' && <Sofa className="inline w-6 h-6 text-indigo-500" />}
                </div>
              </div>

              {/* Vendedor (opcional) - autocomplete */}
              <div>
                <AutocompleteSeller
                  value={formData.sellerId}
                  sellers={sellers}
                  onChange={(id) => setFormData(prev => ({ ...prev, sellerId: id, cliente: 0 }))}
                  error={errors.sellerId}
                />
              </div>

              {/* Cliente */}
              <div>
                <AutocompleteClient
                  value={Number(formData.cliente)}
                  clients={displayedClients}
                  onChange={(id) => setFormData(prev => ({ ...prev, cliente: id }))}
                  error={errors.cliente}
                />
              </div>

              {/* Fecha de primera cuota (opcional) */}
              <div>
                <InputWithIcon id="firstFeeDate" name="firstFeeDate" label="Fecha primera cuota (opcional)" type="date" value={formData.firstFeeDate} onChange={handleInputChange} icon={<Calendar className="w-4 h-4 text-indigo-600" />} error={errors.firstFeeDate} />
              </div>

              {/* Pagar primera cuota ahora */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="payFirstFee"
                  name="payFirstFee"
                  checked={Boolean(formData.payFirstFee)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  disabled={formData.firstFeeDate !== formData.fecha}
                  title={formData.firstFeeDate !== formData.fecha ? 'La primera cuota no es hoy, no se puede pagar ahora' : 'Pagar la primera cuota ahora'}
                />
                <label htmlFor="payFirstFee" className="text-sm text-gray-700 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-indigo-500" /> Pagar primera cuota ahora</label>
              </div>
              {formData.firstFeeDate !== formData.fecha && (
                <div className="text-xs text-gray-500 mt-1">La primera cuota no coincide con la fecha de venta; no es posible pagarla ahora.</div>
              )}

              {/* Monto primera cuota si se paga ahora */}
              {formData.payFirstFee && (
                <div>
                  <InputWithIcon id="firstFeeAmount" name="firstFeeAmount" label="Monto primera cuota" type="number" value={formData.firstFeeAmount} onChange={handleInputChange} icon={<DollarSign className="w-4 h-4" />} error={errors.firstFeeAmount} />
                </div>
              )}

              {/* Tipo de pago */}
              <div>
                <SelectWithIcon id="payments" name="payments" label="Tipo de pago *" value={formData.payments} onChange={handleInputChange} options={[{ value: 'SEMANAL', label: 'Semanal' }, { value: 'QUINCENAL', label: 'Quincenal' }, { value: 'MENSUAL', label: 'Mensual' }, { value: 'CONTADO', label: 'Contado' }]} />
              </div>

              {/* Cantidad de cuotas */}
              <div>
                <InputWithIcon id="quantityFees" name="quantityFees" label={<><Plus className="inline w-4 h-4 text-indigo-600 mr-2" /> Cantidad de cuotas *</>} type="number" value={formData.quantityFees} onChange={handleInputChange} error={errors.quantityFees} />
              </div>

              {/* Valor de la cuota */}
              <div>
                <InputWithIcon id="amountFee" name="amountFee" label="Valor de la cuota *" type="number" value={formData.amountFee} onChange={handleInputChange} icon={<DollarSign className="w-4 h-4" />} error={errors.amountFee} />
              </div>

              {/* Costo */}
              <div>
                <InputWithIcon id="cost" name="cost" label="Costo *" type="number" value={formData.cost} onChange={handleInputChange} icon={<DollarSign className="w-4 h-4" />} error={errors.cost} />
              </div>
            </div>

            {/* Descripción */}
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

            {/* Buttons */}
            <SubmitBar isDisabled={isSubmittingDisabled} />
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CrearTransaccion;