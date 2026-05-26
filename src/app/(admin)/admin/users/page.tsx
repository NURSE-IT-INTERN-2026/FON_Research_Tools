import db from "@/lib/db";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "เจ้าหน้าที่",
  STUDENT: "นักศึกษา",
};

export default async function UsersPage() {
  const users = await db.profile.findMany({
    include: { userRole: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">ผู้ใช้งาน</h1>
        <p className="text-muted-foreground mt-3">บัญชีที่ลงทะเบียนทั้งหมด</p>
      </div>

      {users.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีผู้ใช้งานในระบบ
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded border bg-card">
            <table className="w-full min-w-135 text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">ชื่อ</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">อีเมล</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-xs uppercase tracking-wider text-muted-foreground">บทบาท</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                        {ROLE_LABELS[user.userRole?.role ?? ""] ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{user.name}</p>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                    {ROLE_LABELS[user.userRole?.role ?? ""] ?? "—"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
