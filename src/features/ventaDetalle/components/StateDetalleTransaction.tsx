import { DollarSign, CreditCard, CheckCircle, Hash, TrendingUp, Receipt } from 'lucide-react';
import type { SaleResponseDto } from '@/shared/types/sales';
import { StatCard } from '@/shared/components/ui';

interface InfoDetalleTransactionProps {
    transaction: SaleResponseDto
    formatCurrency: (amount: number) => string;
}

export default function StateDetalleTransaction({transaction, formatCurrency}: InfoDetalleTransactionProps) {
    const profit = transaction.priceTotal - transaction.cost;

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

            <StatCard
                label="Ganancia Esperada"
                value={formatCurrency(profit)}
                icon={<TrendingUp className="w-6 h-6" />}
                tone="success"
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

            <StatCard
                label="Costo"
                value={formatCurrency(transaction.cost)}
                icon={<Receipt className="w-6 h-6" />}
                tone="neutral"
            />
        </div>
    );
}
