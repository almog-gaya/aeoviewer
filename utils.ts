import { RedditSentimentReport } from "./types/RedditSentiment";

// Helper functions for export
export function generateCSV(report: RedditSentimentReport): string {
    const headers = [
      "Title",
      "Subreddit", 
      "Author",
      "Score",
      "Comments",
      "Sentiment Label",
      "Sentiment Score",
      "URL",
      "Created"
    ];
    
    const rows = report.analyses.map(analysis => [
      `"${analysis.mention.title.replace(/"/g, '""')}"`,
      analysis.mention.subreddit,
      analysis.mention.author,
      analysis.mention.score,
      analysis.mention.numComments,
      analysis.sentiment.label,
      analysis.sentiment.score,
      analysis.mention.url,
      analysis.mention.created
    ]);
    
    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  }
  
export function generateHTMLReport(report: RedditSentimentReport): string {
    const positivePercent = Math.round((report.summary.sentimentDistribution.positive / report.summary.totalMentions) * 100);
    const neutralPercent = Math.round((report.summary.sentimentDistribution.neutral / report.summary.totalMentions) * 100);
    const negativePercent = Math.round((report.summary.sentimentDistribution.negative / report.summary.totalMentions) * 100);
    
    // Calculate topic analysis from content
    const topicKeywords = report.analyses.reduce((acc, analysis) => {
        const text = ((analysis.mention.title || '') + ' ' + (analysis.mention.selftext || '')).toLowerCase();
        const keywords = ['network', 'security', 'cloud', 'performance', 'integration', 'support', 'pricing', 'feature', 'solution', 'enterprise'];
        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                acc[keyword] = (acc[keyword] || 0) + 1;
            }
        });
        return acc;
    }, {} as Record<string, number>);

    const topTopics = Object.entries(topicKeywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.companyName} Reddit Sentiment Analysis Report</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
            color: #111827;
            line-height: 1.6;
        }
        
        .header {
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-bottom: 1px solid #e5e7eb;
        }
        
        .header-content {
            max-width: 1280px;
            margin: 0 auto;
            padding: 48px 24px;
        }
        
        .logo-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .reddit-logo {
            width: 40px;
            height: 40px;
            background: #ff4500;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }
        
        .separator {
            color: #9ca3af;
            font-size: 24px;
        }
        
        .company-logo {
            background: #374151;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
        }
        
        .title-section {
            text-align: center;
        }
        
        .main-title {
            font-size: 32px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 8px;
        }
        
        .company-title {
            font-size: 20px;
            color: #6b7280;
            margin-bottom: 16px;
        }
        
        .header-stats {
            font-size: 14px;
            color: #9ca3af;
        }
        
        .main-content {
            padding: 24px;
            background: #f3f4f6;
        }
        
        .container {
            max-width: 1280px;
            margin: 0 auto;
        }
        
        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 24px;
            margin-bottom: 24px;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 24px;
        }
        
        .subsection-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
        }
        
        .grid-3 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
        }
        
        .grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 24px;
            margin-bottom: 24px;
        }
        
        .sentiment-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
        }
        
        .sentiment-number {
            font-size: 32px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 8px;
        }
        
        .sentiment-label {
            font-size: 18px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 4px;
        }
        
        .sentiment-percentage {
            font-size: 14px;
            color: #6b7280;
        }
        
        .subreddit-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;
            margin-bottom: 8px;
        }
        
        .subreddit-name {
            font-weight: 500;
            color: #111827;
        }
        
        .subreddit-details {
            font-size: 14px;
            color: #6b7280;
        }
        
        .subreddit-stats {
            text-align: right;
        }
        
        .subreddit-percentage {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
        }
        
        .subreddit-label {
            font-size: 12px;
            color: #6b7280;
        }
        
        .insight-box {
            padding: 16px;
            background: #f9fafb;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        
        .insight-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .insight-title {
            font-weight: 500;
            color: #111827;
        }
        
        .insight-value {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
        }
        
        .insight-description {
            font-size: 14px;
            color: #6b7280;
        }
        
        .topic-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
        }
        
        .topic-card {
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        
        .topic-name {
            font-weight: 500;
            color: #111827;
            margin-bottom: 8px;
            text-transform: capitalize;
        }
        
        .topic-count {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 4px;
        }
        
        .topic-description {
            font-size: 12px;
            color: #6b7280;
        }
        
        .mentions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 16px;
        }
        
        .mention-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
        }
        
        .mention-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .mention-title {
            font-weight: 600;
            color: #111827;
            flex: 1;
            margin-right: 12px;
            font-size: 14px;
        }
        
        .sentiment-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
        }
        
        .sentiment-positive {
            background: #dcfce7;
            color: #166534;
        }
        
        .sentiment-neutral {
            background: #f3f4f6;
            color: #374151;
        }
        
        .sentiment-negative {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .mention-meta {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .mention-snippet {
            font-size: 13px;
            color: #4b5563;
            line-height: 1.4;
        }
        
        .summary-box {
            margin-top: 24px;
            padding: 16px;
            background: #eff6ff;
            border-radius: 8px;
        }
        
        .summary-title {
            font-weight: 500;
            color: #1e40af;
            margin-bottom: 8px;
        }
        
        .summary-text {
            font-size: 14px;
            color: #1e40af;
        }
        
        @media (max-width: 768px) {
            .grid-2, .grid-3, .topic-grid, .mentions-grid {
                grid-template-columns: 1fr;
            }
            
            .main-title {
                font-size: 24px;
            }
            
            .company-title {
                font-size: 18px;
            }
            
            .header-content {
                padding: 24px 16px;
            }
            
            .main-content {
                padding: 16px;
            }
        }
    </style>
</head>
<body>
    <!-- Header with Logos -->
    <div class="header">
        <div class="header-content">
            <!-- Simple Logo Row -->
            <div class="logo-row">
                <div class="reddit-logo">r</div>
                <span class="separator">×</span>
                <div class="company-logo">${report.companyName.charAt(0).toUpperCase()}</div>
            </div>
            
            <!-- Simple Title -->
            <div class="title-section">
                <h1 class="main-title">Reddit Sentiment Analysis</h1>
                <h2 class="company-title">${report.companyName}</h2>
                <p class="header-stats">${report.summary.totalMentions} mentions • ${positivePercent}% positive • Generated ${new Date(report.generatedAt).toLocaleDateString()}</p>
            </div>
        </div>
    </div>
    
    <main class="main-content">
        <div class="container">
            <!-- Sentiment Overview -->
            <div class="card">
                <h2 class="section-title">Sentiment Overview</h2>
                <div class="grid-3">
                    <!-- Positive -->
                    <div class="sentiment-card">
                        <div class="sentiment-number">${report.summary.sentimentDistribution.positive}</div>
                        <div class="sentiment-label">Positive Mentions</div>
                        <div class="sentiment-percentage">${positivePercent}% of all sentiment</div>
                    </div>
                    <!-- Neutral -->
                    <div class="sentiment-card">
                        <div class="sentiment-number">${report.summary.sentimentDistribution.neutral}</div>
                        <div class="sentiment-label">Neutral Mentions</div>
                        <div class="sentiment-percentage">${neutralPercent}% of all sentiment</div>
                    </div>
                    <!-- Negative -->
                    <div class="sentiment-card">
                        <div class="sentiment-number">${report.summary.sentimentDistribution.negative}</div>
                        <div class="sentiment-label">Negative Mentions</div>
                        <div class="sentiment-percentage">${negativePercent}% of all sentiment</div>
                    </div>
                </div>
            </div>

            <!-- Key Communities -->
            <div class="grid-2">
                <!-- Subreddit Analysis -->
                <div class="card">
                    <h3 class="subsection-title">Discussion Communities</h3>
                    <div>
                        ${report.summary.topSubreddits.slice(0, 6).map(sub => `
                            <div class="subreddit-item">
                                <div>
                                    <div class="subreddit-name">r/${sub.subreddit}</div>
                                    <div class="subreddit-details">${sub.count} discussions</div>
                                </div>
                                <div class="subreddit-stats">
                                    <div class="subreddit-percentage">${((sub.count / report.summary.totalMentions) * 100).toFixed(1)}%</div>
                                    <div class="subreddit-label">of discussions</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Sentiment Trends -->
                <div class="card">
                    <h3 class="subsection-title">Sentiment Insights</h3>
                    <div>
                        <div class="insight-box">
                            <div class="insight-header">
                                <div class="insight-title">Strong Positive Sentiment</div>
                                <div class="insight-value">${positivePercent}%</div>
                            </div>
                            <div class="insight-description">
                                ${report.summary.sentimentDistribution.positive} positive mentions show users appreciate ${report.companyName}'s performance and features
                            </div>
                        </div>
                        
                        <div class="insight-box">
                            <div class="insight-header">
                                <div class="insight-title">Neutral Discussion</div>
                                <div class="insight-value">${neutralPercent}%</div>
                            </div>
                            <div class="insight-description">
                                ${report.summary.sentimentDistribution.neutral} neutral mentions include factual comparisons and technical discussions
                            </div>
                        </div>
                        
                        <div class="insight-box">
                            <div class="insight-header">
                                <div class="insight-title">Areas for Improvement</div>
                                <div class="insight-value">${negativePercent}%</div>
                            </div>
                            <div class="insight-description">
                                ${report.summary.sentimentDistribution.negative} negative mentions highlight potential improvement areas
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Topic Analysis -->
            ${topTopics.length > 0 ? `
            <div class="card">
                <h3 class="subsection-title">What People Are Discussing</h3>
                <div class="topic-grid">
                    ${topTopics.map(([topic, count]) => `
                        <div class="topic-card">
                            <div class="topic-name">${topic}</div>
                            <div class="topic-count">${count}</div>
                            <div class="topic-description">${topic}-related discussions and mentions</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Sample Mentions -->
            <div class="card">
                <h3 class="subsection-title">Sample Mentions</h3>
                <div class="mentions-grid">
                    ${report.analyses.slice(0, 8).map(analysis => `
                        <div class="mention-card">
                            <div class="mention-header">
                                <div class="mention-title">${analysis.mention.title}</div>
                                <span class="sentiment-badge sentiment-${analysis.sentiment.label.toLowerCase()}">${analysis.sentiment.label}</span>
                            </div>
                            <div class="mention-meta">r/${analysis.mention.subreddit} • ${analysis.mention.author}</div>
                            <div class="mention-snippet">${analysis.mention.selftext ? analysis.mention.selftext.substring(0, 200) + '...' : 'No content preview'}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="summary-box">
                    <h4 class="summary-title">Summary</h4>
                    <p class="summary-text">
                        ${report.companyName} shows ${positivePercent >= 40 ? 'strong' : positivePercent >= 25 ? 'moderate' : 'mixed'} positive sentiment (${positivePercent}%) across ${report.summary.topSubreddits.length} major communities. 
                        With ${report.summary.totalMentions} total mentions, discussions focus primarily on ${topTopics.slice(0, 3).map(([topic]) => topic).join(', ')}. 
                        The sentiment distribution indicates ${positivePercent >= 40 ? 'healthy community engagement with predominantly positive feedback' : 'balanced community discussion with room for improvement'}.
                    </p>
                </div>
            </div>
        </div>
    </main>
</body>
</html>`;
  } 