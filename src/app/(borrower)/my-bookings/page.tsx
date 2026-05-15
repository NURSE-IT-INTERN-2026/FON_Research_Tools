import { BookingStatus } from "@/generated/prisma/enums";
import db from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { MyBookingsClient } from "@/components/borrower/my-bookings-client";

const TAB_STATUS_MAP: Record<string, BookingStatus[]> = {
  current: ["APPROVED", "OVERDUE"],
  pending: ["PENDING"],
  past: ["RETURNED", "REJECTED"],
};

function formatDate(date: Date) {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "current" } = await searchParams;
  const user = await requireAuth();

  const statuses = TAB_STATUS_MAP[tab] ?? TAB_STATUS_MAP.current;

  const [bookings, allBookings] = await Promise.all([
    db.booking.findMany({
      where: {
        userId: user.userId,
        status: { in: statuses },
      },
      include: { tool: true },
      orderBy: { createdAt: "desc" },
    }),
    db.booking.findMany({
      where: { userId: user.userId },
      select: { status: true },
    }),
  ]);

  const counts = {
    current: allBookings.filter((b) =>
      ["APPROVED", "OVERDUE"].includes(b.status),
    ).length,
    pending: allBookings.filter((b) => b.status === "PENDING").length,
    past: allBookings.filter((b) =>
      ["RETURNED", "REJECTED"].includes(b.status),
    ).length,
  };

  const serialized = bookings.map((b) => ({
    id: b.id,
    toolName: b.tool.name,
    toolCategory: b.tool.category,
    toolImageUrl: b.tool.imageUrl,
    startDate: formatDate(b.startDate),
    endDate: formatDate(b.endDate),
    purpose: b.purpose,
    status: b.status,
    adminNotes: b.adminNotes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">การจองของฉัน</h1>
        <p className="text-muted-foreground mt-3">
          ติดตามคำขอยืมและการยืมของคุณ
        </p>
      </div>

      <MyBookingsClient bookings={serialized} tab={tab} counts={counts} />
    </div>
  );
}
