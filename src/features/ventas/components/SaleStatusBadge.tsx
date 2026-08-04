import { SaleResponseDto } from "@/shared/types/sales";
import React from "react";
import { Badge } from "@/shared/components/ui";

type Props = {
  sale: SaleResponseDto;
  selectedStatus: string;
};

const SaleStatusBadge: React.FC<Props> = ({ sale, selectedStatus }) => {
  if (sale.status.toString() === "COMPLETED") {
    return <Badge tone="success">Completada</Badge>;
  }

  if (sale.status.toString() === "CANCELED") {
    return <Badge tone="neutral">Cancelada</Badge>;
  }

  if (
    sale.status.toString() !== "COMPLETED" &&
    sale.status.toString() !== "CANCELED" &&
    selectedStatus === "A_COBRAR"
  ) {
    return <Badge tone="danger">A Cobrar</Badge>;
  }

  return <Badge tone="warning">Activa</Badge>;
};

export default SaleStatusBadge;
