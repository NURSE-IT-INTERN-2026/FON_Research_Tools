---
name: custom-auth
description: Implement a production-grade custom auth system (session tokens, RBAC, OAuth, rate limiting) for Next.js App Router projects. Use when building login, signup, OAuth integration, session management, or role-based access control. No external auth libraries (NextAuth, Clerk, etc).
---

# Custom Auth System

Implement a stateless, HMAC-signed custom authentication system for Next.js App Router.
No external auth libraries. Pure crypto + cookies + Prisma.

## Arguments

- `$ARGUMENTS` — What to implement. One of: `setup`, `oauth <provider>`, `protect`, `rbac`, `rate-limit`, or a description of what's needed.

## Step 1 — Understand the Scope

Read `$ARGUMENTS` to determine what to build:

| Argument | Action |
|----------|--------|
| `setup` | Full auth system from scratch |
| `oauth <provider>` | Add a new OAuth provider |
| `protect` | Add route protection to pages |
| `rbac` | Add/update role-based access control |
| `rate-limit` | Add rate limiting to an action |
| other text | Interpret the request and implement accordingly |

If the project already has `src/lib/auth/`, read existing files first to extend — never overwrite.

---

## Step 2 — File Structure

```
src/lib/auth/
├── session-token.ts    # HMAC token create/verify
├── session.ts          # Cookie read/write/clear
├── password.ts         # bcrypt hash/verify/generate
├── roles.ts            # RBAC path whitelist + redirects
├── oauth-pkce.ts       # PKCE helper (shared by all OAuth)
├── oauth-login.ts      # Generic OAuth sign-in logic
└── <provider>-oauth.ts # Per-provider config

src/lib/security/
└── rate-limit.ts       # Sliding window rate limiter
```

---

## Step 3 — Implementation Templates

Use the reference files in this skill directory for exact code patterns:

- [session-token.md](session-token.md) — HMAC-SHA256 token creation and verification
- [session.md](session.md) — Cookie-based session management
- [password.md](password.md) — Password hashing and generation
- [roles.md](roles.md) — RBAC path authorization and redirects
- [oauth.md](oauth.md) — OAuth flow (PKCE, provider config, routes)
- [rate-limit.md](rate-limit.md) — In-memory sliding window rate limiter
- [prisma-schema.md](prisma-schema.md) — User and role Prisma models
- [protect-page.md](protect-page.md) — How to protect Server Component pages
- [login-action.md](login-action.md) — Server Action login with rate limiting

---

## Step 4 — Rules

**Always follow these rules when implementing:**

1. **Stateless sessions** — HMAC-signed token in cookie, no DB lookup per request
2. **timingSafeEqual** — Always use for signature comparison
3. **Generic login errors** — Never reveal if email exists ("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
4. **PKCE for OAuth** — Always use Authorization Code + PKCE flow
5. **No auto-registration** — OAuth only signs in users that already exist in DB
6. **httpOnly cookies** — Sessions never accessible to JavaScript
7. **Secure in production** — `secure: process.env.NODE_ENV === "production"`
8. **sameSite: "lax"** — Default for all auth cookies
9. **Session versioning** — Use env var to invalidate all sessions on deploy
10. **Rate limit login** — Per IP (10/10min) + per identity (5/10min)
11. **Role path whitelist** — Whitelist allowed paths per role, never blacklist
12. **Server Components first** — Session check in page, not middleware
13. **bcryptjs** — Use `bcryptjs` (pure JS), cost factor 10
14. **No external auth libs** — No NextAuth, Clerk, Lucia, Passport

---

## Step 5 — Environment Variables

Ensure these are documented in the project's `.env.example` or equivalent:

```
AUTH_SECRET=<random-64-char-string>
DATABASE_URL=postgresql://...
APP_BASE_URL=http://localhost:3000
AUTH_SESSION_VERSION=1
RATE_LIMIT_PROVIDER=memory

# Per OAuth provider (optional)
<PROVIDER>_CLIENT_ID=
<PROVIDER>_CLIENT_SECRET=
```

---

## Step 6 — Verify

After implementation, verify:

1. `npm run build` passes with no errors
2. Session token can be created and verified
3. Invalid tokens return `null`
4. Expired tokens return `null`
5. Rate limiting blocks after threshold
6. OAuth callback validates state + PKCE
7. Protected pages redirect unauthenticated users
8. RBAC blocks users from wrong role paths
