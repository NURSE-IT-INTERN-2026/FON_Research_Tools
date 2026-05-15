# Login Server Action

## Implementation

**File:** `src/app/login/actions.ts`

```typescript
"use server";

import { type UserRole } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { getSafePostLoginRedirectPath } from "@/lib/auth/roles";
import { createSession } from "@/lib/auth/session";
import { consumeRateLimit, resetRateLimit } from "@/lib/security/rate-limit";

const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 10; // 10 minutes
const RATE_LIMIT_PER_IP = 10;
const RATE_LIMIT_PER_IDENTITY = 5;

async function getClientIp() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    requestHeaders.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function loginAction(
  _prevState: { error?: string; email?: string },
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "").trim() || null;

  if (!email || !password) {
    return { error: "Please enter email and password", email };
  }

  // Rate limiting
  const clientIp = await getClientIp();
  const ipLimit = consumeRateLimit({
    bucket: "login:ip",
    key: clientIp,
    limit: RATE_LIMIT_PER_IP,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  const identityLimit = consumeRateLimit({
    bucket: "login:identity",
    key: `${clientIp}:${email}`,
    limit: RATE_LIMIT_PER_IDENTITY,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!ipLimit.allowed || !identityLimit.allowed) {
    const retryAfter = Math.max(
      ipLimit.retryAfterSeconds,
      identityLimit.retryAfterSeconds,
    );
    return {
      error: `Too many attempts. Retry in ${Math.ceil(retryAfter / 60)} minutes.`,
      email,
    };
  }

  // Lookup user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    return { error: "Invalid email or password", email };
  }

  // Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password", email };
  }

  // Success — reset rate limit and create session
  resetRateLimit("login:ip", clientIp);
  resetRateLimit("login:identity", `${clientIp}:${email}`);

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.name ?? null,
  });

  redirect(
    getSafePostLoginRedirectPath({ role: user.role as UserRole }, nextPath),
  );
}
```

## Key Security Points

1. **Generic error** — "Invalid email or password" prevents email enumeration
2. **Double rate limit** — Per IP (brute force) + per identity (targeted attack)
3. **Reset on success** — Don't penalize successful logins
4. **IP from headers** — `x-forwarded-for` > `x-real-ip` > `cf-connecting-ip`
5. **`redirect()` after session** — Next.js throws to redirect, session is set first
