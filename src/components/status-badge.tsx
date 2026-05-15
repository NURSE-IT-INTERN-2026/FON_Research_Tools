import { Badge } from "@/components/ui/badge";

const TOOL_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "พร้อมใช้งาน",
  BORROWED: "กำลังยืม",
  MAINTENANCE: "ซ่อมบำรุง",
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "รอตรวจสอบ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
  RETURNED: "คืนแล้ว",
  OVERDUE: "เกินกำหนด",
};

const TOOL_STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BORROWED: "bg-amber-50 text-amber-700 border-amber-200",
  MAINTENANCE: "bg-slate-100 text-slate-600 border-slate-200",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  RETURNED: "bg-slate-100 text-slate-600 border-slate-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
};

type StatusBadgeProps = {
  status: string;
  type?: "tool" | "booking";
};

export function StatusBadge({ status, type = "tool" }: StatusBadgeProps) {
  const labels = type === "booking" ? BOOKING_STATUS_LABELS : TOOL_STATUS_LABELS;
  const styles = type === "booking" ? BOOKING_STATUS_STYLES : TOOL_STATUS_STYLES;

  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${styles[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </Badge>
  );
}
