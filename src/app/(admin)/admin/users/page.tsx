import db from "@/lib/db";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  BORROWER: "ผู้ยืม",
};

export default async function UsersPage() {
  const users = await db.profile.findMany({
    include: { userRole: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ผู้ใช้งาน</h1>
        <p className="text-muted-foreground mt-1">บัญชีที่ลงทะเบียนทั้งหมด</p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          ยังไม่มีผู้ใช้งานในระบบ
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">ชื่อ</th>
                <th className="px-4 py-3 text-left font-medium">อีเมล</th>
                <th className="px-4 py-3 text-left font-medium">แผนก</th>
                <th className="px-4 py-3 text-left font-medium">บทบาท</th>
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.department || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {ROLE_LABELS[user.userRole?.role ?? ""] ?? "—"}
                    </span>
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
