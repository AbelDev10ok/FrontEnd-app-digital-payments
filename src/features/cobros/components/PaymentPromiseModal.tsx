import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Field from '@/shared/components/ui/Field';
import { Check } from 'lucide-react';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import { formatCurrency, getCurrencySymbol } from '@/shared/utils/formatCurrency';
import { getLocalDateString } from '@/shared/utils/formatDate';
import type { ClientGroup } from '@/features/cobros/utils/clientGroups';
import type { PaymentPromise } from '@/shared/types/business';

interface PaymentPromiseModalProps {
  group: ClientGroup | null;
  /** Promesa pendiente vigente del grupo (cliente + moneda), si hay. */
  promise: PaymentPromise | null;
  onClose: () => void;
  onChanged: () => void;
}

const formatearFecha = (iso: string) => iso.split('-').reverse().join('/');

/**
 * Registra o gestiona una promesa de pago del grupo (cliente + moneda).
 * Sin promesa activa muestra el alta; con una activa, el resumen y las
 * acciones de cumplir o cancelar. Nunca mueve plata: es una gestión comercial.
 */
export default function PaymentPromiseModal({
  group,
  promise,
  onClose,
  onChanged,
}: PaymentPromiseModalProps) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(getLocalDateString());
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accion, setAccion] = useState<'crear' | 'cumplir' | 'cancelar' | null>(null);

  useEffect(() => {
    if (!group) return;
    // La promesa es sobre la deuda del grupo, no sobre lo cobrable hoy: se
    // precarga la misma deuda que muestra el resumen (con el subtotal como
    // respaldo cuando el backend no informa `deudaVenta`).
    setMonto(String(promise?.amount ?? group.debt ?? group.subtotal));
    setFecha(promise?.promisedDate ?? getLocalDateString());
    setNota(promise?.note ?? '');
    setError(null);
    setAccion(null);
  }, [group, promise]);

  if (!group) return null;

  const simbolo = getCurrencySymbol(group.currency);

  const ejecutar = async (tipo: 'crear' | 'cumplir' | 'cancelar', accion: () => Promise<unknown>) => {
    setError(null);
    setAccion(tipo);
    try {
      await accion();
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la gestión.');
    } finally {
      setAccion(null);
    }
  };

  const crear = () => {
    const montoNumero = Number(monto);
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      setError('El monto de la promesa tiene que ser mayor a cero.');
      return;
    }
    if (!fecha) {
      setError('Indicá la fecha en la que el cliente prometió pagar.');
      return;
    }
    void ejecutar('crear', () =>
      collectionsService.createPromise(group.clientId, {
        amount: montoNumero,
        promisedDate: fecha,
        currency: group.currency,
        note: nota.trim() || undefined,
      }),
    );
  };

  const cumplir = () => {
    if (!promise) return;
    void ejecutar('cumplir', () => collectionsService.fulfillPromise(promise.id));
  };

  const cancelar = () => {
    if (!promise) return;
    void ejecutar('cancelar', () => collectionsService.cancelPromise(promise.id));
  };

  return (
    <Modal isOpen onClose={onClose} title={`Promesa de pago · ${group.clientName}`}>
      {promise ? (
        <div className="space-y-5">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-600">
              {promise.vencida
                ? 'El cliente prometió pagar y no lo hizo.'
                : 'El cliente prometió pagar:'}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-heading tabular-nums">
              {formatCurrency(promise.amount, group.currency || undefined)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Fecha prometida: {formatearFecha(promise.promisedDate)}
              {promise.vencida && promise.diasAtraso
                ? ` · ${promise.diasAtraso} ${promise.diasAtraso === 1 ? 'día' : 'días'} de atraso`
                : ''}
            </p>
            {promise.note && <p className="mt-2 text-sm text-gray-600">Nota: {promise.note}</p>}
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={cancelar} isLoading={accion === 'cancelar'}>
              Cancelar promesa
            </Button>
            <Button onClick={cumplir} isLoading={accion === 'cumplir'}>
              <Check className="w-4 h-4" aria-hidden="true" />
              Marcar cumplida
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            crear();
          }}
        >
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Deuda del grupo en {group.currency}:{' '}
            <strong className="font-semibold text-heading">
              {formatCurrency(group.debt ?? group.subtotal, group.currency || undefined)}
            </strong>
          </div>

          <Field label="Monto prometido" htmlFor="promesa-monto">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {simbolo}
              </span>
              <Input
                id="promesa-monto"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                className="pl-10"
              />
            </div>
          </Field>

          <Field label="Fecha prometida" htmlFor="promesa-fecha">
            <Input
              id="promesa-fecha"
              type="date"
              min={getLocalDateString()}
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
            />
          </Field>

          <Field label="Nota (opcional)" htmlFor="promesa-nota">
            <Input
              id="promesa-nota"
              value={nota}
              onChange={(event) => setNota(event.target.value)}
              placeholder="Ej.: pasa el viernes por la tarde"
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button type="submit" isLoading={accion === 'crear'}>
              Registrar promesa
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
