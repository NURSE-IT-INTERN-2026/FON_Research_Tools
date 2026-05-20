import db from "@/lib/db";
import { ActivityLogClient } from "@/components/admin/activity-log-client";
import type { ActivityAction } from "@/generated/prisma/enums";
import type { ActivityLogWhereInput } from "@/generated/prisma/models/ActivityLog";

const PAGE_SIZE = 20;

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    targetType?: string;
    userId?: string;
    q?: string;
    page?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const where: ActivityLogWhereInput = {};

  if (params.action) where.action = params.action as ActivityAction;
  if (params.targetType) where.targetType = params.targetType;
  if (params.userId) where.userId = params.userId;
  if (params.q) {
    where.targetLabel = { contains: params.q, mode: "insensitive" };
  }

  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) {
      where.createdAt.gte = new Date(params.from);
    }
    if (params.to) {
      const toDate = new Date(params.to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const [rows, users] = await Promise.all([
    db.activityLog.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
      orderBy: { createdAt: "desc" },
      include: { profile: { select: { name: true, email: true } } },
    }),
    db.profile.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const logs = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const serialized = logs.map((log) => ({
    id: log.id,
    action: log.action,
    userName: log.profile.name,
    userEmail: log.profile.email,
    targetType: log.targetType,
    targetId: log.targetId,
    targetLabel: log.targetLabel,
    metadata: log.metadata,
    createdAt: log.createdAt.toISOString(),
  }));

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight heading-accent">บันทึกกิจกรรม</h1>
        <p className="text-muted-foreground mt-3">ติดตามกิจกรรมทั้งหมดในระบบ</p>
      </div>

      <ActivityLogClient
        logs={serialized}
        users={serializedUsers}
        page={page}
        hasMore={hasMore}
        currentFilters={params}
      />
    </div>
  );
}
