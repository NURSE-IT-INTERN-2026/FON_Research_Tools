import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getUserBasicInfo,
  determineRole,
  upsertUser,
} from "@/lib/auth/cmu-oauth";
import { createSession } from "@/lib/auth/session";
import { getRoleRedirectPath } from "@/lib/auth/roles";

const BASE = "/researchtool";

function redirectWithClearedState(
  request: NextRequest,
  path: string,
): NextResponse {
  const url = new URL(path, request.url);
  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return redirectWithClearedState(request, `${BASE}/login?error=oauth_error`);
  }

  if (!code) {
    return redirectWithClearedState(request, `${BASE}/login?error=oauth_error`);
  }

  // Validate state to prevent CSRF
  const storedState = request.cookies.get("oauth_state")?.value;
  if (!state || state !== storedState) {
    return redirectWithClearedState(
      request,
      `${BASE}/login?error=oauth_state_mismatch`,
    );
  }

  let accessToken: string;
  try {
    accessToken = await exchangeCodeForToken(code);
  } catch {
    return redirectWithClearedState(
      request,
      `${BASE}/login?error=oauth_token_failed`,
    );
  }

  let userInfo;
  try {
    userInfo = await getUserBasicInfo(accessToken);
  } catch {
    return redirectWithClearedState(
      request,
      `${BASE}/login?error=oauth_userinfo_failed`,
    );
  }

  const role = determineRole(userInfo.itaccount_type_id);
  if (!role) {
    return redirectWithClearedState(request, `${BASE}/unauthorized`);
  }

  const profile = await upsertUser(userInfo, role);

  await createSession({
    userId: profile.id,
    email: profile.email,
    role,
    name: profile.name,
  });

  return redirectWithClearedState(
    request,
    `${BASE}${getRoleRedirectPath(role)}`,
  );
}
