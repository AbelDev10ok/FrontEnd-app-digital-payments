import { AlertCircle, Users, DollarSign } from 'lucide-react';

import Load from '@/shared/components/feedback/Load.tsx';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { FetchParamsClients } from '@/shared/types/client';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import HeaderClientes from '@/features/clients/components/HeaderClientes';
import ClientTable from '../components/ClientTable';
import Paginación from '@/shared/components/ui/Paginacion';
import { useClientsFilters } from '@/features/clients/hooks/useClientsFilters';
import usePaginatedClients from '@/features/clients/hooks/usePaginatedClients';
import { clientService } from '@features/clients/services/clientServices';
import FilterCliente from '@features/clients/components/FilterCliente';

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

  const { clients, loading, error, page, setPage, totalPages, totalElements } = usePaginatedClients(
    fetcher,
    [searchTerm, selectedVendedorId],
    0,
    10
  );

  const stats = !loading && clients.length > 0
    ? {
        conDeuda: clients.filter(c => c.deudaTotal && c.deudaTotal > 0).length,
        totalDeuda: clients.reduce((sum, c) => sum + (c.deudaTotal || 0), 0),
      }
    : null;
  
  // Eliminamos los returns tempranos para evitar que se desmonte el buscador

  return (
    <DashboardLayout title="Gestión de Clientes" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <HeaderClientes/>

        {/* Search and Filters - Se mantiene siempre renderizado para no perder el foco */}
        <FilterCliente
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedVendedorId={selectedVendedorId}
          setSelectedVendedorId={setSelectedVendedorId}
          vendedoresOptions={vendedoresOptions}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        {/* Stats bar */}
        {!loading && !error && totalElements > 0 && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-card p-4 shadow-card border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total clientes</p>
                <p className="text-lg font-bold text-gray-900">{totalElements}</p>
              </div>
            </div>
            <div className="bg-white rounded-card p-4 shadow-card border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Con deuda</p>
                <p className="text-lg font-bold text-gray-900">{stats.conDeuda} <span className="text-sm font-normal text-gray-500">de {clients.length}</span></p>
              </div>
            </div>
            <div className="bg-white rounded-card p-4 shadow-card border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Deuda total</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalDeuda)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Clients Table o Estado de Carga/Error */}
        {loading ? (
          <Load />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-card p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : (
          <ClientTable clients={clients} searchTerm={searchTerm} />
        )}

        {/* Paginación */}
        {!loading && !error && totalPages > 1 && (
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
