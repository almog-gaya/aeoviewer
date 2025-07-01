'use client';

import { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Mar 1 - Mar 7', value: 42, alerts: 5 },
  { name: 'Apr 5 - Apr 11', value: 38, alerts: 3 },
  { name: 'May 3 - May 9', value: 45, alerts: 7 },
  { name: 'May 24 - May 30', value: 52, alerts: 2 },
  { name: 'Jun 7 - Jun 13', value: 48, alerts: 4 },
  { name: 'Jun 21 - Jun 27', value: 50, alerts: 6 },
];

const alertsData = [
  { id: 1, time: '08:45 AM', engine: 'Gemini', query: 'cloud security posture management', status: 'Missing' },
  { id: 2, time: '09:12 AM', engine: 'Claude', query: 'best cloud security platform', status: 'Dropped' },
  { id: 3, time: '10:30 AM', engine: 'ChatGPT', query: 'orca security vs wiz', status: 'Missing' },
  { id: 4, time: '11:15 AM', engine: 'Perplexity', query: 'cloud workload protection', status: 'Dropped' },
  { id: 5, time: '01:22 PM', engine: 'SearchGPT', query: 'container security solutions', status: 'Missing' },
];

export default function MonitoringPage() {
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [alertFilter, setAlertFilter] = useState('All');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Real-time Insights</h1>
        <div className="relative">
          <select 
            className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase">Visibility Score</h2>
            <span className="text-green-600 text-sm font-medium">↑ 4.2%</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">86.5%</div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '86.5%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase">Active Monitors</h2>
            <span className="text-blue-600 text-sm font-medium">12 Queries</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">5 Engines</div>
          <div className="mt-4 flex space-x-2">
            <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
              <span className="text-xs font-medium text-pink-800">G</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-800">C</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-xs font-medium text-green-800">P</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase">Alerts</h2>
            <span className="text-red-600 text-sm font-medium">↑ 3 New</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">5 Active</div>
          <div className="mt-4 flex space-x-2">
            <div className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              3 Missing
            </div>
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              2 Dropped
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Visibility Trend</h2>
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
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Visibility"
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Key Terms Activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="alerts" 
                  name="Term Usage"
                  stroke="#EF4444" 
                  fill="#FEE2E2" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Top Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Important Insights</h2>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                alertFilter === 'All' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setAlertFilter('All')}
            >
              All
            </button>
            <button 
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                alertFilter === 'Missing' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setAlertFilter('Missing')}
            >
              Missing
            </button>
            <button 
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                alertFilter === 'Dropped' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
              }`}
              onClick={() => setAlertFilter('Dropped')}
            >
              Dropped
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engine
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Query
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alertsData
                .filter(alert => alertFilter === 'All' || alert.status === alertFilter)
                .map((alert) => (
                <tr key={alert.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                      {alert.engine}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {alert.query}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                      alert.status === 'Missing' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">Investigate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 