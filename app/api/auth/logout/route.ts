import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/google-fit";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}
