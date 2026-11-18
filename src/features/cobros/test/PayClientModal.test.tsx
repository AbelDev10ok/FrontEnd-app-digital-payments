import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PayClientModal from '../components/PayClientModal';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import { useSalesCountsStore } from '@/features/ventas/store/salesCountsStore';
import type { ClientGroup } from '@/features/cobros/utils/clientGroups';
import type { CuotaItem } from '@/shared/types/business';

vi.mock('@/features/cobros/services/collectionsService', () => ({
  collectionsService: { payClient: vi.fn() },
}));

const cuota = (overrides: Partial<CuotaItem> = {}): CuotaItem => ({
  id: 1,
  saleId: 10,
  clientId: 5,
  clientName: 'Maria Lopez',
  numeroCuota: 2,
  monto: 15000,
  fechaVencimiento: '2026-09-01',
  pagada: false,
  diasAtraso: 0,
  estado: 'UPCOMING',
  ...overrides,
});

const grupo = (overrides: Partial<ClientGroup> = {}): ClientGroup => ({
  key: '5:ARS',
  clientId: 5,
  clientName: 'Maria Lopez',
  clientPhone: '+5491155551234',
  clientAddress: 'Av. Siempre Viva 123',
  currency: 'ARS',
  items: [cuota()],
  subtotal: 30000,
  debt: 60000,
  ...overrides,
});

const renderModal = (props: Partial<React.ComponentProps<typeof PayClientModal>> = {}) =>
  render(<PayClientModal group={grupo()} onClose={vi.fn()} onPaid={vi.fn()} {...props} />);

describe('PayClientModal', () => {
  beforeEach(() => {
    vi.mocked(collectionsService.payClient).mockReset();
  });

  it('no renderiza sin grupo', () => {
    renderModal({ group: null });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('precarga el subtotal del grupo y muestra cliente, moneda y deuda', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Cobrar todo · Maria Lopez' })).toBeInTheDocument();
    expect(screen.getByText('Moneda:')).toBeInTheDocument();
    expect(screen.getByText('ARS')).toBeInTheDocument();
    expect(screen.getByText('Cobrable hoy:')).toBeInTheDocument();
    expect(screen.getByText('Deuda del cliente:')).toBeInTheDocument();
    expect(screen.getByLabelText(/Monto cobrado/i)).toHaveValue(30000);
  });

  it('oculta la deuda cuando el backend no la informó', () => {
    renderModal({ group: grupo({ debt: null }) });

    expect(screen.queryByText('Deuda del cliente:')).not.toBeInTheDocument();
  });

  it('permite un pago parcial y lo registra con la moneda del grupo', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.payClient).mockResolvedValue({
      clientId: 5,
      clientName: 'Maria Lopez',
      currency: 'ARS',
      appliedAmount: 10000,
      remainingDebt: 20000,
      applications: [],
    });
    const onPaid = vi.fn();
    const onClose = vi.fn();
    renderModal({ onPaid, onClose });

    const input = screen.getByLabelText(/Monto cobrado/i);
    await user.clear(input);
    await user.type(input, '10000');
    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));

    expect(collectionsService.payClient).toHaveBeenCalledWith(5, {
      amount: 10000,
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      currency: 'ARS',
      paymentMethod: 'EFECTIVO',
    });
    expect(onPaid).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('rechaza un monto mayor a la deuda del cliente sin llamar al servicio', async () => {
    const user = userEvent.setup();
    renderModal();

    const input = screen.getByLabelText(/Monto cobrado/i);
    await user.clear(input);
    await user.type(input, '70000');
    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));

    expect(screen.getByText('El monto supera la deuda del cliente')).toBeInTheDocument();
    expect(collectionsService.payClient).not.toHaveBeenCalled();
  });

  it('rechaza un monto vacío o en cero', async () => {
    const user = userEvent.setup();
    renderModal();

    const input = screen.getByLabelText(/Monto cobrado/i);
    await user.clear(input);
    await user.type(input, '0');
    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));

    expect(screen.getByText('Ingresá un monto válido')).toBeInTheDocument();
    expect(collectionsService.payClient).not.toHaveBeenCalled();
  });

  it('muestra el error del backend y no recarga la agenda', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.payClient).mockRejectedValue(
      new Error('El cliente no tiene deuda pendiente en ARS'),
    );
    const onPaid = vi.fn();
    renderModal({ onPaid });

    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));

    expect(await screen.findByText('El cliente no tiene deuda pendiente en ARS')).toBeInTheDocument();
    expect(onPaid).not.toHaveBeenCalled();
  });

  it('pide los conteos del menú al registrar el cobro', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.payClient).mockResolvedValue({
      clientId: 5,
      clientName: 'Maria Lopez',
      currency: 'ARS',
      appliedAmount: 30000,
      remainingDebt: 30000,
      applications: [],
    });
    const tokenAntes = useSalesCountsStore.getState().refreshToken;
    renderModal();

    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));

    expect(useSalesCountsStore.getState().refreshToken).toBeGreaterThan(tokenAntes);
  });
});
