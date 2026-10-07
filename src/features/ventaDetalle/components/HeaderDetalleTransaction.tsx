import { SaleResponseDto } from "@/shared/types/sales";
import { Ban, ArrowLeft, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface HeaderDetalleTransactionProps {
    transaction: SaleResponseDto;
    onEdit: () => void;
    onDelete: () => void;
    onCancel?: () => void;
    canDelete?: boolean;
}

export default function HeaderDetalleTransaction({
    transaction,
    onEdit,
    onDelete,
    onCancel,
    canDelete = true,
}: HeaderDetalleTransactionProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isCanceled = transaction.status === 'CANCELED';
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <Link
                    to="/dashboard/ventas/todas"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <p className="text-sm text-gray-500">{transaction.descriptionProduct}</p>
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
                    aria-label="Opciones de la transacción"
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-card z-10 border border-gray-100">
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