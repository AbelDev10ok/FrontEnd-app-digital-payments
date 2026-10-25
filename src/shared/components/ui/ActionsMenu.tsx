import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';

export type ActionMenuItemTone = 'default' | 'brand' | 'warning' | 'danger';

export interface ActionMenuItem {
  /** Texto visible de la opción. */
  label: string;
  /** Icono lineal de la opción (mismo trazo que el resto de la UI). */
  icon?: LucideIcon;
  /** Se ejecuta al elegir la opción; después el menú se cierra. */
  onSelect: () => void;
  /** Color semántico: marca para reimprimir, ámbar para anular, rojo para eliminar. */
  tone?: ActionMenuItemTone;
}

interface ActionsMenuProps {
  /** Nombre accesible del botón que abre el menú (p. ej. "Acciones de la venta #10"). */
  label: string;
  items: ActionMenuItem[];
  /** Borde del botón contra el que se alinea el panel. */
  align?: 'start' | 'end';
}

/** Ancho del panel (`w-56`), necesario para calcular la posición sin montarlo. */
const PANEL_WIDTH = 224;
const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 6;

const toneClasses: Record<ActionMenuItemTone, string> = {
  default: 'text-gray-700',
  brand: 'text-brand-700',
  warning: 'text-amber-600',
  danger: 'text-red-600',
};

/**
 * Menú de acciones secundarias de una fila o encabezado: botón de tres puntos
 * horizontales (patrón de tablas de operación) y panel con las opciones.
 *
 * El panel se renderiza en un portal con posición fija: así escapa del
 * `overflow` de las tablas y de cualquier ancestro con `transform`, y sigue al
 * botón si la página se desplaza. Cierra con click afuera, Escape o al elegir
 * una opción, y navega con las flechas del teclado.
 */
export default function ActionsMenu({ label, items, align = 'end' }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const preferida = align === 'end' ? rect.right - PANEL_WIDTH : rect.left;
    setPosition({
      top: Math.min(rect.bottom + TRIGGER_GAP, window.innerHeight - TRIGGER_GAP),
      left: Math.max(
        VIEWPORT_MARGIN,
        Math.min(preferida, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN),
      ),
    });
  }, [align]);

  const open = () => {
    if (isOpen) {
      close();
      return;
    }
    // La posición se calcula antes de abrir: el panel se monta en el mismo
    // render y el foco puede entrar a la primera opción.
    updatePosition();
    setIsOpen(true);
  };

  // Al abrir: posicionar, enfocar la primera opción y seguir scroll/resize.
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    panelRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();

    const onReflow = () => updatePosition();
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [isOpen, updatePosition]);

  // Click afuera cierra sin robar el foco de lo que el usuario tocó.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen, close]);

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const opciones = Array.from(
      panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    );
    if (opciones.length === 0) return;
    const actual = opciones.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      opciones[(actual + delta + opciones.length) % opciones.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      opciones[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      opciones[opciones.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close();
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={open}
        className={`p-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 ${
          isOpen
            ? 'bg-brand-50 text-brand-700'
            : 'text-gray-400 hover:text-brand-700 hover:bg-brand-50'
        }`}
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label={label}
            onKeyDown={onPanelKeyDown}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: PANEL_WIDTH,
            }}
            className={`z-50 rounded-card border border-gray-100 bg-white py-1 shadow-card animate-modal-panel motion-reduce:animate-none ${
              align === 'end' ? 'origin-top-right' : 'origin-top-left'
            }`}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.onSelect();
                    close();
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none ${
                    toneClasses[item.tone ?? 'default']
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 mr-2" aria-hidden="true" />}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
