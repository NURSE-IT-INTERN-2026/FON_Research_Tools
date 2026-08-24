"use server";

import { verifyCredentials, isLocalAdminLoginEnabled } from "@/lib/auth/admin-credentials";
import { getRoleRedirectPath } from "@/lib/auth/roles";
import { createSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { redirect } from "next/navigation";

export type AdminLoginState = {
  success?: boolean;
  error?: string;
};

const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 60_000 };

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const username = (formData.get("username") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!isLocalAdminLoginEnabled()) {
    return {
      error: "ระบบเข้าสู่ระบบสำหรับเจ้าหน้าที่ถูกปิดใช้งาน กรุณาเข้าสู่ระบบผ่าน CMU Account",
    };
  }

  if (!username || !password) {
    return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };
  }

  const rl = consumeRateLimit({
    bucket: "admin-login",
    key: username.toLowerCase(),
    ...LOGIN_RATE_LIMIT,
  });
  if (!rl.allowed) {
    return {
      error: `พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ ${rl.retryAfterSeconds} วินาที`,
    };
  }

  const user = await verifyCredentials(username, password);
  if (!user) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession(user);
  await logActivity({
    action: "USER_LOGIN",
    userId: user.userId,
    targetType: "Session",
    targetLabel: `เข้าสู่ระบบ (${user.role})`,
  });
  redirect(getRoleRedirectPath(user.role));
}
