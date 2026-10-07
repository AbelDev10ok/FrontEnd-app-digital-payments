import React from 'react';
import { X } from 'lucide-react';
import { neutral, neutralBg, radius } from '@/shared/theme';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`relative w-full max-w-md bg-white ${radius.card} shadow-xl p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-display text-lg font-bold tracking-tight text-brand-950`}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className={`p-1.5 rounded-full ${neutral.muted} ${neutralBg.hover} hover:text-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
