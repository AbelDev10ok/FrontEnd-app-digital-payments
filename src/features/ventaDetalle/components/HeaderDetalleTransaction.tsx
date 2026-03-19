import { SaleResponseDto } from "@/types/sales";
import { ArrowLeft, Package, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface HeaderDetalleTransactionProps {
    transaction: SaleResponseDto;
    isLoan: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

export default function HeaderDetalleTransaction({ transaction, isLoan, onEdit, onDelete }: HeaderDetalleTransactionProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <Link
                    to="/dashboard/ventas"
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                        {isLoan ? 'Préstamo' : 'Venta'} #{transaction.id}
                    </h2>
                    <p className="text-sm text-gray-500">{transaction.descriptionProduct}</p>
                </div>
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <ul className="py-1">
                            <li>
                                <button
                                    onClick={onEdit}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={onDelete}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}