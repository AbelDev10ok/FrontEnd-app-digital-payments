import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface Props {
  cancelTo?: string;
  isDisabled?: boolean;
  submitLabel?: string;
  onDelete?: () => void;
}

const SubmitBar: React.FC<Props> = ({ cancelTo = '/dashboard/ventas', isDisabled = false, submitLabel = 'Crear Transacción', onDelete }) => {
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
      <Link
        to={cancelTo}
        className="inline-flex items-center px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
      >
        Cancelar
      </Link>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isDisabled}
        aria-disabled={isDisabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

export default SubmitBar;
