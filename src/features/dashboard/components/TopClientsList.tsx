import { formatCurrency } from "@/shared/utils/formatCurrency";
import type { TopClient } from "@/shared/types/dashboard";

interface TopClientsListProps {
  clients: TopClient[];
}

const TopClientsList: React.FC<TopClientsListProps> = ({ clients }) => {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-gray-500">Aún no hay clientes con ventas.</p>
    );
  }

  return (
    <ul className="space-y-4">
      {clients.map((client, index) => (
        <li
          key={client.clientId}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold shrink-0">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {client.clientName}
              </p>
              <p className="text-xs text-gray-500">
                {client.totalVentas} ventas
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-gray-900 font-mono tabular-nums">
              {formatCurrency(client.totalVendido)}
            </p>
            <p className="text-xs text-gray-500 font-mono tabular-nums">
              Cobrado: {formatCurrency(client.totalCobrado)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TopClientsList;
