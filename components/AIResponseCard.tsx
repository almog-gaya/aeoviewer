import React from 'react';

interface AIResponseCardProps {
  engineName: string;
  response: string;
  brandMentions: {
    count: number;
    positions: number[];
    sentiment: 'positive' | 'neutral' | 'negative';
  };
  competitors: {
    name: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }[];
  timestamp: string;
}

const AIResponseCard: React.FC<AIResponseCardProps> = ({
  engineName,
  response,
  brandMentions,
  competitors,
  timestamp,
}) => {
  // Simple function to get a color based on sentiment
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Simple function to get a badge background color based on sentiment
  const getSentimentBgColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${brandMentions.count > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          <h3 className="text-lg font-medium text-gray-900">{engineName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentBgColor(brandMentions.sentiment)}`}>
            {brandMentions.count} mentions
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="prose max-w-none text-sm text-gray-800">
          {response}
        </div>
      </div>
      
      {competitors.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Comparisons</h4>
          <div className="flex flex-wrap gap-2">
            {competitors.map((competitor, index) => (
              <span 
                key={index} 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentBgColor(competitor.sentiment)}`}
              >
                {competitor.name} ({competitor.count})
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-3 border-t border-gray-200 bg-white flex justify-between items-center text-xs text-gray-500">
        <span>{timestamp}</span>
        <button 
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default AIResponseCard; 