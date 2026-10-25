import { SaleResponseDto } from "@/shared/types/sales";
import { Ban, ArrowLeft, Pencil, Printer, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionsMenu, type ActionMenuItem } from "@/shared/components/ui";

interface HeaderDetalleTransactionProps {
    transaction: SaleResponseDto;
    onEdit: () => void;
    onDelete: () => void;
    onCancel?: () => void;
    /** Emite el remito o abre el ya emitido (solo ventas). */
    onPrintRemito?: () => void;
    canDelete?: boolean;
}

export default function HeaderDetalleTransaction({
    transaction,
    onEdit,
    onDelete,
    onCancel,
    onPrintRemito,
    canDelete = true,
}: HeaderDetalleTransactionProps) {
    const isCanceled = transaction.status === 'CANCELED';
    const esPrestamo = transaction.kind === 'PRESTAMO';

    // Mismo menú que la fila del listado: el detalle y la lista ofrecen las
    // mismas acciones y las reglas quedan en un solo lugar por pantalla.
    const acciones: ActionMenuItem[] = [
        { label: 'Editar', icon: Pencil, onSelect: onEdit },
        ...(transaction.kind === 'VENTA'
            && onPrintRemito
            && (!isCanceled || transaction.remito)
            ? [
                {
                    label: transaction.remito
                        ? `Ver remito N° ${transaction.remito.numberLabel}`
                        : 'Emitir remito',
                    icon: Printer,
                    tone: 'brand' as const,
                    onSelect: onPrintRemito,
                },
            ]
            : []),
        ...(!isCanceled && onCancel
            ? [
                {
                    label: `Anular ${esPrestamo ? 'préstamo' : 'venta'}`,
                    icon: Ban,
                    tone: 'warning' as const,
                    onSelect: onCancel,
                },
            ]
            : []),
        ...(canDelete
            ? [
                {
                    label: 'Eliminar',
                    icon: Trash2,
                    tone: 'danger' as const,
                    onSelect: onDelete,
                },
            ]
            : []),
    ];

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center space-x-3">
                <Link
                    to="/dashboard/ventas/todas"
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                {/* Quién y qué: en una app de cobros el nombre del cliente orienta
                    antes que el producto, y antes sólo aparecía dentro de los
                    detalles (plegados por defecto). */}
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{transaction.client.name}</p>
                    <p className="truncate text-sm text-gray-500">{transaction.descriptionProduct}</p>
                </div>
            </div>

            <div className="shrink-0">
                <ActionsMenu label="Opciones de la transacción" items={acciones} />
            </div>
        </div>
    );
}
