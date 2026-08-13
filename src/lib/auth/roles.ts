const AUTH_REDIRECT_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/researchtool";

export const ROLE_REDIRECT_PATHS: Record<"ADMIN" | "STUDENT", string> = {
  ADMIN: "/admin/dashboard",
  STUDENT: "/thesis",
};

export function getRoleRedirectPath(role: "ADMIN" | "STUDENT") {
  return ROLE_REDIRECT_PATHS[role];
}

export function getRoleRedirectUrl(role: "ADMIN" | "STUDENT") {
  return `${AUTH_REDIRECT_BASE}${getRoleRedirectPath(role)}`;
}
