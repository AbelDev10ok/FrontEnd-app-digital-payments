import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PayFeeModal from '../components/PayFeeModal';
import type { CuotaItem } from '@/shared/types/business';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: { markFeeAsPaid: vi.fn() },
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

  it('muestra la deuda restante y la valida al confirmar', async () => {
    const user = userEvent.setup();
    renderModal({ cuota: cuota(), deudaRestante: 10000 });

    expect(screen.getByText('Deuda restante:')).toBeInTheDocument();
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
});