"use server";

import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity-log";
import db from "@/lib/db";

export type SignupState = {
  error?: string;
};

export async function signup(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const department = formData.get("department") as string;

  if (!name || !email || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
  }

  const existing = await db.profile.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว หรือข้อมูลไม่ถูกต้อง" };
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  await db.$transaction([
    db.profile.create({
      data: {
        id: userId,
        name,
        email,
        department: department || null,
        passwordHash,
      },
    }),
    db.userRole.create({
      data: { userId, role: "BORROWER" },
    }),
  ]);

  await createSession({ userId, email, role: "BORROWER", name });

  await logActivity({
    action: "USER_SIGNUP",
    userId,
    targetType: "Profile",
    targetId: userId,
    targetLabel: name,
  });

  // logActivity must remain above redirect() — redirect() throws, so code below it never runs
  redirect("/dashboard");
}
