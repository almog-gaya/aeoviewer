export interface RedditThread {
  title: string;
  subreddit: string;
  url: string;
}

export interface RedditMention extends RedditThread {
  id: string;
  author: string;
  score: number;
  numComments: number;
  created: Date | string;
  selftext?: string;
  comments: RedditComment[];
  wordCount: number;
}

export interface RedditComment {
  body: string;
  author: string;
  score: number;
  created: Date | string;
  depth: number;
}

export interface SentimentAnalysis {
  score: number;
  comparative: number;
  label: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  confidence: number;
  positive: string[];
  negative: string[];
  wordCount: number;
}

export interface RedditMentionAnalysis {
  mention: RedditMention;
  sentiment: SentimentAnalysis;
  brandMentions: {
    [brand: string]: {
      count: number;
      contexts: string[];
    };
  };
  keywords: Array<{
    keyword: string;
    count: number;
  }>;
  competitorComparisons: Array<{
    text: string;
    sentiment: SentimentAnalysis;
  }>;
}

export interface RedditSearchParams {
  query: string;
  subreddit?: string;
  timeFilter: 'week' | 'month' | 'year' | 'all';
  limit: number;
  sort: 'relevance' | 'top' | 'new' | 'comments';
}

export interface RedditSearchResult {
  mentions: RedditMention[];
  totalFound: number;
  searchParams: RedditSearchParams;
  searchDate: Date | string;
  processingStats: {
    successfullyFetched: number;
    failedFetches: number;
    totalAnalyzed: number;
    filteredOut?: number;
  };
}

export interface RedditSentimentReport {
  searchResult: RedditSearchResult;
  analyses: RedditMentionAnalysis[];
  summary: {
    totalMentions: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    averageSentiment: number;
    topSubreddits: Array<{
      subreddit: string;
      count: number;
      averageSentiment: number;
    }>;
    topKeywords: Array<{
      keyword: string;
      count: number;
      sentiment: string;
    }>;
    competitorMentions: {
      [competitor: string]: {
        count: number;
        sentiment: string;
      };
    };
  };
  generatedAt: Date | string;
}

export interface RedditAPIResponse {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: any;
    }>;
    after?: string;
    before?: string;
    dist: number;
  };
}

export interface RedditExportOptions {
  format: 'csv' | 'json' | 'html';
  includeComments: boolean;
  includeSentimentScores: boolean;
  includeKeywords: boolean;
} 