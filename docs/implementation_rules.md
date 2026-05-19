# Implementation Rules

Rules for building this project. Every contribution must follow these.

---

## Architecture

- **Next.js App Router** — `src/app/` directory, no `pages/` directory.
- **Server Components by default.** Only add `"use client"` when the component needs hooks, event handlers, or browser APIs.
- **Server Actions for mutations.** No REST API routes for internal data (except file serving). Actions live in `src/actions/` or alongside the page.
- **Prisma for database access.** Single client instance via `src/lib/db.ts`.
- **Route groups** `(student)` and `(admin)` for layout + auth separation, not URL segments.
- **Route protection** uses `proxy.ts` (Next.js 16+) — not `middleware.ts`.

---

## Architecture Split: Auth vs Data

| Concern | Tool | Rule |
|---|---|---|
| User identity, login | CMU Microsoft Azure AD OAuth 2.0 | Redirect to Microsoft → callback → create session |
| Session management | Custom HMAC-SHA256 tokens | HttpOnly cookie, verified on every request |
| Application data | Prisma | All queries and mutations for profiles, documents, activity logs |
| External data | CMU MIS API | ดึงข้อมูลส่วนตัว + วิทยานิพนธ์หลัง login |

---

## Component Rules

- Use shadcn/ui components. Install only what's needed.
- Extract reusable components to `src/components/`. Inline components are not allowed.
- Keep Server Components as high in the tree as possible — push `"use client"` to leaf components.
- Pass data down as props from Server Components to Client Components.

### When to use Client Components
- Forms (need onSubmit, state)
- Modals/dialogs (need open/close state)
- Filter pills (update URL searchParams via `useRouter`)
- File upload (need onChange handler)
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
│   ├── api/
│   │   ├── auth/callback/route.ts   ← OAuth callback
│   │   ├── documents/[id]/          ← File serving, approve, reject, delete
│   │   └── my/documents/route.ts    ← Student's document status API
│   ├── (student)/
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx
│   └── (admin)/
│       ├── layout.tsx
│       └── admin/
│           ├── dashboard/page.tsx
│           ├── documents/page.tsx
│           ├── students/page.tsx
│           └── activity-log/page.tsx
├── components/             ← Shared UI components
├── actions/                ← Server Actions
├── lib/                    ← Utilities, db client, auth helpers
│   ├── db.ts               ← Prisma client singleton
│   ├── auth.ts             ← getSession, requireAuth, requireRole
│   └── upload.ts           ← File upload utility
└── types/                  ← Shared TypeScript types
```

Root-level files:
```
proxy.ts                    ← Next.js 16 route protection (replaces middleware.ts)
```

---

## Data Fetching

- **Server Components:** fetch directly via Prisma.
- **Mutations:** always Server Actions. Return `{ success: boolean, error?: string }`.
- **No client-side fetching for page data.** The server owns the query.
- **Serialize all DateTime fields** to ISO strings before passing to Client Components.

---

## File Upload

- PDF files only, max 100 MB
- Save to `uploads/{studentId}/{studentId}_{sequence}.pdf`
- Auto-generate filename with incrementing sequence number
- Delete both file and DB record on remove
- Serve files via API route `/api/documents/[id]/file`

---

## Filtering & Search

Document list and student list use URL `searchParams` for filtering:

- Server Component reads `searchParams` from page props.
- Client Component filter pills update URL via `useRouter().push()`.
- Server re-renders with filtered data.

Admin navbar search: ค้นหาจากรหัสนักศึกษา / ชื่อ / ชื่อวิทยานิพนธ์

---

## Styling & Theme System

- Tailwind CSS v4 with CSS custom properties for theming.
- shadcn/ui `new-york` variant, `slate` base.
- Two themes swap CSS custom properties via a class on the layout root:
  - `.student-theme` — orange primary
  - `.admin-theme` — purple primary
- No inline style objects. Use Tailwind classes or CSS variables.

---

## Forms

- Use shadcn/ui form components.
- Validation: server-side in Server Actions. Return field-level errors.
- No `window.prompt()` — use Dialog components.

---

## Auth

- CMU OAuth 2.0 — no email/password forms (except admin-created accounts if needed).
- Server-side session checks via `proxy.ts` and `requireAuth()` / `requireRole()`.
- Client components receive user info as props, not from a client-side auth context.
- Redirect unauthenticated → `/`, wrong role → their correct dashboard.

---

## Error Handling

- `global-error.tsx` at app root — catches layout errors.
- `error.tsx` at app level.
- `unauthorized.tsx` and `forbidden.tsx` for auth error pages.
- Server Actions return error objects, never throw unhandled.
- `redirect()` and `notFound()` must not be caught in try-catch — call outside or use `unstable_rethrow()`.
- Toast notifications (sonner) for user-facing feedback.

---

## Language

- All user-facing text in **Thai** (ภาษาไทย)
- Enum values in English
- Code comments, variable names, commit messages in English

### Thai Status Labels

| Enum | Thai Label |
|---|---|
| PENDING | รอตรวจสอบ |
| APPROVED | อนุมัติแล้ว |
| REJECTED | ปฏิเสธแล้ว |

---

## Dependencies

- Do not add a dependency unless it solves a specific problem.
- Justify new dependencies in the commit message.

---

## Git & Commits

- One vertical slice per commit (or per PR).
- Update `docs/_features.md` in the same commit that completes a feature.

---

## What NOT to Do

- Do not copy code from the Lovable project.
- Do not use TanStack Router, TanStack Start, or TanStack React Query.
- Do not use `middleware.ts` — use `proxy.ts` (Next.js 16+).
- Do not use mock data in application code (seed the database instead).
- Do not create API routes for data access (use Server Components + Server Actions) — except file serving.
- Do not use `window.prompt()` or `window.alert()`.
- Do not pass `Date` objects to Client Components — serialize to ISO strings first.
