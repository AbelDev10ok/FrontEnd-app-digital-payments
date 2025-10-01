import { useState, useMemo } from 'react';
import { SaleResponseDto } from '../services/salesServices';

export const useSalesFilters = (sales: SaleResponseDto[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedProductType, setSelectedProductType] = useState('');

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const searchMatch =
        sale.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.descriptionProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toString().includes(searchTerm);

      const statusMatch = (() => {
        if (selectedStatus === 'Todos') return true;
        if (selectedStatus === 'Completada') return sale.completed;
        if (selectedStatus === 'Pendiente') return !sale.completed && sale.daysLate === 0;
        if (selectedStatus === 'Atrasada') return !sale.completed && sale.daysLate > 0;
        return true;
      })();

      const productTypeMatch =
        !selectedProductType ||
        sale.productType.id.toString() === selectedProductType;

      return searchMatch && statusMatch && productTypeMatch;
    });
  }, [sales, searchTerm, selectedStatus, selectedProductType]);

  return {
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedProductType,
    setSelectedProductType,
    filteredSales
  };
};
