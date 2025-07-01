'use client';

import React, { useState } from 'react';
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

const data = [
  { name: 'Mar 1 - Mar 7', gemini: 30, searchGPT: 15, claude: 25, chatGPT: 40, perplexity: 20, copilot: 10 },
  { name: 'Apr 5 - Apr 11', gemini: 40, searchGPT: 25, claude: 30, chatGPT: 20, perplexity: 35, copilot: 15 },
  { name: 'May 3 - May 9', gemini: 20, searchGPT: 30, claude: 40, chatGPT: 35, perplexity: 25, copilot: 30 },
  { name: 'May 24 - May 30', gemini: 30, searchGPT: 15, claude: 45, chatGPT: 25, perplexity: 35, copilot: 20 },
  { name: 'Jun 7 - Jun 13', gemini: 35, searchGPT: 20, claude: 30, chatGPT: 40, perplexity: 15, copilot: 25 },
  { name: 'Jun 21 - Jun 27', gemini: 25, searchGPT: 35, claude: 20, chatGPT: 30, perplexity: 40, copilot: 15 },
];

const competitors = [
  { name: 'Orca Security', visibility: 28.6, change: 2.8, position: 2.4, sentiment: 4.2, feature: 3.8 },
  { name: 'Wiz', visibility: 32.1, change: -1.2, position: 1.8, sentiment: 4.5, feature: 4.0 },
  { name: 'Palo Alto Networks', visibility: 24.3, change: 1.5, position: 2.7, sentiment: 3.9, feature: 3.5 },
  { name: 'Check Point', visibility: 18.7, change: -0.8, position: 3.2, sentiment: 3.6, feature: 3.2 },
  { name: 'CrowdStrike', visibility: 22.5, change: 2.1, position: 2.5, sentiment: 4.1, feature: 3.7 },
];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('Weekly');
  const [chartMode, setChartMode] = useState('Brand Visibility');
  const [autoScale, setAutoScale] = useState(true);
  const [activeTab, setActiveTab] = useState('share');

  return (
    <div className="min-h-screen">
      {/* Main content area - needs to be positioned to the right of the sidebar */}
      <div>
        <main className="p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Company Overview Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Company Overview</h2>
                <div className="relative">
                  <select 
                    className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Link to monitoring */}
              <div className="mb-5">
                <Link href="/dashboard/monitoring" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View real-time monitoring
                </Link>
              </div>
    
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left side - Metrics */}
                <div className="space-y-6">
                  {/* BUYING JOURNEY */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-sm font-medium text-gray-500 uppercase">Buying Journey</h3>
                      <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-500">i</span>
                      </div>
                    </div>
                    <div className="rounded-md border border-gray-200">
                      <div className="grid grid-cols-3 divide-x divide-gray-200">
                        <div className="p-4">
                          <div className="text-sm text-gray-500">Questions</div>
                          <div className="text-2xl font-bold">75</div>
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-gray-500">Responses</div>
                          <div className="text-2xl font-bold">6,364</div>
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-gray-500">Visibility</div>
                          <div className="flex items-center">
                            <div className="text-2xl font-bold text-red-500">28.6%</div>
                            <div className="ml-2 flex items-center text-green-500 text-sm">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                              </svg>
                              2.8%
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
                          <div className="text-2xl font-bold">30</div>
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-gray-500">Responses</div>
                          <div className="text-2xl font-bold">1,650</div>
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-gray-500">Visibility</div>
                          <div className="flex items-center">
                            <div className="text-2xl font-bold text-red-500">6.1%</div>
                            <div className="ml-2 flex items-center text-red-500 text-sm">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
                              </svg>
                              2.2%
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
                          <div className="text-2xl font-bold">111</div>
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-gray-500">Responses</div>
                          <div className="text-2xl font-bold">463</div>
                        </div>
                        <div className="p-4">
                          <div className="text-sm text-gray-500">Visibility</div>
                          <div className="flex items-center">
                            <div className="text-2xl font-bold text-red-500">15.4%</div>
                            <div className="ml-2 flex items-center text-red-500 text-sm">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
                              </svg>
                              21.5%
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
                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-500">i</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className={`px-3 py-1 text-sm rounded-md ${chartMode === 'Brand Visibility' ? 'bg-gray-100' : 'text-gray-500'}`}
                          onClick={() => setChartMode('Brand Visibility')}
                        >
                          Brand Visibility
                        </button>
                        <button 
                          className={`px-3 py-1 text-sm rounded-md ${chartMode === 'Avg. Position' ? 'bg-gray-100' : 'text-gray-500'}`}
                          onClick={() => setChartMode('Avg. Position')}
                        >
                          Avg. Position
                        </button>
                        <button 
                          className={`px-3 py-1 text-sm rounded-md ${chartMode === 'Avg. Sentiment' ? 'bg-gray-100' : 'text-gray-500'}`}
                          onClick={() => setChartMode('Avg. Sentiment')}
                        >
                          Avg. Sentiment
                        </button>
                        <button 
                          className={`px-3 py-1 text-sm rounded-md ${chartMode === 'Feature Score' ? 'bg-gray-100' : 'text-gray-500'}`}
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
                        <label className="inline-flex items-center cursor-pointer">
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
                          data={data}
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
                            domain={autoScale ? ['auto', 'auto'] : [0, 65]}
                            tickFormatter={(tick) => `${tick}%`}
                          />
                          <Tooltip formatter={(value) => [`${value}%`, 'Visibility']} />
                          <Line type="monotone" dataKey="gemini" stroke="#E91E63" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="searchGPT" stroke="#673AB7" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="claude" stroke="#2196F3" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="chatGPT" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="perplexity" stroke="#FF9800" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="copilot" stroke="#9C27B0" strokeWidth={2} dot={{ r: 4 }} />
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
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
                    {['security', 'cloud', 'visibility', 'AI', 'detection'].map((word, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{word}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(Math.random() * 500) + 100}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-2 w-16 rounded-full ${index % 3 === 0 ? 'bg-green-500' : index % 3 === 1 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                            <span className="ml-2 text-sm text-gray-500">{(Math.random() * 5).toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${index % 2 === 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d={index % 2 === 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
                              />
                            </svg>
                            <span>{(Math.random() * 10).toFixed(1)}%</span>
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
                    {competitors.map((competitor, index) => (
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