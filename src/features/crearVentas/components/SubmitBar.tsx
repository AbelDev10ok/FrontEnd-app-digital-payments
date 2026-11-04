import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/shared/components/ui';

interface Props {
  /** Destino de "Cancelar": siempre una ruta que existe (nunca la landing). */
  cancelTo?: string;
  isDisabled?: boolean;
  /** Estado de envío: muestra el spinner y bloquea el doble clic. */
  isLoading?: boolean;
  submitLabel?: string;
  onDelete?: () => void;
  /**
   * Ancla la barra al pie del viewport en móvil: el formulario de alta mide más
   * de un pantallazo y el botón quedaba enterrado. Desde `sm` vuelve al flujo.
   */
  stickyOnMobile?: boolean;
}

const SubmitBar: React.FC<Props> = ({ cancelTo = '/dashboard/ventas/todas', isDisabled = false, isLoading = false, submitLabel = 'Crear Transacción', onDelete, stickyOnMobile = false }) => {
  // En móvil los botones ocupan el ancho completo y el primario queda al pie,
  // al alcance del pulgar; desde `sm` vuelven a la fila alineada a la derecha.
  const layout = stickyOnMobile
    ? 'sticky bottom-0 z-20 -mx-6 -mb-6 flex flex-col gap-3 rounded-b-card border-t border-gray-200 bg-surface px-6 pt-4 pb-4 sm:static sm:z-auto sm:mx-0 sm:mb-0 sm:flex-row sm:justify-end sm:gap-4 sm:rounded-none sm:bg-transparent sm:px-0 sm:pt-6 sm:pb-0'
    : 'flex justify-end space-x-4 pt-6 border-t border-gray-200';

  return (
    <div className={layout}>
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
