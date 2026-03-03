import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/shared';
import useSaleForm from '../hooks/useSaleForm';
import TransactionHeader from '../components/TransactionHeader';
import CreateSaleForm from '../components/CreateSaleForm';



interface CrearTransaccionProps {
  type: 'VENTA' | 'PRESTAMO';
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const CrearTransaccion = ({ type, user, onLogout }: CrearTransaccionProps) => {
  const navigate = useNavigate();

  const {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    errors,
    isSubmittingDisabled,
    productTypes,
    sellers,
    displayedClients,
  } = useSaleForm(type);

  const submitWrapper = async (e: React.FormEvent) => {
    // e.preventDefault();

    const ok = await handleSubmit(e);

    if(ok) {
      // alert('Transacción creada exitosamente');
      navigate('/dashboard/ventas/todas');
    }

  };

  return (
    <DashboardLayout title="Nueva Transacción" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <TransactionHeader />
        <CreateSaleForm
          formData={formData}
          setFormData={setFormData}
          handleInputChange={handleInputChange}
          errors={errors}
          isSubmittingDisabled={isSubmittingDisabled}
          productTypes={productTypes}
          sellers={sellers}
          displayedClients={displayedClients}
          onSubmit={submitWrapper}
        />
      </div>
    </DashboardLayout>
  );
};

export default CrearTransaccion;