import { notFound } from "next/navigation";
import db from "@/lib/db";
import { getThesisDataAndCache, type ThesisData } from "@/lib/auth/cmu-oauth";
import { StudentDetailClient } from "@/components/admin/student-detail-client";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  const student = await db.profile.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      studentId: true,
      accountType: true,
      userRole: { select: { role: true } },
      documents: {
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
      },
    },
  });

  if (!student || student.userRole?.role !== "STUDENT") {
    notFound();
  }

  const thesis: ThesisData = student.studentId
    ? await getThesisDataAndCache(student.id)
    : null;

  const serialized = student.documents.map((d) => ({
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
    />
  );
}
