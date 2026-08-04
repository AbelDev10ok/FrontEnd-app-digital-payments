import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SaleStatusBadge from "../SaleStatusBadge";
import { SaleResponseDto } from "@/shared/types/sales";

const sale = (status: string): SaleResponseDto =>
  ({ status }) as unknown as SaleResponseDto;

describe("SaleStatusBadge", () => {
  it('muestra "Completada" para status COMPLETED', () => {
    render(<SaleStatusBadge sale={sale("COMPLETED")} selectedStatus="" />);
    expect(screen.getByText("Completada")).toBeInTheDocument();
  });

  it('muestra "Cancelada" para status CANCELED', () => {
    render(<SaleStatusBadge sale={sale("CANCELED")} selectedStatus="" />);
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it('muestra "A Cobrar" para ACTIVE cuando el filtro es A_COBRAR', () => {
    render(<SaleStatusBadge sale={sale("ACTIVE")} selectedStatus="A_COBRAR" />);
    expect(screen.getByText("A Cobrar")).toBeInTheDocument();
  });

  it('muestra "Activa" para ACTIVE sin filtro A_COBRAR', () => {
    render(<SaleStatusBadge sale={sale("ACTIVE")} selectedStatus="ACTIVE" />);
    expect(screen.getByText("Activa")).toBeInTheDocument();
  });
});
