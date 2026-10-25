import { SaleResponseDto } from "@/shared/types/sales";
import { Ban, ArrowLeft, MoreVertical, Pencil, Printer, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isCanceled = transaction.status === 'CANCELED';
    const closeMenu = () => setIsMenuOpen(false);

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

            <div className="relative shrink-0">
                <button
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
                    aria-label="Opciones de la transacción"
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-card shadow-card z-10 border border-gray-100">
                        <ul className="py-1">
                            <li>
                                <button
                                    onClick={() => { closeMenu(); onEdit(); }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                </button>
                            </li>
                            {transaction.kind === 'VENTA'
                                && onPrintRemito
                                && (!isCanceled || transaction.remito) && (
                                <li>
                                    <button
                                        onClick={() => { closeMenu(); onPrintRemito(); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-brand-700 hover:bg-gray-50"
                                    >
                                        <Printer className="w-4 h-4 mr-2" />
                                        {transaction.remito
                                            ? `Ver remito N° ${transaction.remito.numberLabel}`
                                            : 'Emitir remito'}
                                    </button>
                                </li>
                            )}
                            {!isCanceled && onCancel && (
                                <li>
                                    <button
                                        onClick={() => { closeMenu(); onCancel(); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-amber-600 hover:bg-gray-50"
                                    >
                                        <Ban className="w-4 h-4 mr-2" />
                                        Anular venta
                                    </button>
                                </li>
                            )}
                            {canDelete && (
                                <li>
                                    <button
                                        onClick={() => { closeMenu(); onDelete(); }}
                                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Eliminar
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}