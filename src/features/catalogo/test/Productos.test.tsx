import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    getAttributes: vi.fn(),
    createAttribute: vi.fn(),
    addAttributeValue: vi.fn(),
    deleteAttribute: vi.fn(),
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

type User = ReturnType<typeof userEvent.setup>;

const irATab = async (user: User, nombre: 'Productos' | 'Categorías' | 'Atributos') =>
  user.click(screen.getByRole('tab', { name: new RegExp(nombre) }));

const abrirFormProducto = async (user: User) => {
  await user.click(screen.getByRole('button', { name: 'Nuevo producto' }));
  return screen.getByRole('dialog');
};

/** Fila del catálogo: un producto simple con una variante. */
const productoSimple = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  variantId: 11,
  name: 'HELADERA SAMSUNG 320L',
  sku: 'HELADERA-1',
  cost: 400,
  price: 500,
  stock: 12,
  productTypeId: 1,
  productTypeName: 'TV',
  currency: 'ARS',
  active: true,
  productActive: true,
  attributes: [],
  ...overrides,
});

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
    vi.mocked(salesService.getAttributes).mockReset();
    vi.mocked(salesService.getAttributes).mockResolvedValue([]);
    vi.mocked(salesService.createAttribute).mockReset();
    vi.mocked(salesService.addAttributeValue).mockReset();
    vi.mocked(salesService.deleteAttribute).mockReset();
    vi.mocked(salesService.getProducts).mockReset();
    vi.mocked(salesService.getProducts).mockResolvedValue([productoSimple()]);
    vi.mocked(salesService.createProduct).mockReset();
    vi.mocked(salesService.updateProduct).mockReset();
    vi.mocked(salesService.deleteProduct).mockReset();
  });

  // ------------------------------------------------------------------
  // Listado, pestañas y variantes
  // ------------------------------------------------------------------

  it('lista productos agrupados por producto base y expande sus variantes', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProducts).mockResolvedValue([
      productoSimple(),
      productoSimple({ variantId: 12, name: 'HELADERA SAMSUNG 320L', variantLabel: 'Inox', sku: 'HEL-INO', stock: 3 }),
    ]);
    renderPagina();

    expect(await screen.findByText('HELADERA SAMSUNG 320L')).toBeInTheDocument();
    // Dos SKU del mismo producto: se agrupan bajo el producto base
    expect(screen.getByRole('button', { name: /2 variantes/ })).toBeInTheDocument();
    expect(screen.getByText(/Stock total: 15/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /2 variantes/ }));
    expect(await screen.findByText(/Inox · HEL-INO/)).toBeInTheDocument();
    expect(screen.getByText(/Stock: 12/)).toBeInTheDocument();
    expect(screen.getByText(/Stock: 3/)).toBeInTheDocument();
  });

  it('muestra los atributos de la variante con su nombre ("Color: Rojo")', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProducts).mockResolvedValue([
      productoSimple({
        name: 'Samsung Galaxy A16',
        sku: 'A16-4-ROJO',
        attributes: [
          { attributeId: 1, attributeName: 'Color', attributeValueId: 10, value: 'Rojo' },
          { attributeId: 2, attributeName: 'RAM', attributeValueId: 20, value: '4 GB' },
        ],
      }),
    ]);
    renderPagina();

    expect(await screen.findByText(/Color: Rojo · RAM: 4 GB/)).toBeInTheDocument();

    // La fila de la variante repite los atributos, ahora junto al SKU
    await user.click(screen.getByRole('button', { name: /1 variante/ }));
    expect(screen.getByText(/Color: Rojo · RAM: 4 GB · A16-4-ROJO/)).toBeInTheDocument();
  });

  it('resume los atributos de todas las variantes y busca por ellos', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProducts).mockResolvedValue([
      productoSimple({
        variantId: 11,
        sku: 'A16-4-ROJO',
        attributes: [
          { attributeId: 1, attributeName: 'Color', attributeValueId: 10, value: 'Rojo' },
          { attributeId: 2, attributeName: 'RAM', attributeValueId: 20, value: '4 GB' },
        ],
      }),
      productoSimple({
        variantId: 12,
        sku: 'A16-8-NEGRO',
        stock: 4,
        attributes: [
          { attributeId: 1, attributeName: 'Color', attributeValueId: 11, value: 'Negro' },
          { attributeId: 2, attributeName: 'RAM', attributeValueId: 21, value: '8 GB' },
        ],
      }),
      productoSimple({ id: 2, variantId: 21, name: 'TV LG 55', sku: 'TV-LG-1' }),
    ]);
    renderPagina();

    expect(await screen.findByText(/Color: Rojo \/ Negro · RAM: 4 GB \/ 8 GB/)).toBeInTheDocument();

    // La búsqueda mira también los atributos: por valor…
    await user.type(screen.getByLabelText('Buscar productos'), 'negro');
    expect(screen.getByText('HELADERA SAMSUNG 320L')).toBeInTheDocument();
    expect(screen.queryByText('TV LG 55')).not.toBeInTheDocument();

    // …y por nombre de atributo
    await user.clear(screen.getByLabelText('Buscar productos'));
    await user.type(screen.getByLabelText('Buscar productos'), 'ram');
    expect(screen.getByText('HELADERA SAMSUNG 320L')).toBeInTheDocument();
    expect(screen.queryByText('TV LG 55')).not.toBeInTheDocument();
  });

  it('muestra el árbol de categorías en su pestaña', async () => {
    const user = userEvent.setup();
    renderPagina();

    await irATab(user, 'Categorías');
    expect(await screen.findByText('TV')).toBeInTheDocument();
    expect(screen.getByText('CELULAR')).toBeInTheDocument();
  });

  it('muestra el stock de cada variante en el catálogo', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(await screen.findByRole('button', { name: /1 variante/ }));
    expect(await screen.findByText(/Stock: 12/)).toBeInTheDocument();
  });

  it('muestra mensajes cuando el catálogo está vacío', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProducts).mockResolvedValue([]);
    vi.mocked(salesService.getProductTypes).mockResolvedValue([]);
    renderPagina();

    expect(await screen.findByText('No hay productos registrados.')).toBeInTheDocument();
    await irATab(user, 'Categorías');
    expect(await screen.findByText('No hay categorías registradas.')).toBeInTheDocument();
    await irATab(user, 'Atributos');
    expect(await screen.findByText('No hay atributos registrados.')).toBeInTheDocument();
  });

  // ------------------------------------------------------------------
  // Búsqueda y filtros
  // ------------------------------------------------------------------

  it('busca productos por nombre y filtra por estado', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProducts).mockResolvedValue([
      productoSimple(),
      productoSimple({
        id: 2,
        variantId: 21,
        name: 'TV LG 55',
        sku: 'TV-LG-1',
        cost: 700,
        price: 900,
        stock: 10,
        productActive: false,
      }),
    ]);
    renderPagina();

    await user.type(await screen.findByLabelText('Buscar productos'), 'lg');
    expect(await screen.findByText('TV LG 55')).toBeInTheDocument();
    expect(screen.queryByText('HELADERA SAMSUNG 320L')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Buscar productos'));
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'inactivo');
    expect(await screen.findByText('TV LG 55')).toBeInTheDocument();
    expect(screen.queryByText('HELADERA SAMSUNG 320L')).not.toBeInTheDocument();
  });

  it('el filtro por una categoría padre incluye sus subcategorías', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProductTypes).mockResolvedValue([
      { id: 10, name: 'CELULARES' },
      { id: 11, name: 'SAMSUNG', parentId: 10 },
      { id: 20, name: 'TV' },
    ]);
    vi.mocked(salesService.getProducts).mockResolvedValue([
      productoSimple({
        id: 1,
        variantId: 11,
        name: 'A16',
        sku: 'A16-1',
        productTypeId: 11,
        productTypeName: 'SAMSUNG',
      }),
      productoSimple({
        id: 2,
        variantId: 21,
        name: 'TV LG 55',
        sku: 'TV-LG-1',
        productTypeId: 20,
        productTypeName: 'TV',
      }),
    ]);
    renderPagina();

    await user.selectOptions(await screen.findByLabelText('Filtrar por categoría'), '10');

    expect(await screen.findByText('A16')).toBeInTheDocument();
    expect(screen.queryByText('TV LG 55')).not.toBeInTheDocument();
  });

  it('limpia los filtros cuando no hay resultados', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.type(await screen.findByLabelText('Buscar productos'), 'zzz');
    expect(await screen.findByText('No hay productos que coincidan con la búsqueda.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(await screen.findByText('HELADERA SAMSUNG 320L')).toBeInTheDocument();
  });

  // ------------------------------------------------------------------
  // Categorías
  // ------------------------------------------------------------------

  it('crea una categoría con padre y slug', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.createProductType).mockResolvedValue({ id: 3, name: 'ROPA' });
    vi.mocked(salesService.getProductTypes).mockResolvedValue([
      { id: 1, name: 'TV' },
      { id: 2, name: 'CELULAR' },
      { id: 3, name: 'ROPA' },
    ]);
    renderPagina();

    await irATab(user, 'Categorías');
    await user.click(screen.getByRole('button', { name: 'Nueva categoría' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'ROPA');
    await user.selectOptions(within(dialog).getByLabelText('Categoría padre (opcional)'), '1');
    await user.click(within(dialog).getByText('Configuración avanzada'));
    await user.type(within(dialog).getByLabelText('Slug (opcional)'), 'ropa');
    await user.click(within(dialog).getByRole('button', { name: 'Crear categoría' }));

    await waitFor(() =>
      expect(salesService.createProductType).toHaveBeenCalledWith({ name: 'ROPA', parentId: 1, slug: 'ropa' }),
    );
    expect(await screen.findByText('ROPA')).toBeInTheDocument();
  });

  it('crea una subcategoría desde el nodo del árbol', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.createProductType).mockResolvedValue({ id: 3, name: 'Smart TV' });
    renderPagina();

    await irATab(user, 'Categorías');
    await user.click(await screen.findByRole('button', { name: 'Agregar subcategoría en TV' }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^Nombre/), 'Smart TV');
    await user.click(within(dialog).getByRole('button', { name: 'Crear categoría' }));

    await waitFor(() =>
      expect(salesService.createProductType).toHaveBeenCalledWith({ name: 'Smart TV', parentId: 1, slug: null }),
    );
  });

  it('avisa que los productos quedan en la categoría padre al crear una subcategoría', async () => {
    const user = userEvent.setup();
    renderPagina();

    await irATab(user, 'Categorías');
    await user.click(await screen.findByRole('button', { name: 'Nueva categoría' }));
    const dialog = screen.getByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText('Categoría padre (opcional)'), '1');

    expect(await within(dialog).findByText(/«TV» tiene 1 producto asignado/)).toBeInTheDocument();
  });

  it('renombra una categoría y recarga la lista', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.updateProductType).mockResolvedValue(undefined);
    // El sidebar y la página cargan categorías al montar (2 llamadas);
    // la tercera es la recarga posterior a guardar.
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

    await irATab(user, 'Categorías');
    await user.click(await screen.findByRole('button', { name: 'Editar categoría TV' }));

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText(/^Nombre/);
    await user.clear(input);
    await user.type(input, 'TELEVISORES');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(salesService.updateProductType).toHaveBeenCalledWith(1, {
        name: 'TELEVISORES',
        parentId: null,
        slug: null,
      }),
    );
    expect(await screen.findByText('TELEVISORES')).toBeInTheDocument();
  });

  it('elimina una categoría tras confirmar y recarga la lista', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.deleteProductType).mockResolvedValue(undefined);
    // Sidebar + página cargan al montar; la tercera llamada es la recarga.
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

    await irATab(user, 'Categorías');
    await user.click(await screen.findByRole('button', { name: 'Eliminar categoría TV' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(salesService.deleteProductType).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText('TV')).not.toBeInTheDocument());
  });

  it('no borra una categoría si se cancela la confirmación', async () => {
    const user = userEvent.setup();
    renderPagina();

    await irATab(user, 'Categorías');
    await user.click(await screen.findByRole('button', { name: 'Eliminar categoría TV' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(salesService.deleteProductType).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra un error al eliminar una categoría con productos', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.deleteProductType).mockRejectedValue(
      new Error('La categoría está en uso y no se puede eliminar'),
    );
    renderPagina();

    await irATab(user, 'Categorías');
    await user.click(await screen.findByRole('button', { name: 'Eliminar categoría TV' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText('La categoría está en uso y no se puede eliminar')).toBeInTheDocument();
  });

  // ------------------------------------------------------------------
  // Productos: alta, edición y borrado
  // ------------------------------------------------------------------

  it('crea un producto simple con costo, precio y stock', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.createProduct).mockResolvedValue(undefined);
    vi.mocked(salesService.getProducts).mockResolvedValue([
      productoSimple(),
      productoSimple({ id: 2, variantId: 21, name: 'TV LG 55', sku: 'TV-LG-1', cost: 700, price: 900, stock: 10 }),
    ]);
    renderPagina();

    const dialog = await abrirFormProducto(user);
    await user.type(within(dialog).getByLabelText(/Nombre del producto/), 'TV LG 55');
    await user.selectOptions(within(dialog).getByLabelText('Categoría *'), '1');
    await user.type(within(dialog).getByLabelText('Costo *'), '700');
    await user.type(within(dialog).getByLabelText('Precio de venta *'), '900');
    await user.clear(within(dialog).getByLabelText('Stock *'));
    await user.type(within(dialog).getByLabelText('Stock *'), '10');
    await user.click(within(dialog).getByRole('button', { name: 'Crear producto' }));

    await waitFor(() =>
      expect(salesService.createProduct).toHaveBeenCalledWith({
        name: 'TV LG 55',
        description: null,
        brand: null,
        active: true,
        productTypeId: 1,
        attributeIds: [],
        currency: 'ARS',
        variants: [
          {
            sku: null,
            cost: 700,
            price: 900,
            stock: 10,
            barcode: null,
            active: true,
            attributeValueIds: [],
          },
        ],
      }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('TV LG 55')).toBeInTheDocument();
    expect(await screen.findByText('Producto creado')).toBeInTheDocument();
  });

  it('crea un producto en la moneda elegida y la envía', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.createProduct).mockResolvedValue(undefined);
    renderPagina();

    const dialog = await abrirFormProducto(user);
    await user.type(within(dialog).getByLabelText(/Nombre del producto/), 'TV EN DÓLARES');
    await user.selectOptions(within(dialog).getByLabelText('Moneda del precio'), 'USD');
    await user.selectOptions(within(dialog).getByLabelText('Categoría *'), '1');
    await user.type(within(dialog).getByLabelText('Costo *'), '200');
    await user.type(within(dialog).getByLabelText('Precio de venta *'), '300');
    await user.click(within(dialog).getByRole('button', { name: 'Crear producto' }));

    await waitFor(() =>
      expect(salesService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'TV EN DÓLARES', currency: 'USD' }),
      ),
    );
  });

  it('sugiere la moneda del negocio y no deja cambiarla al editar', async () => {
    const user = userEvent.setup();
    renderPagina();

    // Alta: la sugerencia es la moneda configurada en el negocio
    const dialog = await abrirFormProducto(user);
    expect(within(dialog).getByLabelText('Moneda del precio')).toHaveValue('ARS');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await user.click(
      await screen.findByRole('button', { name: 'Editar producto HELADERA SAMSUNG 320L' }),
    );

    // Edición: los precios se editan en la moneda que el producto ya tiene
    expect(within(screen.getByRole('dialog')).getByLabelText('Moneda del precio')).toBeDisabled();
  });

  it('el alta no permite elegir categorías que agrupan subcategorías', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProductTypes).mockResolvedValue([
      { id: 10, name: 'CELULARES' },
      { id: 11, name: 'SAMSUNG', parentId: 10 },
    ]);
    renderPagina();

    const dialog = await abrirFormProducto(user);
    const select = within(dialog).getByLabelText('Categoría *');

    expect(within(select).getByRole('option', { name: /CELULARES/ })).toBeDisabled();
    expect(within(select).getByRole('option', { name: /SAMSUNG/ })).toBeEnabled();
    // La hoja se ofrece indentada bajo su padre
    expect(within(select).getByRole('option', { name: /SAMSUNG/ })).toHaveTextContent('— SAMSUNG');
  });

  it('conserva la categoría de un producto viejo que quedó en un padre y avisa', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProductTypes).mockResolvedValue([
      { id: 10, name: 'TELEVISORES' },
      { id: 11, name: 'SMART TV', parentId: 10 },
    ]);
    vi.mocked(salesService.getProducts).mockResolvedValue([
      productoSimple({ productTypeId: 10, productTypeName: 'TELEVISORES' }),
    ]);
    vi.mocked(salesService.updateProduct).mockResolvedValue(undefined);
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Editar producto HELADERA SAMSUNG 320L' }),
    );
    const dialog = screen.getByRole('dialog');

    // La categoría actual se mantiene y se explica que conviene moverla
    expect(within(dialog).getByLabelText('Categoría *')).toHaveValue('10');
    expect(within(dialog).getByText(/agrupa subcategorías/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() =>
      expect(salesService.updateProduct).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ productTypeId: 10 }),
      ),
    );
  });

  it('edita un producto y envía el stock modificado de su variante', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.updateProduct).mockResolvedValue(undefined);
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Editar producto HELADERA SAMSUNG 320L' }),
    );
    const dialog = screen.getByRole('dialog');
    const stockInput = within(dialog).getByLabelText('Stock *');
    await user.clear(stockInput);
    await user.type(stockInput, '8');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(salesService.updateProduct).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'HELADERA SAMSUNG 320L',
          productTypeId: 1,
          variants: [
            expect.objectContaining({ id: 11, sku: 'HELADERA-1', cost: 400, price: 500, stock: 8 }),
          ],
        }),
      ),
    );
    expect(await screen.findByText('Producto actualizado')).toBeInTheDocument();
  });

  it('no crea un producto sin categoría y muestra un error', async () => {
    const user = userEvent.setup();
    renderPagina();

    const dialog = await abrirFormProducto(user);
    await user.type(within(dialog).getByLabelText(/Nombre del producto/), 'TV SIN CATEGORÍA');
    await user.click(within(dialog).getByRole('button', { name: 'Crear producto' }));

    expect(await screen.findByText('Elegí una categoría')).toBeInTheDocument();
    expect(salesService.createProduct).not.toHaveBeenCalled();
  });

  it('no crea un producto con precio menor o igual al costo y muestra un error', async () => {
    const user = userEvent.setup();
    renderPagina();

    const dialog = await abrirFormProducto(user);
    await user.type(within(dialog).getByLabelText(/Nombre del producto/), 'TV PRECIO MAL');
    await user.selectOptions(within(dialog).getByLabelText('Categoría *'), '1');
    await user.type(within(dialog).getByLabelText('Costo *'), '500');
    await user.type(within(dialog).getByLabelText('Precio de venta *'), '500');
    await user.click(within(dialog).getByRole('button', { name: 'Crear producto' }));

    expect(await screen.findByText('El precio de venta de variante 1 debe ser mayor al costo')).toBeInTheDocument();
    expect(salesService.createProduct).not.toHaveBeenCalled();
  });

  it('no crea un producto con stock negativo', async () => {
    const user = userEvent.setup();
    renderPagina();

    const dialog = await abrirFormProducto(user);
    await user.type(within(dialog).getByLabelText(/Nombre del producto/), 'TV STOCK MAL');
    await user.selectOptions(within(dialog).getByLabelText('Categoría *'), '1');
    await user.type(within(dialog).getByLabelText('Costo *'), '100');
    await user.type(within(dialog).getByLabelText('Precio de venta *'), '200');
    const stockInput = within(dialog).getByLabelText('Stock *') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(stockInput, '-1');
    fireEvent.input(stockInput, { target: { value: '-1' } });
    await user.click(within(dialog).getByRole('button', { name: 'Crear producto' }));

    expect(
      await screen.findByText('El stock de variante 1 debe ser un número entero mayor o igual a 0'),
    ).toBeInTheDocument();
    expect(salesService.createProduct).not.toHaveBeenCalled();
  });

  it('no guarda un producto editado sin categoría y muestra un error', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Editar producto HELADERA SAMSUNG 320L' }),
    );
    const dialog = screen.getByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText('Categoría *'), '');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Elegí una categoría')).toBeInTheDocument();
    expect(salesService.updateProduct).not.toHaveBeenCalled();
  });

  it('elimina un producto tras confirmar y recarga la lista', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.deleteProduct).mockResolvedValue(undefined);
    vi.mocked(salesService.getProducts).mockResolvedValueOnce([productoSimple()]).mockResolvedValue([]);
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Eliminar producto HELADERA SAMSUNG 320L' }),
    );
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(salesService.deleteProduct).toHaveBeenCalledWith(1));
    expect(await screen.findByText('No hay productos registrados.')).toBeInTheDocument();
  });

  it('no borra un producto si se cancela la confirmación', async () => {
    const user = userEvent.setup();
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Eliminar producto HELADERA SAMSUNG 320L' }),
    );
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));

    expect(salesService.deleteProduct).not.toHaveBeenCalled();
    expect(await screen.findByText('HELADERA SAMSUNG 320L')).toBeInTheDocument();
  });

  it('muestra un error al eliminar un producto en uso', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.deleteProduct).mockRejectedValue(
      new Error('El producto tiene ventas asociadas; desactivalo en lugar de eliminarlo'),
    );
    renderPagina();

    await user.click(
      await screen.findByRole('button', { name: 'Eliminar producto HELADERA SAMSUNG 320L' }),
    );
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    expect(
      await screen.findByText('El producto tiene ventas asociadas; desactivalo en lugar de eliminarlo'),
    ).toBeInTheDocument();
    expect(screen.getByText('HELADERA SAMSUNG 320L')).toBeInTheDocument();
  });

  // ------------------------------------------------------------------
  // Atributos y variantes
  // ------------------------------------------------------------------

  it('crea un atributo con sus valores', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.createAttribute).mockResolvedValue({
      id: 1,
      name: 'Color',
      values: [
        { id: 10, value: 'Rojo' },
        { id: 11, value: 'Azul' },
      ],
    });
    vi.mocked(salesService.getAttributes).mockResolvedValue([
      { id: 1, name: 'Color', values: [{ id: 10, value: 'Rojo' }, { id: 11, value: 'Azul' }] },
    ]);
    renderPagina();

    await irATab(user, 'Atributos');
    await user.type(screen.getByLabelText(/^Nuevo atributo/), 'Color');
    await user.type(screen.getByLabelText('Valores (separados por coma)'), 'Rojo, Azul');
    await user.click(screen.getByRole('button', { name: 'Crear atributo' }));

    await waitFor(() =>
      expect(salesService.createAttribute).toHaveBeenCalledWith({ name: 'Color', values: ['Rojo', 'Azul'] }),
    );
    expect(await screen.findByText('Rojo')).toBeInTheDocument();
  });

  it('agrega un valor a un atributo existente', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getAttributes).mockResolvedValue([
      { id: 1, name: 'Color', values: [{ id: 10, value: 'Rojo' }] },
    ]);
    vi.mocked(salesService.addAttributeValue).mockResolvedValue({
      id: 1,
      name: 'Color',
      values: [{ id: 10, value: 'Rojo' }, { id: 11, value: 'Verde' }],
    });
    renderPagina();

    await irATab(user, 'Atributos');
    const input = await screen.findByLabelText('Agregar valor a Color');
    await user.type(input, 'Verde');
    const tarjeta = input.closest('li') as HTMLElement;
    await user.click(within(tarjeta).getByRole('button', { name: 'Agregar' }));

    await waitFor(() => expect(salesService.addAttributeValue).toHaveBeenCalledWith(1, 'Verde'));
  });

  it('elimina un atributo tras confirmar', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getAttributes).mockResolvedValue([
      { id: 1, name: 'Color', values: [{ id: 10, value: 'Rojo' }] },
    ]);
    vi.mocked(salesService.deleteAttribute).mockResolvedValue(undefined);
    renderPagina();

    await irATab(user, 'Atributos');
    await user.click(await screen.findByRole('button', { name: 'Eliminar atributo Color' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(salesService.deleteAttribute).toHaveBeenCalledWith(1));
  });

  it('genera una variante por combinación al elegir atributos', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getAttributes).mockResolvedValue([
      { id: 1, name: 'Color', values: [{ id: 10, value: 'Rojo' }, { id: 11, value: 'Azul' }] },
    ]);
    renderPagina();

    const dialog = await abrirFormProducto(user);
    await user.click(within(dialog).getByRole('button', { name: 'Color' }));

    // Dos valores: dos variantes, cada una con su selector de Color
    expect(within(dialog).getByText('Variantes (2)')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Color de la variante 1')).toHaveValue('10');
    expect(within(dialog).getByLabelText('Color de la variante 2')).toHaveValue('11');

    await user.type(within(dialog).getByLabelText(/Nombre del producto/), 'Remera');
    await user.selectOptions(within(dialog).getByLabelText('Categoría *'), '1');
    const costos = within(dialog).getAllByLabelText('Costo *');
    const precios = within(dialog).getAllByLabelText('Precio de venta *');
    for (const input of costos) {
      await user.type(input, '100');
    }
    for (const input of precios) {
      await user.type(input, '200');
    }
    await user.click(within(dialog).getByRole('button', { name: 'Crear producto' }));

    await waitFor(() =>
      expect(salesService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Remera',
          attributeIds: [1],
          variants: [
            expect.objectContaining({ cost: 100, price: 200, attributeValueIds: [10] }),
            expect.objectContaining({ cost: 100, price: 200, attributeValueIds: [11] }),
          ],
        }),
      ),
    );
  });

  it('no deja quitar la única variante del producto', async () => {
    const user = userEvent.setup();
    renderPagina();

    const dialog = await abrirFormProducto(user);
    await user.click(within(dialog).getByRole('button', { name: 'Quitar variante 1' }));

    expect(await screen.findByText('El producto debe tener al menos una variante')).toBeInTheDocument();
  });

  it('avisa cuando la combinación de atributos supera el máximo', async () => {
    const user = userEvent.setup();
    const muchosValores = Array.from({ length: 201 }, (_, i) => ({ id: 100 + i, value: `V${i}` }));
    vi.mocked(salesService.getAttributes).mockResolvedValue([
      { id: 1, name: 'Color', values: muchosValores },
    ]);
    renderPagina();

    const dialog = await abrirFormProducto(user);
    await user.click(within(dialog).getByRole('button', { name: 'Color' }));

    // 201 combinaciones superan el máximo: no se generan
    expect(await screen.findByText(/No se pudieron generar las variantes/)).toBeInTheDocument();
    expect(within(dialog).getByText('Variantes (1)')).toBeInTheDocument();
  });
});
