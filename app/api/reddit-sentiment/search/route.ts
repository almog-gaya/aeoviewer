import { NextRequest, NextResponse } from "next/server";
import { RedditSearchParams, RedditSearchResult, RedditMention, RedditAPIResponse } from "@/types/RedditSentiment";
import { cookies } from "next/headers";

interface RedditSearchBody {
  query?: string; // Made optional since not needed when using file URLs
  subreddit?: string;
  timeFilter?: 'week' | 'month' | 'year' | 'all';
  limit?: number;
  sort?: 'relevance' | 'top' | 'new' | 'comments';
  searchStrategy?: 'basic' | 'withContext' | 'quoted' | 'quotedWithContext' | 'businessContext';
  industryContext?: string;
  useFileURLs?: boolean; // Flag to indicate using URLs from file
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = cookies().get("reddit_access_token")?.value;
    const body: RedditSearchBody = await req.json();

    let searchResult: RedditSearchResult;

    if (body.useFileURLs) {
      // Load URLs from file if flag is set
      const urls = loadURLsFromFile();
      if (!urls || urls.length === 0) {
        return NextResponse.json(
          { error: 'No URLs found in file' },
          { status: 400 }
        );
      }
      console.log(`🔍 Processing ${urls.length} URLs from file`);

      // Process URLs directly
      searchResult = await searchRedditMentions({ urls }, accessToken);
    } else {
      // Existing logic for search query
      if (!body.query || body.query.trim() === '') {
        return NextResponse.json(
          { error: 'Search query is required when useFileURLs is not set' },
          { status: 400 }
        );
      }

      const originalQuery = body.query.trim();
      const searchStrategy = body.searchStrategy || 'withContext';
      const industryContext = body.industryContext?.trim() || '';
      let enhancedQuery = originalQuery;
      
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

      const searchParams: RedditSearchParams = {
        query: enhancedQuery,
        subreddit: body.subreddit,
        timeFilter: body.timeFilter || 'week',
        limit: Math.min(body.limit || 500, 500),
        sort: body.sort || 'relevance'
      };

      console.log(`🔍 Searching Reddit for: "${originalQuery}"`);
      if (industryContext) {
        console.log(`🏭 Industry context: "${industryContext}"`);
      }
      console.log(`🎯 Enhanced query (${searchStrategy}): "${enhancedQuery}"`);
      console.log(`📊 Parameters:`, searchParams);

      searchResult = await searchRedditMentions(searchParams, accessToken);
    }

    return NextResponse.json(searchResult);
    
  } catch (error: any) {
    console.error('❌ Reddit search API error:', error);
    return NextResponse.json(
      { error: 'Failed to process Reddit mentions', details: error.message },
      { status: 500 }
    );
  }
}

async function searchRedditMentions(params: RedditSearchParams & { urls?: string[] }, accessToken?: string): Promise<RedditSearchResult> {
  let totalFound = 0;
  let successfullyFetched = 0;
  let failedFetches = 0;
  const mentions: RedditMention[] = [];

  try {
    if (params.urls && params.urls.length > 0) {
      // Process provided URLs directly
      totalFound = params.urls.length;
      console.log(`📊 Processing ${totalFound} provided URLs`);

      const MAX_PER_MINUTE = 100;
      const STAGGER_MS = 600;

      const fetchPromises = params.urls.map((url, i) => { 
        const permalink = new URL(url).pathname;
        const batch = Math.floor(i / MAX_PER_MINUTE);
        const indexInBatch = i % MAX_PER_MINUTE;
        const delay = batch * 60000 + indexInBatch * STAGGER_MS;

        return new Promise<RedditMention | null>(async (resolve) => {
          await new Promise(r => setTimeout(r, delay));
          try {
            console.log(`📝 Fetching thread: ${url}`);
            const threadContent = await fetchRedditThreadContent(permalink, accessToken);
            if (threadContent) {
              successfullyFetched++;
              resolve(threadContent);
            } else {
              failedFetches++;
              resolve(null);
            }
          } catch (error) {
            console.error(`❌ Failed to fetch thread: ${url}`, error);
            failedFetches++;
            resolve(null);
          }
        });
      });

      const results = await Promise.all(fetchPromises);
      for (const mention of results) {
        if (mention) mentions.push(mention);
      }
    } else {
      // Existing search logic
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

      const MAX_PER_MINUTE = 100;
      const STAGGER_MS = 600;
      const fetchPromises = posts.map((child, i) => {
        const postData = child.data;
        const batch = Math.floor(i / MAX_PER_MINUTE);
        const indexInBatch = i % MAX_PER_MINUTE;
        const delay = batch * 60000 + indexInBatch * STAGGER_MS;
        return new Promise<RedditMention | null>(async (resolve) => {
          await new Promise(r => setTimeout(r, delay));
          try {
            console.log(`📝 Fetching thread: https://www.reddit.com${postData.permalink}`);
            if (postData.subreddit_type === 'private' || postData.subreddit_type === 'restricted') {
              console.log(`⏭️ Skipping private/restricted subreddit: ${postData.subreddit}`);
              failedFetches++;
              resolve(null);
              return;
            }
            const threadContent = await fetchRedditThreadContent(postData.permalink, accessToken);
            if (threadContent) {
              successfullyFetched++;
              resolve(threadContent);
            } else {
              failedFetches++;
              resolve(null);
            }
          } catch (error) {
            console.error(`❌ Failed to fetch thread: https://www.reddit.com${postData.permalink}`, error);
            failedFetches++;
            resolve(null);
          }
        });
      });

      const results = await Promise.all(fetchPromises);
      for (const mention of results) {
        if (mention) mentions.push(mention);
      }
    }

    console.log(`✅ Successfully fetched ${successfullyFetched} threads, ${failedFetches} failed`);

    const filteredMentions = filterRelevantMentions(mentions, params.query || '');
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
    limit: Math.min(params.limit, 100).toString(),
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
    
    const post = data[0]?.data?.children?.[0]?.data;
    const comments = data[1]?.data?.children || [];
    
    if (!post) {
      return null;
    }

    const extractedComments = extractComments(comments, 0, 3);
    
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

function loadURLsFromFile(): string[] {
  const urls = [
        "https://www.reddit.com/r/Mocktails/comments/1lqabb0/those_who_drink_thc_mocktails_did_you_have_the/",
        "https://www.reddit.com/r/TwinCities/comments/1lokr58/cheapest_thc_drinks_in_town/",
        "https://www.reddit.com/r/milwaukee/comments/1febvnj/thc_drinks_at_bars/",
        "https://www.reddit.com/r/vegastrees/comments/1hcrhgu/thc_drinks_in_vegas/",
        "https://www.reddit.com/r/TwinCities/comments/18lecd5/looking_for_a_restaurant_that_serves_thc_or_cbd/",
        "https://www.reddit.com/r/milwaukee/comments/16l4x1l/where_to_buy_thc_beverages/",
        "https://www.reddit.com/r/blankies/comments/1e5wlhq/gigli_weed_drinks/"
    ]
  return urls;
}