import { useState } from "react";
import PayFeeModal from "@/features/cobros/components/PayFeeModal";
import PostponeFeeModal from "@/features/ventaDetalle/components/PosponedFeeModal";
import type { SaleResponseDto, FeeDto } from "@/shared/types/sales";
import type { CuotaItem } from "@/shared/types/business";
import { Button } from "@/shared/components/ui";
import { tones, neutral, neutralBg } from "@/shared/theme";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  HandCoins,
  Pencil,
  Banknote,
  Building2,
} from "lucide-react";
import { getFeeListStates, type FeeVisualState } from "../utils/feeVisualState";

interface CronogramaFeesProps {
  transaction: SaleResponseDto;
  formatDate: (amount: string) => string;
  formatCurrency: (amount: number) => string;
  refreshTransaction: () => Promise<void>;
}

const STATE_CONFIG: Record<
  FeeVisualState,
  {
    label: string;
    badge: string;
    iconClass: string;
    Icon: typeof CheckCircle2;
    row?: string;
  }
> = {
  pagada: {
    label: "Pagada",
    badge: `${tones.success.bg} ${tones.success.text}`,
    iconClass: tones.success.icon,
    Icon: CheckCircle2,
  },
  vencida: {
    label: "Vencida",
    badge: `${tones.danger.bg} ${tones.danger.text}`,
    iconClass: tones.danger.icon,
    row: `${tones.danger.bg}/70 -mx-3 px-3 rounded-lg`,
    Icon: AlertTriangle,
  },
  proxima: {
    label: "Próxima",
    badge: `${tones.warning.bg} ${tones.warning.text}`,
    iconClass: tones.warning.icon,
    Icon: CircleDashed,
  },
};

export default function CronogramaFees({
  transaction,
  formatDate,
  formatCurrency,
  refreshTransaction,
}: CronogramaFeesProps) {
  const [cuotaACobrar, setCuotaACobrar] = useState<CuotaItem | null>(null);
  const [editingFee, setEditingFee] = useState<{
    id: number;
    date: string;
    amount: number;
    paymentDate?: string;
    isPaid: boolean;
  } | null>(null);

  const estados = getFeeListStates(transaction.fees);

  const feeToCuota = (fee: FeeDto): CuotaItem =>
    ({
      id: fee.id,
      saleId: transaction.id,
      clientId: transaction.client.id,
      clientName: transaction.client.name,
      saleDescription: transaction.descriptionProduct,
      numeroCuota: fee.numberFee,
      monto: transaction.amountFee,
      fechaVencimiento: fee.expirationDate,
      pagada: fee.paid,
      diasAtraso: 0,
      estado: "UPCOMING",
    }) as const;

  // ----- Datos de la barra de progreso -----
  const cobrado = Math.max(
    transaction.priceTotal - transaction.remainingAmount,
    0,
  );
  const porcentaje =
    transaction.priceTotal > 0
      ? Math.min(Math.round((cobrado / transaction.priceTotal) * 100), 100)
      : 0;

  return (
    <section>
      {transaction.fees.length > 0 && (
        <div className="bg-white rounded-card p-6 shadow-card">
          {/* Progreso de cobro */}
          <div className="mb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-display text-lg font-bold tracking-tight text-brand-950">
                Cronograma de cuotas
              </h3>
              <p
                className={`font-mono text-sm tabular-nums ${neutral.primary}`}
              >
                Cobrado {formatCurrency(cobrado)} de{" "}
                {formatCurrency(transaction.priceTotal)}
              </p>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={porcentaje}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de cobro"
            >
              <div
                className={`h-full rounded-full ${tones.brand.accent}`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <p className={`mt-1.5 text-xs ${neutral.muted}`}>
              {transaction.paidFeesCount} cuotas cobradas
            </p>
          </div>

          {/* Lista estilo ticket */}
          <ul className="divide-y divide-dashed divide-gray-200 border-t border-dashed border-t-gray-300">
            {transaction.fees.map((fee, index) => {
              const estado = estados[index];
              const config = STATE_CONFIG[estado];
              const { Icon } = config;
              return (
                <li key={fee.id} className={`py-3.5 ${config.row ?? ""}`}>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 shrink-0 ${config.iconClass}`}
                      aria-hidden="true"
                    />
                    <span className={`text-sm font-medium ${neutral.primary}`}>
                      Cuota {fee.numberFee}
                    </span>
                    <span
                      className={`hidden font-mono text-xs ${neutral.subtle} sm:inline`}
                    >
                      {formatDate(fee.expirationDate)}
                    </span>

                    <div className="ml-auto flex items-center gap-2">
                      <span
                        className={`font-mono text-sm tabular-nums ${neutral.primary}`}
                      >
                        {isNaN(fee.amount)
                          ? "-"
                          : formatCurrency(fee.amount || 0)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badge}`}
                      >
                        {config.label}
                      </span>
                      {!fee.paid && (
                        <Button
                          size="sm"
                          leftIcon={<HandCoins className="w-4 h-4" />}
                          onClick={() => setCuotaACobrar(feeToCuota(fee))}
                        >
                          Cobrar
                        </Button>
                      )}
                      <button
                        onClick={() =>
                          setEditingFee({
                            id: fee.id,
                            date: fee.expirationDate,
                            amount: fee.amount,
                            paymentDate: fee.paymentDate,
                            isPaid: fee.paid,
                          })
                        }
                        aria-label={`Posponer cuota ${fee.numberFee}`}
                        title="Posponer vencimiento"
                        className={`rounded-lg p-2 ${neutral.muted} transition-colors ${neutralBg.hover} hover:text-brand-600`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Información de pago */}
                  {fee.paid && (
                    <p
                      className={`mt-1 pl-8 text-xs flex justify-start   ${tones.success.text}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        {fee.paymentMethod === "TRANSFERENCIA" ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : (
                          <Banknote className="w-3.5 h-3.5" />
                        )}
                        {fee.paymentMethod === "TRANSFERENCIA"
                          ? "Transferencia"
                          : "Efectivo"}
                      </span>
                      {fee.paidAmount != null && fee.paidAmount !== fee.amount
                        ? ` · Pagado ${formatCurrency(fee.paidAmount)}`
                        : ""}
                      {fee.paymentDate
                        ? ` el ${formatDate(fee.paymentDate)}`
                        : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <PayFeeModal
            cuota={cuotaACobrar}
            onClose={() => setCuotaACobrar(null)}
            onPaid={refreshTransaction}
            deudaRestante={transaction.remainingAmount}
            fechaMinima={transaction.dateSale}
          />
          {editingFee && (
            <PostponeFeeModal
              isOpen={true}
              onClose={() => setEditingFee(null)}
              onSuccess={() => {
                refreshTransaction();
                setEditingFee(null);
              }}
              saleId={transaction.id}
              feeId={editingFee.id}
              currentDate={editingFee.date}
              saleDate={transaction.dateSale}
              currentAmount={editingFee.amount}
              maxAmount={transaction.remainingAmount}
              currentPaymentDate={editingFee.paymentDate}
              isPaid={editingFee.isPaid}
            />
          )}
        </div>
      )}
    </section>
  );
}
