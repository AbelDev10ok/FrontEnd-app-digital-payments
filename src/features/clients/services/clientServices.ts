/* eslint-disable @typescript-eslint/no-explicit-any */

import { authenticatedFetch } from "@/features/auth/services/authServices";
import type { ClientStatsDto } from "@/types/dashboard";
import { Client, ClientRequest } from "@/types/client";


const API_BASE_URL = 'http://localhost:8080/api/clients';

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
    const url = new URL(API_BASE_URL);
    url.searchParams.append('page', params.page.toString());
    url.searchParams.append('size', params.size.toString());
    if (params.search) url.searchParams.append('search', params.search);
    if (params.sellerId) url.searchParams.append('sellerId', params.sellerId.toString());
    if (params.withoutSeller) url.searchParams.append('withoutSeller', 'true');

    const response = await authenticatedFetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al obtener los clientes paginados' }));
      throw new Error(errorData.message || 'Error al obtener los clientes paginados');    }
    return response.json();
  },

  // Obtener cliente por ID
  async getClientById(id: number): Promise<Client> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al obtener el cliente' }));
      throw new Error(errorData.message || 'Error al obtener el cliente');    }

    // console.log('Client data:', await response.clone().json());
    return response.json();
  },

  // Calcular deuda total de ventas de un cliente
  async calcularDeudaTotalVentas(id: number): Promise<number> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}/deuda-ventas`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al calcular la deuda total de ventas' }));
      throw new Error(errorData.message || 'Error al calcular la deuda total de ventas');    }
    return response.json();
  },

  // Calcular total de ventas pagadas de un cliente
  async calcularTotalVentasPagadas(id: number): Promise<number> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}/total-ventas-pagadas`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al calcular el total de ventas pagadas' }));
      throw new Error(errorData.message || 'Error al calcular el total de ventas pagadas');    }

    return response.json();
  },

  // Calcular deuda total de préstamos de un cliente
  async calcularDeudaTotalPrestamos(id: number): Promise<number> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}/deuda-prestamos`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al calcular la deuda total de préstamos' }));
      throw new Error(errorData.message || 'Error al calcular la deuda total de préstamos');    }
    return response.json();
  },

  // Calcular total de préstamos pagados de un cliente
  async calcularTotalPrestamosPagados(id: number): Promise<number> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}/total-prestamos-pagados`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al calcular el total de préstamos pagados' }));
      throw new Error(errorData.message || 'Error al calcular el total de préstamos pagados');    }
    return response.json();
  },

  // Habilitar cliente como vendedor
  async habilitarVendedor(id: number): Promise<void> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}/habilitar`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al habilitar como vendedor' }));
      throw new Error(errorData.message || 'Error al habilitar como vendedor');    }
  },

  // Desabilitar cliente como vendedor
  async desabilitarVendedor(id: number):Promise<void>{
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}/desabilitar`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al Desabilitar como vendedor' }));
      throw new Error(errorData.message || 'Error al deshabilitar como vendedor');    }
  },

  // Crear nuevo cliente
  async createClient(clientData: ClientRequest): Promise<Client> {
    // console.log('CREANDO  Client data:', clientData);
    const response = await authenticatedFetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al crear el cliente' }));
      throw new Error(errorData.message || 'Error al crear el cliente');
    }

    return response.json();
  },

  // Actualizar cliente
  async updateClient(id: number, clientData: ClientRequest): Promise<Client> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    });
    // console.log('Client data:', clientData);


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al actualizar el cliente' }));
      throw new Error(errorData.message || 'Error al actualizar el cliente');
    }

    return response.json();
  },

  // Eliminar cliente
  async deleteClient(id: number): Promise<void> {
    const response = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    // const data = await response.json();

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error al eliminar el cliente' }));
      throw new Error(errorData.message || 'Error al eliminar el cliente');
    }
  },

  // obtener vendedores
  async getVendedoresConClientesAsignados(): Promise<Client[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/vendedores`);
    if (!response.ok) {
      throw new Error('Error al obtener los vendedores');
    }
    return response.json();
  },


  async getVendedoresActivos(): Promise<Client[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/vendedores/activos`);
    if (!response.ok) {
      throw new Error('Error al obtener los vendedores activos');
    }
    return response.json();
  },

  async getClientStats(): Promise<ClientStatsDto> {
    const urlString = `${API_BASE_URL}/stats`;
    console.log('📡 [clientService] GET request a:', urlString);

    try {
      const response = await authenticatedFetch(urlString);
      console.log('📡 [clientService] Response status:', response.status, 'ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al obtener estadísticas de clientes' }));
        throw new Error(errorData.message || 'Error al obtener estadísticas de clientes');
      }
      
      // La API ahora envuelve la respuesta. Necesitamos desenvolverla.
      const apiResponse = await response.json();

      if (apiResponse.status === 'OK' && apiResponse.data) {
        console.log('✅ [clientService] getClientStats parseado y desenvuelto:', apiResponse.data);
        return apiResponse.data as ClientStatsDto;
      } else {
        throw new Error(apiResponse.message || 'La respuesta de la API no tuvo el formato esperado.');
      }

    } catch (err) {
      console.error('❌ [clientService] Error en getClientStats:', err);
      throw err;
    }
  },

};
