import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {login} from '../services/authServices'; // Asegúrate de que este servicio esté implementado

export interface User {
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  checkTokenExpiration: () => void;
}

// DECODIFICAMOS EL JWT
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// EXTRAEMOS EL ROL DEL TOKEN
const extractRoleFromToken = (token: string): string => {
  const decoded = decodeJWT(token);
  if (decoded && decoded.authorities) {
    // El backend devuelve authorities como string: "[\"ROLE_USER\"]"
    const authString = decoded.authorities.replace(/[[\]"\\]/g, '');
    return authString;
  }
  return '';
};

// VERIFICAMOS SI EL TOKEN ESTÁ PRÓXIMO A EXPIRAR (5 minutos antes)
const isTokenExpiringSoon = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  const timeUntilExpiry = decoded.exp - currentTime;
  
  // Si expira en menos de 5 minutos (300 segundos)
  return timeUntilExpiry < 300;
};

// VERIFICAMOS SI EL TOKEN YA EXPIRÓ
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {

          const { accessToken, refreshToken, username } = await login(email, password);

          // Extraer rol del access token
          const role = extractRoleFromToken(accessToken);

          const user: User = {
            email: username,
            role,
          };

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        const role = extractRoleFromToken(accessToken);
        const decoded = decodeJWT(accessToken);
        const email = decoded?.sub || get().user?.email || '';

        set({
          accessToken,
          refreshToken,
          user: { email, role },
          isAuthenticated: true,
        });
      },

      checkTokenExpiration: async () => {
        const { accessToken, refreshToken: currentRefreshToken } = get();
        
        if (!accessToken || !currentRefreshToken) {
          return;
        }

        // Si el access token ya expiró o está próximo a expirar
        if (isTokenExpired(accessToken) || isTokenExpiringSoon(accessToken)) {
          try {
            const { refreshToken: refreshTokenService } = await import('../services/authServices');
            const refreshResult = await refreshTokenService(currentRefreshToken);
            
            // Actualizar tokens
            get().setTokens(refreshResult.accessToken, currentRefreshToken);
          } catch (error) {
            // Si el refresh falla, hacer logout
            console.error('Token refresh failed:', error);
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);