import { authenticatedFetch } from "@/features/auth/services/authServices";
import { Client } from "@/types/client";
import { CreateSaleRequest, ProductTypeDto, SaleResponseDto, UpdateSaleRequest } from "@/types/sales";

const API_BASE_URL = 'http://localhost:8080/api/loans';

// Definición de la interfaz para la nueva estructura de respuesta
interface ApiResponse<T> {
  message: string;
  status: string; // O un enum si se prefieren valores fijos como 'OK', 'BAD_REQUEST'
  data: T;
}

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

// Función de ayuda para manejar la nueva respuesta de la API
async function handleResponse<T>(response: Response): Promise<T> {
  const apiResponse: ApiResponse<T> = await response.json();
  if (response.ok && apiResponse.status === 'OK') {
    return apiResponse.data;
  } else {
    throw new Error(apiResponse.message || 'Ocurrió un error');
  }
}

export const salesService = {

  async getSellers(): Promise<Client[]> {
    const response = await authenticatedFetch('http://localhost:8080/api/clients/vendedores');
    if (!response.ok) {
      throw new Error('Error al obtener los vendedores');
    }
    return response.json();
  },

  async getClientsBySeller(sellerId: number): Promise<Client[]> {
    const response = await authenticatedFetch(`http://localhost:8080/api/clients/vendedor/${sellerId}/clientes`);
    if (!response.ok) {
      throw new Error('Error al obtener los clientes del vendedor');
    }
    return response.json();
  },

  async getProductDescriptions(productType: string): Promise<SaleResponseDto[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/search-by-description?description=${productType}`);
    return handleResponse<SaleResponseDto[]>(response);
  },

  async getProductTypes(): Promise<ProductTypeDto[]> {
    const response = await authenticatedFetch('http://localhost:8080/api/product-types/all');
    if (!response.ok) {
      throw new Error('Error al obtener los tipos de productos');
    }
    return response.json();
  },

  async getAllSales(productType: string = 'PRESTAMO'): Promise<SaleResponseDto[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}?productType=${productType}`);
    return handleResponse<SaleResponseDto[]>(response);
  },

  async getAllSalesPaginated(params: {
    page: number;
    size: number;
    year?: number;
    month?: number;
    day?: number;
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
    if (params.day) url.searchParams.append('day', params.day.toString());
    if (params.clientName) url.searchParams.append('clientName', params.clientName);
    if (params.descriptionProduct) url.searchParams.append('descriptionProduct', params.descriptionProduct);
    if (params.status) url.searchParams.append('status', params.status);
    if (params.productType) url.searchParams.append('productType', params.productType);
    console.log('URL completa:', url.toString());

    const response = await authenticatedFetch(url.toString());
    return handleResponse<Page<SaleResponseDto>>(response);
  },

  async getFeesDue(params: {
    page: number;
    size: number;
    date?: string;
    clientName?: string;
    descriptionProduct?: string;
    productType?: string;
  }): Promise<Page<SaleResponseDto>> {
    const url = new URL(`${API_BASE_URL}/delayed-fees`);
    url.searchParams.append('page', params.page.toString());
    url.searchParams.append('size', params.size.toString());
    const date = params.date || new Date().toISOString().split('T')[0];
    url.searchParams.append('date', date);

    if (params.clientName) url.searchParams.append('clientName', params.clientName);
    if (params.descriptionProduct) url.searchParams.append('descriptionProduct', params.descriptionProduct);
    if (params.productType) url.searchParams.append('productType', Number(params.productType).toString());

    const response = await authenticatedFetch(url.toString());
    return handleResponse<Page<SaleResponseDto>>(response);
  },

  async getFeesDueOn(productType: string, date: string): Promise<SaleResponseDto[]> {
    const url = new URL(`${API_BASE_URL}/fees-to-charge-today`);
    url.searchParams.append('date', date);
    url.searchParams.append('productType', productType);
    const response = await authenticatedFetch(url.toString());
    return handleResponse<SaleResponseDto[]>(response);
  },

  async getAllLoans(): Promise<SaleResponseDto[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}?productType=VENTA`);
    return handleResponse<SaleResponseDto[]>(response);
  },

  async getSaleById(id: number): Promise<SaleResponseDto> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}`);
    return handleResponse<SaleResponseDto>(response);
  },

  async createSale(saleData: CreateSaleRequest): Promise<SaleResponseDto> {
    console.log('Enviando solicitud de creación de venta con los siguientes datos:', saleData);
    console.log('Endpoint al que se está enviando la solicitud:', API_BASE_URL);
    console.log('data en formato JSON:', JSON.stringify(saleData));
    const response = await authenticatedFetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
    return handleResponse<SaleResponseDto>(response);
  },

  async updateSale(id: number, saleData: UpdateSaleRequest): Promise<void> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        throw new Error(e.message);
      }
    }
  },

  async deleteSale(id: number): Promise<void> {
    const response = await authenticatedFetch(`${API_BASE_URL}/deleted/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        throw new Error(e.message);
      }
    }
  },

  async markFeeAsPaid(feeId: number, amount: number, date: string): Promise<void> {
    const url = `${API_BASE_URL}/collects-fee/${feeId}/pay?amount=${amount}&date=${date}`;
    const response = await authenticatedFetch(url, { method: 'POST' });

    if (!response.ok) {
      // Si la respuesta no es ok, intenta parsear el cuerpo como JSON para obtener el mensaje de error
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        // Si el cuerpo no es JSON o hay otro error, lanza un error genérico
        throw new Error(e.message);
      }
    }
    // Si la respuesta es ok, no se necesita procesar el cuerpo si se espera que esté vacío
  },

async postponeFee(saleId: number, feeId: number, newDateExpiration: string, amount: number, newDatePayment?: string): Promise<void> {
    // Usamos URLSearchParams para construir los parámetros de la URL dinámicamente
    const params = new URLSearchParams();
    params.append('newDateExpiration', newDateExpiration);

    if (newDatePayment) {
      params.append('newDatePayment', newDatePayment);
    }
    
    // ATENCIÓN: Se asume que si el monto es 0, no se quiere modificar en este contexto.
    // Solo agregamos 'amount' a la URL si es un número válido, no nulo y diferente de 0.
    if (amount !== null && !isNaN(amount)) {
      params.append('amount', amount.toString());
    }

    const url = `${API_BASE_URL}/fee/${feeId}/postpone?${params.toString()}`;
    
    const response = await authenticatedFetch(url, { method: 'POST' });

    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        console.error('Error al posponer la cuota:', apiResponse);
        throw new Error(apiResponse.message);
      } catch (e) {
        // Es una buena práctica asegurarse de que 'e' es un error antes de acceder a .message
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido';
        throw new Error(errorMessage);
      }
    }
},

  async deleteFee(feeId: number): Promise<void> {
    console.log(`Intentando eliminar la cuota con ID: ${feeId}`);
    const response = await authenticatedFetch(`${API_BASE_URL}/fee/${feeId}`, { method: 'DELETE' });
    
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        throw new Error(e.message);
      }
    }
  },

  async getSalesStats(): Promise<{
    totalSales: number;
    totalLoans: number;
    completedSales: number;
    pendingSales: number;
    totalRevenue: number;
    totalOutstanding: number;
  }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/stats`);
    // Se asume que este endpoint también sigue el nuevo formato
    return handleResponse<{
      totalSales: number;
      totalLoans: number;
      completedSales: number;
      pendingSales: number;
      totalRevenue: number;
      totalOutstanding: number;
    }>(response);
  },
};

