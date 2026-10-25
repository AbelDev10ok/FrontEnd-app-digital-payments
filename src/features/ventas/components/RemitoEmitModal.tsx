import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Field from '@/shared/components/ui/Field';
import Alert from '@/shared/components/ui/Alert';
import { inputBaseClass } from '@/shared/components/ui/Input';
import { salesService } from '@/features/ventas/services/salesServices';
import type { SaleDocumentDto, SaleResponseDto } from '@/shared/types/sales';

interface RemitoEmitModalProps {
  isOpen: boolean;
  sale: SaleResponseDto | null;
  onClose: () => void;
  /**
   * Se llama con el documento emitido. `printWindow` es la pestaña abierta de
   * forma sincrónica antes del POST para que el navegador no la bloquee; el
   * padre decide a qué URL llevarla.
   */
  onEmitted: (document: SaleDocumentDto, printWindow: Window | null) => void;
}

/**
 * Primera emisión del remito: avisa que la numeración se asigna al confirmar y
 * permite cargar observaciones opcionales. La reimpresión no pasa por acá.
 */
export default function RemitoEmitModal({
  isOpen,
  sale,
  onClose,
  onEmitted,
}: RemitoEmitModalProps) {
  const [observaciones, setObservaciones] = useState('');
  const [emitiendo, setEmitiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setObservaciones('');
      setError(null);
      setEmitiendo(false);
    }
  }, [isOpen, sale?.id]);

  if (!sale) return null;

  const emitir = async () => {
    // Abrimos la pestaña dentro del gesto del usuario: después del await el
    // navegador podría considerarla una ventana emergente no solicitada.
    const printWindow = window.open('', '_blank');
    setEmitiendo(true);
    setError(null);
    try {
      const document = await salesService.emitirRemito(
        sale.id,
        observaciones.trim() || undefined,
      );
      onEmitted(document, printWindow);
    } catch (err) {
      printWindow?.close();
      setError(err instanceof Error ? err.message : 'Error al emitir el remito');
    } finally {
      setEmitiendo(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Emitir remito" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Se va a emitir el remito de la venta{' '}
          <span className="font-semibold text-gray-900">#{sale.id}</span> a nombre de{' '}
          <span className="font-semibold text-gray-900">{sale.client.name}</span>.
        </p>

        <Alert tone="info" title="La numeración se asigna al confirmar">
          El número de remito es correlativo por negocio y queda fijo una vez
          emitido. El documento guarda los datos actuales del negocio, del
          cliente y de la venta: si después los editás, el remito no cambia.
        </Alert>

        <Field
          label="Observaciones (opcional)"
          htmlFor="remito-observaciones"
          hint="Se imprimen al pie del remito. Podés dejarlas vacías."
        >
          <textarea
            id="remito-observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Ej.: entregar por la tarde, avisar antes de llegar…"
            className={`${inputBaseClass} resize-y`}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={emitiendo}>
            Cancelar
          </Button>
          <Button
            onClick={emitir}
            isLoading={emitiendo}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Emitir remito
          </Button>
        </div>
      </div>
    </Modal>
  );
}
