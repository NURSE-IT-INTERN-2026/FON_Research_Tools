import db from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { DocumentsClient } from "@/components/admin/documents-client";
import { Clock, CheckCircle, FileText } from "lucide-react";

const PAGE_SIZE = 10;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const statusFilter = params.status;

  const [pendingCount, approvedCount, totalDocuments, rows] =
    await Promise.all([
      db.document.count({ where: { status: "PENDING" } }),
      db.document.count({ where: { status: "APPROVED" } }),
      db.document.count(),
      db.document.findMany({
        where: statusFilter ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" } : undefined,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE + 1,
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: { name: true, studentId: true },
          },
        },
      }),
    ]);

  const hasMore = rows.length > PAGE_SIZE;
  const documents = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const serialized = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    originalName: doc.originalName,
    studentName: doc.profile.name,
    studentId: doc.profile.studentId ?? "—",
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          เอกสารเครื่องมือวิจัย
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger">
        <StatCard icon={Clock} value={pendingCount} label="รอตรวจสอบ" />
        <StatCard icon={CheckCircle} value={approvedCount} label="อนุมัติแล้ว" />
        <StatCard icon={FileText} value={totalDocuments} label="เครื่องมือทั้งหมด" />
      </div>

      <DocumentsClient
        documents={serialized}
        currentStatus={statusFilter ?? "ALL"}
        page={page}
        hasMore={hasMore}
      />
    </div>
  );
}
