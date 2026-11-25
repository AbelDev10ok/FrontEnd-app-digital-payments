import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentPromiseModal from '../components/PaymentPromiseModal';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import type { ClientGroup } from '@/features/cobros/utils/clientGroups';
import type { CuotaItem, PaymentPromise } from '@/shared/types/business';

vi.mock('@/features/cobros/services/collectionsService', () => ({
  collectionsService: {
    createPromise: vi.fn(),
    fulfillPromise: vi.fn(),
    cancelPromise: vi.fn(),
  },
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

const promesa = (overrides: Partial<PaymentPromise> = {}): PaymentPromise => ({
  id: 7,
  clientId: 5,
  clientName: 'Maria Lopez',
  currency: 'ARS',
  amount: 30000,
  promisedDate: '2026-09-05',
  status: 'PENDING',
  vencida: false,
  diasAtraso: null,
  note: null,
  ...overrides,
});

interface ModalProps {
  group?: ClientGroup | null;
  promise?: PaymentPromise | null;
  onClose?: () => void;
  onChanged?: () => void;
}

const renderModal = ({ group: g, promise: p, onClose, onChanged }: ModalProps = {}) =>
  render(
    <PaymentPromiseModal
      group={g === undefined ? grupo() : g}
      promise={p ?? null}
      onClose={onClose ?? vi.fn()}
      onChanged={onChanged ?? vi.fn()}
    />,
  );

describe('PaymentPromiseModal', () => {
  beforeEach(() => {
    vi.mocked(collectionsService.createPromise).mockReset();
    vi.mocked(collectionsService.fulfillPromise).mockReset();
    vi.mocked(collectionsService.cancelPromise).mockReset();
  });

  it('no renderiza sin grupo', () => {
    renderModal({ group: null });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── Alta de la promesa ─────────────────────────────────────────────────────

  it('precarga el monto con la deuda del grupo y muestra la moneda', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Promesa de pago · Maria Lopez' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('Deuda del grupo en ARS: $ 60.000');
    expect(screen.getByLabelText(/Monto prometido/i)).toHaveValue(60000);
  });

  it('usa el subtotal cuando el grupo no informa la deuda', () => {
    renderModal({ group: grupo({ debt: null }) });

    expect(screen.getByRole('dialog')).toHaveTextContent('Deuda del grupo en ARS: $ 30.000');
    expect(screen.getByLabelText(/Monto prometido/i)).toHaveValue(30000);
  });

  it('registra la promesa con la moneda del grupo, el monto y la nota', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.createPromise).mockResolvedValue(promesa());
    const onChanged = vi.fn();
    const onClose = vi.fn();
    renderModal({ onChanged, onClose });

    const monto = screen.getByLabelText(/Monto prometido/i);
    await user.clear(monto);
    await user.type(monto, '25000');
    await user.type(screen.getByLabelText(/Nota/i), 'Pasa el viernes por la tarde');
    await user.click(screen.getByRole('button', { name: /Registrar promesa/i }));

    expect(collectionsService.createPromise).toHaveBeenCalledWith(5, {
      amount: 25000,
      promisedDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      currency: 'ARS',
      note: 'Pasa el viernes por la tarde',
    });
    expect(onChanged).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('omite la nota cuando queda vacía', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.createPromise).mockResolvedValue(promesa());
    renderModal();

    await user.click(screen.getByRole('button', { name: /Registrar promesa/i }));

    expect(collectionsService.createPromise).toHaveBeenCalledWith(5, {
      amount: 60000,
      promisedDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      currency: 'ARS',
      note: undefined,
    });
  });

  it('rechaza un monto en cero sin llamar al servicio', async () => {
    const user = userEvent.setup();
    renderModal();

    const monto = screen.getByLabelText(/Monto prometido/i);
    await user.clear(monto);
    await user.type(monto, '0');
    await user.click(screen.getByRole('button', { name: /Registrar promesa/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El monto de la promesa tiene que ser mayor a cero.',
    );
    expect(collectionsService.createPromise).not.toHaveBeenCalled();
  });

  it('rechaza el alta sin fecha prometida', async () => {
    const user = userEvent.setup();
    renderModal();

    fireEvent.change(screen.getByLabelText(/Fecha prometida/i), { target: { value: '' } });
    await user.click(screen.getByRole('button', { name: /Registrar promesa/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Indicá la fecha en la que el cliente prometió pagar.',
    );
    expect(collectionsService.createPromise).not.toHaveBeenCalled();
  });

  it('muestra el error del backend y no recarga la agenda', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.createPromise).mockRejectedValue(
      new Error('El cliente no tiene deuda pendiente en ARS'),
    );
    const onChanged = vi.fn();
    renderModal({ onChanged });

    await user.click(screen.getByRole('button', { name: /Registrar promesa/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El cliente no tiene deuda pendiente en ARS',
    );
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('cierra sin registrar cuando se cancela el alta', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
    expect(collectionsService.createPromise).not.toHaveBeenCalled();
  });

  // ── Gestión de la promesa vigente ──────────────────────────────────────────

  it('muestra la promesa vigente en lugar del formulario de alta', () => {
    renderModal({ promise: promesa() });

    expect(screen.getByRole('dialog')).toHaveTextContent('El cliente prometió pagar:');
    expect(screen.getByText('$ 30.000')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('Fecha prometida: 05/09/2026');
    expect(screen.getByRole('button', { name: /Marcar cumplida/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar promesa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Registrar promesa/i })).not.toBeInTheDocument();
  });

  it('avisa cuando la promesa está vencida y suma los días de atraso', () => {
    renderModal({ promise: promesa({ vencida: true, diasAtraso: 3 }) });

    expect(screen.getByRole('dialog')).toHaveTextContent('El cliente prometió pagar y no lo hizo.');
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Fecha prometida: 05/09/2026 · 3 días de atraso',
    );
  });

  it('usa el singular cuando el atraso es de un día', () => {
    renderModal({ promise: promesa({ vencida: true, diasAtraso: 1 }) });

    expect(screen.getByRole('dialog')).toHaveTextContent('· 1 día de atraso');
  });

  it('muestra la nota cargada en la promesa', () => {
    renderModal({ promise: promesa({ note: 'Pasa el viernes por la tarde' }) });

    expect(screen.getByText('Nota: Pasa el viernes por la tarde')).toBeInTheDocument();
  });

  it('marca la promesa como cumplida', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.fulfillPromise).mockResolvedValue(
      promesa({ status: 'FULFILLED' }),
    );
    const onChanged = vi.fn();
    const onClose = vi.fn();
    renderModal({ promise: promesa(), onChanged, onClose });

    await user.click(screen.getByRole('button', { name: /Marcar cumplida/i }));

    expect(collectionsService.fulfillPromise).toHaveBeenCalledWith(7);
    expect(onChanged).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('cancela la promesa', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.cancelPromise).mockResolvedValue(
      promesa({ status: 'CANCELLED' }),
    );
    const onChanged = vi.fn();
    const onClose = vi.fn();
    renderModal({ promise: promesa(), onChanged, onClose });

    await user.click(screen.getByRole('button', { name: 'Cancelar promesa' }));

    expect(collectionsService.cancelPromise).toHaveBeenCalledWith(7);
    expect(onChanged).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra el error al gestionar una promesa que ya no está pendiente', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.fulfillPromise).mockRejectedValue(
      new Error('La promesa ya no está pendiente'),
    );
    const onChanged = vi.fn();
    renderModal({ promise: promesa(), onChanged });

    await user.click(screen.getByRole('button', { name: /Marcar cumplida/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La promesa ya no está pendiente');
    expect(onChanged).not.toHaveBeenCalled();
  });
});
