import { forbidden, unauthorized } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import db from "@/lib/db";

export type AuthContext = {
  userId: string;
  email: string;
  role: "ADMIN" | "BORROWER";
};

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) unauthorized();
  return {
    userId: session!.user.id,
    email: session!.user.email ?? "",
  };
}

export async function getUserRole(userId: string) {
  const userRole = await db.userRole.findUnique({ where: { userId } });
  return userRole?.role ?? null;
}

export async function requireRole(role: "ADMIN" | "BORROWER"): Promise<AuthContext> {
  const { userId, email } = await requireAuth();
  const userRole = await getUserRole(userId);
  if (userRole !== role) forbidden();
  return { userId, email, role: userRole as "ADMIN" | "BORROWER" };
}
