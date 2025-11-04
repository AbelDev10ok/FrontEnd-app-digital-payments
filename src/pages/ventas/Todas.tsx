import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { SaleResponseDto, salesService } from '../../services/salesServices';
import SalesFilters from '../../components/filters/SalesFilters';
import { useSalesFilters } from '../../hooks/useSalesFilters';
import HeaderTransaction from '../../shared/HeaderTransaction';
import ErrorMessage from '../../shared/ErrorMessage';

const Todas: React.FC = () => {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const isInitialLoad = useRef(true);


  const {
    searchClientName,
    setSearchClientName,
    searchDescription,
    setSearchDescription,
    selectedStatus,
    setSelectedStatus,
    productTypes,
    setProductTypes,
    selectedProductType,
    setSelectedProductType
  } = useSalesFilters();



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const statusOptions = ['Todos', 'COMPLETED', 'ACTIVE', 'CANCELED'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      timeZone: 'UTC'
    });
  };
  
  const getStatusBadge = (transaction: SaleResponseDto) => {
      if (transaction.completed) {
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completada</span>;
      }
      if (transaction.daysLate > 0) {
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Atrasada ({transaction.daysLate}d)</span>;
      }
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
    };
  
  const fetchSales = async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
      }
      setError(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        page,
        size: 10, // O el tamaño de página que prefieras
      };

      if (searchDescription.trim()) params.descriptionProduct = searchDescription.trim();
      if (searchClientName.trim()) params.clientName = searchClientName.trim();
      console.log("selectedStatus", selectedStatus);
      if (selectedStatus !== 'Todos') params.status = selectedStatus.toUpperCase();
      if (selectedProductType) params.productType = selectedProductType;

      // Aquí podrías agregar los filtros de año y mes si los implementas en la UI
      // params.year = selectedYear;
      // params.month = selectedMonth;

      const salesData = await salesService.getAllSalesPaginated(params);
      setSales(salesData.content);
      setTotalPages(salesData.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las ventas');
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  };

  useEffect(() => {
      const fetchProductTypes = async () => {
        try {
          const types = await salesService.getProductTypes();
          setProductTypes(types);
          console.log("types", types); // <-- esto sí muestra el array de objetos en la consola
          console.log("productTypes", productTypes);
        } catch (error) {
          console.error('Error fetching product types:', error);
        }
      };
  
      fetchProductTypes();
  }, []);

    useEffect(() => {
      fetchSales();
  }, [page, searchDescription, searchClientName, selectedStatus, selectedProductType, productTypes]);

  if (loading) {
    return (
      <DashboardLayout title="Todas las Ventas">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando ventas...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
   <DashboardLayout title="Todas las Ventas">
      <div className="space-y-6">
        <HeaderTransaction title="Todas las Ventas" />
        {error && (
          <ErrorMessage message={error} />
        )}

        <SalesFilters
          searchTerm={searchDescription}
          onSearchChange={setSearchDescription}
          searchClientName={searchClientName}
          onClientNameChange={setSearchClientName}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedProductType={selectedProductType} // <-- usa el estado del hook
          onProductTypeChange={setSelectedProductType} // <-- usa el setter del hook
          productTypes={productTypes}
          statusOptions={statusOptions}
        />

        {/* Sales Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchDescription || searchClientName || selectedStatus !== 'Todos'
                        ? 'No se encontraron ventas que coincidan con los filtros'
                        : 'No hay ventas registradas'}
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">#{sale.id}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{sale.descriptionProduct}</div>
                            <div className="text-sm text-gray-500">{formatDate(sale.dateSale )}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sale.client.name}</div>
                        <div className="text-sm text-gray-500">{sale.client.telefono}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(sale.priceTotal)}</div>
                        {!sale.completed && (
                          <div className="text-sm text-gray-500">Pendiente: {formatCurrency(sale.remainingAmount)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.typePayments !== 'UNICO' ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sale.paidFeesCount}/{sale.totalFees} cuotas
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(sale.paidFeesCount / sale.totalFees) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Pago único</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sale)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/dashboard/ventas/${sale.id}`}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          <LinkIcon className="w-4 h-4 inline mr-1" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Paginación */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Todas;