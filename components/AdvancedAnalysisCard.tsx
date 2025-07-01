'use client';

import { useState } from 'react';

interface AdvancedAnalysisProps {
  analysis: {
    brandAnalysis: any;
    competitorAnalysis: any[];
    sentimentAnalysis: any;
    positionAnalysis: any;
    topicAnalysis: any;
    accuracyFlags: any[];
    readabilityScore: any;
    keyPhrases: string[];
    entityExtraction: any;
  };
  engineName: string;
}

export default function AdvancedAnalysisCard({ analysis, engineName }: AdvancedAnalysisProps) {
  const [activeTab, setActiveTab] = useState('sentiment');

  if (!analysis) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-500 text-sm">Advanced analysis not available</p>
      </div>
    );
  }

  const tabs = [
    { id: 'sentiment', label: 'Sentiment', icon: '😊' },
    { id: 'position', label: 'Position', icon: '📍' },
    { id: 'topics', label: 'Topics', icon: '🏷️' },
    { id: 'accuracy', label: 'Accuracy', icon: '✅' },
    { id: 'entities', label: 'Entities', icon: '🏢' }
  ];

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Advanced Analysis - {engineName}
        </h3>
        <div className="flex space-x-4 mt-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'sentiment' && (
          <SentimentTab analysis={analysis.sentimentAnalysis} brandAnalysis={analysis.brandAnalysis} />
        )}
        {activeTab === 'position' && (
          <PositionTab analysis={analysis.positionAnalysis} />
        )}
        {activeTab === 'topics' && (
          <TopicsTab analysis={analysis.topicAnalysis} keyPhrases={analysis.keyPhrases} />
        )}
        {activeTab === 'accuracy' && (
          <AccuracyTab flags={analysis.accuracyFlags} readability={analysis.readabilityScore} />
        )}
        {activeTab === 'entities' && (
          <EntitiesTab entities={analysis.entityExtraction} />
        )}
      </div>
    </div>
  );
}

