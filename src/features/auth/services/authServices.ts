import { useAuthStore } from "@features/auth/store/authStore";

interface ApiResponse<T> {
  message: string;
  status: string;
  data: T;
}

// authServices.ts
export async function login(email: string, password: string) {
  const response = await fetch('http://localhost:8080/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const apiResponse: ApiResponse<any> = await response.json();

  if (response.ok && apiResponse.status === 'OK') {
    return apiResponse.data;
  } else {
    throw new Error(apiResponse.message || 'Credenciales inválidas');
  }
}
// Función para refrescar el token
export async function refreshToken(refreshToken: string) {
  const response = await fetch('http://localhost:8080/auth/refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const apiResponse: ApiResponse<any> = await response.json();

  if (response.ok && apiResponse.status === 'OK') {
    return apiResponse.data;
  } else {
    throw new Error(apiResponse.message || 'Refresh token expired or invalid');
  }
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