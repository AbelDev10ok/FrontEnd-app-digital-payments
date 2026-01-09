import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  cancelTo?: string;
  isDisabled?: boolean;
  submitLabel?: string;
}

const SubmitBar: React.FC<Props> = ({ cancelTo = '/dashboard/ventas', isDisabled = false, submitLabel = 'Crear Transacción' }) => {
  return (
    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
        className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl shadow-md hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 ${isDisabled ? 'opacity-50 cursor-not-allowed hover:from-indigo-600 hover:to-indigo-500' : ''}`}
      >
        {submitLabel}
      </button>
    </div>
  );
}

export default SubmitBar;
