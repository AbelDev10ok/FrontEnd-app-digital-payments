/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import InputWithIcon from '@/features/crearVentas/components/InputWithIcon';
import SelectWithIcon from '@/features/crearVentas/components/SelectWithIcon';
import AutocompleteSeller from '@/shared/components/AutocompleteSeller';
import SubmitBar from '@/features/crearVentas/components/SubmitBar';
import AutocompleteClient from '@/features/crearVentas/components/AutocompleteClient';
import PrimerCuota from '@/features/crearVentas/components/PrimerCuota';
import { Calendar, Plus, Coins, Percent, Package } from 'lucide-react';
import { Button, Alert } from '@/shared/components/ui';
import ErrorAnnouncer from '@/shared/components/feedback/ErrorAnnouncer';
import useFormErrorA11y from '@/shared/hooks/useFormErrorA11y';
import { calculateLoanTotals, monedaDeLaOperacion } from '@/features/crearVentas/hooks/useSaleForm';
import { formatCurrency, getCurrency, getCurrencySymbol } from '@/shared/utils/formatCurrency';
import { etiquetaMoneda, opcionesMonedaNegocio } from '@/shared/utils/currencies';
import { getLocalDateString } from '@/shared/utils/formatDate';
import { eyebrow } from '@/shared/theme';

interface LoanSummaryProps {
  formData: any;
  formatCurrency: (n: number) => string;
}

const LoanSummary: React.FC<LoanSummaryProps> = ({ formData, formatCurrency }) => {
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
          <p className="flex items-baseline justify-between border-t border-brand-200 pt-2">
            <span className="font-medium text-gray-800">Total a devolver</span>
            <span className="text-base font-semibold text-brand-700 font-mono tabular-nums">{formatCurrency(totals.totalToPay)}</span>
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

interface CostoYGananciaProps {
  /** Costo del negocio de la venta completa (unitario × cantidad) */
  costoTotal: number | null;
  /** Total a cobrar de la operación (al contado sale del precio de lista) */
  totalCobrar: number | null;
  formatCurrency: (n: number) => string;
}

/** Badge con el costo y la ganancia de la venta que se está armando. */
const CostoYGanancia: React.FC<CostoYGananciaProps> = ({ costoTotal, totalCobrar, formatCurrency }) => {
  if (costoTotal == null) {
    return (
      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-input text-gray-700 font-medium">—</div>
    );
  }
  const ganancia = totalCobrar != null ? totalCobrar - costoTotal : null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
        Costo {formatCurrency(costoTotal)}
      </span>
      {ganancia != null && (
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            ganancia >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          Ganancia {formatCurrency(ganancia)}
        </span>
      )}
    </div>
  );
};

interface TotalACobrarProps {
  totalCobrar: number | null;
  formatCurrency: (n: number) => string;
}

const TotalACobrar: React.FC<TotalACobrarProps> = ({ totalCobrar, formatCurrency }) => {
  if (totalCobrar == null || totalCobrar <= 0) return null;
  return (
    <div className="mt-2 rounded-input border border-brand-100 bg-brand-50/30 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-gray-600">Total a cobrar</span>
        <span className="text-base font-semibold text-gray-800 font-mono tabular-nums">{formatCurrency(totalCobrar)}</span>
      </div>
    </div>
  );
};



interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleInputChange: (e: any) => void;
  /** Conjunto completo de errores de validación: alimenta el anuncio del envío. */
  errors: any;
  /** Errores que se pintan en los campos (vacío hasta el primer intento de envío). */
  visibleErrors: Record<string, string>;
  isSubmittingDisabled: boolean;
  products: any[];
  sellers: any[];
  displayedClients: any[];
  onSubmit: (e: React.FormEvent) => void;
  /** Destino de "Cancelar": la lista de operaciones, no la landing. */
  cancelTo?: string;
  onBackToProductPicker?: () => void;
  /** Estado de envío: muestra el spinner en el botón y bloquea el doble clic. */
  isSubmitting?: boolean;
  /** Error del último envío; se conserva el formulario para corregir y reintentar. */
  submitError?: string | null;
}

