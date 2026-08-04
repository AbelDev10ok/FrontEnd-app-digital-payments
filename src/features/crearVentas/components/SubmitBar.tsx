import React from 'react';
import { Link } from 'react-router-dom';
import  {Trash2 } from 'lucide-react';

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
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium flex items-center gap-2 border border-red-100"
              >
              <Trash2 className="w-5 h-5" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
      )}
      <Link
        to={cancelTo}
        className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
      >
        Cancelar
      </Link>
      <button
        type="submit"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl shadow-md hover:from-brand-700 hover:to-brand-600 transition-all duration-200 ${isDisabled ? 'opacity-50 cursor-not-allowed hover:from-brand-600 hover:to-brand-500' : ''}`}
      >
        {submitLabel}
      </button>
    </div>
  );
}

export default SubmitBar;
