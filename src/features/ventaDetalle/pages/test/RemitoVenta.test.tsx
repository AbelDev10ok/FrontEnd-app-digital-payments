import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RemitoVenta from '../RemitoVenta';
import { salesService } from '@/features/ventas/services/salesServices';
import type { SaleDocumentDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getRemito: vi.fn(),
  },
}));

const documento: SaleDocumentDto = {
  id: 33,
  type: 'REMITO',
  number: 1,
  numberLabel: '000001',
  issuedAt: '2026-06-02T10:30:00',
  saleId: 10,
  saleDate: '2026-06-01',
  businessName: 'Cobros del Sur',
  businessAddress: 'Av. Siempre Viva 123',
  businessTaxId: '20123456789',
  businessPhone: '1144556677',
  clientName: 'Juana Pérez',
  clientDoc: '30111222',
  clientAddress: 'Calle Falsa 742',
  clientPhone: '1144445555',
  productName: 'Televisor 32 pulgadas',
  variantLabel: 'Color: Negro',
  sku: 'TV-32-NEGRO',
  quantity: 2,
  unitPrice: 50000,
  subtotal: 100000,
  total: 100000,
  currency: 'ARS',
  notes: 'Entregar por la tarde',
};

const renderPagina = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/ventas/10/remito']}>
      <Routes>
        <Route path="/dashboard/ventas/:id/remito" element={<RemitoVenta />} />
        <Route path="/dashboard/ventas/:id" element={<div>detalle de la venta</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RemitoVenta', () => {
  beforeEach(() => {
    vi.mocked(salesService.getRemito).mockReset();
    vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el documento con los datos del snapshot', async () => {
    vi.mocked(salesService.getRemito).mockResolvedValue(documento);

    renderPagina();

    expect(await screen.findByText('REMITO')).toBeInTheDocument();
    expect(screen.getByText('N° 000001')).toBeInTheDocument();
    expect(screen.getByText(/Emisión: 02\/06\/2026, 10:30/)).toBeInTheDocument();
    expect(document.title).toBe('Remito N° 000001 · Cobros del Sur');
    expect(screen.getByText('Cobros del Sur')).toBeInTheDocument();
    expect(screen.getByText('CUIT: 20123456789')).toBeInTheDocument();
    expect(screen.getByText('Juana Pérez')).toBeInTheDocument();
    expect(screen.getByText('TV-32-NEGRO')).toBeInTheDocument();
    expect(screen.getByText('Color: Negro')).toBeInTheDocument();
    expect(screen.getByText('Entregar por la tarde')).toBeInTheDocument();
    expect(screen.getByText('Documento no válido como factura.')).toBeInTheDocument();
    expect(screen.getByText('Entregado por')).toBeInTheDocument();
    expect(screen.getByText('Recibido por')).toBeInTheDocument();
  });

  it('imprime solo cuando el usuario toca Imprimir', async () => {
    vi.mocked(salesService.getRemito).mockResolvedValue(documento);

    renderPagina();
    await screen.findByText('REMITO');

    expect(window.print).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Imprimir/ }));

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('marca ANULADO el remito de una venta anulada', async () => {
    vi.mocked(salesService.getRemito).mockResolvedValue({
      ...documento,
      saleStatus: 'CANCELED',
    });

    renderPagina();

    expect(await screen.findByText('Anulado')).toBeInTheDocument();
    expect(
      screen.getByText(/no debe usarse como comprobante vigente/),
    ).toBeInTheDocument();
  });

  it('no marca ANULADO el remito de una venta vigente', async () => {
    vi.mocked(salesService.getRemito).mockResolvedValue({
      ...documento,
      saleStatus: 'COMPLETED',
    });

    renderPagina();
    await screen.findByText('REMITO');

    expect(screen.queryByText('Anulado')).not.toBeInTheDocument();
  });

  it('explica cómo emitir el remito cuando la venta todavía no tiene uno', async () => {
    vi.mocked(salesService.getRemito).mockResolvedValue(null);

    renderPagina();

    expect(
      await screen.findByText('Esta venta todavía no tiene remito'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver a la venta' })).toBeInTheDocument();
  });

  it('muestra el error del backend si no se puede cargar', async () => {
    vi.mocked(salesService.getRemito).mockRejectedValue(new Error('Venta no encontrada'));

    renderPagina();

    await waitFor(() =>
      expect(screen.getByText('No se pudo cargar el remito')).toBeInTheDocument(),
    );
    expect(screen.getByText('Venta no encontrada')).toBeInTheDocument();
  });
});
