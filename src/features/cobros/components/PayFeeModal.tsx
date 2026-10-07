import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Field from '@/shared/components/ui/Field';
import { Banknote, Building2 } from 'lucide-react';
import { salesService } from '@/features/ventas/services/salesServices';
import { formatCurrency, getCurrencySymbol } from '@/shared/utils/formatCurrency';
import type { CuotaItem } from '@/shared/types/business';

interface PayFeeModalProps {
  cuota: CuotaItem | null;
  onClose: () => void;
  onPaid: () => void;
  /** Deuda restante de la venta para validar que el monto no la supere. */
  deudaRestante?: number;
  /** Fecha mínima permitida (habitualmente la fecha de la venta). */
  fechaMinima?: string;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

/** Modal simple para registrar el cobro de una cuota desde la agenda, el listado global o el cronograma. */
export default function PayFeeModal({ cuota, onClose, onPaid, deudaRestante, fechaMinima }: PayFeeModalProps) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cuota) {
      setMonto(String(cuota.monto ?? 0));
      setFecha(hoyISO());
      setPaymentMethod('EFECTIVO');
      setError(null);
    }
  }, [cuota]);

  if (!cuota) return null;

  const handleSubmit = async () => {
    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError('Ingresá un monto válido');
      return;
    }
    if (deudaRestante != null && montoNumero > deudaRestante) {
      setError('El monto supera la deuda restante');
      return;
    }
    if (fechaMinima && fecha < fechaMinima) {
      setError('La fecha de pago no puede ser anterior a la venta');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await salesService.markFeeAsPaid(cuota.id, montoNumero, fecha, paymentMethod);
      onPaid();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el cobro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Cobrar cuota ${cuota.numeroCuota} · ${cuota.clientName}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <p className="text-sm text-gray-500">
          {cuota.saleDescription || 'Venta'} · vencía el{' '}
          <span className="font-medium text-gray-700">{cuota.fechaVencimiento.split('-').reverse().join('/')}</span>
        </p>

        {cuota.monto != null && deudaRestante != null && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monto de la cuota:</span>
              <span className="font-medium font-mono tabular-nums">{formatCurrency(cuota.monto)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Deuda restante:</span>
              <span
                className={`font-medium font-mono tabular-nums ${deudaRestante > 0 ? 'text-amber-600' : 'text-emerald-600'}`}
              >
                {formatCurrency(deudaRestante)}
              </span>
            </div>
          </div>
        )}

        <Field label="Monto cobrado" htmlFor="pay-fee-monto">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {getCurrencySymbol()}
            </span>
            <Input
              id="pay-fee-monto"
              type="number"
              step="0.01"
              min="0"
              className="pl-8"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
        </Field>
        <Field label="Fecha de pago" htmlFor="pay-fee-fecha">
          <Input
            id="pay-fee-fecha"
            type="date"
            min={fechaMinima}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </Field>
        <Field label="Método de pago" htmlFor="pay-fee-method">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              {paymentMethod === 'TRANSFERENCIA' ? <Building2 className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
            </span>
            <Select
              id="pay-fee-method"
              className="pl-10"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'EFECTIVO' | 'TRANSFERENCIA')}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </Select>
          </div>
        </Field>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={saving}>
            Registrar cobro
          </Button>
        </div>
      </form>
    </Modal>
  );
}