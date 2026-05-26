import db from "@/lib/db";
import { UsersClient } from "@/components/admin/users-client";

const PAGE_SIZE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim();
  const roleFilter = params.role;

  const where = {
    AND: [
      roleFilter ? { userRole: { role: roleFilter as "ADMIN" | "STUDENT" } } : {},
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [rows, filteredCount] = await Promise.all([
    db.profile.findMany({
      where,
      include: { userRole: true },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
    }),
    db.profile.count({ where }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const users = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const totalPages = Math.ceil(filteredCount / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);

  const serialized = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.userRole?.role ?? "",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">ผู้ใช้งาน</h1>
        <p className="text-muted-foreground mt-3">บัญชีที่ลงทะเบียนทั้งหมด</p>
      </div>

      <UsersClient
        key={(q ?? "") + (roleFilter ?? "")}
        users={serialized}
        currentQuery={q ?? ""}
        currentRole={roleFilter ?? "ALL"}
        page={safePage}
        hasMore={hasMore}
        totalPages={totalPages}
      />
    </div>
  );
}
