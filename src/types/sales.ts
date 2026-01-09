import { ClientDto } from "./client";

  // Función fetcher para la paginación
  export interface FetchParamsSales {
    page: number;
    size: number;
    year?: number;
    month?: number;
    clientName?: string;
    descriptionProduct?: string;
    status?: string;
    productType?: string;
  };

  export type SaleType = 'VENTA' | 'PRESTAMO';

export interface SaleFormData {
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
}


export interface CreateSaleRequest {
  clientId: number;
  descriptionProduct: string;
  dateSale: string;
  finalPaymentDate?: string;
  payments: 'SEMANAL' | 'MENSUAL' | 'QUINCENAL' | 'CONTADO';
  quantityFees?: number;
  amountFee?: number;
  cost: number;
  productType: number;
  // Campos opcionales para pago de primera cuota al crear
  firstFeeDate?: string;
  payFirstFee?: boolean;
  firstFeeAmount?: number;
}

export interface ProductTypeDto {
  id: number;
  name: string;
}

export interface SaleResponseDto {
  id: number;
  client: ClientDto;
  descriptionProduct: string;
  priceTotal: number;
  dateSale: string;
  finalPaymentDate: string;
  typePayments: 'SEMANAL' | 'MENSUAL' | 'QUINCENAL' | 'UNICO';
  daysLate: number;
  quantityFees: number;
  completed: boolean;
  amountFe: number;
  fees: FeeDto[];
  cost: number;
  productType: ProductTypeDto;
  paidFeesCount: number;
  remainingAmount: number;
  totalFees: number;
  status: ''
}

export interface FeeDto {
  id: number;
  saleId: number;
  numberFee: number;
  amount: number;
  expirationDate: string;
  paid: boolean;
  paymentDate?: string;
  paidAmount?: number;
  postponed: boolean;
  productDescription: string;
  status: 'PENDING' | 'PAID';
}



