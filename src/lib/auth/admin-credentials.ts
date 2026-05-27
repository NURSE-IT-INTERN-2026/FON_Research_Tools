import { createHash, timingSafeEqual } from "node:crypto";
import db from "@/lib/db";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

const DEV_STUDENT_USERNAME = process.env.DEV_STUDENT_USERNAME;
const DEV_STUDENT_PASSWORD_HASH = process.env.DEV_STUDENT_PASSWORD_HASH;

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function verifyHash(input: string, expected: string) {
  return timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}

export async function verifyCredentials(
  username: string,
  password: string,
) {
  if (!username || !password) return null;

  // Admin login
  if (ADMIN_PASSWORD_HASH && username === ADMIN_USERNAME) {
    const inputHash = hashPassword(password);
    if (verifyHash(inputHash, ADMIN_PASSWORD_HASH)) {
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

  // Dev student login
  if (DEV_STUDENT_USERNAME && DEV_STUDENT_PASSWORD_HASH && username === DEV_STUDENT_USERNAME) {
    const inputHash = hashPassword(password);
    if (verifyHash(inputHash, DEV_STUDENT_PASSWORD_HASH)) {
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