const CreateSaleForm: React.FC<Props> = ({ formData, setFormData, handleInputChange, errors, visibleErrors, isSubmittingDisabled, products, sellers, displayedClients, onSubmit, cancelTo, onBackToProductPicker, isSubmitting = false, submitError = null }) => {
  const { formRef, errorAnnouncement, reportErrors } = useFormErrorA11y();
  const submitErrorRef = useRef<HTMLDivElement>(null);
  const isPrestamo = formData.tipo === 'PRESTAMO';
  const selectedProduct = !isPrestamo
    ? products.find((p) => Number(p.variantId ?? p.id) === Number(formData.productId))
    : undefined;
  // Moneda de la operación: manda el producto en una venta y la elección del
  // usuario en un préstamo. Todos los montos del formulario se muestran en ella.
  const moneda = monedaDeLaOperacion(isPrestamo ? 'PRESTAMO' : 'VENTA', formData.currency, selectedProduct);
  const money = (n: number) => formatCurrency(n, moneda);
  // Mismo símbolo que el texto formateado: '$' en ARS, 'US$' en USD.
  const simbolo = getCurrencySymbol(moneda);
  const cantidad = Number(formData.cantidad) || 1;
  // Costo del negocio: costo unitario de la variante × cantidad
  const costoTotal = selectedProduct?.cost != null && cantidad > 0
    ? selectedProduct.cost * cantidad
    : null;
  // Al contado el total sale del precio de venta del catálogo, no de un monto editable
  const esContado = !isPrestamo && formData.payments === 'CONTADO';
  const precioUnitario = selectedProduct?.price ?? (formData.precioUnitario !== '' ? Number(formData.precioUnitario) : null);
  const totalContado = precioUnitario != null ? precioUnitario * cantidad : null;
  const totalEnCuotas = Number(formData.amountFee) > 0 && Number(formData.quantityFees) > 0
    ? Number(formData.amountFee) * Number(formData.quantityFees)
    : null;
  const totalCobrar = esContado ? totalContado : totalEnCuotas;

  const today = getLocalDateString();
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

  // Tras un envío fallido: foco al primer error y resumen anunciado en la
  // región viva; si el error vino del servidor, el foco va a ese aviso.
  const handleFormSubmit = (e: React.FormEvent) => {
    onSubmit(e);
    if (Object.keys(errors).length > 0) {
      reportErrors(errors);
    }
  };

  useEffect(() => {
    if (submitError) submitErrorRef.current?.focus();
  }, [submitError]);

  return (
    <div className="bg-white rounded-card shadow-card border border-gray-100">
      <form ref={formRef} onSubmit={handleFormSubmit} className="p-6 space-y-8">
        {/* Sección: Producto o Préstamo */}
        <div>
          <h2 className={`${eyebrow.table} mb-4`}>{isPrestamo ? 'Datos del préstamo' : 'Producto'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <InputWithIcon id="fecha" name="fecha" label="Fecha" required type="date" value={formData.fecha} onChange={handleInputChange} icon={<Calendar strokeWidth={1.5} className="w-4 h-4 text-brand-600" />} error={visibleErrors.fecha} max={today} />
            </div>

            {isPrestamo ? (
              <div>
                <SelectWithIcon
                  id="payments"
                  name="payments"
                  label="Tipo de pago"
                  required
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
                            Costo total: {costoTotal != null ? money(costoTotal) : money(Number(formData.cost)) || '—'}
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
                {/* Errores del producto que bloquean el envío: visibles, no silenciosos */}
                {(visibleErrors.productId || visibleErrors.productTypeId || visibleErrors.cantidad) && (
                  <div role="alert" className="md:col-span-2 space-y-1">
                    {visibleErrors.productId && <p className="text-sm text-red-600">{visibleErrors.productId}</p>}
                    {visibleErrors.productTypeId && <p className="text-sm text-red-600">{visibleErrors.productTypeId}</p>}
                    {visibleErrors.cantidad && <p className="text-sm text-red-600">{visibleErrors.cantidad}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sección: Cliente y vendedor */}
        <div>
          <h2 className={`${eyebrow.table} mb-4`}>Cliente y vendedor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AutocompleteSeller
                value={formData.sellerId}
                sellers={sellers}
                onChange={(id: string | number) => setFormData((prev: any) => ({ ...prev, sellerId: Number(id), cliente: 0 }))}
                error={visibleErrors.sellerId}
              />
            </div>
            <div>
              <AutocompleteClient
                value={Number(formData.cliente)}
                clients={displayedClients}
                onChange={(id: number) => setFormData((prev: any) => ({ ...prev, cliente: id }))}
                error={visibleErrors.cliente}
              />
            </div>
          </div>
        </div>

        {/* Sección: Condiciones de pago */}
        <div>
          <h2 className={`${eyebrow.table} mb-4`}>Condiciones de pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isPrestamo && (
              <div>
                <SelectWithIcon
                  id="payments"
                  name="payments"
                  label="Tipo de pago"
                  required
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
                <InputWithIcon id="quantityFees" name="quantityFees" label="Cantidad de cuotas" required type="number" value={formData.quantityFees} onChange={handleInputChange} icon={<Plus strokeWidth={1.5} className="w-4 h-4 text-brand-600" />} error={visibleErrors.quantityFees} />
              </div>
            )}

            {isPrestamo && (
              <div>
                <InputWithIcon id="interestRate" name="interestRate" label="Porcentaje de interés (%)" required type="number" value={formData.interestRate} onChange={handleInputChange} icon={<Percent strokeWidth={1.5} className="w-4 h-4 text-brand-600" />} error={visibleErrors.interestRate} />
              </div>
            )}

            {/* Un préstamo no tiene producto del que heredar la moneda: se elige
                acá y los montos de esta sección se interpretan en ella. */}
            {isPrestamo && (
              <div>
                <SelectWithIcon
                  id="currency"
                  name="currency"
                  label="Moneda"
                  value={formData.currency || getCurrency()}
                  onChange={handleInputChange}
                  icon={<Coins strokeWidth={1.5} className="w-4 h-4 text-brand-600" />}
                  options={opcionesMonedaNegocio(formData.currency).map((m) => ({ value: m, label: etiquetaMoneda(m) }))}
                />
              </div>
            )}

            {!isPrestamo && !esContado && (
              <div>
                <InputWithIcon id="amountFee" name="amountFee" label="Valor de la cuota" required type="number" value={formData.amountFee} onChange={handleInputChange} symbol={simbolo} error={visibleErrors.amountFee} />
              </div>
            )}

            {/* Al contado el total sale del precio de venta del catálogo: se
                muestra calculado, no como campo editable. */}
            {esContado && (
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-2">
                  Total de la venta (contado)
                </p>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-input text-gray-700 font-medium font-mono tabular-nums">
                  {totalContado != null ? money(totalContado) : '—'}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {cantidad} × {precioUnitario != null ? money(precioUnitario) : '—'} (precio de venta del catálogo)
                </p>
              </div>
            )}

            <div>
              {isPrestamo ? (
                <InputWithIcon id="cost" name="cost" label="Monto entregado" required type="number" value={formData.cost} onChange={handleInputChange} symbol={simbolo} error={visibleErrors.cost} />
              ) : (
                <div>
                  <p className="block text-sm font-medium text-gray-700 mb-2">
                    Costo del producto
                  </p>
                  <CostoYGanancia costoTotal={costoTotal} totalCobrar={totalCobrar} formatCurrency={money} />
                  <TotalACobrar totalCobrar={totalCobrar} formatCurrency={money} />
                </div>
              )}
            </div>

            {/* La regla "el total a cobrar supera al costo" no se arregla en el
                costo (en la venta es de sólo lectura): el aviso va junto a los
                campos que sí se pueden editar. */}
            {!isPrestamo && visibleErrors.cost && (
              <p
                role="alert"
                tabIndex={-1}
                data-error-message
                className="mt-4 rounded-input border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {visibleErrors.cost}
              </p>
            )}
          </div>
        </div>

        {/* Primera cuota */}
        <div>
          <h2 className={`${eyebrow.table} mb-4`}>Primera cuota</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PrimerCuota
              firstFeeDate={formData.firstFeeDate}
              fecha={formData.fecha}
              payFirstFee={formData.payFirstFee}
              firstFeeAmount={formData.firstFeeAmount}
              currency={moneda}
              onChange={handleInputChange}
              errors={{ firstFeeDate: visibleErrors.firstFeeDate, firstFeeAmount: visibleErrors.firstFeeAmount }}
            />
          </div>
        </div>

        {isPrestamo && (
          <LoanSummary formData={formData} formatCurrency={money} />
        )}

        <ErrorAnnouncer message={errorAnnouncement} />

        {submitError && (
          <div ref={submitErrorRef} tabIndex={-1}>
            <Alert tone="danger">{submitError}</Alert>
          </div>
        )}

        <SubmitBar cancelTo={cancelTo} isDisabled={isSubmittingDisabled} isLoading={isSubmitting} stickyOnMobile />
      </form>
    </div>
  );
};

export default CreateSaleForm;
