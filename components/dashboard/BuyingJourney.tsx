'use client';

import React from 'react';
import { PromptResult } from '@/types/PromptResult';

// Interface for props
interface BuyingJourneyProps {
  prompts: PromptResult[];
}

const BuyingJourney: React.FC<BuyingJourneyProps> = ({ prompts }) => {
  // Filter top-of-funnel queries (problem_exploration, solution_education)
  const topFunnelPrompts = prompts.filter((p) =>
    ['problem_exploration', 'solution_education'].some((stage) =>
      (p.buying_journey_stage || '').toLowerCase().includes(stage)
    )
  ); 

  // Calculate metrics for current day
  const brandVisibility = topFunnelPrompts.length > 0
    ? (topFunnelPrompts.filter((p) => p.company_mentioned).length / topFunnelPrompts.length * 100).toFixed(1)
    : '0.0';
  const avgSentiment = topFunnelPrompts.length > 0
    ? (topFunnelPrompts.reduce((sum, p) => sum + (typeof p.sentiment_score === 'number' && !isNaN(p.sentiment_score) ? p.sentiment_score : 0), 0) / topFunnelPrompts.length * 100).toFixed(1)
    : '0.0';
  const avgPosition = topFunnelPrompts.length > 0
    ? (topFunnelPrompts.filter((p) => typeof p.ranking_position === 'number' && !isNaN(p.ranking_position)).reduce((sum, p) => sum + (p.ranking_position as number), 0) / topFunnelPrompts.filter((p) => typeof p.ranking_position === 'number' && !isNaN(p.ranking_position)).length || 0).toFixed(1)
    : 'N/A';
  const featureScore = prompts.length > 0
    ? (prompts.filter((p) => p.recommended).length / prompts.length * 100).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Buying Journey: Top of Funnel</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Brand Visibility</dt>
              <dd className="text-lg font-medium text-gray-900">{brandVisibility}%</dd>
              <dd className="text-xs text-gray-500">In {topFunnelPrompts.length} queries</dd>
            </dl>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Avg. Position</dt>
              <dd className="text-lg font-medium text-gray-900">{avgPosition}</dd>
              <dd className="text-xs text-gray-500">Across mentions</dd>
            </dl>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Avg. Sentiment</dt>
              <dd className="text-lg font-medium text-gray-900">{avgSentiment}%</dd>
              <dd className="text-xs text-gray-500">Across mentions</dd>
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
              <dt className="text-sm font-medium text-gray-500 truncate">Feature Score</dt>
              <dd className="text-lg font-medium text-gray-900">{featureScore}%</dd>
              <dd className="text-xs text-gray-500">Feature mentions</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyingJourney;