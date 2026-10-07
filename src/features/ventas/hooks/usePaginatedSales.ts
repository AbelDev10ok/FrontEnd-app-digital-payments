import { useEffect, useState } from "react";
import { Page } from "../services/salesServices";
import { SaleResponseDto } from "@/shared/types/sales";

type FetchFn = (params: {
  page: number;
  size: number;
}) => Promise<Page<SaleResponseDto>>;

export default function usePaginatedSales(
  fetchFn: FetchFn,
  deps: unknown[] = [],
  initialPage = 0,
  size = 10,
) {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);

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
        setTotalElements(data.totalElements);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Error fetching sales");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refreshKey, ...deps]);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return { sales, loading, error, page, setPage, totalPages, totalElements, refresh } as const;
}
