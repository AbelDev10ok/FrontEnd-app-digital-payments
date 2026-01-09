import { Plus, ShoppingCart} from "lucide-react";
import { Link } from "react-router-dom";

export default function HeaderTransaction({title}: {title: string}) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">Gestión completa de ventas</p>
            </div>
          </div>
          
          <Link
            to="/dashboard/ventas/crear"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Venta
          </Link>
        </div>
    );
}