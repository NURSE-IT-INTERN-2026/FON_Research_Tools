# Feature Tracker

---

## Phase 1 — Foundation

- [x] **F1** Database schema + Prisma models + Docker Compose + seed script *(— | `docker compose up` creates DB, `npx prisma migrate dev` applies schema, `npx prisma db seed` populates test data`)*
- [x] **F2** Supabase Auth setup: Docker config + `@supabase/ssr` server client + auth helpers (`getSession`, `requireAuth`, `requireRole`) *(F1 | Server Components can call `getSession()` and read authenticated user ID from cookies)*
- [ ] **F3** Signup page: form + Server Action + PostgreSQL trigger (`handle_new_user`) + role selection *(F1, F2 | User can register, Profile + UserRole rows are created, redirect to correct dashboard)*
- [ ] **F4** Login page: form + Server Action + session + role-based redirect *(F2 | User can sign in, gets redirected by role, error shown on failure)*
- [ ] **F5** `proxy.ts`: route protection + RBAC redirect (unauthenticated → `/login`, wrong role → correct dashboard) *(F2 | Unauthenticated users redirected from protected routes; wrong-role users redirected)*
- [ ] **F6** Layout shell: root layout, public layout (centered card), borrower layout (orange sidebar), admin layout (purple sidebar) *(F5 | Each role group renders the correct sidebar; public pages have no sidebar)*
- [ ] **F7** Design tokens + theme system (CSS custom properties for orange borrower / purple admin) *(— | Two theme CSS classes swap primary, accent, sidebar, and ring tokens)*

## Phase 2 — Borrower Portal

- [ ] **F8** Tool catalog: browse, search (URL searchParams), category/status filter pills, responsive tool card grid *(F6, F7 | Borrower sees tool cards, can filter by category and status, search by name; filters update URL and re-render server-side)*
- [ ] **F9** Borrow request: modal form with date pickers + validation + Server Action `createBooking` *(F8 | Borrower can submit a borrow request with dates and purpose; PENDING booking created; tool remains AVAILABLE until approved)*
- [ ] **F10** My Bookings: tab view (Current / Pending / Past), cancel pending booking *(F6, F7 | Borrower sees bookings grouped by tab; can cancel PENDING bookings (→ REJECTED); status badges render correctly)*

## Phase 3 — Admin Portal

- [ ] **F11** Admin dashboard: 4 stat cards (linked) + recent activity feed *(F6, F7 | Admin sees live counts from DB; activity feed shows latest 10 bookings with borrower name + verb + tool name)*
- [ ] **F12** Inventory CRUD: data table, create/edit tool modal, status toggle, deactivate/archive with confirm *(F6, F7 | Admin can add, edit, deactivate tools (soft delete); toggle MAINTENANCE ↔ AVAILABLE; data persists in DB; deactivated tools hidden from borrower catalog)*
- [ ] **F13** Request management: approve/reject with notes dialog, mark returned, flag overdue *(F6, F7 | Admin can approve (→ tool BORROWED), reject with notes, mark returned (→ tool AVAILABLE), flag overdue; availability check runs on return)*
- [ ] **F14** Users list: read-only table (name, email, department, role) *(F6, F7 | Admin sees all registered users with roles)*

---

## Implementation Order (Vertical Slices)

Each slice delivers a working end-to-end feature:

1. **F1 + F7** — Schema + theme (parallel, no dependencies)
2. **F2** — Supabase Auth setup + helpers
3. **F3** — Signup page + trigger
4. **F4** — Login page + redirect
5. **F5 + F6** — Proxy + layouts
6. **F8** — Tool catalog
7. **F9** — Borrow request flow
8. **F10** — My Bookings
9. **F11** — Admin dashboard
10. **F12** — Admin inventory
11. **F13** — Admin requests
12. **F14** — Admin users
