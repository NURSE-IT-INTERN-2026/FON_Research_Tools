# Protecting Pages (Server Components)

## Basic Pattern

```typescript
import { readSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  // ...render page with session.userId, session.role, etc.
}
```

## With Role Check

```typescript
import { readSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getRoleRedirectPath } from "@/lib/auth/roles";

export default async function AdminPage() {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin" && session.role !== "super_admin") {
    redirect(getRoleRedirectPath(session.role));
  }

  // ...render admin page
}
```

## With Role-Specific Conditions

```typescript
import { readSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getAuthenticatedRedirectPath } from "@/lib/auth/roles";

export default async function StudentPage() {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "student") {
    redirect(getAuthenticatedRedirectPath({ role: session.role }));
  }

  // Example: TOS enforcement
  if (!session.studentHasAcceptedTos) {
    redirect("/tos");
  }

  // ...render student page
}
```

## API Route Protection

```typescript
import { readSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await readSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ...handle request
}
```

## Key Points

- **Server Components only** — `readSession()` uses `cookies()` which requires server context
- **No middleware needed** — Each page checks its own auth
- **Early redirect** — Check auth before any data fetching
- **Specific error for API** — 401 for no session, 403 for wrong role
