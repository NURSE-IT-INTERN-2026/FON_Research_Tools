import Link from "next/link";
import db from "@/lib/db";

export default async function StudentsPage() {
  const students = await db.profile.findMany({
    where: { userRole: { role: "STUDENT" } },
    select: {
      id: true,
      name: true,
      studentId: true,
      _count: { select: { documents: true } },
    },
    orderBy: { studentId: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          รายชื่อนักศึกษา
        </h1>
      </div>

      {students.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีนักศึกษาในระบบ
        </div>
      ) : (
        <div className="overflow-x-auto rounded border bg-card">
          <table className="w-full min-w-120 text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  ลำดับ
                </th>
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  รหัสนักศึกษา
                </th>
                <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  จำนวนเอกสาร
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => (
                <tr
                  key={student.id}
                  className="border-t transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="text-primary hover:underline"
                    >
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {student.studentId ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {student._count.documents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
