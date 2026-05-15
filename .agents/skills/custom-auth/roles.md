# RBAC — Role-Based Access Control

## Implementation

```typescript
import type { UserRole } from "@prisma/client";

export const ROLE_REDIRECT_PATHS: Record<UserRole, string> = {
  super_admin: "/admins",
  admin: "/dashboard",
  student: "/overview",
};

const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  super_admin: ["/admins", "/account/name", "/account/password"],
  admin: [
    "/dashboard",
    "/admin/students",
    "/notifications",
    "/activity-logs",
    "/account/name",
    "/account/password",
  ],
  student: ["/tos", "/overview", "/form", "/account/password"],
};

type AuthenticatedRedirectInput = {
  role: UserRole;
  studentHasAcceptedTos?: boolean;
};

export function getRoleRedirectPath(role: UserRole) {
  return ROLE_REDIRECT_PATHS[role];
}

export function getAuthenticatedRedirectPath(
  input: AuthenticatedRedirectInput,
) {
  if (input.role === "student" && !input.studentHasAcceptedTos) {
    return "/tos";
  }
  return getRoleRedirectPath(input.role);
}

export function getSafePostLoginRedirectPath(
  input: AuthenticatedRedirectInput,
  nextPath: string | null | undefined,
) {
  const fallbackPath = getAuthenticatedRedirectPath(input);

  if (input.role === "student" && !input.studentHasAcceptedTos) {
    return fallbackPath;
  }

  if (
    !nextPath ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//")
  ) {
    return fallbackPath;
  }

  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[input.role];

  if (allowedPrefixes.some((prefix) => nextPath.startsWith(prefix))) {
    return nextPath;
  }

  return fallbackPath;
}
```

## How to Customize for New Projects

1. **Define your roles** in Prisma schema enum
2. **Set `ROLE_REDIRECT_PATHS`** — where each role lands after login
3. **Set `ROLE_ALLOWED_PREFIXES`** — which URL paths each role can access
4. **Add role-specific conditions** (like TOS acceptance) in redirect functions

## Key Points

- **Whitelist approach** — Only explicitly allowed paths pass through
- **Safe redirect** — `getSafePostLoginRedirectPath` validates `next` param
- **No `//` or relative paths** — Prevents open redirect attacks
- **Fallback always defined** — If path not allowed, go to role default
