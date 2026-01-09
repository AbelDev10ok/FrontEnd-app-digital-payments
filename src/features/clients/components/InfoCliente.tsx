import { Client } from "@/types/client"
import { Mail, MapPin, Phone, TrendingUp, User2 } from "lucide-react"

type InfoClienteProps = {
  client: Client
}


const InfoCliente: React.FC<InfoClienteProps> = ({ client }) => {
  return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{client.email || 'No especificado'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{client.telefono}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 md:col-span-2">
              <div className="bg-orange-50 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900">{client.direccion || 'No especificada'}</p>
              </div>
            </div>

            {/* si es cliente tiene vendedor */}
            {client.sellerId && (
              <div className="md:col-span-2 flex items-center space-x-4 bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800">Este cliente tiene un vendedor asignado</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <User2 className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-gray-600">{client.sellerName}</p>
                  </div>
                </div>
              </div>
            )}


            {/* si es vendedor */}
            {client.vendedor && (
              <div className="md:col-span-2 flex items-center space-x-4 bg-teal-50 border border-teal-200 p-4 rounded-xl">
                <div className="bg-teal-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <p className="font-semibold text-teal-800">Este cliente también es vendedor</p>
                  <p className="text-sm text-gray-600">Tiene acceso a funciones de venta en la plataforma.</p>
                </div>
              </div>
            )}

          </div>
        </div>
 

    )
}

export default InfoCliente