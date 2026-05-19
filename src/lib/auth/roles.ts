export const ROLE_REDIRECT_PATHS: Record<"ADMIN" | "STUDENT", string> = {
  ADMIN: "/admin/dashboard",
  STUDENT: "/dashboard",
};

export function getRoleRedirectPath(role: "ADMIN" | "STUDENT") {
  return ROLE_REDIRECT_PATHS[role];
}

export function getSafePostLoginRedirectPath(
  role: "ADMIN" | "STUDENT",
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
