import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DeshabilitarVendedorModal from '../DeshabilitarVendedorModal';
import { clientService } from '@/features/clients/services/clientServices';
import type { Client } from '@/shared/types/client';

vi.mock('@/features/clients/services/clientServices', () => ({
  clientService: {
    getVendedoresActivos: vi.fn(),
    desabilitarVendedor: vi.fn(),
  },
}));

// El combobox tiene sus propios tests: acá interesa qué payload sale del modal.
vi.mock('@/shared/components/AutocompleteSeller', () => ({
  default: ({
    value,
    sellers,
    onChange,
  }: {
    value: string;
    sellers: Client[];
    onChange: (sellerId: string) => void;
  }) => (
    <select aria-label="Vendedor" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Seleccionar vendedor</option>
      {sellers.map((vendedor) => (
        <option key={vendedor.id} value={vendedor.id}>
          {vendedor.name}
        </option>
      ))}
    </select>
  ),
}));

const crearCliente = (overrides: Partial<Client> = {}): Client => ({
  id: 1,
  name: 'luis',
  telefono: '1144556677',
  email: 'luis@example.com',
  direccion: '',
  seller: true,
  clientesEnCartera: 3,
  ...overrides,
});

const renderModal = (client: Client, onDisabled = vi.fn()) => {
  render(
    <DeshabilitarVendedorModal
      isOpen
      client={client}
      onClose={vi.fn()}
      onDisabled={onDisabled}
    />,
  );
  return { onDisabled };
};

describe('DeshabilitarVendedorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientService.getVendedoresActivos).mockResolvedValue([
      crearCliente({ id: 7, name: 'ana', clientesEnCartera: 0 }),
    ]);
  });

  it('traspasa toda la cartera al vendedor elegido', async () => {
    const user = userEvent.setup();
    const { onDisabled } = renderModal(crearCliente());

    expect(await screen.findByText(/3 clientes en cartera/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Vendedor'), '7');
    await user.click(screen.getByRole('button', { name: 'Deshabilitar' }));

    await waitFor(() =>
      expect(clientService.desabilitarVendedor).toHaveBeenCalledWith(1, { transferToSellerId: 7 }),
    );
    expect(onDisabled).toHaveBeenCalled();
  });

  it('deja la cartera sin vendedor para que la cobre el negocio', async () => {
    const user = userEvent.setup();
    const { onDisabled } = renderModal(crearCliente());

    await screen.findByText(/3 clientes en cartera/);
    await user.click(screen.getByRole('radio', { name: /Dejarlos sin vendedor/i }));
    await user.click(screen.getByRole('button', { name: 'Deshabilitar' }));

    await waitFor(() =>
      expect(clientService.desabilitarVendedor).toHaveBeenCalledWith(1, {
        leaveClientsUnassigned: true,
      }),
    );
    expect(onDisabled).toHaveBeenCalled();
  });

  it('no deja confirmar sin elegir el vendedor que recibe la cartera', async () => {
    renderModal(crearCliente());

    await screen.findByText(/3 clientes en cartera/);

    expect(screen.getByRole('button', { name: 'Deshabilitar' })).toBeDisabled();
    expect(clientService.desabilitarVendedor).not.toHaveBeenCalled();
  });

  it('sin clientes en cartera deshabilita sin pedir destino', async () => {
    const user = userEvent.setup();
    const { onDisabled } = renderModal(crearCliente({ clientesEnCartera: 0 }));

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.getByText('No tiene clientes en cartera.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Deshabilitar' }));

    await waitFor(() =>
      expect(clientService.desabilitarVendedor).toHaveBeenCalledWith(1, undefined),
    );
    expect(onDisabled).toHaveBeenCalled();
  });

  it('muestra el error del backend y no cierra el modal', async () => {
    vi.mocked(clientService.desabilitarVendedor).mockRejectedValue(
      new Error('El vendedor destino está en la cartera de luis.'),
    );
    const user = userEvent.setup();
    const { onDisabled } = renderModal(crearCliente({ clientesEnCartera: 0 }));

    await user.click(screen.getByRole('button', { name: 'Deshabilitar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/cartera de luis/i);
    expect(onDisabled).not.toHaveBeenCalled();
  });
});
