import db from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { BorrowingClient } from "@/components/admin/borrowing-client";

const PAGE_SIZE = 20;

export default async function BorrowingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireRole("ADMIN");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const statusFilter = params.status;

  const where = {
    ...(statusFilter ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" } : {}),
  };

  const [pendingCount, approvedCount, rejectedCount, totalCount, rows] =
    await Promise.all([
      db.borrowingRecord.count({ where: { status: "PENDING" } }),
      db.borrowingRecord.count({ where: { status: "APPROVED" } }),
      db.borrowingRecord.count({ where: { status: "REJECTED" } }),
      db.borrowingRecord.count(),
      db.borrowingRecord.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE + 1,
        orderBy: { createdAt: "desc" },
        include: {
          instrument: { select: { name: true } },
          profile: { select: { name: true, studentId: true } },
        },
      }),
    ]);

  const hasMore = rows.length > PAGE_SIZE;
  const records = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const serialized = records.map((r) => ({
    id: r.id,
    instrumentName: r.instrument.name,
    studentName: r.profile.name,
    studentId: r.profile.studentId ?? "—",
    requesterName: r.requesterName,
    requestDate: r.requestDate?.toISOString() ?? null,
    additionalDetails: r.additionalDetails,
    licenseOriginalName: r.licenseOriginalName,
    status: r.status,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
    approvedAt: r.approvedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          คำขอยืมเครื่องมือวิจัย
        </h1>
        <p className="text-muted-foreground mt-3">
          จัดการคำขอยืมเครื่องมือวิจัยและประวัติการยืม
        </p>
      </div>

      <BorrowingClient
        records={serialized}
        currentStatus={statusFilter ?? "ALL"}
        page={safePage}
        hasMore={hasMore}
        totalPages={totalPages}
        counts={{
          all: totalCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        }}
      />
    </div>
  );
}
