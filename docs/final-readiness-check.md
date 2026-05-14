# Final Readiness Check

Checked 2026-05-14. Docs audited: PRD, _features, route-map, data-model, auth-rbac, ui-pages, status-flow, implementation_rules, tech-stack, CLAUDE.md.

---

## Banned Term Sweep

| Term | Result |
|---|---|
| `middleware.ts` as active pattern | Clean. All 6 mentions say "not middleware" or "replaces middleware". |
| TanStack Router/Start/Query | Clean. Only in "do not use" lists. |
| Supabase data queries | Clean. Zero hits for `.from()`, `.select()`, `.insert()` etc. |
| Mock data / dev bypass | Clean. Only in "do not use" lists and "seed the database instead". |
| Hard delete as default action | Clean. All docs use "deactivate" / "soft delete". Hard delete mentioned only as an exception for zero-booking tools. |
| Stale `/dashboard/my-bookings` route | Clean. Zero hits. All docs use `/my-bookings`. |

---

## Route Consistency

All 9 routes referenced consistently across PRD, route-map, ui-pages, and auth-rbac:

| Route | PRD | Route-map | UI-pages | Auth-rbac | Match |
|---|---|---|---|---|---|
| `/` | Yes | Yes | Yes | Yes | OK |
| `/login` | Yes | Yes | Yes | Yes | OK |
| `/signup` | Yes | Yes | Yes | Yes | OK |
| `/dashboard` | Yes | Yes | Yes | Yes | OK |
| `/my-bookings` | Yes | Yes | Yes | Yes | OK |
| `/admin/dashboard` | Yes | Yes | Yes | Yes | OK |
| `/admin/inventory` | Yes | Yes | Yes | Yes | OK |
| `/admin/requests` | Yes | Yes | Yes | Yes | OK |
| `/admin/users` | Yes | Yes | Yes | Yes | OK |

No missing routes. No stale routes.

---

## RBAC Consistency

Auth-rbac proxy redirect rules cover all route groups:
- Unauthenticated → `/login`
- Borrower on `/admin/*` → `/dashboard`
- Admin on `/dashboard/*`, `/my-bookings` → `/admin/dashboard`
- Authenticated on `/`, `/login`, `/signup` → role-specific dashboard

**Minor ambiguity:** Item 4 says "redirect to dashboard" generically. Should explicitly say "redirect to `/dashboard` for BORROWER, `/admin/dashboard` for ADMIN." Not a blocker — implementer will infer correctly from the role check — but worth noting.

---

## Data Model Consistency

| Check | Result |
|---|---|
| `isActive` on Tool | Defined in data-model, referenced in route-map (deactivateTool), _features (F12), ui-pages (Deactivate action). Consistent. |
| `returnDate` on Booking | Defined in data-model, set in status-flow (RETURNED transitions). Consistent. |
| `userId @unique` on UserRole | Defined in data-model, matches PRD "one role per user" rule. Relations summary updated to 1──1. Consistent. |
| Trigger migration order | Documented: trigger runs after Prisma creates tables + AppRole enum. Consistent. |

---

## Status Flow Consistency

All booking status transitions in status-flow match the Server Actions in route-map:

| Transition | Status-flow | Route-map Action | Match |
|---|---|---|---|
| — → PENDING | Borrower submits | `createBooking` | OK |
| PENDING → APPROVED | Admin approves | `approveBooking` | OK |
| PENDING → REJECTED | Admin rejects | `rejectBooking` | OK |
| PENDING → REJECTED | Borrower cancels | `cancelBooking` | OK |
| APPROVED → RETURNED | Admin marks returned | `markReturned` | OK |
| APPROVED → OVERDUE | Admin flags overdue | `markOverdue` | OK |
| OVERDUE → RETURNED | Admin marks returned | `markReturned` | OK |

Tool side effects match: APPROVE → BORROWED, RETURN → AVAILABLE (with availability check). Consistent.

**Minor clarity issue:** Status-flow says "set `returnDate` to null" on PENDING → APPROVED. This is a no-op since `returnDate` is already null for a new booking. Harmless but slightly misleading.

---

## Feature Dependency Consistency

| Feature | Depends On | Valid? |
|---|---|---|
| F1 (schema) | — | Yes — no deps |
| F2 (auth setup) | F1 | Yes — needs DB for UserRole queries |
| F3 (signup) | F1, F2 | Yes — needs schema (trigger targets) + auth helpers |
| F4 (login) | F2 | Yes — needs auth helpers only |
| F5 (proxy) | F2 | Yes — needs session reading |
| F6 (layouts) | F5 | Yes — needs proxy for auth guard |
| F7 (theme) | — | Yes — no deps |
| F8 (catalog) | F6, F7 | Yes — needs layout + theme |
| F9 (borrow request) | F8 | Yes — needs catalog page to host the modal |
| F10 (my bookings) | F6, F7 | Yes — needs layout + theme |
| F11 (admin dashboard) | F6, F7 | Yes — needs layout + theme |
| F12 (inventory) | F6, F7 | Yes — needs layout + theme |
| F13 (requests) | F6, F7 | Yes — needs layout + theme |
| F14 (users) | F6, F7 | Yes — needs layout + theme |

No circular dependencies. No missing deps. Implementation order in `_features.md` respects all dependencies.

---

## One Gap Found

**`implementation_rules.md` tool catalog example query does not filter `isActive`.**

The borrower catalog query example (line 119-126) reads:
```ts
const tools = await db.tool.findMany({
  where: {
    ...(q && { name: { contains: q, mode: "insensitive" } }),
    ...(category && category !== "ALL" && { category }),
    ...(status && status !== "ALL" && { status: status as ToolStatus }),
  },
});
```

Missing: `isActive: true` in the where clause. Deactivated tools would appear in the borrower catalog. The data-model doc says `isActive` "hides it from the borrower catalog" and F12's acceptance criteria says "deactivated tools hidden from borrower catalog" — but the example code doesn't enforce this.

**Fix:** Add `isActive: true` as a constant filter in the example:
```ts
where: {
  isActive: true,
  ...(q && { ... }),
}
```

---

## Can F1 Start Safely?

**Yes.** F1 has zero dependencies and is first in the implementation order.

What F1 will create:
- `prisma/schema.prisma` with all models and enums
- `docker-compose.yml` with PostgreSQL + Supabase Auth
- `prisma/seed.ts` with test data
- `prisma/migrations/` with trigger SQL (run after Prisma migrate)

No existing code depends on these files. F1 is safe to start immediately.

---

## Summary

| Category | Status |
|---|---|
| Banned terms | Clean |
| Route consistency | Clean |
| RBAC consistency | Clean (minor wording note) |
| Data model consistency | Clean |
| Status flow consistency | Clean (minor clarity note) |
| Feature dependencies | Clean |
| Gaps requiring a doc fix | 1 — `isActive` filter missing from example query |
| F1 readiness | Ready to start |

The docs are implementation-ready. The one gap (missing `isActive` filter in the example query) is a code example issue in `implementation_rules.md`, not a spec conflict — it won't block F1.
