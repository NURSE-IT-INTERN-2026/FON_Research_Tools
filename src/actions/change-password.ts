"use server";

import { requireAuth } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logActivity } from "@/lib/activity-log";
import db from "@/lib/db";

export type ChangePasswordState = {
  success?: boolean;
  error?: string;
};

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const { userId } = await requireAuth();

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  if (newPassword.length < 6) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "รหัสผ่านใหม่ไม่ตรงกัน" };
  }

  const profile = await db.profile.findUnique({ where: { id: userId } });
  if (!profile) return { error: "ไม่พบบัญชีผู้ใช้" };

  const valid = await verifyPassword(currentPassword, profile.passwordHash);
  if (!valid) {
    return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  const newPasswordHash = await hashPassword(newPassword);
  await db.profile.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  await logActivity({
    action: "PASSWORD_CHANGED",
    userId,
    targetType: "Profile",
    targetId: userId,
  });

  return { success: true };
}
