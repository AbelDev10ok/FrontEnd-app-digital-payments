export interface Client {
  id: number;
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  sellerId?: number;
  sellerName?: string;
  vendedor: boolean;
  dni?: string;
}


export interface ClientRequest {
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  sellerId?: number;
  dni?: string
}
export interface ClientFormData {
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
}

  export interface FetchParamsClients {
    page: number;
    size: number;
    search?: string;
    sellerId?: number | null;
    withoutSeller?: boolean;
  };


