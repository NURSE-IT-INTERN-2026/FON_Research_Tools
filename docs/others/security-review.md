# Security Review Report

Date reviewed: 2026-05-28

Scope reviewed:
- Application source: `src/` (actions, lib, app/api, proxy, components)
- Auth/session entry points: `src/lib/auth/`, `src/app/api/auth/`
- Dependency manifests: `package.json`, `package-lock.json`
- Audit commands: `npm audit --json`

Method:
- Source inspection of all auth, session, OAuth, proxy, server action, and API route files
- Dependency audit via `npm audit`
- Checklist-driven review against security review checklist
- 908 total dependencies audited

Coverage summary:
- ~45 application-owned files reviewed
- 0 test files in scope
- 0 generated files reviewed
- 0 vendored files reviewed

Coverage notes:
- All auth/session/proxy files manually reviewed
- All server actions and API routes manually reviewed
- All logging statements inspected for sensitive data
- Dependency audit covers full dependency tree

---

## Executive Summary

Source code has **solid auth fundamentals** — HMAC-signed session tokens, OAuth CSRF state protection, server-side role verification on all privileged actions, parameterized Prisma queries, and proper file ownership checks. No critical exploitable vulnerabilities were found in application code.

**3 source findings** require attention: unsalted SHA-256 for admin passwords, PII in email logs, and world-readable token cache file.

**4 dependency findings**: `xlsx` has HIGH severity prototype pollution with no upstream fix available; 3 moderate findings with upgrade paths.

---

## Findings Table

| # | Category | Finding | Severity | Status | Notes |
|---|----------|---------|----------|--------|-------|
| 1 | Source code | Admin password uses unsalted SHA-256 instead of bcrypt | Medium | fix-now | Project has bcrypt module but admin auth doesn't use it |
| 2 | Source code | Email SendEmail logs PII (recipient emails) on every send | Medium | fix-now | High-volume PII accumulation in server logs |
| 3 | Source code | Email API token cached world-readable on disk | Medium | fix-now | `.cache/email-token.json` has 644 permissions |
| 4 | Dependency | `xlsx` — Prototype Pollution + ReDoS | High | waiting-provider | No fix available from SheetJS |
| 5 | Dependency | `postcss` (via `next`) — XSS in CSS stringify | Moderate | waiting-provider | Fixed in postcss 8.5.10, bundled in next |
| 6 | Dependency | `@hono/node-server` (via `prisma`) — Path traversal | Moderate | waiting-provider | Fixed in 1.19.13, needs prisma update |
| 7 | Dependency | `qs` — DoS on null entries | Moderate | fix-now | Upgrade to >6.15.1 |

Status legend:
- `fix-now`: team can remediate or mitigate directly
- `waiting-provider`: stable fix depends on upstream or provider release timing

---

## Source Findings

### 1. Medium: Admin Password Uses Unsalted SHA-256

Evidence:
- `src/lib/auth/admin-credentials.ts:10-11` — `createHash("sha256").update(password).digest("hex")` with no salt
- `src/lib/auth/password.ts` — bcrypt implementation exists but is not used by admin auth
- `src/lib/auth/admin-credentials.ts:4-5` — `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` from env

Impact:
- SHA-256 without salt is fast to brute-force (billions of hashes/second on GPU)
- If `ADMIN_PASSWORD_HASH` is leaked through env file exposure, attacker can recover the plaintext password quickly
- bcrypt with cost factor 10 (already in `password.ts`) would slow this by orders of magnitude

Remediation:
1. Migrate `admin-credentials.ts` to use bcrypt from `src/lib/auth/password.ts`
2. Update `ADMIN_PASSWORD_HASH` env var to store bcrypt hash instead of SHA-256
3. Add migration script to convert existing SHA-256 hashes

### 2. Medium: Email SendEmail Logs PII on Every Successful Send

Evidence:
- `src/lib/email.ts:92` — `console.log("[email] API response:", JSON.stringify(data));`
- `src/lib/email.ts:70` — `console.log("[email] Sending to:", params.sentTo, "subject:", params.subject);`

Impact:
- Recipient email addresses are logged in server logs on every email send (uploads, approvals, rejections)
- Over time, this creates a high-volume PII log of every student and admin email address
- Violates data minimization principles

Remediation:
1. Remove `console.log` on line 92 (API response logging)
2. Replace line 70 with a debug-level log gated to non-production:
   ```ts
   if (process.env.NODE_ENV !== "production") {
     console.log("[email] Sending to:", params.sentTo);
   }
   ```

### 3. Medium: Email API Token Cached World-Readable on Disk

