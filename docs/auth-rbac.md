# Authentication & RBAC

---

## Strategy

Server-side first. Auth state is resolved in `proxy.ts` and Server Components — no client-side auth flashing.

---

## Architecture Split

| Concern | Tool | Usage |
|---|---|---|
| User identity (signup, login) | Custom auth (`src/lib/auth/`) | HMAC-SHA256 stateless session tokens, bcrypt password hashing |
| Session verification | Custom auth (`session-token.ts`) | Verify HMAC signature from HttpOnly cookie on every request |
| Application data (profiles, tools, bookings) | Prisma | All queries go through Prisma |
| Route protection | `proxy.ts` | Next.js 16 proxy (not middleware) — reads session, redirects |

---

## Session Flow

```
1. User signs up → Server Action hashes password + creates Profile + UserRole via Prisma → createSession() sets cookie → redirect by role
2. User logs in → Server Action verifies password via bcrypt → query role via Prisma → createSession() sets cookie → redirect by role
3. Every request → proxy.ts reads cookie → verifySessionToken() validates HMAC signature → attaches user info
4. Server Components → read session via getSession() → fetch data via Prisma scoped to user
5. Client Components → receive user/role as serialized props from Server Components
```

---

## Signup Flow

1. User fills form: name, email, password, department (optional), role (Borrower or Admin — single selection)
2. Server Action validates input, checks for duplicate email
3. `hashPassword()` hashes password with bcrypt (cost 10)
4. Prisma transaction creates `Profile` row (id = crypto.randomUUID) + `UserRole` row
5. `createSession()` sets HttpOnly cookie with HMAC-SHA256 signed token
6. Redirect to role dashboard: ADMIN → `/admin/dashboard`, BORROWER → `/dashboard`

---

## Login Flow

1. User submits email + password
2. Server Action rate-limits by IP (10/10min) and by identity (5/10min)
3. Query `Profile` by email, verify password with `verifyPassword()` (bcrypt compare)
4. Query `UserRole` via Prisma for the user's role
5. `createSession()` sets cookie, reset rate limit counters
6. Redirect: ADMIN → `/admin/dashboard`, BORROWER → `/dashboard`
7. Error → generic message ("อีเมลหรือรหัสผ่านไม่ถูกต้อง") to prevent email enumeration

---

## Proxy (`proxy.ts`)

Runs on every matched request (Next.js 16 replaces `middleware.ts` with `proxy.ts`). Responsibilities:

1. **Read session** — call `verifySessionToken()` from cookie, validate HMAC signature
2. **Protect routes** — redirect to `/login` if no valid session
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
| Session expired mid-request | Token contains `expiresAt` — verification rejects expired tokens. Proxy redirects to `/login`. |
| `AUTH_SECRET` rotated | Set `AUTH_SESSION_VERSION` to new value to invalidate all existing sessions |

---

## Server-side Enforcement

All data queries in Server Components and Server Actions check the user's role from the session:

```ts
// Pattern: Server Component
import { requireRole } from "@/lib/auth";

export default async function AdminPage() {
  const { userId, role } = await requireRole("ADMIN");
  const tools = await db.tool.findMany();
  // ...
}
```

```ts
// Pattern: Server Action
"use server";
import { requireRole } from "@/lib/auth";

export async function approveBooking(bookingId: string) {
  const { userId, role } = await requireRole("ADMIN");
  // ... proceed with Prisma mutation
}
```

No client-side role gating for data access — UI hides/shows elements for UX only.

---

## Auth Helpers

Located in `src/lib/auth.ts`:

```ts
export type AuthContext = {
  userId: string;
  email: string;
  role: "ADMIN" | "BORROWER";
};
```

| Function | Returns | Purpose |
|---|---|---|
| `getSession()` | `AuthSession \| null` | Read session from cookie via `verifySessionToken()` |
| `getUserRole(userId)` | `AppRole \| null` | Query `UserRole` via Prisma |
| `requireAuth()` | `{ userId: string, email: string }` | Get authenticated user or call `unauthorized()` |
| `requireRole(role)` | `AuthContext` | Verify role or call `forbidden()` — returns `{ userId, email, role }` |

Session token internals (HMAC signing, base64url encoding) stay internal to `src/lib/auth/session-token.ts`. Callers receive only the application-level context.

---

## Session Token Details

- Algorithm: HMAC-SHA256 (`node:crypto`)
- Token format: `<base64url(payload)>.<base64url(signature)>`
- Payload: `{ userId, email, role, name, exp, ver }`
- Cookie name: `app_session`
- Cookie options: httpOnly, sameSite "lax", secure in production, 7-day expiry
- Versioning: `AUTH_SESSION_VERSION` env var — changing value invalidates all existing sessions

---

## Rate Limiting

Login endpoint uses in-memory sliding window rate limiting (`src/lib/security/rate-limit.ts`):

- Per IP: 10 attempts per 10 minutes
- Per identity (IP + email): 5 attempts per 10 minutes
- Successful login resets counters
- Keys are SHA-256 fingerprinted for consistency

---

## File Structure

```
src/lib/
├── auth.ts                ← getSession, requireAuth, requireRole helpers
├── auth/
│   ├── session-token.ts   ← HMAC-SHA256 token create/verify
│   ├── session.ts         ← Cookie management (create, read, clear)
│   ├── password.ts        ← bcrypt hash/verify
│   └── roles.ts           ← Role redirect paths
├── security/
│   └── rate-limit.ts      ← In-memory sliding window rate limiter
└── db.ts                  ← Prisma client singleton
src/proxy.ts               ← Next.js 16 proxy (route protection, session check)
src/app/
├── unauthorized.tsx       ← 401 page
├── forbidden.tsx          ← 403 page
├── (borrower)/
│   └── layout.tsx         ← Server Component, calls requireRole("BORROWER")
└── (admin)/
    └── layout.tsx         ← Server Component, calls requireRole("ADMIN")
```
