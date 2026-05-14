# Authentication & RBAC

---

## Strategy

Server-side first. Auth state is resolved in middleware and Server Components — no client-side auth flashing.

---

## Auth Provider

Supabase Auth (email/password) using `@supabase/ssr` for server-side session management.

### Why Supabase Auth
- Email/password signup + login
- Session stored in cookies (HttpOnly)
- Works with Supabase RLS policies if needed later
- The Lovable reference already uses this — port the concept, not the code

---

## Session Flow

```
1. User signs up → Supabase Auth creates user → trigger creates Profile + UserRole
2. User logs in → Supabase Auth sets session cookie → redirect by role
3. Every request → middleware reads cookie → verifies session → attaches user info to headers/cookies
4. Server Components → read session → fetch data scoped to user
5. Client Components → receive user/role as props from Server Components (no client auth context)
```

---

## Signup Flow

1. User fills form: name, email, password, department (optional), role (Borrower/Admin)
2. Server Action calls `supabase.auth.signUp()` with metadata `{ name, department, role }`
3. Database trigger `handle_new_user` fires:
   - Insert `Profile` row (id = auth user id, name, email, department)
   - Insert `UserRole` row (userId, role)
4. If session returned immediately → redirect to role dashboard
5. If email confirmation required → redirect to `/login` with message

---

## Login Flow

1. User submits email + password
2. Server Action calls `supabase.auth.signInWithPassword()`
3. Query `UserRole` table for the user's role
4. Redirect: ADMIN → `/admin/dashboard`, BORROWER → `/dashboard`
5. Error → show toast, stay on page

---

## Middleware (`middleware.ts`)

Runs on every matched route. Responsibilities:

1. **Refresh session** — call `supabase.auth.getSession()` from cookie
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

## RBAC Rules

| Resource | Borrower | Admin |
|---|---|---|
| View tool catalog | Yes | Yes |
| Create booking | Own only | No |
| View own bookings | Yes | No |
| Cancel own pending booking | Yes | No |
| View all bookings | No | Yes |
| Approve/reject bookings | No | Yes |
| Mark returned / overdue | No | Yes |
| CRUD tools | No | Yes |
| View user list | No | Yes |

### Server-side enforcement

All data queries in Server Components and Server Actions check the user's role from the session:

```ts
// Pattern: Server Component
const session = await getSession();
if (!session) redirect("/login");
const role = await getUserRole(session.user.id);
if (role !== "ADMIN") redirect("/dashboard");
```

```ts
// Pattern: Server Action
"use server";
export async function approveBooking(bookingId: string) {
  const session = await getSession();
  const role = await getUserRole(session.user.id);
  if (role !== "ADMIN") throw new Error("Forbidden");
  // ... proceed
}
```

No client-side role gating for data access — UI hides/shows elements for UX only.

---

## Auth Helpers

Create these in `src/lib/auth.ts`:

| Function | Purpose |
|---|---|
| `getSession()` | Read session from cookies, return user or null |
| `getUserRole(userId)` | Query `UserRole` table, return role |
| `requireAuth()` | Get session or throw redirect to `/login` |
| `requireRole(role)` | Get session + verify role, or throw redirect |

---

## File Structure

```
src/lib/
├── auth.ts              ← getSession, requireAuth, requireRole helpers
├── db.ts                ← Prisma client singleton
└── supabase/
    ├── server.ts        ← createServerClient (cookies)
    └── middleware.ts     ← middleware helper for session refresh
src/middleware.ts         ← Next.js middleware (route protection)
src/app/
├── (borrower)/
│   └── layout.tsx       ← Server Component, calls requireRole("BORROWER")
└── (admin)/
    └── layout.tsx       ← Server Component, calls requireRole("ADMIN")
```
