import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import TodasVentas from '../TodasVentas';
import { salesService } from '@/features/ventas/services/salesServices';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getProductTypes: vi.fn(),
    getSalesCounts: vi.fn(),
    getAllSalesPaginated: vi.fn(),
  },
}));

const pageMock = {
  content: [],
  pageable: { pageNumber: 0, pageSize: 10, offset: 0, paged: true, unpaged: false, sort: { sorted: false, unsorted: true, empty: true } },
  totalPages: 0,
  totalElements: 0,
  last: true,
  size: 10,
  number: 0,
  sort: { sorted: false, unsorted: true, empty: true },
  numberOfElements: 0,
  first: true,
  empty: true,
};

const renderPage = (path = '/dashboard/ventas/todas') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TodasVentas
        user={{ email: 'test@test.com', role: 'ROLE_USER' }}
        onLogout={vi.fn()}
      />
    </MemoryRouter>,
  );

describe('TodasVentas', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(salesService.getProductTypes).mockReset();
    vi.mocked(salesService.getProductTypes).mockResolvedValue([]);
    vi.mocked(salesService.getSalesCounts).mockReset();
    vi.mocked(salesService.getSalesCounts).mockResolvedValue({
      total: 0,
      active: 0,
      completed: 0,
      canceled: 0,
      aCobrar: 0,
    });
    vi.mocked(salesService.getAllSalesPaginated).mockReset();
    vi.mocked(salesService.getAllSalesPaginated).mockResolvedValue(pageMock);
  });

  it('combina kind, status y productType desde la URL en la petición', async () => {
    renderPage('/dashboard/ventas/todas?kind=PRESTAMO&status=ACTIVE&productType=2');

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenCalled(),
    );

    expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: 'PRESTAMO',
        status: 'ACTIVE',
        productType: '2',
      }),
    );
  });

  it('oculta la búsqueda por descripción y no la envía para préstamos', async () => {
    renderPage('/dashboard/ventas/todas?kind=PRESTAMO');

    expect(
      screen.queryByPlaceholderText(/descripcion producto/i),
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: 'PRESTAMO' }),
      ),
    );
    expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
      expect.not.objectContaining({
        descriptionProduct: expect.anything(),
      }),
    );
  });

  it('traduce A_COBRAR a aCobrar=true en la petición', async () => {
    renderPage('/dashboard/ventas/todas?status=A_COBRAR');

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenCalled(),
    );

    expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({ aCobrar: true }),
    );
  });

  it('envía la búsqueda por descripción cuando se escribe', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/descripcion producto/i),
      'TV',
    );

    await waitFor(
      () =>
        expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
          expect.objectContaining({ descriptionProduct: 'TV' }),
        ),
      { timeout: 2000 },
    );
  });

  it('Limpiar filtros quita el status de la petición y limpia la URL', async () => {
    const user = userEvent.setup();
    renderPage('/dashboard/ventas/todas?status=ACTIVE');

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ status: 'ACTIVE' }),
      ),
    );
  });

  it('Limpiar filtros en préstamos conserva kind=PRESTAMO', async () => {
    const user = userEvent.setup();
    renderPage('/dashboard/ventas/todas?kind=PRESTAMO&status=ACTIVE');

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: 'PRESTAMO' }),
      ),
    );
    expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ status: 'ACTIVE' }),
    );
  });

  it('muestra el contador de resultados', async () => {
    vi.mocked(salesService.getAllSalesPaginated).mockResolvedValue({
      ...pageMock,
      totalElements: 7,
    });

    renderPage();

    expect(await screen.findByText('7 resultados')).toBeInTheDocument();
  });
});