function SentimentTab({ analysis, brandAnalysis }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Overall Sentiment</h4>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(analysis?.overall?.label)}`}>
              {analysis?.overall?.label || 'neutral'}
            </span>
            <span className="text-sm text-gray-600">
              Score: {analysis?.overall?.score?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Brand-Specific</h4>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(analysis?.brandSpecific?.label)}`}>
              {analysis?.brandSpecific?.label || 'neutral'}
            </span>
            <span className="text-sm text-gray-600">
              Confidence: {analysis?.brandSpecific?.confidence?.toFixed(1) || '0.0'}%
            </span>
          </div>
        </div>
      </div>

      {brandAnalysis?.mentions && brandAnalysis.mentions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Brand Mentions Context</h4>
          <div className="space-y-2">
            {brandAnalysis.mentions.slice(0, 3).map((mention: any, index: number) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Position: {mention.position}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getSentimentColor(mention.sentiment)}`}>
                    {mention.sentiment}
                  </span>
                </div>
                <p className="text-sm text-gray-700">"...{mention.context}..."</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis?.emotionalTone && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Emotional Tone</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(analysis.emotionalTone).map(([emotion, count]: [string, any]) => (
              <div key={emotion} className="text-center p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{emotion}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PositionTab({ analysis }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analysis?.brandRanking || 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Brand Ranking</div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">
            {analysis?.firstMentionPosition || 'N/A'}
          </div>
          <div className="text-sm text-gray-600">First Mention Position</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analysis?.mentionDensity?.mentionsPerWord?.toFixed(4) || 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Mentions per Word</div>
        </div>
      </div>

      {analysis?.mentionDensity?.distribution && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Mention Distribution</h4>
          <div className="grid grid-cols-4 gap-2">
            {analysis.mentionDensity.distribution.map((section: any, index: number) => (
              <div key={index} className="bg-gray-50 p-3 rounded text-center">
                <div className="text-lg font-bold text-gray-900">{section.mentions}</div>
                <div className="text-sm text-gray-600">{section.section}</div>
                <div className="text-xs text-gray-500">{section.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis?.competitiveContext?.mentionedWithCompetitors && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Competitive Context</h4>
          <p className="text-sm text-gray-700">
            Your brand was mentioned alongside competitors in this response.
          </p>
          {analysis.competitiveContext.comparisonContext?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-600">
                Comparison phrases detected: {analysis.competitiveContext.comparisonContext.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopicsTab({ analysis, keyPhrases }: any) {
  return (
    <div className="space-y-4">
      {analysis?.mainTopics && analysis.mainTopics.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Main Topics</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.mainTopics.slice(0, 10).map((topic: any, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {topic.topic} ({topic.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {keyPhrases && keyPhrases.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Key Phrases</h4>
          <div className="flex flex-wrap gap-2">
            {keyPhrases.slice(0, 8).map((phrase: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis?.topicCategories && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Topic Categories</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(analysis.topicCategories).map(([category, count]: [string, any]) => (
              <div key={category} className="bg-gray-50 p-3 rounded text-center">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis?.technicalTerms && analysis.technicalTerms.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Technical Terms</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.technicalTerms.map((term: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccuracyTab({ flags, readability }: any) {
  return (
    <div className="space-y-4">
      {readability && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Readability Analysis</h4>
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-sm text-gray-600">Words per sentence: </span>
              <span className="font-medium">{readability.wordsPerSentence?.toFixed(1) || 'N/A'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Level: </span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                readability.readabilityLevel === 'easy' ? 'bg-green-100 text-green-800' :
                readability.readabilityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {readability.readabilityLevel}
              </span>
            </div>
          </div>
        </div>
      )}

      {flags && flags.length > 0 ? (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Accuracy Flags ({flags.length})</h4>
          <div className="space-y-3">
            {flags.map((flag: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  flag.severity === 'high' ? 'bg-red-50 border-red-400' :
                  flag.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 capitalize">
                    {flag.type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    flag.severity === 'high' ? 'bg-red-100 text-red-800' :
                    flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {flag.severity}
                  </span>
                </div>
                {flag.reason && (
                  <p className="text-sm text-gray-600 mb-2">{flag.reason}</p>
                )}
                {flag.context && (
                  <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                    "...{flag.context}..."
                  </p>
                )}
                {flag.claims && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Claims detected:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {flag.claims.map((claim: string, claimIndex: number) => (
                        <span key={claimIndex} className="px-2 py-1 bg-white rounded text-sm">
                          {claim}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-green-600 font-medium">✅ No accuracy issues detected</div>
          <p className="text-sm text-green-600 mt-1">
            The response appears to be free of obvious accuracy concerns.
          </p>
        </div>
      )}
    </div>
  );
}

function EntitiesTab({ entities }: any) {
  if (!entities) {
    return <p className="text-gray-500">No entity data available</p>;
  }

  const entityTypes = [
    { key: 'organizations', label: 'Organizations', icon: '🏢', color: 'blue' },
    { key: 'people', label: 'People', icon: '👤', color: 'green' },
    { key: 'places', label: 'Places', icon: '📍', color: 'purple' },
    { key: 'dates', label: 'Dates', icon: '📅', color: 'orange' }
  ];

  return (
    <div className="space-y-4">
      {entityTypes.map(type => {
        const entityList = entities[type.key] || [];
        return (
          <div key={type.key}>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="mr-2">{type.icon}</span>
              {type.label} ({entityList.length})
            </h4>
            {entityList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {entityList.map((entity: string, index: number) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm bg-${type.color}-100 text-${type.color}-800`}
                  >
                    {entity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No {type.label.toLowerCase()} detected</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getSentimentColor(sentiment: string) {
  switch (sentiment) {
    case 'very_positive':
      return 'bg-green-200 text-green-900';
    case 'positive':
      return 'bg-green-100 text-green-800';
    case 'neutral':
      return 'bg-gray-100 text-gray-800';
    case 'negative':
      return 'bg-red-100 text-red-800';
    case 'very_negative':
      return 'bg-red-200 text-red-900';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 