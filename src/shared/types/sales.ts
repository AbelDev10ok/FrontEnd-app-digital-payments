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
    /** Vendedor sellado de la operación; sin vendedor = sin atribuir */
    sellerId?: number;
    /** Solo operaciones sin vendedor (ventas directas y registros viejos) */
    withoutSeller?: boolean;
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
  /** Variante/SKU elegida (una venta = un SKU) */
  productId: string;
  /** Precio de venta unitario de la variante elegida (al contado define el total) */
  precioUnitario: number | string;
  /** Stock disponible de la variante elegida */
  stockDisponible: number | string;
  firstFeeDate: string;
  payFirstFee: boolean;
  firstFeeAmount: number | string;
  /**
   * Moneda elegida para un PRESTAMO. En una VENTA no se usa: la moneda la manda
   * el producto y este campo sólo refleja la del negocio como sugerencia.
   */
  currency: string;
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
  /** En una VENTA el backend calcula el costo desde la variante: no se envía. */
  cost?: number;
  quantity?: number;
  interestRate?: number;
  productType?: number | null;
  /** Variante/SKU vendida (solo VENTA: una venta = un SKU) */
  variant?: number | null;
  /** Moneda ISO 4217 elegida (solo PRESTAMO: la venta hereda la de su producto) */
  currency?: string;
  // Campos opcionales para pago de primera cuota al crear
  firstFeeDate?: string;
  payFirstFee?: boolean;
  firstFeeAmount?: number;
  /**
   * Vendedor de la operación (opcional): el alta lo precarga desde el cliente
   * y puede ajustarlo o dejarlo vacío (venta directa).
   */
  sellerId?: number | null;
}

export interface ProductTypeDto {
  id: number;
  name: string;
  icon?: string | null;
  /** Categoría padre (jerarquía por negocio) */
  parentId?: number | null;
  parentName?: string | null;
  /** Identificador estable dentro del negocio */
  slug?: string | null;
}

/** Valor posible de un atributo ("Rojo", "M"). */
export interface AttributeValueDto {
  id: number;
  value: string;
}

/** Atributo del catálogo que puede generar variantes. */
export interface AttributeDto {
  id: number;
  name: string;
  values: AttributeValueDto[];
}

/** Valor concreto que toma un atributo en una variante. */
export interface VariantAttributeDto {
  attributeId: number;
  attributeName: string;
  attributeValueId: number;
  value: string;
}

/**
 * Fila vendible del catálogo: un producto base con una de sus variantes.
 * `id` es el producto y `variantId` el SKU que se elige al vender.
 */
export interface ProductDto {
  id: number;
  variantId?: number | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  sku?: string | null;
  /** Etiqueta de atributos de la variante ("Rojo / M") */
  variantLabel?: string | null;
  /** Precio de venta unitario */
  price?: number | null;
  /** Costo unitario del negocio */
  cost?: number | null;
  stock?: number | null;
  barcode?: string | null;
  active?: boolean | null;
  /** Estado del producto base (independiente del de cada variante). */
  productActive?: boolean | null;
  /** Estado propio de la variante, sin combinar con el producto. */
  variantActive?: boolean | null;
  productTypeId?: number | null;
  productTypeName?: string | null;
  /** Moneda ISO 4217 del precio, congelada al crear el producto (snapshot) */
  currency?: string | null;
  attributes?: VariantAttributeDto[];
}

/** Alta/edición de una variante (SKU). */
export interface ProductVariantPayload {
  id?: number;
  sku?: string | null;
  cost: number;
  price: number;
  stock: number;
  barcode?: string | null;
  active?: boolean;
  attributeValueIds?: number[];
}

/** Alta/edición de un producto base con sus variantes. */
export interface ProductPayload {
  name: string;
  description?: string | null;
  brand?: string | null;
  active?: boolean;
  productTypeId: number;
  currency?: string | null;
  attributeIds?: number[];
  variants: ProductVariantPayload[];
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
  /** Variante/SKU vendida (opcional) */
  variant?: number | null;
  kind: SaleKind;
  /**
   * Corrección deliberada del vendedor sellado en la operación. `null` = sin
   * atribuir; las reasignaciones del cliente no pasan por acá.
   */
  sellerId?: number | null;

}

/** Resumen del remito emitido de una venta. */
export interface RemitoResumenDto {
  id: number;
  /** Número correlativo entero (1, 2, ...). */
  number: number;
  /** Número visible con 6 dígitos ("000001"). */
  numberLabel: string;
  issuedAt: string;
}

/** Documento comercial emitido (snapshot inmutable listo para imprimir). */
export interface SaleDocumentDto {
  id: number;
  type: 'REMITO' | 'FACTURA';
  number: number;
  numberLabel: string;
  issuedAt: string;
  saleId: number;
  saleDate: string;
  businessName: string;
  businessAddress?: string | null;
  businessTaxId?: string | null;
  businessPhone?: string | null;
  clientName: string;
  clientDoc?: string | null;
  clientAddress?: string | null;
  clientPhone?: string | null;
  productName: string;
  variantLabel?: string | null;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
  currency?: string | null;
  notes?: string | null;
  /** Estado vivo de la venta ("CANCELED" si está anulada); no es parte del snapshot. */
  saleStatus?: string | null;
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
  /** Auditoría de la anulación: fecha ISO, usuario y motivo. */
  canceledAt?: string | null;
  canceledBy?: string | null;
  cancelReason?: string | null;
  totalFees: number;
  status?: string;
  kind: SaleKind;
  /** Moneda ISO 4217 congelada al crear la transacción (snapshot) */
  currency?: string | null;
  /** Remito emitido (si existe). */
  remito?: RemitoResumenDto | null;
  /** Vendedor sellado en la operación (autoría comercial). Null = sin atribuir. */
  sellerId?: number | null;
  sellerName?: string | null;
}

export interface FeeDto {
  id: number;
  saleId: number;
  numberFee: number;
  /** Monto programado de la cuota: no se sobrescribe al cobrar */
  amount: number;
  expirationDate: string;
  paid: boolean;
  paymentDate?: string;
  /** Monto efectivamente cobrado (suma de los pagos de la cuota) */
  paidAmount?: number;
  /** Fecha y hora del último cobro (para mostrar el horario) */
  lastPaymentAt?: string;
  paymentMethod?: string;
  postponed: boolean;
  productDescription: string;
  status: 'PENDING' | 'PAID';
  /** Moneda ISO 4217 heredada de la venta (snapshot de la transacción) */
  currency?: string | null;
}

/** Un cobro registrado sobre una cuota (puede haber varios por día). */
export interface PaymentDto {
  id: number;
  amount: number;
  /** Fecha y hora del cobro sellada por el backend (ISO con hora) */
  paidAt: string;
  paymentMethod?: string | null;
}