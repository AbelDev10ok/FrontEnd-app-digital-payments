import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SalesFilterState = {
  year: number;
  month: number;
  setFilter: (filter: { year?: number; month?: number }) => void;
};

const getCurrentYear = () => new Date().getFullYear();
const getCurrentMonth = () => new Date().getMonth() + 1;

export const useSalesFilterStore = create<SalesFilterState>()(
  // Persist es un middleware de zustand que permite que el estado se guarde automaticamente
  // en el almacenamiento local del navegador (localStorage o sessionStorage) y se recupere automáticamente cuando la aplicación se recarga.
  persist(
    (set) => ({
      year: getCurrentYear(),
      month: getCurrentMonth(),
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
      // Sanitiza lo rehidratado: si sessionStorage guardó year/month en null (datos viejos),
      // evita que el merge shallow de zustand pise los defaults y rompa la app con "Cannot
      // read properties of null".
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SalesFilterState>;
        const year =
          typeof saved.year === "number" && saved.year >= 2000 && saved.year <= 2100
            ? saved.year
            : getCurrentYear();
        const month =
          typeof saved.month === "number" && saved.month >= 1 && saved.month <= 12
            ? saved.month
            : getCurrentMonth();
        return { ...current, year, month };
      },
    },
  ),
);
