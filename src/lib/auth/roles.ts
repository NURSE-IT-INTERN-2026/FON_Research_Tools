export const ROLE_REDIRECT_PATHS: Record<"ADMIN" | "BORROWER", string> = {
  ADMIN: "/admin/dashboard",
  BORROWER: "/dashboard",
};

export function getRoleRedirectPath(role: "ADMIN" | "BORROWER") {
  return ROLE_REDIRECT_PATHS[role];
}

export function getSafePostLoginRedirectPath(
  role: "ADMIN" | "BORROWER",
  nextPath: string | null | undefined,
) {
  const fallbackPath = getRoleRedirectPath(role);

  if (
    nextPath &&
    nextPath.startsWith("/") &&
    !nextPath.startsWith("//") &&
    !nextPath.startsWith(`/${role === "ADMIN" ? "admin" : ""}`)
  ) {
    return nextPath;
  }

  return fallbackPath;
}
