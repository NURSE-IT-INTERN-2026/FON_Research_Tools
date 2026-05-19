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
| CMU Microsoft Azure AD OAuth 2.0 | User identity via CMU Account | Login only — redirects to Microsoft, receives callback |
| Custom session tokens (HMAC-SHA256) | Session management | HttpOnly cookie, verified on every request via proxy.ts |

## Database

| Technology | Purpose |
|---|---|
| PostgreSQL | Primary database |
| Prisma 7 | ORM — all application data access (profiles, documents, activity logs) |
| Docker Compose | Local development: PostgreSQL |

## External APIs

| API | Purpose |
|---|---|
| CMU MIS API (`/v3/me/basicinfo`) | ดึงข้อมูลผู้ใช้หลัง OAuth login |
| CMU MIS API (`StudentThesisProfile`) | ดึงข้อมูลวิทยานิพนธ์นักศึกษา |
| Microsoft Azure AD OAuth | Authentication |

## File Storage

| Technology | Purpose |
|---|---|
| Local filesystem (`uploads/`) | เก็บไฟล์ PDF ที่นักศึกษาอัปโหลด |

## UI

| Technology | Purpose |
|---|---|
| Tailwind CSS v4 | Styling, CSS custom properties for theming |
| shadcn/ui (new-york, slate base) | Component library |
| Lucide React | Icons |
| sonner | Toast notifications |

## Architecture Rules

| Concern | Tool | Rule |
|---|---|---|
| Data queries (reads) | Prisma in Server Components | No API round-trip |
| Data mutations | Server Actions | No REST routes for internal mutations |
| File serving | API route (`/api/documents/[id]/file`) | Serve PDF files |
| Route protection | `proxy.ts` (not `middleware.ts`) | Next.js 16 naming |
| Client-side state | Minimal — URL searchParams for filters | No React Query in MVP |
| Session | Custom HMAC-SHA256 tokens in HttpOnly cookie | Server-side only |
