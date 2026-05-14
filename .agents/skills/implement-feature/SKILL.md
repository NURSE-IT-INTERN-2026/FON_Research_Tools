---
name: implement-feature
description: Implement one feature end-to-end as a vertical slice in the Research Tools Next.js App Router project. Follow the PRD, feature roadmap, UI specs, RBAC rules, route-protection conventions, and real data patterns. Use when asked to add or update a page, form, dashboard, list, or workflow surface.
---

# Implement Feature

Implement one vertical feature end-to-end. Keep the change minimal, production-ready, and limited to the requested slice.

## Project Sources of Truth

Read these before writing any code:

1. `docs/PRD.md` — product requirements and MVP scope
2. `docs/_features.md` — feature roadmap and current status
3. `docs/ui-pages.md` — page layouts and component specs
4. `docs/lovable-reference/*` — UI structure and visual design reference (structure and layout only — never copy code)
5. `CLAUDE.md` — project instructions and workflow
6. `docs/implementation_rules.md` — coding standards and architecture constraints
7. `docs/tech-stack.md` — technologies, versions, and scope boundaries
8. `docs/route-map.md` — App Router route definitions and Server Actions
9. `docs/data-model.md` — Prisma schema, enums, and relations
10. `docs/auth-rbac.md` — authentication and role-based access control
11. `docs/status-flow.md` — booking and tool state machines
12. `.agents/skills/next-best-practices/SKILL.md` — Next.js 16 architecture and patterns

Also consult `node_modules/next/dist/docs/` for framework-version specifics when APIs are unfamiliar.

## Non-Negotiable Rules

- All user-facing text must be in **Thai** (ภาษาไทย). Headings, labels, buttons, placeholders, error messages, toasts, empty states — everything the user sees must be Thai. Enum values in code/DB stay English; only display labels are Thai.
- Implement one feature at a time (one vertical slice per commit or PR).
- Do not rewrite the whole project.
- Do not modify unrelated files.
- Do not invent features outside the project roadmap or approved requirements.
- Do not use mock data. Use real Prisma queries against seeded database.
- Do not copy code from the Lovable reference project. Use it only for layout and visual design guidance.
- Enforce RBAC server-side on every protected route and mutation.
- Prefer Server Components. Add `"use client"` only when hooks, event handlers, or browser APIs are needed.
- Follow the project's routing model and route-protection convention.
- Do not add dependencies unless necessary and justified.
- Update `docs/_features.md` in the same commit that completes a feature.

## Architecture Rules

- **Next.js App Router** (`src/app/`). No `pages/` directory.
- **Prisma** for all application data (profiles, tools, bookings). Single client via `src/lib/db.ts`.
- **Supabase Auth** for identity and sessions only. Never use Supabase client for data queries.
- **`proxy.ts`** for route protection and RBAC (Next.js 16). Not `middleware.ts`.
- **Server Actions** for mutations. No REST API routes for internal data.
- **Server Components** by default. Client Components only for interactivity.
- Serialize all `DateTime` fields to ISO strings before passing to Client Components.
- Route groups `(borrower)` and `(admin)` for layout + auth separation, not URL segments.

## RBAC Rules

Two roles: `ADMIN` and `BORROWER`.

- **ADMIN**: manage tools (CRUD, deactivate), approve/reject/return/flag bookings, view all users.
- **BORROWER**: browse tool catalog, create/cancel own bookings, view own bookings only.
- Admin must not access borrower-scoped routes (`/dashboard`, `/my-bookings`) — redirect to `/admin/dashboard`.
- Borrower must not access admin routes (`/admin/*`) — redirect to `/dashboard`.
- Unauthenticated users redirect to `/login`.
- Server-side enforcement via `requireRole("ADMIN")` or `requireRole("BORROWER")` in Server Components and Server Actions.
- Client-side role gating is UX-only (hide/show). All data access is gated server-side.

## What NOT to Use

- TanStack Router, TanStack Start, or TanStack React Query
- Supabase client-side queries or Supabase for data access
- `middleware.ts` — use `proxy.ts`
- Mock data or dev bypass auth (`VITE_DEV_BYPASS_AUTH`, `isDevBypass`, `mockData`)
- Lovable routing, auth, or data-fetching code
- `window.prompt()` or `window.alert()`
- Pagination, file upload, or email notifications (not in MVP)

## Workflow

1. Identify the requested feature in `docs/_features.md`.
2. Identify the matching route in `docs/route-map.md`.
3. Identify the matching UI spec in `docs/ui-pages.md`. Reference `docs/lovable-reference/*` for visual design only.
4. Read `docs/implementation_rules.md`, `docs/auth-rbac.md`, and `docs/data-model.md`.
5. Inspect existing files and patterns before editing.
6. Reuse existing project patterns (auth helpers, DB client, UI components).
7. Implement the smallest complete vertical slice:
   - route (`src/app/.../page.tsx`)
   - UI (Server Component with Client Component leaves)
   - real data fetching via Prisma or mutation via Server Action
   - validation (server-side)
   - RBAC (server-side via `requireRole`)
   - loading, error, and empty states if relevant
8. Keep code focused. No speculative features.
9. Check TypeScript issues.
10. Run `npm run lint` and `npm run build`.
11. Update `docs/_features.md` to reflect completion.
12. Summarize changed files and how to test.

## Implementation Notes

- Start from existing route map, auth helpers, data access patterns, and UI conventions in the repo.
- Update `proxy.ts` when the feature adds or changes protected routes.
- Use Server Actions for mutations. Return `{ success: boolean, error?: string }`.
- Keep validation and authorization close to the server-side mutation path.
- Use shadcn/ui components. Install only what the current slice needs.
- Use `unauthorized()` from `next/navigation` for missing sessions.
- Use `forbidden()` from `next/navigation` for wrong roles.
- Call `redirect()` and `notFound()` outside try-catch, or use `unstable_rethrow()` in catch blocks.
- If a relevant skill exists under `.agents/skills/`, load and follow it instead of inventing a new pattern.

## Prompt Templates

- **List Page**: `Use .agents/skills/implement-feature/SKILL.md and implement the list feature for [entity] at [route] by following the current project's roadmap, UI spec, PRD, CLAUDE.md, and relevant .agents/skills/*.`
- **Detail Page**: `Use .agents/skills/implement-feature/SKILL.md and implement the detail feature for [entity] at [route] by following the current project's roadmap, UI spec, PRD, CLAUDE.md, and relevant .agents/skills/*.`
- **Form**: `Use .agents/skills/implement-feature/SKILL.md and implement the form feature for [entity or workflow] at [route] by following the current project's roadmap, UI spec, PRD, CLAUDE.md, and relevant .agents/skills/*.`
- **Admin List**: `Use .agents/skills/implement-feature/SKILL.md and implement the admin management page for [entity] at [route] by following the current project's roadmap, UI spec, PRD, CLAUDE.md, and relevant .agents/skills/*.`
- **Dashboard**: `Use .agents/skills/implement-feature/SKILL.md and implement the dashboard feature at [route] by following the current project's roadmap, UI spec, PRD, CLAUDE.md, and relevant .agents/skills/*.`

## Feature Tracker Update Rules

After completing a feature:

1. Update only the relevant feature row in `docs/_features.md`.
2. Use checkbox syntax: `- [ ]` = not started, `- [x]` = done.
3. Mark `- [x]` only when all acceptance criteria pass.
4. Do not mark `- [x]` if validation, RBAC, real data access, or error handling is incomplete.
5. Do not update unrelated feature rows.
6. Add a short note if anything was intentionally deferred.