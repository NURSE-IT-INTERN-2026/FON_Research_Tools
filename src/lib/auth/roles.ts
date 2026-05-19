export const ROLE_REDIRECT_PATHS: Record<"ADMIN" | "STUDENT", string> = {
  ADMIN: "/admin/dashboard",
  STUDENT: "/thesis",
};

export function getRoleRedirectPath(role: "ADMIN" | "STUDENT") {
  return ROLE_REDIRECT_PATHS[role];
}
