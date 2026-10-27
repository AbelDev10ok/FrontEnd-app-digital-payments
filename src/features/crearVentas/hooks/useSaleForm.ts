import { useEffect, useMemo, useState } from 'react';
import { Client } from '@/shared/types/client';
import {salesService } from '@/features/ventas/services/salesServices';
import { clientService } from '@/features/clients/services/clientServices';
import { CreateSaleRequest, ProductDto, ProductTypeDto, SaleFormData, SaleType } from '@/shared/types/sales';
import { getLocalDateString } from '@/shared/utils/formatDate';
import { getCurrency, formatCurrency } from '@/shared/utils/formatCurrency';

/**
 * Moneda de la operación.
 *
 * La venta hereda la de su producto: el precio del catálogo está expresado ahí y
 * el importe no se convierte. El préstamo, que no tiene producto, usa la moneda
 * elegida en el alta. La del negocio sólo respalda registros sin moneda propia
 * (productos legados).
 */
export const monedaDeLaOperacion = (
  tipo: SaleType,
  monedaElegida: string | undefined,
  producto?: { currency?: string | null } | null,
  monedaNegocio: string = getCurrency(),
): string =>
  tipo === 'VENTA' ? producto?.currency || monedaNegocio : monedaElegida || monedaNegocio;

const getInterestRateNumber = (formData: SaleFormData): number => {
  const rate = Number(formData.interestRate);
  return formData.interestRate !== '' && !isNaN(rate) ? rate : NaN;
};

const validateForm = (formData: SaleFormData, moneda: string): Record<string, string> => {
  const newErrors: Record<string, string> = {};

  if (!formData.cliente || Number(formData.cliente) === 0) newErrors.cliente = formData.sellerId ? 'Selecciona un cliente del vendedor seleccionado' : 'Selecciona un cliente';
  if (formData.tipo === 'VENTA') {
    // La categoría se autocompleta desde el producto: si hay producto sin
    // categoría, el problema está en el catálogo, no en este formulario
    if (formData.productId && !formData.productTypeId) newErrors.productTypeId = 'El producto seleccionado no tiene categoría asignada';
    if (!formData.productId) newErrors.productId = 'Selecciona un producto';
    const cantidad = Number(formData.cantidad);
    if (!formData.cantidad || !Number.isInteger(cantidad) || cantidad < 1) {
      newErrors.cantidad = 'Ingresa una cantidad válida';
    } else {
      // El stock es obligatorio: no se puede vender lo que no hay.
      const disponible = Number(formData.stockDisponible);
      if (formData.stockDisponible !== '' && Number.isFinite(disponible) && cantidad > disponible) {
        newErrors.cantidad = disponible === 0
          ? 'No hay stock disponible de este producto'
          : `Solo hay ${disponible} unidades disponibles`;
      }
    }
  }
  const esContado = formData.tipo === 'VENTA' && formData.payments === 'CONTADO';
  // Al contado el monto lo manda el precio de venta del catálogo (no se edita acá);
  // en cuotas sí se ingresa el valor de cada cuota.
  if (!esContado && formData.tipo !== 'PRESTAMO' && !(formData.payments === 'CONTADO' && formData.payFirstFee)) {
    if (!formData.amountFee || Number(formData.amountFee) <= 0) newErrors.amountFee = 'Ingresa un valor de cuota válido';
  }
  if (formData.tipo !== 'PRESTAMO' && (!formData.cost || Number(formData.cost) <= 0)) newErrors.cost = 'Ingresa un costo válido';
  if (!esContado && formData.payments !== 'CONTADO' && (!formData.quantityFees || Number(formData.quantityFees) < 1)) newErrors.quantityFees = 'La cantidad de cuotas debe ser al menos 1';

  if (formData.payFirstFee) {
    if (!formData.firstFeeAmount || Number(formData.firstFeeAmount) <= 0) newErrors.firstFeeAmount = 'Ingresa monto de la primera cuota';
    if (formData.firstFeeDate !== formData.fecha) newErrors.firstFeeDate = 'Para pagar ahora, la primera cuota debe coincidir con la fecha de venta';
  }

  if (formData.tipo === 'PRESTAMO') {
    if (formData.payments === 'CONTADO') newErrors.payments = 'Un préstamo no puede ser a contado';
    const rate = getInterestRateNumber(formData);
    if (isNaN(rate)) newErrors.interestRate = 'Ingresa un porcentaje de interés';
    else if (rate < 0) newErrors.interestRate = 'El interés no puede ser negativo';
  } else {
    // El total a cobrar no puede quedar por debajo del precio de lista: la suma
    // de los precios unitarios de lo que se vende (unitario × cantidad). Al
    // contado el total ya es esa suma; en cuotas se exige sobre cuota × cuotas.
    const total = esContado
      ? Number(formData.precioUnitario || 0) * Number(formData.cantidad || 0)
      : Number(formData.amountFee) * Number(formData.quantityFees);
    const totalDefinido = esContado ? Number(formData.precioUnitario) > 0 : Number(formData.amountFee) > 0;
    const precioDeLista = Number(formData.precioUnitario || 0) * Number(formData.cantidad || 0);

    if (!esContado && totalDefinido && precioDeLista > 0 && total < precioDeLista) {
      newErrors.amountFee = `El total a cobrar (${formatCurrency(total, moneda)}) no puede ser menor al precio de venta (${formatCurrency(precioDeLista, moneda)}).`;
    } else if (totalDefinido && Number(formData.cost) >= total) {
      // Con los dos números a la vista y qué tocar: el costo no se edita en la
      // venta (viene del catálogo), así que "qué pasa" no alcanza como mensaje.
      // Los montos van en la moneda de la operación, no en la del negocio.
      const accion = esContado
        ? 'El precio de contado del catálogo no supera el costo del producto.'
        : 'Subí el valor de la cuota o la cantidad de cuotas.';
      newErrors.cost = `El total a cobrar (${formatCurrency(total, moneda)}) tiene que superar el costo (${formatCurrency(Number(formData.cost), moneda)}). ${accion}`;
    }
  }

  return newErrors;
};

