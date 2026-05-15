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
  AVAILABLE: "bg-emerald-50 text-emerald-800 border-emerald-300",
  BORROWED: "bg-amber-50 text-amber-800 border-amber-300",
  MAINTENANCE: "bg-slate-100 text-slate-600 border-slate-300",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-300",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-300",
  REJECTED: "bg-red-50 text-red-800 border-red-300",
  RETURNED: "bg-slate-100 text-slate-600 border-slate-300",
  OVERDUE: "bg-red-50 text-red-800 border-red-300",
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
      className={`rounded px-2 py-0.5 text-xs font-semibold border tracking-wide ${styles[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </Badge>
  );
}
