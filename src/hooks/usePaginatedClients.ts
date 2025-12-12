import { useEffect, useState } from 'react';
import { Page } from '../services/clientServices';
import { Client } from '../types/client';

type FetchFn = (params: { page: number; size: number }) => Promise<Page<Client>>;

export default function usePaginatedClients(fetchFn: FetchFn, deps: unknown[] = [], initialPage = 0, size = 10) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchFn({ page, size });
        if (!mounted) return;
        setClients(data.content);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Error fetching clients');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ...deps]);

  const refresh = () => {
    setPage(p => p);
  };

  return { clients, loading, error, page, setPage, totalPages, refresh } as const;
}
