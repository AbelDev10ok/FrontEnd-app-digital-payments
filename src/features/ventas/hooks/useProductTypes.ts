import { useEffect, useState } from 'react';
import { salesService, ProductTypeDto } from '../services/salesServices';

export default function useProductTypes() {
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchTypes = async () => {
      try {
        setLoading(true);
        const types = await salesService.getProductTypes();
        if (mounted) setProductTypes(types);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error fetching product types');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTypes();

    return () => { mounted = false; };
  }, []);

  return { productTypes, setProductTypes, loading, error } as const;
}
