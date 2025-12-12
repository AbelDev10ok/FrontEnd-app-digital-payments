import { Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";

const HeaderClientes = () => {
  return (
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

);
}

export default HeaderClientes;