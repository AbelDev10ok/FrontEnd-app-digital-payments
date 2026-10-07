import { beforeEach, describe, expect, it, vi } from 'vitest';
import { salesService } from '../salesServices';
import { authenticatedFetch } from '@/features/auth/services/authServices';
import { SALES_API_URL, LOANS_API_URL } from '@/shared/config/api';

vi.mock('@/features/auth/services/authServices', () => ({
  authenticatedFetch: vi.fn(),
}));

const okEnvelope = (data: unknown) =>
  new Response(JSON.stringify({ status: 'OK', message: 'ok', data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const failEnvelope = (message: string, status = 400) =>
  new Response(JSON.stringify({ status: 'ERROR', message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('salesService.getAllSalesPaginated', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('construye la URL con todos los parámetros (incluido aCobrar=true)', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope({ content: [], totalPages: 0, totalElements: 0 }));

    await salesService.getAllSalesPaginated({
      page: 2,
      size: 15,
      year: 2026,
      month: 8,
      day: 5,
      clientName: 'Ana',
      descriptionProduct: 'Cuota',
      status: 'ACTIVE',
      aCobrar: true,
      kind: 'PRESTAMO',
      typePayments: 'MENSUAL',
      minAmount: 100,
      maxAmount: 500,
      sort: 'dateCreation,desc',
    });

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toContain(`${SALES_API_URL}?`);
    [
      'page=2',
      'size=15',
      'year=2026',
      'month=8',
      'day=5',
      'clientName=Ana',
      'descriptionProduct=Cuota',
      'status=ACTIVE',
      'aCobrar=true',
      'kind=PRESTAMO',
      'typePayments=MENSUAL',
      'minAmount=100',
      'maxAmount=500',
      'sort=dateCreation%2Cdesc',
    ].forEach((param) => expect(url).toContain(param));
  });

  it('omite los parámetros opcionales no provistos', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope({ content: [], totalPages: 0, totalElements: 0 }));

    await salesService.getAllSalesPaginated({ page: 0, size: 10 });

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toBe(`${SALES_API_URL}?page=0&size=10`);
  });

  it('no envía aCobrar cuando es false', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope({ content: [], totalPages: 0, totalElements: 0 }));

    await salesService.getAllSalesPaginated({ page: 0, size: 10, aCobrar: false });

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).not.toContain('aCobrar');
  });

  it('omite minAmount/maxAmount cuando no están definidos', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope({ content: [], totalPages: 0, totalElements: 0 }));

    await salesService.getAllSalesPaginated({ page: 0, size: 10 });

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).not.toContain('minAmount');
    expect(url).not.toContain('maxAmount');
  });

  it('desenvuelve el envelope y devuelve la página', async () => {
    const data = { content: [{ id: 1 }], totalPages: 3, totalElements: 21 };
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope(data));

    const result = await salesService.getAllSalesPaginated({ page: 0, size: 10 });

    expect(result).toMatchObject(data);
  });

  it('propaga el error del envelope no-OK', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(failEnvelope('Falló la búsqueda'));

    await expect(salesService.getAllSalesPaginated({ page: 0, size: 10 })).rejects.toThrow(
      'Falló la búsqueda',
    );
  });
});

describe('salesService.getDashboardStats', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('incluye year y month en la URL y desenvuelve el envelope', async () => {
    const data = { resumen: {}, anual: {} };
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope(data));

    await salesService.getDashboardStats(2026, 8);

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toContain(`${SALES_API_URL}/dashboard?`);
    expect(url).toContain('year=2026');
    expect(url).toContain('month=8');
  });
});

describe('salesService.getSalesCounts', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('consulta /counts sin kind y desenvuelve el envelope', async () => {
    const data = { total: 10, active: 3, completed: 5, canceled: 1, aCobrar: 4 };
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope(data));

    const result = await salesService.getSalesCounts();

    expect(vi.mocked(authenticatedFetch).mock.calls[0][0]).toBe(
      `${SALES_API_URL}/counts`,
    );
    expect(result).toMatchObject(data);
  });

  it('incluye kind=PRESTAMO cuando se filtra por préstamos', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      okEnvelope({ total: 0, active: 0, completed: 0, canceled: 0, aCobrar: 0 }),
    );

    await salesService.getSalesCounts('PRESTAMO');

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toBe(`${SALES_API_URL}/counts?kind=PRESTAMO`);
  });
});

