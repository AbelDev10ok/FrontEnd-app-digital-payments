import { authenticatedFetch } from './authServices';
import { Client } from './clientServices';

const API_BASE_URL = 'http://localhost:8080/api/loans';

export interface Page<T> {
  content: T[];
  pageable: {
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

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
  productType: number;
  // Campos opcionales para pago de primera cuota al crear
  firstFeeDate?: string;
  payFirstFee?: boolean;
  firstFeeAmount?: number;
}


export const salesService = {

  // Obtener vendedores (clientes marcados como vendedores)
  async getSellers(): Promise<Client[]> {
    const response = await authenticatedFetch('http://localhost:8080/api/clients/vendedores');
    if (!response.ok) {
      throw new Error('Error al obtener los vendedores');
    }
    return response.json();
  },

  // Obtener clientes asignados a un vendedor específico
  async getClientsBySeller(sellerId: number): Promise<Client[]> {
    const response = await authenticatedFetch(`http://localhost:8080/api/clients/vendedor/${sellerId}/clientes`);
    if (!response.ok) {
      throw new Error('Error al obtener los clientes del vendedor');
    }
    return response.json();
  },

  async getProductDescriptions(productType: string): Promise<SaleResponseDto[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/search-by-description?description=${productType}`);
    if (!response.ok) {
      throw new Error('Error al obtener los tipos de productos');
    }
    return response.json();

  },

  async getProductTypes(): Promise<ProductTypeDto[]> {
    const response = await authenticatedFetch('http://localhost:8080/api/product-types/all');
    if (!response.ok) {
      throw new Error('Error al obtener los tipos de productos');
    }
    return response.json();
  },

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

  async getAllSalesPaginated(params: {
    page: number;
    size: number;
    year?: number;
    month?: number;
    clientName?: string;
    descriptionProduct?: string;
    status?: string;
    productType?: string;
  }): Promise<Page<SaleResponseDto>> {
    const url = new URL(API_BASE_URL);
    url.searchParams.append('page', params.page.toString());
    url.searchParams.append('size', params.size.toString());
    if (params.year) url.searchParams.append('year', params.year.toString());
    if (params.month) url.searchParams.append('month', params.month.toString());
    if (params.clientName) url.searchParams.append('clientName', params.clientName);
    if (params.descriptionProduct) url.searchParams.append('descriptionProduct', params.descriptionProduct);
    if (params.status) url.searchParams.append('status', params.status);
    if (params.productType) url.searchParams.append('productType', params.productType);

    const response = await authenticatedFetch(url.toString());
    if (!response.ok) {
      throw new Error('Error al obtener las ventas paginadas');
    }
    return response.json();
  },
  // obtener cuotas a cobrar es decir cuotas atrasadas y cuotas de hoy
  async getFeesDue(params?: {
    date?: string;
    clientName?: string;
    descriptionProduct?: string;
    status?: string;
    productType?: string;
  }): Promise<SaleResponseDto[]> {
    const url = new URL(`${API_BASE_URL}/delayed-fees`);

    console.log("Params received in getFeesDue:", params);

    // si no tengo fecha uso la actual
    if (!params?.date) {
      const today = new Date();

      console.log("No date param, using today's date: " + today.toISOString().split('T')[0]);
  
      url.searchParams.append('date', today.toISOString().split('T')[0]);
    }else{
      url.searchParams.append('date', params.date);
      console.log("date param: " + params.date);
    }

    if (params?.clientName) {
      url.searchParams.append('clientName', params.clientName);
    }
    if (params?.descriptionProduct) {
      url.searchParams.append('descriptionProduct', params.descriptionProduct);
    }
    if (params?.status) {
      url.searchParams.append('status', params.status);
    }
    if (params?.productType) {
      url.searchParams.append('productType', Number(params.productType).toString());
    }

    const response = await authenticatedFetch(url.toString());
    if (!response.ok) {
      throw new Error('Error al obtener las cuotas');
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