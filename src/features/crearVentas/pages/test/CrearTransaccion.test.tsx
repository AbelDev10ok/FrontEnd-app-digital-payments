import { render, screen } from '@testing-library/react';
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
  default: () => <div>Elegir producto</div>,
}));

vi.mock('@features/crearVentas/components/CreateSaleForm', () => ({
  default: ({ formData }: { formData: { tipo: string } }) => (
    <div>{formData.tipo === 'PRESTAMO' ? 'Formulario de préstamo' : 'Formulario de venta'}</div>
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
});
