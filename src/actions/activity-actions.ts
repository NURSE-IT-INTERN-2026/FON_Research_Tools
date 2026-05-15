"use server";

import { requireRole } from "@/lib/auth";
import db from "@/lib/db";

export type ActivityEntry = {
  id: string;
  action: string;
  userName: string;
  targetType: string | null;
  targetLabel: string | null;
  createdAt: string;
};

export async function getRecentActivity(): Promise<ActivityEntry[]> {
  await requireRole("ADMIN");

  const logs = await db.activityLog.findMany({
    take: 25,
    orderBy: { createdAt: "desc" },
    include: {
      profile: { select: { name: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    userName: log.profile.name,
    targetType: log.targetType,
    targetLabel: log.targetLabel,
    createdAt: log.createdAt.toISOString(),
  }));
}
