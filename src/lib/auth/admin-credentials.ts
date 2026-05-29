import db from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
  ? Buffer.from(process.env.ADMIN_PASSWORD_HASH, "base64").toString("utf-8")
  : undefined;

const DEV_STUDENT_USERNAME = process.env.DEV_STUDENT_USERNAME;
const DEV_STUDENT_PASSWORD_HASH = process.env.DEV_STUDENT_PASSWORD_HASH
  ? Buffer.from(process.env.DEV_STUDENT_PASSWORD_HASH, "base64").toString("utf-8")
  : undefined;

export async function verifyCredentials(
  username: string,
  password: string,
) {
  if (!username || !password) return null;

  // Admin login (bcrypt)
  if (ADMIN_PASSWORD_HASH && username === ADMIN_USERNAME) {
    if (await verifyPassword(password, ADMIN_PASSWORD_HASH)) {
      const admin = await db.profile.findFirst({
        where: { role: "ADMIN" },
        select: { id: true, email: true, name: true },
      });
      if (!admin) return null;
      return {
        userId: admin.id,
        email: admin.email,
        role: "ADMIN" as const,
        name: admin.name,
      };
    }
  }

  // Dev student login (bcrypt)
  if (DEV_STUDENT_USERNAME && DEV_STUDENT_PASSWORD_HASH && username === DEV_STUDENT_USERNAME) {
    if (await verifyPassword(password, DEV_STUDENT_PASSWORD_HASH)) {
      const student = await db.profile.findFirst({
        where: { role: "STUDENT" },
        select: { id: true, email: true, name: true },
      });
      if (!student) return null;
      return {
        userId: student.id,
        email: student.email,
        role: "STUDENT" as const,
        name: student.name,
      };
    }
  }

  return null;
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
) {
  const result = await verifyCredentials(username, password);
  if (result && result.role === "ADMIN") return result;
  return null;
}
