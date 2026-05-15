import { Badge } from "@/components/ui/badge";

const TOOL_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "พร้อมใช้งาน",
  BORROWED: "กำลังยืม",
  MAINTENANCE: "ซ่อมบำรุง",
};

const TOOL_STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BORROWED: "bg-amber-50 text-amber-700 border-amber-200",
  MAINTENANCE: "bg-slate-100 text-slate-600 border-slate-200",
};

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${TOOL_STATUS_STYLES[status] ?? ""}`}
    >
      {TOOL_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
