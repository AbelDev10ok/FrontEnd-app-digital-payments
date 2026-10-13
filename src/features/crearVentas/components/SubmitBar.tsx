import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/shared/components/ui';

interface Props {
  cancelTo?: string;
  isDisabled?: boolean;
  /** Estado de envío: muestra el spinner y bloquea el doble clic. */
  isLoading?: boolean;
  submitLabel?: string;
  onDelete?: () => void;
}

const SubmitBar: React.FC<Props> = ({ cancelTo = '/dashboard/ventas', isDisabled = false, isLoading = false, submitLabel = 'Crear Transacción', onDelete }) => {
  return (
    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
      {onDelete && (
        <Button
          type="button"
          variant="dangerOutline"
          size="md"
          onClick={onDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          <span className="hidden sm:inline">Eliminar</span>
        </Button>
      )}
      <ButtonLink to={cancelTo} variant="secondary" size="lg">
        Cancelar
      </ButtonLink>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        isLoading={isLoading}
      >
        {isLoading ? 'Guardando...' : submitLabel}
      </Button>
    </div>
  );
}

export default SubmitBar;
