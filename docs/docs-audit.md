# Documentation Audit Report

Audited all project docs on 2026-05-14.

---

## CRITICAL — Must Fix Before Coding

### C1. middleware.ts vs proxy.ts conflict

**CLAUDE.md** (line 44) explicitly states: "Use `proxy.ts` for route protection and RBAC — not `middleware.ts`."

**SKILL.md** (`file-conventions.md`) confirms: Next.js 16+ renames `middleware.ts` → `proxy.ts` and `export function middleware()` → `export function proxy()`.

But four docs still reference the old name:

| Doc | Location | Says |
|---|---|---|
| `auth-rbac.md` | Section title + body | "Middleware (`middleware.ts`)" — 3 references |
| `auth-rbac.md` | File structure | Lists `src/middleware.ts` |
| `route-map.md` | Auth & Guard Strategy | "Middleware (`middleware.ts`): runs on every request" |
| `implementation_rules.md` | Auth section | "Server-side session checks via middleware" |
| `_features.md` | F3 | "Middleware: route protection + RBAC" |

**Fix:** Replace all `middleware.ts` / `middleware()` references with `proxy.ts` / `proxy()` across all 4 docs. Rename F3 from "Middleware" to "Proxy".

### C2. Auth provider is unspecified in PRD

`auth-rbac.md` specifies Supabase Auth with `@supabase/ssr` as the auth provider. But `PRD.md` (tech stack table) does not list any auth provider — only Next.js, React, Tailwind, PostgreSQL, Prisma, Docker.

The only doc that mentions auth technology is `auth-rbac.md`. A developer reading only the PRD would not know Supabase Auth is the chosen provider.

**Fix:** Add a row to the PRD tech stack table:

```
| Auth | Supabase Auth (email/password) with @supabase/ssr |
```

### C3. Overdue detection is contradictory

`PRD.md` (section 6.4) says: "System flags overdue → status: OVERDUE" — implies automatic detection.

`status-flow.md` says: "OVERDUE is set manually by admin (not auto-detected in MVP)" — explicitly manual.

These directly contradict each other.

**Fix:** Decide which is correct and update PRD.md to match. If manual-only for MVP, change PRD to say "Admin flags overdue → status: OVERDUE".

---

## HIGH — Should Fix Before Coding

### H1. Supabase Auth setup is underspecified

`auth-rbac.md` describes using Supabase Auth but references Supabase-specific patterns without clarifying the architectural split:

- References "Database trigger `handle_new_user`" — a Supabase-specific concept (PostgreSQL function + trigger via Supabase migration).
- But data access uses Prisma, not the Supabase client.
- The file structure lists `src/lib/supabase/server.ts` — this is the Supabase SSR client, separate from Prisma.

The architectural model (Supabase for auth sessions, Prisma for data) is sound but never stated explicitly. A developer could be confused about when to use which client.

**Fix:** Add an explicit "Architecture Split" note to `auth-rbac.md`:
> Supabase Auth handles user identity and sessions (signup, login, cookie management). Prisma handles all application data queries (profiles, tools, bookings). Never use the Supabase client for data queries — use Prisma.

### H2. "requestReturn" action is unclear

`route-map.md` defines a `requestReturn` Server Action: "Update `bookings` admin_notes".

`ui-pages.md` shows a "Request Return" button for APPROVED/OVERDUE bookings.

`status-flow.md` has no corresponding status transition — the booking stays APPROVED or OVERDUE.

So what does this button actually do? Appends a note like "borrower requested return" to `adminNotes`? There's no `returnRequestedAt` timestamp, no status change, no notification to admin. This feature is specified at the UI level but not at the data/flow level.

**Fix:** Either:
- (a) Define it clearly: "Appends a timestamped note to `adminNotes`. Admin sees the note on the requests page. No status change." Add a `returnRequestedAt` field to Booking, or
- (b) Remove it from MVP and mark as post-MVP in `_features.md`.

### H3. No `returnDate` field on Booking

When an admin marks a booking as RETURNED, the actual return date is not recorded. Only `updatedAt` changes.

The `endDate` field is the planned return date, not the actual return date. For overdue tracking, knowing the actual return date matters.

**Fix:** Add `returnDate DateTime?` to the Booking model in `data-model.md`.

### H4. RBAC matrix has gaps

`auth-rbac.md` RBAC table is missing these rules:

| Scenario | Specified? |
|---|---|
| Can a user hold both ADMIN and BORROWER roles? | No — data model allows it (`@@unique([userId, role])` permits two rows) |
| Can admins browse the tool catalog (borrower-style)? | RBAC says "View tool catalog: Admin = Yes" but no admin route provides this view |
| Can a borrower see other borrowers' bookings? | Implied no, but not stated |
| What happens if a user has no role at all? | `auth-rbac.md` layout code doesn't handle this edge case |

**Fix:** Add these rules to the RBAC table in `auth-rbac.md`. Decide if dual-role users are supported in MVP.

### H5. Server Action error handling doesn't match SKILL guidance

