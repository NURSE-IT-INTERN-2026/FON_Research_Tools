import db from "@/lib/db";
import { StudentsClient } from "@/components/admin/students-client";

const PAGE_SIZE = 20;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim();

  const where = {
    AND: [
      { userRole: { role: "STUDENT" as const } },
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { studentId: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [rows, filteredCount] = await Promise.all([
    db.profile.findMany({
      where,
      select: {
        id: true,
        name: true,
        studentId: true,
        _count: { select: { documents: true } },
      },
      orderBy: { studentId: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
    }),
    db.profile.count({ where }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const students = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;

  const serialized = students.map((s) => ({
    id: s.id,
    name: s.name,
    studentId: s.studentId ?? "—",
    docCount: s._count.documents,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          รายชื่อนักศึกษา
        </h1>
      </div>

      <StudentsClient
        key={q ?? ""}
        students={serialized}
        currentQuery={q ?? ""}
        page={page}
        hasMore={hasMore}
        totalPages={totalPages}
      />
    </div>
  );
}
