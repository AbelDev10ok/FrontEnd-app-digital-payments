import { Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { memo } from "react";
import { Button, PageHeader } from "@/shared/components/ui";

const HeaderClientes = () => {
  return (
    <PageHeader
      title="Lista de Clientes"
      subtitle="Gestiona todos tus clientes"
      icon={<Users className="w-6 h-6 text-brand-600" />}
      actions={
        <Link to="/dashboard/clientes/crear">
          <Button leftIcon={<Plus className="w-4 h-4" />}>Nuevo Cliente</Button>
        </Link>
      }
    />
  );
}

export default memo(HeaderClientes);
