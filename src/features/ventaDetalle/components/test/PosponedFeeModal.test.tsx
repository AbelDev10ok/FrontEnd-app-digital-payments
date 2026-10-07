import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostponeFeeModal from '../PosponedFeeModal';
import { salesService } from '@/features/ventas/services/salesServices';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: { postponeFee: vi.fn(), deleteFee: vi.fn() },
}));

const renderModal = (props: Partial<React.ComponentProps<typeof PostponeFeeModal>> = {}) => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();
  render(
    <PostponeFeeModal
      isOpen
      onClose={onClose}
      onSuccess={onSuccess}
      saleId={10}
      feeId={5}
      currentDate="2026-10-01"
      saleDate="2026-06-01"
      currentAmount={15000}
      maxAmount={45000}
      currentPaymentDate="2026-09-15"
      isPaid
      {...props}
    />,
  );
  return { onClose, onSuccess };
};

beforeEach(() => {
  vi.mocked(salesService.postponeFee).mockReset();
  vi.mocked(salesService.deleteFee).mockReset();
});

describe('PostponeFeeModal', () => {
  it('renderiza el título de edición cuando la cuota está pagada', () => {
    renderModal();
    expect(screen.getByText('Editar Cuota Pagada')).toBeInTheDocument();
    expect(screen.getByText('Monto de la Cuota')).toBeInTheDocument();
  });

  it('rechaza subir el monto por encima del saldo restante sin llamar al servicio', async () => {
    const user = userEvent.setup();
    const { onSuccess, onClose } = renderModal();

    // currentAmount=15000, maxAmount(remaining)=45000 -> monto válido límite 60000.
    // Subir a 70000 dejaría remaining negativo (70000-15000 > 45000).
    const montoInput = screen.getByRole('spinbutton');
    await user.clear(montoInput);
    await user.type(montoInput, '70000');
    await user.click(screen.getByRole('button', { name: 'Confirmar Cambio' }));

    expect(screen.getByText('El monto no puede superar el saldo restante de la venta')).toBeInTheDocument();
    expect(salesService.postponeFee).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('permite editar una cuota pagada dentro del saldo y confirma los cambios', async () => {
    const user = userEvent.setup();
    const { onSuccess, onClose } = renderModal();
    vi.mocked(salesService.postponeFee).mockResolvedValue(undefined);

    const montoInput = screen.getByRole('spinbutton');
    await user.clear(montoInput);
    await user.type(montoInput, '20000');
    await user.click(screen.getByRole('button', { name: 'Confirmar Cambio' }));

    await waitFor(() => expect(salesService.postponeFee).toHaveBeenCalledTimes(1));
    expect(salesService.postponeFee).toHaveBeenCalledWith(10, 5, '2026-10-01', 20000, expect.any(String));
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('no renderiza el campo de monto para una cuota impaga (solo pospone vencimiento)', () => {
    renderModal({ isPaid: false });
    expect(screen.getByText('Posponer Vencimiento')).toBeInTheDocument();
    expect(screen.queryByText('Monto de la Cuota')).not.toBeInTheDocument();
  });

  it('elimina la cuota tras confirmar, llamando al servicio y refrescando', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { onSuccess, onClose } = renderModal();
    vi.mocked(salesService.deleteFee).mockResolvedValue(undefined);

    await user.click(screen.getByRole('button', { name: /Eliminar/i }));

    await waitFor(() => expect(salesService.deleteFee).toHaveBeenCalledWith(5));
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('no elimina cuando el usuario cancela la confirmación', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { onSuccess } = renderModal();

    await user.click(screen.getByRole('button', { name: /Eliminar/i }));

    expect(salesService.deleteFee).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('muestra el error del backend al posponer y no confirma', async () => {
    const user = userEvent.setup();
    const { onSuccess, onClose } = renderModal();
    vi.mocked(salesService.postponeFee).mockRejectedValue(
      new Error('El monto supera el saldo restante'),
    );

    const montoInput = screen.getByRole('spinbutton');
    await user.clear(montoInput);
    await user.type(montoInput, '50000');
    await user.click(screen.getByRole('button', { name: 'Confirmar Cambio' }));

    await screen.findByText('El monto supera el saldo restante');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
