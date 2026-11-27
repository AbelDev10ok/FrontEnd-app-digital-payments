import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordatorioRondaModal from '../components/RecordatorioRondaModal';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import type { CuotaItem } from '@/shared/types/business';

vi.mock('@/features/cobros/services/collectionsService', () => ({
  collectionsService: {
    getCobrosHoy: vi.fn(),
    getCuotas: vi.fn(),
    marcarRecordatorio: vi.fn(),
  },
}));

const cuota = (overrides: Partial<CuotaItem> = {}): CuotaItem => ({
  id: 10,
  saleId: 2,
  clientId: 3,
  clientName: 'Maria Lopez',
  clientPhone: '+5491155551234',
  saleDescription: 'Televisor 32 pulgadas',
  saleKind: 'VENTA',
  numeroCuota: 1,
  totalCuotas: 12,
  monto: 15000,
  deudaVenta: 200000,
  fechaVencimiento: '2026-08-25',
  pagada: false,
  diasAtraso: 0,
  estado: 'TODAY',
  currency: 'ARS',
  ...overrides,
});

const cuotas = [
  cuota(),
  cuota({ id: 11, clientId: 4, clientName: 'Juan Perez', clientPhone: null, numeroCuota: 2 }),
  cuota({ id: 12, clientId: 5, clientName: 'Ana Gomez', clientPhone: '+5491155559999' }),
];

const renderModal = (onClose = vi.fn()) =>
  render(<RecordatorioRondaModal cuotas={cuotas} onClose={onClose} />);

describe('RecordatorioRondaModal', () => {
  beforeEach(() => {
    vi.mocked(collectionsService.marcarRecordatorio).mockReset();
    vi.mocked(collectionsService.marcarRecordatorio).mockResolvedValue({
      feeId: 10,
      ultimoRecordatorio: '2026-08-25T14:30:00',
      recordatorios: 1,
    });
  });

  it('muestra un cliente por vez, el progreso y el mensaje que se va a mandar', () => {
    renderModal();

    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText(/Hola Maria Lopez/)).toBeInTheDocument();
    expect(screen.getByText(/\$ 15\.000/)).toBeInTheDocument();
    expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument();
  });

  it('abre WhatsApp con el recordatorio y registra el envío antes de avanzar', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderModal();

    await user.click(screen.getByRole('button', { name: /Abrir WhatsApp/ }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/5491155551234?text='),
      '_blank',
      'noopener,noreferrer',
    );
    await waitFor(() => expect(collectionsService.marcarRecordatorio).toHaveBeenCalledWith(10));

    // Avanza al siguiente y el progreso refleja la gestión
    expect(await screen.findByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('2 de 3')).toBeInTheDocument();
    openSpy.mockRestore();
  });

  it('permite saltar a un cliente sin registrar el recordatorio', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /Saltar/ }));

    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(collectionsService.marcarRecordatorio).not.toHaveBeenCalled();
  });

  it('no deja abrir el chat de un cliente sin celular, pero deja saltearlo', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /Saltar/ }));

    expect(await screen.findByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir WhatsApp/ })).toBeDisabled();
    expect(screen.getByText(/Sin teléfono para WhatsApp/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Saltar/ }));
    expect(screen.getByText('Ana Gomez')).toBeInTheDocument();
  });

  it('muestra el error y no avanza si no se pudo registrar el recordatorio', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.marcarRecordatorio).mockRejectedValue(
      new Error('sin conexión'),
    );
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderModal();

    await user.click(screen.getByRole('button', { name: /Abrir WhatsApp/ }));

    expect(await screen.findByText('sin conexión')).toBeInTheDocument();
    expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    openSpy.mockRestore();
  });

  it('cierra la ronda con el resumen de los recordatorios enviados', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderModal(onClose);

    await user.click(screen.getByRole('button', { name: /Abrir WhatsApp/ }));
    await waitFor(() => expect(screen.getByText('Juan Perez')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Saltar/ }));
    await waitFor(() => expect(screen.getByText('Ana Gomez')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Abrir WhatsApp/ }));

    expect(await screen.findByText(/Recordatorios enviados: 2/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Listo' }));
    expect(onClose).toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
