import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Field from '@/shared/components/ui/Field';
import { Banknote, Building2, History } from 'lucide-react';
import { salesService } from '@/features/ventas/services/salesServices';
import { useSalesCountsStore } from '@/features/ventas/store/salesCountsStore';
import { formatCurrency, getCurrencySymbol } from '@/shared/utils/formatCurrency';
import { formatDateHour, getLocalDateString } from '@/shared/utils/formatDate';
import { montoCobrable } from '@/features/cobros/utils/montoCobrable';
import type { CuotaItem } from '@/shared/types/business';
import type { PaymentDto } from '@/shared/types/sales';

interface PayFeeModalProps {
  cuota: CuotaItem | null;
  onClose: () => void;
  onPaid: () => void;
  /** Deuda restante de la venta para validar que el monto no la supere. */
  deudaRestante?: number;
  /** Fecha mínima permitida (habitualmente la fecha de la venta). */
  fechaMinima?: string;
}

const hoyISO = () => getLocalDateString();

const etiquetaMetodo = (metodo?: string | null) =>
  metodo === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo';

/**
 * Registro de un cobro sobre una cuota. Muestra el historial de cobros de la
 * cuota con la fecha y hora de cada uno y precarga el monto de la cuota acotado
 * por la deuda de la venta (ver {@link montoCobrable}).
 */
export default function PayFeeModal({ cuota, onClose, onPaid, deudaRestante, fechaMinima }: PayFeeModalProps) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [historial, setHistorial] = useState<PaymentDto[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  // Un cobro puede completar la venta: los conteos del menú se vuelven a pedir.
  const refreshSalesCounts = useSalesCountsStore((state) => state.refresh);

  // Monto de la cuota: es lo que se precarga en el cobro (acotado por la deuda).
  const total = cuota?.monto ?? null;
  const simbolo = getCurrencySymbol(cuota?.currency ?? undefined);

  useEffect(() => {
    if (!cuota) return;
    setMonto(String(montoCobrable(cuota.monto, deudaRestante)));
    setFecha(hoyISO());
    setPaymentMethod('EFECTIVO');
    setError(null);
    // El historial es informativo: si falla, el cobro puede registrarse igual.
    let vigente = true;
    setCargandoHistorial(true);
    setHistorial([]);
    salesService
      .getFeePayments(cuota.id)
      .then((pagos) => {
        if (vigente) setHistorial(pagos ?? []);
      })
      .catch(() => {
        if (vigente) setHistorial([]);
      })
      .finally(() => {
        if (vigente) setCargandoHistorial(false);
      });
    return () => {
      vigente = false;
    };
  }, [cuota, deudaRestante]);

  if (!cuota) return null;

  const handleSubmit = async () => {
    // Evita doble envío (Enter repetido) mientras se guarda.
    if (saving) return;
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
      refreshSalesCounts();
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

        {total != null && deudaRestante != null && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monto de la cuota:</span>
              <span className="font-medium font-mono tabular-nums">{formatCurrency(total, cuota.currency ?? undefined)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Deuda restante:</span>
              <span
                className={`font-medium font-mono tabular-nums ${deudaRestante > 0 ? 'text-amber-600' : 'text-emerald-600'}`}
              >
                {formatCurrency(deudaRestante, cuota.currency ?? undefined)}
              </span>
            </div>
          </div>
        )}

        <Field label="Monto cobrado" htmlFor="pay-fee-monto">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {simbolo}
            </span>
            <Input
              id="pay-fee-monto"
              type="number"
              step="0.01"
              min="0"
              className={simbolo.length > 1 ? 'pl-12' : 'pl-8'}
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

        {historial.length > 0 && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <p className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              <History className="w-3.5 h-3.5" aria-hidden="true" />
              Cobros de esta cuota
            </p>
            <ul className="divide-y divide-gray-100">
              {historial.map((pago) => (
                <li key={pago.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="text-gray-600 whitespace-nowrap">{formatDateHour(pago.paidAt)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{etiquetaMetodo(pago.paymentMethod)}</span>
                    <span className="font-mono tabular-nums font-semibold text-heading">
                      {formatCurrency(pago.amount, cuota.currency ?? undefined)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {cargandoHistorial && historial.length === 0 && (
          <p className="text-xs text-gray-400">Cargando cobros anteriores…</p>
        )}

        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
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
