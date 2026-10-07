import { AlertTriangle } from "lucide-react";
import { Card } from "@/shared/components/ui";
import { formatCurrency } from "@/shared/utils/formatCurrency";

interface OverdueFeesAlertProps {
  cantidad: number;
  monto: number;
}

const OverdueFeesAlert: React.FC<OverdueFeesAlertProps> = ({ cantidad, monto }) => {
  if (cantidad <= 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-red-50 border-red-200">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-red-900">
            {cantidad} {cantidad === 1 ? "cuota vencida" : "cuotas vencidas"}
          </p>
          <p className="text-sm text-red-700">
            Monto total por cobrar: {formatCurrency(monto)}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default OverdueFeesAlert;
