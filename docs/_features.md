# Feature Tracker

Status: `not started` | `in progress` | `done`

---

## Phase 1 — Foundation

| # | Feature | Status | Depends On |
|---|---------|--------|------------|
| F1 | Database schema + Prisma models + Docker Compose | not started | — |
| F2 | Auth: signup, login, session, role-based redirect | not started | F1 |
| F3 | Middleware: route protection + RBAC | not started | F2 |
| F4 | Layout shell: public layout, borrower layout, admin layout | not started | F3 |
| F5 | Design tokens + theme system (orange borrower / purple admin) | not started | — |

## Phase 2 — Borrower Portal

| # | Feature | Status | Depends On |
|---|---------|--------|------------|
| F6 | Tool catalog: browse, search, filter, tool cards | not started | F4, F5 |
| F7 | Borrow request: modal form with date pickers + validation | not started | F6 |
| F8 | My Bookings: tab view (Current / Pending / Past), cancel action | not started | F4, F5 |

## Phase 3 — Admin Portal

| # | Feature | Status | Depends On |
|---|---------|--------|------------|
| F9 | Admin dashboard: stat cards + recent activity | not started | F4, F5 |
| F10 | Inventory CRUD: table, add/edit modal, status toggle, delete | not started | F4, F5 |
| F11 | Request management: approve/reject/return/overdue with notes dialog | not started | F4, F5 |
| F12 | Users list: read-only table | not started | F4, F5 |

---

## Implementation Order (Vertical Slices)

Each slice delivers a working end-to-end feature:

1. **F1 + F5** — Schema + theme (parallel, no dependencies)
2. **F2** — Auth
3. **F3 + F4** — Middleware + layouts
4. **F6 + F7** — Borrower catalog + request flow
5. **F8** — Borrower bookings
6. **F9** — Admin dashboard
7. **F10** — Admin inventory
8. **F11** — Admin requests
9. **F12** — Admin users

Update this file after completing each feature. Change `not started` → `in progress` → `done`.
