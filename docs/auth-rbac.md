# Authentication & RBAC

---

## Strategy

Server-side first. Auth state is resolved in `proxy.ts` and Server Components — no client-side auth flashing.

---

## Architecture Split

| Concern | Tool | Usage |
|---|---|---|
| User identity (signup, login) | Supabase Auth | `@supabase/ssr` server client, sessions in cookies |
| Session verification | Supabase Auth | Read session from HttpOnly cookie on every request |
| Application data (profiles, tools, bookings) | Prisma | All queries go through Prisma — never use Supabase client for data |
| Route protection | `proxy.ts` | Next.js 16 proxy (not middleware) — refreshes session, redirects |

Never use the Supabase client for data queries. Use Prisma for all application data access.

---

## Session Flow

```
1. User signs up → Supabase Auth creates user → PostgreSQL trigger creates Profile + UserRole
2. User logs in → Supabase Auth sets session cookie → redirect by role
3. Every request → proxy.ts reads cookie → refreshes Supabase session → attaches user info
4. Server Components → read session via getSession() → fetch data via Prisma scoped to user
5. Client Components → receive user/role as serialized props from Server Components
```

---

## Signup Flow

1. User fills form: name, email, password, department (optional), role (Borrower or Admin — single selection)
2. Server Action calls `supabase.auth.signUp()` with metadata `{ name, department, role }`
3. PostgreSQL trigger `handle_new_user` fires (see `docs/data-model.md`):
   - Insert `Profile` row (id = auth user id, name, email, department)
   - Insert `UserRole` row (userId, role)
4. If session returned immediately → redirect to role dashboard
5. If email confirmation required → redirect to `/login` with message

---

## Login Flow

1. User submits email + password
2. Server Action calls `supabase.auth.signInWithPassword()`
3. Query `UserRole` via Prisma for the user's role
4. Redirect: ADMIN → `/admin/dashboard`, BORROWER → `/dashboard`
5. Error → show error on page, stay on page

---

## Proxy (`proxy.ts`)

Runs on every matched request (Next.js 16 replaces `middleware.ts` with `proxy.ts`). Responsibilities:

1. **Refresh session** — call Supabase `getSession()` from cookie, refresh if expired
2. **Protect routes** — redirect to `/login` if no session
3. **Enforce role** — redirect wrong-role users:
   - Borrower on `/admin/*` → `/dashboard`
   - Admin on `/dashboard/*`, `/my-bookings` → `/admin/dashboard`
4. **Redirect authenticated** — `/`, `/login`, `/signup` redirect to dashboard if session exists

### Matcher config

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## RBAC Matrix

| Resource | Borrower | Admin | No Role |
|---|---|---|---|
| View landing page (`/`) | Redirect to dashboard | Redirect to dashboard | See page |
| Login / Signup | Redirect to dashboard | Redirect to dashboard | See page |
| View tool catalog | Yes | Yes (via borrower routes) | Redirect to `/login` |
| Create booking | Own only | No | Redirect to `/login` |
| View bookings | Own only | All | Redirect to `/login` |
| Cancel own pending booking | Yes | No | N/A |
| Approve/reject bookings | No | Yes | Redirect to `/login` |
| Mark returned / overdue | No | Yes | Redirect to `/login` |
| CRUD tools | No | Yes | Redirect to `/login` |
| View user list | No | Yes | Redirect to `/login` |
| Access admin routes | Redirect to `/dashboard` | Yes | Redirect to `/login` |

### Edge cases

| Scenario | Behavior |
|---|---|
| User with no role (Profile exists but no UserRole) | Proxy redirects to `/login` with error message: "Account setup incomplete" |
| User with both roles (should not happen in MVP) | Application uses first role found. Enforced at signup — form allows single selection only. |
| Session expired mid-request | Proxy refreshes session. If refresh fails, redirect to `/login`. |

---

## Server-side Enforcement

All data queries in Server Components and Server Actions check the user's role from the session:

```ts
// Pattern: Server Component
import { requireRole } from "@/lib/auth";

export default async function AdminPage() {
  const { userId } = await requireRole("ADMIN");
  const tools = await db.tool.findMany();
  // ...
}
```

```ts
// Pattern: Server Action
"use server";
import { requireRole } from "@/lib/auth";

export async function approveBooking(bookingId: string) {
  const { userId } = await requireRole("ADMIN");
  // ... proceed with Prisma mutation
}
```

No client-side role gating for data access — UI hides/shows elements for UX only.

---

## Auth Helpers

Create these in `src/lib/auth.ts`:

| Function | Purpose |
|---|---|
| `getSession()` | Read session from cookies via `@supabase/ssr`, return user or null |
| `getUserRole(userId)` | Query `UserRole` via Prisma, return role string or null |
| `requireAuth()` | Get session or call `unauthorized()` (renders `unauthorized.tsx`) |
| `requireRole(role)` | Get session + verify role, or call `forbidden()` (renders `forbidden.tsx`) |

---

## File Structure

```
src/lib/
├── auth.ts              ← getSession, requireAuth, requireRole helpers
├── db.ts                ← Prisma client singleton
└── supabase/
    └── server.ts        ← createServerClient for @supabase/ssr (cookies only)
src/proxy.ts             ← Next.js 16 proxy (route protection, session refresh)
src/app/
├── unauthorized.tsx     ← 401 page
├── forbidden.tsx        ← 403 page
├── (borrower)/
│   └── layout.tsx       ← Server Component, calls requireRole("BORROWER")
└── (admin)/
    └── layout.tsx       ← Server Component, calls requireRole("ADMIN")
```
