# Documentation Audit Report

Audited all project docs on 2026-05-19 — post-pivot to research tool document management system.

---

## CRITICAL — Must Fix Before Coding

### C1. No stale references to old equipment lending system

All docs have been rewritten for the new system. Verify no code still references:
- `BORROWER` role (should be `STUDENT`)
- `Tool` / `Booking` models (should be `Document`)
- `BookingStatus` enum (should be `DocumentStatus`)
- `/my-bookings`, `/admin/inventory`, `/admin/requests` routes

**Status:** Docs updated. Must verify during code implementation.

---

## HIGH — Should Fix Before Coding

### H1. Proxy route list must match new routes

`src/proxy.ts` currently has:
- `BORROWER_PREFIXES = ["/dashboard", "/my-bookings", "/change-password"]`

Must change to:
- `STUDENT_PREFIXES = ["/dashboard", "/change-password"]`

### H2. Auth helper types must use STUDENT not BORROWER

`src/lib/auth.ts` has `role: "ADMIN" | "BORROWER"` — must change to `"ADMIN" | "STUDENT"`.

### H3. Seed script uses old data

`prisma/seed.ts` creates Tool + Booking data. Must rewrite for:
- Student profiles with thesis info
- Document records with PDF file references
- Activity log entries for document actions

---

## MEDIUM — Should Fix Soon

### M1. CMU OAuth integration placeholder

Phase 1 uses email/password auth. Phase 2 needs CMU OAuth 2.0. The data model already has fields for Phase 2 (`accountType`, `cmuItAccount`, `studentStatus`) — they're nullable. No action needed now, but be aware when implementing signup.

### M2. File upload utility not yet implemented

Need `src/lib/upload.ts` for PDF upload handling and `src/app/api/documents/[id]/file/route.ts` for serving files. These are new files, not modifications.

---

## Summary

| Severity | Count | Block coding? |
|---|---|---|
| CRITICAL | 1 | Yes — verify during implementation |
| HIGH | 3 | Yes — must fix in code |
| MEDIUM | 2 | No |

**Status:** Docs are implementation-ready for Phase 1. The remaining items are code changes, not doc issues.
