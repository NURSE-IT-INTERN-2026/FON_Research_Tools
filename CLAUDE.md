@AGENTS.md

# Research Tools — Next.js App Router Project

## Project Overview

Research Tools is a research equipment lending management system. Borrowers browse and request equipment; admins manage inventory and approve requests. Two roles, two themed portals (orange for borrowers, purple for admins).

This is the real production Next.js App Router project. It is the source of truth.

## Lovable Reference Project

A Lovable-generated project exists solely as a UI/design reference. Its docs are stored under `docs/lovable-reference/`.

### What to use from Lovable
- UI structure, layout patterns, visual design, page behavior

### What NEVER to copy from Lovable
- TanStack Router or TanStack Start patterns
- Supabase Auth logic or client setup
- Supabase client-side queries
- Mock data or dev bypass logic (`VITE_DEV_BYPASS_AUTH`, `isDevBypass`, `mockData`)
- Any routing, auth, or data-fetching code

Convert Lovable pages into Next.js App Router pages manually. No auto-ports.

## Pre-Implementation Checklist

Before writing any code for a feature, read these docs:

1. `docs/implementation_rules.md` — coding standards, architecture, and constraints
2. `docs/tech-stack.md` — technologies, versions, and scope boundaries
3. `docs/PRD.md` — product requirements and MVP scope
4. `docs/_features.md` — feature tracking and current status
5. `docs/route-map.md` — App Router route definitions and Server Actions
6. `docs/data-model.md` — Prisma schema, enums, and relations
7. `docs/auth-rbac.md` — authentication and role-based access control
8. `docs/ui-pages.md` — page layouts and component specifications
9. `docs/status-flow.md` — booking and tool state machines

## Architecture Decisions

- Follow `.agents/skills/next-best-practices/SKILL.md` for all Next.js architecture and implementation decisions.
- Follow `.agents/skills/implement-feature/SKILL.md` when implementing a feature end-to-end.
- Follow `.agents/skills/review-feature/SKILL.md` after completing a feature or when reviewing/fixing a completed slice.
- Use Next.js App Router (`src/app/` directory). No `pages/` directory.
- Use `proxy.ts` for route protection and RBAC — not `middleware.ts`.
- **Supabase Auth only for identity, sessions, and cookies. Prisma for all application data queries and mutations.** Never use the Supabase client for application data queries.
- Use real data. No mock data unless explicitly requested.
- Server Components by default. Client Components only when hooks or event handlers are needed.
- **Never modify files under `docs/lovable-reference/`** — it is a read-only UI/design reference.

## Language

- All user-facing text must be in **Thai** (ภาษาไทย): page headings, labels, button text, placeholder text, error messages, toast messages, empty states, validation messages, navigation items.
- Enum values in the database and code remain in English. Only the display labels shown to users are in Thai.
- Code comments, variable names, file names, and commit messages remain in English.

### Thai Status Labels

Use these mappings for all user-facing status display:

| Enum Value | Thai Label |
|---|---|
| **BookingStatus** | |
| `PENDING` | รอตรวจสอบ |
| `APPROVED` | อนุมัติแล้ว |
| `REJECTED` | ปฏิเสธแล้ว |
| `RETURNED` | คืนแล้ว |
| `OVERDUE` | เกินกำหนด |
| **ToolStatus** | |
| `AVAILABLE` | พร้อมใช้งาน |
| `BORROWED` | กำลังยืม |
| `MAINTENANCE` | ซ่อมบำรุง |
| **AppRole** | |
| `ADMIN` | ผู้ดูแลระบบ |
| `BORROWER` | ผู้ยืม |

## Implementation Rules

- Implement one vertical slice at a time (route + page + data + UI + RBAC). See `.agents/skills/implement-feature/SKILL.md` for the full workflow.
- Keep changes minimal and focused. No speculative features.
- Do not add dependencies unless necessary and justified.
- Enforce RBAC on both server-side and UI where applicable.
- After completing a feature, update `docs/_features.md`.

## Workflow

1. Read required docs before coding.
2. Explain the plan and list files to be changed.
3. Implement the vertical slice.
4. Update `docs/_features.md` to reflect completion.
5. Run `.agents/skills/review-feature/SKILL.md` to review the completed slice.
