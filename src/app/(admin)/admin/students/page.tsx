import db from "@/lib/db";
import { StudentsClient } from "@/components/admin/students-client";

const PAGE_SIZE = 20;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; level?: string; thesis?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim();
  const level = params.level?.trim();
  const thesis = params.thesis?.trim();

  const studentWhere = { role: "STUDENT" as const };

  const levelFilter = level
    ? level === "none"
      ? { OR: [{ level: null }, { level: "" }] }
      : { level }
    : {};

  const thesisFilter = thesis
    ? thesis === "has"
      ? { thesisTitleTh: { not: null } }
      : { thesisTitleTh: null }
    : {};

  const where = {
    AND: [
      studentWhere,
      levelFilter,
      thesisFilter,
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { studentId: { contains: q, mode: "insensitive" as const } },
              { thesisTitleTh: { contains: q, mode: "insensitive" as const } },
              { thesisTitleEn: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [rows, filteredCount, totalCount, withThesisCount, withoutThesisCount, masterCount, phdCount, noneCount] = await Promise.all([
    db.profile.findMany({
      where,
      select: {
        id: true,
        name: true,
        studentId: true,
        thesisTitleTh: true,
        thesisTitleEn: true,
        level: true,
        _count: { select: { documents: true } },
      },
      orderBy: { studentId: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
    }),
    db.profile.count({ where }),
    db.profile.count({ where: studentWhere }),
    db.profile.count({
      where: { ...studentWhere, thesisTitleTh: { not: null } },
    }),
    db.profile.count({
      where: { ...studentWhere, thesisTitleTh: null },
    }),
    db.profile.count({
      where: { ...studentWhere, level: "ปริญญาโท" },
    }),
    db.profile.count({
      where: { ...studentWhere, level: "ปริญญาเอก" },
    }),
    db.profile.count({
      where: { ...studentWhere, OR: [{ level: null }, { level: "" }] },
    }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const students = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const serialized = students.map((s) => ({
    id: s.id,
    name: s.name,
    studentId: s.studentId ?? "—",
    thesisTitleTh: s.thesisTitleTh,
    thesisTitleEn: s.thesisTitleEn,
    level: s.level,
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
        students={serialized}
        currentQuery={q ?? ""}
        currentLevel={level ?? ""}
        currentThesis={thesis ?? ""}
        page={safePage}
        hasMore={hasMore}
        totalPages={totalPages}
        stats={{
          total: totalCount,
          withThesis: withThesisCount,
          withoutThesis: withoutThesisCount,
          master: masterCount,
          phd: phdCount,
          none: noneCount,
        }}
      />
    </div>
  );
}
