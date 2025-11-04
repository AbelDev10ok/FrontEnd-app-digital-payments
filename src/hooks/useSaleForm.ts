import { useEffect, useState } from 'react';
import { CreateSaleRequest, salesService, ProductTypeDto } from '../services/salesServices';
import { useClients } from './useClients';
import { Client } from '../services/clientServices';

type SaleType = 'VENTA' | 'PRESTAMO';

export type SaleFormData = {
  cliente: number | string;
  sellerId: string;
  tipo: SaleType;
  descripcion: string;
  fecha: string;
  payments: string;
  quantityFees: number | string;
  amountFee: number | string;
  cost: number | string;
  productCategory: string;
  productTypeId: string;
  firstFeeDate: string;
  payFirstFee: boolean;
  firstFeeAmount: number | string;
};

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function useSaleForm(initialType: SaleType) {
  const { clients } = useClients();

  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [sellers, setSellers] = useState<Client[]>([]);
  const [displayedClients, setDisplayedClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState<SaleFormData>({
    cliente: 0,
    sellerId: '',
    tipo: initialType,
    descripcion: initialType === 'PRESTAMO' ? 'Préstamo personal' : '',
    fecha: getLocalDateString(new Date()),
    payments: 'SEMANAL',
    quantityFees: 1,
    amountFee: '',
    cost: '',
    productCategory: initialType === 'PRESTAMO' ? 'PRESTAMO' : '',
    productTypeId: '',
    firstFeeDate: '',
    payFirstFee: false,
    firstFeeAmount: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmittingDisabled, setIsSubmittingDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Validation effect
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.cliente || Number(formData.cliente) === 0) newErrors.cliente = formData.sellerId ? 'Selecciona un cliente del vendedor seleccionado' : 'Selecciona un cliente';
    if (!formData.productTypeId) newErrors.productTypeId = 'Selecciona un tipo de producto';
    if (!formData.amountFee || Number(formData.amountFee) <= 0) newErrors.amountFee = 'Ingresa un valor de cuota válido';
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

    setErrors(newErrors);
    setIsSubmittingDisabled(Object.keys(newErrors).length > 0);
  }, [formData, displayedClients]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // if errors exist, stop
    if (Object.keys(errors).length > 0) {
      setIsSubmittingDisabled(true);
      return false;
    }

    if (!formData.cliente) {
      // keep behaviour: caller can alert or handle
      return false;
    }

    const saleRequest: CreateSaleRequest = {
      clientId: Number(formData.cliente),
      descriptionProduct: formData.descripcion,
      payments: formData.payments as 'SEMANAL' | 'MENSUAL' | 'QUINCENAL' | 'CONTADO',
      quantityFees: Number(formData.quantityFees),
      amountFee: Number(formData.amountFee),
      cost: Number(formData.cost),
      productType: Number(formData.productTypeId),
      dateSale: formData.fecha,
      ...(formData.firstFeeDate ? { firstFeeDate: formData.firstFeeDate } : {}),
      ...(formData.payFirstFee ? { payFirstFee: Boolean(formData.payFirstFee) } : {}),
      ...(formData.payFirstFee && formData.firstFeeAmount ? { firstFeeAmount: Number(formData.firstFeeAmount) } : {}),
      ...(formData.sellerId ? { sellerId: Number(formData.sellerId) } : {}),
    };

    try {
      setIsSubmitting(true);
      await salesService.createSale(saleRequest);
      setIsSubmitting(false);
      return true;
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

    const fetchSellers = async () => {
      try {
        const s = await salesService.getSellers();
        setSellers(s);
      } catch (err) {
        console.error('Error fetching sellers', err);
      }
    };

    fetchProductTypes();
    fetchSellers();
  }, []);

  // fetch clients for seller
  useEffect(() => {
    const fetchClientsForSeller = async () => {
      try {
        if (!formData.sellerId) {
          setDisplayedClients(clients as Client[]);
          return;
        }
        const sellerIdNum = Number(formData.sellerId);
        const clientsOfSeller = await salesService.getClientsBySeller(sellerIdNum);
        setDisplayedClients(clientsOfSeller);
      } catch (err) {
        console.error('Error fetching clients for seller', err);
      }
    };
    fetchClientsForSeller();
  }, [formData.sellerId, clients]);

  // sync displayedClients with clients when no seller
  useEffect(() => {
  if (!formData.sellerId) setDisplayedClients(clients as Client[]);
  }, [clients, formData.sellerId]);

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
    sellers,
    displayedClients,
  };
}
