"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import db from "@/lib/db";

export type CreateAdminState = {
  success?: boolean;
  error?: string;
};

const PENDING_NAME = "รอเข้าสู่ระบบครั้งแรก";

export async function createAdmin(
  _prev: CreateAdminState,
  formData: FormData,
): Promise<CreateAdminState> {
  const ctx = await requireRole("ADMIN");

  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "กรุณากรอกอีเมล" };
  }

  const existing = await db.profile.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const userId = crypto.randomUUID();

  await db.profile.create({
    data: { id: userId, name: PENDING_NAME, email, role: "ADMIN" },
  });

  await logActivity({
    action: "ADMIN_CREATED",
    userId: ctx.userId,
    targetType: "Profile",
    targetId: userId,
    targetLabel: email,
  });

  revalidatePath("/admin/admins");

  return { success: true };
}
