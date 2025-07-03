'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
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
import { COMPETITORS } from '../api/generate_report/analyze/route';
import { PromptResult } from '@/types/PromptResult';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

  // Handler for generating PDF report
  const handleGenerateReport = async () => {
    document.body.classList.add('report-mode');
    if (!dashboardRef.current) return;
    // Use html2canvas to capture the dashboard
    const canvas = await html2canvas(dashboardRef.current, { useCORS: true, scale: 2 });
    document.body.classList.remove('report-mode');
    const imgData = canvas.toDataURL('image/png');
    // Dynamically set PDF size to match canvas aspect ratio
    // 1 px = 0.75 pt (1 pt = 1.333 px)
    const pdfWidth = canvas.width * 0.75;
    const pdfHeight = canvas.height * 0.75;
    const pdf = new jsPDF({ orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait', unit: 'pt', format: [pdfWidth, pdfHeight] });
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('dashboard-report.pdf');
  };

  return (
    <div className="min-h-screen">
      {/* Main content area - needs to be positioned to the right of the sidebar */}
      <div>
        <main className="p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* PDF-only header */}
            <div className="report-only mb-4 text-right text-xs text-gray-500">
              Generated on: {reportDate}
            </div>
            {/* Top bar with Generate Report button */}
            <div className="flex justify-end mb-4 report-hide">
              <button
                onClick={handleGenerateReport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow"
              >
                Generate Report
              </button>
            </div>
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
                    <div className="hidden report-mode:block text-sm font-medium text-gray-700 border border-gray-300 rounded-md py-2 pl-3 pr-10 bg-white" style={{position: 'absolute', top: 0, right: 0, minWidth: '100px'}}>
                      {timeRange}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 report-hide">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

       
        
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left side - Metrics */}
                  <div className="space-y-6">
                    {/* BUYING JOURNEY */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Buying Journey</h3>
                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center report-hide">
                          <span className="text-xs text-gray-500">i</span>
                        </div>
                      </div>
                      <div className="rounded-md border border-gray-200">
                        <div className="grid grid-cols-3 divide-x divide-gray-200">
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Questions</div>
                            <div className="text-2xl font-bold">{buyingJourneyMetrics.questions}</div>
                          </div>
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Responses</div>
                            <div className="text-2xl font-bold">{buyingJourneyMetrics.responses}</div>
                          </div>
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Visibility</div>
                            <div className="flex items-center">
                              <div className="text-2xl font-bold text-red-500">{buyingJourneyMetrics.visibility}%</div>
                              <div className="ml-2 flex items-center text-green-500 text-sm">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                </svg>
                                {buyingJourneyMetrics.visibilityChange}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TOPIC ANALYSIS */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Topic Analysis</h3>
                      </div>
                      <div className="rounded-md border border-gray-200">
                        <div className="grid grid-cols-3 divide-x divide-gray-200">
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Questions</div>
                            <div className="text-2xl font-bold">{topicAnalysisMetrics.questions}</div>
                          </div>
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Responses</div>
                            <div className="text-2xl font-bold">{topicAnalysisMetrics.responses}</div>
                          </div>
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Visibility</div>
                            <div className="flex items-center">
                              <div className="text-2xl font-bold text-red-500">{topicAnalysisMetrics.visibility}%</div>
                              <div className="ml-2 flex items-center text-red-500 text-sm">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
                                </svg>
                                {topicAnalysisMetrics.visibilityChange}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* INSIGHTS */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Key Insights</h3>
                      </div>
                      <div className="rounded-md border border-gray-200">
                        <div className="grid grid-cols-3 divide-x divide-gray-200">
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Terms</div>
                            <div className="text-2xl font-bold">{keyInsightsMetrics.terms}</div>
                          </div>
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Responses</div>
                            <div className="text-2xl font-bold">{keyInsightsMetrics.responses}</div>
                          </div>
                          <div className="p-4">
                            <div className="text-sm text-gray-500">Visibility</div>
                            <div className="flex items-center">
                              <div className="text-2xl font-bold text-red-500">{keyInsightsMetrics.visibility}%</div>
                              <div className="ml-2 flex items-center text-red-500 text-sm">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
                                </svg>
                                {keyInsightsMetrics.visibilityChange}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Chart */}
                  <div className="bg-white rounded-md border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-500 uppercase">Buying Journey</h3>
                          <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center report-hide">
                            <span className="text-xs text-gray-500">i</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            className={`px-3 py-1 text-sm rounded-md report-hide ${chartMode === 'Brand Visibility' ? 'bg-gray-100' : 'text-gray-500'}`}
                            onClick={() => setChartMode('Brand Visibility')}
                          >
                            Brand Visibility
                          </button>
                          <button 
                            className={`px-3 py-1 text-sm rounded-md report-hide ${chartMode === 'Avg. Position' ? 'bg-gray-100' : 'text-gray-500'}`}
                            onClick={() => setChartMode('Avg. Position')}
                          >
                            Avg. Position
                          </button>
                          <button 
                            className={`px-3 py-1 text-sm rounded-md report-hide ${chartMode === 'Avg. Sentiment' ? 'bg-gray-100' : 'text-gray-500'}`}
                            onClick={() => setChartMode('Avg. Sentiment')}
                          >
                            Avg. Sentiment
                          </button>
                          <button 
                            className={`px-3 py-1 text-sm rounded-md report-hide ${chartMode === 'Feature Score' ? 'bg-gray-100' : 'text-gray-500'}`}
                            onClick={() => setChartMode('Feature Score')}
                          >
                            Feature Score
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-sm text-gray-500 mb-2">Percentage of responses that mention your company</div>
                      <div className="flex justify-end mb-4">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Full Range</span>
                          <label className="inline-flex items-center cursor-pointer report-hide">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={autoScale}
                              onChange={() => setAutoScale(!autoScale)}
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>
                      </div>

                      {/* Recharts Graph */}
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis
                              domain={autoScale ? ['auto', 'auto'] : [0, 100]}
                              tickFormatter={(tick) => `${tick}%`}
                            />
                            <Tooltip formatter={(value: any) => [`${value}%`, 'Visibility']} />
                            {LLM_ENGINES.map(({ key, label, color }) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={label}
                                stroke={color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                              />
                            ))}
                            <Legend />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Words Analysis */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
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
              </div>

              {/* Competitor Analysis */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Competitor Analysis</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Competitor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visibility
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Change
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Position
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sentiment Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Feature Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {competitorStats.map((competitor, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{competitor.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{competitor.visibility}%</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center ${competitor.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d={competitor.change > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
                                />
                              </svg>
                              <span>{Math.abs(competitor.change)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{competitor.position}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-2 w-16 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                              <span className="ml-2 text-sm text-gray-500">{competitor.sentiment}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{competitor.feature}</td>
                        </tr>
                      ))}
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

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
}

function StatCard({ title, value, change, positive }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className={`flex items-center text-sm ${positive ? 'text-green-500' : 'text-red-500'}`}>
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d={positive 
            ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" 
            : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"} 
            clipRule="evenodd">
          </path>
        </svg>
        {change}
      </div>
    </div>
  );
} 