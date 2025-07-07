import { NextResponse } from "next/server";

export async function POST() {
  // Remove Reddit OAuth cookies
  const response = NextResponse.json({ success: true });
  response.cookies.set("reddit_access_token", "", { maxAge: 0 });
  response.cookies.set("reddit_refresh_token", "", { maxAge: 0 });
  return response;
}
