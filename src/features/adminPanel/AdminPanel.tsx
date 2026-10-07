import { Shield, Users, Settings, Database, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import { StatCard, Card } from '@/shared/components/ui';
import type { StatTone } from '@/shared/components/ui';

interface AdminPanelProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const adminStats: {
    name: string;
    value: string;
    icon: typeof Users;
    tone: StatTone;
  }[] = [
    {
      name: 'Total Usuarios',
      value: '1,234',
      icon: Users,
      tone: 'brand',
    },
    {
      name: 'Configuraciones',
      value: '45',
      icon: Settings,
      tone: 'success',
    },
    {
      name: 'Base de Datos',
      value: '99.9%',
      icon: Database,
      tone: 'neutral',
    },
    {
      name: 'Alertas',
      value: '3',
      icon: AlertTriangle,
      tone: 'danger',
    },
  ];

  return (
    <DashboardLayout title="Panel de Administración" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="rounded-card bg-brand-950 p-8 text-white">
          <div className="flex items-center space-x-4">
            <Shield className="w-12 h-12 text-brand-300" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-300 mb-1">Administración</p>
              <h2 className="text-3xl font-display font-bold tracking-tight text-white mb-2">Panel de Administración</h2>
              <p className="text-brand-300 text-lg">
                Control total del sistema y gestión de usuarios
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminStats.map((stat) => (
            <StatCard
              key={stat.name}
              label={stat.name}
              value={stat.value}
              icon={<stat.icon className="w-6 h-6" />}
              tone={stat.tone}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Usuarios</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-brand-600" />
                  <span className="font-medium text-brand-900">Ver todos los usuarios</span>
                </div>
              </button>
              <button className="w-full text-left p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-900">Gestionar permisos</span>
                </div>
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Configuración del Sistema</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-brand-600" />
                  <span className="font-medium text-brand-900">Configuración general</span>
                </div>
              </button>
              <button className="w-full text-left p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Monitoreo de sistema</span>
                </div>
              </button>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Acciones Recientes de Admin</h3>
          <div className="space-y-4">
            {[
              { action: 'Usuario creado: juan@ejemplo.com', time: 'Hace 5 min', type: 'success' },
              { action: 'Configuración actualizada: Seguridad', time: 'Hace 15 min', type: 'info' },
              { action: 'Alerta resuelta: Error de conexión', time: 'Hace 30 min', type: 'warning' },
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.type === 'success'
                      ? 'bg-emerald-500'
                      : item.type === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-brand-500'
                  }`}
                ></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-gray-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;