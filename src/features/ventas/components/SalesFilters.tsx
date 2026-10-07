import { memo, useState } from "react";
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { DebouncedInput } from "@/shared/components/ui/DebouncedInput";
import { Button, Select } from "@/shared/components/ui";

interface SalesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoan?: boolean;
  searchClientName?: string;
  onClientNameChange?: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  month: string;
  setMonth: (value: string) => void;
  specificDate: string;
  setSpecificDate: (value: string) => void;
  onClearFilters?: () => void;
}

const SalesFilters = ({
  searchTerm,
  onSearchChange,
  isLoan = false,
  searchClientName = "",
  onClientNameChange,
  year,
  setYear,
  month,
  setMonth,
  specificDate,
  setSpecificDate,
  onClearFilters,
}: SalesFiltersProps) => {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) =>
    (currentYear - i).toString(),
  );
  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const setToday = () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(now.getDate()).padStart(2, "0")}`;
    setSpecificDate(today);
    setYear("");
    setMonth("");
  };

  const filters = (
    <div className="flex flex-wrap items-center gap-4">
      {/* Búsqueda por nombre de cliente */}
      {onClientNameChange && (
        <div className="relative flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
          <DebouncedInput
            value={searchClientName}
            onChange={onClientNameChange}
            placeholder="Buscar por nombre cliente..."
            className="pl-10 pr-4"
          />
        </div>
      )}

      {/* Búsqueda por descripción de producto (solo ventas) */}
      {!isLoan && (
        <div className="relative flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
          <DebouncedInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar por descripcion producto..."
            className="pl-10 pr-4"
          />
        </div>
      )}

      {/* Filtro por año */}
      <Select
        value={year}
        onChange={(e) => {
          setYear(e.target.value);
          setSpecificDate("");
        }}
        disabled={!!specificDate}
        className="sm:w-auto disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label="Año"
      >
        <option value="">Año</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>

      {/* Filtro por mes */}
      <Select
        value={month}
        onChange={(e) => {
          setMonth(e.target.value);
          setSpecificDate("");
        }}
        disabled={!!specificDate}
        className="sm:w-auto disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label="Mes"
      >
        <option value="">Mes</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </Select>

      {/* Preset de fecha: hoy */}
      <Button variant="secondary" size="sm" onClick={setToday}>
        Hoy
      </Button>

      {/* Limpiar todos los filtros */}
      {onClearFilters && (
        <Button
          variant="dangerOutline"
          size="sm"
          onClick={onClearFilters}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-4 mb-4 md:hidden">
        <span className="text-sm font-semibold">Filtros</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowMobileFilters(true)}
          leftIcon={<SlidersHorizontal className="w-5 h-5" />}
        >
          Abrir filtros
        </Button>
      </div>

      <div className="hidden md:block">{filters}</div>

      {/* Modal de filtros para mobile */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-card shadow-xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold tracking-tight text-brand-950">Filtros</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {filters}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SalesFilters);
