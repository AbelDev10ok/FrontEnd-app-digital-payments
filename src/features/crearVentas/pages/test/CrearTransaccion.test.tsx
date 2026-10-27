import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CrearTransaccion from '../CrearTransaccion';
import { useSalesCountsStore } from '@/features/ventas/store/salesCountsStore';

vi.mock('@/shared/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock('@features/crearVentas/hooks/useSaleForm', () => ({
  default: (type: 'VENTA' | 'PRESTAMO') => ({
    formData: { tipo: type },
    setFormData: vi.fn(),
    handleInputChange: vi.fn(),
    // El alta "existe" para que el wrapper navegue y avise a los conteos
    handleSubmit: vi.fn().mockResolvedValue({ id: 1 }),
    errors: {},
    visibleErrors: {},
    isSubmittingDisabled: false,
    productTypes: [],
    products: [],
    sellers: [],
    displayedClients: [],
  }),
}));

vi.mock('@features/crearVentas/components/TransactionHeader', () => ({
  default: () => <div>Encabezado</div>,
}));

vi.mock('@features/crearVentas/components/ProductPicker', () => ({
  default: ({ onSelect }: { onSelect: (product: { id: number }, cantidad: number) => void }) => (
    <button type="button" onClick={() => onSelect({ id: 1 }, 1)}>
      Elegir producto
    </button>
  ),
}));

vi.mock('@features/crearVentas/components/CreateSaleForm', () => ({
  default: ({
    formData,
    cancelTo,
    onSubmit,
  }: {
    formData: { tipo: string };
    cancelTo?: string;
    onSubmit?: (e: React.FormEvent) => void;
  }) => (
    <div>
      <span>{formData.tipo === 'PRESTAMO' ? 'Formulario de préstamo' : 'Formulario de venta'}</span>
      <span data-testid="cancel-to">{cancelTo}</span>
      <button
        type="button"
        onClick={() => onSubmit?.({ preventDefault: vi.fn() } as unknown as React.FormEvent)}
      >
        Enviar
      </button>
    </div>
  ),
}));

const props = {
  user: { email: 'vendedor@example.com', role: 'ROLE_USER' },
  onLogout: vi.fn(),
};

describe('CrearTransaccion', () => {
  it('cambia a formulario de préstamo al cambiar el tipo y vuelve al selector para una venta', () => {
    const { rerender } = render(
      <MemoryRouter>
        <CrearTransaccion type="VENTA" {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Elegir producto')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CrearTransaccion type="PRESTAMO" {...props} />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Elegir producto')).not.toBeInTheDocument();
    expect(screen.getByText('Formulario de préstamo')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CrearTransaccion type="VENTA" {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Elegir producto')).toBeInTheDocument();
  });

  it('en un préstamo, "Cancelar" vuelve a la lista filtrada por préstamos', () => {
    render(
      <MemoryRouter>
        <CrearTransaccion type="PRESTAMO" {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('cancel-to').textContent).toBe('/dashboard/ventas/todas?kind=PRESTAMO');
  });

  it('en una venta, "Cancelar" vuelve a la lista de ventas (no a la landing)', () => {
    render(
      <MemoryRouter>
        <CrearTransaccion type="VENTA" {...props} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Elegir producto'));

    expect(screen.getByTestId('cancel-to').textContent).toBe('/dashboard/ventas/todas');
  });

  it('avisa a los conteos del menú cuando la transacción se crea', async () => {
    const tokenAntes = useSalesCountsStore.getState().refreshToken;

    render(
      <MemoryRouter>
        <CrearTransaccion type="VENTA" {...props} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Elegir producto'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    // El menú vuelve a pedir sus conteos sin recargar la página
    await waitFor(() =>
      expect(useSalesCountsStore.getState().refreshToken).toBeGreaterThan(tokenAntes),
    );
  });
});
