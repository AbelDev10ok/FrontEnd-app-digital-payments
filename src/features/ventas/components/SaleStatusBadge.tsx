import { SaleResponseDto } from "@/shared/types/sales";
import React from "react";
import { Badge } from "@/shared/components/ui";
import { saleStatusTone, saleStatusLabel } from "@/shared/utils/statusUi";

type Props = {
  sale: SaleResponseDto;
  selectedStatus: string;
};

const SaleStatusBadge: React.FC<Props> = ({ sale, selectedStatus }) => {
  // Con el filtro "A Cobrar" activo, las ventas activas se presentan como
  // pendientes de cobro (tienen cuotas vencidas) aunque su estado sea ACTIVE.
  const effectiveStatus =
    selectedStatus === "A_COBRAR" && sale.status === "ACTIVE"
      ? "A_COBRAR"
      : sale.status;

  return (
    <Badge tone={saleStatusTone(effectiveStatus)}>
      {saleStatusLabel(effectiveStatus)}
    </Badge>
  );
};

export default SaleStatusBadge;
