import { authenticatedFetch } from "@/features/auth/services/authServices";
import { Client, ClientRequest } from "@/shared/types/client";
import { CLIENTS_API_URL } from "@/shared/config/api";
import { getErrorMessage } from "@/shared/utils/http";

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
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}


export const clientService = {

  // Obtener clientes paginados con filtros opcionales
  async getClientsPaginated(params: {
    page: number;
    size: number;
    search?: string;
    sellerId?: number | null;
    withoutSeller?: boolean;
  }): Promise<Page<Client>> {
    const url = new URL(CLIENTS_API_URL);
    url.searchParams.append('page', params.page.toString());
    url.searchParams.append('size', params.size.toString());
    if (params.search) url.searchParams.append('search', params.search);
    if (params.sellerId) url.searchParams.append('sellerId', params.sellerId.toString());
    if (params.withoutSeller) url.searchParams.append('withoutSeller', 'true');

    const response = await authenticatedFetch(url.toString());
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al obtener los clientes paginados'));
    }
    return response.json();
  },

  // Obtener cliente por ID
  async getClientById(id: number): Promise<Client> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al obtener el cliente'));
    }

    return response.json();
  },

  // Calcular deuda total de ventas de un cliente
  async calcularDeudaTotalVentas(id: number): Promise<number> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}/deuda-ventas`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al calcular la deuda total de ventas'));
    }
    return response.json();
  },

  // Calcular total de ventas pagadas de un cliente
  async calcularTotalVentasPagadas(id: number): Promise<number> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}/total-ventas-pagadas`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al calcular el total de ventas pagadas'));
    }

    return response.json();
  },

  // Calcular deuda total de préstamos de un cliente
  async calcularDeudaTotalPrestamos(id: number): Promise<number> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}/deuda-prestamos`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al calcular la deuda total de préstamos'));
    }
    return response.json();
  },

  // Calcular total de préstamos pagados de un cliente
  async calcularTotalPrestamosPagados(id: number): Promise<number> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}/total-prestamos-pagados`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al calcular el total de préstamos pagados'));
    }
    return response.json();
  },

  // Habilitar cliente como vendedor
  async habilitarVendedor(id: number): Promise<void> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}/habilitar`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al habilitar como vendedor'));
    }
  },

  // Desabilitar cliente como vendedor
  async desabilitarVendedor(id: number):Promise<void>{
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}/desabilitar`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al deshabilitar como vendedor'));
    }
  },

  // Crear nuevo cliente
  async createClient(clientData: ClientRequest): Promise<Client> {
    const response = await authenticatedFetch(CLIENTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al crear el cliente'));
    }

    return response.json();
  },

  // Actualizar cliente
  async updateClient(id: number, clientData: ClientRequest): Promise<Client> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al actualizar el cliente'));
    }

    return response.json();
  },

  // Eliminar cliente
  async deleteClient(id: number): Promise<void> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Error al eliminar el cliente'));
    }
  },

  // obtener vendedores
  async getVendedoresConClientesAsignados(): Promise<Client[]> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/vendedores`);
    if (!response.ok) {
      throw new Error('Error al obtener los vendedores');
    }
    return response.json();
  },


  async getVendedoresActivos(): Promise<Client[]> {
    const response = await authenticatedFetch(`${CLIENTS_API_URL}/vendedores/activos`);
    if (!response.ok) {
      throw new Error('Error al obtener los vendedores activos');
    }
    return response.json();
  },

};
