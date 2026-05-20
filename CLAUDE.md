@AGENTS.md

# Research Tools — Next.js App Router Project

## Security — Secrets

**NEVER read `.env` or any file containing real secrets** (CLIENT_SECRET, AUTH_SECRET, DATABASE_URL passwords, API tokens, etc). When you need to know what environment variables are available, read `.env.example` instead. If the user asks you to check or fix env values, ask them to verify manually — do not read the file yourself.

## Project Overview

Research Tools is a **ระบบจัดการเอกสารเครื่องมือวิจัย** (Research Tool Document Management System) for คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่. Students upload research instrument documents (PDF); admins approve/reject them. Two roles, two themed portals (orange for students, purple for admins).

This is the real production Next.js App Router project. It is the source of truth.

## Phasing

**IMPORTANT:** This project has 2 phases. Check `docs/phasing-plan.md` for details.

- **Phase 1 (current):** CMU OAuth 2.0 login + Thesis API (fetch on display) + Document Management + Email API + Download PDF
- **Phase 2 (later):** OCR, Export (Excel/CSV), Tool usage history

**Dev setup:** Port 4141, base path `/researchtool` (matches Azure redirect URL). Run with `npm run dev`.

**API credentials** are in `docs/ReserchTool-api/00-research-tool-detail.md`. The `.agents/skills/cmu-oauth-integration/` skill is reference only for patterns like `oauth_state` CSRF and error codes.

**Thesis data is NOT stored in DB.** Fetch from Thesis API on display only. Profile stores: name, email, studentId, cmuItAccount, accountType.

**Dev testing:** Set `MOCK_THESIS=true` in `.env.local` to use mock thesis data. Set `DEV_TEST_STUDENT_ID` to test with a specific student ID.

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

1. `docs/phasing-plan.md` — **READ THIS FIRST** — what to build now vs later
2. `docs/requirements-summary.md` — concise requirements for boss review
3. `docs/implementation_rules.md` — coding standards, architecture, and constraints
4. `docs/tech-stack.md` — technologies, versions, and scope boundaries
5. `docs/PRD.md` — product requirements
6. `docs/_features.md` — feature tracking and current status
7. `docs/route-map.md` — App Router route definitions and Server Actions
8. `docs/data-model.md` — Prisma schema, enums, and relations
9. `docs/auth-rbac.md` — authentication and role-based access control
10. `docs/ui-pages.md` — page layouts and component specifications
11. `docs/status-flow.md` — document status state machine
12. `docs/ReserchTool-api/00-research-tool-detail.md` — **API credentials and endpoints (source of truth)**
13. `docs/ReserchTool-api/Email_API_Manual.pdf` — Email API documentation

## Architecture Decisions

- **MANDATORY:** When the user asks to implement a feature, you MUST read and follow `.agents/skills/implement-feature/SKILL.md` step-by-step. Do not skip this.
- **MANDATORY:** After completing any feature, you MUST read and follow `.agents/skills/review-feature/SKILL.md` before marking it done. Do not skip this.
- **MANDATORY:** Follow `.agents/skills/next-best-practices/SKILL.md` for all Next.js architecture and implementation decisions. Read it before writing any Next.js code.
- **MANDATORY:** When writing redirects, navigation, or URL matching, read `.agents/skills/basepath-handling/SKILL.md`. The project uses `basePath: "/researchtool"` and each context (proxy, route handlers, server actions, client components) handles basePath differently. Wrong usage causes double-path or missing-path bugs.
- **MANDATORY:** When working on CMU OAuth, read `.agents/skills/cmu-oauth-integration/SKILL.md` as reference for patterns (not authoritative — `docs/ReserchTool-api/00-research-tool-detail.md` is source of truth).
- Use Next.js App Router (`src/app/` directory). No `pages/` directory.
- Use `proxy.ts` for route protection and RBAC — not `middleware.ts`.
- **CMU OAuth 2.0 for authentication + HMAC-SHA256 session tokens. Prisma for all application data queries and mutations.**
- Use real data. No mock data unless explicitly requested.
- Server Components by default. Client Components only when hooks or event handlers are needed.
- **Keep existing UI styling** — the current UI design is good, only change data/content.
- **Never modify files under `docs/lovable-reference/`** — it is a read-only UI/design reference.

## Language

- All user-facing text must be in **Thai** (ภาษาไทย): page headings, labels, button text, placeholder text, error messages, toast messages, empty states, validation messages, navigation items.
- Enum values in the database and code remain in English. Only the display labels shown to users are in Thai.
- Code comments, variable names, file names, and commit messages remain in English.

### Thai Status Labels

Use these mappings for all user-facing status display:

| Enum Value | Thai Label |
|---|---|
| **DocumentStatus** | |
| `PENDING` | รอตรวจสอบ |
| `APPROVED` | อนุมัติแล้ว |
| `REJECTED` | ปฏิเสธแล้ว |
| **AppRole** | |
| `ADMIN` | เจ้าหน้าที่ |
| `STUDENT` | นักศึกษา |
| **StudentStatus** (Phase 2) | |
| Active | กำลังศึกษา |
| Resigned | ลาออก |
| Dismissed | พ้นสภาพ |

## Implementation Rules

- Implement one vertical slice at a time (route + page + data + UI + RBAC). See `.agents/skills/implement-feature/SKILL.md` for the full workflow.
- Keep changes minimal and focused. No speculative features.
- Do not add dependencies unless necessary and justified.
- Enforce RBAC on both server-side and UI where applicable.
- After completing a feature, update `docs/_features.md`.
- **Keep existing UI** — only change data/content, not styling or layout.

## Workflow

For every feature the user asks you to implement, you MUST follow this exact sequence:

1. **Read** `.agents/skills/implement-feature/SKILL.md` and follow its workflow.
2. **Read** all required docs listed in the skill before writing any code.
3. **Summarize** the plan and list files to be changed (as the skill requires).
4. **Implement** the vertical slice.
5. **Read** `.agents/skills/review-feature/SKILL.md` and run the full review checklist.
6. **Fix** any issues found during review.
7. **Update** `docs/_features.md` to reflect completion.
8. **Report** the review result to the user.

Do NOT skip steps 1 or 5. Do NOT implement without reading the skill first. Do NOT mark complete without running the review.
