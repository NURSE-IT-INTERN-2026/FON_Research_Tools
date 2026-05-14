# Review Checklist

Use this checklist to keep the scan consistent across projects.

## Auth and Session

- Are cookies or tokens signed and verified?
- Does the app trust role, id, or email claims from the client without a server-side lookup?
- Are old session formats invalidated after auth changes?

## Authorization

- Do admin or privileged handlers verify role on the server?
- Do routes rely only on middleware or client navigation for access control?
- Are object-level ownership checks enforced for reads and writes?

## OAuth and Login Flows

- Do authorize and callback routes use `state` correctly?
- Is PKCE used when appropriate?
- Are login errors mapped safely without leaking secrets or raw upstream responses?

## Uploads and Storage

- Are MIME type, size, and ownership checks enforced server-side?
- Can file paths escape the intended upload root?
- Are delete and replace helpers safe against traversal through DB-backed paths?

## Public and Internal Endpoints

- Do health, cron, admin, and archive routes require the right authentication?
- Do internal-only endpoints expose stack traces, DB errors, or infrastructure detail?
- Are deployable routes reviewed even if there is no current UI caller?

## Logging and Secrets

- Do logs include tokens, headers, response bodies, PII, or internal identifiers unnecessarily?
- Are debug logs gated to non-production or feature-flagged?
- Are secrets or secret-derived values printed to logs?

## Abuse Controls

- Are login, upload, and create-account paths rate-limited?
- Are brute-force, spam, and resource exhaustion cases mitigated?
- Are repeated privileged actions throttled where needed?

## Injection and Rendering

- Is untrusted input passed into raw SQL, shell commands, or dynamic evaluation?
- Is user-controlled HTML rendered unsafely?
- Are redirects constrained to trusted destinations?

## Dependency Triage

- Is each advisory traced to a real dependency path?
- Is there a stable upgrade path now?
- If not, is there a local mitigation and should the item be marked `waiting-provider`?

## Coverage Honesty

- Are generated and vendored files separated from application-owned review counts?
- Does the report say whether the scan was targeted or full inventory-backed?
- Are limitations stated explicitly?