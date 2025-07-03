'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { COMPETITORS } from '@/lib/constants';
import { PromptResult } from '@/types/PromptResult';

// LLMs to show in the chart and metrics
const LLM_ENGINES = [
  { key: 'searchgpt', label: 'SearchGPT', color: '#673AB7' },
  { key: 'claude', label: 'Claude', color: '#2196F3' },
  { key: 'gemini', label: 'Gemini', color: '#E91E63' },
  { key: 'chatgpt', label: 'ChatGPT', color: '#4CAF50' },
  { key: 'perplexity', label: 'Perplexity', color: '#FF9800' },
];

// Hardcoded competitor names for the table
const COMPETITOR_NAMES = COMPETITORS;

// Stop words to exclude from word analysis
const STOP_WORDS = new Set([
  'the', 'and', 'or', 'not', 'but', 'if', 'then', 'else', 'when', 'where', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'to', 'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
]);

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('Weekly');
  const [chartMode, setChartMode] = useState('Brand Visibility');
  const [autoScale, setAutoScale] = useState(true);

  const [prompts, setPrompts] = useState<PromptResult[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [competitorStats, setCompetitorStats] = useState<any[]>([]);
  const [reportDate, setReportDate] = useState('');
  const [isReportMode, setIsReportMode] = useState(false);

  const dashboardRef = React.useRef<HTMLDivElement>(null);

  const fetchDashboardData = async () => {
    const response = await fetch('/api/dashboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    setPrompts(await response.json());
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (prompts.length === 0) return; 
    // For each LLM, calculate percent of total responses 
    const entry: any = { name: 'All Data' };
    LLM_ENGINES.forEach(({ key }) => { 
      const llmPrompts = prompts.filter((p) => (p.answer_engine || '').toLowerCase() === key);
      const visible = llmPrompts.filter((p) => p.company_mentioned).length;
      entry[key] = llmPrompts.length > 0 ? (visible / llmPrompts.length) * 100 : 0;
    });
    setChartData([entry]);

    // --- Words Analysis ---
    const wordMap: Record<string, { freq: number; sentiment: number[] }> = {};
    prompts.forEach((p) => {
      const allText = `${p.query_text || ''} ${p.response_text || ''}`;
      allText.split(/\W+/).forEach((word) => {
        const w = word.trim().toLowerCase();
        if (!w || w.length < 3) return;
        if (STOP_WORDS.has(w)) return;
        if (!wordMap[w]) wordMap[w] = { freq: 0, sentiment: [] };
        wordMap[w].freq += 1;
        if (typeof p.sentiment_score === 'number') wordMap[w].sentiment.push(p.sentiment_score);
      });
    });
    const wordArr = Object.entries(wordMap)
      .map(([word, { freq, sentiment }]) => ({
        word,
        freq,
        sentiment: sentiment.length > 0 ? (sentiment.reduce((a, b) => a + b, 0) / sentiment.length).toFixed(2) : 'N/A',
      }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 20);
    setWords(wordArr);

    // --- Competitor Stats ---
    const companyNames = prompts[0].competitors_list || [];
    const compStatsArr = companyNames.map((comp) => {
      const compPrompts = prompts.filter((p) => {
        // Check if competitor is mentioned in any relevant field
        const inMentioned = (p.mentioned_companies || []).includes(comp);
        const inList = (p.competitors_list || []).includes(comp);
        const inRank = p.rank_list && p.rank_list.toLowerCase().includes(comp.toLowerCase());
        return inMentioned || inList || inRank;
      });
      const visibility = compPrompts.length > 0 ?
        (compPrompts.filter((p) => p.ranking_position !== null && p.ranking_position !== undefined).length / compPrompts.length) * 100 : 0;
      const avgPosition = compPrompts.length > 0 ?
        (compPrompts.reduce((sum, p) => sum + (p.ranking_position || 0), 0) / compPrompts.length).toFixed(2) : 'N/A';
      const avgSentiment = compPrompts.length > 0 ?
        (compPrompts.reduce((sum, p) => sum + (typeof p.sentiment_score === 'number' ? p.sentiment_score : 0), 0) / compPrompts.length).toFixed(2) : 'N/A';
      const featureScore = compPrompts.length > 0 ?
        (compPrompts.filter((p) => p.recommended).length / compPrompts.length * 5).toFixed(2) : 'N/A';
      // Change: not applicable without time, set to 0
      const change = 0;
      return {
        name: comp,
        visibility: visibility.toFixed(1),
        change,
        position: avgPosition,
        sentiment: avgSentiment,
        feature: featureScore,
      };
    });
    setCompetitorStats(compStatsArr);
  }, [prompts]);

  useEffect(() => {
    setReportDate(new Date().toLocaleDateString());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('report') === '1') {
        setIsReportMode(true);
        document.body.classList.add('report-mode');
      } else {
        document.body.classList.remove('report-mode');
      }
    }
  }, []);

  // Helper functions to compute metrics from prompts
  function getMetricsByStage(stageKeywords: string[]) {
    if(!prompts || prompts.length === 0 || !stageKeywords || stageKeywords.length === 0) return {
      questions: 0,
      responses: 0,
      visibility: '0.0',
      visibilityChange: '0.0',
    };  
    const filtered = prompts.filter((p: PromptResult) =>
      stageKeywords.some((keyword: string) =>
        {
          const isInclude = (p.buying_journey_stage || '').toLowerCase().includes(keyword); 
          return isInclude;
        }
      )
    );
    
    return {
      questions: filtered.length,
      responses: filtered.filter((p: PromptResult) => p.response_text && p.response_text.trim() !== '').length,
      visibility: filtered.length > 0
        ? (filtered.filter((p: PromptResult) => p.ranking_position !== null && p.ranking_position !== undefined).length / filtered.length * 100).toFixed(1)
        : '0.0',
      visibilityChange: '0.0', // Placeholder, as change is not in data
    };
  }

  // Buying Journey: stages with 'buying' or 'solution'
  const buyingJourneyMetrics = getMetricsByStage(['buying', 'solution']);
  // Topic Analysis: stages with 'topic' or 'problem'
  const topicAnalysisMetrics = getMetricsByStage(['topic', 'problem']);
  // Key Insights: use all prompts for now
  const keyInsightsMetrics = {
    terms: Array.from(new Set(prompts.flatMap((p: PromptResult) => (p.query_text || '').split(' ')))).length,
    responses: prompts.filter((p: PromptResult) => p.response_text && p.response_text.trim() !== '').length,
    visibility: prompts.length > 0
      ? (prompts.filter((p: PromptResult) => p.ranking_position !== null && p.ranking_position !== undefined).length / prompts.length * 100).toFixed(1)
      : '0.0',
    visibilityChange: '0.0', // Placeholder
  };

  // --- Company Mention Percentage ---
  const companyMentionedCount = prompts.filter((p: any) => p.company_mentioned).length;
  const companyMentionedPercent = prompts.length > 0 ? ((companyMentionedCount / prompts.length) * 100).toFixed(1) : '0.0';

  // --- Top Competitor Visibility ---
  // Assume your company is 'HelloBatch' (case-insensitive match)
  const allCompetitors = Array.from(new Set(prompts.flatMap((p: PromptResult) => (p.competitors_list || []))));
  let topCompetitorVisibility = '0.0';
  if (allCompetitors.length > 0 && prompts.length > 0) {
    let max = 0;
    allCompetitors.forEach(comp => {
      // Count how many prompts mention this competitor
      const count = prompts.filter(p => (p.mentioned_companies || []).map(c => c.toLowerCase()).includes(comp.toLowerCase())).length;
      const percent = count / prompts.length * 100;
      if (percent > max) max = percent;
    });
    topCompetitorVisibility = max.toFixed(1);
  }

  // --- Average Ranking ---
  // For HelloBatch only
  const helloBatchRanks = prompts.filter(p => p.company_mentioned && typeof p.ranking_position === 'number').map(p => p.ranking_position as number);
  let averageRankingText = 'N/A';
  if (helloBatchRanks.length > 0) {
    const avg = helloBatchRanks.reduce((a, b) => a + b, 0) / helloBatchRanks.length;
    // Find number of competitors for 'of N'
    const nCompetitors = allCompetitors.length > 0 ? allCompetitors.length : 1;
    averageRankingText = `${avg.toFixed(1)}${nCompetitors ? ` of ${nCompetitors}` : ''}`;
  }

  // --- Competitive Gap ---
  // Your visibility minus top competitor visibility
  const competitiveGap = (parseFloat(companyMentionedPercent) - parseFloat(topCompetitorVisibility)).toFixed(1);

  // --- Top Performing Competitors ---
  // For each competitor, calculate their visibility and mentions, then sort and take top 3
  const topCompetitors = allCompetitors
    .map((name) => {
      const mentions = prompts.filter(p => (p.mentioned_companies || []).map(c => c.toLowerCase()).includes(name.toLowerCase())).length;
      const visibility = prompts.length > 0 ? (mentions / prompts.length * 100).toFixed(1) : '0.0';
      return { name, mentions, visibility };
    })
    .sort((a, b) => parseFloat(b.visibility) - parseFloat(a.visibility))
    .slice(0, 3);

  // --- Main Company Name ---
  const mainCompanyName = prompts.length > 0 ? prompts[0].company_name : 'Company';

  // --- Journey Stage Analysis Data ---
  const journeyStages = Array.from(new Set(prompts.map(p => p.buying_journey_stage).filter((s): s is string => !!s && typeof s === 'string')));
  const journeyStageStats = journeyStages.map(stage => {
    const stagePrompts = prompts.filter(p => (p.buying_journey_stage || '').toLowerCase() === stage.toLowerCase());
    const total = stagePrompts.length;
    const percent = prompts.length > 0 ? (total / prompts.length * 100).toFixed(1) : '0.0';
    const companyMentions = stagePrompts.filter(p => p.company_mentioned).length;
    return { stage, total, percent, companyMentions };
  });

  // --- Competitive Ranking Table Data ---
  const rankingTableData = allCompetitors.map((name: string) => {
    const compPrompts = prompts.filter(p => (p.mentioned_companies || []).map((c: string) => c.toLowerCase()).includes(name.toLowerCase()));
    const visibility = prompts.length > 0 ? (compPrompts.length / prompts.length * 100).toFixed(1) : '0.0';
    const avgPosition = compPrompts.length > 0 ? (compPrompts.reduce((sum, p) => sum + (typeof p.ranking_position === 'number' ? p.ranking_position : 0), 0) / compPrompts.length).toFixed(1) : 'N/A';
    return { name, visibility, avgPosition };
  }).sort((a, b) => parseFloat(b.visibility) - parseFloat(a.visibility));

  // Handler for generating PDF report using Puppeteer API
  const handleGenerateReport = async () => {
    // Get the current dashboard URL
    const url = window.location.origin + window.location.pathname;
    const response = await fetch('/api/generate_report/puppeteer-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      alert('Failed to generate PDF');
      return;
    }
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'dashboard-report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div data-dashboard-root className={isReportMode ? 'min-h-screen bg-white report-mode' : 'min-h-screen bg-gray-100'}>
      <div>
        <main className={isReportMode ? 'p-6 bg-white' : 'p-6 bg-gray-50'}>
          <div className={isReportMode ? '' : 'max-w-7xl mx-auto'}>
            {/* PDF-only header */}
            <div className="report-only mb-4 text-right text-xs text-gray-500">
              Generated on: {reportDate}
            </div>
            {/* Top bar with Generate Report button */}
            {!isReportMode && (
              <div className="flex justify-end mb-4 report-hide">
                <button
                  onClick={handleGenerateReport}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow"
                >
                  Generate Report
                </button>
              </div>
            )}
            {/* Wrap dashboard content in a ref for snapshot */}
            <div ref={dashboardRef}>
              {/* Company Overview Section */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Company Overview</h2>
                  <div className="relative">
                    <select 
                      className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 report-hide"
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                    >
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 report-hide">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Total Queries */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 00-2-2H9z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Queries</dt>
                        <dd className="text-lg font-medium text-gray-900">{prompts.length}</dd>
                      </dl>
                    </div>
                  </div>
                  {/* Buyer Personas */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Buyer Personas</dt>
                        <dd className="text-lg font-medium text-gray-900">{Array.from(new Set(prompts.map(p => p.buyer_persona).filter(Boolean))).length}</dd>
                      </dl>
                    </div>
                  </div>
                  {/* Competitors */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Competitors</dt>
                        <dd className="text-lg font-medium text-gray-900">{Array.from(new Set(prompts.flatMap(p => (p.competitors_list || [])))).length}</dd>
                      </dl>
                    </div>
                  </div>
                  {/* Journey Stages */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Journey Stages</dt>
                        <dd className="text-lg font-medium text-gray-900">{Array.from(new Set(prompts.map(p => p.buying_journey_stage).filter(Boolean))).length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Market Visibility */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Market Visibility</dt>
                        <dd className="text-lg font-medium text-gray-900">{companyMentionedPercent}%</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">vs. Top Competitor: {topCompetitorVisibility}%</div>
                </div>
                {/* Average Ranking */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Average Ranking</dt>
                        <dd className="text-lg font-medium text-gray-900">{averageRankingText}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">Last place position</div>
                </div>
                {/* Total Mentions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Mentions</dt>
                        <dd className="text-lg font-medium text-gray-900">{companyMentionedCount}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">Mention rate: {companyMentionedPercent}%</div>
                </div>
                {/* Competitive Gap */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Competitive Gap</dt>
                        <dd className="text-lg font-medium text-gray-900">{competitiveGap}%</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">Behind market leader</div>
                </div>
              </div>

              {/* Market Visibility Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* HelloBatch Performance */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Visibility Breakdown</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium text-gray-900">{mainCompanyName} Performance</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {averageRankingText !== 'N/A' ? `Rank #${helloBatchRanks.length > 0 ? (Math.round(helloBatchRanks.reduce((a, b) => a + b, 0) / helloBatchRanks.length)) : 'N/A'} of ${allCompetitors.length}` : 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{companyMentionedPercent}%</div>
                        <div className="text-xs text-gray-500">Market Visibility</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{companyMentionedCount}</div>
                        <div className="text-xs text-gray-500">Total Mentions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">{helloBatchRanks.length > 0 ? (helloBatchRanks.reduce((a, b) => a + b, 0) / helloBatchRanks.length).toFixed(1) : 'N/A'}</div>
                        <div className="text-xs text-gray-500">Avg Position</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${companyMentionedPercent}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500">Appears in only {companyMentionedCount} out of {prompts.length} queries analyzed</p>
                  </div>
                  {/* Market Leaders */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Top Performing Competitors</h4>
                    <div className="space-y-3">
                      {topCompetitors.map((comp: { name: string; mentions: number; visibility: string }, idx: number) => (
                        <div key={comp.name} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full mr-3">{idx + 1}</span>
                            <span className="font-medium text-gray-900">{comp.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">{comp.visibility}%</div>
                            <div className="text-xs text-gray-500">{comp.mentions} mentions</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Placeholder for right column (e.g., Journey Stage Analysis) */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Journey Stage Analysis</h3>
                  <div className="space-y-4">
                    {journeyStageStats.map((stat, idx) => (
                      <div key={stat.stage}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">{stat.stage}</span>
                          <span className="text-lg font-semibold text-gray-900">{stat.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${stat.percent}%` }}></div>
                        </div>
                        <div className="text-xs text-gray-500">{stat.percent}% of all queries • {mainCompanyName}: {stat.companyMentions} mentions</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">{companyMentionedPercent}%</div>
                      <div className="text-sm text-gray-600">{mainCompanyName} Recommendation Rate</div>
                      <div className="text-xs text-gray-500 mt-1">{companyMentionedCount} out of {prompts.length} queries resulted in recommendations</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Market Keyword Analysis */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Keyword Analysis</h3>
                  <div className="space-y-4">
                    {words.slice(0, 6).map((word: any, idx: number) => {
                      const percent = words.length > 0 ? ((word.freq / words[0].freq) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={word.word} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="text-lg font-semibold text-gray-900 mr-4">{word.freq}</div>
                            <div>
                              <div className="font-medium text-gray-900">{word.word}</div>
                              <div className="text-xs text-gray-500">{percent}% of total keywords</div>
                            </div>
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">{words.reduce((sum: number, w: any) => sum + w.freq, 0)}</div>
                        <div className="text-xs text-gray-500">Total Keywords</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{words.length}</div>
                        <div className="text-xs text-gray-500">Unique Terms</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{prompts.length > 0 ? (words.reduce((sum: number, w: any) => sum + w.freq, 0) / prompts.length).toFixed(1) : '0.0'}</div>
                        <div className="text-xs text-gray-500">Avg per Query</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* AI Engine Performance Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Engine Performance Breakdown</h3>
                  <div className="space-y-4">
                    {LLM_ENGINES.map((engine) => {
                      const enginePrompts = prompts.filter(p => (p.answer_engine || '').toLowerCase() === engine.key);
                      const mentions = enginePrompts.filter(p => p.company_mentioned).length;
                      const percent = enginePrompts.length > 0 ? (mentions / enginePrompts.length * 100).toFixed(1) : '0.0';
                      return (
                        <div key={engine.key} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-medium text-gray-900">{engine.label}</span>
                            <span className="text-sm text-gray-600">{enginePrompts.length} queries</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-500">{mainCompanyName} Mentions</span>
                            <span className="text-lg font-semibold text-gray-900">{mentions}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{companyMentionedPercent}%</div>
                      <div className="text-sm text-gray-600">Overall AI Engine Visibility</div>
                      <div className="text-xs text-gray-500 mt-1">{companyMentionedCount} mentions across {prompts.length} queries</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Words Analysis */}
              {/* <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Words Analysis</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 report-hide">
                    Export Data
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Word
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Frequency
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sentiment
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Change
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {words.map((word, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{word.word}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{word.freq}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-2 w-16 rounded-full ${index % 3 === 0 ? 'bg-green-500' : index % 3 === 1 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                              <span className="ml-2 text-sm text-gray-500">{word.sentiment}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center ${index % 2 === 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d={index % 2 === 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
                                />
                              </svg>
                              <span>{}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div> */}

              {/* Competitor Analysis */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Competitive Ranking Analysis</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rankingTableData.map((row: { name: string; visibility: string; avgPosition: string }, idx: number) => {
                        // Status logic based on rank
                        let status = '';
                        let statusClass = '';
                        if (idx === 0) { status = 'Leading'; statusClass = 'bg-green-100 text-green-800'; }
                        else if (idx === 1) { status = 'Strong'; statusClass = 'bg-green-100 text-green-800'; }
                        else if (idx === 2) { status = 'Competitive'; statusClass = 'bg-blue-100 text-blue-800'; }
                        else if (idx === 3) { status = 'Competitive'; statusClass = 'bg-blue-100 text-blue-800'; }
                        else if (idx === 4) { status = 'Moderate'; statusClass = 'bg-yellow-100 text-yellow-800'; }
                        else if (idx === 5) { status = 'Moderate'; statusClass = 'bg-yellow-100 text-yellow-800'; }
                        else if (idx === rankingTableData.length - 2) { status = 'Low'; statusClass = 'bg-orange-100 text-orange-800'; }
                        else { status = 'Critical'; statusClass = 'bg-red-100 text-red-800'; }
                        const isMain = row.name === mainCompanyName;
                        return (
                          <tr key={row.name} className={isMain ? 'bg-red-50' : idx % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{idx + 1}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isMain ? 'font-bold text-red-700' : 'text-gray-900'}`}>{row.name}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isMain ? 'font-bold text-red-700' : 'text-gray-900'}`}>{row.visibility}%</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isMain ? 'font-bold text-red-700' : 'text-gray-900'}`}>{row.avgPosition}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>{status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 