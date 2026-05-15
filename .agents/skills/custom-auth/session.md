# Cookie-based Session Management

## Implementation

```typescript
import { cookies } from "next/headers";
import {
  type AuthSession,
  SESSION_COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session-token";

export async function createSession(
  session: Omit<AuthSession, "expiresAt">,
) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    createSessionToken(session, expiresAt),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(expiresAt),
    },
  );
}

export async function readSession() {
  const cookieStore = await cookies();
  return verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
```

## Usage in Server Components

```typescript
import { readSession } from "@/lib/auth/session";

const session = await readSession();
// session: AuthSession | null
```

## Usage in Route Handlers

```typescript
import { readSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.redirect("/login");
  }
  // ...
}
```
