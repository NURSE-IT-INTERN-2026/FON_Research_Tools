import { forbidden, unauthorized } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import db from "@/lib/db";

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) unauthorized();
  return session!;
}

export async function getUserRole(userId: string) {
  const userRole = await db.userRole.findUnique({ where: { userId } });
  return userRole?.role ?? null;
}

export async function requireRole(role: "ADMIN" | "BORROWER") {
  const session = await requireAuth();
  const userRole = await getUserRole(session.user.id);
  if (userRole !== role) forbidden();
  return session;
}
