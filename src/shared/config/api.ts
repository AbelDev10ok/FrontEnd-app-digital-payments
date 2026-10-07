export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const AUTH_API_URL = `${API_BASE_URL}/auth`;
export const CLIENTS_API_URL = `${API_BASE_URL}/api/clients`;
export const LOANS_API_URL = `${API_BASE_URL}/api/loans`;
export const SALES_API_URL = `${API_BASE_URL}/api/sales`;
export const PRODUCT_TYPES_API_URL = `${API_BASE_URL}/api/product-types`;
export const PRODUCTS_API_URL = `${API_BASE_URL}/api/products`;
export const BUSINESS_API_URL = `${API_BASE_URL}/api/business`;
export const BILLING_API_URL = `${API_BASE_URL}/api/billing`;
export const USUARIOS_API_URL = `${API_BASE_URL}/api/usuarios`;
