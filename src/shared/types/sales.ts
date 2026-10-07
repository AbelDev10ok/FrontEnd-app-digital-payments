import { Client } from "./client";

  // Función fetcher para la paginación
  export interface FetchParamsSales {
    page: number;
    size: number;
    year?: number;
    month?: number;
    day?: number;
    clientName?: string;
    descriptionProduct?: string;
    status?: string;
    aCobrar?: boolean;
    productType?: string;
    kind?: SaleKind;
    typePayments?: string;
    minAmount?: number;
    maxAmount?: number;
    sort?: string;
  };

  export type SaleKind = 'VENTA' | 'PRESTAMO';
  export type SaleType = SaleKind;

export interface SaleFormData {
  cliente: number | string;
  sellerId: string;
  tipo: SaleKind;
  descripcion: string;
  fecha: string;
  payments: string;
  quantityFees: number | string;
  amountFee: number | string;
  cost: number | string;
  cantidad: number | string;
  interestRate: number | string;
  productTypeId: string;
  productId: string;
  firstFeeDate: string;
  payFirstFee: boolean;
  firstFeeAmount: number | string;
}


export interface CreateSaleRequest {
  clientId: number;
  kind: SaleKind;
  descriptionProduct: string;
  dateSale: string;
  finalPaymentDate?: string;
  payments: 'SEMANAL' | 'MENSUAL' | 'QUINCENAL' | 'CONTADO';
  quantityFees?: number;
  amountFee?: number;
  cost: number;
  quantity?: number;
  interestRate?: number;
  productType?: number | null;
  // Producto del catálogo (opcional, solo VENTA)
  product?: number | null;
  // Campos opcionales para pago de primera cuota al crear
  firstFeeDate?: string;
  payFirstFee?: boolean;
  firstFeeAmount?: number;
}

export interface ProductTypeDto {
  id: number;
  name: string;
  icon?: string | null;
}

export interface ProductDto {
  id: number;
  name: string;
  price?: number | null;
  stock?: number | null;
  productTypeId?: number | null;
  productTypeName?: string | null;
}

export interface SalesCountsDto {
  total: number;
  active: number;
  completed: number;
  canceled: number;
  aCobrar: number;
}

export interface UpdateSaleRequest {
  descriptionProduct: string;
  productType?: number | null;
  // Producto del catálogo (opcional)
  product?: number | null;
  kind: SaleKind;

}

export interface SaleResponseDto {
  id: number;
  client: Client;
  descriptionProduct: string;
  priceTotal: number;
  dateSale: string;
  finalPaymentDate: string;
  realFinalPayment: string;
  typePayments: 'SEMANAL' | 'MENSUAL' | 'QUINCENAL' | 'CONTADO';
  quantityFees: number;
  // completed: boolean;
  amountFee: number;
  fees: FeeDto[];
  cost: number;
  interestRate: number | null;
  productType: ProductTypeDto | null;
  product?: ProductDto | null;
  quantity?: number;
  paidFeesCount: number;
  remainingAmount: number;
  collectedAmount?: number;
  refundAmount?: number;
  totalFees: number;
  status?: string;
  kind: SaleKind;
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
  paymentMethod?: string;
  postponed: boolean;
  productDescription: string;
  status: 'PENDING' | 'PAID';
}