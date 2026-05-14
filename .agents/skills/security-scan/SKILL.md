---
name: project-security-scan
description: 'Scan a web application repository for source-code security issues and dependency vulnerabilities. Use when reviewing auth and session design, authorization checks, OAuth state or CSRF, upload or storage paths, exposed health or cron endpoints, sensitive logging, rate limiting, or npm audit findings, and when producing a reusable security review report with fix-now versus waiting-provider classifications.'
argument-hint: 'Repo stack, scan scope, and desired report file or language'
user-invocable: true
---

# Project Security Scan

Use this skill for repeatable security review work on application repositories, especially when the task asks for a source scan, dependency audit triage, or a written security report.

## What This Skill Covers

- Static review of application-owned source code
- Coverage inventory for app-owned, test, generated, and vendored files
- Review of auth, session, middleware, API, server actions, uploads, storage, health endpoints, cron endpoints, and logging
- Dependency vulnerability triage for npm-based projects
- Report writing with clear remediation status per item

## When to Use

Use this skill when the task mentions any of these terms or behaviors:

- security scan
- security review
- source-code security issues
- npm audit
- auth bypass
- session forgery
- missing role check
- OAuth state or CSRF
- path traversal
- sensitive logging
- health endpoint exposure
- rate limiting gaps
- security-review.md

## Primary References

Read these when you need the reusable checklist or report shape:

- [Review checklist](./references/review-checklist.md)
- [Report template](./references/report-template.md)

## Procedure

1. Confirm scope and output before making claims.
   Capture the requested scan surface, report filename, report language, and whether the user wants a targeted review or a full inventory-backed scan.

2. Inventory the repository first.
   Classify files at minimum into:
   - application-owned code
   - tests
   - generated code
   - vendored or checked-in third-party code
   If the repository is large, perform manual content review on application-owned code first and pattern-scan generated or vendored files unless the task explicitly requires more.

3. Start from the highest-risk control points.
   Read the owning implementations first rather than mapping the whole repo:
   - session or auth helpers
   - middleware
   - privileged routes and server actions
   - OAuth authorize and callback handlers
   - upload and storage helpers
   - health, cron, and internal-only endpoints
   - DB helpers and logging utilities

4. Use narrow, falsifiable hypotheses while scanning.
   For each risky slice, name one concrete hypothesis and one cheap check that could disconfirm it before expanding scope.
   Example hypotheses:
   - session cookies are unsigned and trusted for role checks
   - admin mutations do not enforce server-side authorization
   - OAuth flows are missing state validation
   - file-delete helpers can escape the upload root

5. Scan for recurring issue classes.
   Use [Review checklist](./references/review-checklist.md) rather than inventing a new taxonomy each time.

6. Triage dependencies with evidence, not just audit output.
   For npm projects:
   - run `npm audit --json`
   - run `npm audit --omit=dev --json`
   - run `npm audit`
   - trace flagged packages with `npm ls <package>`
   - inspect latest published versions with `npm view <package> version` when the fix path is unclear
   For other JS package managers, use the equivalent audit flow but keep the same reasoning standard.

7. Classify each confirmed issue by who can fix it.
   Use one of these states in the report table:
   - `fix-now`: the application team can remediate or mitigate directly now
   - `waiting-provider`: a stable fix depends on upstream or provider release timing
   Do not mark an issue as `waiting-provider` if the team can still reduce exposure locally.

8. Write the report with explicit coverage and limits.
   Use [Report template](./references/report-template.md) and include:
   - date, scope, and method
   - coverage counts
   - summary table of all findings
   - detailed findings with evidence, impact, and remediation
   - dependency section separated from source findings
   - prioritized remediation order
   - limitations or non-claims

9. Validate before finishing.
   - If only the report changed, validate by diff.
   - If code changed, run the narrowest executable check available first.
   - Do not claim exploitability or penetration-test coverage unless it was actually verified.

## Decision Rules

- If the starting file only wires or forwards, step to the code that actually decides access or mutates data.
- If `rg` is unavailable, switch to the fastest local alternative and note the substitution.
- If a route is deployable but has no current UI call site, still report it if it is reachable and underprotected.
- If generated or vendored files dominate the repository, separate them in coverage so the scan remains honest.
- If audit suggests a downgrade or suspicious upgrade path, verify the package registry state before recommending it.

## Quality Checks

The work is complete only when these are still true:

- coverage scope is explicit
- each finding includes evidence, impact, and realistic remediation
- source issues and dependency issues are clearly separated
- items waiting on upstream are labeled as such
- the report does not overclaim dynamic testing or exploit validation
- unrelated repository changes were left untouched

## Output Expectations

When using this skill, finish with:

- a short summary of what was scanned
- a report file, usually `security-review.md`
- a summary table listing all findings and their current status
- the narrowest validation result available