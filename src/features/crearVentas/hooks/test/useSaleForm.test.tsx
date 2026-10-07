import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useSaleForm from '../useSaleForm';
import { salesService } from '@/features/ventas/services/salesServices';
import { clientService } from '@/features/clients/services/clientServices';
import type { SaleFormData } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getProductTypes: vi.fn(),
    getProducts: vi.fn(),
    getSellers: vi.fn(),
    getClientsBySeller: vi.fn(),
    createSale: vi.fn(),
  },
}));

vi.mock('@/features/clients/services/clientServices', () => ({
  clientService: { getClientsPaginated: vi.fn() },
}));

const client1 = {
  id: 1,
  name: 'Ana',
  telefono: '',
  email: '',
  direccion: '',
  seller: false,
};
const seller = {
  id: 5,
  name: 'Vendedor Ana',
  telefono: '',
  email: '',
  direccion: '',
  seller: true,
};

const validForm = (prev: SaleFormData): SaleFormData => ({
  ...prev,
  cliente: 1,
  productTypeId: '1',
  productId: '1',
  descripcion: 'TV Samsung',
  payments: 'CONTADO',
  quantityFees: 1,
  amountFee: '600',
  cost: '50',
  firstFeeDate: prev.fecha,
});

describe('useSaleForm', () => {
  beforeEach(() => {
    vi.mocked(salesService.getProductTypes).mockReset();
    vi.mocked(salesService.getProducts).mockReset();
    vi.mocked(salesService.getSellers).mockReset();
    vi.mocked(salesService.getClientsBySeller).mockReset();
    vi.mocked(salesService.createSale).mockReset();
    vi.mocked(clientService.getClientsPaginated).mockReset();

    vi.mocked(salesService.getProductTypes).mockResolvedValue([{ id: 1, name: 'VENTA' }]);
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { id: 1, name: 'Heladera Samsung', price: 500, productTypeId: 1, productTypeName: 'ELECTRODOMESTICO' },
    ]);
    vi.mocked(salesService.getSellers).mockResolvedValue([seller]);
    vi.mocked(clientService.getClientsPaginated).mockResolvedValue({ content: [client1] } as never);
    vi.mocked(salesService.getClientsBySeller).mockResolvedValue([]);
    vi.mocked(salesService.createSale).mockResolvedValue({} as never);
  });

  it('inicializa el formulario según el tipo PRESTAMO', () => {
    const { result } = renderHook(() => useSaleForm('PRESTAMO'));
    expect(result.current.formData.tipo).toBe('PRESTAMO');
    expect(result.current.formData.descripcion).toBe('');
    expect(result.current.formData.payments).toBe('SEMANAL');
    expect(result.current.formData.quantityFees).toBe(1);
  });

  it('el formulario vacío tiene errores de validación y deshabilita el submit', () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    expect(result.current.isSubmittingDisabled).toBe(true);
    expect(result.current.errors.cliente).toBe('Selecciona un cliente');
    expect(result.current.errors.productTypeId).toBe('Selecciona una categoría');
    expect(result.current.errors.productId).toBe('Selecciona un producto');
    expect(result.current.errors.amountFee).toBe('Ingresa un valor de cuota válido');
    expect(result.current.errors.cost).toBe('El costo no puede ser menor o igual al monto total de la venta');
  });

  it('handleInputChange actualiza el campo indicado', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await act(async () => {
      result.current.handleInputChange({ target: { name: 'cost', value: '500' } } as never);
    });
    expect(result.current.formData.cost).toBe('500');
  });

  it('un formulario válido habilita el submit y handleSubmit llama a createSale', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData(validForm);
    });

    expect(result.current.isSubmittingDisabled).toBe(false);

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    expect(salesService.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 1,
        kind: 'VENTA',
        descriptionProduct: 'Heladera Samsung',
        payments: 'CONTADO',
        quantityFees: 1,
        amountFee: 600,
        cost: 500,
        productType: 1,
        product: 1,
        dateSale: result.current.formData.fecha,
      }),
    );
  });

  it('un préstamo válido no requiere categoría y omite productType del payload', async () => {
    const { result } = renderHook(() => useSaleForm('PRESTAMO'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...prev,
        cliente: 1,
        payments: 'SEMANAL',
        quantityFees: 3,
        amountFee: '100',
        cost: '300',
        interestRate: '10',
        firstFeeDate: prev.fecha,
      }));
    });

    expect(result.current.errors.productTypeId).toBeUndefined();
    expect(result.current.isSubmittingDisabled).toBe(false);

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    expect(salesService.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'PRESTAMO',
        cost: 300,
      }),
    );
    const payload = vi.mocked(salesService.createSale).mock.calls[0][0];
    expect(payload).not.toHaveProperty('productType');
  });

  it('un préstamo con interés calcula total a devolver y cuota automáticamente', async () => {
    const { result } = renderHook(() => useSaleForm('PRESTAMO'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...prev,
        cliente: 1,
        payments: 'SEMANAL',
        quantityFees: 4,
        amountFee: '100',
        cost: '1000',
        interestRate: '10',
        firstFeeDate: prev.fecha,
      }));
    });

    expect(result.current.errors.cost).toBeUndefined();
    expect(result.current.errors.interestRate).toBeUndefined();
    expect(result.current.isSubmittingDisabled).toBe(false);

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    expect(salesService.createSale).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'PRESTAMO',
        cost: 1000,
        interestRate: 10,
        amountFee: 275,
      }),
    );
  });

  it('un préstamo con interés negativo es inválido', async () => {
    const { result } = renderHook(() => useSaleForm('PRESTAMO'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...prev,
        cliente: 1,
        payments: 'SEMANAL',
        quantityFees: 4,
        amountFee: '100',
        cost: '1000',
        interestRate: '-5',
        firstFeeDate: prev.fecha,
      }));
    });

    expect(result.current.errors.interestRate).toBe('El interés no puede ser negativo');
    expect(result.current.isSubmittingDisabled).toBe(true);
  });

  it('handleSubmit no llama a createSale si hay errores', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBe(false);
    expect(salesService.createSale).not.toHaveBeenCalled();
  });

  it('devuelve false si createSale falla', async () => {
    vi.mocked(salesService.createSale).mockRejectedValue(new Error('Falló'));
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData(validForm);
    });

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBe(false);
  });

  it('valida que el cliente pertenezca al vendedor seleccionado', async () => {
    vi.mocked(salesService.getClientsBySeller).mockResolvedValue([client1] as never);
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.displayedClients.length).toBeGreaterThan(0));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, sellerId: '5', cliente: 999 }));
    });

    expect(result.current.errors.cliente).toBe(
      'El cliente no pertenece al vendedor seleccionado',
    );
  });

  it('autocompleta el vendedor al seleccionar un cliente con sellerName', async () => {
    const clientConVendedor = { ...client1, id: 2, sellerName: 'Vendedor Ana' };
    vi.mocked(clientService.getClientsPaginated).mockResolvedValue({
      content: [clientConVendedor],
    } as never);
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.displayedClients.length).toBeGreaterThan(0));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, cliente: 2 }));
    });

    await waitFor(() => expect(result.current.formData.sellerId).toBe(5));
  });

  it('seleccionar un producto del catálogo autocompleta descripcion, costo y categoría', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1' }));
    });

    expect(result.current.formData.descripcion).toBe('Heladera Samsung');
    expect(result.current.formData.cost).toBe('500');
    expect(result.current.formData.productTypeId).toBe('1');
  });

  it('elegir un producto fija la categoría del producto aunque el form tuviera otra', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productTypeId: '9', productId: '1' }));
    });

    expect(result.current.formData.productTypeId).toBe('1');
  });

  it('una venta con producto incluye el product en el payload', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...validForm(prev),
        quantityFees: 6,
        productId: '1',
      }));
    });

    expect(result.current.isSubmittingDisabled).toBe(false);

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    expect(salesService.createSale).toHaveBeenCalledWith(
      expect.objectContaining({ product: 1 }),
    );
  });

  it('una venta a contado también marca el error si el costo es mayor o igual al total', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData((prev) => ({ ...validForm(prev), amountFee: '100' }));
    });

    expect(result.current.errors.cost).toBe(
      'El costo no puede ser menor o igual al monto total de la venta',
    );
    expect(result.current.isSubmittingDisabled).toBe(true);
  });

  it('la cantidad multiplica el costo y arma la descripción', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1', cantidad: '3' }));
    });

    expect(result.current.formData.descripcion).toBe('3 x Heladera Samsung');
    expect(result.current.formData.cost).toBe('1500');
  });

  it('rechaza una cantidad menor a 1', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1', cantidad: '0' }));
    });

    expect(result.current.errors.cantidad).toBe('Ingresa una cantidad válida');
  });

  it('no bloquea la venta si la cantidad supera el stock (aviso informativo)', async () => {
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { id: 7, name: 'Frigobar', price: 200, stock: 2, productTypeId: 1, productTypeName: 'VENTA' },
    ]);
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '7', cantidad: '3' }));
    });

    expect(result.current.errors.cantidad).toBeUndefined();
  });

  it('una venta con cantidad incluye quantity en el payload', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...validForm(prev),
        cantidad: '3',
        amountFee: '2000',
      }));
    });

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    expect(salesService.createSale).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 3 }),
    );
  });
});
