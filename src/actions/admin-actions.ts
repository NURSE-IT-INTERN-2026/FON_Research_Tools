"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import db from "@/lib/db";

export type CreateAdminState = {
  success?: boolean;
  error?: string;
};

export async function createAdmin(
  _prev: CreateAdminState,
  formData: FormData,
): Promise<CreateAdminState> {
  const ctx = await requireRole("ADMIN");

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!name || !email) {
    return { error: "กรุณากรอกชื่อและอีเมล" };
  }

  const existing = await db.profile.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const userId = crypto.randomUUID();

  await db.$transaction([
    db.profile.create({
      data: { id: userId, name, email },
    }),
    db.userRole.create({
      data: { userId, role: "ADMIN" },
    }),
  ]);

  await logActivity({
    action: "ADMIN_CREATED",
    userId: ctx.userId,
    targetType: "Profile",
    targetId: userId,
    targetLabel: name,
  });

  revalidatePath("/admin/admins");

  return { success: true };
}
