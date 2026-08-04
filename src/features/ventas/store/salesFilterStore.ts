import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SalesFilterState = {
  year: number;
  month: number;
  setFilter: (filter: { year?: number; month?: number }) => void;
};

export const useSalesFilterStore = create<SalesFilterState>()(
  // Persist es un middleware de zustand que permite que el estado se guarde automaticamente
  // en el almacenamiento local del navegador (localStorage o sessionStorage) y se recupere automáticamente cuando la aplicación se recarga.
  persist(
    (set) => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      setFilter: (newFilter) => {
        set((state) => ({ ...state, ...newFilter }));
      },
    }),
    {
      // le decimos a zustando que guarde los datos temporalmente en sessionStorage,
      // para que cuando el usuario cierre la pestaña del navegador, los filtros se borren.
      name: "sales-filters-storage",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      migrate: (persistedState) => persistedState as SalesFilterState,
    },
  ),
);
