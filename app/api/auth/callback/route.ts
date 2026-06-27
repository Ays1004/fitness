import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  exchangeCodeForTokens,
} from "@/lib/google-fit";
import { OAUTH_STATE_COOKIE } from "../google/route";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/?error=${reason}`, origin));

  if (oauthError) return fail(oauthError);
  if (!code || !state || !storedState || state !== storedState) {
    return fail("invalid_state");
  }

  try {
    const tokens = await exchangeCodeForTokens(code, origin);
    const secure = process.env.NODE_ENV === "production";

    const response = NextResponse.redirect(new URL("/?connected=1", origin));
    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: tokens.expires_in ?? 3600,
    });
    if (tokens.refresh_token) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("OAuth callback failed:", error);
    return fail("token_exchange_failed");
  }
}
