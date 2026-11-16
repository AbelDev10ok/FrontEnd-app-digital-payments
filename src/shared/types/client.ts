import type { MontosPorMoneda } from "@/shared/types/money";

export interface Client {
  id: number;
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  /** Localidad o barrio: desambigua la dirección para la ruta de cobro */
  localidad?: string | null;
  provincia?: string | null;
  codigoPostal?: string | null;
  sellerId?: number;
  sellerName?: string;
  seller: boolean;
  dni?: string;
  /** Deuda por moneda ISO 4217: las monedas distintas nunca se suman entre sí */
  deudaTotal?: MontosPorMoneda;
  /** Clientes en cartera cuando este cliente es vendedor (sólo lo trae el detalle). */
  clientesEnCartera?: number;
}


export interface ClientRequest {
  name: string;
  telefono: string;
  email: string;
  direccion: string;
  localidad?: string | null;
  provincia?: string | null;
  codigoPostal?: string | null;
  sellerId?: number;
  dni?: string
}

  export interface FetchParamsClients {
    page: number;
    size: number;
    search?: string;
    sellerId?: number | null;
    withoutSeller?: boolean;
  };


// export interface ClientDto {
//   id: number;
//   name: string;
//   telefono: string;
//   email: string;
//   direccion: string;
//   isSeller: boolean;
//   sellerName?: string;
//   dni: string;
// }
