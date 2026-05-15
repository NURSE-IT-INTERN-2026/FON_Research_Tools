"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { getRoleRedirectPath } from "@/lib/auth/roles";
import { clearSession } from "@/lib/auth/session";
import { consumeRateLimit, resetRateLimit } from "@/lib/security/rate-limit";
import db from "@/lib/db";

const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 10; // 10 minutes
const RATE_LIMIT_PER_IP = 10;
const RATE_LIMIT_PER_IDENTITY = 5;

async function getClientIp() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export type LoginState = {
  error?: string;
  email?: string;
};

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  const clientIp = await getClientIp();

  const ipLimit = consumeRateLimit({
    bucket: "login:ip",
    key: clientIp,
    limit: RATE_LIMIT_PER_IP,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  const identityLimit = consumeRateLimit({
    bucket: "login:identity",
    key: `${clientIp}:${email}`,
    limit: RATE_LIMIT_PER_IDENTITY,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!ipLimit.allowed || !identityLimit.allowed) {
    const retryAfter = Math.max(
      ipLimit.retryAfterSeconds,
      identityLimit.retryAfterSeconds,
    );
    return {
      error: `ลองใหม่ภายใน ${Math.ceil(retryAfter / 60)} นาที`,
      email,
    };
  }

  const profile = await db.profile.findUnique({ where: { email } });
  if (!profile) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", email };
  }

  const valid = await verifyPassword(password, profile.passwordHash);
  if (!valid) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", email };
  }

  const userRole = await db.userRole.findUnique({
    where: { userId: profile.id },
  });
  const role = userRole?.role ?? "BORROWER";

  resetRateLimit("login:ip", clientIp);
  resetRateLimit("login:identity", `${clientIp}:${email}`);

  await createSession({
    userId: profile.id,
    email: profile.email,
    role: role as "ADMIN" | "BORROWER",
    name: profile.name,
  });

  redirect(getRoleRedirectPath(role as "ADMIN" | "BORROWER"));
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
