import { create } from 'zustand';

interface SalesCountsState {
  /** Sube cada vez que una operación marca los conteos del menú como viejos. */
  refreshToken: number;
  /** Pide al menú que vuelva a traer sus conteos (Todas / A Cobrar / ...). */
  refresh: () => void;
}

/**
 * Los conteos del menú son estado global del negocio: cada alta, cobro,
 * anulación o borrado los mueve. Las pantallas avisan con `refresh()` y el
 * Sidebar vuelve a pedirlos, sin obligar a recargar la página.
 */
export const useSalesCountsStore = create<SalesCountsState>((set) => ({
  refreshToken: 0,
  refresh: () => set((state) => ({ refreshToken: state.refreshToken + 1 })),
}));
