import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const EMAIL_API_BASE = process.env.EMAIL_API_BASE ?? "https://mis.nurse.cmu.ac.th/thesis";
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
      client_id: process.env.EMAIL_CLIENT_ID ?? "nurse-email-api",
      client_secret: process.env.EMAIL_CLIENT_SECRET ?? "NurseEmail@CMU2025!",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] GetToken failed:", text);
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
    console.log("[email] Sending to:", params.sentTo, "subject:", params.subject);

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
    console.log("[email] API response:", JSON.stringify(data));

    if (!res.ok) {
      console.error("[email] SendEmail failed:", res.status, data);
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
  return {
    to: devEmail ?? "supapan.ch@cmu.ac.th",
    cc: devEmail ?? "ampika.s@cmu.ac.th",
  };
}
