"use client";

import React, { useState, useEffect } from "react";
import { 
  RedditSearchParams, 
  RedditSearchResult, 
  RedditSentimentReport,
  RedditOAuthToken
} from "@/types/RedditSentiment";
import { generateCSV, generateHTMLReport } from "@/utils";
import { getRedditUser, handleRedditLogin, handleRedditLogout } from "@/lib/reddit";

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

  // OAuth state
  const [redditUser, setRedditUser] = useState<string | null | false>(null); // null: loading, string: user, false: not logged in
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Check for OAuth error in URL and fetch user data if authenticated
  useEffect(() => { 
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    if (error) {
      setOauthError(error);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for access token in cookies
    getRedditUser().then(user => {
      if (user && user.name) {
        setRedditUser(user.name);
      } else {
        setRedditUser(false);
      }
    })
  }, []);

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
        credentials: "include",
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const result = await response.json();
      setSearchResult(result);
      setCompanyName(searchParams.query);
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
      {/* OAuth Button and User Info */}
      <div className="absolute top-4 right-4 z-50">
        {/* Loading state: show nothing */}
        {redditUser === null ? null : redditUser === false ? (
          <button
            onClick={handleRedditLogin}
            className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg hover:from-orange-600 hover:to-red-700 text-base font-semibold flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
            style={{ minWidth: 30 }}
          >
            <img src="/redditlogo.jpeg" alt="Reddit" className="w-6 h-6 rounded-full bg-white mr-2" />
            
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow hover:shadow-md transition-all duration-150 focus:outline-none"
            >
              <img src="/redditlogo.jpeg" alt="Reddit" className="w-7 h-7 rounded-full border border-gray-300" />
              <span className="font-medium text-gray-800">{redditUser}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 text-gray-700 text-sm border-b">Logged in as <span className="font-semibold">{redditUser}</span></div>
                <button
                  onClick={() => { setUserMenuOpen(false); handleRedditLogout(); }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Extra space */}
      <div className="h-12" />

      {/* OAuth Error */}

      {oauthError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {oauthError}
        </div>
      )}

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

      {/* Step 3: Professional Analysis Report */}
      {step === 2 && sentimentReport && (
        <div className="min-h-screen bg-gray-50 -mx-4 -my-10">
          {/* Header with Company Info */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Logo Row */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <img src="/redditlogo.jpeg" alt="Reddit" className="h-10 w-10 rounded-full"/>
                <span className="text-gray-400 text-2xl">×</span>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{companyName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              
              {/* Title */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reddit Sentiment Analysis</h1>
                <h2 className="text-xl text-gray-600 mb-4">{companyName}</h2>
                <p className="text-sm text-gray-500">
                  {sentimentReport.summary.totalMentions} mentions • {Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100)}% positive • Generated {new Date().toLocaleDateString()}
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('html')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                >
                  Export HTML
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                >
                  ← New Search
                </button>
              </div>
            </div>
          </div>
          
          <main className="p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Sentiment Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sentiment Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{sentimentReport.summary.sentimentDistribution.positive}</div>
                    <div className="text-lg font-medium text-gray-700 mb-1">Positive Mentions</div>
                    <div className="text-sm text-gray-500">{Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100)}% of all sentiment</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{sentimentReport.summary.sentimentDistribution.neutral}</div>
                    <div className="text-lg font-medium text-gray-700 mb-1">Neutral Mentions</div>
                    <div className="text-sm text-gray-500">{Math.round((sentimentReport.summary.sentimentDistribution.neutral / sentimentReport.summary.totalMentions) * 100)}% of all sentiment</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">{sentimentReport.summary.sentimentDistribution.negative}</div>
                    <div className="text-lg font-medium text-gray-700 mb-1">Negative Mentions</div>
                    <div className="text-sm text-gray-500">{Math.round((sentimentReport.summary.sentimentDistribution.negative / sentimentReport.summary.totalMentions) * 100)}% of all sentiment</div>
                  </div>
                </div>
              </div>

              {/* Key Communities and Sentiment Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subreddit Analysis */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Discussion Communities</h3>
                  <div className="space-y-4">
                    {sentimentReport.summary.topSubreddits.slice(0, 6).map((subreddit, index) => (
                      <div key={subreddit.subreddit} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">r/{subreddit.subreddit}</div>
                          <div className="text-sm text-gray-500">{subreddit.count} discussions • Avg sentiment: {subreddit.averageSentiment.toFixed(1)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">{Math.round((subreddit.count / sentimentReport.summary.totalMentions) * 100)}%</div>
                          <div className="text-xs text-gray-500">of discussions</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentiment Insights */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Insights</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-gray-900">Strong Positive Sentiment</div>
                        <div className="text-2xl font-bold text-gray-900">{Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100)}%</div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {sentimentReport.summary.sentimentDistribution.positive} positive mentions show users appreciate {companyName}'s features and performance
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-gray-900">Neutral Discussion</div>
                        <div className="text-2xl font-bold text-gray-900">{Math.round((sentimentReport.summary.sentimentDistribution.neutral / sentimentReport.summary.totalMentions) * 100)}%</div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {sentimentReport.summary.sentimentDistribution.neutral} neutral mentions include factual comparisons and technical discussions
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-gray-900">Areas for Improvement</div>
                        <div className="text-2xl font-bold text-gray-900">{Math.round((sentimentReport.summary.sentimentDistribution.negative / sentimentReport.summary.totalMentions) * 100)}%</div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {sentimentReport.summary.sentimentDistribution.negative} negative mentions highlight potential improvement areas
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topic Analysis */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">What People Are Discussing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sentimentReport.summary.topKeywords.slice(0, 9).map((keyword) => (
                    <div key={keyword.keyword} className="p-4 border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-900 mb-2 capitalize">{keyword.keyword}</div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">{keyword.count}</div>
                      <div className="text-xs text-gray-500">Sentiment: {keyword.sentiment}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitive Sentiment (if competitors provided) */}
              {competitors && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Competitive Sentiment Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Mentions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Community Reach</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discussion Type</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">{companyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sentimentReport.summary.totalMentions}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sentimentReport.summary.topSubreddits.length} subreddits</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100)}% Positive Sentiment
                            </span>
                          </td>
                        </tr>
                        {Object.entries(sentimentReport.summary.competitorMentions).map(([competitor, data]) => (
                          <tr key={competitor}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{competitor}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Multiple communities</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                {data.sentiment}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Key Insights */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Positive Feedback Themes</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {sentimentReport.summary.topKeywords
                        .filter(k => k.sentiment.toLowerCase().includes('positive'))
                        .slice(0, 3)
                        .map((keyword, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {keyword.keyword} mentioned {keyword.count} times with positive sentiment
                          </li>
                        ))}
                      {sentimentReport.summary.topKeywords.filter(k => k.sentiment.toLowerCase().includes('positive')).length === 0 && (
                        <li className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          Users appreciate {companyName}'s features and performance
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Areas of Discussion</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {sentimentReport.summary.topKeywords.slice(0, 3).map((keyword, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {keyword.keyword} - {keyword.count} discussions
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                  <p className="text-sm text-blue-800">
                    {companyName} shows {Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100) >= 50 ? 'strong' : 'moderate'} positive sentiment ({Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100)}%) across {sentimentReport.summary.topSubreddits.length} major communities. 
                    With {sentimentReport.summary.totalMentions} total mentions, discussions focus primarily on {sentimentReport.summary.topKeywords.slice(0, 3).map(k => k.keyword).join(', ')}. 
                    The sentiment distribution indicates {sentimentReport.summary.sentimentDistribution.positive >= sentimentReport.summary.sentimentDistribution.negative ? 'healthy' : 'mixed'} community engagement with {Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100) >= 40 ? 'predominantly positive' : 'balanced'} feedback.
                  </p>
                </div>
              </div>

              {/* Sample Mentions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Analyzed Mentions</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sentimentReport.analyses.slice(0, 5).map((analysis) => (
                    <div key={analysis.mention.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{analysis.mention.title}</h4>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <span className="font-medium">r/{analysis.mention.subreddit}</span>
                            <span className="mx-2">•</span>
                            <span>by {analysis.mention.author}</span>
                            <span className="mx-2">•</span>
                            <span>{analysis.mention.score} upvotes</span>
                            <span className="mx-2">•</span>
                            <span>{analysis.mention.numComments} comments</span>
                          </div>
                          {analysis.mention.selftext && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {analysis.mention.selftext.substring(0, 150)}...
                            </p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            analysis.sentiment.label === 'positive' || analysis.sentiment.label === 'very_positive'
                              ? 'bg-green-100 text-green-800'
                              : analysis.sentiment.label === 'negative' || analysis.sentiment.label === 'very_negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {analysis.sentiment.label.replace('_', ' ')}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Score: {analysis.sentiment.score.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}