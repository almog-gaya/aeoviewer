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
    "https://www.reddit.com/r/scholarships/comments/1ig7oyt/has_anyone_won_a_scholarship_using_scholarship_owl/",
    "https://www.reddit.com/r/college/comments/adnkdt/is_scholarship_owl_legit/",
    "https://www.reddit.com/r/scholarships/comments/19arwa4/anyone_use_the_payed_version_of_scholarship_owl/",
    "https://www.reddit.com/r/ApplyingToCollege/comments/1lq7iwy/is_scholarshipowl_worth_it/",
    "https://www.reddit.com/r/scholarships/comments/18ylj6g/is_scholarship_owl_legit/",
    "https://www.reddit.com/r/scholarships/comments/1iset1p/do_not_use_scholarshipowl/",
    "https://www.reddit.com/r/scholarships/comments/1bhtvp3/scholarship_owl/",
    "https://www.reddit.com/r/scholarships/comments/cwzlok/is_scholarshipowl_worth_paying_for/",
    "https://www.reddit.com/r/scholarships/comments/7yav2b/anyone_with_experience_with_scholarshipowlcom/",
    "https://www.reddit.com/r/ScholarshipOwl/comments/1ig7lpo/has_anyone_won_any_scholarships/",
    "https://www.reddit.com/r/scholarships/comments/1lti24z/need_help/",
    "https://www.reddit.com/r/scholarships/comments/1lphczw/scholarshipowl_forcing_me_to_pay/",
    "https://www.reddit.com/r/scholarships/comments/1gd3dop/scholarship_owl_and_niche/",
    "https://www.reddit.com/r/scholarships/comments/1lomg28/scholarship_owl_refund/",
    "https://www.reddit.com/r/scholarships/comments/1eokecl/ahhhh/",
    "https://www.reddit.com/r/scholarships/comments/1lnxhmy/scholarships/",
    "https://www.reddit.com/r/scholarships/comments/1kfq2vo/scholarship_owl/",
    "https://www.reddit.com/r/scholarships/comments/1ef852m/what_websites_do_you_use_for_scholarships/",
    "https://www.reddit.com/r/scholarships/comments/1lk5mhf/what_are_websites_you_used/",
    "https://www.reddit.com/r/scholarships/comments/1kvgcux/where_to_find_legit_scholarships/",
    "https://www.reddit.com/r/scholarships/comments/1lrv842/best_place_to_find_scholarships/",
    "https://www.reddit.com/r/scholarships/comments/1hvrk9q/scholarship_websites/",
    "https://www.reddit.com/r/scholarships/comments/1lr3t0i/does_anyone_small_scholarships_with_applications/",
    "https://www.reddit.com/r/scholarships/comments/1kwywkc/applying_for_100_scholarships/",
    "https://www.reddit.com/r/scholarships/comments/1jws1k4/scholarship_website_suggestions_please/",
    "https://www.reddit.com/r/MBA_Grad_StarterPack/comments/1kxhlre/scholarshipowl_a_paid_platform_that_matches_you/",
    "https://www.reddit.com/r/scholarships/comments/1k1l46v/best_way_to_find_scholarships_to_apply_to/",
    "https://www.reddit.com/r/scholarships/comments/1kiuqxm/grad_school_scholarships/",
    "https://www.reddit.com/r/scholarships/comments/1lw29gt/urgent_need_scholarships_asap_due_to_last_minute/",
    "https://www.reddit.com/r/scholarships/comments/1ixi2cg/where_can_i_found_unclaimed_scholarship_in_the/",
    "https://www.reddit.com/r/outofcontextcomics/comments/1lb5lbd/that_escalated_quickly/mxr3n4p/",
    "https://www.reddit.com/r/scholarships/comments/1lnxhmy/comment/n0iyi3z/",
    "https://www.reddit.com/r/scholarships/comments/1lgauvv/best_scholarship_websites/myvjn6f/",
    "https://www.reddit.com/r/scholarships/comments/1lk5mhf/comment/mzpgdxh/",
    "https://www.reddit.com/r/childfree/comments/1kmimfc/comment/msb279e/",
    "https://www.reddit.com/r/scholarships/comments/1lq8y7f/comment/n1178b1/",
    "https://www.reddit.com/r/scholarships/comments/1lpy4nk/comment/n10c3hj/",
    "https://www.reddit.com/r/scholarships/comments/1lrv842/comment/n1e2wan/",
    "https://www.reddit.com/r/UGCNETEnglish/comments/1lsuc8g/does_anyone_have_this_book_or_any_online_pdf_link/n1xbei2/",
    "https://www.reddit.com/r/scholarships/comments/1lr7y87/how_to_find_scholarships/n18su3m/",
    "https://www.reddit.com/r/scholarships/comments/1lti24z/need_help/n1qvi34/",
    "https://www.reddit.com/r/scholarships/comments/1lphczw/comment/n10wraw/",
    "https://www.reddit.com/r/scholarships/comments/1l2wz7c/comment/mvy22lr/",
    "https://www.reddit.com/r/scholarships/comments/1lw29gt/comment/n2cqpoc/",
    "https://www.reddit.com/r/NZCFL/comments/1loer9o/comment/n1kr77o/",
    "https://www.reddit.com/r/scholarships/comments/1ktoz5s/comment/mtvgmf2/",
    "https://www.reddit.com/r/scholarships/comments/1kp3oo5/comment/msvn3uq/",
    "https://www.reddit.com/r/StrixhavenDMs/comments/1lel6e8/comment/mytqztm/",
    "https://www.reddit.com/r/scholarships/comments/1l17qrh/comment/mvjadf7/",
    "https://www.reddit.com/r/scholarships/comments/1l8u9sr/any_scholarships_for_transfer_students/mx7vp03/",
    "https://www.reddit.com/r/scholarships/comments/1lr3t0i/does_anyone_small_scholarships_with_applications/n17thcf/",
    "https://www.reddit.com/r/scholarships/comments/1lqhoxc/comment/n17q2qf/",
    "https://www.reddit.com/r/ADHDUK/comments/1l6x09a/comment/mwstx8e/",
    "https://www.reddit.com/r/scholarships/comments/1kwywkc/comment/muq6tdz/",
    "https://www.reddit.com/r/scholarships/comments/1l4aru0/scholarships_that_need_essays/",
    "https://www.reddit.com/r/highschool/comments/1leis1a/comment/mykrs7b/",
    "https://www.reddit.com/r/TheBatmanFilm/comments/1lakw0f/reeves_batman_movies_wont_have_court_of_owls_or/mxo9mzt/",
    "https://www.reddit.com/r/scholarships/comments/1kqrkp2/comment/mt85mh4/",
    "https://www.reddit.com/r/scholarships/comments/1kcl31z/good_ways_to_find_scholarships/",
    "https://www.reddit.com/r/scholarships/comments/1l5uvmr/need_help_finding_scholarships/mwof4tc/",
    "https://www.reddit.com/r/scholarships/comments/1ktvbrz/comment/mtxck9x/",
    "https://www.reddit.com/r/scholarships/comments/1jws1k4/comment/mmktsv0/",
    "https://www.reddit.com/r/scholarships/comments/1km18cm/comment/ms71t47/",
    "https://www.reddit.com/r/scholarships/comments/1l2wz7c/comment/mw7xanp/",
    "https://www.reddit.com/r/UTAustin/comments/1kr55rf/parents_wont_take_out_loan_help/",
    "https://www.reddit.com/r/scholarships/comments/1kbyvde/comment/mq30ao0/",
    "https://www.reddit.com/r/NCBCA/comments/1kwnohh/2085_high_4star_recruiting_thread_31115/mv4z7ig/",
    "https://www.reddit.com/r/scholarships/comments/1kjjews/no_clue_where_to_start/",
    "https://www.reddit.com/r/scholarships/comments/1k1lmmn/scholarships_once_youre_in_college/mnnkv1q/",
    "https://www.reddit.com/r/Competitiveoverwatch/comments/1kngrs8/maryville_university_has_sunset_their_overwatch/msmkjt6/",
    "https://www.reddit.com/r/scholarships/comments/1kli8zw/parent_seeking_advice_for_hs_junior_class_of_2026/ms2vjll/",
    "https://www.reddit.com/r/scholarships/comments/1ixi2cg/comment/menwqum/",
    "https://www.reddit.com/r/scholarships/comments/1jxqh9t/comment/mmsqlzg/",
    "https://www.reddit.com/r/scholarships/comments/1kmna8q/to_those_whove_won_many_scholarships_what_advice/mt18bsw/",
    "https://www.reddit.com/r/scholarships/comments/1km18cm/i_am_a_little_confused_with_all_this_stuff_of/ms8cgpi/",
    "https://www.reddit.com/r/SkyrimModsXbox/comments/1iycb8h/current_state_of_the_massive_plus_load_order/metaacz/",
    "https://www.reddit.com/r/AmItheAsshole/comments/1gw2kq5/wibta_if_i_ask_to_share_a_room_w_sister_after_a/ly6dqv2/",
    "https://www.reddit.com/r/scholarships/comments/1jyp9h7/scholarship_recommendations_please/mn0mcnx/",
    "https://www.reddit.com/r/SkyrimModsXbox/comments/1iycb8h/current_state_of_the_massive_plus_load_order/metacil/",
    "https://www.reddit.com/r/scholarships/comments/1kjjews/no_clue_where_to_start/mrplhjg/",
    "https://www.reddit.com/r/scholarships/comments/1kjjews/comment/mrplhjg/",
    "https://www.reddit.com/r/scholarships/comments/1j65vun/havent_heard_anything_back_from_any_of_the/mgmljd1/",
    "https://www.reddit.com/r/scholarships/comments/1jmzq77/comment/mkfvu4r/",
    "https://www.reddit.com/r/HowEarnMoneyOnline/comments/1jldzmm/comment/mk4pj5s/",
    "https://www.reddit.com/r/scholarships/comments/1ipjx05/comment/mcuzp6i/",
    "https://www.reddit.com/r/scholarships/comments/1j7sawl/comment/mh14k6k/",
    "https://www.reddit.com/r/universityofauckland/comments/1lw7y2h/act_says_uoa_graduate_programme_is_racist/n2c54eq/",
    "https://www.reddit.com/r/school/comments/1k78n98/comment/moxadvw/",
    "https://www.reddit.com/r/NZCFL/comments/1k1d67z/comment/modk8mo/",
    "https://www.reddit.com/r/SKTT1/comments/1h6jtdv/comment/m0f1z9n/",
    "https://www.reddit.com/r/chaoticgood/comments/1l8w30a/speak_the_fucking_language_they_understand/mx8rxc3/",
    "https://www.reddit.com/r/SkyrimModsXbox/comments/1i6nt95/comment/m8dp15g/",
    "https://www.reddit.com/r/scholarships/comments/1lw29gt/comment/n2cqpoc/",
    "https://www.reddit.com/r/universityofauckland/comments/1lw7y2h/comment/n2c54eq/",
    "https://www.reddit.com/r/UGCNETEnglish/comments/1lsuc8g/comment/n1xbei2/",
    "https://www.reddit.com/r/scholarships/comments/1lti24z/comment/n1qvi34/",
    "https://www.reddit.com/r/ApplyingToCollege/comments/1lss9pt/comment/n1opfwa/",
    "https://www.reddit.com/r/NZCFL/comments/1loer9o/comment/n1kr77o/",
    "https://www.reddit.com/r/scholarships/comments/1lrv842/comment/n1e2wan/",
    "https://www.reddit.com/r/scholarships/comments/1lr7y87/comment/n18su3m/",
    "https://www.reddit.com/r/scholarships/comments/1lr3t0i/comment/n183v8m/",
    "https://www.reddit.com/r/scholarships/comments/1lr3t0i/does_anyone_small_scholarships_with_applications/n17thcf/",
    "https://www.reddit.com/r/scholarships/comments/1lq8y7f/comment/n1178b1/",
    "https://www.reddit.com/r/scholarships/comments/1lphczw/comment/n10wraw/",
    "https://www.reddit.com/r/scholarships/comments/1lpy4nk/comment/n10c3hj/",
    "https://www.reddit.com/r/college/comments/adnkdt/comment/n0o2z72/",
    "https://www.reddit.com/r/scholarships/comments/1lnxhmy/comment/n0iyi3z/",
    "https://www.reddit.com/r/scholarships/comments/1lk5mhf/comment/mzpgdxh/"
]
  return urls;
}