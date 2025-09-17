import { authenticatedFetch } from './authServices';

const API_BASE_URL = 'http://localhost:8080/api/loans';

export interface ClientDto {
  id: number;
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  isSeller: boolean;
  sellerName?: string;
  dni: string;
}

export interface ProductTypeDto {
  id: number;
  name: string;
  description?: string;
}

export interface FeeDto {
  id: number;
  saleId: number;
  numberFee: number;
  amount: number;
  expirationDate: string;
  paid: boolean;
  paymentDate?: string;
  postponed: boolean;
  productDescription: string;
  status: 'PENDING' | 'PAID';
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
  productType: {
    id: number,
    name: string
  }
}


export const salesService = {
  // Obtener todas las ventas (excluyendo préstamos por defecto)
  async getAllSales(productType: string = 'PRESTAMO'): Promise<SaleResponseDto[] | []> {
    const response = await authenticatedFetch(`${API_BASE_URL}?productType=${productType}`);

    // imprimir response en consola
    console.log('Response:', response);

    if (!response.ok) {
      throw new Error('Error al obtener las ventas');
    }
    return response.json();
  },

  // Obtener cuotas a cobrar hoy o fecha especificada con request param date
  async getFeesDueOn(productType:string ,date: string): Promise<SaleResponseDto[]> {
    console.log("data"+ date)
    const url = new URL(API_BASE_URL+'/fees-to-charge-today');
    if (date) {
      url.searchParams.append('date', date);    
    }
    if (productType) {
      url.searchParams.append('productType', productType);
    }
    const response = await authenticatedFetch(url.toString());

      // imprimir response en consola
    const data = await response.clone().json().catch(() => null);
    console.log('Response:', response);
    console.log('Data:', data);

    if (!response.ok) {
      throw new Error('Error al obtener las cuotas');
    }
    return response.json();
  },

  // Obtener todos los préstamos
  async getAllLoans(): Promise<SaleResponseDto[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}?productType=VENTA`);
    if (!response.ok) {
      throw new Error('Error al obtener los préstamos');
    }
    return response.json();
  },

  // Obtener venta por ID
  async getSaleById(id: number): Promise<SaleResponseDto> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener la venta');
    }
    console.log('Response:', response);
    return response.json();
  },

  // Crear nueva venta
  async createSale(saleData: CreateSaleRequest): Promise<SaleResponseDto> {
    console.log('Creating sale with data:', saleData);
    const response = await authenticatedFetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al crear la venta' }));
      throw new Error(errorData.message || 'Error al crear la venta');
    }

    return response.json();
  },

  // Actualizar venta
  async updateSale(id: number, saleData: Partial<CreateSaleRequest>): Promise<SaleResponseDto> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al actualizar la venta' }));
      throw new Error(errorData.message || 'Error al actualizar la venta');
    }

    return response.json();
  },

  // Eliminar venta
  async deleteSale(id: number): Promise<void> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la venta');
    }
  },

  async markFeeAsPaid(feeId: number, amount: number): Promise<void> {
    console.log("Marking fee as paid: feeId=" + feeId + ", amount=" + amount, typeof amount);
    const url = `${API_BASE_URL}/collects-fee/${feeId}/pay?amount=${amount}`;
    const response = await authenticatedFetch(url, {
      method: 'POST'
      // No agregues headers ni body aquí
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('Error response:', text);
      throw new Error('Error al marcar la cuota como pagada');
    }
  },

  async postponeFee(saleId: number, feeId: number, newDate: string): Promise<void> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${saleId}/fees/${feeId}/postpone`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newExpirationDate: newDate }),
    });

    if (!response.ok) {
      throw new Error('Error al posponer la cuota');
    }
  },

  // Obtener estadísticas de ventas
  async getSalesStats(): Promise<{
    totalSales: number;
    totalLoans: number;
    completedSales: number;
    pendingSales: number;
    totalRevenue: number;
    totalOutstanding: number;
  }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/stats`);
    if (!response.ok) {
      throw new Error('Error al obtener las estadísticas');
    }
    return response.json();
  },
};