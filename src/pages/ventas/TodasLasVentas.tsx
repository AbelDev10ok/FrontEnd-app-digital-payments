import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { salesService, SaleResponseDto } from '../../services/salesServices';
import Load from '../../shared/Load';
import ErrorMessage from '../../shared/ErrorMessage';
import HeaderTransaction from '../../shared/HeaderTransaction';
import SalesFilters from '../../components/filters/SalesFilters';
import { useSalesFilters } from '../../hooks/useSalesFilters';

interface TodasLasVentasProps {
  transaction?: string;
}

const TodasLasVentas = ({transaction}: TodasLasVentasProps = {}) => {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
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
    } = useSalesFilters({sales, setSales});

  const statusOptions = ['Todos', 'Completada', 'Pendiente', 'Atrasada'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
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

  const fetchAllSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        clientName?: string;
        descriptionProduct?: string;
        status?: string;
        productType?: string;
      } = {};

      if (searchClientName) {
        params.clientName = searchClientName;
      }
      if (searchDescription) {
        params.descriptionProduct = searchDescription;
      }
      if (selectedStatus !== 'Todos') {
        const statusMap: { [key: string]: string } = {
          'Completada': 'COMPLETED',
          'Pendiente': 'PENDING',
          'Atrasada': 'DELAYED'
        };
        params.status = statusMap[selectedStatus];
      }
      if (selectedProductType) {
        const productType = productTypes.find(pt => pt.id.toString() === selectedProductType);
        if (productType) {
          params.productType = productType.name;
        }
      }

      params.productType = params.productType || (transaction ? 'PRESTAMO' : 'VENTA');

      const salesData = await salesService.getFeesDue(params);
      setSales(salesData);
      console.log(salesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSales();
  }, [searchDescription, searchClientName, selectedStatus, selectedProductType]);

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const types = await salesService.getProductTypes();
        setProductTypes(types);
      } catch (err) {
        console.error('Error al cargar tipos de productos:', err);
      }
    };

    fetchAllSales();
    fetchProductTypes();
  }, [transaction]);

  if (loading) {
    return (
      <DashboardLayout title="Todas las Ventas">
        <Load />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Todas las Ventas">
      <div className="space-y-6">
        {/* Header */}
        <HeaderTransaction title="Todas las Ventas" />
        {/* Error Message */}
        {error && (
          <ErrorMessage message={error} />
        )}

        {/* Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {sales.filter(s => s.completed).length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(sales.filter(s => s.completed).reduce((sum, s) => sum + s.priceTotal, 0))}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendiente Cobro</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(sales.reduce((sum, s) => sum + s.remainingAmount, 0))}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div> */}

        {/* Search and Filters */}
        <SalesFilters
          searchTerm={searchDescription}
          onSearchChange={setSearchDescription}
          searchClientName={searchClientName}
          onClientNameChange={setSearchClientName}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedProductType={selectedProductType}
          onProductTypeChange={setSelectedProductType}
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
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchDescription || selectedStatus !== 'Todos' 
                        ? 'No se encontraron ventas que coincidan con los filtros' 
                        : 'No hay ventas registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">#{sale.id}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{sale.descriptionProduct}</div>
                            <div className="text-sm text-gray-500">{formatDate(sale.dateSale)}</div>
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
      </div>
    </DashboardLayout>
  );
};

export default TodasLasVentas;