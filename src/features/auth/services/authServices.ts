import { useAuthStore } from "@features/auth/store/authStore";
import { AUTH_API_URL } from "@/shared/config/api";

interface ApiResponse<T> {
  message: string;
  status: string;
  data: T;
}

interface LoginResponse {
  username: string;
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// authServices.ts
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const apiResponse: ApiResponse<LoginResponse> = await response.json();

  if (response.ok && apiResponse.status === 'OK') {
    return apiResponse.data;
  } else {
    throw new Error(apiResponse.message || 'Credenciales inválidas');
  }
}
// Función para refrescar el token
// El endpoint /auth/refresh-token responde raw ({ accessToken, refreshToken }), sin envelope
export async function refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await fetch(`${AUTH_API_URL}/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (response.ok) {
    return response.json();
  }

  const errorMessage = await response.text();
  throw new Error(errorMessage || 'Refresh token expired or invalid');
}

// Función para hacer peticiones autenticadas con refresh automático
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const { accessToken, refreshToken: currentRefreshToken, logout, setTokens } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error('No access token available');
  }

  // Agregar el token de autorización
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    // Intentar la petición original
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si el token es válido, o el error no es 401, devolver la respuesta para ser manejada por el service
    if (response.ok || response.status !== 401) {
      return response;
    }

    // Si recibimos 401, intentar refrescar el token
    if (response.status === 401 && currentRefreshToken) {
      try {
        const refreshResult = await refreshToken(currentRefreshToken);
        
        // Actualizar los tokens en el store
        setTokens(refreshResult.accessToken, currentRefreshToken);

        // Reintentar la petición original con el nuevo token
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${refreshResult.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        return retryResponse;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (refreshError) {
        // Si el refresh falla, hacer logout y redirigir al login
        logout();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('Error in authenticated fetch:', error);
    throw error;
  }
}