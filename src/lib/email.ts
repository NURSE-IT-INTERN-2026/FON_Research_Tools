import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, chmodSync } from "node:fs";

const EMAIL_API_BASE = (() => {
  const url = process.env.EMAIL_API_BASE;
  if (!url) throw new Error("EMAIL_API_BASE env var is required");
  return url;
})();
const TOKEN_CACHE_PATH = join(process.cwd(), ".cache", "email-token.json");

type TokenCache = {
  token: string;
  expiresAt: number;
};

async function getEmailToken(): Promise<string> {
  // Check cache first
  if (existsSync(TOKEN_CACHE_PATH)) {
    try {
      const cached: TokenCache = JSON.parse(
        await readFile(TOKEN_CACHE_PATH, "utf-8"),
      );
      // Refresh 1 hour before expiry
      if (cached.expiresAt > Date.now() + 3600000) {
        return cached.token;
      }
    } catch {
      // Invalid cache, fetch new token
    }
  }

  const res = await fetch(`${EMAIL_API_BASE}/EmailApi/GetToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: (() => {
        const id = process.env.EMAIL_CLIENT_ID;
        if (!id) throw new Error("EMAIL_CLIENT_ID env var is required");
        return id;
      })(),
      client_secret: (() => {
        const secret = process.env.EMAIL_CLIENT_SECRET;
        if (!secret) throw new Error("EMAIL_CLIENT_SECRET is required");
        return secret;
      })(),
    }),
  });

  if (!res.ok) {
    console.error("[email] GetToken failed: status", res.status);
    throw new Error(`Email GetToken failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) throw new Error("Email GetToken unsuccessful");

  // Cache the token
  const cache: TokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 86400) * 1000,
  };
  const cacheDir = join(process.cwd(), ".cache");
  if (!existsSync(cacheDir)) await mkdir(cacheDir, { recursive: true });
  await writeFile(TOKEN_CACHE_PATH, JSON.stringify(cache));
  chmodSync(TOKEN_CACHE_PATH, 0o600);

  return data.access_token;
}

type SendEmailParams = {
  subject: string;
  sentTo: string;
  ccTo?: string;
  message: string;
  systemName?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const token = await getEmailToken();
    console.log("[email] Sending email, subject:", params.subject);

    const res = await fetch(`${EMAIL_API_BASE}/EmailApi/SendEmail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject: params.subject,
        sent_to: params.sentTo,
        cc_to: params.ccTo ?? "",
        message: params.message,
        system_name: params.systemName ?? process.env.EMAIL_SYSTEM_NAME ?? "",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[email] SendEmail failed: status", res.status);
      return false;
    }

    return data.success === true;
  } catch (err) {
    console.error("[email] sendEmail error:", err);
    return false;
  }
}

export function getAdminEmails() {
  const devEmail = process.env.DEV_NOTIFICATION_EMAIL;
  if (devEmail) return { to: devEmail, cc: devEmail };
  const to = process.env.ADMIN_EMAIL_TO;
  const cc = process.env.ADMIN_EMAIL_CC;
  if (!to) throw new Error("ADMIN_EMAIL_TO or DEV_NOTIFICATION_EMAIL env var is required");
  return { to, cc: cc ?? "" };
}
