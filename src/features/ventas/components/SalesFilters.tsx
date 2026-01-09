import React, { memo } from 'react';
import { Search } from 'lucide-react';
import { DebouncedInput } from '@/shared/components/ui';
import { ProductTypeDto } from '@/types/sales';

interface SalesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchClientName?: string;
  onClientNameChange?: (value: string) => void;
  selectedStatus?: string;
  onStatusChange?: (value: string) => void;
  selectedProductType: string;
  onProductTypeChange: (value: string) => void;
  productTypes: ProductTypeDto[];
  statusOptions?: string[];
  productTypeOptions?: string[];
}

const SalesFilters = ({
  searchTerm,
  onSearchChange,
  searchClientName = '',
  onClientNameChange,
  selectedStatus,
  onStatusChange,
  selectedProductType,
  onProductTypeChange,
  productTypes,
  statusOptions = ['Todos', 'COMPLETED', 'ACTIVE', 'CANCELED'],
}: SalesFiltersProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Búsqueda por nombre de cliente */}
        {onClientNameChange && (
          <div className="relative">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
          <DebouncedInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Buscar por descripcion producto..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Filtro por estado */}
        {onStatusChange && (
          <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        )}


        {/* Filtro por tipo de producto */}
        <select
          value={selectedProductType}
          onChange={(e) => onProductTypeChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">Todos los productos</option>
          {productTypes.map(type => (
            <option key={type.id} value={type.id.toString()}>{type.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default memo(SalesFilters);
