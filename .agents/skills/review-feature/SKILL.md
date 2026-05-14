---
name: review-feature
description: Review a completed feature against project documentation, check for errors, verify acceptance criteria, and suggest or apply minimal fixes. Use after implementing a feature with implement-feature.
---

# Review Feature

Review one completed feature. Do not start the next feature. Only fix issues related to the reviewed feature.

## Required Docs

Read these before starting the review:

1. `docs/_features.md` — feature tracker and acceptance criteria
2. `docs/PRD.md` — product requirements
3. `docs/ui-pages.md` — page layouts and component specs
4. `docs/implementation_rules.md` — coding standards
5. `docs/auth-rbac.md` — RBAC rules
6. `docs/data-model.md` — Prisma schema and relations
7. `docs/route-map.md` — route definitions and Server Actions
8. `docs/status-flow.md` — booking and tool state machines
9. `docs/tech-stack.md` — technologies and scope boundaries
10. `CLAUDE.md` — project instructions

## Review Checklist

Verify each item against the implemented code:

- [ ] The route matches `docs/route-map.md` (path, layout group, page file location)
- [ ] The page matches `docs/ui-pages.md` (layout, components, sections, headings)
- [ ] All acceptance criteria from `docs/_features.md` pass
- [ ] The feature uses Server Components by default, `"use client"` only where hooks/event handlers are needed
- [ ] Server Actions are used for all mutations, returning `{ success: boolean, error?: string }`
- [ ] No mock data — all data comes from Prisma queries against the database
- [ ] No code copied from `docs/lovable-reference/*` or the Lovable project
- [ ] No TanStack Router, TanStack Query, or Supabase client-side queries
- [ ] No `middleware.ts` — route protection uses `proxy.ts`
- [ ] DateTime fields are serialized to ISO strings before passing to Client Components
- [ ] No `window.prompt()` or `window.alert()` — use shadcn/ui Dialog for modals
- [ ] No pagination, file upload, or email notifications (not in MVP)
- [ ] No new dependencies added without justification

## Error-Finding Checklist

Look for these common issues:

- [ ] TypeScript errors (`npm run build` passes)
- [ ] ESLint errors (`npm run lint` passes)
- [ ] Unhandled edge cases: empty data, null fields, missing relations
- [ ] Server Actions called from Server Components (must be called from Client Components or use `use server` correctly)
- [ ] Missing loading states (`loading.tsx`) for data-fetching pages
- [ ] Missing error boundaries (`error.tsx`) for interactive pages
- [ ] `redirect()` or `notFound()` called inside try-catch without `unstable_rethrow()`
- [ ] `unauthorized()` or `forbidden()` used correctly (not mixed up)
- [ ] Missing `revalidatePath` or `revalidateTag` after mutations
- [ ] Form validation missing or incomplete (server-side required)

## RBAC Checklist

- [ ] Every protected route calls `requireRole("ADMIN")` or `requireRole("BORROWER")` server-side
- [ ] Every Server Action that mutates data verifies the user's role before proceeding
- [ ] Admin cannot access borrower routes (`/dashboard`, `/my-bookings`) — redirects to `/admin/dashboard`
- [ ] Borrower cannot access admin routes (`/admin/*`) — redirects to `/dashboard`
- [ ] Unauthenticated users redirect to `/login`
- [ ] Borrowers can only access their own data (booking queries filter by `userId`)
- [ ] Client-side role gating is UX-only (hide/show) — not the sole data access guard
- [ ] `proxy.ts` is updated if the feature adds or changes protected routes

## Data Access Checklist

- [ ] Uses `src/lib/db.ts` singleton (not a new PrismaClient instance)
- [ ] Queries use the correct model and relations from `docs/data-model.md`
- [ ] Booking status transitions follow `docs/status-flow.md`
- [ ] Tool status updates are consistent with booking state changes (e.g., approve → tool BORROWED, return → tool AVAILABLE)
- [ ] Seed data in `prisma/seed.ts` is not modified unless the feature changes the schema
- [ ] No raw SQL queries (use Prisma query methods)

## UI / Thai Language Checklist

- [ ] All user-facing text is in Thai: headings, labels, buttons, placeholders, error messages, toasts, empty states, validation messages, navigation items
- [ ] Enum display labels (status badges, role labels) show Thai text — enum values in code stay English
- [ ] Code comments, variable names, file names remain in English
- [ ] shadcn/ui components used correctly (no custom reimplementations of existing components)
- [ ] Responsive layout works (mobile, tablet, desktop breakpoints)
- [ ] Sidebar shows correct theme (orange for borrower, purple for admin)
- [ ] Toast notifications use `sonner` (not custom toast implementations)

## Feature Tracker Checklist

- [ ] The reviewed feature is marked `- [x]` in `docs/_features.md`
- [ ] Acceptance criteria are fully met — not partially
- [ ] No unrelated features are marked as done
- [ ] Any intentional deferrals are noted (e.g., "pagination deferred — not in MVP")

## Rules for Fixing Issues

- Only fix issues directly related to the reviewed feature.
- Do not refactor unrelated files.
- Do not modify `docs/lovable-reference/*`.
- Do not start implementing the next feature.
- Do not add features outside the project roadmap.
- Do not change the data model unless the feature requires it.
- If the issue requires significant changes, report it and let the user decide — do not rewrite large sections.
- Keep fixes minimal: one issue, one targeted change.
- Run `npm run lint` and `npm run build` after any fix.
- If a fix changes behavior, update `docs/_features.md` notes if needed.

## Response Format

After reviewing, report:

```
## Review: [Feature ID] — [Feature Name]

### Status: PASS | PASS WITH FIXES | FAIL

### Acceptance Criteria
- [x] / [ ] Criterion 1
- [x] / [ ] Criterion 2

### Issues Found
1. **[severity: critical | warning | minor]** Description of issue
   - File: `path/to/file.tsx:line`
   - Fix applied: (yes/no) — what was changed

### Files Changed (if any fixes applied)
- `path/to/file.tsx` — brief description

### Recommendation
One of:
- Ready to proceed to the next feature.
- Fixes applied — verify manually before proceeding.
- Significant issues found — user decision needed on [specific issue].
```

## Command Template

```
Use .agents/skills/review-feature/SKILL.md and review F[id] from docs/_features.md. Check the implementation against the project docs, acceptance criteria, RBAC rules, data access patterns, and Thai language requirements. Fix issues only if minimal. Report findings.
```
