import React, { useState } from 'react';
import { Plus, ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashBoardLayout';

const CrearVenta: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cliente: '',
    tipo: 'Venta',
    monto: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Pendiente'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para crear la venta/préstamo
    console.log('Crear transacción:', formData);
    // Redirigir a la lista de ventas después de crear
    navigate('/dashboard/ventas');
  };

  return (
    <DashboardLayout title="Nueva Transacción">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/ventas"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <Plus className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nueva Transacción</h2>
              <p className="text-sm text-gray-500">Crear nueva venta o préstamo</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo */}
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Transacción *
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Venta">Venta</option>
                  <option value="Préstamo">Préstamo</option>
                </select>
              </div>

              {/* Cliente */}
              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <input
                  type="text"
                  id="cliente"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nombre del cliente"
                />
              </div>

              {/* Monto */}
              <div>
                <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-2">
                  Monto *
                </label>
                <input
                  type="number"
                  id="monto"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>

              {/* Fecha */}
              <div>
                <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descripción de la transacción..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to="/dashboard/ventas"
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                Crear Transacción
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CrearVenta;