import { useEffect, useMemo, useState } from 'react';
import { Client } from '@/shared/types/client';
import {salesService } from '@/features/ventas/services/salesServices';
import { clientService } from '@/features/clients/services/clientServices';
import { CreateSaleRequest, ProductDto, ProductTypeDto, SaleFormData, SaleType } from '@/shared/types/sales';


const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInterestRateNumber = (formData: SaleFormData): number => {
  const rate = Number(formData.interestRate);
  return formData.interestRate !== '' && !isNaN(rate) ? rate : NaN;
};

const validateForm = (formData: SaleFormData, displayedClients: Client[]): Record<string, string> => {
  const newErrors: Record<string, string> = {};

  if (!formData.cliente || Number(formData.cliente) === 0) newErrors.cliente = formData.sellerId ? 'Selecciona un cliente del vendedor seleccionado' : 'Selecciona un cliente';
  if (formData.tipo === 'VENTA') {
    if (!formData.productTypeId) newErrors.productTypeId = 'Selecciona una categoría';
    if (!formData.productId) newErrors.productId = 'Selecciona un producto';
    const cantidad = Number(formData.cantidad);
    if (!formData.cantidad || !Number.isInteger(cantidad) || cantidad < 1) {
      newErrors.cantidad = 'Ingresa una cantidad válida';
    }
  }
  if (formData.tipo !== 'PRESTAMO' && !(formData.payments === 'CONTADO' && formData.payFirstFee)) {
    if (!formData.amountFee || Number(formData.amountFee) <= 0) newErrors.amountFee = 'Ingresa un valor de cuota válido';
  }
  if (!formData.cost || Number(formData.cost) <= 0) newErrors.cost = 'Ingresa un costo válido';
  if (!formData.quantityFees || Number(formData.quantityFees) < 1) newErrors.quantityFees = 'La cantidad de cuotas debe ser al menos 1';

  if (formData.payFirstFee) {
    if (!formData.firstFeeAmount || Number(formData.firstFeeAmount) <= 0) newErrors.firstFeeAmount = 'Ingresa monto de la primera cuota';
    if (formData.firstFeeDate !== formData.fecha) newErrors.firstFeeDate = 'Para pagar ahora, la primera cuota debe coincidir con la fecha de venta';
  }

  if (formData.sellerId && formData.cliente) {
    const belongs = displayedClients.some(c => c.id === Number(formData.cliente));
    if (!belongs) newErrors.cliente = 'El cliente no pertenece al vendedor seleccionado';
  }

  if (formData.tipo === 'PRESTAMO') {
    if (formData.payments === 'CONTADO') newErrors.payments = 'Un préstamo no puede ser a contado';
    const rate = getInterestRateNumber(formData);
    if (isNaN(rate)) newErrors.interestRate = 'Ingresa un porcentaje de interés';
    else if (rate < 0) newErrors.interestRate = 'El interés no puede ser negativo';
  } else {
    const total = Number(formData.amountFee) * Number(formData.quantityFees);
    if (Number(formData.cost) >= total) {
      newErrors.cost = 'El costo no puede ser menor o igual al monto total de la venta';
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
  firstFeeDate: '',
  payFirstFee: false,
  firstFeeAmount: '',
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

  const errors = useMemo(
    () => validateForm(formData, displayedClients),
    [formData, displayedClients],
  );
  const isSubmittingDisabled = Object.keys(errors).length > 0;

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
    // si hay errores, no se envía (validación derivada en render)
    if (Object.keys(errors).length > 0) {
      return false;
    }

    if (!formData.cliente) {
      // keep behaviour: caller can alert or handle
      return false;
    }

    const loanTotals = calculateLoanTotals(formData);

    const saleRequest: CreateSaleRequest = {
      clientId: Number(formData.cliente),
      kind: formData.tipo,
      descriptionProduct: formData.descripcion,
      payments: formData.payments as 'SEMANAL' | 'MENSUAL' | 'QUINCENAL' | 'CONTADO',
      quantityFees: Number(formData.quantityFees),
      amountFee: loanTotals ? loanTotals.amountFee : Number(formData.amountFee),
      cost: Number(formData.cost),
      dateSale: formData.fecha,
      ...(loanTotals ? { interestRate: Number(formData.interestRate) } : {}),
      ...(formData.tipo === 'VENTA' && formData.productTypeId ? { productType: Number(formData.productTypeId) } : {}),
      ...(formData.tipo === 'VENTA' ? { product: Number(formData.productId) } : {}),
      ...(formData.tipo === 'VENTA' ? { quantity: Number(formData.cantidad) } : {}),
      ...(formData.firstFeeDate ? { firstFeeDate: formData.firstFeeDate } : {}),
      ...(formData.payFirstFee ? { payFirstFee: Boolean(formData.payFirstFee) } : {}),
      ...(formData.payFirstFee && formData.firstFeeAmount ? { firstFeeAmount: Number(formData.firstFeeAmount) } : {}),
      ...(formData.sellerId ? { sellerId: Number(formData.sellerId) } : {}),
    };

    try {
      setIsSubmitting(true);
      const response = await salesService.createSale(saleRequest);
      setIsSubmitting(false);
      return response;
    } catch (err) {
      setIsSubmitting(false);
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

  // Al elegir un producto del catálogo se toma su nombre como descripción, su
  // precio como costo y su categoría (el costo y la categoría no son editables).
  // La cantidad multiplica el costo y arma la descripción "N x Nombre" (V9).
  useEffect(() => {
    if (!formData.productId) return;
    const product = products.find((p) => p.id === Number(formData.productId));
    if (!product) return;
    const cantidad = Number(formData.cantidad);
    if (!formData.cantidad || !Number.isInteger(cantidad) || cantidad < 1) return;
    setFormData((prev) => ({
      ...prev,
      descripcion: cantidad > 1 ? `${cantidad} x ${product.name}` : product.name,
      ...(product.price != null && product.price > 0 ? { cost: String(product.price * cantidad) } : {}),
      ...(product.productTypeId != null ? { productTypeId: String(product.productTypeId) } : {}),
    }) as unknown as SaleFormData);
  }, [formData.productId, formData.cantidad, products]);

  // fetch clients for seller or all clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        if (!formData.sellerId) {
          const response = await clientService.getClientsPaginated({ page: 0, size: 1000 });
          setDisplayedClients(response.content);
          return;
        }
        const sellerIdNum = Number(formData.sellerId);
        const clientsOfSeller = await salesService.getClientsBySeller(sellerIdNum);
        setDisplayedClients(clientsOfSeller);
      } catch (err) {
        console.error('Error fetching clients', err);
      }
    };
    fetchClients();
  }, [formData.sellerId]);

  // Auto-completar vendedor cuando se selecciona un cliente
  useEffect(() => {
    const clientId = Number(formData.cliente);

    if (clientId && clientId !== 0) {
      const selectedClient = displayedClients.find(c => c.id === clientId);
      
      if (selectedClient) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clientData = selectedClient as any;
        
        // Búsqueda robusta del nombre del vendedor 
        let extractedSellerId = null;

        if (!extractedSellerId && clientData?.sellerName) {
          const foundSeller = sellers.find(s => s.name.toLowerCase() === clientData.sellerName.toLowerCase());
          if (foundSeller) extractedSellerId = foundSeller.id;
        }

        // Si encontramos un ID y es diferente al actual, actualizamos
        if (extractedSellerId && Number(formData.sellerId) !== Number(extractedSellerId)) {
          setFormData(prev => ({ ...prev, sellerId: Number(extractedSellerId) }) as unknown as SaleFormData);
        }
      }
    }
  }, [formData.cliente, formData.sellerId, displayedClients, sellers]);

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
    isSubmittingDisabled,
    isSubmitting,
    productTypes,
    products,
    sellers,
    displayedClients,
  };
}
