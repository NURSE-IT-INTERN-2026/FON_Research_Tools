import db from "@/lib/db";
import type { ActivityAction } from "@/generated/prisma/enums";

type LogActivityInput = {
  action: ActivityAction;
  userId: string;
  targetType?: "Booking" | "Tool" | "Profile" | null;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        action: input.action,
        userId: input.userId,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        targetLabel: input.targetLabel ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error("[activity-log] Failed to write log:", error);
  }
}
