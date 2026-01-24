import { AlertCircle } from 'lucide-react';
import { useMemo, useCallback } from 'react';

import Load from '@/shared/components/feedback/Load.tsx';
import { FetchParamsClients } from '@/types/client';
import { DashboardLayout } from '@/shared/components/layout';
import HeaderClientes from '@/features/clients/components/HeaderClientes';
import ClientTable from '../components/ClientTable';
import { Paginación } from '@/shared/components/ui';
import { useClientsFilters } from '@/features/clients/hooks/useClientsFilters';
import usePaginatedClients from '@/features/clients/hooks/usePaginatedClients';
import { clientService } from '../services/clientServices';
import FilterCliente from '../components/FilterCliente';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const Clientes: React.FC<PageProps> = ({ user, onLogout }) => {
  const {searchTerm,
        selectedVendedorId,
        showFilters,
        vendedoresOptions,
        setSearchTerm,
        setSelectedVendedorId,
        setShowFilters
      } = useClientsFilters();

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, [setSearchTerm]);

  const handleVendedorChange = useCallback((id: number | null) => {
    setSelectedVendedorId(id);
  }, [setSelectedVendedorId]);

  const handleShowFilters = useCallback((show: boolean) => {
    setShowFilters(show);
  }, [setShowFilters]);



  const fetcher = useMemo(() => {
    return async ({ page, size }: { page: number; size: number }) => {
      const params: FetchParamsClients = { page, size };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      
      // Si selectedVendedorId es -1, significa "Sin vendedor"
      if (selectedVendedorId === -1) {
        params.withoutSeller = true;
      } else if (selectedVendedorId && selectedVendedorId !== null) {
        // Si es un número positivo, es el ID del vendedor
        params.sellerId = selectedVendedorId;
      }
      // Si es null, no enviar filtro (significa "Todos")
      
      return clientService.getClientsPaginated(params);
    };
  }, [searchTerm, selectedVendedorId]);

  const deps = useMemo(() => [searchTerm, selectedVendedorId], [searchTerm, selectedVendedorId]);

  const { clients, loading, error, page, setPage, totalPages } = usePaginatedClients(
    fetcher,
    deps,
    0,
    10
  );
  

  if(loading) {
    return (
      <DashboardLayout title="Gestión de Clientes" user={user} onLogout={onLogout}>
        <Load />
      </DashboardLayout>
    );
  }

  if(error){
    return (
      <DashboardLayout title="Gestión de Clientes" user={user} onLogout={onLogout}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-5 h-5 mr-3" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestión de Clientes" user={user} onLogout={onLogout}>
      <div className="space-y-6">

        <HeaderClientes/>

        {/* Search and Filters */}
        <FilterCliente
        searchTerm={searchTerm}
        setSearchTerm={handleSearchTermChange}
        selectedVendedorId={selectedVendedorId}
        setSelectedVendedorId={handleVendedorChange}
        vendedoresOptions={vendedoresOptions}
        showFilters={showFilters}
        setShowFilters={handleShowFilters}
        />


        {/* Clients Table */}
        {!loading && (
          <ClientTable clients={clients} searchTerm={searchTerm} />
        )}

            {/* Paginación */}
            {totalPages > 1 && (
              <Paginación
                page={page}
                setPage={setPage}
                totalPages={totalPages}
              />
            )}
      </div>
    </DashboardLayout>
  );
};

export default Clientes;
