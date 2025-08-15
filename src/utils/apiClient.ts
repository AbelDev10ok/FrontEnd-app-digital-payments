import { authenticatedFetch } from '../services/authServices';

// Cliente API que maneja automáticamente el refresh de tokens
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8080') {
    this.baseURL = baseURL;
  }

  async get(endpoint: string) {
    const response = await authenticatedFetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
    });
    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await authenticatedFetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async put(endpoint: string, data: any) {
    const response = await authenticatedFetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete(endpoint: string) {
    const response = await authenticatedFetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();