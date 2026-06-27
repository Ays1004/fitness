import { NextResponse, type NextRequest } from "next/server";
import { getAnalytics } from "@/lib/server-data";

export async function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get("days");
  const analytics = await getAnalytics(Number(days));
  return NextResponse.json(analytics, {
    headers: { "Cache-Control": "no-store" },
  });
}