export const calculateLoanTotals = (formData: SaleFormData): { totalToPay: number; amountFee: number } | null => {
  if (formData.tipo !== 'PRESTAMO') return null;
  const rate = getInterestRateNumber(formData);
  const capital = Number(formData.cost);
  const quantityFees = Number(formData.quantityFees);
  if (isNaN(rate) || !capital || capital <= 0 || !quantityFees || quantityFees < 1) return null;
  const totalToPay = Math.round(capital * (1 + rate / 100) * 100) / 100;
  const amountFee = Math.round((totalToPay / quantityFees) * 100) / 100;
  return { totalToPay, amountFee };
};

// Identidad estable para los errores aún no revelados: evita repintar los
// campos en cada render cuando todavía no hubo un intento de envío.
const SIN_ERRORES_VISIBLES: Record<string, string> = {};

const createInitialFormData = (tipo: SaleType): SaleFormData => ({
  cliente: 0,
  sellerId: '',
  tipo,
  descripcion: '',
  fecha: getLocalDateString(new Date()),
  payments: 'SEMANAL',
  quantityFees: 1,
  amountFee: '',
  cost: '',
  cantidad: '1',
  interestRate: '',
  productTypeId: '',
  productId: '',
  precioUnitario: '',
  stockDisponible: '',
  firstFeeDate: '',
  payFirstFee: false,
  firstFeeAmount: '',
  currency: getCurrency(),
});

