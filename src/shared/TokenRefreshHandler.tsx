import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const TokenRefreshHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Escuchar eventos de logout automático
    const handleAutoLogout = () => {
      // Solo redirigir si no estamos ya en login
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };

    // Escuchar cambios en el estado de autenticación
    const unsubscribe = useAuthStore.subscribe((state) => {
      // Si perdemos la autenticación y no estamos en login, redirigir
      if (!state.isAuthenticated && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate, location.pathname]);

  return null; // Este componente no renderiza nada
};

export default TokenRefreshHandler;