import db from "@/lib/db";
import { ActivityLogClient } from "@/components/admin/activity-log-client";
import type { ActivityAction } from "@/generated/prisma/enums";
import type { ActivityLogWhereInput } from "@/generated/prisma/models/ActivityLog";

const DEFAULT_TAKE = 50;

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    targetType?: string;
    userId?: string;
    q?: string;
    take?: string;
  }>;
}) {
  const params = await searchParams;
  const take = Math.min(Math.max(parseInt(params.take ?? String(DEFAULT_TAKE), 10) || DEFAULT_TAKE, 10), 500);

  const where: ActivityLogWhereInput = {};

  if (params.action) where.action = params.action as ActivityAction;
  if (params.targetType) where.targetType = params.targetType;
  if (params.userId) where.userId = params.userId;
  if (params.q) {
    where.targetLabel = { contains: params.q, mode: "insensitive" };
  }

  const [rows, users] = await Promise.all([
    db.activityLog.findMany({
      where,
      take: take + 1,
      orderBy: { createdAt: "desc" },
      include: { profile: { select: { name: true, email: true } } },
    }),
    db.profile.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasMore = rows.length > take;
  const logs = hasMore ? rows.slice(0, take) : rows;

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
        hasMore={hasMore}
        currentFilters={params}
      />
    </div>
  );
}
