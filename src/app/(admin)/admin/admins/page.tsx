import db from "@/lib/db";
import { AdminsClient } from "@/components/admin/admins-client";

export default async function AdminsPage() {
  const rows = await db.profile.findMany({
    where: { userRole: { role: "ADMIN" } },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const admins = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">
          จัดการผู้ดูแลระบบ
        </h1>
        
      </div>
      <AdminsClient admins={admins} />
    </div>
  );
}
