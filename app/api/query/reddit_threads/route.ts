import { CompanyProfile } from "@/types/CompanyProfile";
import { NextRequest, NextResponse } from "next/server";
import { llmProviders } from '@/lib/OpenAIProvider';
import { RedditThread } from "@/types/RedditThread";
import { generateRedditThreads } from "@/lib/prompts";
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

  // // Mock data
  // const threads = [
  //   {
  //     title: "How is Instagram changing social media marketing?",
  //     subreddit: "marketing",
  //     url: "https://reddit.com/r/marketing/1",
  //   },
  //   {
  //     title: "Instagram vs TikTok for brands in 2024?",
  //     subreddit: "socialmedia",
  //     url: "https://reddit.com/r/socialmedia/2",
  //   },
  //   {
  //     title: "Best tips for growing followers on Instagram?",
  //     subreddit: "Instagram",
  //     url: "https://reddit.com/r/Instagram/3",
  //   },
  // ];

  const promptSample = generateRedditThreads(companyProfile);
  const resp = await llmProviders.chatgpt.generateRedditThreads(companyProfile);
  if (!resp || !Array.isArray(resp)) {
    return NextResponse.json(
      { error: 'Failed to generate Reddit threads' },
      { status: 500 }
    );
  }
  const threads: RedditThread[] = resp.map(thread => ({
    title: thread.title,
    subreddit: thread.subreddit,
    url: thread.url,
  }));

  return NextResponse.json({ threads, prompt:promptSample });
}
