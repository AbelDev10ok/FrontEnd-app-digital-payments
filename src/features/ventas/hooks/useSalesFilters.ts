import { useState } from 'react';
import { ProductTypeDto } from '../../../types/sales';

export const useSalesFilters = () => {
  const [searchDescription, setSearchDescription] = useState('');
  const [searchClientName, setSearchClientName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [specificDate, setSpecificDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const getFinalDate = () => {
    if (specificDate) return specificDate;
    if (year && month) return `${year}-${month}`;
    return '';
  };

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
    setProductTypes,
    year,
    setYear,
    month,
    setMonth,
    specificDate,
    setSpecificDate,
    showCalendar,
    setShowCalendar,
    date: getFinalDate(),
    setDate: setSpecificDate,
  };
};
