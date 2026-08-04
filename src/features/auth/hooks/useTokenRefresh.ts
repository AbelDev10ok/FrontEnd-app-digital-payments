import { useEffect, useRef } from 'react';
import { useAuthStore } from '@features/auth/store/authStore';

export const useTokenRefresh = () => {
  const { isAuthenticated, checkTokenExpiration } = useAuthStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      // Verificar inmediatamente al montar
      checkTokenExpiration();

      // Configurar verificación periódica cada 4 minutos
      intervalRef.current = setInterval(() => {
        checkTokenExpiration();
      }, 4 * 60 * 1000); // cada 4 minutos

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Limpiar interval si no está autenticado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isAuthenticated, checkTokenExpiration]);

  // Verificar token al cambiar de pestaña/ventana
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        checkTokenExpiration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, checkTokenExpiration]);
};