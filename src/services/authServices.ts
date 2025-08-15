

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