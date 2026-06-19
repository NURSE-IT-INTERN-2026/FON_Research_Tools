import db from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
  ? Buffer.from(process.env.ADMIN_PASSWORD_HASH, "base64").toString("utf-8")
  : undefined;

const DEV_STUDENT_USERNAME = process.env.DEV_STUDENT_USERNAME;
const DEV_STUDENT_PASSWORD_HASH = process.env.DEV_STUDENT_PASSWORD_HASH
  ? Buffer.from(process.env.DEV_STUDENT_PASSWORD_HASH, "base64").toString("utf-8")
  : undefined;

// Toggle for the local username/password admin login. Set ADMIN_LOCAL_LOGIN_ENABLED="false"
// in production to remove the fallback login entirely (CMU OAuth becomes the only entry).
// Defaults to true for backward compatibility.
export function isLocalAdminLoginEnabled(): boolean {
  return process.env.ADMIN_LOCAL_LOGIN_ENABLED !== "false";
}

export async function verifyCredentials(
  username: string,
  password: string,
) {
  if (!username || !password) return null;

  // Admin login (bcrypt) — gated by ADMIN_LOCAL_LOGIN_ENABLED.
  // Maps to the bootstrap "super-admin" account (created by ngrok/fresh-reset.ts,
  // email ends with "@local"), NOT real CMU admins who login via CMU OAuth.
  if (
    isLocalAdminLoginEnabled() &&
    ADMIN_PASSWORD_HASH &&
    username === ADMIN_USERNAME
  ) {
    if (await verifyPassword(password, ADMIN_PASSWORD_HASH)) {
      const admin = await db.profile.findFirst({
        where: {
          role: "ADMIN",
          email: { endsWith: "@local" },
        },
        orderBy: { createdAt: "asc" },
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

  // Dev student login (bcrypt) — dev-only, must never run in production.
  // Login lands on a TEST student (DEV_TEST_STUDENT_ID first, then any
  // @placeholder.cmu.ac.th student), never on a real student account that
  // may have real documents or activity.
  if (
    process.env.NODE_ENV !== "production" &&
    DEV_STUDENT_USERNAME &&
    DEV_STUDENT_PASSWORD_HASH &&
    username === DEV_STUDENT_USERNAME
  ) {
    if (await verifyPassword(password, DEV_STUDENT_PASSWORD_HASH)) {
      const testStudentId = process.env.DEV_TEST_STUDENT_ID;
      const placeholderDomain =
        process.env.PLACEHOLDER_EMAIL_DOMAIN ?? "placeholder.cmu.ac.th";

      const student = testStudentId
        ? await db.profile.findFirst({
            where: { studentId: testStudentId, role: "STUDENT" },
            select: { id: true, email: true, name: true },
          })
        : null;

      const fallback =
        !student &&
        (await db.profile.findFirst({
          where: {
            role: "STUDENT",
            email: { endsWith: `@${placeholderDomain}` },
          },
          orderBy: { createdAt: "asc" },
          select: { id: true, email: true, name: true },
        }));

      const testStudent = student ?? fallback;
      if (!testStudent) return null;
      return {
        userId: testStudent.id,
        email: testStudent.email,
        role: "STUDENT" as const,
        name: testStudent.name,
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
