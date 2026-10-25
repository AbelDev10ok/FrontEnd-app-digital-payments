import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PayFeeModal from '../components/PayFeeModal';
import type { CuotaItem } from '@/shared/types/business';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: { markFeeAsPaid: vi.fn(), getFeePayments: vi.fn().mockResolvedValue([]) },
}));

const cuota = (overrides: Partial<CuotaItem> = {}): CuotaItem => ({
  id: 1,
  saleId: 10,
  clientId: 5,
  clientName: 'Juana Pérez',
  saleDescription: 'Televisor 32 pulgadas',
  numeroCuota: 2,
  monto: 15000,
  fechaVencimiento: '2026-09-01',
  pagada: false,
  diasAtraso: 0,
  estado: 'UPCOMING',
  ...overrides,
});

const renderModal = (props: Partial<React.ComponentProps<typeof PayFeeModal>> = {}) =>
  render(<PayFeeModal cuota={cuota()} onClose={vi.fn()} onPaid={vi.fn()} {...props} />);

describe('PayFeeModal', () => {
  it('muestra el símbolo ARS en el input de monto (no EUR) y los datos de la cuota', () => {
    renderModal();

    const input = screen.getByLabelText(/Monto cobrado/i) as HTMLInputElement;
    const wrapper = input.parentElement as HTMLElement;
    expect(wrapper.textContent).toContain('$');
    expect(wrapper.textContent).not.toContain('€');
    expect(screen.getByText('Cobrar cuota 2 · Juana Pérez')).toBeInTheDocument();
    expect(screen.getByText(/Televisor 32 pulgadas/i)).toBeInTheDocument();
  });

  it('muestra US$ cuando la cuota pertenece a una venta en dólares', () => {
    renderModal({ cuota: cuota({ currency: 'USD' }) });

    const input = screen.getByLabelText(/Monto cobrado/i);
    expect(input.parentElement?.querySelector('span')?.textContent).toBe('US$');
  });

  it('muestra la deuda restante y rechaza al confirmar un monto mayor', async () => {
    const user = userEvent.setup();
    renderModal({ cuota: cuota(), deudaRestante: 10000 });

    expect(screen.getByText('Deuda restante:')).toBeInTheDocument();
    const input = screen.getByLabelText(/Monto cobrado/i);
    await user.clear(input);
    await user.type(input, '20000');
    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));
    expect(screen.getByText('El monto supera la deuda restante')).toBeInTheDocument();
  });

  it('aplica la fecha mínima (fecha de venta) al input de fecha para bloquear fechas anteriores', () => {
    renderModal({ fechaMinima: '2026-06-01' });
    const fechaInput = screen.getByLabelText(/Fecha de pago/i) as HTMLInputElement;
    expect(fechaInput.min).toBe('2026-06-01');
  });

  it('llama al servicio con monto y fecha al confirmar un cobro válido', async () => {
    const user = userEvent.setup();
    const onPaid = vi.fn();
    const onClose = vi.fn();
    const { salesService } = await import('@/features/ventas/services/salesServices');
    render(
      <PayFeeModal cuota={cuota()} onClose={onClose} onPaid={onPaid} deudaRestante={60000} />,
    );

    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));
    await screen.findByText('Deuda restante:');
    expect(salesService.markFeeAsPaid).toHaveBeenCalledWith(1, 15000, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), 'EFECTIVO');
    expect(onPaid).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('no renderiza sin cuota', () => {
    renderModal({ cuota: null });
    expect(screen.queryByText(/Cobrar cuota/i)).not.toBeInTheDocument();
  });

  it('precarga el monto de la cuota', () => {
    renderModal({ cuota: cuota({ monto: 15000 }) });

    const input = screen.getByLabelText(/Monto cobrado/i) as HTMLInputElement;
    expect(input.value).toBe('15000');
  });

  it('precarga lo que se debe cuando la deuda es menor que el monto de la cuota', () => {
    renderModal({ cuota: cuota({ monto: 20 }), deudaRestante: 10 });

    const input = screen.getByLabelText(/Monto cobrado/i) as HTMLInputElement;
    expect(input.value).toBe('10');
  });

  it('precarga el monto de la cuota cuando la deuda es mayor', () => {
    renderModal({ cuota: cuota({ monto: 20 }), deudaRestante: 500 });

    const input = screen.getByLabelText(/Monto cobrado/i) as HTMLInputElement;
    expect(input.value).toBe('20');
  });

  it('permite cobrar más que el monto de la cuota si entra en la deuda restante', async () => {
    const user = userEvent.setup();
    const { salesService } = await import('@/features/ventas/services/salesServices');
    renderModal({ cuota: cuota({ monto: 15000 }), deudaRestante: 60000 });

    const input = screen.getByLabelText(/Monto cobrado/i);
    await user.clear(input);
    await user.type(input, '20000');
    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));

    expect(salesService.markFeeAsPaid).toHaveBeenCalledWith(1, 20000, expect.any(String), 'EFECTIVO');
  });

  it('muestra el historial de cobros de la cuota con fecha y hora', async () => {
    const { salesService } = await import('@/features/ventas/services/salesServices');
    vi.mocked(salesService.getFeePayments).mockResolvedValueOnce([
      { id: 1, amount: 5000, paidAt: '2026-11-12T09:15:00', paymentMethod: 'EFECTIVO' },
      { id: 2, amount: 5000, paidAt: '2026-11-12T15:45:00', paymentMethod: 'TRANSFERENCIA' },
    ]);

    renderModal({ cuota: cuota({ monto: 15000 }) });

    expect(await screen.findByText('Cobros de esta cuota')).toBeInTheDocument();
    expect(screen.getByText('12/11/2026 · 09:15')).toBeInTheDocument();
    expect(screen.getByText('12/11/2026 · 15:45')).toBeInTheDocument();
  });
});