# OAuth Integration

## PKCE Helper (shared by all providers)

**File:** `src/lib/auth/oauth-pkce.ts`

```typescript
import { createHash, randomBytes } from "node:crypto";

export function createPkceCodeVerifier() {
  return randomBytes(64).toString("base64url");
}

export function createPkceCodeChallenge(codeVerifier: string) {
  return createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}
```

## Generic OAuth Sign-in

**File:** `src/lib/auth/oauth-login.ts`

```typescript
import { type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSafePostLoginRedirectPath } from "@/lib/auth/roles";
import { createSession } from "@/lib/auth/session";

type SignInOAuthUserInput = {
  email: string;
  nextPath?: string | null;
};

type SignInOAuthUserResult =
  | { ok: true; redirectPath: string }
  | { ok: false; errorCode: "email_not_allowed" };

export async function signInOAuthUser({
  email,
  nextPath,
}: SignInOAuthUserInput): Promise<SignInOAuthUserResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
      // Add role-specific relations as needed
    },
  });

  if (!user) {
    return { ok: false, errorCode: "email_not_allowed" };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.name ?? null,
  });

  return {
    ok: true,
    redirectPath: getSafePostLoginRedirectPath(
      { role: user.role as UserRole },
      nextPath,
    ),
  };
}
```

**Key rule:** OAuth does NOT auto-register. Users must already exist in the database.

## Adding a New Provider

### 1. Provider Config — `src/lib/auth/<provider>-oauth.ts`

```typescript
export const PROVIDER_LOGIN_PATH = "/auth/<provider>";
export const PROVIDER_CALLBACK_PATH = "/auth/<provider>/callback";

export type ProviderConfig = {
  appBaseUrl: string;
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  callbackPath: string;
  callbackUrl: string;
  scope: string;
};

export function isProviderConfigured(): boolean {
  return Boolean(
    process.env.APP_BASE_URL?.trim() &&
      process.env.PROVIDER_CLIENT_ID?.trim() &&
      process.env.PROVIDER_CLIENT_SECRET?.trim(),
  );
}

export function getProviderConfig(): ProviderConfig {
  const appBaseUrl = process.env.APP_BASE_URL!.replace(/\/$/, "");
  const clientId = process.env.PROVIDER_CLIENT_ID!.trim();
  const clientSecret = process.env.PROVIDER_CLIENT_SECRET!.trim();
  const callbackPath = `/auth/<provider>/callback`;

  return {
    appBaseUrl,
    clientId,
    clientSecret,
    authorizeUrl: "https://...",
    tokenUrl: "https://...",
    userinfoUrl: "https://...",
    callbackPath,
    callbackUrl: `${appBaseUrl}${callbackPath}`,
    scope: "openid email profile",
  };
}
```

### 2. Initiation Route — `src/app/auth/<provider>/route.ts`

```typescript
import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/auth/<provider>-oauth";
import {
  createPkceCodeChallenge,
  createPkceCodeVerifier,
} from "@/lib/auth/oauth-pkce";

const STATE_COOKIE = "provider_oauth_state";
const PKCE_COOKIE = "provider_oauth_pkce_verifier";
const NEXT_COOKIE = "provider_oauth_next";
const STATE_TTL = 60 * 10;

export async function GET(request: NextRequest) {
  const config = getProviderConfig();
  const state = randomBytes(24).toString("base64url");
  const codeVerifier = createPkceCodeVerifier();
  const codeChallenge = createPkceCodeChallenge(codeVerifier);
  const nextPath = request.nextUrl.searchParams.get("next")?.trim() || null;

  const authUrl = new URL(config.authorizeUrl);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", config.callbackUrl);
  authUrl.searchParams.set("scope", config.scope);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authUrl);

  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: config.callbackPath,
    maxAge: STATE_TTL,
  };

  response.cookies.set(STATE_COOKIE, state, cookieOpts);
  response.cookies.set(PKCE_COOKIE, codeVerifier, cookieOpts);
  response.cookies.set(NEXT_COOKIE, nextPath ?? "", cookieOpts);

  return response;
}
```

### 3. Callback Route — `src/app/auth/<provider>/callback/route.ts`

```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/auth/<provider>-oauth";
import { signInOAuthUser } from "@/lib/auth/oauth-login";

const STATE_COOKIE = "provider_oauth_state";
const PKCE_COOKIE = "provider_oauth_pkce_verifier";
const NEXT_COOKIE = "provider_oauth_next";

export async function GET(request: NextRequest) {
  const config = getProviderConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(PKCE_COOKIE)?.value;
  const nextPath =
    request.cookies.get(NEXT_COOKIE)?.value?.trim() || null;

  // Validate state
  if (!code || !state || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  // Exchange code for access token
  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.callbackUrl,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=token_failed", request.url));
  }

  const { access_token } = await tokenResponse.json();

  // Fetch user email from provider
  const userResponse = await fetch(config.userinfoUrl, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(new URL("/login?error=userinfo_failed", request.url));
  }

  const userinfo = await userResponse.json();
  const email = extractEmail(userinfo); // Provider-specific

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=email_not_found", request.url));
  }

  // Sign in
  const result = await signInOAuthUser({ email, nextPath });

  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/login?error=${result.errorCode}`, request.url),
    );
  }

  const response = NextResponse.redirect(
    new URL(result.redirectPath, request.url),
  );

  // Clear state cookies
  [STATE_COOKIE, PKCE_COOKIE, NEXT_COOKIE].forEach((name) => {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: config.callbackPath,
      expires: new Date(0),
    });
  });

  return response;
}
```

## Checklist for New Provider

1. [ ] Create `<provider>-oauth.ts` with `isConfigured()` + `getConfig()`
2. [ ] Create `src/app/auth/<provider>/route.ts` (initiation)
3. [ ] Create `src/app/auth/<provider>/callback/route.ts` (callback)
4. [ ] Implement `extractEmail()` for provider's userinfo response format
5. [ ] Add env vars to `.env`
6. [ ] Add login button to login form
