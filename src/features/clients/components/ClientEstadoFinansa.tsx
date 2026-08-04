import { Banknote, CreditCard, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/shared/components/ui";

type ClientFinansaProps = {
  formatCurrency: (amount: number) => string;
  financialStats: {
    deudaVentas: number;
    ventasPagadas: number;
    deudaPrestamos: number;
    prestamosPagados: number;
  }
}

const ClientEstadoFinansa: React.FC<ClientFinansaProps> = ({ financialStats, formatCurrency }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        label="Deuda Ventas"
        value={formatCurrency(financialStats.deudaVentas)}
        icon={<CreditCard className="w-6 h-6" />}
        tone="danger"
      />

      <StatCard
        label="Ventas Pagadas"
        value={formatCurrency(financialStats.ventasPagadas)}
        icon={<DollarSign className="w-6 h-6" />}
        tone="success"
      />

      <StatCard
        label="Deuda Préstamos"
        value={formatCurrency(financialStats.deudaPrestamos)}
        icon={<Banknote className="w-6 h-6" />}
        tone="warning"
      />

      <StatCard
        label="Préstamos Pagados"
        value={formatCurrency(financialStats.prestamosPagados)}
        icon={<TrendingUp className="w-6 h-6" />}
        tone="brand"
      />
    </div>
  );
}

export default ClientEstadoFinansa;
