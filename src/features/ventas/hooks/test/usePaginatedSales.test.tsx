import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import usePaginatedSales from "../usePaginatedSales";
import { Page } from "../../services/salesServices";
import { SaleResponseDto } from "@/shared/types/sales";

const sale = (id: number): SaleResponseDto =>
  ({ id, status: "ACTIVE" }) as unknown as SaleResponseDto;

const page = (content: SaleResponseDto[], totalPages: number) =>
  ({
    content,
    totalPages,
    totalElements: content.length,
  }) as unknown as Page<SaleResponseDto>;

describe("usePaginatedSales", () => {
  it("carga los datos y expone sales, totalPages y loading", async () => {
    const fetchFn = vi.fn().mockResolvedValue(page([sale(1), sale(2)], 5));
    const { result } = renderHook(() => usePaginatedSales(fetchFn));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sales).toHaveLength(2);
    expect(result.current.totalPages).toBe(5);
    expect(fetchFn).toHaveBeenCalledWith({ page: 0, size: 10 });
  });

  it("expone el error si el fetch falla", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("Red caída"));
    const { result } = renderHook(() => usePaginatedSales(fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Red caída");
    expect(result.current.sales).toHaveLength(0);
  });

  it("setPage vuelve a llamar al fetch con la nueva página", async () => {
    const fetchFn = vi.fn().mockResolvedValue(page([sale(1)], 3));
    const { result } = renderHook(() => usePaginatedSales(fetchFn));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.page).toBe(2));
    expect(fetchFn).toHaveBeenCalledWith({ page: 2, size: 10 });
  });

  it("refresh vuelve a llamar al fetch", async () => {
    const fetchFn = vi.fn().mockResolvedValue(page([sale(1)], 2));
    const { result } = renderHook(() => usePaginatedSales(fetchFn));
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    act(() => result.current.refresh());
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
  });
});
