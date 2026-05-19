import { Badge } from "@/components/ui/badge";

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "รอตรวจสอบ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
};

const DOCUMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800 border-amber-300",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-300",
  REJECTED: "bg-red-50 text-red-800 border-red-300",
};

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`rounded px-2 py-0.5 text-xs font-semibold border tracking-wide ${DOCUMENT_STATUS_STYLES[status] ?? ""}`}
    >
      {DOCUMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
