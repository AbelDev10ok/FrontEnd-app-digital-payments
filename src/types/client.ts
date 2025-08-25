export interface Client {
  id: number;
  name: string;
  telefono: string;
  email: string;
  direccion: string;
}

export interface ClientRequest {
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  sellerId?: number;
}

export interface ClientFormData {
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
}