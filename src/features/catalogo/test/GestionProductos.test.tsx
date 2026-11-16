import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GestionProductos from '../components/GestionProductos';
import { salesService } from '@/features/ventas/services/salesServices';
import type { ProductDto, ProductTypeDto } from '@/shared/types/sales';

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
    productActive: true,
    variantActive: true,
    productTypeId: 5,
    productTypeName: 'Audio',
  },
];

const categorias: ProductTypeDto[] = [{ id: 5, name: 'Audio', parentId: null, slug: 'audio' }];

const renderGestion = () =>
  render(
    <GestionProductos
      products={productos}
      categories={categorias}
      attributes={[]}
      loading={false}
      loadError={null}
      onReload={vi.fn()}
      feedback={null}
      onFeedback={vi.fn()}
    />,
  );

describe('GestionProductos · ajuste masivo e historial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre el ajuste masivo desde el catálogo', async () => {
    const user = userEvent.setup();
    renderGestion();

    await user.click(screen.getByRole('button', { name: 'Ajuste masivo' }));

    expect(screen.getByRole('dialog', { name: 'Ajuste masivo de precios' })).toBeInTheDocument();
  });

  it('abre el historial de precios del producto', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getPriceHistory).mockResolvedValue([]);
    renderGestion();

    await user.click(screen.getByRole('button', { name: 'Historial de precios de TV 32' }));

    await waitFor(() => expect(salesService.getPriceHistory).toHaveBeenCalledWith(1));
    expect(screen.getByRole('dialog', { name: 'Historial de precios · TV 32' })).toBeInTheDocument();
  });
});