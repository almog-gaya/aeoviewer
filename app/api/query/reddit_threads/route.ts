import { CompanyProfile } from "@/types/CompanyProfile";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Parse the request body
  const body = await req.json(); 
  const companyProfile: CompanyProfile = body;

  if (!companyProfile) {
      return NextResponse.json(
          { error: 'Company profile data is required' },
          { status: 400 }
      );
  } 

  // Mock data
  const threads = [
    {
      title: "How is Instagram changing social media marketing?",
      subreddit: "marketing",
      url: "https://reddit.com/r/marketing/1",
    },
    {
      title: "Instagram vs TikTok for brands in 2024?",
      subreddit: "socialmedia",
      url: "https://reddit.com/r/socialmedia/2",
    },
    {
      title: "Best tips for growing followers on Instagram?",
      subreddit: "Instagram",
      url: "https://reddit.com/r/Instagram/3",
    },
  ];

  return NextResponse.json({ threads });
}
