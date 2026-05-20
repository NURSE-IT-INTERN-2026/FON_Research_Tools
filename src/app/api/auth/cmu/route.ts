import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAuthorizationUrl } from "@/lib/auth/cmu-oauth";

export async function GET() {
  const state = randomUUID();
  const authorizeUrl = getAuthorizationUrl(state);

  const response = NextResponse.redirect(authorizeUrl);

  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
