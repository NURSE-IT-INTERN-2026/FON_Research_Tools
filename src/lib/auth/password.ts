import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  if (!password || !passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}
