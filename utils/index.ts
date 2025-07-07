import { RedditSentimentReport } from "@/types/RedditSentiment";

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
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reddit Sentiment Analysis Report - ${report.companyName}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            text-align: center;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 30px;
            gap: 20px;
        }
        
        .reddit-logo {
            width: 50px;
            height: 50px;
            background: #FF4500;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
        }
        
        .company-logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        
        .title {
            font-size: 36px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 10px 0;
        }
        
        .subtitle {
            font-size: 24px;
            color: #666;
            margin: 0 0 15px 0;
        }
        
        .meta {
            color: #888;
            font-size: 16px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            transition: transform 0.2s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .stat-percent {
            font-size: 14px;
            color: #888;
        }
        
        .positive { color: #22c55e; border-left: 4px solid #22c55e; }
        .neutral { color: #6b7280; border-left: 4px solid #6b7280; }
        .negative { color: #ef4444; border-left: 4px solid #ef4444; }
        .average { color: #3b82f6; border-left: 4px solid #3b82f6; }
        
        .section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 25px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        
        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .subreddit-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .subreddit-name {
            font-weight: 600;
            color: #1a1a1a;
        }
        
        .subreddit-details {
            color: #666;
            font-size: 14px;
        }
        
        .subreddit-stats {
            text-align: right;
        }
        
        .subreddit-count {
            font-size: 20px;
            font-weight: bold;
            color: #3b82f6;
        }
        
        .keyword-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .keyword-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .keyword-name {
            font-weight: 600;
            color: #1a1a1a;
            text-transform: capitalize;
        }
        
        .keyword-count {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin: 5px 0;
        }
        
        .keyword-sentiment {
            font-size: 12px;
            color: #666;
        }
        
        .mention-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            background: #fafafa;
        }
        
        .mention-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .mention-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .mention-content {
            color: #555;
            margin-bottom: 15px;
        }
        
        .sentiment-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: capitalize;
        }
        
        .sentiment-badge.positive,
        .sentiment-badge.very_positive {
            background: #dcfce7;
            color: #166534;
        }
        
        .sentiment-badge.negative,
        .sentiment-badge.very_negative {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .sentiment-badge.neutral {
            background: #f3f4f6;
            color: #374151;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
        }
        
        .insight-box {
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .insight-title {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 15px;
        }
        
        .insight-list {
            list-style: none;
            padding: 0;
        }
        
        .insight-list li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .bullet {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #3b82f6;
            margin-right: 12px;
            margin-top: 6px;
            flex-shrink: 0;
        }
        
        .summary-box {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin-top: 25px;
        }
        
        .summary-title {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 10px;
        }
        
        .summary-text {
            color: #1e40af;
            line-height: 1.6;
        }
        
        @media (max-width: 768px) {
            .container { padding: 15px; }
            .header { padding: 25px; }
            .logo-section { flex-direction: column; gap: 15px; }
            .stats-grid { grid-template-columns: 1fr; }
            .content-grid { grid-template-columns: 1fr; }
            .insights-grid { grid-template-columns: 1fr; }
            .mention-meta { flex-direction: column; gap: 5px; }
        }
        
        @media print {
            body { background: white; }
            .container { max-width: none; }
            .stat-card:hover { transform: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                <div class="reddit-logo">R</div>
                <span style="color: #9ca3af; font-size: 1.5rem;">×</span>
                <div class="company-logo">${report.companyName?.charAt(0).toUpperCase() || 'C'}</div>
            </div>
            
            <h1 class="title">Reddit Sentiment Analysis</h1>
            <h2 class="subtitle">${report.companyName || 'Company Analysis'}</h2>
            <p class="meta">${report.summary.totalMentions} mentions • ${positivePercent}% positive • Generated ${new Date(report.generatedAt).toLocaleDateString()}</p>
        </div>
        
        <!-- Sentiment Overview Stats -->
        <div class="stats-grid">
            <div class="stat-card positive">
                <div class="stat-number">${report.summary.sentimentDistribution.positive}</div>
                <div class="stat-label">Positive Mentions</div>
                <div class="stat-percent">${positivePercent}% of all sentiment</div>
            </div>
            <div class="stat-card neutral">
                <div class="stat-number">${report.summary.sentimentDistribution.neutral}</div>
                <div class="stat-label">Neutral Mentions</div>
                <div class="stat-percent">${neutralPercent}% of all sentiment</div>
            </div>
            <div class="stat-card negative">
                <div class="stat-number">${report.summary.sentimentDistribution.negative}</div>
                <div class="stat-label">Negative Mentions</div>
                <div class="stat-percent">${negativePercent}% of all sentiment</div>
            </div>
            <div class="stat-card average">
                <div class="stat-number">${report.summary.averageSentiment.toFixed(1)}</div>
                <div class="stat-label">Average Sentiment</div>
                <div class="stat-percent">Overall score</div>
            </div>
        </div>
        
        <!-- Main Content -->
        <!-- Communities and Topics -->
        <div class="content-grid">
            <!-- Subreddit Analysis -->
            <div class="section">
                <h3 class="section-title">Discussion Communities</h3>
                ${report.summary.topSubreddits.slice(0, 8).map(subreddit => `
                    <div class="subreddit-item">
                        <div>
                            <div class="subreddit-name">r/${subreddit.subreddit}</div>
                            <div class="subreddit-details">${subreddit.count} discussions • Avg sentiment: ${subreddit.averageSentiment.toFixed(1)}</div>
                        </div>
                        <div class="subreddit-stats">
                            <div class="subreddit-count">${Math.round((subreddit.count / report.summary.totalMentions) * 100)}%</div>
                            <div style="font-size: 12px; color: #888;">of discussions</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Topic Analysis -->
            <div class="section">
                <h3 class="section-title">Top Discussion Topics</h3>
                <div class="keyword-grid">
                    ${report.summary.topKeywords.slice(0, 8).map(keyword => `
                        <div class="keyword-item">
                            <div class="keyword-name">${keyword.keyword}</div>
                            <div class="keyword-count">${keyword.count}</div>
                            <div class="keyword-sentiment">Sentiment: ${keyword.sentiment}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
                     </div>
        </div>

        <!-- Key Insights -->
        <div class="section">
            <h3 class="section-title">Key Insights</h3>
            <div class="insights-grid">
                <div class="insight-box">
                    <h4 class="insight-title">Positive Feedback Themes</h4>
                    <ul class="insight-list">
                        ${report.summary.topKeywords
                          .filter(k => k.sentiment.toLowerCase().includes('positive'))
                          .slice(0, 3)
                          .map(keyword => `
                            <li>
                                <span class="bullet"></span>
                                ${keyword.keyword} mentioned ${keyword.count} times with positive sentiment
                            </li>
                          `).join('')}
                        ${report.summary.topKeywords.filter(k => k.sentiment.toLowerCase().includes('positive')).length === 0 ? `
                            <li>
                                <span class="bullet"></span>
                                Users appreciate the company's features and performance
                            </li>
                        ` : ''}
                    </ul>
                </div>
                <div class="insight-box">
                    <h4 class="insight-title">Areas of Discussion</h4>
                    <ul class="insight-list">
                        ${report.summary.topKeywords.slice(0, 3).map(keyword => `
                            <li>
                                <span class="bullet" style="background: #9ca3af;"></span>
                                ${keyword.keyword} - ${keyword.count} discussions
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="summary-box">
                <h4 class="summary-title">Summary</h4>
                <p class="summary-text">
                    ${report.companyName || 'The company'} shows ${positivePercent >= 50 ? 'strong' : 'moderate'} positive sentiment (${positivePercent}%) across ${report.summary.topSubreddits.length} major communities. 
                    With ${report.summary.totalMentions} total mentions, discussions focus primarily on ${report.summary.topKeywords.slice(0, 3).map(k => k.keyword).join(', ')}. 
                    The sentiment distribution indicates ${report.summary.sentimentDistribution.positive >= report.summary.sentimentDistribution.negative ? 'healthy' : 'mixed'} community engagement with ${positivePercent >= 40 ? 'predominantly positive' : 'balanced'} feedback.
                </p>
            </div>
        </div>

        <!-- Sample Mentions -->
        <div class="section">
            <h3 class="section-title">Sample Analyzed Mentions</h3>
            ${report.analyses.slice(0, 5).map(analysis => `
                <div class="mention-item">
                    <div class="mention-title">${analysis.mention.title}</div>
                    <div class="mention-meta">
                        <span><strong>r/${analysis.mention.subreddit}</strong></span>
                        <span>by ${analysis.mention.author}</span>
                        <span>${analysis.mention.score} upvotes</span>
                        <span>${analysis.mention.numComments} comments</span>
                        <span class="sentiment-badge ${analysis.sentiment.label}">${analysis.sentiment.label.replace('_', ' ')}</span>
                    </div>
                    ${analysis.mention.selftext ? `
                        <div class="mention-content">
                            ${analysis.mention.selftext.substring(0, 200)}...
                        </div>
                    ` : ''}
                    <div style="text-align: right; font-size: 12px; color: #888;">
                        Sentiment Score: ${analysis.sentiment.score.toFixed(2)}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
  `;
} 