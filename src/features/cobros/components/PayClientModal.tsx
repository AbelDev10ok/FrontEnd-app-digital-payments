import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Field from '@/shared/components/ui/Field';
import { Banknote, Building2 } from 'lucide-react';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import { useSalesCountsStore } from '@/features/ventas/store/salesCountsStore';
import { formatCurrency, getCurrencySymbol } from '@/shared/utils/formatCurrency';
import { getLocalDateString } from '@/shared/utils/formatDate';
import type { ClientGroup } from '@/features/cobros/utils/clientGroups';

interface PayClientModalProps {
  group: ClientGroup | null;
  onClose: () => void;
  onPaid: () => void;
}

const hoyISO = () => getLocalDateString();

/**
 * Cobro por cliente: registra un monto sobre todas las cuotas del grupo
 * (cliente + moneda) y deja que el backend lo distribuya por la deuda más
 * antigua. El monto se precarga con el cobrable de hoy ({@link ClientGroup.subtotal})
 * y admite pagos parciales; el tope es la deuda del cliente en esa moneda.
 */
export default function PayClientModal({ group, onClose, onPaid }: PayClientModalProps) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Un cobro puede completar operaciones: los conteos del menú se vuelven a pedir.
  const refreshSalesCounts = useSalesCountsStore((state) => state.refresh);

  const simbolo = getCurrencySymbol(group?.currency || undefined);

  useEffect(() => {
    if (!group) return;
    setMonto(String(group.subtotal));
    setFecha(hoyISO());
    setPaymentMethod('EFECTIVO');
    setError(null);
  }, [group]);

  if (!group) return null;

  const handleSubmit = async () => {
    // Evita doble envío (Enter repetido) mientras se guarda.
    if (saving) return;
    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError('Ingresá un monto válido');
      return;
    }
    if (group.debt != null && montoNumero > group.debt) {
      setError('El monto supera la deuda del cliente');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await collectionsService.payClient(group.clientId, {
        amount: montoNumero,
        date: fecha,
        currency: group.currency,
        paymentMethod,
      });
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
    <Modal isOpen onClose={onClose} title={`Cobrar todo · ${group.clientName}`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Moneda:</span>
            <span className="font-medium">{group.currency}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Cobrable hoy:</span>
            <span className="font-medium font-mono tabular-nums">
              {formatCurrency(group.subtotal, group.currency || undefined)}
            </span>
          </div>
          {group.debt != null && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Deuda del cliente:</span>
              <span className="font-medium font-mono tabular-nums text-amber-600">
                {formatCurrency(group.debt, group.currency || undefined)}
              </span>
            </div>
          )}
        </div>

        <Field label="Monto cobrado" htmlFor="pay-client-monto">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {simbolo}
            </span>
            <Input
              id="pay-client-monto"
              type="number"
              step="0.01"
              min="0"
              className={simbolo.length > 1 ? 'pl-12' : 'pl-8'}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
        </Field>
        <Field label="Fecha de pago" htmlFor="pay-client-fecha">
          <Input
            id="pay-client-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </Field>
        <Field label="Método de pago" htmlFor="pay-client-method">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              {paymentMethod === 'TRANSFERENCIA' ? <Building2 className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
            </span>
            <Select
              id="pay-client-method"
              className="pl-10"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'EFECTIVO' | 'TRANSFERENCIA')}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </Select>
          </div>
        </Field>

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
