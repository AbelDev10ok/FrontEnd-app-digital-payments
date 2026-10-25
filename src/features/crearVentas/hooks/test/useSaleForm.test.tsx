import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import useSaleForm from '../useSaleForm';
import { salesService } from '@/features/ventas/services/salesServices';
import { clientService } from '@/features/clients/services/clientServices';
import type { SaleFormData } from '@/shared/types/sales';
import { formatCurrency } from '@/shared/utils/formatCurrency';

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

/** Variante vendible del catálogo: costo 400, precio 500, stock 10. */
const varianteHeladera = {
  id: 1,
  variantId: 1,
  name: 'Heladera Samsung',
  cost: 400,
  price: 500,
  stock: 10,
  productTypeId: 1,
  productTypeName: 'ELECTRODOMESTICO',
  currency: 'ARS',
};

const validForm = (prev: SaleFormData): SaleFormData => ({
  ...prev,
  cliente: 1,
  productTypeId: '1',
  productId: '1',
  descripcion: 'Heladera Samsung',
  payments: 'SEMANAL',
  quantityFees: 1,
  amountFee: '600',
  cost: '400',
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
    vi.mocked(salesService.getProducts).mockResolvedValue([varianteHeladera]);
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

  it('el formulario vacío tiene errores de validación pero no bloquea el envío', () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    expect(result.current.errors.cliente).toBe('Selecciona un cliente');
    // sin producto seleccionado, el error de categoría no aplica
    expect(result.current.errors.productTypeId).toBeUndefined();
    expect(result.current.errors.productId).toBe('Selecciona un producto');
    expect(result.current.errors.amountFee).toBe('Ingresa un valor de cuota válido');
    // con el costo vacío, el error pertinente es el del propio campo
    expect(result.current.errors.cost).toBe('Ingresa un costo válido');
    // el botón no se apaga: el envío guía al campo que falta
    expect(result.current.isSubmittingDisabled).toBe(false);
    expect(result.current.visibleErrors).toEqual({});
  });

  it('los errores se hacen visibles recién tras el primer intento de envío', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    expect(result.current.visibleErrors.cliente).toBeUndefined();

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBe(false);
    expect(result.current.visibleErrors.cliente).toBe('Selecciona un cliente');
    expect(salesService.createSale).not.toHaveBeenCalled();
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
        payments: 'SEMANAL',
        quantityFees: 1,
        // El valor de la cuota queda precargado con el total de contado (500 × 1)
        amountFee: 500,
        // La venta manda la variante (SKU): el backend deriva costo y categoría
        variant: 1,
        quantity: 1,
        dateSale: result.current.formData.fecha,
      }),
    );
    const payload = vi.mocked(salesService.createSale).mock.calls[0][0];
    expect(payload).not.toHaveProperty('cost');
    expect(payload).not.toHaveProperty('productType');
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
    // sin intento de envío todavía, el campo aún no se pinta en rojo
    expect(result.current.visibleErrors.interestRate).toBeUndefined();
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

  it('seleccionar una variante autocompleta descripcion, costo, precio y categoría', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1' }));
    });

    expect(result.current.formData.descripcion).toBe('Heladera Samsung');
    expect(result.current.formData.cost).toBe('400');
    expect(result.current.formData.precioUnitario).toBe(500);
    expect(result.current.formData.stockDisponible).toBe(10);
    expect(result.current.formData.productTypeId).toBe('1');
    // El valor de la cuota arranca en el total de contado (500 × 1)
    expect(result.current.formData.amountFee).toBe('500');
  });

  it('la cantidad suma los precios unitarios en el valor precargado de la cuota', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1', cantidad: '3' }));
    });

    // 3 unidades de $500: el valor arranca en la suma ($1.500) y el costo en $1.200
    expect(result.current.formData.amountFee).toBe('1500');
    expect(result.current.formData.cost).toBe('1200');
    expect(result.current.errors.amountFee).toBeUndefined();
  });

  it('el valor de cuota precargado se puede editar para financiar', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1', cantidad: '3' }));
    });
    expect(result.current.formData.amountFee).toBe('1500');

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...prev,
        cliente: 1,
        payments: 'MENSUAL',
        quantityFees: 6,
        amountFee: '400',
        firstFeeDate: prev.fecha,
      }));
    });

    // El monto editado se conserva: no se pisa sin cambiar de producto/cantidad
    expect(result.current.formData.amountFee).toBe('400');

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    const payload = vi.mocked(salesService.createSale).mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({ amountFee: 400, quantityFees: 6, variant: 1 }));
  });

  it('la descripción incluye la etiqueta de atributos de la variante', async () => {
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { ...varianteHeladera, variantLabel: 'Rojo / M', sku: 'HEL-ROJO-M' },
    ]);
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1' }));
    });

    expect(result.current.formData.descripcion).toBe('Heladera Samsung (Rojo / M)');
  });

  it('elegir una variante fija la categoría del producto aunque el form tuviera otra', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productTypeId: '9', productId: '1' }));
    });

    expect(result.current.formData.productTypeId).toBe('1');
  });

  it('una venta con variante incluye variant en el payload y no el producto', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...validForm(prev),
        quantityFees: 6,
        amountFee: '100',
      }));
    });

    expect(result.current.isSubmittingDisabled).toBe(false);

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    const payload = vi.mocked(salesService.createSale).mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({ variant: 1 }));
    expect(payload).not.toHaveProperty('product');
  });

  it('una venta a contado no exige valor de cuota ni manda montos (los calcula el backend)', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...validForm(prev),
        payments: 'CONTADO',
        amountFee: '',
        quantityFees: 1,
      }));
    });

    expect(result.current.errors.amountFee).toBeUndefined();
    expect(result.current.errors.cost).toBeUndefined();

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    const payload = vi.mocked(salesService.createSale).mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({ variant: 1, quantity: 1, payments: 'CONTADO' }));
    expect(payload).not.toHaveProperty('cost');
    expect(payload).not.toHaveProperty('amountFee');
    expect(payload).not.toHaveProperty('quantityFees');
  });

  it('una venta a contado avisa si el precio de lista no supera al costo', async () => {
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { ...varianteHeladera, cost: 600, price: 500 },
    ]);
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({
        ...validForm(prev),
        payments: 'CONTADO',
        amountFee: '',
        quantityFees: 1,
      }));
    });

    expect(result.current.errors.cost).toBe(
      `El total a cobrar (${formatCurrency(500)}) tiene que superar el costo (${formatCurrency(600)}). El precio de contado del catálogo no supera el costo del producto.`,
    );
    expect(result.current.visibleErrors.cost).toBeUndefined();
  });

  it('la cantidad multiplica el costo y arma la descripción', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1', cantidad: '3' }));
    });

    expect(result.current.formData.descripcion).toBe('3 x Heladera Samsung');
    expect(result.current.formData.cost).toBe('1200');
  });

  it('rechaza una cantidad menor a 1', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1', cantidad: '0' }));
    });

    expect(result.current.errors.cantidad).toBe('Ingresa una cantidad válida');
  });

  it('bloquea la venta si la cantidad supera el stock de la variante', async () => {
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { ...varianteHeladera, id: 7, variantId: 7, name: 'Frigobar', stock: 2 },
    ]);
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '7', cantidad: '3' }));
    });

    expect(result.current.errors.cantidad).toBe('Solo hay 2 unidades disponibles');
  });

  it('rechaza la venta cuando la variante no tiene stock', async () => {
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { ...varianteHeladera, id: 7, variantId: 7, name: 'Frigobar', stock: 0 },
    ]);
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '7', cantidad: '1' }));
    });

    expect(result.current.errors.cantidad).toBe('No hay stock disponible de este producto');
  });

  it('una venta con cantidad incluye quantity en el payload', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData((prev) => ({ ...validForm(prev), cantidad: '3' }));
    });
    // El valor por defecto es el unitario: se sube para cubrir las 3 unidades
    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, amountFee: '2000' }));
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

  it('avisa si el total a cobrar queda por debajo del precio de venta', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1', cantidad: '3' }));
    });
    // La suma de los 3 precios unitarios es el piso de la venta
    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, amountFee: '1000' }));
    });

    expect(result.current.errors.amountFee).toBe(
      `El total a cobrar (${formatCurrency(1000)}) no puede ser menor al precio de venta (${formatCurrency(1500)}).`,
    );
  });

  it('acepta un total igual al precio de venta y también financiado por encima', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1', cantidad: '3' }));
    });
    // Justo el precio de lista: 3 cuotas de $500
    await act(async () => {
      result.current.setFormData((prev) => ({
        ...prev,
        cliente: 1,
        payments: 'MENSUAL',
        quantityFees: 3,
        amountFee: '500',
        firstFeeDate: prev.fecha,
      }));
    });

    expect(result.current.errors.amountFee).toBeUndefined();
    expect(result.current.errors.cost).toBeUndefined();

    let submitted: unknown;
    await act(async () => {
      submitted = await result.current.handleSubmit();
    });

    expect(submitted).toBeTruthy();
    expect(salesService.createSale).toHaveBeenCalledWith(
      expect.objectContaining({ amountFee: 500, quantityFees: 3, quantity: 3 }),
    );
  });

  it('la venta avisa en la moneda del producto y no en la del negocio', async () => {
    // Catálogo inconsistente (precio por debajo del costo) para ejercitar el aviso
    vi.mocked(salesService.getProducts).mockResolvedValue([
      { ...varianteHeladera, cost: 600, currency: 'USD' },
    ]);
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.products.length).toBe(1));

    await act(async () => {
      result.current.setFormData((prev) => ({ ...prev, productId: '1' }));
    });

    // El negocio está en ARS; el importe que se está cargando es en USD
    expect(result.current.errors.cost).toBe(
      `El total a cobrar (${formatCurrency(500, 'USD')}) tiene que superar el costo (${formatCurrency(600, 'USD')}). Subí el valor de la cuota o la cantidad de cuotas.`,
    );
  });

  it('el préstamo envía la moneda elegida en el alta', async () => {
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
        currency: 'USD',
        firstFeeDate: prev.fecha,
      }));
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(salesService.createSale).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'PRESTAMO', currency: 'USD' }),
    );
  });

  it('la venta no envía moneda: la manda el producto', async () => {
    const { result } = renderHook(() => useSaleForm('VENTA'));
    await waitFor(() => expect(result.current.formData.firstFeeDate).toBeTruthy());

    await act(async () => {
      result.current.setFormData(validForm);
    });
    await act(async () => {
      await result.current.handleSubmit();
    });

    const payload = vi.mocked(salesService.createSale).mock.calls[0][0];
    expect(payload).not.toHaveProperty('currency');
  });
});
