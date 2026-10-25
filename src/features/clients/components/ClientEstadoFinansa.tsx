import { Banknote, CreditCard, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/shared/components/ui";
import type { MontosPorMoneda } from "@/shared/types/money";

type ClientFinansaProps = {
  /** Formatea montos por moneda sin sumar monedas distintas */
  formatMoney: (montos: MontosPorMoneda) => string;
  financialStats: {
    deudaVentas: MontosPorMoneda;
    ventasPagadas: MontosPorMoneda;
    deudaPrestamos: MontosPorMoneda;
    prestamosPagados: MontosPorMoneda;
  }
}

const ClientEstadoFinansa: React.FC<ClientFinansaProps> = ({ financialStats, formatMoney }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        label="Deuda Ventas"
        value={formatMoney(financialStats.deudaVentas)}
        icon={<CreditCard className="w-6 h-6" />}
        tone="danger"
      />

      <StatCard
        label="Ventas Pagadas"
        value={formatMoney(financialStats.ventasPagadas)}
        icon={<DollarSign className="w-6 h-6" />}
        tone="success"
      />

      <StatCard
        label="Deuda Préstamos"
        value={formatMoney(financialStats.deudaPrestamos)}
        icon={<Banknote className="w-6 h-6" />}
        tone="warning"
      />

      <StatCard
        label="Préstamos Pagados"
        value={formatMoney(financialStats.prestamosPagados)}
        icon={<TrendingUp className="w-6 h-6" />}
        tone="brand"
      />
    </div>
  );
}

export default ClientEstadoFinansa;
