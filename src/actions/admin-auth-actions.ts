"use server";

import { verifyCredentials } from "@/lib/auth/admin-credentials";
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

  const user = await verifyCredentials(username, password);
  if (!user) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession(user);
  redirect(user.role === "ADMIN" ? "/admin/dashboard" : "/thesis");
}
