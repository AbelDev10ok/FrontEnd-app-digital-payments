import { Client } from "@/shared/types/client";
import { Link } from "react-router-dom";
import { eyebrow, neutral, neutralBg, tones } from "@/shared/theme";
import { CheckCircle2, AlertTriangle } from "lucide-react";


type ClientTableProps = {
    clients: Client[];
    searchTerm?: string;
};

const ClientTable: React.FC<ClientTableProps> = ({ clients, searchTerm }) => {
  
  return (
          <>
            <div className="bg-transparent md:bg-white md:rounded-card md:shadow-card md:border md:border-gray-100">
                <table className="w-full border-collapse">
                  <thead className="hidden md:table-header-group">
                    <tr className={neutralBg.tableHeader}>
                      <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                        Cliente
                      </th>
                      <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                        Contacto
                      </th>
                      <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                        Dirección
                      </th>
                      <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                        Acciones
                      </th>
                      <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`px-6 py-8 text-center ${neutral.muted} bg-white rounded-card shadow-card`}>
                          {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
                        </td>
                      </tr>
                    ) : (
                      clients.map((cliente: Client) => (
                        <tr key={cliente.id} className="block mb-4 bg-white rounded-card shadow-card border border-gray-200 md:table-row md:border-none md:shadow-none md:mb-0 md:hover:bg-gray-50/60 transition-colors duration-200">
                        
                        {/* Celda Cliente: Es la cabecera de la tarjeta en móvil */}
                        <td className="p-4 flex items-center border-b border-gray-200 md:border-b-0 md:table-cell md:px-6 md:py-4 md:whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-brand-600 shadow-sm rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {cliente.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-medium ${neutral.primary}`}>{cliente.name}</div>
                              <div className={`text-sm ${neutral.muted}`}>ID: {cliente.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Celdas de datos: Usan data-label para mostrar el encabezado en móvil */}
                        <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 last:md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Contacto">
                          <div className={`text-sm ${neutral.primary}`}>{cliente.email}</div>
                          <div className={`text-sm ${neutral.muted}`}>{cliente.telefono}</div>
                        </td>
                        <td className="px-6 py-4 block md:table-cell text-right md:text-left relative border-b border-gray-200 md:border-b-0 last:md:border-b-0 before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Dirección">
                          <div className={`text-sm ${neutral.primary}`}>{cliente.direccion}</div>
                        </td>
                        <td className="px-6 py-4 block md:table-cell text-right md:text-left relative before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Acciones">
                          <Link 
                            to={`/dashboard/clientes/${cliente.id}`}
                            className={`${tones.brand.text} hover:text-brand-900 mr-4`}
                          >
                            Ver Detalles
                          </Link>
                        </td>
                        <td className="px-6 py-4 block md:table-cell text-right md:text-left relative before:content-[attr(data-label)] before:absolute before:left-6 before:text-sm before:font-bold before:text-gray-500 md:before:content-none" data-label="Estado">
                          {cliente.deudaTotal && cliente.deudaTotal > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Con deuda
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Al día
                            </span>
                          )}
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