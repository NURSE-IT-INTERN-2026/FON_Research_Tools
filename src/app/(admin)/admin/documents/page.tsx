import db from "@/lib/db";
import { DocumentsClient } from "@/components/admin/documents-client";

const PAGE_SIZE = 10;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const statusFilter = params.status;
  const q = params.q?.trim();

  const where = {
    AND: [
      statusFilter ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" } : {},
      q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { profile: { name: { contains: q, mode: "insensitive" as const } } },
          { profile: { studentId: { contains: q, mode: "insensitive" as const } } },
        ],
      } : {},
    ],
  };

  const [pendingCount, approvedCount, rejectedCount, totalDocuments, filteredCount, rows] =
    await Promise.all([
      db.document.count({ where: { status: "PENDING" } }),
      db.document.count({ where: { status: "APPROVED" } }),
      db.document.count({ where: { status: "REJECTED" } }),
      db.document.count(),
      db.document.count({ where }),
      db.document.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE + 1,
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: { name: true, studentId: true, thesisTitleTh: true, thesisTitleEn: true },
          },
        },
      }),
    ]);

  const hasMore = rows.length > PAGE_SIZE;
  const documents = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const serialized = documents.map((doc) => ({
    id: doc.id,
    userId: doc.userId,
    title: doc.title,
    originalName: doc.originalName,
    studentName: doc.profile.name,
    studentId: doc.profile.studentId ?? "—",
    thesisTitleTh: doc.profile.thesisTitleTh,
    thesisTitleEn: doc.profile.thesisTitleEn,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    approvedAt: doc.approvedAt?.toISOString() ?? null,
    approvedBy: doc.approvedBy,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          เอกสารเครื่องมือวิจัย
        </h1>
      </div>

      <DocumentsClient
        key={q ?? ""}
        documents={serialized}
        currentStatus={statusFilter ?? "ALL"}
        currentQuery={q ?? ""}
        page={safePage}
        hasMore={hasMore}
        totalPages={totalPages}
        counts={{ all: totalDocuments, pending: pendingCount, approved: approvedCount, rejected: rejectedCount }}
      />
    </div>
  );
}
