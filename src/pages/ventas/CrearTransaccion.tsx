import React, { useEffect, useState } from 'react';
import { Plus, ArrowLeft, Save, Tv, Watch, Sofa } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { CreateSaleRequest, salesService } from '../../services/salesServices';
import { useClients } from '../../hooks/useClients';
import { ProductTypeDto } from '../../services/salesServices';

interface CrearTransaccionProps {
  type: 'VENTA' | 'PRESTAMO';
}



const CrearTransaccion = ({type}:CrearTransaccionProps) => {
  const { clients} = useClients();

  const [clientSearch, setClientSearch] = useState('');
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filtra clientes por nombre
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cliente: 0, // ID del cliente
    tipo: type, // "Venta" o "Préstamo"
    descripcion: type === 'PRESTAMO' ? 'Préstamo personal' : '',
    fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
    payments: 'SEMANAL', // "SEMANAL", "MENSUAL", "QUINCENAL", "CONTADO"
    quantityFees: 1,
    amountFee: '',
    cost: '',
    productCategory: type === 'PRESTAMO' ? 'PRESTAMO' : '', // "SMART TV", "RELOJ", "MUEBLE"
    productTypeId: '', // id del tipo de producto seleccionado

  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Construir el objeto SaleRequestDto
    console.log("valor de cuuota" + formData.amountFee)
    const saleRequest: CreateSaleRequest = {
      clientId: Number(formData.cliente), // Debe ser el ID del cliente
      descriptionProduct: formData.descripcion,
      payments: formData.payments as 'SEMANAL' | 'MENSUAL' | 'QUINCENAL' | 'CONTADO',
      quantityFees: Number(formData.quantityFees),
      amountFee: Number(formData.amountFee),
      cost: Number(formData.cost),
      productType: Number(formData.productTypeId), // solo el id
      dateSale: formData.fecha,
      // Puedes agregar otros campos opcionales aquí si los necesitas
    };

    try {
      // Aquí deberías llamar a tu servicio para crear la venta
      console.log('Sale Request:', saleRequest);  
      await salesService.createSale(saleRequest);
      console.log('Crear transacción:', saleRequest);
      navigate('/dashboard/ventas');
    } catch (err) {
      // Manejo de error
      console.error(err);
  }
  };

  useEffect(() => {
    // obtenemos los tipos de productos al cargar el componente
    const fetchProductTypes = async () => {
      try {
        const productTypes = await salesService.getProductTypes();
        setProductTypes(productTypes);
        console.log('Tipos de productos:', productTypes);
      } catch (error) {
        console.error('Error al obtener los tipos de productos:', error);
      }
    };
    fetchProductTypes();
  }, []);

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
              <p className="text-sm text-gray-500">Crear nueva venta</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de producto */}
              <div>
                <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de producto *
                </label>
                <select
                  id="productTypeId"
                  name="productTypeId"
                  value={formData.productTypeId}
                  onChange={e => setFormData(prev => ({ ...prev, productTypeId: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecciona un tipo</option>
                  {productTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {/* Icono dinámico según selección */}
                <div className="mt-2 min-h-[28px]">
                  {formData.productCategory === 'SMART TV' && <Tv className="inline w-6 h-6 text-indigo-500" />}
                  {formData.productCategory === 'RELOJ' && <Watch className="inline w-6 h-6 text-indigo-500" />}
                  {formData.productCategory === 'MUEBLE' && <Sofa className="inline w-6 h-6 text-indigo-500" />}
                </div>
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
                  value={clientSearch}
                  onChange={e => {
                    setClientSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Buscar cliente por nombre"
                  autoComplete="off"
                />
                {showDropdown && filteredClients.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-200 rounded-xl mt-1 w-full max-h-40 overflow-y-auto">
                    {filteredClients.map(client => (
                      <li
                        key={client.id}
                        className="px-4 py-2 cursor-pointer hover:bg-indigo-100"
                        onMouseDown={() => {
                          setFormData(prev => ({ ...prev, cliente: client.id }));
                          setClientSearch(client.name);
                          setShowDropdown(false);
                        }}
                      >
                        {client.name}
                      </li>
                    ))}
                  </ul>
                )}
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
              {/* Tipo de pago */}
              <div>
                <label htmlFor="payments" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de pago *
                </label>
                <select
                  id="payments"
                  name="payments"
                  value={formData.payments}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  defaultValue={formData.payments}
                >
                  <option value="SEMANAL">Semanal</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                  <option value="CONTADO">Contado</option>
                </select>
              </div>
              {/* Cantidad de cuotas */}
              <div>
                <label htmlFor="quantityFees" className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad de cuotas *
                </label>
                <input
                  type="number"
                  id="quantityFees"
                  name="quantityFees"
                  value={formData.quantityFees}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej: 12"
                />
              </div>
              {/* Valor de la cuota */}
              <div>
                <label htmlFor="amountFee" className="block text-sm font-medium text-gray-700 mb-2">
                  Valor de la cuota *
                </label>
                <input
                  type="number"
                  id="amountFee"
                  name="amountFee"
                  value={formData.amountFee}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>

              {/* Costo */}
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
                  Costo *
                </label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de producto *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows={2}
                className="w-1/3 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Tv samsung 32'..."
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

export default CrearTransaccion;