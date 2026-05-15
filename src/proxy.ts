import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session-token";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];
const ADMIN_PREFIX = "/admin";
const BORROWER_PREFIXES = ["/dashboard", "/my-bookings"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isAdmin = pathname.startsWith(ADMIN_PREFIX);
  const isBorrower = BORROWER_PREFIXES.some((p) => pathname.startsWith(p));

  if (session && isPublic) {
    const dest = session.role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isAdmin && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (session && isBorrower && session.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
