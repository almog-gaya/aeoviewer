import { NextResponse } from "next/server";
import axios from "axios";
import { RedditOAuthToken } from "@/types/RedditSentiment";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const storedState = cookies().get("oauth_state")?.value;

  console.log("Received state:", state, "Stored state:", storedState); // Debug
  console.log("Code:", code); // Debug
  console.log("Redirect URI:", process.env.REDDIT_REDIRECT_URI); // Debug

  if (error) {
    console.error("Reddit error:", error);
    return NextResponse.redirect(`http://localhost:3000?error=${error}`);
  }

  if (state !== storedState) {
    console.error("State mismatch:", state, storedState);
    return NextResponse.redirect("http://localhost:3000?error=invalid_state");
  }

  try {
    const response = await axios.post<RedditOAuthToken>(
      "https://www.reddit.com/api/v1/access_token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code!,
        redirect_uri: process.env.REDDIT_REDIRECT_URI!,
      }).toString(),
      {
        auth: {
          username: process.env.REDDIT_CLIENT_ID!,
          password: process.env.REDDIT_CLIENT_SECRET!,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    console.log("Token response:", response.data); // Debug
    const redirect = NextResponse.redirect("http://localhost:3000");
    redirect.cookies.set("reddit_access_token", response.data.access_token, {
      httpOnly: true,
      maxAge: response.data.expires_in,
    });
    if (response.data.refresh_token) {
      redirect.cookies.set("reddit_refresh_token", response.data.refresh_token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
    return redirect;
  } catch (err: any) {
    console.error("Token exchange error:", err.response?.data || err.message);
    return NextResponse.redirect(`http://localhost:3000?error=token_exchange_failed: ${err.message}`);
  }
}