# Implementation Rules

Rules for building this project. Every contribution must follow these.

---

## Architecture

- **Next.js App Router** — `src/app/` directory, no `pages/` directory.
- **Server Components by default.** Only add `"use client"` when the component needs hooks, event handlers, or browser APIs.
- **Server Actions for mutations.** No REST API routes for internal data. Actions live in `src/actions/` or alongside the page.
- **Prisma for database access.** Single client instance via `src/lib/db.ts`.
- **Route groups** `(borrower)` and `(admin)` for layout + auth separation, not URL segments.
- **Route protection** uses `proxy.ts` (Next.js 16+) — not `middleware.ts`.

---

## Architecture Split: Auth vs Data

| Concern | Tool | Rule |
|---|---|---|
| User identity, sessions, cookies | Supabase Auth (`@supabase/ssr`) | Signup, login, session refresh only |
| Application data | Prisma | All queries and mutations for profiles, tools, bookings |

Never use the Supabase client for data queries. Use Prisma.

---

## Component Rules

- Use shadcn/ui components. Install only what's needed.
- Extract reusable components to `src/components/`. Inline components are not allowed.
- Keep Server Components as high in the tree as possible — push `"use client"` to leaf components.
- Pass data down as props from Server Components to Client Components. No client-side data fetching for initial page loads.

### When to use Client Components
- Forms (need onSubmit, state)
- Modals/dialogs (need open/close state)
- Filter pills (update URL searchParams via `useRouter`)
- Date pickers
- Any component with `useState`, `useEffect`, or event handlers

### When to use Server Components
- Page layouts
- Data tables (static render, actions are Server Actions)
- Stat cards (data fetched server-side)
- Page headers with static text

---

## File Structure

```
src/
├── app/                    ← Routes (App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── global-error.tsx
│   ├── error.tsx
│   ├── unauthorized.tsx
│   ├── forbidden.tsx
│   ├── not-found.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── (borrower)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── my-bookings/page.tsx
│   └── (admin)/
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── inventory/page.tsx
│       ├── requests/page.tsx
│       └── users/page.tsx
├── components/             ← Shared UI components
├── actions/                ← Server Actions
├── lib/                    ← Utilities, db client, auth helpers
│   ├── db.ts               ← Prisma client singleton
│   ├── auth.ts             ← getSession, requireAuth, requireRole
│   └── supabase/
│       └── server.ts       ← @supabase/ssr server client (cookies only)
└── types/                  ← Shared TypeScript types
```

Root-level files:
```
proxy.ts                    ← Next.js 16 route protection (replaces middleware.ts)
```

---

## Data Fetching

- **Server Components:** fetch directly via Prisma. No loading states needed if data is small (MVP).
- **Mutations:** always Server Actions. Return `{ success: boolean, error?: string }`.
- **No client-side fetching for page data.** The server owns the query.
- **No React Query / SWR in MVP.** Server Components + Server Actions are sufficient.
- **Serialize all DateTime fields** to ISO strings (`date.toISOString()`) before passing to Client Components. Prisma returns `Date` objects which are not serializable across RSC boundaries. See `.agents/skills/next-best-practices/rsc-boundaries.md`.

---

## Filtering & Search

Tool catalog and admin requests use URL `searchParams` for filtering:

- Server Component reads `searchParams` (async in Next.js 16) from page props.
- Client Component filter pills update URL via `useRouter().push()` with new query string.
- Server re-renders with filtered data — no client-side filtering, no API calls.

Example:
```tsx
// app/(borrower)/dashboard/page.tsx
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  const { q, category, status } = await searchParams;
  const tools = await db.tool.findMany({
    where: {
      ...(q && { name: { contains: q, mode: "insensitive" } }),
      ...(category && category !== "ALL" && { category }),
      ...(status && status !== "ALL" && { status: status as ToolStatus }),
    },
  });
  return <ToolCatalogClient tools={serialize(tools)} filters={{ q, category, status }} />;
}
```

---

## Styling & Theme System

- Tailwind CSS v4 with CSS custom properties for theming.
- shadcn/ui `new-york` variant, `slate` base.
- Two themes swap CSS custom properties via a class on the layout root:
  - `.borrower-theme` — orange primary (sidebar, buttons, focus rings)
  - `.admin-theme` — purple primary (sidebar, buttons, focus rings)
- Theme class is applied by `(borrower)/layout.tsx` or `(admin)/layout.tsx`.
- Shared tokens (background, card, border, success, destructive) are constant across themes.
- Theme token definitions live in `src/app/globals.css` — reference `docs/lovable-reference/ui-style-guide.md` for exact OKLCH values.
- No inline style objects. Use Tailwind classes or CSS variables.
- Border radius: `rounded-xl` for cards, `rounded-md` for buttons, `rounded-full` for badges/pills.

---

## Forms

- Use shadcn/ui form components (`<Input>`, `<Select>`, `<Textarea>`), not raw HTML inputs.
- Validation: server-side in Server Actions. Return field-level errors.
- No `react-hook-form` or `zod` unless validation becomes complex — keep it simple for MVP.
- No `window.prompt()` — ever. Use Dialog components.

---

## Auth

- Server-side session checks via `proxy.ts` and `requireAuth()` / `requireRole()` helpers.
- Client components receive user info as props, not from a client-side auth context.
- No dev bypass mode. Use seeded database for development.
- Redirect unauthenticated → `/login`, wrong role → their correct dashboard.
- Use `unauthorized()` from `next/navigation` for missing sessions (renders `unauthorized.tsx`).
- Use `forbidden()` from `next/navigation` for wrong roles (renders `forbidden.tsx`).

---

## Error Handling

- `global-error.tsx` at app root — catches layout errors, must include `<html>` + `<body>`.
- `error.tsx` at app level + per-segment where needed.
- `unauthorized.tsx` and `forbidden.tsx` for auth error pages.
- Server Actions return error objects, never throw unhandled.
- **Important:** `redirect()` and `notFound()` throw special errors that must not be caught in try-catch. Call them outside try-catch, or use `unstable_rethrow()` in catch blocks. See `.agents/skills/next-best-practices/error-handling.md`.
- Toast notifications (sonner) for user-facing success/error feedback after mutations.
- No `alert()` or `confirm()` — use Dialog components.

---

## Dependencies

- Do not add a dependency unless it solves a specific problem in the current slice.
- Justify new dependencies in the commit message.
- No unused dependencies — if installing shadcn/ui components, only add what the current slice needs.

---

## Git & Commits

- One vertical slice per commit (or per PR).
- Commit messages explain the "why", not the "what".
- Update `docs/_features.md` in the same commit that completes a feature.

---

## What NOT to Do

- Do not copy code from the Lovable project.
- Do not use TanStack Router, TanStack Start, or TanStack React Query.
- Do not use Supabase client-side queries (use Prisma server-side).
- Do not use `middleware.ts` — use `proxy.ts` (Next.js 16+).
- Do not use mock data in application code (seed the database instead).
- Do not create API routes for data access (use Server Components + Server Actions).
- Do not use `window.prompt()` or `window.alert()`.
- Do not add pagination, file upload, or email notifications in MVP.
- Do not pass `Date` objects to Client Components — serialize to ISO strings first.
