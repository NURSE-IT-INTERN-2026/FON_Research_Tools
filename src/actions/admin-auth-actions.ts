"use server";

import { verifyAdminCredentials } from "@/lib/auth/admin-credentials";
import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export type AdminLoginState = {
  success?: boolean;
  error?: string;
};

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const username = (formData.get("username") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  if (!username || !password) {
    return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };
  }

  const admin = await verifyAdminCredentials(username, password);
  if (!admin) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession(admin);
  redirect("/admin/dashboard");
}
