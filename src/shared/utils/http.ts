export interface ApiResponse<T> {
  message: string;
  status: string;
  data: T;
}

// Desenvuelve el envelope { message, status, data } que usan algunos endpoints.
// Solo aplicar en endpoints que devuelven ApiResponse (ej: /api/loans, /api/clients/stats).
export async function handleResponse<T>(response: Response): Promise<T> {
  const apiResponse: ApiResponse<T> = await response.json();
  if (response.ok && apiResponse.status === 'OK') {
    return apiResponse.data;
  } else {
    throw new Error(apiResponse.message || 'Ocurrió un error');
  }
}

// Extrae el mensaje de error de una respuesta no-OK, con fallback por si el body no es JSON.
export async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const errorData = await response.json();
    return errorData?.message || fallback;
  } catch {
    return fallback;
  }
}
