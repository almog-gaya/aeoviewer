import { NextRequest, NextResponse } from "next/server";
import { 
  RedditMention, 
  RedditMentionAnalysis, 
  RedditSentimentReport, 
  SentimentAnalysis,
  WebsiteAnalysis
} from "@/types/RedditSentiment";

// Import sentiment analysis (same as existing scripts)
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

interface AnalyzeRequestBody {
  mentions: RedditMention[];
  companyName: string;
  competitors?: string[];
  websiteAnalysis?: WebsiteAnalysis;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await req.json();
    
    if (!body.mentions || !Array.isArray(body.mentions)) {
      return NextResponse.json(
        { error: 'Mentions array is required' },
        { status: 400 }
      );
    }

    if (!body.companyName || body.companyName.trim() === '') {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    console.log(`🧠 Analyzing ${body.mentions.length} Reddit mentions for ${body.companyName}`);

    const report = await analyzeRedditMentions(
      body.mentions, 
      body.companyName.trim(), 
      body.competitors || [],
      body.websiteAnalysis
    );

    return NextResponse.json(report);
    
  } catch (error: any) {
    console.error('❌ Reddit sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze Reddit mentions', details: error.message },
      { status: 500 }
    );
  }
}

async function analyzeRedditMentions(
  mentions: RedditMention[], 
  companyName: string, 
  competitors: string[],
  websiteAnalysis?: WebsiteAnalysis
): Promise<RedditSentimentReport> {
  
  const analyses: RedditMentionAnalysis[] = [];
  const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
  const subredditStats: { [key: string]: { count: number; sentiments: number[] } } = {};
  const allKeywords: { [key: string]: number } = {};
  const competitorMentions: { [key: string]: { count: number; sentiments: number[] } } = {};
  
  console.log(`📊 Processing ${mentions.length} mentions...`);

  for (const mention of mentions) {
    try {
      // Combine all text content
      const allText = [
        mention.title,
        mention.selftext || '',
        ...mention.comments.map(c => c.body)
      ].join(' ');

      // Perform sentiment analysis
      const sentimentResult = performSentimentAnalysis(allText);
      
      // Analyze brand mentions
      const brandMentions = analyzeBrandMentions(allText, [companyName, ...competitors]);
      
      // Extract keywords
      const keywords = extractKeywords(allText);
      
      // Find competitor comparisons
      const competitorComparisons = findCompetitorComparisons(allText, companyName, competitors);

      const analysis: RedditMentionAnalysis = {
        mention,
        sentiment: sentimentResult,
        brandMentions,
        keywords,
        competitorComparisons
      };

      analyses.push(analysis);

      // Update summary statistics
      updateSentimentDistribution(sentimentResult.label, sentimentDistribution);
      updateSubredditStats(mention.subreddit, sentimentResult.score, subredditStats);
      updateKeywordStats(keywords, allKeywords);
      updateCompetitorStats(brandMentions, competitors, sentimentResult.score, competitorMentions);

    } catch (error) {
      console.error(`❌ Failed to analyze mention ${mention.id}:`, error);
    }
  }

  // Calculate summary metrics
  const totalMentions = analyses.length;
  const averageSentiment = totalMentions > 0 
    ? analyses.reduce((sum, a) => sum + a.sentiment.score, 0) / totalMentions 
    : 0;

  const topSubreddits = Object.entries(subredditStats)
    .map(([subreddit, stats]) => ({
      subreddit,
      count: stats.count,
      averageSentiment: stats.sentiments.length > 0 
        ? stats.sentiments.reduce((a, b) => a + b, 0) / stats.sentiments.length 
        : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topKeywords = Object.entries(allKeywords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([keyword, count]) => ({
      keyword,
      count,
      sentiment: 'neutral' // Could be enhanced with keyword-specific sentiment
    }));

  const competitorMentionsSummary = Object.entries(competitorMentions)
    .reduce((acc, [competitor, stats]) => {
      acc[competitor] = {
        count: stats.count,
        sentiment: stats.sentiments.length > 0 
          ? (stats.sentiments.reduce((a, b) => a + b, 0) / stats.sentiments.length > 0 ? 'positive' : 'negative')
          : 'neutral'
      };
      return acc;
    }, {} as { [key: string]: { count: number; sentiment: string } });

  console.log(`✅ Analysis complete: ${totalMentions} mentions analyzed`);
  console.log(`📊 Sentiment distribution:`, sentimentDistribution);

  return {
    companyName,
    searchResult: {
      mentions,
      totalFound: mentions.length,
      searchParams: {
        query: companyName,
        timeFilter: 'week',
        limit: mentions.length,
        sort: 'relevance'
      },
      searchDate: new Date(),
      processingStats: {
        successfullyFetched: mentions.length,
        failedFetches: 0,
        totalAnalyzed: totalMentions
      }
    },
    analyses,
    websiteAnalysis,
    summary: {
      totalMentions,
      sentimentDistribution,
      averageSentiment,
      topSubreddits,
      topKeywords,
      competitorMentions: competitorMentionsSummary
    },
    generatedAt: new Date()
  };
}

function performSentimentAnalysis(text: string): SentimentAnalysis {
  const result = sentiment.analyze(text);
  
  // Classify sentiment (same logic as existing scripts)
  let label: SentimentAnalysis['label'] = 'neutral';
  if (result.score > 2) label = 'very_positive';
  else if (result.score > 0) label = 'positive';
  else if (result.score < -2) label = 'very_negative';
  else if (result.score < 0) label = 'negative';
  
  return {
    score: result.score,
    comparative: result.comparative,
    label,
    confidence: Math.abs(result.comparative) * 10,
    positive: result.positive,
    negative: result.negative,
    wordCount: result.tokens.length
  };
}

function analyzeBrandMentions(text: string, brands: string[]): { [brand: string]: { count: number; contexts: string[] } } {
  const mentions: { [brand: string]: { count: number; contexts: string[] } } = {};
  
  brands.forEach(brand => {
    const regex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches) {
      // Extract context around mentions (100 chars before and after)
      const contextRegex = new RegExp(`.{0,100}\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b.{0,100}`, 'gi');
      const contexts = text.match(contextRegex) || [];
      
      mentions[brand] = {
        count: matches.length,
        contexts: contexts.slice(0, 5) // Limit to 5 contexts per brand
      };
    }
  });
  
  return mentions;
}

function extractKeywords(text: string, minFreq: number = 2): Array<{ keyword: string; count: number }> {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'was', 
    'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 
    'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'she', 
    'use', 'her', 'way', 'many', 'then', 'them', 'well', 'were', 'will', 'with', 
    'have', 'this', 'that', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 
    'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 
    'over', 'such', 'take', 'than', 'only', 'think', 'work', 'also', 'back', 'first', 
    'after', 'other', 'right', 'where', 'would', 'could', 'should', 'more', 'most', 
    'what', 'said', 'each', 'which', 'their', 'about', 'there', 'people', 'into', 
    'through', 'during', 'before', 'under', 'around', 'because', 'however', 'something', 
    'someone', 'different'
  ]);
  
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    if (!stopWords.has(word) && word.length > 2) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordCount)
    .filter(([, count]) => count >= minFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
}

