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

  // Get distinct owners ordered by latest activity
  const distinctOwners = await db.borrowingRecord.findMany({
    where,
    select: { ownerUserId: true },
    distinct: ["ownerUserId"],
    orderBy: { createdAt: "desc" },
  });

  const totalCount = distinctOwners.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);
  const hasMore = safePage < totalPages;
  const pageOwnerIds = distinctOwners
    .slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    .map((o) => o.ownerUserId);

  // Fetch profiles + counts + all records for page owners
  const [profiles, counts, records] = await Promise.all([
    db.profile.findMany({
      where: { id: { in: pageOwnerIds } },
      select: { id: true, name: true, studentId: true },
    }),
    db.borrowingRecord.groupBy({
      by: ["ownerUserId"],
      where: { ownerUserId: { in: pageOwnerIds } },
      _count: { id: true },
    }),
    db.borrowingRecord.findMany({
      where: { ownerUserId: { in: pageOwnerIds } },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, studentId: true } },
      },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.ownerUserId, c._count.id]));
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const owners = pageOwnerIds.map((id) => ({
    id,
    name: profileMap[id]?.name ?? "—",
    studentId: profileMap[id]?.studentId ?? "—",
    borrowCount: countMap[id] ?? 0,
  }));

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
    licenseOriginalName: r.licenseOriginalName,
    certificateOriginalName: r.certificateOriginalName,
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
        owners={owners}
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
