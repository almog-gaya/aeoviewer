"use client";

import React, { useEffect, useState } from "react";
import { RedditSentimentReport } from "@/types/RedditSentiment";

export default function ViewRedditSentimentResult() {
  const [sentimentReport, setSentimentReport] = useState<RedditSentimentReport | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [llmFileExists, setLlmFileExists] = useState<boolean | null>(null);

  useEffect(() => {
    document.body.classList.add('report-mode');
    return () => {
      document.body.classList.remove('report-mode');
    };
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/reddit-sentiment/last-report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("No saved report found");
        const report = await res.json();
        setSentimentReport(report);
        setCompanyName(report?.companyName || "");
      } catch (err) {
        console.log(`Error loading report:`, err);
        setError("No saved report found or failed to load.");
      } finally {
        setLoading(false);
      }
    };

    const checkLlmFile = async () => {
      try {
        const res = await fetch("/api/check-llm-file");
        if (!res.ok) throw new Error("Failed to check llm.txt");
        const { exists } = await res.json();
        setLlmFileExists(exists);
      } catch (err) {
        console.error("Error checking llm.txt:", err);
        setLlmFileExists(false);
      }
    };

    fetchReport();
    checkLlmFile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-gray-600">Loading last sentiment report...</div>
    );
  }

  if (error || !sentimentReport) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-red-600">{error || "No report found."}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Reddit <span className="text-orange-500">×</span> {companyName}
            </h1>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Sentiment Analysis Report</h2>
            <p className="text-sm text-gray-500 flex items-center flex-wrap gap-x-2 justify-center text-center">
              {sentimentReport.summary.totalMentions} mentions • {Math.round((sentimentReport.summary.sentimentDistribution.positive / sentimentReport.summary.totalMentions) * 100)}% positive • Generated {new Date().toLocaleDateString()}
              <span className="mx-2 text-gray-300">•</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ml-0 ${llmFileExists === null ? 'bg-gray-100 text-gray-500' : llmFileExists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                style={{ minWidth: '110px' }}>
                <span className={`mr-1 text-base ${llmFileExists === null ? 'text-gray-400' : llmFileExists ? 'text-green-500' : 'text-red-500'}`}>{llmFileExists === null ? '…' : llmFileExists ? '✓' : '✗'}</span>
                llm.txt
                <span className="ml-1">
                  {llmFileExists === null ? 'Checking' : llmFileExists ? 'Ready' : 'Missing'}
                </span>
              </span>
            </p>
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
          {sentimentReport.summary.competitorMentions && Object.keys(sentimentReport.summary.competitorMentions).length > 0 && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sentimentReport.analyses.slice(0, 15).map((analysis) => (
                <div key={analysis.mention.id} className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow transition-shadow h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="mention-title font-medium text-gray-900 text-base break-words flex-1">{analysis.mention.title}</div>
                    <span className={`sentiment-badge inline-flex px-3 py-1 text-xs font-semibold rounded-full ml-2 mt-1 ${
                      analysis.sentiment.label === 'positive' || analysis.sentiment.label === 'very_positive'
                        ? 'bg-green-100 text-green-800'
                        : analysis.sentiment.label === 'negative' || analysis.sentiment.label === 'very_negative'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {analysis.sentiment.label.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mention-meta text-xs text-gray-500 mb-2 break-words">
                    r/{analysis.mention.subreddit} • {analysis.mention.author}
                  </div>
                  <div className="mention-snippet text-sm text-gray-600 break-words mb-2">
                    {analysis.mention.selftext ? analysis.mention.selftext.substring(0, 200) + (analysis.mention.selftext.length > 200 ? '...' : '') : 'No content preview'}
                  </div>
                  <div className="mt-auto text-xs text-gray-400">Score: {analysis.sentiment.score.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}