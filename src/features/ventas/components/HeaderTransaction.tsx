import { Plus, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, PageHeader } from "@/shared/components/ui";

export default function HeaderTransaction({ title }: { title: string }) {
    return (
        <PageHeader
            title={title}
            subtitle="Gestión completa de ventas"
            icon={<ShoppingCart className="w-6 h-6 text-brand-600" />}
            actions={
                <Link to="/dashboard/ventas/crear">
                    <Button leftIcon={<Plus className="w-4 h-4" />}>Crear Venta</Button>
                </Link>
            }
        />
    );
}
