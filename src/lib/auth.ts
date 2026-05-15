import { forbidden, unauthorized } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import db from "@/lib/db";

export type AuthContext = {
  userId: string;
  email: string;
  role: "ADMIN" | "BORROWER";
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

export async function getUserRole(userId: string) {
  const userRole = await db.userRole.findUnique({ where: { userId } });
  return userRole?.role ?? null;
}

export async function requireRole(role: "ADMIN" | "BORROWER"): Promise<AuthContext> {
  const session = await readSession();
  if (!session) unauthorized();

  const userRole = await getUserRole(session!.userId);
  if (userRole !== role) forbidden();

  return {
    userId: session!.userId,
    email: session!.email,
    role: userRole as "ADMIN" | "BORROWER",
  };
}
