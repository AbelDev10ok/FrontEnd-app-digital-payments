import { Link } from "lucide-react";
import { Client } from "../../types/client"

type ClientTableProps = {
    clients: Client[];
    searchTerm?: string;
};

const ClientTable: React.FC<ClientTableProps> = ({ clients, searchTerm }) => {
  
  return (
          <>
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
                        Direccion
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 bg-white rounded-2xl shadow-sm">
                          {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
                        </td>
                      </tr>
                    ) : (
                      clients.map((cliente: Client) => (
                        <tr key={cliente.id} className="block mb-4 bg-white rounded-2xl shadow-sm border border-gray-200 md:table-row md:border-none md:shadow-none md:mb-0 md:hover:bg-gray-50 transition-colors duration-200">
                        
                        {/* Celda Cliente: Es la cabecera de la tarjeta en móvil */}
                        <td className="p-4 flex items-center border-b border-gray-200 md:border-b-0 md:table-cell md:px-6 md:py-4 md:whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {cliente.name.split(' ').map((n: string) => n[0]).join('')}
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
                            {cliente.direccion}
                          </span>
                        </td>
                        <td className="px-6 py-4 block md:table-cell text-right md:text-left relative before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Acciones">
                          <Link 
                            to={`/dashboard/clientes/${cliente.id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Ver Detalles
                          </Link>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
            </div>
        </>

    )
};

export default ClientTable;