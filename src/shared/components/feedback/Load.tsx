import { Loader2 } from "lucide-react";

export default function Load({message}: {message?: string}) {
  return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">{message || 'Cargando...'}</span>
          </div>
        </div>
  );
}
