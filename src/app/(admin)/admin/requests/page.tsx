import { BookingStatus } from "@/generated/prisma/enums";
import db from "@/lib/db";
import { RequestsClient } from "@/components/admin/requests-client";

const STATUS_MAP: Record<string, BookingStatus[]> = {
  PENDING: ["PENDING"],
  APPROVED: ["APPROVED"],
  REJECTED: ["REJECTED"],
  RETURNED: ["RETURNED"],
  OVERDUE: ["OVERDUE"],
};

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statuses = status ? STATUS_MAP[status] : undefined;

  const bookings = await db.booking.findMany({
    where: statuses ? { status: { in: statuses } } : {},
    include: {
      profile: { select: { name: true, department: true } },
      tool: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = bookings.map((b) => ({
    id: b.id,
    borrowerName: b.profile.name,
    borrowerDept: b.profile.department ?? "",
    toolName: b.tool.name,
    startDate: formatDate(b.startDate),
    endDate: formatDate(b.endDate),
    purpose: b.purpose,
    status: b.status,
    adminNotes: b.adminNotes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">คำขอยืม</h1>
        <p className="text-muted-foreground mt-1">
          อนุมัติ ปฏิเสธ และติดตามการคืนอุปกรณ์
        </p>
      </div>

      <RequestsClient bookings={serialized} currentStatus={status ?? "ALL"} />
    </div>
  );
}
