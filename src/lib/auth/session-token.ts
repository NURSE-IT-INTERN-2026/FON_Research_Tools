import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "app_session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24; // 24 hours — bounds stolen-token exposure window
const SESSION_VERSION = process.env.AUTH_SESSION_VERSION?.trim() || "1";

export type AuthSession = {
  userId: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  name: string;
  expiresAt: number;
};

type SessionPayload = Omit<AuthSession, "expiresAt"> & {
  exp: number;
  ver: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.JWT_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required.");
  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getAuthSecret())
    .update(value)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(
  session: Omit<AuthSession, "expiresAt">,
  expiresAt = Date.now() + SESSION_DURATION_MS,
) {
  const payload = encodeBase64Url(
    JSON.stringify({
      ...session,
      exp: expiresAt,
      ver: SESSION_VERSION,
    } satisfies SessionPayload),
  );
  const signature = signValue(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = signValue(payload);
  if (!safeEqual(signature, expectedSignature)) return null;

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as SessionPayload;

    if (parsed.exp <= Date.now()) return null;
    if (parsed.ver !== SESSION_VERSION) return null;

    return {
      userId: parsed.userId,
      email: parsed.email,
      role: parsed.role,
      name: parsed.name,
      expiresAt: parsed.exp,
    } satisfies AuthSession;
  } catch {
    return null;
  }
}
