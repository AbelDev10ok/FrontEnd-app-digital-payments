import { DollarSign, CreditCard, CheckCircle, Hash, TrendingUp, Receipt } from 'lucide-react';
import type { SaleResponseDto } from '@/shared/types/sales';
import { StatCard } from '@/shared/components/ui';

interface InfoDetalleTransactionProps {
    transaction: SaleResponseDto
    formatCurrency: (amount: number) => string;
    /** Si false, en móvil sólo quedan los dos números de la cobranza (total y
     *  pendiente) y el resto se lee desde "Ver detalles". Desde `sm` se ve todo. */
    showDetails?: boolean;
}

export default function StateDetalleTransaction({transaction, formatCurrency, showDetails = true}: InfoDetalleTransactionProps) {
    const profit = transaction.priceTotal - transaction.cost;
    const isLoan = transaction.kind === 'PRESTAMO';
    const interest = transaction.interestRate != null && transaction.cost > 0
        ? (transaction.priceTotal - transaction.cost)
        : 0;

    if (transaction.status === 'CANCELED') {
        const collectedAmount = transaction.collectedAmount ?? 0;
        const refundAmount = transaction.refundAmount ?? 0;
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    label="Monto Total"
                    value={formatCurrency(transaction.priceTotal)}
                    icon={<DollarSign className="w-6 h-6" />}
                    tone="brand"
                />

                <StatCard
                    label="Cobrado antes de anular"
                    value={formatCurrency(collectedAmount)}
                    icon={<CreditCard className="w-6 h-6" />}
                    tone="brand"
                />

                {refundAmount > 0 ? (
                    <StatCard
                        label="A devolver al cliente"
                        value={formatCurrency(refundAmount)}
                        icon={<TrendingUp className="w-6 h-6" />}
                        tone="warning"
                    />
                ) : (
                    <StatCard
                        label="Monto conservado"
                        value={formatCurrency(collectedAmount)}
                        icon={<TrendingUp className="w-6 h-6" />}
                        tone="success"
                    />
                )}

                <StatCard
                    label="Deuda Pendiente"
                    value={formatCurrency(0)}
                    icon={<Receipt className="w-6 h-6" />}
                    tone="neutral"
                />

                <StatCard
                    label="Cuotas Acordadas"
                    value={transaction.quantityFees}
                    icon={<Hash className="w-6 h-6" />}
                    tone="brand"
                />

                <StatCard
                    label="Cuotas Pagadas"
                    value={transaction.paidFeesCount}
                    icon={<CheckCircle className="w-6 h-6" />}
                    tone="success"
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
                label="Monto Total"
                value={formatCurrency(transaction.priceTotal)}
                icon={<DollarSign className="w-6 h-6" />}
                tone="brand"
            />

            <StatCard
                label="Monto Pendiente"
                value={formatCurrency(transaction.remainingAmount)}
                icon={<CreditCard className="w-6 h-6" />}
                tone="warning"
            />

            {/* En móvil estos datos acompañan, no encabezan: el cronograma (y el
                botón Cobrar) tienen que quedar cerca. `contents` mantiene la
                grilla intacta cuando se muestran. */}
            <div className={showDetails ? "contents" : "hidden sm:contents"}>
                <StatCard
                    label="Ganancia Esperada"
                    value={formatCurrency(profit)}
                    icon={<TrendingUp className="w-6 h-6" />}
                    tone="success"
                />

                {isLoan && (
                    <StatCard
                        label="Interés"
                        value={transaction.interestRate != null ? `${transaction.interestRate}% (${formatCurrency(interest)})` : '—'}
                        icon={<TrendingUp className="w-6 h-6" />}
                        tone="brand"
                    />
                )}

                <StatCard
                    label="Cuotas Acordadas"
                    value={transaction.quantityFees}
                    icon={<Hash className="w-6 h-6" />}
                    tone="brand"
                />

                <StatCard
                    label="Cuotas Pagadas"
                    value={transaction.paidFeesCount}
                    icon={<CheckCircle className="w-6 h-6" />}
                    tone="success"
                />

                <StatCard
                    label={isLoan ? "Monto Entregado" : "Costo"}
                    value={formatCurrency(transaction.cost)}
                    icon={<Receipt className="w-6 h-6" />}
                    tone="neutral"
                />
            </div>
        </div>
    );
}
