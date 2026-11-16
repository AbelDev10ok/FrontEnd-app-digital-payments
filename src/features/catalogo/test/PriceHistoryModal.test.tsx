import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PriceHistoryModal from '../components/PriceHistoryModal';
import { salesService } from '@/features/ventas/services/salesServices';
import type { PriceChangeDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getPriceHistory: vi.fn(),
  },
}));

const cambio: PriceChangeDto = {
  id: 1,
  variantId: 11,
  productId: 1,
  productName: 'TV 32',
  sku: 'TV-1',
  currency: 'ARS',
  oldPrice: 1000,
  newPrice: 1100,
  oldCost: 600,
  newCost: 660,
  adjustmentMode: 'PERCENT',
  adjustmentValue: 10,
  adjustCost: true,
  roundTo: null,
  batchId: 'lote-1',
  createdAt: '2026-11-11T15:30:00',
  createdBy: 'duenio@negocio.com',
};

describe('PriceHistoryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista los cambios con quién los hizo y de qué a qué valor', async () => {
    vi.mocked(salesService.getPriceHistory).mockResolvedValue([cambio]);
    render(<PriceHistoryModal productId={1} productName="TV 32" onClose={vi.fn()} />);

    expect(await screen.findByText('TV-1')).toBeInTheDocument();
    expect(screen.getByText('duenio@negocio.com')).toBeInTheDocument();
    expect(screen.getByText('+10%')).toBeInTheDocument();
    expect(salesService.getPriceHistory).toHaveBeenCalledWith(1);
  });

  it('avisa cuando el producto todavía no tiene cambios', async () => {
    vi.mocked(salesService.getPriceHistory).mockResolvedValue([]);
    render(<PriceHistoryModal productId={2} productName="Radio" onClose={vi.fn()} />);

    expect(
      await screen.findByText('Todavía no hay cambios de precio registrados para este producto.'),
    ).toBeInTheDocument();
  });

  it('muestra el error del backend', async () => {
    vi.mocked(salesService.getPriceHistory).mockRejectedValue(new Error('Recurso no encontrado'));
    render(<PriceHistoryModal productId={3} productName="TV 32" onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Recurso no encontrado'));
  });

  it('no pide nada mientras está cerrado', () => {
    render(<PriceHistoryModal productId={null} productName="" onClose={vi.fn()} />);
    expect(salesService.getPriceHistory).not.toHaveBeenCalled();
  });
});