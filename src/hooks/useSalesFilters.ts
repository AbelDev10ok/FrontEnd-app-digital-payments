import { useState, useMemo } from 'react';
import { ProductTypeDto, SaleResponseDto, salesService } from '../services/salesServices';


interface UseSalesFiltersReturn {
  sales: SaleResponseDto[];
  setSales: React.Dispatch<React.SetStateAction<SaleResponseDto[]>>;
}
export const useSalesFilters= ({sales, setSales}: UseSalesFiltersReturn ) => {
  const [searchDescription, setSearchDescription] = useState('');
  const [searchClientName, setSearchClientName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  


  // fetch para obtener ventas por descripción
  const fetchSalesByDescription = async (description: string) => {
    try {
      const [salesData] = await Promise.all([
        salesService.getProductDescriptions(description),
      ]);      

      setSales(salesData);
    } catch (error) {
      console.error('Error fetching sales by description:', error);
    }
  };


  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const searchMatch =
        sale.descriptionProduct.toLowerCase().includes(searchDescription.toLowerCase()) ||
        sale.id.toString().includes(searchDescription);

      const clientNameMatch =
        sale.client.name.toLowerCase().includes(searchClientName.toLowerCase());

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

      return searchMatch && clientNameMatch && statusMatch && productTypeMatch;
    });
  }, [sales, searchDescription, searchClientName, selectedStatus, selectedProductType]);

  return {
    searchDescription,
    setSearchDescription,
    searchClientName,
    setSearchClientName,
    selectedStatus,
    setSelectedStatus,
    selectedProductType,
    setSelectedProductType,
    filteredSales,
    fetchSalesByDescription,
    productTypes,
    setProductTypes
  };
};
