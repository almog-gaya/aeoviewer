import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const state = uuidv4();
  const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID}&response_type=code&state=${state}&redirect_uri=${process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI}&duration=permanent&scope=identity read`;

  // Store state in a cookie for verification
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("oauth_state", state, { httpOnly: true, maxAge: 600 });
  return response;
}