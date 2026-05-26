import { forbidden, unauthorized } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import db from "@/lib/db";

export type AuthContext = {
  userId: string;
  email: string;
  role: "ADMIN" | "STUDENT";
};

export async function getSession() {
  return readSession();
}

export async function requireAuth() {
  const session = await readSession();
  if (!session) unauthorized();
  return {
    userId: session!.userId,
    email: session!.email,
  };
}

export async function requireRole(role: "ADMIN" | "STUDENT"): Promise<AuthContext> {
  const session = await readSession();
  if (!session) unauthorized();

  const profile = await db.profile.findUnique({
    where: { id: session!.userId },
    select: { role: true },
  });
  if (profile?.role !== role) forbidden();

  return {
    userId: session!.userId,
    email: session!.email,
    role: profile!.role,
  };
}