Evidence:
- `src/lib/email.ts:56-58` — `writeFile(TOKEN_CACHE_PATH, JSON.stringify(cache))` with default permissions (644)
- Token valid for up to 24 hours
- Any user/process on the host can read the bearer token

Impact:
- Token can be used to send emails impersonating the university nursing faculty system
- On shared hosting or if file traversal exists elsewhere, token is exposed

Remediation:
1. Set restrictive permissions when writing the cache file:
   ```ts
   import { chmodSync } from "node:fs";
   writeFile(TOKEN_CACHE_PATH, JSON.stringify(cache));
   chmodSync(TOKEN_CACHE_PATH, 0o600);
   ```
2. Or switch to in-memory cache to avoid filesystem exposure entirely

---

## Dependency Findings

### 4. High: `xlsx` — Prototype Pollution + ReDoS (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)

Dependency path:
- `xlsx` (direct dependency)

Details:
- Prototype Pollution: CVSS 7.8 — all versions < 0.19.3
- ReDoS: CVSS 7.5 — all versions < 0.20.2
- `npm audit` reports: `fixAvailable: false`
- SheetJS has moved to a commercial model; community edition may not receive patches

Recommended action:
1. Evaluate switching to `exceljs` or `xlsx-populate` which are actively maintained
2. If keeping `xlsx`, ensure it only processes server-generated data (not user-uploaded spreadsheets)
3. Current usage in `src/app/api/documents/export/route.ts` exports DB data — input is controlled, reducing practical risk

### 5. Moderate: `postcss` XSS via Unescaped `</style>` (GHSA-qx2v-qp2m-jg93)

Dependency path:
- `next` → `postcss` (< 8.5.10)

Details:
- CVSS 6.1 — XSS via CSS stringify output
- Fix available in postcss 8.5.10 but bundled inside `next`
- Requires `next` update when available

Recommended action:
1. Monitor Next.js releases for bundled postcss update
2. Mark as `waiting-provider` — no local mitigation needed since the app uses React (auto-escapes JSX)

### 6. Moderate: `@hono/node-server` Path Traversal (GHSA-92pp-h63x-v22m)

Dependency path:
- `prisma` → `@prisma/dev` → `@hono/node-server` (< 1.19.13)

Details:
- CVSS 5.3 — middleware bypass via repeated slashes in serveStatic
- Indirect dependency via Prisma dev tooling
- Fix available: upgrade prisma to 6.19.3 (major version bump)

Recommended action:
1. This is a Prisma dev-tooling dependency, not used in production runtime
2. Evaluate prisma version upgrade when compatible
3. Low practical risk — `@hono/node-server` is not directly used by the application

### 7. Moderate: `qs` DoS on Null Entries (GHSA-q8mj-m7cp-5q26)

Dependency path:
- `qs` (indirect, 6.11.1–6.15.1)

Details:
- CVSS 5.3 — crashes with TypeError on null/undefined entries
- Fix available: upgrade to qs > 6.15.1

Recommended action:
1. Run `npm update qs` to get patched version
2. Verify with `npm audit` after update

---

## Prioritized Fix Order

1. **Source #2** — Remove PII from email logs (quick fix, no risk)
2. **Source #3** — Set restrictive permissions on email token cache (quick fix)
3. **Source #1** — Migrate admin auth from SHA-256 to bcrypt (requires env var migration)
4. **Dependency #7** — Update `qs` to patched version
5. **Dependency #4** — Evaluate replacing `xlsx` with `exceljs` for export feature
6. **Dependency #5, #6** — Monitor upstream releases for next/prisma updates

---

## Positive Security Observations

- **Session tokens** use HMAC-SHA256 with `timingSafeEqual` — cannot be forged without `AUTH_SECRET`
- **OAuth CSRF** protection via `oauth_state` cookie with 10-minute expiry, `httpOnly`, `sameSite: lax`
- **Authorization** — all admin server actions call `requireRole("ADMIN")` which re-verifies role from database (not just session token)
- **File ownership** — all file-serving API routes check `isAdmin || isOwner` before serving files
- **Path safety** — upload filenames are server-generated (UUIDs, timestamps), not user-controlled
- **SQL injection** — all database queries use Prisma ORM parameterized queries
- **Command injection** — OCR subprocess calls use `execFileSync` with array arguments (no shell interpretation)
- **Proxy** — route protection correctly handles URL encoding and case sensitivity

---

## Notes and Limits

- This is a static source code review and dependency audit — not a penetration test
- No dynamic testing or exploit validation was performed
- Runtime behavior was inferred from code analysis only
- Dependency findings are based on `npm audit` output as of 2026-05-28
- Findings excluded per review rules: rate limiting gaps, DEV env var bypasses (env vars are trusted), missing security headers (hardening), stateless token replay (mitigated by httpOnly + sameSite)
