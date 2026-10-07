import { useEffect } from 'react';

/**
 * Marca la página como no indexable mientras está montada.
 * Se usa en las vistas privadas de la app (dashboard, login) para que
 * solo las páginas públicas de la landing sean indexadas por buscadores.
 */
const useNoIndex = () => {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
};

export default useNoIndex;
