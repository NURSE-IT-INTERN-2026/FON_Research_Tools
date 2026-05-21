import { createHash, timingSafeEqual } from "node:crypto";
import db from "@/lib/db";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
) {
  if (!ADMIN_PASSWORD_HASH) return null;
  if (!username || !password) return null;

  if (username !== ADMIN_USERNAME) return null;

  const inputHash = hashPassword(password);
  if (
    !timingSafeEqual(
      Buffer.from(inputHash),
      Buffer.from(ADMIN_PASSWORD_HASH),
    )
  ) {
    return null;
  }

  const admin = await db.userRole.findFirst({
    where: { role: "ADMIN" },
    include: { profile: { select: { id: true, email: true, name: true } } },
  });

  if (!admin?.profile) return null;

  return {
    userId: admin.profile.id,
    email: admin.profile.email,
    role: "ADMIN" as const,
    name: admin.profile.name,
  };
}
