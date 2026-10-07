import { authenticatedFetch } from "@/features/auth/services/authServices";
import { Client } from "@/shared/types/client";
import type { DashboardStatsDto } from "@/shared/types/dashboard";
import {
  CreateSaleRequest,
  ProductDto,
  ProductTypeDto,
  SaleResponseDto,
  SalesCountsDto,
  UpdateSaleRequest,
} from "@/shared/types/sales";
import { CLIENTS_API_URL, LOANS_API_URL, PRODUCTS_API_URL, PRODUCT_TYPES_API_URL, SALES_API_URL } from "@/shared/config/api";
import { handleResponse } from "@/shared/utils/http";

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
  async getSellers(): Promise<Client[]> {
    const response = await authenticatedFetch(
      `${CLIENTS_API_URL}/vendedores/activos`,
    );
    if (!response.ok) {
      throw new Error("Error al obtener los vendedores");
    }
    return response.json();
  },

  async getClientsBySeller(sellerId: number): Promise<Client[]> {
    const response = await authenticatedFetch(
      `${CLIENTS_API_URL}/vendedor/${sellerId}/clientes`,
    );
    if (!response.ok) {
      throw new Error("Error al obtener los clientes del vendedor");
    }
    return response.json();
  },

  async getProductTypes(): Promise<ProductTypeDto[]> {
    const response = await authenticatedFetch(
      `${PRODUCT_TYPES_API_URL}/all`,
    );
    if (!response.ok) {
      throw new Error("Error al obtener los tipos de productos");
    }
    return response.json();
  },

  async createProductType(name: string): Promise<ProductTypeDto> {
    const response = await authenticatedFetch(PRODUCT_TYPES_API_URL, {
      method: "POST",
      body: JSON.stringify(name),
    });
    if (!response.ok) {
      throw new Error("Error al crear la categoría");
    }
    return response.json();
  },

  async updateProductType(id: number, name: string): Promise<void> {
    const response = await authenticatedFetch(`${PRODUCT_TYPES_API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(name),
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.updated === false) {
          throw new Error("No se pudo actualizar la categoría (verifica el nombre)");
        }
        throw new Error(apiResponse?.message || "Error al actualizar la categoría");
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "Ocurrió un error desconocido");
      }
    }
  },

  async deleteProductType(id: number): Promise<void> {
    const response = await authenticatedFetch(`${PRODUCT_TYPES_API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.deleted === false) {
          throw new Error("La categoría está en uso y no se puede eliminar");
        }
        throw new Error(apiResponse?.message || "Error al eliminar la categoría");
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "Ocurrió un error desconocido");
      }
    }
  },

  async getProducts(): Promise<ProductDto[]> {
    const response = await authenticatedFetch(`${PRODUCTS_API_URL}/all`);
    if (!response.ok) {
      throw new Error("Error al obtener los productos");
    }
    return response.json();
  },

  async createProduct(payload: {
    name: string;
    price?: number | null;
    stock?: number | null;
    productTypeId?: number | null;
  }): Promise<void> {
    const response = await authenticatedFetch(PRODUCTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        price: payload.price ?? null,
        stock: payload.stock ?? null,
        productTypeId: payload.productTypeId ?? null,
      }),
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.created === false) {
          throw new Error("No se pudo crear el producto (verifica el nombre, el precio, el stock y la categoría)");
        }
        throw new Error(apiResponse?.message || "Error al crear el producto");
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error("Ocurrió un error desconocido");
      }
    }
  },

  async updateProduct(
    id: number,
    payload: {
      name: string;
      price?: number | null;
      stock?: number | null;
      productTypeId?: number | null;
    },
  ): Promise<void> {
    const response = await authenticatedFetch(`${PRODUCTS_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        price: payload.price ?? null,
        stock: payload.stock ?? null,
        productTypeId: payload.productTypeId ?? null,
      }),
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.updated === false) {
          throw new Error("No se pudo actualizar el producto (verifica el nombre, el precio, el stock y la categoría)");
        }
        throw new Error(apiResponse?.message || "Error al actualizar el producto");
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error("Ocurrió un error desconocido");
      }
    }
  },

  async deleteProduct(id: number): Promise<void> {
    const response = await authenticatedFetch(`${PRODUCTS_API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.deleted === false) {
          throw new Error("El producto está en uso y no se puede eliminar");
        }
        throw new Error(apiResponse?.message || "Error al eliminar el producto");
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error("Ocurrió un error desconocido");
      }
    }
  },

  async getAllSales(): Promise<SaleResponseDto[]> {
    const response = await authenticatedFetch(
      `${SALES_API_URL}?kind=VENTA`,
    );
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
    aCobrar?: boolean;
    productType?: string;
    kind?: string;
    typePayments?: string;
    minAmount?: number;
    maxAmount?: number;
    sort?: string;
  }): Promise<Page<SaleResponseDto>> {
    const url = new URL(SALES_API_URL);
    url.searchParams.append("page", params.page.toString());
    url.searchParams.append("size", params.size.toString());
    if (params.year) url.searchParams.append("year", params.year.toString());
    if (params.month) url.searchParams.append("month", params.month.toString());
    if (params.day) url.searchParams.append("day", params.day.toString());
    if (params.clientName)
      url.searchParams.append("clientName", params.clientName);
    if (params.descriptionProduct)
      url.searchParams.append("descriptionProduct", params.descriptionProduct);
    if (params.status) url.searchParams.append("status", params.status);
    if (params.aCobrar) url.searchParams.append("aCobrar", "true");
    if (params.productType)
      url.searchParams.append("productType", params.productType);
    if (params.kind) url.searchParams.append("kind", params.kind);
    if (params.typePayments)
      url.searchParams.append("typePayments", params.typePayments);
    if (params.minAmount !== undefined)
      url.searchParams.append("minAmount", params.minAmount.toString());
    if (params.maxAmount !== undefined)
      url.searchParams.append("maxAmount", params.maxAmount.toString());
    if (params.sort) url.searchParams.append("sort", params.sort);

    const response = await authenticatedFetch(url.toString());
    return handleResponse<Page<SaleResponseDto>>(response);
  },

  async getSalesCounts(kind?: string): Promise<SalesCountsDto> {
    const url = new URL(`${SALES_API_URL}/counts`);
    if (kind) url.searchParams.append("kind", kind);

    const response = await authenticatedFetch(url.toString());
    return handleResponse<SalesCountsDto>(response);
  },

  async getAllLoans(): Promise<SaleResponseDto[]> {
    const response = await authenticatedFetch(
      `${SALES_API_URL}?kind=PRESTAMO`,
    );
    return handleResponse<SaleResponseDto[]>(response);
  },

  async getSaleById(id: number): Promise<SaleResponseDto> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/${id}`);
    return handleResponse<SaleResponseDto>(response);
  },

  async createSale(saleData: CreateSaleRequest): Promise<SaleResponseDto> {
    const response = await authenticatedFetch(LOANS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });
    return handleResponse<SaleResponseDto>(response);
  },

  async updateSale(id: number, saleData: UpdateSaleRequest): Promise<void> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });

    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "Ocurrió un error desconocido");
      }
    }
  },

  async deleteSale(id: number): Promise<void> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/deleted/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "Ocurrió un error desconocido");
      }
    }
  },

  async cancelSale(id: number, refund: boolean = true): Promise<SaleResponseDto> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/cancel/${id}?refund=${refund}`, {
      method: "PUT",
    });

    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "Ocurrió un error desconocido");
      }
    }

    const apiResponse = await response.json();
    return apiResponse.data;
  },

  async markFeeAsPaid(
    feeId: number,
    amount: number,
    date: string,
    paymentMethod: string = 'EFECTIVO',
  ): Promise<void> {
    const url = `${LOANS_API_URL}/collects-fee/${feeId}/pay?amount=${amount}&date=${date}&paymentMethod=${paymentMethod}`;
    const response = await authenticatedFetch(url, { method: "POST" });

    if (!response.ok) {
      // Si la respuesta no es ok, intenta parsear el cuerpo como JSON para obtener el mensaje de error
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        // Si el cuerpo no es JSON o hay otro error, lanza un error genérico
        throw new Error(e instanceof Error ? e.message : "Ocurrió un error desconocido");
      }
    }
    // Si la respuesta es ok, no se necesita procesar el cuerpo si se espera que esté vacío
  },

  async postponeFee(
    _saleId: number,
    feeId: number,
    newDateExpiration: string,
    amount: number,
    newDatePayment?: string,
  ): Promise<void> {
    // Usamos URLSearchParams para construir los parámetros de la URL dinámicamente
    const params = new URLSearchParams();
    params.append("newDateExpiration", newDateExpiration);

    if (newDatePayment) {
      params.append("newDatePayment", newDatePayment);
    }

    // ATENCIÓN: Se asume que si el monto es 0, no se quiere modificar en este contexto.
    // Solo agregamos 'amount' a la URL si es un número válido, no nulo y diferente de 0.
    // Intencional: enviar amount=0 haría que el backend desmarque el pago (paid=false),
    // y un 0 accidental al editar una cuota pagada desmarcaría el cobro por error.
    if (amount !== null && !isNaN(amount)) {
      params.append("amount", amount.toString());
    }

    const url = `${LOANS_API_URL}/fee/${feeId}/postpone?${params.toString()}`;

    const response = await authenticatedFetch(url, { method: "POST" });

    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        console.error("Error al posponer la cuota:", apiResponse);
        throw new Error(apiResponse.message);
      } catch (e) {
        // Es una buena práctica asegurarse de que 'e' es un error antes de acceder a .message
        const errorMessage =
          e instanceof Error ? e.message : "Ocurrió un error desconocido";
        throw new Error(errorMessage);
      }
    }
  },

  async deleteFee(feeId: number): Promise<void> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/fee/${feeId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse.message);
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "Ocurrió un error desconocido");
      }
    }
  },

  async getDashboardStats(
    year: number,
    month: number,
  ): Promise<DashboardStatsDto> {
    const url = new URL(`${SALES_API_URL}/dashboard`);
    url.searchParams.append("year", year.toString());
    url.searchParams.append("month", month.toString());

    const response = await authenticatedFetch(url.toString());
    return handleResponse<DashboardStatsDto>(response);
  },
};