describe('salesService.getAllSales / getAllLoans', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('getAllSales filtra por kind=VENTA en el endpoint canónico', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope([]));
    await salesService.getAllSales();
    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toBe(`${SALES_API_URL}?kind=VENTA`);
  });

  it('getAllLoans filtra por kind=PRESTAMO en el endpoint canónico', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope([]));
    await salesService.getAllLoans();
    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toBe(`${SALES_API_URL}?kind=PRESTAMO`);
  });
});

describe('salesService.createProductType', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('hace POST a /api/product-types con el nombre como cuerpo', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope({ id: 3, name: 'ROPA' }));
    await salesService.createProductType('ROPA');
    const [url, init] = vi.mocked(authenticatedFetch).mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/product-types');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify('ROPA'));
  });
});

describe('salesService.postponeFee', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope({}));
  });

  it('construye la URL con newDateExpiration, newDatePayment y amount', async () => {
    await salesService.postponeFee(10, 5, '2026-10-01', 15000, '2026-09-15');
    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toBe(
      `${LOANS_API_URL}/fee/5/postpone?newDateExpiration=2026-10-01&newDatePayment=2026-09-15&amount=15000`,
    );
    expect(vi.mocked(authenticatedFetch).mock.calls[0][1]?.method).toBe('POST');
  });

  it('omite amount cuando es NaN (no lo envía y no desmarca el pago)', async () => {
    await salesService.postponeFee(10, 5, '2026-10-01', NaN);
    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toBe(`${LOANS_API_URL}/fee/5/postpone?newDateExpiration=2026-10-01`);
    expect(url).not.toContain('amount=');
  });

  it('propaga el mensaje de error del backend en una respuesta 4xx', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(failEnvelope('El monto supera el saldo restante'));
    await expect(salesService.postponeFee(10, 5, '2026-10-01', 999999)).rejects.toThrow(
      'El monto supera el saldo restante',
    );
  });
});

describe('salesService.deleteFee', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('hace DELETE a /fee/{feeId}', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope({}));
    await salesService.deleteFee(7);
    const [url, init] = vi.mocked(authenticatedFetch).mock.calls[0];
    expect(url).toBe(`${LOANS_API_URL}/fee/7`);
    expect(init?.method).toBe('DELETE');
  });

  it('propaga el mensaje de error del backend en una respuesta 4xx', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(failEnvelope('No se puede eliminar la única cuota'));
    await expect(salesService.deleteFee(7)).rejects.toThrow(
      'No se puede eliminar la única cuota',
    );
  });
});

describe('salesService.cancelSale', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('hace PUT a /api/loans/cancel/{id} con refund=true por defecto y desenvuelve la venta anulada', async () => {
    const anulada = { id: 168, status: 'CANCELED', collectedAmount: 100, refundAmount: 100 };
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope(anulada));

    const result = await salesService.cancelSale(168);

    const [url, init] = vi.mocked(authenticatedFetch).mock.calls[0];
    expect(url).toBe(`${LOANS_API_URL}/cancel/168?refund=true`);
    expect(init?.method).toBe('PUT');
    expect(result).toMatchObject(anulada);
  });

  it('envía refund=false cuando se decide conservar el monto cobrado', async () => {
    const anulada = { id: 168, status: 'CANCELED', collectedAmount: 100, refundAmount: 0 };
    vi.mocked(authenticatedFetch).mockResolvedValue(okEnvelope(anulada));

    const result = await salesService.cancelSale(168, false);

    const [url] = vi.mocked(authenticatedFetch).mock.calls[0];
    expect(url).toBe(`${LOANS_API_URL}/cancel/168?refund=false`);
    expect(result).toMatchObject(anulada);
  });

  it('propaga el mensaje de error del backend en una respuesta 4xx', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(failEnvelope('La venta ya fue anulada'));
    await expect(salesService.cancelSale(168)).rejects.toThrow('La venta ya fue anulada');
  });
});
