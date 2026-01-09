import { Shield, Users, Settings, Database, AlertTriangle } from 'lucide-react';
import { Layout } from '@/shared';

interface AdminPanelProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const adminStats = [
    {
      name: 'Total Usuarios',
      value: '1,234',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      name: 'Configuraciones',
      value: '45',
      icon: Settings,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      name: 'Base de Datos',
      value: '99.9%',
      icon: Database,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      name: 'Alertas',
      value: '3',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  return (
    <Layout title="Panel de Administración" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Admin Welcome Section */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl p-8 text-white">
          <div className="flex items-center space-x-4">
            <Shield className="w-12 h-12 text-white" />
            <div>
              <h2 className="text-3xl font-bold mb-2">Panel de Administración</h2>
              <p className="text-red-100 text-lg">
                Control total del sistema y gestión de usuarios
              </p>
            </div>
          </div>
        </div>

        {/* Admin Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Management */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Usuarios</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Ver todos los usuarios</span>
                </div>
              </button>
              <button className="w-full text-left p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Gestionar permisos</span>
                </div>
              </button>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Configuración del Sistema</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Configuración general</span>
                </div>
              </button>
              <button className="w-full text-left p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Monitoreo de sistema</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Admin Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Acciones Recientes de Admin</h3>
          <div className="space-y-4">
            {[
              { action: 'Usuario creado: juan@ejemplo.com', time: 'Hace 5 min', type: 'success' },
              { action: 'Configuración actualizada: Seguridad', time: 'Hace 15 min', type: 'info' },
              { action: 'Alerta resuelta: Error de conexión', time: 'Hace 30 min', type: 'warning' },
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'success' ? 'bg-green-500' :
                  item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-gray-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;