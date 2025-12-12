import { AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { useClientsFilters } from '../../hooks/useClientsFilters';
import { clientService } from '../../services/clientServices';
import usePaginatedClients from '../../hooks/usePaginatedClients.ts';
import HeaderClientes from './components/HeaderClientes.tsx';
import FilterCliente from '../../components/filters/FilterCliente.tsx';
import ClientTable from '../../components/clientes/ClientTable.tsx';
import Paginación from '../../shared/Paginacion.tsx';
import { FetchParamsClients } from '../../types/client.ts';
import Load from '@/shared/components/feedback/Load.tsx';

const Clientes: React.FC = () => {
  const {searchTerm,
        selectedVendedorId,
        showFilters,
        vendedoresOptions,
        setSearchTerm,
        setSelectedVendedorId,
        setShowFilters
      } = useClientsFilters();



  const fetcher = async ({ page, size }: { page: number; size: number }) => {
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

  const { clients, loading, error, page, setPage, totalPages } = usePaginatedClients(
    fetcher,
    [searchTerm, selectedVendedorId],
    0,
    10
  );
  

  if(loading) {
    return (
      <DashboardLayout title="Gestión de Clientes">
        <Load />
      </DashboardLayout>
    );
  }

  if(error){
    return (
      <DashboardLayout title="Gestión de Clientes">
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
    <DashboardLayout title="Gestión de Clientes">
      <div className="space-y-6">

        <HeaderClientes/>

        {/* Search and Filters */}
        <FilterCliente
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedVendedorId={selectedVendedorId}
        setSelectedVendedorId={setSelectedVendedorId}
        vendedoresOptions={vendedoresOptions}
        showFilters={showFilters}
        setShowFilters={setShowFilters
        }

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