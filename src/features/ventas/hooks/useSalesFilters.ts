import { useState, useCallback } from "react";
import { ProductTypeDto } from "@/shared/types/sales";
import { useSalesFilterStore } from "../store/salesFilterStore";

export const useSalesFilters = () => {
  const {
    year: persistedYear,
    month: persistedMonth,
    setFilter: setPersistedFilter,
  } = useSalesFilterStore();

  const [searchDescription, setSearchDescription] = useState("");
  const [searchClientName, setSearchClientName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedProductType, setSelectedProductType] = useState("");
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [specificDate, setSpecificDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const year = persistedYear.toString();
  const month = persistedMonth.toString().padStart(2, "0");

  const setYear = useCallback((newYear: string) => {
    setPersistedFilter({ year: parseInt(newYear, 10) });
  }, [setPersistedFilter]);

  const setMonth = useCallback((newMonth: string) => {
    setPersistedFilter({ month: parseInt(newMonth, 10) });
  }, [setPersistedFilter]);

  const getFinalDate = () => {
    if (specificDate) return specificDate;
    if (year && month) return `${year}-${month}`;
    return "";
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
