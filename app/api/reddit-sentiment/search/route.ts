import { NextRequest, NextResponse } from "next/server";
import { RedditSearchParams, RedditSearchResult, RedditMention, RedditAPIResponse } from "@/types/RedditSentiment";
import { cookies } from "next/headers";

interface RedditSearchBody {
  query: string;
  subreddit?: string;
  timeFilter?: 'week' | 'month' | 'year' | 'all';
  limit?: number;
  sort?: 'relevance' | 'top' | 'new' | 'comments';
  searchStrategy?: 'basic' | 'withContext' | 'quoted' | 'quotedWithContext' | 'businessContext';
  industryContext?: string;
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = cookies().get("reddit_access_token")?.value;
    const body: RedditSearchBody = await req.json();
    
    if (!body.query || body.query.trim() === '') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Enhance query based on strategy for better relevance
    const originalQuery = body.query.trim();
    const searchStrategy = body.searchStrategy || 'withContext';
    const industryContext = body.industryContext?.trim() || '';
    let enhancedQuery = originalQuery;
    
    // Build context terms
    let contextTerms = '';
    const baseBusinessTerms = 'company OR business OR brand OR product OR service';
    const enterpriseTerms = 'company OR business OR enterprise OR brand OR startup OR corporation';
    
    switch (searchStrategy) {
      case 'withContext':
        contextTerms = industryContext 
          ? `(${baseBusinessTerms} OR ${industryContext})`
          : `(${baseBusinessTerms})`;
        enhancedQuery = `${originalQuery} ${contextTerms}`;
        break;
      case 'businessContext':
        contextTerms = industryContext 
          ? `(${enterpriseTerms} OR ${industryContext})`
          : `(${enterpriseTerms})`;
        enhancedQuery = `${originalQuery} ${contextTerms}`;
        break;
      case 'quoted':
        enhancedQuery = `"${originalQuery}"`;
        break;
      case 'quotedWithContext':
        contextTerms = industryContext 
          ? `(company OR business OR brand OR product OR ${industryContext})`
          : '(company OR business OR brand OR product)';
        enhancedQuery = `"${originalQuery}" ${contextTerms}`;
        break;
      case 'basic':
      default:
        enhancedQuery = originalQuery;
        break;
    }

    // Set up search parameters with defaults
    const searchParams: RedditSearchParams = {
      query: enhancedQuery,
      subreddit: body.subreddit,
      timeFilter: body.timeFilter || 'week',
      limit: Math.min(body.limit || 500, 500), // Max 500 mentions
      sort: body.sort || 'relevance'
    };

    console.log(`🔍 Searching Reddit for: "${originalQuery}"`);
    if (industryContext) {
      console.log(`🏭 Industry context: "${industryContext}"`);
    }
    console.log(`🎯 Enhanced query (${searchStrategy}): "${enhancedQuery}"`);
    console.log(`📊 Parameters:`, searchParams);

    const searchResult = await searchRedditMentions(searchParams, accessToken);

    return NextResponse.json(searchResult);
    
  } catch (error: any) {
    console.error('❌ Reddit search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search Reddit mentions', details: error.message },
      { status: 500 }
    );
  }
}

async function searchRedditMentions(params: RedditSearchParams, accessToken?: string): Promise<RedditSearchResult> {
  const mentions: RedditMention[] = [];
  let totalFound = 0;
  let successfullyFetched = 0;
  let failedFetches = 0;

  try {
    const searchUrl = buildRedditSearchUrl(params, !!accessToken);
    console.log(`🌐 Fetching from: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'web:AEO-Viewer-Bot:1.0 (by /u/your_reddit_username)',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      }
    });

    console.log("Rate limit remaining:", response.headers.get("x-ratelimit-remaining"));
    console.log("Rate limit reset:", response.headers.get("x-ratelimit-reset"));

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}: ${response.statusText}`);
    }

    const data: RedditAPIResponse = await response.json();
    totalFound = data.data.dist || 0;

    console.log(`📊 Found ${totalFound} posts, processing up to ${params.limit}...`);

    const posts = data.data.children.slice(0, params.limit);
    
    for (const child of posts) {
      const postData = child.data;
      try {
        
        console.log(`📝 Fetching thread: https://www.reddit.com${postData.permalink}`);
        
        // Skip private or restricted subreddits
        if (postData.subreddit_type === 'private' || postData.subreddit_type === 'restricted') {
          console.log(`⏭️ Skipping private/restricted subreddit: ${postData.subreddit}`);
          failedFetches++;
          continue;
        }

        const threadContent = await fetchRedditThreadContent(
          postData.permalink,
          accessToken
        );
        
        if (threadContent) {
          mentions.push(threadContent);
          successfullyFetched++;
        } else {
          failedFetches++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay
      } catch (error) {
        console.error(`❌ Failed to fetch thread: https://www.reddit.com${postData.permalink}`, error);
        failedFetches++;
      }
    }

    console.log(`✅ Successfully fetched ${successfullyFetched} threads, ${failedFetches} failed`);

    const filteredMentions = filterRelevantMentions(mentions, params.query);
    const filteredCount = mentions.length - filteredMentions.length;
    
    if (filteredCount > 0) {
      console.log(`🔍 Filtered out ${filteredCount} irrelevant mentions`);
    }

    return {
      mentions: filteredMentions,
      totalFound,
      searchParams: params,
      searchDate: new Date(),
      processingStats: {
        successfullyFetched,
        failedFetches,
        totalAnalyzed: filteredMentions.length,
        filteredOut: filteredCount
      }
    };
  } catch (error: any) {
    console.error('❌ Reddit search failed:', error);
    throw new Error(`Reddit search failed: ${error.message}`);
  }
}

