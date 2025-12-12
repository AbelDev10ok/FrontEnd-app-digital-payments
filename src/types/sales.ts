  // Función fetcher para la paginación
  export interface FetchParamsSales {
    page: number;
    size: number;
    year?: number;
    month?: number;
    clientName?: string;
    descriptionProduct?: string;
    status?: string;
    productType?: string;
  };


