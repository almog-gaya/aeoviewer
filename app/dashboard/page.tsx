'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PromptResult } from '@/types/PromptResult';
import { LLM_ENGINES, STOP_WORDS } from '@/lib/constants';
import nlp from 'compromise';
import BuyingJourney from '@/components/dashboard/BuyingJourney';
 
interface Topic {
  word: string;
  freq: number;
  sentiment: string | number;
}

interface CompetitorStat {
  name: string;
  visibility: string;
  change: number;
  position: string | number;
  sentiment: string | number;
  feature: string | number;
}

interface ChartData {
  name: string;
  [key: string]: string | number;
}

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Weekly'); 
  const [prompts, setPrompts] = useState<PromptResult[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [words, setWords] = useState<Topic[]>([]);
  const [competitorStats, setCompetitorStats] = useState<CompetitorStat[]>([]);
  const [reportDate, setReportDate] = useState('');
  const [isReportMode, setIsReportMode] = useState(false);

  const dashboardRef = React.useRef<HTMLDivElement>(null);

  const fetchDashboardData = async () => {
    const response = await fetch('/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    setPrompts(await response.json());
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);
 

  // Memoized calculations
  const stop_words = useMemo(() => Array.from(STOP_WORDS), [STOP_WORDS]);

  const chartDataMemo = useMemo(() => {
    if (prompts.length === 0) return [];
    const entry: ChartData = { name: 'All Data' };
    LLM_ENGINES.forEach(({ key }) => {
      const llmPrompts = prompts.filter((p) => (p.answer_engine || '').toLowerCase() === key);
      const visible = llmPrompts.filter((p) => p.company_mentioned).length;
      entry[key] = llmPrompts.length > 0 ? (visible / llmPrompts.length) * 100 : 0;
    });
    return [entry];
  }, [prompts, LLM_ENGINES]);

  const topicArr = useMemo(() => {
    if (prompts.length === 0) return [];
    const topicMap: Record<string, { freq: number; sentiment: number[] }> = {};
    prompts.forEach((p) => {
      const allText = `${p.query_text || ''} ${p.response_text || ''}`.toLowerCase();
      const doc = nlp(allText);

      const compromiseTerms = [
        ...doc.topics().out('array'), // Entities like "Microsoft", "New York"
        ...doc.nouns().out('array'),
      ].filter(
        (term: string) =>
          term.length >= 3 &&
          !stop_words.some((w: string) => term.toLowerCase().includes(w)) &&
          !/^\d+$/.test(term)
      );

      const words = allText
        .split(/\W+/)
        .filter((w) => w && w.length >= 3 && !stop_words.includes(w.toLowerCase()));
      const bigrams = words
        .slice(0, -1)
        .map((_, i) => {
          const bigram = `${words[i]} ${words[i + 1]}`;
          return !bigram.split(' ').some((w) => stop_words.includes(w.toLowerCase())) ? bigram : null;
        })
        .filter((bg): bg is string => bg !== null);

      const terms = [...new Set([...compromiseTerms, ...bigrams])].filter((term) => term.includes(' '));

      terms.forEach((term: string) => {
        if (!topicMap[term]) {
          topicMap[term] = { freq: 0, sentiment: [] };
        }
        topicMap[term].freq += 1;
        if (typeof p.sentiment_score === 'number' && !isNaN(p.sentiment_score)) {
          topicMap[term].sentiment.push(p.sentiment_score);
        }
      });
    });

    return Object.entries(topicMap)
      .map(([topic, { freq, sentiment }]) => ({
        word: topic,
        freq,
        sentiment: sentiment.length > 0 ? (sentiment.reduce((a, b) => a + b, 0) / sentiment.length).toFixed(2) : 'N/A',
      }))
      .sort((a, b) => b.freq - a.freq)
      .filter((item) => item.freq >= 2)
      .slice(0, 20);
  }, [prompts, stop_words]);

  const compStatsArr = useMemo(() => {
    if (prompts.length === 0) return [];
    const companyNames = prompts[0]?.competitors_list || [];
    return companyNames.map((comp) => {
      const compPrompts = prompts.filter((p) => {
        const inMentioned = (p.mentioned_companies || []).includes(comp);
        const inList = (p.competitors_list || []).includes(comp);
        const inRank = p.rank_list && p.rank_list.toLowerCase().includes(comp.toLowerCase());
        return inMentioned || inList || inRank;
      });
      const visibility = compPrompts.length > 0
        ? (compPrompts.filter((p) => p.ranking_position != null).length / compPrompts.length) * 100
        : 0;
      const avgPosition = compPrompts.length > 0
        ? (compPrompts.reduce((sum, p) => sum + (typeof p.ranking_position === 'number' && !isNaN(p.ranking_position) ? p.ranking_position : 0), 0) / compPrompts.length).toFixed(2)
        : 'N/A';
      const avgSentiment = compPrompts.length > 0
        ? (compPrompts.reduce((sum, p) => sum + (typeof p.sentiment_score === 'number' && !isNaN(p.sentiment_score) ? p.sentiment_score : 0), 0) / compPrompts.length).toFixed(2)
        : 'N/A';
      const featureScore = compPrompts.length > 0
        ? (compPrompts.filter((p) => p.recommended).length / compPrompts.length * 5).toFixed(2)
        : 'N/A';
      return {
        name: comp,
        visibility: visibility.toFixed(1),
        change: 0,
        position: avgPosition,
        sentiment: avgSentiment,
        feature: featureScore,
      };
    });
  }, [prompts]);

  useEffect(() => {
    setChartData(chartDataMemo);
    setWords(topicArr);
    setCompetitorStats(compStatsArr);
  }, [chartDataMemo, topicArr, compStatsArr]);

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

  // Helper functions
  function getMetricsByStage(stageKeywords: string[]) {
    if (!prompts || prompts.length === 0 || !stageKeywords || stageKeywords.length === 0)
      return { questions: 0, responses: 0, visibility: '0.0', visibilityChange: '0.0' };
    const filtered = prompts.filter((p: PromptResult) =>
      stageKeywords.some((keyword: string) => (p.buying_journey_stage || '').toLowerCase().includes(keyword))
    );
    return {
      questions: filtered.length,
      responses: filtered.filter((p: PromptResult) => p.response_text && p.response_text.trim() !== '').length,
      visibility: filtered.length > 0
        ? (filtered.filter((p: PromptResult) => p.ranking_position !== null && p.ranking_position !== undefined).length / filtered.length * 100).toFixed(1)
        : '0.0',
      visibilityChange: '0.0',
    };
  }

  // const buyingJourneyMetrics = getMetricsByStage(['buying', 'solution']);
  // const topicAnalysisMetrics = getMetricsByStage(['topic', 'problem']);
  // const keyInsightsMetrics = {
  //   terms: Array.from(new Set(prompts.flatMap((p: PromptResult) => (p.query_text || '').split(' ')))).length,
  //   responses: prompts.filter((p: PromptResult) => p.response_text && p.response_text.trim() !== '').length,
  //   visibility: prompts.length > 0
  //     ? (prompts.filter((p: PromptResult) => p.ranking_position !== null && p.ranking_position !== undefined).length / prompts.length * 100).toFixed(1)
  //     : '0.0',
  //   visibilityChange: '0.0',
  // };

  const companyMentionedCount = prompts.filter((p: PromptResult) => p.company_mentioned).length;
  const companyMentionedPercent = prompts.length > 0 ? ((companyMentionedCount / prompts.length) * 100).toFixed(1) : '0.0';

  const allCompetitors = Array.from(new Set(prompts.flatMap((p: PromptResult) => p.competitors_list || [])));
  let topCompetitorVisibility = '0.0';
  if (allCompetitors.length > 0 && prompts.length > 0) {
    let max = 0;
    allCompetitors.forEach((comp) => {
      const count = prompts.filter((p) => (p.mentioned_companies || []).map((c) => c.toLowerCase()).includes(comp.toLowerCase())).length;
      const percent = (count / prompts.length) * 100;
      if (percent > max) max = percent;
    });
    topCompetitorVisibility = max.toFixed(1);
  }

  const helloBatchRanks = prompts.filter((p) => p.company_mentioned && typeof p.ranking_position === 'number').map((p) => p.ranking_position as number);
  let averageRankingText = 'N/A';
  if (helloBatchRanks.length > 0) {
    const avg = helloBatchRanks.reduce((a, b) => a + b, 0) / helloBatchRanks.length;
    const nCompetitors = allCompetitors.length > 0 ? allCompetitors.length : 1;
    averageRankingText = `${avg.toFixed(1)}${nCompetitors ? ` of ${nCompetitors}` : ''}`;
  }

  const competitiveGap = (parseFloat(companyMentionedPercent) - parseFloat(topCompetitorVisibility)).toFixed(1);

  const topCompetitors = allCompetitors
    .map((name) => {
      const mentions = prompts.filter((p) => (p.mentioned_companies || []).map((c) => c.toLowerCase()).includes(name.toLowerCase())).length;
      const visibility = prompts.length > 0 ? (mentions / prompts.length * 100).toFixed(1) : '0.0';
      return { name, mentions, visibility };
    })
    .sort((a, b) => parseFloat(b.visibility) - parseFloat(a.visibility))
    .slice(0, 5);

  const mainCompanyName = prompts.length > 0 ? prompts[0].company_name : 'Company';

  const journeyStages = Array.from(new Set(prompts.map((p) => p.buying_journey_stage).filter((s): s is string => !!s && typeof s === 'string')));
  const journeyStageStats = journeyStages.map((stage) => {
    const stagePrompts = prompts.filter((p) => (p.buying_journey_stage || '').toLowerCase() === stage.toLowerCase());
    const total = stagePrompts.length;
    const percent = prompts.length > 0 ? (total / prompts.length * 100).toFixed(1) : '0.0';
    const companyMentions = stagePrompts.filter((p) => p.company_mentioned).length;
    return { stage, total, percent, companyMentions };
  });

  const rankingTableData = allCompetitors
    .map((name: string) => {
      const compPrompts = prompts.filter((p) => (p.mentioned_companies || []).map((c: string) => c.toLowerCase()).includes(name.toLowerCase()));
      const visibility = prompts.length > 0 ? (compPrompts.length / prompts.length * 100).toFixed(1) : '0.0';
      const avgPosition = compPrompts.length > 0
        ? (compPrompts.reduce((sum, p) => sum + (typeof p.ranking_position === 'number' ? p.ranking_position : 0), 0) / compPrompts.length).toFixed(1)
        : 'N/A';
      return { name, visibility, avgPosition };
    })
    .sort((a, b) => parseFloat(b.visibility) - parseFloat(a.visibility));

  const handleGenerateReport = async () => {
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
            <div className="report-only mb-4 text-right text-xs text-gray-500">Generated on: {reportDate}</div>
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
            <div ref={dashboardRef}>
             
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
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2a2 2 0 00-2 2H9z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Queries</dt>
                        <dd className="text-lg font-medium text-gray-900">{prompts.length}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Buyer Personas</dt>
                        <dd className="text-lg font-medium text-gray-900">{Array.from(new Set(prompts.map((p) => p.buyer_persona).filter(Boolean))).length}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Competitors</dt>
                        <dd className="text-lg font-medium text-gray-900">{Array.from(new Set(prompts.flatMap((p) => p.competitors_list || []))).length}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Journey Stages</dt>
                        <dd className="text-lg font-medium text-gray-900">{Array.from(new Set(prompts.map((p) => p.buying_journey_stage).filter(Boolean))).length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <BuyingJourney prompts={prompts} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                        />
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
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 20">
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Visibility Breakdown</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-medium text-gray-900">{mainCompanyName} Performance</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {averageRankingText !== 'N/A'
                          ? `Rank #${helloBatchRanks.length > 0 ? Math.round(helloBatchRanks.reduce((a, b) => a + b, 0) / helloBatchRanks.length) : 'N/A'} of ${allCompetitors.length}`
                          : 'N/A'}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Keyword Analysis</h3>
                  <div className="space-y-4">
                    {words.length > 0 ? (
                      words.slice(0, 6).map((word: Topic, idx: number) => {
                        const totalFreq = words.reduce((sum, w) => sum + w.freq, 0);
                        const percent = totalFreq > 0 ? ((word.freq / totalFreq) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={word.word} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center">
                              <div className="text-lg font-semibold text-gray-900 mr-4">{word.freq}</div>
                              <div>
                                <div className="font-medium text-gray-900">{word.word}</div>
                                <div className="text-xs text-gray-500">{percent}% of total mentions</div>
                              </div>
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">No keywords available</p>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">{words.reduce((sum: number, w: Topic) => sum + w.freq, 0)}</div>
                        <div className="text-xs text-gray-500">Total Mentions</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{words.length}</div>
                        <div className="text-xs text-gray-500">Unique Terms</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{prompts.length > 0 ? (words.reduce((sum: number, w: Topic) => sum + w.freq, 0) / prompts.length).toFixed(1) : '0.0'}</div>
                        <div className="text-xs text-gray-500">Avg per Query</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Engine Performance Breakdown</h3>
                  <div className="space-y-4">
                    {LLM_ENGINES.map((engine) => {
                      const enginePrompts = prompts.filter((p) => (p.answer_engine || '').toLowerCase() === engine.key);
                      const mentions = enginePrompts.filter((p) => p.company_mentioned).length;
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
                        let status = '';
                        let statusClass = '';
                        if (idx === 0) {
                          status = 'Leading';
                          statusClass = 'bg-green-100 text-green-800';
                        } else if (idx === 1) {
                          status = 'Strong';
                          statusClass = 'bg-green-100 text-green-800';
                        } else if (idx === 2 || idx === 3) {
                          status = 'Competitive';
                          statusClass = 'bg-blue-100 text-blue-800';
                        } else if (idx === 4 || idx === 5) {
                          status = 'Moderate';
                          statusClass = 'bg-yellow-100 text-yellow-800';
                        } else if (idx === rankingTableData.length - 2) {
                          status = 'Low';
                          statusClass = 'bg-orange-100 text-orange-800';
                        } else {
                          status = 'Critical';
                          statusClass = 'bg-red-100 text-red-800';
                        }
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
};

export default Dashboard;