function buildRedditSearchUrl(params: RedditSearchParams, useOAuth: boolean): string {
  const baseUrl = useOAuth ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const searchPath = params.subreddit ? `/r/${params.subreddit}/search` : '/search';
  
  const urlParams = new URLSearchParams({
    q: params.query,
    sort: params.sort,
    t: params.timeFilter,
    limit: Math.min(params.limit, 100).toString(), // Reddit API limit per request
    type: 'link',
    restrict_sr: params.subreddit ? 'true' : 'false'
  });

  return `${baseUrl}${searchPath}.json?${urlParams.toString()}`;
}

async function fetchRedditThreadContent(permalink: string, accessToken?: string): Promise<RedditMention | null> {
  try {
    const baseUrl = accessToken ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
    const response = await fetch(`${baseUrl}${permalink}.json`, {
      headers: {
        'User-Agent': 'web:AEO-Viewer-Bot:1.0 (by /u/your_reddit_username)',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Extract post data
    const post = data[0]?.data?.children?.[0]?.data;
    const comments = data[1]?.data?.children || [];
    
    if (!post) {
      return null;
    }

    // Extract comments with depth limit
    const extractedComments = extractComments(comments, 0, 3);
    
    // Calculate total word count
    const allText = [
      post.title || '',
      post.selftext || '',
      ...extractedComments.map(c => c.body)
    ].join(' ');
    
    const wordCount = allText.split(/\s+/).filter(word => word.length > 0).length;

    const mention: RedditMention = {
      id: post.id,
      title: post.title || '',
      selftext: post.selftext || '',
      subreddit: post.subreddit || '',
      url: `https://www.reddit.com${permalink}`,
      author: post.author || '[deleted]',
      score: post.ups || 0,
      numComments: post.num_comments || 0,
      created: new Date(post.created_utc * 1000),
      comments: extractedComments,
      wordCount
    };

    return mention;
    
  } catch (error) {
    console.error(`❌ Failed to fetch thread content from ${permalink}:`, error);
    return null;
  }
}

function extractComments(comments: any[], depth: number = 0, maxDepth: number = 3): any[] {
  const result: any[] = [];
  
  for (const comment of comments) {
    const commentData = comment.data;
    
    if (commentData && commentData.body && 
        commentData.body !== '[deleted]' && 
        commentData.body !== '[removed]') {
      
      result.push({
        body: commentData.body,
        author: commentData.author || '[deleted]',
        score: commentData.ups || 0,
        created: new Date(commentData.created_utc * 1000),
        depth: depth
      });
      
      // Recursively extract replies (limit depth)
      if (depth < maxDepth && commentData.replies && commentData.replies.data) {
        const replies = extractComments(commentData.replies.data.children, depth + 1, maxDepth);
        result.push(...replies);
      }
    }
  }
  
  return result;
}

function filterRelevantMentions(mentions: RedditMention[], originalQuery: string): RedditMention[] {
  const relevantKeywords = [
    'company', 'business', 'brand', 'product', 'service', 'startup', 'enterprise',
    'corporation', 'vendor', 'client', 'customer', 'market', 'industry', 'sales',
    'marketing', 'review', 'experience', 'quality', 'price', 'cost', 'buy', 'purchase'
  ];

  const relevantSubreddits = [
    'business', 'entrepreneur', 'startup', 'smallbusiness', 'marketing', 'sales',
    'reviews', 'buyitforlife', 'frugal', 'personalfinance', 'investing'
  ];

  const definitelyIrrelevantKeywords = [
    'whale', 'ocean', 'marine', 'animal', 'species', 'wildlife', 'sea', 'mammal', 
    'pod', 'killer whale', 'dolphin', 'shark'
  ];

  return mentions.filter(mention => {
    const combinedText = `${mention.title} ${mention.selftext} ${mention.comments.map(c => c.body).join(' ')}`.toLowerCase();
    const subreddit = mention.subreddit.toLowerCase();
    
    const isRelevantSubreddit = relevantSubreddits.some(rel => 
      subreddit.includes(rel)
    );
    
    const hasRelevantKeywords = relevantKeywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    const hasDefinitelyIrrelevantKeywords = definitelyIrrelevantKeywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    if (hasDefinitelyIrrelevantKeywords && !hasRelevantKeywords && !isRelevantSubreddit) {
      return false;
    }
    
    if (isRelevantSubreddit || hasRelevantKeywords) {
      return true;
    }
    
    if (combinedText.length < 200) {
      return true;
    }
    
    return true;
  });
}