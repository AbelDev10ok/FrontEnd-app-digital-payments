import Modal from '@/shared/components/ui/Modal';
import { Alert, Button } from '@/shared/components/ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  /** Consecuencias de la acción, cuando las hay (datos en uso, dependencias). */
  warning?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmación destructiva: todo borrado del catálogo pasa por acá para que
 * ninguna acción irreversible se dispare con un solo click.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  warning,
  confirmLabel = 'Eliminar',
  isLoading = false,
  onConfirm,
  onCancel,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} title={title}>
    <p className="text-sm text-gray-700">{message}</p>
    {warning && (
      <div className="mt-3">
        <Alert tone="warning">{warning}</Alert>
      </div>
    )}
    <div className="mt-6 flex justify-end gap-2">
      <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
