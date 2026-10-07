import { Package } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import GestionCategorias from '@/features/catalogo/components/GestionCategorias';
import GestionProductos from '@/features/catalogo/components/GestionProductos';

interface ProductosProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const Productos: React.FC<ProductosProps> = ({ user, onLogout }) => (
  <DashboardLayout title="Productos" user={user} onLogout={onLogout}>
    <PageHeader
      eyebrow="Catálogo"
      title="Productos"
      subtitle="Tus categorías y productos, usados al crear ventas y como filtro."
      icon={<Package className="w-6 h-6 text-brand-600" />}
    />
    <div className="grid gap-6 lg:grid-cols-2">
      <GestionCategorias />
      <GestionProductos />
    </div>
  </DashboardLayout>
);

export default Productos;