function findCompetitorComparisons(
  text: string, 
  companyName: string, 
  competitors: string[]
): Array<{ text: string; sentiment: SentimentAnalysis }> {
  const comparisons: Array<{ text: string; sentiment: SentimentAnalysis }> = [];
  
  const comparisonPatterns = [
    new RegExp(`${companyName}.*(?:vs|versus|compared to|against).*?(${competitors.join('|')})`, 'gi'),
    new RegExp(`(${competitors.join('|')}).*(?:vs|versus|compared to|against).*?${companyName}`, 'gi')
  ];
  
  comparisonPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        comparisons.push({
          text: match,
          sentiment: performSentimentAnalysis(match)
        });
      });
    }
  });
  
  return comparisons;
}

function updateSentimentDistribution(
  label: SentimentAnalysis['label'], 
  distribution: { positive: number; neutral: number; negative: number }
) {
  if (label.includes('positive')) {
    distribution.positive++;
  } else if (label.includes('negative')) {
    distribution.negative++;
  } else {
    distribution.neutral++;
  }
}

function updateSubredditStats(
  subreddit: string, 
  sentimentScore: number, 
  stats: { [key: string]: { count: number; sentiments: number[] } }
) {
  if (!stats[subreddit]) {
    stats[subreddit] = { count: 0, sentiments: [] };
  }
  stats[subreddit].count++;
  stats[subreddit].sentiments.push(sentimentScore);
}

function updateKeywordStats(
  keywords: Array<{ keyword: string; count: number }>, 
  allKeywords: { [key: string]: number }
) {
  keywords.forEach(({ keyword, count }) => {
    allKeywords[keyword] = (allKeywords[keyword] || 0) + count;
  });
}

function updateCompetitorStats(
  brandMentions: { [brand: string]: { count: number; contexts: string[] } }, 
  competitors: string[], 
  sentimentScore: number,
  competitorStats: { [key: string]: { count: number; sentiments: number[] } }
) {
  competitors.forEach(competitor => {
    if (brandMentions[competitor]) {
      if (!competitorStats[competitor]) {
        competitorStats[competitor] = { count: 0, sentiments: [] };
      }
      competitorStats[competitor].count += brandMentions[competitor].count;
      competitorStats[competitor].sentiments.push(sentimentScore);
    }
  });
} 