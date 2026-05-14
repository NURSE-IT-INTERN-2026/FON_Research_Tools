# Tech Stack

Single source for every technology decision and its scope.

---

## Runtime & Framework

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 (App Router) | Framework, SSR, routing, Server Components, Server Actions |
| React | 19 | UI library |
| TypeScript | 5+ | Type safety |

## Auth

| Technology | Purpose | Scope |
|---|---|---|
| Supabase Auth | User identity, signup, login, session management | Auth only — never used for data queries |
| `@supabase/ssr` | Server-side session management via cookies | Server Components + proxy.ts |

## Database

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary database |
| Prisma 7 | ORM — all application data access (profiles, tools, bookings) |
| Docker Compose | Local development: PostgreSQL + Supabase Auth |

## UI

| Technology | Purpose |
|---|---|
| Tailwind CSS v4 | Styling, CSS custom properties for theming |
| shadcn/ui (new-york, slate base) | Component library — install only what's needed |
| Lucide React | Icons |
| sonner | Toast notifications |
| date-fns | Date formatting |

## Architecture Rules

| Concern | Tool | Rule |
|---|---|---|
| Data queries (reads) | Prisma in Server Components | No API round-trip |
| Data mutations | Server Actions | No REST routes for internal mutations |
| Route protection | `proxy.ts` (not `middleware.ts`) | Next.js 16 naming |
| Client-side state | Minimal — URL searchParams for filters | No React Query in MVP |
| Session | Supabase Auth cookies via `@supabase/ssr` | Server-side only |
