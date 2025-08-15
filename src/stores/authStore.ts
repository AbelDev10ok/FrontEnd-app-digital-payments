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
    }),
    {
      name: 'auth-storage',
    }
  )
);