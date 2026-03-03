import { authenticatedFetch } from "@/features/auth/services/authServices";
import { Client } from "@/types/client";
import { CreateSaleRequest, ProductTypeDto, SaleResponseDto } from "@/types/sales";
import { SaleFormData } from "../components/SaleForm";


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
    // console.log('Response:', response);

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

    const data = await response.json();
    console.log('Data:', data);
    return data;
  },
  // obtener cuotas a cobrar es decir cuotas atrasadas y cuotas de hoy
  async getFeesDue(params: {
    page: number;
    size: number;
    date?: string;
    clientName?: string;
    descriptionProduct?: string;
    productType?: string;
  }): Promise<Page<SaleResponseDto>> {
    const url = new URL(`${API_BASE_URL}/delayed-fees`);

    // console.log("Params received in getFeesDue:", params);
    url.searchParams.append('page', params.page.toString());
    url.searchParams.append('size', params.size.toString());

    // si no tengo fecha uso la actual
    if (!params?.date) {
      const today = new Date();

      // console.log("No date param, using today's date: " + today.toISOString().split('T')[0]);
  
      url.searchParams.append('date', today.toISOString().split('T')[0]);
    }else{
      url.searchParams.append('date', params.date);
      // console.log("date param: " + params.date);
    }

    if (params?.clientName) {
      url.searchParams.append('clientName', params.clientName);
    }
    if (params?.descriptionProduct) {
      url.searchParams.append('descriptionProduct', params.descriptionProduct);
    }
    // if (params?.status) {
    //   url.searchParams.append('status', params.status);
    // }
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
    // console.log("data"+ date)
    const url = new URL(API_BASE_URL+'/fees-to-charge-today');
    if (date) {
      url.searchParams.append('date', date);    
    }
    if (productType) {
      url.searchParams.append('productType', productType);
    }
    const response = await authenticatedFetch(url.toString());

      // imprimir response en consola
    // const data = await response.clone().json().catch(() => null);
    // console.log('Response:', response);
    // console.log('Data:', data);

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
    // console.log('Response:', response);
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
  async updateSale(id: number, saleData: SaleFormData): Promise<void> {
    console.log('Updating sale with data:', saleData);

    const data = {
      amountFee: saleData.amountFee,
      descriptionProduct: saleData.descriptionProduct,
      payments: saleData.payments,
      quantityFees: saleData.quantityFees,
      cost: saleData.cost,
      productType: saleData.productTypeId,
      clientId: saleData.clientId
    };

    // la fecha va en la url como request param
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}?date=${saleData.dateSale}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Se mejora el manejo de errores para leer el cuerpo de la respuesta
      // como texto si no es un JSON válido.
      let errorDetail = 'Error al actualizar la venta';
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.message || JSON.stringify(errorBody);
      } catch (e) {
        errorDetail = await response.text();
      }
      throw new Error(errorDetail);
    }
    // No se procesa el cuerpo de la respuesta en caso de éxito para evitar el error de parseo,
    // ya que el backend devuelve texto plano en lugar de JSON.
  }
  ,

  // Eliminar venta
  async deleteSale(id: number): Promise<void> {
    console.log('Deleting sale with id:', id);
    const response = await authenticatedFetch(`${API_BASE_URL}/deleted/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar la venta');
    }
  },

  async markFeeAsPaid(feeId: number, amount: number, date: string ): Promise<void> {
    console.log("Marking fee as paid: feeId=" + feeId + ", amount=" + amount, typeof amount, "date=" + date, typeof date);
    const url = `${API_BASE_URL}/collects-fee/${feeId}/pay?amount=${amount}&date=${date}`;
    const response = await authenticatedFetch(url, {
      method: 'POST'
      // No agregues headers ni body aquí
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }
  },

  async postponeFee(saleId: number, feeId: number, newDateExpiration: string, amount: number, newDatePayment?: string): Promise<void> {
    console.log(`Postponing fee: saleId=${saleId}, feeId=${feeId}, newDateExpiration=${newDateExpiration}, amount=${amount}, newDatePayment=${newDatePayment}`);
    let url = `${API_BASE_URL}/fee/${feeId}/postpone?newDateExpiration=${newDateExpiration}&amount=${amount}`;
    if (newDatePayment) {
      url += `&newDatePayment=${newDatePayment}`;
    }
    const response = await authenticatedFetch(url, {
      method: 'POST',
      // No enviamos headers ni body porque son Query Params
    });

    if (!response.ok) {
      let errorDetail = 'Error al posponer la cuota';
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.message || JSON.stringify(errorBody);
      } catch (e) {
        const text = await response.text();
        if (text) errorDetail = text;
      }
      throw new Error(errorDetail);
    }
  },

  async deleteFee(feeId: number): Promise<void> {
    console.log(`Deleting fee: feeId=${feeId}`);
    const response = await authenticatedFetch(`${API_BASE_URL}/fee/${feeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      let errorDetail = 'Error al eliminar la cuota';
      try {
        const text = await response.text();
        try {
          const errorBody = JSON.parse(text);
          errorDetail = errorBody.message || JSON.stringify(errorBody);
        } catch {
          if (text) errorDetail = text;
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorDetail);
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