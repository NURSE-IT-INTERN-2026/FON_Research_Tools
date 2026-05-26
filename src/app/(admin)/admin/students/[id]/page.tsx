import { notFound } from "next/navigation";
import db from "@/lib/db";
import { getThesisDataAndCache, type ThesisData } from "@/lib/auth/cmu-oauth";
import { StudentDetailClient } from "@/components/admin/student-detail-client";

const PAGE_SIZE = 10;

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const statusFilter = sp.status;

  const student = await db.profile.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      studentId: true,
      accountType: true,
      userRole: { select: { role: true } },
    },
  });

  if (!student || student.userRole?.role !== "STUDENT") {
    notFound();
  }

  const thesis: ThesisData = student.studentId
    ? await getThesisDataAndCache(student.id)
    : null;

  const docWhere = {
    userId: id,
    ...(statusFilter ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" } : {}),
  };

  const [rows, filteredCount, totalDocs, totalPending, totalApproved, totalRejected] =
    await Promise.all([
      db.document.findMany({
        where: docWhere,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          originalName: true,
          status: true,
          adminNotes: true,
          approvedBy: true,
          approvedAt: true,
          createdAt: true,
        },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE + 1,
      }),
      db.document.count({ where: docWhere }),
      db.document.count({ where: { userId: id } }),
      db.document.count({ where: { userId: id, status: "PENDING" } }),
      db.document.count({ where: { userId: id, status: "APPROVED" } }),
      db.document.count({ where: { userId: id, status: "REJECTED" } }),
    ]);

  const hasMore = rows.length > PAGE_SIZE;
  const documents = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;

  const serialized = documents.map((d) => ({
    id: d.id,
    title: d.title,
    originalName: d.originalName,
    status: d.status,
    adminNotes: d.adminNotes,
    approvedBy: d.approvedBy,
    approvedAt: d.approvedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <StudentDetailClient
      student={{
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId ?? "—",
      }}
      thesis={thesis}
      documents={serialized}
      page={page}
      hasMore={hasMore}
      totalPages={totalPages}
      currentStatus={statusFilter ?? "ALL"}
      totalDocs={totalDocs}
      totalPending={totalPending}
      totalApproved={totalApproved}
      totalRejected={totalRejected}
    />
  );
}
