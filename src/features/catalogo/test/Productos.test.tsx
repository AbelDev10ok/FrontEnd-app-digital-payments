import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Productos from '../pages/Productos';
import { salesService } from '@/features/ventas/services/salesServices';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getProductTypes: vi.fn(),
    createProductType: vi.fn(),
    updateProductType: vi.fn(),
    deleteProductType: vi.fn(),
    getProducts: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getSalesCounts: vi.fn().mockResolvedValue({
      total: 0,
      active: 0,
      completed: 0,
      canceled: 0,
      aCobrar: 0,
    }),
  },
}));

// El shell (DashboardLayout) carga la moneda del negocio (initCurrency) al montar.
vi.mock('@/features/negocio/services/businessService', () => ({
  businessService: {
    getMyBusiness: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Negocio de test',
      currency: 'ARS',
      defaultInterestRate: null,
      defaultPaymentFrequency: null,
      planStatus: 'TRIAL',
      trialEndsAt: null,
      subscriptionUntil: null,
      createdAt: '2026-01-01',
    }),
    updateMyBusiness: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const renderPagina = () =>
  render(
    <MemoryRouter>
      <Productos user={null} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

describe('Productos (Catálogo)', () => {
  beforeEach(() => {
    vi.mocked(salesService.getProductTypes).mockReset();
    vi.mocked(salesService.getProductTypes).mockResolvedValue([
      { id: 1, name: 'TV' },
      { id: 2, name: 'CELULAR' },
    ]);
    vi.mocked(salesService.createProductType).mockReset();
    vi.mocked(salesService.updateProductType).mockReset();
    vi.mocked(salesService.deleteProductType).mockReset();
    vi.mocked(salesService.getProducts).mockReset();
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { id: 1, name: 'HELADERA SAMSUNG 320L', price: 500, productTypeId: 1, productTypeName: 'TV' },
    ]);
    vi.mocked(salesService.createProduct).mockReset();
    vi.mocked(salesService.updateProduct).mockReset();
    vi.mocked(salesService.deleteProduct).mockReset();
  });

  it('lista categorías y productos cargados', async () => {
    renderPagina();
    expect((await screen.findAllByText('TV')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('CELULAR').length).toBeGreaterThan(0);
    expect(await screen.findByText('HELADERA SAMSUNG 320L')).toBeInTheDocument();
  });

  it('crea una categoría y recarga la lista', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.createProductType).mockResolvedValue({ id: 3, name: 'ROPA' });
    vi.mocked(salesService.getProductTypes).mockResolvedValue([
      { id: 1, name: 'TV' },
      { id: 2, name: 'CELULAR' },
      { id: 3, name: 'ROPA' },
    ]);
    renderPagina();

    await user.type(screen.getByLabelText('Nueva categoría'), 'ROPA');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(salesService.createProductType).toHaveBeenCalledWith('ROPA'));
    const ropa = await screen.findAllByText('ROPA');
    expect(ropa.length).toBeGreaterThan(0);
  });

  it('crea un producto con precio y categoría y recarga la lista', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.createProduct).mockResolvedValue(undefined);
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { id: 1, name: 'HELADERA SAMSUNG 320L', price: 500, productTypeId: 1, productTypeName: 'TV' },
      { id: 2, name: 'TV LG 55', price: 900, productTypeId: 1, productTypeName: 'TV' },
    ]);
    renderPagina();

    await user.type(screen.getByLabelText('Nuevo producto'), 'TV LG 55');
    await user.type(screen.getByLabelText('Precio (opcional)'), '900');
    await user.selectOptions(screen.getByLabelText('Categoría *'), '1');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    await waitFor(() =>
      expect(salesService.createProduct).toHaveBeenCalledWith({
        name: 'TV LG 55',
        price: 900,
        stock: null,
        productTypeId: 1,
      }),
    );
    expect(await screen.findByText('TV LG 55')).toBeInTheDocument();
  });

  it('no crea un producto sin categoría y muestra un error', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.type(screen.getByLabelText('Nuevo producto'), 'TV SIN CATEGORÍA');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    expect(await screen.findByText('Selecciona una categoría para el producto')).toBeInTheDocument();
    expect(salesService.createProduct).not.toHaveBeenCalled();
  });

  it('no crea un producto con precio menor o igual a 0 y muestra un error', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.type(screen.getByLabelText('Nuevo producto'), 'TV PRECIO MAL');
    await user.type(screen.getByLabelText('Precio (opcional)'), '0');
    await user.selectOptions(screen.getByLabelText('Categoría *'), '1');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    expect(await screen.findByText('El precio debe ser mayor a 0')).toBeInTheDocument();
    expect(salesService.createProduct).not.toHaveBeenCalled();
  });

  it('no guarda un producto editado con precio menor o igual a 0 y muestra un error', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Editar producto HELADERA SAMSUNG 320L' }),
    );
    const priceInput = screen.getByLabelText('Precio (opcional)');
    await user.clear(priceInput);
    await user.type(priceInput, '0');
    await user.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('El precio debe ser mayor a 0')).toBeInTheDocument();
    expect(salesService.updateProduct).not.toHaveBeenCalled();
  });

  it('crea un producto con stock y lo envía', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.createProduct).mockResolvedValue(undefined);
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { id: 1, name: 'HELADERA SAMSUNG 320L', price: 500, productTypeId: 1, productTypeName: 'TV' },
      { id: 2, name: 'TV LG 55', price: 900, stock: 10, productTypeId: 1, productTypeName: 'TV' },
    ]);
    renderPagina();

    await user.type(screen.getByLabelText('Nuevo producto'), 'TV LG 55');
    await user.type(screen.getByLabelText('Stock (opcional)'), '10');
    await user.selectOptions(screen.getByLabelText('Categoría *'), '1');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    await waitFor(() =>
      expect(salesService.createProduct).toHaveBeenCalledWith({
        name: 'TV LG 55',
        price: null,
        stock: 10,
        productTypeId: 1,
      }),
    );
  });

  it('no crea un producto con stock negativo (el input lo bloquea nativamente)', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.type(screen.getByLabelText('Nuevo producto'), 'TV STOCK MAL');
    const stockInput = screen.getByLabelText('Stock (opcional)') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(stockInput, '-1');
    fireEvent.input(stockInput, { target: { value: '-1' } });
    await user.selectOptions(screen.getByLabelText('Categoría *'), '1');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    // El min="0" del input bloquea nativamente el submit con valor negativo (HTML
    // constraint validation) en jsdom; la guarda por estado cubre el caso real en browsers.
    expect(salesService.createProduct).not.toHaveBeenCalled();
  });

  it('muestra el stock del producto en el catálogo', async () => {
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { id: 1, name: 'HELADERA SAMSUNG 320L', price: 500, stock: 12, productTypeId: 1, productTypeName: 'TV' },
    ]);
    renderPagina();
    expect(await screen.findByText(/Stock: 12/)).toBeInTheDocument();
  });

  it('edita un producto y envía el stock modificado', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.updateProduct).mockResolvedValue(undefined);
    vi.mocked(salesService.getProducts)
      .mockResolvedValueOnce([
        { id: 1, name: 'HELADERA SAMSUNG 320L', price: 500, stock: 4, productTypeId: 1, productTypeName: 'TV' },
      ])
      .mockResolvedValue([
        { id: 1, name: 'HELADERA SAMSUNG 320L', price: 500, stock: 8, productTypeId: 1, productTypeName: 'TV' },
      ]);
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Editar producto HELADERA SAMSUNG 320L' }),
    );
    const stockInput = screen.getByLabelText('Stock (opcional)');
    await user.clear(stockInput);
    await user.type(stockInput, '8');
    await user.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(salesService.updateProduct).toHaveBeenCalledWith(1, {
        name: 'HELADERA SAMSUNG 320L',
        price: 500,
        stock: 8,
        productTypeId: 1,
      }),
    );
  });

  it('elimina un producto y recarga la lista', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.deleteProduct).mockResolvedValue(undefined);
    vi.mocked(salesService.getProducts)
      .mockResolvedValueOnce([
        { id: 1, name: 'HELADERA SAMSUNG 320L', price: 500, productTypeId: 1, productTypeName: 'TV' },
      ])
      .mockResolvedValue([]);
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Eliminar producto HELADERA SAMSUNG 320L' }),
    );

    await waitFor(() => expect(salesService.deleteProduct).toHaveBeenCalledWith(1));
    expect(await screen.findByText('No hay productos registrados.')).toBeInTheDocument();
  });

  it('muestra un error al eliminar un producto en uso', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.deleteProduct).mockRejectedValue(
      new Error('El producto está en uso y no se puede eliminar'),
    );
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Eliminar producto HELADERA SAMSUNG 320L' }),
    );

    expect(await screen.findByText('El producto está en uso y no se puede eliminar')).toBeInTheDocument();
    expect(screen.getByText('HELADERA SAMSUNG 320L')).toBeInTheDocument();
  });

  it('elimina una categoría y recarga la lista', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.deleteProductType).mockResolvedValue(undefined);
    let calls = 0;
    vi.mocked(salesService.getProductTypes).mockImplementation(async () => {
      calls += 1;
      return calls <= 2
        ? [
            { id: 1, name: 'TV' },
            { id: 2, name: 'CELULAR' },
          ]
        : [{ id: 2, name: 'CELULAR' }];
    });
    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Eliminar categoría TV' }));

    await waitFor(() => expect(salesService.deleteProductType).toHaveBeenCalledWith(1));
    await waitFor(() => expect(calls).toBeGreaterThan(2));
  });

  it('muestra un error al eliminar una categoría con productos', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.deleteProductType).mockRejectedValue(
      new Error('La categoría está en uso y no se puede eliminar'),
    );
    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Eliminar categoría TV' }));

    expect(await screen.findByText('La categoría está en uso y no se puede eliminar')).toBeInTheDocument();
    expect(screen.getAllByText('TV').length).toBeGreaterThan(0);
  });

  it('edita un producto cambiando nombre y categoría', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.updateProduct).mockResolvedValue(undefined);
    vi.mocked(salesService.getProducts)
      .mockResolvedValueOnce([
        { id: 1, name: 'HELADERA SAMSUNG 320L', price: 500, productTypeId: 1, productTypeName: 'TV' },
      ])
      .mockResolvedValue([
        { id: 1, name: 'HELADERA SAMSUNG 400L', price: 500, productTypeId: 2, productTypeName: 'CELULAR' },
      ]);
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Editar producto HELADERA SAMSUNG 320L' }),
    );

    const nameInput = screen.getByLabelText('Nuevo producto');
    await user.clear(nameInput);
    await user.type(nameInput, 'HELADERA SAMSUNG 400L');
    await user.selectOptions(screen.getByLabelText('Categoría *'), '2');
    await user.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(salesService.updateProduct).toHaveBeenCalledWith(1, {
        name: 'HELADERA SAMSUNG 400L',
        price: 500,
        stock: null,
        productTypeId: 2,
      }),
    );
    expect(await screen.findByText('HELADERA SAMSUNG 400L')).toBeInTheDocument();
  });

  it('no guarda un producto editado sin categoría y muestra un error', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Editar producto HELADERA SAMSUNG 320L' }),
    );
    await user.selectOptions(screen.getByLabelText('Categoría *'), '');
    await user.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Selecciona una categoría para el producto')).toBeInTheDocument();
    expect(salesService.updateProduct).not.toHaveBeenCalled();
  });

  it('renombra una categoría y recarga la lista', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.updateProductType).mockResolvedValue(undefined);
    let calls = 0;
    vi.mocked(salesService.getProductTypes).mockImplementation(async () => {
      calls += 1;
      return calls <= 2
        ? [
            { id: 1, name: 'TV' },
            { id: 2, name: 'CELULAR' },
          ]
        : [
            { id: 1, name: 'TELEVISORES' },
            { id: 2, name: 'CELULAR' },
          ];
    });
    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Editar categoría TV' }));

    const input = screen.getByLabelText('Nueva categoría');
    await user.clear(input);
    await user.type(input, 'TELEVISORES');
    await user.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(salesService.updateProductType).toHaveBeenCalledWith(1, 'TELEVISORES'));
    await waitFor(() => expect(calls).toBeGreaterThan(2));
  });

  it('muestra mensajes cuando el catálogo está vacío', async () => {
    vi.mocked(salesService.getProducts).mockResolvedValue([]);
    vi.mocked(salesService.getProductTypes).mockResolvedValue([]);
    renderPagina();
    expect(await screen.findByText('No hay categorías registradas.')).toBeInTheDocument();
    expect(screen.getByText('No hay productos registrados.')).toBeInTheDocument();
  });
});