import { authenticatedFetch } from "@/features/auth/services/authServices";
import { Client } from "@/shared/types/client";
import type { DashboardStatsDto } from "@/shared/types/dashboard";
import {
  AttributeDto,
  CreateSaleRequest,
  PaymentDto,
  ProductDto,
  ProductPayload,
  ProductTypeDto,
  SaleDocumentDto,
  SaleResponseDto,
  SalesCountsDto,
  UpdateSaleRequest,
} from "@/shared/types/sales";
import { ATTRIBUTES_API_URL, CLIENTS_API_URL, LOANS_API_URL, PRODUCTS_API_URL, PRODUCT_TYPES_API_URL, SALES_API_URL } from "@/shared/config/api";
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

  async createProductType(payload: {
    name: string;
    parentId?: number | null;
    /** Slug explícito; si se omite se genera desde el nombre */
    slug?: string | null;
  }): Promise<ProductTypeDto> {
    const response = await authenticatedFetch(PRODUCT_TYPES_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        parentId: payload.parentId ?? null,
        slug: payload.slug ?? null,
      }),
    });
    if (!response.ok) {
      throw new Error("Error al crear la categoría");
    }
    return response.json();
  },

  async updateProductType(
    id: number,
    payload: {
      name: string;
      parentId?: number | null;
      slug?: string | null;
    },
  ): Promise<void> {
    const response = await authenticatedFetch(`${PRODUCT_TYPES_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        parentId: payload.parentId ?? null,
        slug: payload.slug ?? null,
      }),
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.updated === false) {
          throw new Error("No se pudo actualizar la categoría (verifica el nombre y el slug)");
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

  async createProduct(payload: ProductPayload): Promise<void> {
    const response = await authenticatedFetch(PRODUCTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.created === false) {
          throw new Error("No se pudo crear el producto (verifica el nombre, la categoría y las variantes)");
        }
        throw new Error(apiResponse?.message || "Error al crear el producto");
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error("Ocurrió un error desconocido");
      }
    }
  },

  async updateProduct(id: number, payload: ProductPayload): Promise<void> {
    const response = await authenticatedFetch(`${PRODUCTS_API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.updated === false) {
          throw new Error("No se pudo actualizar el producto (verifica el nombre, la categoría y las variantes)");
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

  async getAttributes(): Promise<AttributeDto[]> {
    const response = await authenticatedFetch(`${ATTRIBUTES_API_URL}/all`);
    if (!response.ok) {
      throw new Error("Error al obtener los atributos");
    }
    return response.json();
  },

  async createAttribute(payload: { name: string; values: string[] }): Promise<AttributeDto> {
    const response = await authenticatedFetch(ATTRIBUTES_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name,
        values: payload.values.map((value) => ({ value })),
      }),
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse?.message || "Error al crear el atributo");
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error("Error al crear el atributo");
      }
    }
    return response.json();
  },

  async addAttributeValue(attributeId: number, value: string): Promise<AttributeDto> {
    const response = await authenticatedFetch(`${ATTRIBUTES_API_URL}/${attributeId}/values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        throw new Error(apiResponse?.message || "Error al agregar el valor");
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error("Error al agregar el valor");
      }
    }
    return response.json();
  },

  async deleteAttribute(id: number): Promise<void> {
    const response = await authenticatedFetch(`${ATTRIBUTES_API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      try {
        const apiResponse = await response.json();
        if (apiResponse?.deleted === false) {
          throw new Error("El atributo está en uso y no se puede eliminar");
        }
        throw new Error(apiResponse?.message || "Error al eliminar el atributo");
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

  /** Remito emitido de una venta, o null si todavía no se emitió. */
  async getRemito(saleId: number): Promise<SaleDocumentDto | null> {
    const response = await authenticatedFetch(`${SALES_API_URL}/${saleId}/remito`);
    if (response.status === 404) return null;
    return handleResponse<SaleDocumentDto>(response);
  },

  /** Emite el remito (idempotente) y devuelve el snapshot guardado. */
  async emitirRemito(saleId: number, notes?: string): Promise<SaleDocumentDto> {
    const response = await authenticatedFetch(`${SALES_API_URL}/${saleId}/remito`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes?.trim() ? notes.trim() : null }),
    });
    return handleResponse<SaleDocumentDto>(response);
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

  /** Historial de cobros de una cuota (con fecha y hora de cada pago). */
  async getFeePayments(feeId: number): Promise<PaymentDto[]> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/fee/${feeId}/payments`);
    if (!response.ok) {
      throw new Error("Error al cargar el historial de cobros de la cuota");
    }
    return response.json();
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
    currency?: string | null,
  ): Promise<DashboardStatsDto> {
    const url = new URL(`${SALES_API_URL}/dashboard`);
    url.searchParams.append("year", year.toString());
    url.searchParams.append("month", month.toString());
    // "TODAS" (o ausente) = todas las monedas; un código ISO acota montos y conteos
    if (currency && currency !== "TODAS") {
      url.searchParams.append("currency", currency);
    }

    const response = await authenticatedFetch(url.toString());
    return handleResponse<DashboardStatsDto>(response);
  },
};
