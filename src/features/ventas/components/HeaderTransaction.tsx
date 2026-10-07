import { Plus, ShoppingCart, HandCoins } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, PageHeader } from "@/shared/components/ui";

interface HeaderTransactionProps {
  title?: string;
  isLoan?: boolean;
}

export default function HeaderTransaction({ title, isLoan = false }: HeaderTransactionProps) {
    return (
        <PageHeader
            title={title}
            subtitle={isLoan ? "Gestión completa de préstamos" : "Gestión completa de ventas"}
            icon={isLoan
                ? <HandCoins className="w-6 h-6 text-brand-600" />
                : <ShoppingCart className="w-6 h-6 text-brand-600" />
            }
            actions={
                <Link to={isLoan ? "/dashboard/prestamos/crear" : "/dashboard/ventas/crear"}>
                    <Button leftIcon={<Plus className="w-4 h-4" />}>
                        {isLoan ? "Nuevo Préstamo" : "Crear Venta"}
                    </Button>
                </Link>
            }
        />
    );
}
