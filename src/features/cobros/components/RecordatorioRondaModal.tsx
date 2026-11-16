import { useState } from 'react';
import { CheckCircle2, MessageCircle, SkipForward } from 'lucide-react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import { mensajeRecordatorioDeCuota, recordatorioHrefDeCuota } from '@/features/cobros/utils/recordatorio';
import { sufijoTotalCuotas } from '@/features/cobros/utils/numeroCuota';
import { formatearTelefono } from '@/shared/utils/telefono';
import type { CuotaItem } from '@/shared/types/business';

interface RecordatorioRondaModalProps {
  cuotas: CuotaItem[];
  onClose: () => void;
}

/**
 * Ronda de recordatorios: un cliente por vez, con el mensaje ya armado y el
 * progreso a la vista. No manda nada solo (WhatsApp no lo permite): abre el
 * chat y registra la gestión para que la agenda no repita el reclamo.
 */
const RecordatorioRondaModal: React.FC<RecordatorioRondaModalProps> = ({ cuotas, onClose }) => {
  const [indice, setIndice] = useState(0);
  const [enviados, setEnviados] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actual: CuotaItem | undefined = cuotas[indice];
  const terminado = !actual;
  const href = actual ? recordatorioHrefDeCuota(actual) : null;
  const total = cuotas.length;

  const avanzar = () => {
    setError(null);
    setIndice((anterior) => anterior + 1);
  };

  const abrirWhatsApp = async () => {
    if (!actual || !href) {
      return;
    }
    // La pestaña se abre dentro del gesto del usuario: después del await los
    // navegadores la bloquean como popup.
    window.open(href, '_blank', 'noopener,noreferrer');
    setEnviando(true);
    setError(null);
    try {
      await collectionsService.marcarRecordatorio(actual.id);
      setEnviados((anteriores) => anteriores + 1);
      avanzar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el recordatorio');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Recordatorios por WhatsApp" size="lg">
      {terminado ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
          <h4 className="font-display text-lg font-bold text-heading">Ronda terminada</h4>
          <p className="mt-1 text-sm text-gray-600">Recordatorios enviados: {enviados}</p>
          <Button className="mt-6" onClick={onClose}>
            Listo
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-semibold text-heading">
              {indice + 1} de {total}
            </p>
            <p className="text-gray-500">Recordatorios enviados: {enviados}</p>
          </div>
          <div
            role="progressbar"
            aria-label="Progreso de la ronda"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={indice + 1}
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-200 motion-reduce:transition-none"
              style={{ width: `${((indice + 1) / total) * 100}%` }}
            />
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 p-4">
            <p className="font-semibold text-heading">{actual.clientName}</p>
            <p className="mt-0.5 text-sm text-gray-500">
              {actual.saleDescription || 'Operación'} · Cuota {actual.numeroCuota}
              {sufijoTotalCuotas(actual.numeroCuota, actual.totalCuotas, 'de')}
            </p>
            {actual.clientPhone && (
              <p className="mt-1 text-xs text-gray-500">{formatearTelefono(actual.clientPhone)}</p>
            )}

            <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {href ? (
                <span>{mensajeRecordatorioDeCuota(actual)}</span>
              ) : (
                <span className="font-medium text-amber-700">
                  Sin teléfono para WhatsApp: cargá un celular en la ficha del cliente o saltealo.
                </span>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={avanzar}
              disabled={enviando}
              leftIcon={<SkipForward className="w-4 h-4" />}
            >
              Saltar
            </Button>
            <Button
              onClick={abrirWhatsApp}
              isLoading={enviando}
              disabled={!href}
              leftIcon={<MessageCircle className="w-4 h-4" />}
            >
              Abrir WhatsApp
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default RecordatorioRondaModal;
