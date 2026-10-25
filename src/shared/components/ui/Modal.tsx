import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { neutral, neutralBg, radius } from '@/shared/theme';

type ModalSize = 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Ancho del panel; `md` conserva el comportamiento original. */
  size?: ModalSize;
}

const panelSize: Record<ModalSize, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // Esc cierra: es lo que todo el mundo espera de un diálogo modal.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-modal-overlay motion-reduce:animate-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`relative w-full ${panelSize[size]} max-h-[calc(100vh-2rem)] overflow-y-auto bg-white ${radius.card} shadow-xl p-6 animate-modal-panel motion-reduce:animate-none`}
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
