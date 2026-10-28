import React from 'react';
import InputWithIcon from './InputWithIcon';
import { getCurrencySymbol } from '@/shared/utils/formatCurrency';

interface PrimerCuotaProps {
  firstFeeDate: string;
  fecha: string;
  payFirstFee: boolean | string | number;
  firstFeeAmount: number | string;
  /** Moneda de la operación: el símbolo del monto la sigue. */
  currency: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors?: {
    firstFeeDate?: string;
    firstFeeAmount?: string;
  };
}

const PrimerCuota: React.FC<PrimerCuotaProps> = ({ firstFeeDate, fecha, payFirstFee, firstFeeAmount, currency, onChange, errors }) => {
  const disabled = firstFeeDate !== fecha;

  return (
    <>
      {/* Fecha de primera cuota (opcional) */}
      <div>
        <InputWithIcon
          id="firstFeeDate"
          name="firstFeeDate"
          label="Fecha del primer pago"
          type="date"
          value={firstFeeDate}
          onChange={onChange}
          error={errors?.firstFeeDate}
          min={fecha}
        />
      </div>

      {/* Pagar primera cuota ahora */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="payFirstFee"
          name="payFirstFee"
          checked={Boolean(payFirstFee)}
          onChange={onChange}
          className="h-4 w-4 text-brand-600 border-gray-300 rounded"
          disabled={disabled}
          title={disabled ? 'La primera cuota no es hoy, no se puede pagar ahora' : 'Pagar la primera cuota ahora'}
        />
        <label htmlFor="payFirstFee" className="text-sm text-gray-700">
          Pagar primera cuota ahora
        </label>
      </div>

      {disabled && (
        <div className="text-xs text-gray-500 mt-1">La primera cuota no coincide con la fecha de venta; no es posible pagarla ahora.</div>
      )}

      {/* Monto primera cuota si se paga ahora */}
      {Boolean(payFirstFee) && (
        <div>
          <InputWithIcon
            id="firstFeeAmount"
            name="firstFeeAmount"
            label="Monto primera cuota"
            type="number"
            value={firstFeeAmount}
            onChange={onChange}
            symbol={getCurrencySymbol(currency)}
            error={errors?.firstFeeAmount}
          />
        </div>
      )}
    </>
  );
};

export default PrimerCuota;
