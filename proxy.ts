import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-token";

// basePath for redirect URLs (new URL() replaces entire pathname, so must include it)
const BASE = "/researchtool";

// Path matching uses paths WITHOUT basePath — Next.js proxy strips basePath from pathname
const PUBLIC_ROUTES = ["/", "/login", "/unauthorized", "/admin/login"];
const API_PUBLIC_ROUTES = ["/api/auth/callback"];
const ADMIN_PREFIX = "/admin";
const STUDENT_PREFIXES = ["/thesis"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isApiPublic = API_PUBLIC_ROUTES.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith(ADMIN_PREFIX);
  const isStudent = STUDENT_PREFIXES.some((p) => pathname.startsWith(p));

  if (isApiPublic) return NextResponse.next();

  if (session && isPublic) {
    const dest = session.role === "ADMIN" ? `${BASE}/admin/dashboard` : `${BASE}/thesis`;
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL(`${BASE}/login`, request.url));
  }

  if (session && isAdmin && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL(`${BASE}/thesis`, request.url));
  }

  if (session && isStudent && session.role === "ADMIN") {
    return NextResponse.redirect(new URL(`${BASE}/admin/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
