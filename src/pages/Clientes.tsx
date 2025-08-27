/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashBoardLayout';
import { useClients } from '../hooks/useClients';

const Clientes: React.FC = () => {
  const { clients, loading, error, financialStats, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // Obtenemos una lista única de nombres de vendedores asignados a los clientes.
  // Usamos 'sellerName' de la interfaz Client.
  const vendedores = useMemo(() => {
    const vendedorSet = new Set(clients.map(client => client.sellerName).filter(Boolean));
    return ['Todos', ...Array.from(vendedorSet), 'Sin vendedor'];
  }, [clients]);

  const filteredClients = clients.filter(client => {
    const searchMatch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono.includes(searchTerm);

    const vendedorMatch = (() => {
      if (!selectedVendedor || selectedVendedor === 'Todos') {
        return true;
      }
      if (selectedVendedor === 'Sin vendedor') {
        return !client.sellerName;
      }
      return client.sellerName === selectedVendedor;
    })();

    return searchMatch && vendedorMatch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleDeleteClient = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      try {
        setDeletingId(id);
        await deleteClient(id);
      } catch (err) {
        console.error('Error al eliminar cliente:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Gestión de Clientes">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando clientes...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestión de Clientes">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Lista de Clientes</h2>
              <p className="text-sm text-gray-500">Gestiona todos tus clientes</p>
            </div>
          </div>
          
          <Link
            to="/dashboard/clientes/crear"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                {selectedVendedor && selectedVendedor !== 'Todos' ? selectedVendedor : 'Filtros'}
              </button>
              {showFilters && (
                <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg border border-gray-100 focus:outline-none">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs text-gray-400 uppercase">Filtrar por vendedor</div>
                    {vendedores.map(vendedor => (
                      <button
                        key={vendedor}
                        onClick={() => {
                          setSelectedVendedor(vendedor);
                          setShowFilters(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {vendedor}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Clients Table */}
        {/* Contenedor de la tabla: se ajusta para que en móvil no tenga fondo y cada fila sea una tarjeta. */}
        <div className="bg-transparent md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100">
            <table className="w-full border-collapse">
              <thead className="hidden md:table-header-group">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
                      {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((cliente) => (
                    // En móvil, cada TR es una tarjeta. En escritorio, es una fila de tabla.
                    <tr key={cliente.id} className="block mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 md:table-row md:border-none md:shadow-none md:mb-0 md:hover:bg-gray-50 transition-colors duration-200">
                    
                    {/* Celda Cliente: Es la cabecera de la tarjeta en móvil */}
                    <td className="p-4 flex items-center border-b border-gray-200 md:border-b-0 md:table-cell md:px-6 md:py-4 md:whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {cliente.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{cliente.name}</div>
                          <div className="text-sm text-gray-500">ID: {cliente.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Celdas de datos: Usan data-label para mostrar el encabezado en móvil */}
                    <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 last:md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Contacto">
                      <div className="text-sm text-gray-900">{cliente.email}</div>
                      <div className="text-sm text-gray-500">{cliente.telefono}</div>
                    </td>
                    <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 last:md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Estado">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4 block md:table-cell text-right md:text-left relative before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Acciones">
                      <Link 
                        to={`/dashboard/clientes/${cliente.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Ver
                      </Link>
                      <button 
                        onClick={() => handleDeleteClient(cliente.id)}
                        disabled={deletingId === cliente.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === cliente.id ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : (
                          'Eliminar'
                        )}
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Clientes;