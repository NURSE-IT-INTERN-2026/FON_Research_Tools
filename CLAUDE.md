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

---

## MANDATORY — Read Before Every Code Change

**STOP. Do NOT write any code until you have completed the steps below.**

### Step 1: Read relevant skills

Read the SKILL.md file for every topic that applies to your task:

| If your task involves... | Read this skill first |
|---|---|
| ANY Next.js code (routes, pages, layouts, components) | `.agents/skills/next-best-practices/SKILL.md` |
| Redirects, navigation, URL matching, proxy, basePath | `.agents/skills/basepath-handling/SKILL.md` |
| Implementing a new feature or modifying an existing one | `.agents/skills/implement-feature/SKILL.md` |
| CMU OAuth login, token exchange, user info | `.agents/skills/cmu-oauth-integration/SKILL.md` |
| Finishing a feature (before marking done) | `.agents/skills/review-feature/SKILL.md` |

### Step 2: Read project docs (for feature work)

1. `docs/phasing-plan.md` — is this feature Phase 1 or Phase 2?
2. `docs/_features.md` — current feature status
3. `docs/route-map.md` — which routes are involved?
4. `docs/data-model.md` — which Prisma models are involved?
5. `docs/auth-rbac.md` — which roles can access this?

### Step 3: Read existing code

Before changing a file, READ IT FIRST. Understand what exists before modifying.

### Step 4: Summarize plan to user

Tell the user what files you will change and why. Wait for confirmation before implementing.

**Only after completing ALL steps above, start writing code.**

---

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

---

## Pre-Implementation Docs Reference

Full docs list for deeper reading when needed:

1. `docs/phasing-plan.md` — what to build now vs later
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
12. `docs/ReserchTool-api/00-research-tool-detail.md` — API credentials and endpoints (source of truth)
13. `docs/ReserchTool-api/Email_API_Manual.pdf` — Email API documentation

---

## Architecture Rules

- Use Next.js App Router (`src/app/` directory). No `pages/` directory.
- Use `proxy.ts` for route protection and RBAC — not `middleware.ts`.
- **CMU OAuth 2.0 for authentication + HMAC-SHA256 session tokens. Prisma for all application data queries and mutations.**
- Use real data. No mock data unless explicitly requested.
- Server Components by default. Client Components only when hooks or event handlers are needed.
- **Keep existing UI styling** — the current UI design is good, only change data/content.
- **Never modify files under `docs/lovable-reference/`** — it is a read-only UI/design reference.
- Implement one vertical slice at a time (route + page + data + UI + RBAC).
- Keep changes minimal and focused. No speculative features.
- Do not add dependencies unless necessary and justified.
- Enforce RBAC on both server-side and UI where applicable.

---

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

---

## Workflow — Complete Feature Cycle

For every feature the user asks you to implement:

```
1. READ SKILLS → 2. READ DOCS → 3. READ CODE → 4. PLAN → 5. IMPLEMENT → 6. REVIEW → 7. UPDATE DOCS
```

1. **Read skills** — Follow "MANDATORY — Read Before Every Code Change" above
2. **Read docs** — Check phasing, features, route-map, data-model, auth-rbac
3. **Read existing code** — Read files you will modify before changing them
4. **Summarize plan** — Tell user what files will change, get confirmation
5. **Implement** — Write the vertical slice
6. **Review** — Read `.agents/skills/review-feature/SKILL.md` and run the checklist
7. **Update docs** — Update `docs/_features.md` to reflect completion
8. **Report** — Tell user the review result

**Do NOT skip steps 1-4. Do NOT implement without reading skills first. Do NOT mark complete without running the review.**
