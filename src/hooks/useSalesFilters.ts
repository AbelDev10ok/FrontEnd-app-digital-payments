import { useState } from 'react';
import { ProductTypeDto } from '../services/salesServices';

export const useSalesFilters= () => {
  const [searchDescription, setSearchDescription] = useState('');
  const [searchClientName, setSearchClientName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);

  return {
    searchDescription,
    setSearchDescription,
    searchClientName,
    setSearchClientName,
    selectedStatus,
    setSelectedStatus,
    selectedProductType,
    setSelectedProductType,
    productTypes,
    setProductTypes
  };
};
