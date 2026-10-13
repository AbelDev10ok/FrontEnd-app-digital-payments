import { useCallback, useId, useState } from 'react';
import type { KeyboardEvent } from 'react';

interface UseComboboxArgs {
  /** Cantidad de opciones visibles en el listado. */
  optionCount: number;
  /** Selecciona la opción activa del listado. */
  onPick: (index: number) => void;
}

/**
 * Estado y teclado del patrón combobox accesible (WAI-ARIA):
 * ↑↓ recorren las opciones, Enter selecciona, Esc cierra el listado y
 * `aria-activedescendant` sigue la opción resaltada.
 */
export default function useCombobox({ optionCount, onPick }: UseComboboxArgs) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listboxId = `${uid}-listbox`;
  const optionId = (index: number) => `${uid}-option-${index}`;

  const openList = useCallback(() => {
    setActiveIndex(-1);
    setOpen(true);
  }, []);

  const closeList = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const moveActive = (delta: number) => {
      setActiveIndex((prev) => {
        if (optionCount === 0) return -1;
        if (prev === -1) return delta > 0 ? 0 : optionCount - 1;
        return (prev + delta + optionCount) % optionCount;
      });
    };

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(optionCount > 0 ? 0 : -1);
        } else {
          moveActive(1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(optionCount > 0 ? optionCount - 1 : -1);
        } else {
          moveActive(-1);
        }
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActiveIndex(optionCount > 0 ? 0 : -1);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActiveIndex(optionCount > 0 ? optionCount - 1 : -1);
        }
        break;
      case 'Enter':
        if (open) {
          // No enviar el formulario mientras se elige una opción.
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < optionCount) {
            onPick(activeIndex);
            closeList();
          }
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          closeList();
        }
        break;
      case 'Tab':
        closeList();
        break;
      default:
        break;
    }
  };

  const activeOptionId =
    open && activeIndex >= 0 && activeIndex < optionCount ? optionId(activeIndex) : undefined;

  return {
    open,
    activeIndex,
    setActiveIndex,
    openList,
    closeList,
    handleKeyDown,
    listboxId,
    optionId,
    activeOptionId,
  };
}
