import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthUrl, isOAuthConfigured } from "@/lib/google-fit";

export const OAUTH_STATE_COOKIE = "gfit_oauth_state";

export async function GET(request: NextRequest) {
  if (!isOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/?error=oauth_not_configured", request.nextUrl.origin),
    );
  }

  const state = randomBytes(16).toString("hex");
  const authUrl = buildAuthUrl(request.nextUrl.origin, state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
