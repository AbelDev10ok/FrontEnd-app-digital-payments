import { useEffect, useState } from 'react';
import { Page, SaleResponseDto } from '../services/salesServices';

type FetchFn = (params: { page: number; size: number }) => Promise<Page<SaleResponseDto>>;

export default function usePaginatedSales(fetchFn: FetchFn, deps: unknown[] = [], initialPage = 0, size = 10) {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
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
        setSales(data.content);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Error fetching sales');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ...deps]);

  const refresh = () => {
    // trigger a reload by resetting page to current value (or could add a key state)
    setPage(p => p);
  };

  return { sales, loading, error, page, setPage, totalPages, refresh } as const;
}
