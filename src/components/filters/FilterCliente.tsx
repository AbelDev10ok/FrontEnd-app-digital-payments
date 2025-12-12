import { Search, Filter } from "lucide-react";
import { DebouncedInput } from "./DebouncedInput";

type FilterClienteProps = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedVendedorId: number | null;
  setSelectedVendedorId: (id: number | null) => void;
  vendedoresOptions: { id: number | null; name: string }[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
};


const FilterCliente = ({searchTerm, setSearchTerm, selectedVendedorId, setSelectedVendedorId, vendedoresOptions, showFilters, setShowFilters}:FilterClienteProps) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <DebouncedInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar clientes..."
                delay={500}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                {selectedVendedorId !== null ? vendedoresOptions.find(v => v.id === selectedVendedorId)?.name || 'Filtros' : 'Filtros'}
              </button>
              {showFilters && (
                <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg border border-gray-100 focus:outline-none">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs text-gray-400 uppercase">Filtrar por vendedor</div>
                    {vendedoresOptions && vendedoresOptions.length > 0 && vendedoresOptions.map(vendedor => (
                      <button
                        key={vendedor.id ?? 'null'}
                        onClick={() => {
                          setSelectedVendedorId(vendedor.id);
                          setShowFilters(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {vendedor.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    )

}

export default FilterCliente;