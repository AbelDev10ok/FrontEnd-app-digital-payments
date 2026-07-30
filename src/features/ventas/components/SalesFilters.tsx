import { memo, useState } from "react";
import { Search, Calendar, X, SlidersHorizontal } from "lucide-react";
import { DebouncedInput } from "@/shared/components/ui";
// import { ProductTypeDto } from '@/types/sales';

interface SalesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchClientName?: string;
  onClientNameChange?: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  month: string;
  setMonth: (value: string) => void;
  specificDate: string;
  setSpecificDate: (value: string) => void;
  showCalendar: boolean;
  setShowCalendar: (value: boolean) => void;
  // selectedProductType: string;
  // onProductTypeChange: (value: string) => void;
  // productTypes: ProductTypeDto[];
  // productTypeOptions?: string[];
}

const SalesFilters = ({
  searchTerm,
  onSearchChange,
  searchClientName = "",
  onClientNameChange,
  year,
  setYear,
  month,
  setMonth,
  specificDate,
  setSpecificDate,
  showCalendar,
  setShowCalendar,
  // selectedProductType,
  // onProductTypeChange,
  // productTypes,
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

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-4">
      {/* Búsqueda por nombre de cliente */}
      {onClientNameChange && (
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
          <DebouncedInput
            value={searchClientName}
            onChange={onClientNameChange}
            placeholder="Buscar por nombre cliente..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      )}

      {/* Búsqueda por descripción de producto */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
        <DebouncedInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Buscar por descripcion producto..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Filtro por año */}
      <select
        value={year}
        onChange={(e) => {
          setYear(e.target.value);
          setSpecificDate("");
          setShowCalendar(false);
        }}
        disabled={!!specificDate}
        className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Año</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* Filtro por mes */}
      <select
        value={month}
        onChange={(e) => {
          setMonth(e.target.value);
          setSpecificDate("");
          setShowCalendar(false);
        }}
        disabled={!!specificDate}
        className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Mes</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Botón para calendario específico */}
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:bg-gray-50"
      >
        <Calendar className="w-5 h-5 mr-2" />
        Fecha específica
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between gap-4 mb-4 md:hidden">
        <span className="text-sm font-semibold">Filtros</span>
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Abrir filtros
        </button>
      </div>

      <div className="hidden md:block">{renderFilters()}</div>

      {/* Modal de filtros para mobile */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {renderFilters()}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para calendario */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Seleccionar fecha específica
              </h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <input
              type="date"
              value={specificDate}
              onChange={(e) => {
                setSpecificDate(e.target.value);
                setYear("");
                setMonth("");
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSpecificDate("");
                  setYear("");
                  setMonth("");
                  setShowCalendar(false);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowCalendar(false)}
                className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SalesFilters);
