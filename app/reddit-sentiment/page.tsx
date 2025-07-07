"use client";

import React, { useState } from "react";
import { 
  RedditSearchParams, 
  RedditSearchResult, 
  RedditSentimentReport, 
  RedditMention,
  RedditExportOptions 
} from "@/types/RedditSentiment";

export default function RedditSentimentPage() {
  // Step state: 0: search, 1: results, 2: analysis
  const [step, setStep] = useState(0);
  
  // Search parameters
  const [searchParams, setSearchParams] = useState<RedditSearchParams & { searchStrategy?: string; industryContext?: string }>({
    query: "",
    subreddit: "",
    timeFilter: "week",
    limit: 500,
    sort: "relevance",
    searchStrategy: "withContext",
    industryContext: ""
  });
  
  // Loading and error states
  const [searchLoading, setSearchLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  
  // Results
  const [searchResult, setSearchResult] = useState<RedditSearchResult | null>(null);
  const [sentimentReport, setSentimentReport] = useState<RedditSentimentReport | null>(null);
  
  // Company info for analysis
  const [companyName, setCompanyName] = useState("");
  const [competitors, setCompetitors] = useState("");

  // Search for Reddit mentions
  const handleSearch = async () => {
    if (!searchParams.query.trim()) {
      setSearchError("Please enter a search query");
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    
    try {
      console.log("🔍 Starting Reddit search...");
      const response = await fetch("/api/reddit-sentiment/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const result = await response.json();
      setSearchResult(result);
      setCompanyName(searchParams.query); // Default company name to search query
      setStep(1);
      
      console.log(`✅ Found ${result.mentions.length} mentions`);
    } catch (error: any) {
      console.error("❌ Search failed:", error);
      setSearchError(error.message || "Failed to search Reddit mentions");
    } finally {
      setSearchLoading(false);
    }
  };

  // Analyze sentiment
  const handleAnalyze = async () => {
    if (!searchResult || !companyName.trim()) {
      setAnalyzeError("Missing search results or company name");
      return;
    }

    setAnalyzeLoading(true);
    setAnalyzeError(null);
    
    try {
      console.log("🧠 Starting sentiment analysis...");
      const competitorList = competitors.split(",").map(c => c.trim()).filter(Boolean);
      
      const response = await fetch("/api/reddit-sentiment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentions: searchResult.mentions,
          companyName: companyName.trim(),
          competitors: competitorList
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const report = await response.json();
      setSentimentReport(report);
      setStep(2);
      
      console.log(`✅ Analysis complete: ${report.summary.totalMentions} mentions analyzed`);
    } catch (error: any) {
      console.error("❌ Analysis failed:", error);
      setAnalyzeError(error.message || "Failed to analyze sentiment");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // Export functionality
  const handleExport = (format: 'csv' | 'json' | 'html') => {
    if (!sentimentReport) return;

    let content = "";
    let filename = "";
    let mimeType = "";

    switch (format) {
      case 'csv':
        content = generateCSV(sentimentReport);
        filename = `reddit-sentiment-analysis-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = "text/csv";
        break;
      case 'json':
        content = JSON.stringify(sentimentReport, null, 2);
        filename = `reddit-sentiment-analysis-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = "application/json";
        break;
      case 'html':
        content = generateHTMLReport(sentimentReport);
        filename = `reddit-sentiment-analysis-${new Date().toISOString().split('T')[0]}.html`;
        mimeType = "text/html";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // Reset to start over
  const handleReset = () => {
    setStep(0);
    setSearchResult(null);
    setSentimentReport(null);
    setSearchError(null);
    setAnalyzeError(null);
    setCompanyName("");
    setCompetitors("");
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 relative min-h-screen">
      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        {["Search Reddit", "Review Results", "Sentiment Analysis"].map((label, i) => (
          <React.Fragment key={i}>
            <div className={`flex-1 text-center font-semibold ${step === i ? "text-blue-600" : step > i ? "text-green-600" : "text-gray-400"}`}>
              {label}
            </div>
            {i < 2 && <div className={`w-8 h-1 mx-2 rounded ${step > i ? "bg-green-500" : "bg-gray-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Search */}
      {step === 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Reddit Sentiment Analysis</h1>
          <p className="text-gray-600 mb-6">
            Search Reddit for mentions of your company or brand and analyze sentiment. 
            We'll find mentions from the last week or up to 500 results, whichever is higher.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 'Your Company Name' or 'yourwebsite.com'"
                value={searchParams.query}
                onChange={e => setSearchParams(prev => ({ ...prev, query: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">Company name, website, or keywords to search for</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Subreddit (Optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., technology, business"
                value={searchParams.subreddit}
                onChange={e => setSearchParams(prev => ({ ...prev, subreddit: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to search all of Reddit</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Strategy</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchParams.searchStrategy}
                onChange={e => setSearchParams(prev => ({ ...prev, searchStrategy: e.target.value }))}
              >
                <option value="withContext">Smart Context (Recommended)</option>
                <option value="businessContext">Business Context (Enterprise focus)</option>
                <option value="quoted">Exact Match (Very specific)</option>
                <option value="quotedWithContext">Exact + Context (Balanced)</option>
                <option value="basic">Basic Search (Broadest results)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Smart Context adds business terms to improve relevance across all industries</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry Context (Optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., healthcare, food, fashion, technology"
                value={searchParams.industryContext}
                onChange={e => setSearchParams(prev => ({ ...prev, industryContext: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">Add specific industry terms to further refine search context</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Filter</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchParams.timeFilter}
                onChange={e => setSearchParams(prev => ({ ...prev, timeFilter: e.target.value as any }))}
              >
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchParams.sort}
                onChange={e => setSearchParams(prev => ({ ...prev, sort: e.target.value as any }))}
              >
                <option value="relevance">Relevance</option>
                <option value="top">Top Rated</option>
                <option value="new">Newest</option>
                <option value="comments">Most Comments</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Result Limit</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchParams.limit}
                onChange={e => setSearchParams(prev => ({ ...prev, limit: Number(e.target.value) }))}
              >
                <option value={100}>100 mentions</option>
                <option value={250}>250 mentions</option>
                <option value={500}>500 mentions</option>
              </select>
            </div>
          </div>
          
          {searchError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {searchError}
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={handleSearch}
              disabled={searchLoading || !searchParams.query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {searchLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching Reddit...
                </>
              ) : (
                "Search Reddit Mentions"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Results */}
      {step === 1 && searchResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← New Search
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{searchResult.mentions.length}</div>
              <div className="text-sm text-gray-600">Mentions Found</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{searchResult.processingStats.successfullyFetched}</div>
              <div className="text-sm text-gray-600">Successfully Fetched</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{new Set(searchResult.mentions.map(m => m.subreddit)).size}</div>
              <div className="text-sm text-gray-600">Subreddits</div>
            </div>
          </div>

          {/* Company and Competitor Setup */}
          <div className="border-t pt-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Analysis Setup</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your company name"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitors (Optional)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="competitor1, competitor2, competitor3"
                  value={competitors}
                  onChange={e => setCompetitors(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated list of competitor names</p>
              </div>
            </div>
          </div>

          {/* Sample of found mentions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Preview of Found Mentions</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResult.mentions.slice(0, 5).map((mention, index) => (
                <div key={mention.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{mention.title}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>r/{mention.subreddit}</span>
                        <span className="mx-2">•</span>
                        <span>by {mention.author}</span>
                        <span className="mx-2">•</span>
                        <span>{mention.numComments} comments</span>
                        <span className="mx-2">•</span>
                        <span>{mention.score} upvotes</span>
                      </div>
                      {mention.selftext && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {mention.selftext.substring(0, 200)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {searchResult.mentions.length > 5 && (
                <div className="text-center text-gray-500 text-sm">
                  ... and {searchResult.mentions.length - 5} more mentions
                </div>
              )}
            </div>
          </div>

          {analyzeError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {analyzeError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzeLoading || !companyName.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {analyzeLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Sentiment...
                </>
              ) : (
                "Analyze Sentiment"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Analysis Results */}
      {step === 2 && sentimentReport && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Sentiment Analysis Report</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('html')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  Export HTML
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  ← New Search
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{sentimentReport.summary.totalMentions}</div>
                <div className="text-sm text-gray-600">Total Mentions</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{sentimentReport.summary.sentimentDistribution.positive}</div>
                <div className="text-sm text-gray-600">Positive</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{sentimentReport.summary.sentimentDistribution.neutral}</div>
                <div className="text-sm text-gray-600">Neutral</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{sentimentReport.summary.sentimentDistribution.negative}</div>
                <div className="text-sm text-gray-600">Negative</div>
              </div>
            </div>

            {/* Sentiment Distribution Chart */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Sentiment Distribution</h2>
              <div className="bg-gray-100 rounded-lg h-8 flex overflow-hidden">
                <div 
                  className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100}%` }}
                >
                  {sentimentReport.summary.sentimentDistribution.positive > 0 && 
                    `${Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100)}%`
                  }
                </div>
                <div 
                  className="bg-yellow-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(sentimentReport.summary.sentimentDistribution.neutral / sentimentReport.summary.totalMentions) * 100}%` }}
                >
                  {sentimentReport.summary.sentimentDistribution.neutral > 0 && 
                    `${Math.round((sentimentReport.summary.sentimentDistribution.neutral / sentimentReport.summary.totalMentions) * 100)}%`
                  }
                </div>
                <div 
                  className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(sentimentReport.summary.sentimentDistribution.negative / sentimentReport.summary.totalMentions) * 100}%` }}
                >
                  {sentimentReport.summary.sentimentDistribution.negative > 0 && 
                    `${Math.round((sentimentReport.summary.sentimentDistribution.negative / sentimentReport.summary.totalMentions) * 100)}%`
                  }
                </div>
              </div>
            </div>

            {/* Top Subreddits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-3">Top Subreddits</h2>
                <div className="space-y-2">
                  {sentimentReport.summary.topSubreddits.slice(0, 5).map((sub, index) => (
                    <div key={sub.subreddit} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">r/{sub.subreddit}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">{sub.count} mentions</div>
                        <div className="text-xs text-gray-500">
                          Avg sentiment: {sub.averageSentiment.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-3">Top Keywords</h2>
                <div className="space-y-2">
                  {sentimentReport.summary.topKeywords.slice(0, 10).map((keyword, index) => (
                    <div key={keyword.keyword} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{keyword.keyword}</span>
                      <span className="text-sm text-gray-600">{keyword.count} times</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Mentions */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Recent Analyzed Mentions</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sentimentReport.analyses.slice(0, 10).map((analysis, index) => (
                  <div key={analysis.mention.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{analysis.mention.title}</h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>r/{analysis.mention.subreddit}</span>
                          <span className="mx-2">•</span>
                          <span>by {analysis.mention.author}</span>
                          <span className="mx-2">•</span>
                          <span>{analysis.mention.score} upvotes</span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          analysis.sentiment.label.includes('positive') 
                            ? 'bg-green-100 text-green-800' 
                            : analysis.sentiment.label.includes('negative')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {analysis.sentiment.label.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Score: {analysis.sentiment.score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions for export
function generateCSV(report: RedditSentimentReport): string {
  const headers = [
    "Title",
    "Subreddit", 
    "Author",
    "Score",
    "Comments",
    "Sentiment Label",
    "Sentiment Score",
    "URL",
    "Created"
  ];
  
  const rows = report.analyses.map(analysis => [
    `"${analysis.mention.title.replace(/"/g, '""')}"`,
    analysis.mention.subreddit,
    analysis.mention.author,
    analysis.mention.score,
    analysis.mention.numComments,
    analysis.sentiment.label,
    analysis.sentiment.score,
    analysis.mention.url,
    analysis.mention.created
  ]);
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

function generateHTMLReport(report: RedditSentimentReport): string {
  const positivePercent = Math.round((report.summary.sentimentDistribution.positive / report.summary.totalMentions) * 100);
  const neutralPercent = Math.round((report.summary.sentimentDistribution.neutral / report.summary.totalMentions) * 100);
  const negativePercent = Math.round((report.summary.sentimentDistribution.negative / report.summary.totalMentions) * 100);
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Reddit Sentiment Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .positive { background-color: #f0f9ff; }
        .negative { background-color: #fef2f2; }
        .neutral { background-color: #fffbeb; }
        .mention { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reddit Sentiment Analysis Report</h1>
        <p>Generated on ${new Date(report.generatedAt).toLocaleDateString()}</p>
        <p>Total Mentions Analyzed: ${report.summary.totalMentions}</p>
    </div>
    
    <div class="stats">
        <div class="stat-card positive">
            <h3>${report.summary.sentimentDistribution.positive}</h3>
            <p>Positive (${positivePercent}%)</p>
        </div>
        <div class="stat-card neutral">
            <h3>${report.summary.sentimentDistribution.neutral}</h3>
            <p>Neutral (${neutralPercent}%)</p>
        </div>
        <div class="stat-card negative">
            <h3>${report.summary.sentimentDistribution.negative}</h3>
            <p>Negative (${negativePercent}%)</p>
        </div>
        <div class="stat-card">
            <h3>${report.summary.averageSentiment.toFixed(2)}</h3>
            <p>Avg Sentiment</p>
        </div>
    </div>
    
    <h2>Top Subreddits</h2>
    <ul>
        ${report.summary.topSubreddits.slice(0, 5).map(sub => 
          `<li>r/${sub.subreddit}: ${sub.count} mentions (avg sentiment: ${sub.averageSentiment.toFixed(1)})</li>`
        ).join('')}
    </ul>
    
    <h2>Sample Mentions</h2>
    ${report.analyses.slice(0, 10).map(analysis => `
        <div class="mention">
            <h4>${analysis.mention.title}</h4>
            <p><strong>r/${analysis.mention.subreddit}</strong> by ${analysis.mention.author}</p>
            <p>Sentiment: <strong>${analysis.sentiment.label}</strong> (Score: ${analysis.sentiment.score})</p>
            <p>Score: ${analysis.mention.score} | Comments: ${analysis.mention.numComments}</p>
        </div>
    `).join('')}
</body>
</html>
  `;
} 