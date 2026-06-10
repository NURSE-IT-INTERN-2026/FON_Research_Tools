import db from "@/lib/db";
import { BorrowingClient } from "@/components/admin/borrowing-client";

const PAGE_SIZE = 10;

export default async function BorrowingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim();

  const where = q
    ? {
        OR: [
          { owner: { name: { contains: q, mode: "insensitive" as const } } },
          { owner: { studentId: { contains: q, mode: "insensitive" as const } } },
          { requesterName: { contains: q, mode: "insensitive" as const } },
          { source: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [totalCount, rows] = await Promise.all([
    db.borrowingRecord.count(),
    db.borrowingRecord.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, studentId: true } },
      },
    }),
  ]);

  const filteredCount = q ? await db.borrowingRecord.count({ where }) : totalCount;
  const hasMore = rows.length > PAGE_SIZE;
  const records = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const serialized = records.map((r) => ({
    id: r.id,
    ownerUserId: r.owner.id,
    ownerName: r.owner.name,
    ownerStudentId: r.owner.studentId ?? "—",
    requesterName: r.requesterName,
    requestDate: r.requestDate?.toISOString() ?? null,
    source: r.source,
    hasLicense: !!r.licenseFileName,
    hasCertificate: !!r.certificateFileName,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          บันทึกรายการยืมเครื่องมือวิจัย
        </h1>
      </div>

      <BorrowingClient
        records={serialized}
        currentQuery={q ?? ""}
        page={safePage}
        hasMore={hasMore}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
