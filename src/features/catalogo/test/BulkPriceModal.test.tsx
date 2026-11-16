import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkPriceModal from '../components/BulkPriceModal';
import { salesService } from '@/features/ventas/services/salesServices';
import type { BulkPriceResult, ProductDto, ProductTypeDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    previewBulkPrice: vi.fn(),
    applyBulkPrice: vi.fn(),
    getPriceHistory: vi.fn(),
  },
}));

const productos: ProductDto[] = [
  {
    id: 1,
    variantId: 11,
    name: 'TV 32',
    sku: 'TV-1',
    price: 1000,
    cost: 600,
    currency: 'ARS',
    stock: 3,
    active: true,
    productTypeId: 5,
  },
  {
    id: 2,
    variantId: 22,
    name: 'Radio',
    sku: 'RA-1',
    price: 500,
    cost: 300,
    currency: 'ARS',
    stock: 2,
    active: true,
    productTypeId: 5,
  },
];

const categorias: ProductTypeDto[] = [{ id: 5, name: 'Audio', parentId: null, slug: 'audio' }];

const previewConCambios: BulkPriceResult = {
  rows: [
    {
      variantId: 11,
      productId: 1,
      productName: 'TV 32',
      sku: 'TV-1',
      variantLabel: '',
      currency: 'ARS',
      oldPrice: 1000,
      newPrice: 1100,
      oldCost: 600,
      newCost: 660,
      changed: true,
    },
    {
      variantId: 22,
      productId: 2,
      productName: 'Radio',
      sku: 'RA-1',
      variantLabel: '',
      currency: 'ARS',
      oldPrice: 500,
      newPrice: 550,
      oldCost: 300,
      newCost: 330,
      changed: true,
    },
  ],
  totalCount: 2,
  changedCount: 2,
  unchangedCount: 0,
  batchId: null,
};

const renderModal = (onClose = vi.fn(), onApplied = vi.fn()) =>
  render(
    <BulkPriceModal
      isOpen
      products={productos}
      categories={categorias}
      onClose={onClose}
      onApplied={onApplied}
    />,
  );

describe('BulkPriceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pide el preview con el criterio cargado y aplica lo que se vio', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.previewBulkPrice).mockResolvedValue(previewConCambios);
    vi.mocked(salesService.applyBulkPrice).mockResolvedValue({
      ...previewConCambios,
      batchId: 'lote-1',
    });
    const onClose = vi.fn();
    const onApplied = vi.fn();
    renderModal(onClose, onApplied);

    await user.type(screen.getByLabelText('Porcentaje'), '10');
    await user.click(screen.getByRole('button', { name: /Ver cambios/i }));

    await waitFor(() =>
      expect(salesService.previewBulkPrice).toHaveBeenCalledWith({
        scope: 'ALL',
        categoryId: null,
        variantIds: [],
        mode: 'PERCENT',
        value: 10,
        adjustCost: true,
        roundTo: null,
      }),
    );

    // El preview muestra el antes y el después de cada SKU.
    expect(await screen.findByText('2 SKUs cambian:')).toBeInTheDocument();
    expect(screen.getByText('TV 32')).toBeInTheDocument();
    expect(screen.getByText('Radio')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Aplicar a 2 SKUs/i }));

    await waitFor(() => expect(salesService.applyBulkPrice).toHaveBeenCalledTimes(1));
    expect(onApplied).toHaveBeenCalledWith('Precios actualizados en 2 SKUs');
    expect(onClose).toHaveBeenCalled();
  });

  it('anula el preview cuando cambia el criterio', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.previewBulkPrice).mockResolvedValue(previewConCambios);
    renderModal();

    await user.type(screen.getByLabelText('Porcentaje'), '10');
    await user.click(screen.getByRole('button', { name: /Ver cambios/i }));
    expect(await screen.findByRole('button', { name: /Aplicar a 2 SKUs/i })).toBeEnabled();

    await user.type(screen.getByLabelText('Porcentaje'), '5');

    // Un preview viejo no se puede aplicar: la acción principal vuelve a calcular.
    expect(screen.queryByRole('button', { name: /Aplicar/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver cambios/i })).toBeEnabled();
    expect(screen.queryByText('2 SKUs cambian:')).not.toBeInTheDocument();
  });

  it('no deja una acción muerta cuando el preview no cambia nada', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.previewBulkPrice).mockResolvedValue({
      ...previewConCambios,
      rows: previewConCambios.rows.map((fila) => ({ ...fila, newPrice: fila.oldPrice, newCost: fila.oldCost, changed: false })),
      changedCount: 0,
      unchangedCount: 2,
    });
    renderModal();

    await user.type(screen.getByLabelText('Porcentaje'), '10');
    await user.click(screen.getByRole('button', { name: /Ver cambios/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('no cambia ningún precio');
    // Sin cambios no hay nada que aplicar: la acción principal sigue siendo calcular.
    expect(screen.queryByRole('button', { name: /Aplicar/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver cambios/i })).toBeEnabled();
  });

  it('muestra el mensaje del backend cuando el ajuste rompe una regla', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.previewBulkPrice).mockRejectedValue(
      new Error('El ajuste deja el precio del SKU TV-1 por debajo de su costo. Ajustá también el costo o cambiá el valor.'),
    );
    renderModal();

    await user.type(screen.getByLabelText('Porcentaje'), '-90');
    await user.click(screen.getByRole('button', { name: /Ver cambios/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('por debajo de su costo');
  });

  it('exige elegir al menos un SKU y manda los elegidos', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.previewBulkPrice).mockResolvedValue(previewConCambios);
    renderModal();

    await user.selectOptions(screen.getByLabelText('Alcance'), 'VARIANTS');
    await user.type(screen.getByLabelText('Porcentaje'), '10');
    await user.click(screen.getByRole('button', { name: /Ver cambios/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Elegí al menos un SKU');
    expect(salesService.previewBulkPrice).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: /TV 32/i }));
    await user.click(screen.getByRole('button', { name: /Ver cambios/i }));

    await waitFor(() =>
      expect(salesService.previewBulkPrice).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'VARIANTS', variantIds: [11] }),
      ),
    );
  });

  it('no deja ver cambios con un valor en cero', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText('Porcentaje'), '0');
    await user.click(screen.getByRole('button', { name: /Ver cambios/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('distinto de cero');
    expect(salesService.previewBulkPrice).not.toHaveBeenCalled();
  });
});