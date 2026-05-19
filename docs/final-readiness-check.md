# Final Readiness Check

Checked 2026-05-19. Post-pivot to research tool document management system.

---

## Banned Term Sweep

| Term | Result |
|---|---|
| `BORROWER` role in docs | Clean. All docs use `STUDENT`. Code still has BORROWER — must update during implementation. |
| `middleware.ts` as active pattern | Clean. All docs use `proxy.ts`. |
| TanStack Router/Start/Query | Clean. Only in "do not use" lists. |
| Supabase references | Clean. Project uses custom auth, not Supabase. |
| Mock data / dev bypass | Clean. Only in "do not use" lists. |
| Old routes (`/my-bookings`, `/admin/inventory`, `/admin/requests`) | Clean in docs. Code still has them — must update during implementation. |

---

## Route Consistency

New routes referenced consistently across all docs:

| Route | PRD | Route-map | UI-pages | Auth-rbac | Match |
|---|---|---|---|---|---|
| `/` | Yes | Yes | Yes | Yes | OK |
| `/login` | Yes | Yes | Yes | Yes | OK |
| `/signup` | Yes | Yes | Yes | Yes | OK |
| `/dashboard` (student) | Yes | Yes | Yes | Yes | OK |
| `/admin/dashboard` | Yes | Yes | Yes | Yes | OK |
| `/admin/documents` | Yes | Yes | Yes | Yes | OK |
| `/admin/students` | Yes | Yes | Yes | Yes | OK |
| `/admin/activity-log` | Yes | Yes | Yes | Yes | OK |

---

## RBAC Consistency

| Scenario | Rule |
|---|---|
| Unauthenticated | → `/` (landing) |
| Student on `/admin/*` | → `/dashboard` |
| Admin on `/dashboard` | → `/admin/dashboard` |
| Authenticated on `/`, `/login` | → role-specific dashboard |

---

## Data Model Consistency

| Check | Result |
|---|---|
| `Document` model with status | Defined in data-model, referenced in route-map, _features, status-flow. Consistent. |
| `approvedAt` field | Defined in data-model, used in API `/api/my/documents`, status-flow. Consistent. |
| `studentStatus` field (Phase 2) | Defined as nullable. Referenced in ui-pages (admin students). Consistent. |
| `userId @unique` on UserRole | One role per user. Consistent. |

---

## Status Flow Consistency

All document status transitions match Server Actions:

| Transition | Status-flow | Route-map Action | Match |
|---|---|---|---|
| — → PENDING | Student uploads | `uploadDocument` | OK |
| PENDING → APPROVED | Admin approves | `approveDocument` / `approveAllDocuments` | OK |
| PENDING → REJECTED | Admin rejects | `rejectDocument` | OK |
| PENDING → deleted | Student removes | `removeDocument` | OK |
| any → deleted | Admin removes | `removeDocument` | OK |

---

## Feature Dependency Consistency (Phase 1)

| Feature | Depends On | Valid? |
|---|---|---|
| F1 (schema) | — | Yes |
| F2 (auth - email/password) | F1 | Yes |
| F3 (proxy + RBAC) | F2 | Yes |
| F4 (layouts) | F3 | Yes |
| F5 (theme) | — | Yes |
| F6 (student dashboard) | F4, F5 | Yes |
| F7 (upload) | F6 | Yes |
| F8 (document management) | F6 | Yes |
| F9 (admin dashboard) | F4, F5 | Yes |
| F10 (admin documents) | F4, F5 | Yes |
| F11 (admin students) | F4, F5 | Yes |
| F12 (admin search) | F11 | Yes |
| F13 (activity log) | F4, F5 | Yes |
| F14 (API my/documents) | F1, F2 | Yes |

No circular dependencies. Implementation order in `_features.md` is valid.

---

## Phase 2 Readiness

Phase 2 items are documented but not blocking:

| Item | Status | Blocker? |
|---|---|---|
| CMU OAuth 2.0 | Documented in `auth-rbac.md`, `phasing-plan.md` | No — waiting for API access |
| CMU MIS API data fetch | Documented in `auth-rbac.md`, `data-model.md` | No — waiting for API access |
| Student status badge | Model field exists (nullable), UI spec ready | No — needs MIS API data |
| Email notifications | Listed as Post-MVP | No |

---

## Can F1 Start Safely?

**Yes.** F1 has zero dependencies.

What F1 will change:
- `prisma/schema.prisma` — new enums, remove Tool/Booking, add Document
- `prisma/seed.ts` — new seed data for documents
- `docker-compose.yml` — PostgreSQL only (no Supabase Auth needed)

---

## Summary

| Category | Status |
|---|---|
| Banned terms | Clean in docs |
| Route consistency | Clean — 8 routes, all consistent |
| RBAC consistency | Clean |
| Data model consistency | Clean |
| Status flow consistency | Clean |
| Feature dependencies | Clean — valid order |
| Phase 2 readiness | Documented, not blocking |
| F1 readiness | Ready to start |