`implementation_rules.md` says: "Server Actions return error objects, never throw unhandled."

But `error-handling.md` (SKILL) warns that `redirect()` throws a special error and must NOT be caught in try-catch (or must use `unstable_rethrow()`). The auth-rbac code examples use `redirect()` after auth checks, which would be inside a Server Action.

If a Server Action calls `redirect()` and returns error objects on failure, the redirect throw could be swallowed by a catch block.

**Fix:** Add a note to `implementation_rules.md`:
> Server Actions that use `redirect()` must call it outside try-catch, or use `unstable_rethrow()` in catch blocks. See `.agents/skills/next-best-practices/error-handling.md`.

---

## MEDIUM — Should Fix Soon

### M1. Search/filter implementation is ambiguous

`route-map.md` says tool catalog data is "filtered/searched server-side". `ui-pages.md` describes filter pills with `onClick` handlers (client-side interaction).

How do these connect? Options:
- URL `searchParams` + Server Component reads them (full server-side)
- Client-side filtering of server-provided data (no re-fetch)
- Hybrid

Neither doc specifies the mechanism.

**Fix:** Add a line to `ui-pages.md` or `implementation_rules.md` clarifying the approach. Recommended: use URL `searchParams` so the Server Component re-renders with filters applied. This aligns with the "server-side first" principle.

### M2. Theme system is undescribed

`ui-pages.md` mentions "CSS variable swap via parent layout class" and `implementation_rules.md` mentions `.borrower-theme` / `.admin-theme` CSS classes. But no doc describes:

- Where the CSS custom properties are defined
- Which properties change between themes
- How the layout applies the class

The Lovable `ui-style-guide.md` has the full OKLCH color token definitions, but the Next.js project docs never reference or summarize them.

**Fix:** Add a "Theme System" section to `implementation_rules.md` or create a dedicated `docs/theme.md` that lists the CSS custom properties for both themes. Reference the Lovable style guide for exact values.

### M3. Date serialization not documented

`rsc-boundaries.md` (SKILL) warns that `Date` objects cannot be passed from Server Components to Client Components — they must be serialized to strings.

The Booking model has `startDate: DateTime` and `endDate: DateTime`. Every page that shows bookings (My Bookings, Admin Requests, Admin Dashboard) will pass dates to client components.

This is a common bug source and not mentioned in any project doc.

**Fix:** Add to `implementation_rules.md` Data Fetching section:
> Serialize all `DateTime` fields to ISO strings before passing to Client Components. Prisma returns `Date` objects which are not serializable across RSC boundaries.

### M4. Missing `unauthorized.tsx` and `forbidden.tsx`

`error-handling.md` (SKILL) describes `unauthorized()` and `forbidden()` functions that render corresponding `unauthorized.tsx` and `forbidden.tsx` pages. These are the proper way to handle auth errors in Next.js 16.

Current docs only specify `error.tsx` and `not-found.tsx`. No `unauthorized.tsx`, `forbidden.tsx`, or `global-error.tsx` are mentioned.

**Fix:** Add these to `route-map.md` (route tree) and `ui-pages.md` (error states section).

### M5. `_features.md` F2 (Auth) is too large

F2 covers: Supabase setup + signup page + login page + session management + role-based redirect + trigger function + auth helpers + proxy.ts.

This is easily 3-4 vertical slices rolled into one feature. If tracked as a single item, "in progress" will cover days of work with no visible completion.

**Fix:** Split F2 into:
- F2a: Supabase Auth setup + Docker config + auth helpers
- F2b: Signup page + trigger
- F2c: Login page + session + redirect

Similarly, consider splitting F11 (Request management: approve + reject + return + overdue = 4 actions).

---

## LOW — Nice to Fix

### L1. Lovable reference docs contain actionable patterns

`migration-notes.md` has a "Keep as Design Reference" section and a "Do NOT Copy" section. This is good. But `page-map.md` and `component-inventory.md` contain full Supabase query patterns and mock data references that could accidentally be copied.

No risk right now since CLAUDE.md has strong guardrails, but worth noting.

### L2. No `docs/tech-stack.md`

CLAUDE.md pre-implementation checklist references 8 docs, but there's no dedicated tech-stack doc. The tech stack is in PRD.md section 3. This is fine for now but may fragment as the stack grows.

### L3. Lovable file paths in reference docs

`page-map.md` and `component-inventory.md` reference Lovable file paths like `src/routes/dashboard.tsx` and `src/components/AppLayout.tsx`. These don't exist in the Next.js project and could cause confusion if someone greps for them.

Not a real risk — the `lovable-reference/` directory prefix makes it clear. No action needed.

---

## Summary

| Severity | Count | Block coding? |
|---|---|---|
| CRITICAL | 3 | Yes |
| HIGH | 5 | Recommended |
| MEDIUM | 5 | No, but fix soon |
| LOW | 3 | No |

**Recommended order:** Fix C1 → C2 → C3 → H1 → H5 → H3 → H4 → H2 → then M1–M5.