export default function useSaleForm(initialType: SaleType) {
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [sellers, setSellers] = useState<Client[]>([]);
  const [displayedClients, setDisplayedClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState<SaleFormData>(() => createInitialFormData(initialType));

  useEffect(() => {
    setFormData(createInitialFormData(initialType));
  }, [initialType]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Los errores de validación se muestran recién después del primer intento de
  // envío: el formulario no abre en rojo y un clic (o Enter) los revela.
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Moneda de la operación: alimenta los avisos de validación para que hablen en
  // la moneda en la que realmente se está cargando el importe.
  const selectedProduct = products.find((p) => Number(p.variantId ?? p.id) === Number(formData.productId));
  const moneda = monedaDeLaOperacion(formData.tipo, formData.currency, selectedProduct);

  const errors = useMemo(
    () => validateForm(formData, moneda),
    [formData, moneda],
  );
  // Errores que se pintan en los campos. `handleSubmit` sigue usando `errors`
  // (el conjunto completo) para decidir si hay envío.
  const visibleErrors = submitAttempted ? errors : SIN_ERRORES_VISIBLES;
  // El botón solo se bloquea mientras hay una petición en curso: con errores el
  // envío se guía (anuncio + foco al primer campo inválido), no se apaga.
  const isSubmittingDisabled = isSubmitting;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const name = target.name;
    if ((target as HTMLInputElement).type === 'checkbox') {
      const checked = (target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked } as unknown as SaleFormData));
      return;
    }
    const value = (target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    setFormData(prev => ({ ...prev, [name]: value } as unknown as SaleFormData));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // El intento revela los errores: si el envío se corta acá, el formulario ya
    // los muestra y anuncia cuáles son.
    setSubmitAttempted(true);
    // evita doble envío mientras hay una petición en curso
    if (isSubmitting) {
      return false;
    }
    // si hay errores, no se envía (validación derivada en render)
    if (Object.keys(errors).length > 0) {
      return false;
    }

    if (!formData.cliente) {
      // keep behaviour: caller can alert or handle
      return false;
    }

    const loanTotals = calculateLoanTotals(formData);
    const esContado = formData.tipo === 'VENTA' && formData.payments === 'CONTADO';
    const esPrestamo = formData.tipo === 'PRESTAMO';

    const saleRequest: CreateSaleRequest = {
      clientId: Number(formData.cliente),
      kind: formData.tipo,
      descriptionProduct: formData.descripcion,
      payments: formData.payments as 'SEMANAL' | 'MENSUAL' | 'QUINCENAL' | 'CONTADO',
      dateSale: formData.fecha,
      ...(esPrestamo
        ? {
            // El préstamo manda el capital, el interés y la moneda elegida
            cost: Number(formData.cost),
            amountFee: loanTotals ? loanTotals.amountFee : Number(formData.amountFee),
            quantityFees: Number(formData.quantityFees),
            currency: moneda,
            ...(loanTotals ? { interestRate: Number(formData.interestRate) } : {}),
          }
        : {
            // Una venta vende una variante (SKU): el costo y la categoría los
            // deriva el backend del catálogo, y al contado el total sale del
            // precio de lista (no se manda monto).
            variant: Number(formData.productId),
            quantity: Number(formData.cantidad),
            ...(esContado
              ? {}
              : { amountFee: Number(formData.amountFee), quantityFees: Number(formData.quantityFees) }),
          }),
      ...(formData.firstFeeDate ? { firstFeeDate: formData.firstFeeDate } : {}),
      ...(formData.payFirstFee ? { payFirstFee: Boolean(formData.payFirstFee) } : {}),
      ...(formData.payFirstFee && formData.firstFeeAmount ? { firstFeeAmount: Number(formData.firstFeeAmount) } : {}),
      ...(formData.sellerId ? { sellerId: Number(formData.sellerId) } : {}),
    };

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const response = await salesService.createSale(saleRequest);
      setIsSubmitting(false);
      return response;
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo guardar la transacción. Intentá nuevamente.',
      );
      console.error(err);
      return false;
    }
  };

  // fetch product types and sellers on mount
  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const pts = await salesService.getProductTypes();
        setProductTypes(pts);
      } catch (err) {
        console.error('Error fetching product types', err);
      }
    };

    const fetchProducts = async () => {
      try {
        const prods = await salesService.getProducts();
        setProducts(prods);
      } catch (err) {
        console.error('Error fetching products', err);
      }
    };

    const fetchSellers = async () => {
      try {
        const s = await salesService.getSellers();
        setSellers(s);
      } catch (err) {
        console.error('Error fetching sellers', err);
      }
    };

    fetchProductTypes();
    fetchProducts();
    fetchSellers();
  }, []);

  // Al elegir una variante del catálogo se toma su nombre (+ etiqueta) como
  // descripción, su costo como costo y su categoría (no editables). La cantidad
  // multiplica el costo y arma la descripción "N x Nombre" (V9). El "valor de la
  // cuota" queda precargado con la suma de los precios unitarios (precio ×
  // cantidad): es el piso de la venta, y al contado lo calcula el backend.
  useEffect(() => {
    if (!formData.productId) return;
    const product = products.find((p) => Number(p.variantId ?? p.id) === Number(formData.productId));
    if (!product) return;
    const cantidad = Number(formData.cantidad);
    if (!formData.cantidad || !Number.isInteger(cantidad) || cantidad < 1) return;
    const etiqueta = product.variantLabel ? ` (${product.variantLabel})` : '';
    const precioUnitario = product.price != null && product.price > 0 ? product.price : null;
    setFormData((prev) => ({
      ...prev,
      descripcion: cantidad > 1 ? `${cantidad} x ${product.name}${etiqueta}` : `${product.name}${etiqueta}`,
      ...(product.cost != null && product.cost > 0 ? { cost: String(product.cost * cantidad) } : {}),
      ...(precioUnitario != null
        ? {
            precioUnitario,
            // La suma de los precios unitarios de lo que se está vendiendo
            amountFee: String(precioUnitario * cantidad),
          }
        : {}),
      ...(product.stock != null ? { stockDisponible: product.stock } : {}),
      ...(product.productTypeId != null ? { productTypeId: String(product.productTypeId) } : {}),
    }) as unknown as SaleFormData);
  }, [formData.productId, formData.cantidad, products]);

  // La cartera ya no filtra el listado: se buscan clientes de todo el negocio y
  // el vendedor de la operación se precarga al elegir el cliente (ver abajo).
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientService.getClientsPaginated({ page: 0, size: 1000 });
        setDisplayedClients(response.content);
      } catch (err) {
        console.error('Error fetching clients', err);
      }
    };
    fetchClients();
  }, []);

  // Al elegir un cliente se precarga su vendedor de cartera; si no tiene, la
  // operación queda sin atribuir. El ajuste manual posterior no se pisa: sólo
  // se recalcula cuando cambia el cliente o termina de llegar la lista.
  useEffect(() => {
    const clientId = Number(formData.cliente);
    if (!clientId) return;
    const selectedClient = displayedClients.find(c => c.id === clientId);
    setFormData(prev => {
      const sellerId = selectedClient?.sellerId != null ? String(selectedClient.sellerId) : '';
      if (prev.sellerId === sellerId) return prev;
      return { ...prev, sellerId };
    });
  }, [formData.cliente, displayedClients]);

  // sync first fee date with sale date rules
  useEffect(() => {
    const saleDate = formData.fecha;
    const firstDate = formData.firstFeeDate;
    if (!firstDate) {
      setFormData(prev => ({ ...prev, firstFeeDate: saleDate } as unknown as SaleFormData));
      return;
    }
    if (firstDate < saleDate) {
      setFormData(prev => ({ ...prev, firstFeeDate: saleDate, payFirstFee: false } as unknown as SaleFormData));
      return;
    }
    if (firstDate !== saleDate && formData.payFirstFee) {
      setFormData(prev => ({ ...prev, payFirstFee: false } as unknown as SaleFormData));
    }
  }, [formData.fecha, formData.firstFeeDate, formData.payFirstFee]);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    errors,
    visibleErrors,
    isSubmittingDisabled,
    isSubmitting,
    submitError,
    productTypes,
    products,
    sellers,
    displayedClients,
  };
}
