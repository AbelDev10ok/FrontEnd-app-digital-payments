import { useEffect, useState } from "react";
import { Client } from "../../../types/client";
import { clientService } from "../services/clientServices";

export interface VendedorOption {
  id: number | null;
  name: string;
}

export const useClientsFilters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendedorId, setSelectedVendedorId] = useState<number | null>(null); 
  const [showFilters, setShowFilters] = useState(false);
  const [vendedoresOptions, setVendedoresOptions] = useState<VendedorOption[]>([
    { id: null, name: 'Todos' },
    { id: -1, name: 'Sin vendedor' }
  ]);

  useEffect(() => {
    // Obtener lista de vendedores desde el backend
    try {
      clientService.getVendedores().then((vendedoresList: Client[]) => {
        // Crear array con opciones: Todos, vendedores únicos, Sin vendedor
        const vendedoresUnicos = vendedoresList
          .filter((v, i, arr) => arr.findIndex(vendor => vendor.name === v.name) === i)
          .map(v => ({ id: v.id, name: v.name }));
        
        setVendedoresOptions([
          { id: null, name: 'Todos' },
          ...vendedoresUnicos,
          { id: -1, name: 'Sin vendedor' }
        ]);
      });
    } catch (error) {
      console.error('Error al obtener la lista de vendedores:', error);
    }
  }, []);
      
  return {
    searchTerm,
    setSearchTerm,
    selectedVendedorId,   
    setSelectedVendedorId,
    showFilters,
    setShowFilters,
    vendedoresOptions
  };
};