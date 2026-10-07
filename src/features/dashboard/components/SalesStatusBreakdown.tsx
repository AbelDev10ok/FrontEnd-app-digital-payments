import type { SalesStatusSummary } from "../hooks/useDashboardMetrics";
import { tones } from "@/shared/theme";

interface SalesStatusBreakdownProps {
  summary: SalesStatusSummary;
}

const STATUS_ITEMS: { key: keyof SalesStatusSummary; label: string; className: string }[] = [
  { key: "completadas", label: "Completadas", className: `${tones.success.bg} ${tones.success.text}` },
  { key: "pendientes", label: "Pendientes", className: `${tones.warning.bg} ${tones.warning.text}` },
];

const SalesStatusBreakdown: React.FC<SalesStatusBreakdownProps> = ({ summary }) => (
  <div className="grid grid-cols-2 gap-3">
    {STATUS_ITEMS.map((item) => (
      <div key={item.key} className={`px-3 py-2 rounded-full ${item.className}`}>
        <p className="text-sm font-semibold font-mono tabular-nums">{summary[item.key]}</p>
        <p className="text-xs">{item.label}</p>
      </div>
    ))}
  </div>
);

export default SalesStatusBreakdown;
