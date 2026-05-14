# Report Template

Use this structure when producing a reusable security review report.

```md
# Security Review Report

Date reviewed: YYYY-MM-DD

Scope reviewed:
- app source paths
- auth or middleware entry points
- dependency manifests and lockfile when relevant
- audit outputs used

Method:
- source inspection focus areas
- dependency audit commands run
- inventory method

Coverage summary:
- total files reviewed in scope
- application-owned files
- test files
- generated files
- vendored files

Coverage notes:
- what was manually reviewed
- what was pattern-scanned only

## Executive Summary

Short summary of the highest-risk issues, newly discovered issues, and dependency state.

## Findings Table

| # | Category | Finding | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | Source code | Example finding | High | fix-now | Short note |
| 2 | Dependency | Example upstream finding | Moderate | waiting-provider | Waiting on stable upstream patch |

Status legend:
- `fix-now`: team can remediate or mitigate directly
- `waiting-provider`: stable fix depends on upstream or provider release timing

## Source Findings

### 1. Severity: Title

Evidence:
- file paths and behaviors

Impact:
- practical risk

Remediation:
1. concrete fix
2. follow-up validation

## Dependency Findings

### 1. Severity: Package chain or advisory

Dependency path:
- package -> dependency -> vulnerable package

Details:
- advisory identifier
- current version state

Recommended action:
1. upgrade or mitigation
2. validation command

## Prioritized Fix Order

1. highest-risk application issue
2. next application issue
3. dependency upgrade with clear path
4. mitigations for waiting-provider items

## Notes and Limits

- what the scan covered
- what it did not claim, such as penetration testing or exploit validation
```