import { useAuthStore } from "../store/authStore";


// authServices.ts
export async function login(email: string, password: string) {
  try {
    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Si la respuesta no es OK, lanzamos un error que será capturado por el catch.
    if (!response.ok) {
      // Puedes obtener el mensaje de error del backend si existe.
      const errorData = await response.json().catch(() => ({ message: 'Credenciales inválidas' }));
      throw new Error(errorData.message || 'Credenciales inválidas');
    }

    const result = await response.json();
    return result.data; // Devuelve solo los datos relevantes (accessToken, refreshToken, etc.)
  } catch (error) {
    // Si la promesa falla (por ejemplo, error de red), se propaga el error.
    console.error('Error during login:', error);
    throw error; // Re-lanzar el error para que el componente que llama lo maneje.
  }

  
}
// Función para refrescar el token
export async function refreshToken(refreshToken: string) {
  try {
    const response = await fetch('http://localhost:8080/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Refresh token expired or invalid');
    }

    const result = await response.json();
    return result; // { accessToken, refreshToken }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
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

    // Si el token es válido, devolver la respuesta
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