import { AlertTriangle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { formatMoneyByCurrency } from "@/shared/utils/formatCurrency";
import type { MontosPorMoneda } from "@/shared/types/money";

interface OverdueFeesAlertProps {
  cantidad: number;
  /** Montos por moneda: las monedas distintas nunca se suman entre sí */
  monto: MontosPorMoneda;
}

/**
 * Alerta de cuotas vencidas. Es un enlace a la lista de Cuotas filtrada en
 * «Vencidas»: la alerta avisa y además lleva a resolverlas.
 */
const OverdueFeesAlert: React.FC<OverdueFeesAlertProps> = ({ cantidad, monto }) => {
  if (cantidad <= 0) {
    return null;
  }

  return (
    <Link
      to="/dashboard/cuotas?estado=DELAYED"
      className="block rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
    >
      <Card className="p-4 bg-red-50 border-red-200 transition-colors duration-150 hover:bg-red-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-red-900">
              {cantidad} {cantidad === 1 ? "cuota vencida" : "cuotas vencidas"}
            </p>
            <p className="text-sm text-red-700">
              Monto total por cobrar: {formatMoneyByCurrency(monto)}
              <span className="sr-only"> Ver cuotas vencidas</span>
            </p>
          </div>
          <ChevronRight
            aria-hidden="true"
            className="w-5 h-5 text-red-400 shrink-0 ml-auto mt-0.5"
          />
        </div>
      </Card>
    </Link>
  );
};

export default OverdueFeesAlert;
