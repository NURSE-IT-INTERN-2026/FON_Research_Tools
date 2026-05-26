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
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded border bg-card">
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

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/admin/students/${student.id}`}
                className="block rounded border bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{student.name}</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                    {student._count.documents} เอกสาร
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {student.studentId ?? "—"}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
