import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CrearTransaccion from '../CrearTransaccion';

vi.mock('@/shared/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock('@features/crearVentas/hooks/useSaleForm', () => ({
  default: (type: 'VENTA' | 'PRESTAMO') => ({
    formData: { tipo: type },
    setFormData: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
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
  default: ({ formData, cancelTo }: { formData: { tipo: string }; cancelTo?: string }) => (
    <div>
      <span>{formData.tipo === 'PRESTAMO' ? 'Formulario de préstamo' : 'Formulario de venta'}</span>
      <span data-testid="cancel-to">{cancelTo}</span>
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
});
