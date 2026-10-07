import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSalesFilterStore } from "../salesFilterStore";

describe("salesFilterStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useSalesFilterStore.setState({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    });
  });

  it("inicializa con el año y mes actuales", () => {
    const { year, month } = useSalesFilterStore.getState();
    expect(year).toBe(new Date().getFullYear());
    expect(month).toBe(new Date().getMonth() + 1);
  });

  it("setFilter actualiza año y mes", () => {
    useSalesFilterStore.getState().setFilter({ year: 2025, month: 11 });
    expect(useSalesFilterStore.getState().year).toBe(2025);
    expect(useSalesFilterStore.getState().month).toBe(11);
  });

  it("setFilter preserva el campo no modificado", () => {
    useSalesFilterStore.getState().setFilter({ month: 6 });
    const { year, month } = useSalesFilterStore.getState();
    expect(year).toBe(new Date().getFullYear());
    expect(month).toBe(6);
  });

  it("persiste en sessionStorage bajo sales-filters-storage", () => {
    useSalesFilterStore.getState().setFilter({ year: 2025, month: 11 });
    const stored = sessionStorage.getItem("sales-filters-storage");
    expect(stored).toContain('"year":2025');
    expect(stored).toContain('"month":11');
  });

  it("sanitiza year/month null guardados en sessionStorage al rehidratar", async () => {
    sessionStorage.setItem(
      "sales-filters-storage",
      '{"state":{"year":null,"month":null},"version":1}',
    );
    vi.resetModules();
    const { useSalesFilterStore: store } = await import("../salesFilterStore");
    const { year, month } = store.getState();
    expect(year).toBe(new Date().getFullYear());
    expect(month).toBe(new Date().getMonth() + 1);
  });
});
