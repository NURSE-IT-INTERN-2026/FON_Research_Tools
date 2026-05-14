# Implementation Rules

Rules for building this project. Every contribution must follow these.

---

## Architecture

- **Next.js App Router** — `src/app/` directory, no `pages/` directory.
- **Server Components by default.** Only add `"use client"` when the component needs hooks, event handlers, or browser APIs.
- **Server Actions for mutations.** No REST API routes. Actions live alongside the page or in `src/actions/`.
- **Prisma for database access.** Single client instance via `src/lib/db.ts`.
- **Route groups** `(borrower)` and `(admin)` for layout + auth separation, not URL segments.

---

## Component Rules

- Use shadcn/ui components. Install only what's needed.
- Extract reusable components to `src/components/`. Inline components are not allowed.
- Keep Server Components as high in the tree as possible — push `"use client"` to leaf components.
- Pass data down as props from Server Components to Client Components. No client-side data fetching for initial page loads.

### When to use Client Components
- Forms (need onSubmit, state)
- Modals/dialogs (need open/close state)
- Filter pills with onClick handlers
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
│   ├── db.ts
│   ├── auth.ts
│   └── supabase/
└── types/                  ← Shared TypeScript types
```

---

## Data Fetching

- **Server Components:** fetch directly via Prisma. No loading states needed if data is small (MVP).
- **Mutations:** always Server Actions. Return `{ success: boolean, error?: string }`.
- **No client-side fetching for page data.** The server owns the query.
- **No React Query / SWR in MVP.** Server Components + Server Actions are sufficient.

---

## Styling

- Tailwind CSS v4 with CSS variables for theming.
- shadcn/ui `new-york` variant, `slate` base.
- Theme toggle: CSS class on layout root (`.borrower-theme` / `.admin-theme`) swaps CSS custom properties.
- No inline style objects. Use Tailwind classes or CSS variables.
- OKLCH color values in CSS custom properties (as defined in the Lovable style guide).
- Border radius: `rounded-xl` for cards, `rounded-md` for buttons, `rounded-full` for badges/pills.

---

## Forms

- Use shadcn/ui form components (`<Input>`, `<Select>`, `<Textarea>`), not raw HTML inputs.
- Validation: server-side in Server Actions. Return field-level errors.
- No `react-hook-form` or `zod` unless validation becomes complex — keep it simple for MVP.
- No `window.prompt()` — ever. Use Dialog components.

---

## Auth

- Server-side session checks via middleware and `requireAuth()` / `requireRole()` helpers.
- Client components receive user info as props, not from a client-side auth context.
- No dev bypass mode. Use seeded database for development.
- Redirect unauthenticated → `/login`, wrong role → their correct dashboard.

---

## Error Handling

- `error.tsx` at app root + per-segment where needed.
- Server Actions return error objects, never throw unhandled.
- Toast notifications (sonner) for user-facing success/error feedback after mutations.
- No alert() or confirm() — use Dialog components.

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
- Do not use mock data in application code (seed the database instead).
- Do not create API routes for data access (use Server Components + Server Actions).
- Do not use `window.prompt()` or `window.alert()`.
- Do not add pagination, file upload, or email notifications in MVP.
