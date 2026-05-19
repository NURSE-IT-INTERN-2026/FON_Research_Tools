import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getUserBasicInfo,
  determineRole,
  upsertUser,
} from "@/lib/auth/cmu-oauth";
import { createSession } from "@/lib/auth/session";
import { getRoleRedirectPath } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=oauth_error`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=oauth_error`, request.url),
    );
  }

  let accessToken: string;
  try {
    accessToken = await exchangeCodeForToken(code);
  } catch {
    return NextResponse.redirect(
      new URL(`/login?error=oauth_token_failed`, request.url),
    );
  }

  let userInfo;
  try {
    userInfo = await getUserBasicInfo(accessToken);
  } catch {
    return NextResponse.redirect(
      new URL(`/login?error=oauth_userinfo_failed`, request.url),
    );
  }

  const role = determineRole(userInfo.itaccount_type_id);
  if (!role) {
    return NextResponse.redirect(
      new URL(`/login?error=not_allowed_faculty`, request.url),
    );
  }

  const profile = await upsertUser(userInfo, role);

  await createSession({
    userId: profile.id,
    email: profile.email,
    role,
    name: profile.name,
  });

  return NextResponse.redirect(
    new URL(getRoleRedirectPath(role), request.url),
  );
}
