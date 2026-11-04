import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostponeFeeModal from '../PosponedFeeModal';
import { salesService } from '@/features/ventas/services/salesServices';
import { useSalesCountsStore } from '@/features/ventas/store/salesCountsStore';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: { postponeFee: vi.fn(), reprogramFee: vi.fn() },
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
  vi.mocked(salesService.reprogramFee).mockReset();
});

describe('PostponeFeeModal', () => {
  it('renderiza el título de edición cuando la cuota está pagada', () => {
    renderModal();
    expect(screen.getByText('Editar Cuota Pagada')).toBeInTheDocument();
    expect(screen.getByText('Monto de la Cuota')).toBeInTheDocument();
  });

  it('muestra el símbolo de la moneda de la venta en el monto', () => {
    renderModal({ currency: 'USD' });

    const montoInput = screen.getByRole('spinbutton');
    expect(montoInput.parentElement?.querySelector('span')?.textContent).toBe('US$');
  });

  it('muestra $ cuando la venta está en pesos', () => {
    renderModal({ currency: 'ARS' });

    const montoInput = screen.getByRole('spinbutton');
    expect(montoInput.parentElement?.querySelector('span')?.textContent).toBe('$');
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

    const tokenAntes = useSalesCountsStore.getState().refreshToken;
    const montoInput = screen.getByRole('spinbutton');
    await user.clear(montoInput);
    await user.type(montoInput, '20000');
    await user.click(screen.getByRole('button', { name: 'Confirmar Cambio' }));

    await waitFor(() => expect(salesService.postponeFee).toHaveBeenCalledTimes(1));
    expect(salesService.postponeFee).toHaveBeenCalledWith(10, 5, '2026-10-01', 20000, expect.any(String));
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    // Editar el monto de una cuota cobrada mueve los conteos del menú
    expect(useSalesCountsStore.getState().refreshToken).toBeGreaterThan(tokenAntes);
  });

  it('no renderiza el campo de monto para una cuota impaga (solo pospone vencimiento)', () => {
    renderModal({ isPaid: false });
    expect(screen.getByText('Posponer Vencimiento')).toBeInTheDocument();
    expect(screen.queryByText('Monto de la Cuota')).not.toBeInTheDocument();
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

  // ----- Cuota impaga: alcance de la edición (S13b) -----

  it('no muestra el selector de alcance en una cuota cobrada', () => {
    renderModal();
    expect(screen.queryByLabelText('Alcance')).not.toBeInTheDocument();
  });

  it('sin impagas posteriores arranca en "Sólo esta" y pospone la fecha como siempre', async () => {
    const user = userEvent.setup();
    const { onSuccess, onClose } = renderModal({
      isPaid: false,
      currentPaymentDate: undefined,
      hasLaterUnpaidFees: false,
    });
    vi.mocked(salesService.postponeFee).mockResolvedValue(undefined);

    expect(screen.getByLabelText('Alcance')).toHaveValue('SOLO_ESTA');

    await user.click(screen.getByRole('button', { name: 'Confirmar Cambio' }));

    await waitFor(() => expect(salesService.postponeFee).toHaveBeenCalledTimes(1));
    expect(salesService.postponeFee).toHaveBeenCalledWith(10, 5, '2026-10-01', 15000, undefined);
    expect(salesService.reprogramFee).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('con impagas posteriores arranca en "Esta y las siguientes" y reprograma con el delta en días', async () => {
    const user = userEvent.setup();
    const { onSuccess, onClose } = renderModal({
      isPaid: false,
      currentPaymentDate: undefined,
      hasLaterUnpaidFees: true,
    });
    vi.mocked(salesService.reprogramFee).mockResolvedValue(undefined);

    expect(screen.getByLabelText('Alcance')).toHaveValue('SIGUIENTES');

    // 2026-10-11 - 2026-10-01 = 10 días
    fireEvent.change(screen.getByLabelText('Fecha de Vencimiento'), {
      target: { value: '2026-10-11' },
    });
    await user.click(screen.getByRole('button', { name: 'Confirmar Cambio' }));

    await waitFor(() => expect(salesService.reprogramFee).toHaveBeenCalledTimes(1));
    expect(salesService.reprogramFee).toHaveBeenCalledWith(5, 10);
    expect(salesService.postponeFee).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('rechaza "Esta y las siguientes" sin delta positivo, sin llamar al servicio', async () => {
    const user = userEvent.setup();
    const { onSuccess, onClose } = renderModal({
      isPaid: false,
      currentPaymentDate: undefined,
      hasLaterUnpaidFees: true,
    });

    // Una fecha anterior a la actual de la cuota: delta negativo
    fireEvent.change(screen.getByLabelText('Fecha de Vencimiento'), {
      target: { value: '2026-09-20' },
    });
    await user.click(screen.getByRole('button', { name: 'Confirmar Cambio' }));

    expect(
      await screen.findByText('La nueva fecha debe ser posterior a la fecha actual de la cuota'),
    ).toBeInTheDocument();
    expect(salesService.reprogramFee).not.toHaveBeenCalled();
    expect(salesService.postponeFee).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('con alcance "Sólo esta" pospone la fecha aunque haya impagas posteriores', async () => {
    const user = userEvent.setup();
    renderModal({ isPaid: false, currentPaymentDate: undefined, hasLaterUnpaidFees: true });
    vi.mocked(salesService.postponeFee).mockResolvedValue(undefined);

    await user.selectOptions(screen.getByLabelText('Alcance'), 'SOLO_ESTA');
    fireEvent.change(screen.getByLabelText('Fecha de Vencimiento'), {
      target: { value: '2026-10-05' },
    });
    await user.click(screen.getByRole('button', { name: 'Confirmar Cambio' }));

    await waitFor(() => expect(salesService.postponeFee).toHaveBeenCalledTimes(1));
    expect(salesService.postponeFee).toHaveBeenCalledWith(10, 5, '2026-10-05', 15000, undefined);
    expect(salesService.reprogramFee).not.toHaveBeenCalled();
  });
});
