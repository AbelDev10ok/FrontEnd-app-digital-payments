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
      clientService.getVendedoresConClientesAsignados().then((vendedoresList: Client[]) => {
        // Crear array con opciones: Todos, vendedores únicos, Sin vendedor
        // Crear array con opciones: Todos, vendedores únicos, Sin vendedor.
        // NOTA: El backend debería devolver tanto vendedores activos como inactivos 
        // que tengan clientes asignados para que el filtro funcione correctamente con históricos.
        
        // Usamos un Map para deduplicar por ID de forma eficiente (O(N)) en lugar de por nombre
        const uniqueSellersMap = new Map();
        vendedoresList.forEach(v => {
          if (v.id && !uniqueSellersMap.has(v.id)) {
            uniqueSellersMap.set(v.id, { id: v.id, name: v.name });
          }
        });

        setVendedoresOptions([
          { id: null, name: 'Todos' },
          ...Array.from(uniqueSellersMap.values()),
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