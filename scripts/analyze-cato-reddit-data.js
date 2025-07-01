const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class CatoRedditAnalyzer {
  constructor() {
    this.subredditCategories = {
      'cybersecurity': 'Security',
      'netsec': 'Security', 
      'networking': 'Networking',
      'sysadmin': 'IT Administration',
      'fortinet': 'Vendor Community',
      'paloaltonetworks': 'Vendor Community',
      'cisco': 'Vendor Community',
      'ITCareerQuestions': 'Career/Education',
      'CompTIA': 'Career/Education',
      'msp': 'Managed Services',
      'ITManagers': 'Management'
    };
  }

  analyzeRedditData() {
    console.log('🚀 Starting Cato Networks Reddit Analysis...\n');
    
    const filePath = path.join(__dirname, '..', 'Cato - Existing Reddit Threads.xlsx');
    const data = this.readExcelFile(filePath);
    
    const analysis = {
      threads: this.analyzeThreads(data.Threads || []),
      summary: this.analyzeSummary(data.Summary || []),
      competitors: this.analyzeCompetitors(data.Competitors || []),
      insights: {},
      recommendations: []
    };
    
    // Generate insights
    analysis.insights = this.generateInsights(analysis);
    analysis.recommendations = this.generateRecommendations(analysis);
    
    // Save and display results
    this.saveResults(analysis);
    this.displayResults(analysis);
    
    return analysis;
  }

  readExcelFile(filePath) {
    console.log('📊 Reading Excel file:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    const data = {};
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      data[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      console.log(`  📋 ${sheetName}: ${data[sheetName].length} rows`);
    });
    
    return data;
  }

  analyzeThreads(threads) {
    console.log('\n🔍 Analyzing thread data...');
    
    const analysis = {
      total: threads.length,
      bySubreddit: {},
      byAnswerEngine: {},
      byCompanyMention: {
        mentioned: 0,
        notMentioned: 0
      },
      topSubreddits: [],
      urlDomains: {},
      citationStats: {
        total: 0,
        average: 0,
        median: 0,
        max: 0,
        min: Infinity
      }
    };

    threads.forEach(thread => {
      // Subreddit analysis
      const subredditName = this.extractSubredditName(thread.Subreddit);
      if (subredditName) {
        analysis.bySubreddit[subredditName] = (analysis.bySubreddit[subredditName] || 0) + 1;
      }

      // Answer engine analysis
      if (thread['Answer Engines']) {
        const engines = thread['Answer Engines'].split(',').map(e => e.trim());
        engines.forEach(engine => {
          analysis.byAnswerEngine[engine] = (analysis.byAnswerEngine[engine] || 0) + 1;
        });
      }

      // Company mention analysis
      if (thread['Company Mentioned'] === 'Yes') {
        analysis.byCompanyMention.mentioned++;
      } else {
        analysis.byCompanyMention.notMentioned++;
      }

      // Citation analysis
      const citations = parseInt(thread.Citations) || 0;
      analysis.citationStats.total += citations;
      analysis.citationStats.max = Math.max(analysis.citationStats.max, citations);
      analysis.citationStats.min = Math.min(analysis.citationStats.min, citations);

      // Domain analysis
      try {
        const url = new URL(thread.URL);
        analysis.urlDomains[url.hostname] = (analysis.urlDomains[url.hostname] || 0) + 1;
      } catch (e) {
        // Invalid URL, skip
      }
    });

    // Calculate citation statistics
    if (threads.length > 0) {
      analysis.citationStats.average = analysis.citationStats.total / threads.length;
      
      const citationsSorted = threads
        .map(t => parseInt(t.Citations) || 0)
        .sort((a, b) => a - b);
      analysis.citationStats.median = citationsSorted[Math.floor(citationsSorted.length / 2)];
    }

    // Top subreddits
    analysis.topSubreddits = Object.entries(analysis.bySubreddit)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([subreddit, count]) => ({
        subreddit,
        count,
        category: this.categorizeSubreddit(subreddit),
        percentage: (count / analysis.total * 100).toFixed(1)
      }));

    return analysis;
  }

  analyzeSummary(summaryData) {
    console.log('📈 Analyzing summary data...');
    
    const analysis = {
      totalSubreddits: summaryData.length,
      totalThreadsFromSummary: summaryData.reduce((sum, row) => sum + (parseInt(row['Thread Count']) || 0), 0),
      topSubredditsByThreadCount: [],
      jobTitles: {
        primary: {},
        secondary: {}
      }
    };

    // Process summary data
    summaryData.forEach(row => {
      // Job title analysis
      if (row.Title) {
        analysis.jobTitles.primary[row.Title] = (analysis.jobTitles.primary[row.Title] || 0) + 1;
      }
      if (row.Title_1) {
        analysis.jobTitles.secondary[row.Title_1] = (analysis.jobTitles.secondary[row.Title_1] || 0) + 1;
      }
    });

    // Top subreddits by thread count
    analysis.topSubredditsByThreadCount = summaryData
      .map(row => ({
        subreddit: this.extractSubredditName(row.Subreddit),
        threadCount: parseInt(row['Thread Count']) || 0,
        primaryTitle: row.Title,
        secondaryTitle: row.Title_1
      }))
      .sort((a, b) => b.threadCount - a.threadCount)
      .slice(0, 10);

    return analysis;
  }

  analyzeCompetitors(competitorData) {
    console.log('🏢 Analyzing competitor data...');
    
    return {
      total: competitorData.length,
      companies: competitorData.map(row => row['Company name']).filter(Boolean),
      byCategory: this.categorizeCompetitors(competitorData.map(row => row['Company name']).filter(Boolean))
    };
  }

  categorizeCompetitors(companies) {
    const categories = {
      'Network Security': ['palo alto networks', 'fortinet', 'checkpoint', 'zscaler'],
      'Networking': ['cisco', 'juniper', 'arista', 'extreme networks'],
      'SD-WAN': ['velocloud', 'silver peak', 'viptela', 'cloudgenix'],
      'Cloud Security': ['zscaler', 'netskope', 'proofpoint', 'symantec']
    };

    const categorized = {};
    companies.forEach(company => {
      const companyLower = company.toLowerCase();
      let assigned = false;
      
      Object.entries(categories).forEach(([category, companyList]) => {
        if (companyList.some(c => companyLower.includes(c))) {
          if (!categorized[category]) categorized[category] = [];
          categorized[category].push(company);
          assigned = true;
        }
      });
      
      if (!assigned) {
        if (!categorized['Other']) categorized['Other'] = [];
        categorized['Other'].push(company);
      }
    });

    return categorized;
  }

  generateInsights(analysis) {
    const insights = [];

    // Subreddit insights
    const securitySubreddits = analysis.threads.topSubreddits.filter(s => 
      s.category === 'Security' || s.subreddit.includes('security') || s.subreddit.includes('cybersecurity')
    );
    
    if (securitySubreddits.length > 0) {
      insights.push({
        type: 'audience_focus',
        title: 'Strong Security Community Presence',
        description: `${securitySubreddits.length} of top subreddits are security-focused, representing ${securitySubreddits.reduce((sum, s) => sum + parseFloat(s.percentage), 0).toFixed(1)}% of threads`,
        priority: 'high',
        data: securitySubreddits
      });
    }

    // AI Engine insights
    const topEngines = Object.entries(analysis.threads.byAnswerEngine)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topEngines.length > 0) {
      insights.push({
        type: 'ai_engine_coverage',
        title: 'Answer Engine Distribution',
        description: `Top AI engines citing these threads: ${topEngines.map(([engine, count]) => `${engine} (${count})`).join(', ')}`,
        priority: 'medium',
        data: topEngines
      });
    }

    // Company mention insights
    const mentionRate = (analysis.threads.byCompanyMention.mentioned / analysis.threads.total * 100).toFixed(1);
    insights.push({
      type: 'brand_visibility',
      title: 'Company Mention Rate',
      description: `Cato is mentioned in ${mentionRate}% of relevant threads (${analysis.threads.byCompanyMention.mentioned}/${analysis.threads.total})`,
      priority: mentionRate < 20 ? 'high' : mentionRate < 50 ? 'medium' : 'low',
      data: analysis.threads.byCompanyMention
    });

    // Citation insights
    if (analysis.threads.citationStats.average > 0) {
      insights.push({
        type: 'content_engagement',
        title: 'Thread Engagement Level',
        description: `Average ${analysis.threads.citationStats.average.toFixed(0)} citations per thread, with highest being ${analysis.threads.citationStats.max}`,
        priority: 'medium',
        data: analysis.threads.citationStats
      });
    }

    return insights;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Low company mention rate
    const mentionRate = analysis.threads.byCompanyMention.mentioned / analysis.threads.total;
    if (mentionRate < 0.3) {
      recommendations.push({
        type: 'brand_awareness',
        priority: 'high',
        title: 'Increase Brand Visibility',
        description: `Only ${(mentionRate * 100).toFixed(1)}% of threads mention Cato`,
        actions: [
          'Engage more actively in high-traffic subreddits',
          'Create valuable content for r/networking and r/cybersecurity',
          'Participate in technical discussions with helpful insights'
        ]
      });
    }

    // Top subreddit targeting
    const topSubreddits = analysis.threads.topSubreddits.slice(0, 3);
    recommendations.push({
      type: 'content_strategy',
      priority: 'medium',
      title: 'Focus on High-Impact Subreddits',
      description: `Target top communities: ${topSubreddits.map(s => s.subreddit).join(', ')}`,
      actions: [
        'Create subreddit-specific content strategies',
        'Monitor trending topics in these communities',
        'Build relationships with community moderators'
      ]
    });

    // AI engine optimization
    const topEngines = Object.entries(analysis.threads.byAnswerEngine)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);
    
    if (topEngines.length > 0) {
      recommendations.push({
        type: 'ai_optimization',
        priority: 'medium',
        title: 'Optimize for Top AI Engines',
        description: `Focus on ${topEngines.map(([engine]) => engine).join(' and ')} optimization`,
        actions: [
          'Ensure content is well-structured for AI parsing',
          'Include relevant technical keywords',
          'Maintain active presence in cited discussions'
        ]
      });
    }

    // Content creation suggestion
    recommendations.push({
      type: 'content_creation',
      priority: 'high',
      title: 'Scrape and Analyze Thread Content',
      description: 'Current analysis is limited to metadata - actual thread content needed for sentiment analysis',
      actions: [
        'Use Reddit API to fetch thread content from provided URLs',
        'Perform comprehensive sentiment analysis on actual discussions',
        'Identify specific pain points and opportunities mentioned in threads',
        'Track competitor mentions and sentiment in discussions'
      ]
    });

    return recommendations;
  }

  extractSubredditName(subredditUrl) {
    if (!subredditUrl) return null;
    const match = subredditUrl.match(/\/r\/([^\/]+)/);
    return match ? match[1] : null;
  }

  categorizeSubreddit(subredditName) {
    const name = subredditName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.subredditCategories)) {
      if (name.includes(category) || keywords.toLowerCase().includes(name)) {
        return keywords;
      }
    }
    
    return 'Other';
  }

  saveResults(analysis) {
    const resultsPath = path.join(__dirname, '..', 'cato-reddit-analysis.json');
    fs.writeFileSync(resultsPath, JSON.stringify(analysis, null, 2));
    console.log(`\n💾 Results saved to: ${resultsPath}`);
  }

  displayResults(analysis) {
    console.log('\n🎯 CATO NETWORKS REDDIT ANALYSIS RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Overview
    console.log(`\n📊 OVERVIEW:`);
    console.log(`   Total Reddit Threads: ${analysis.threads.total}`);
    console.log(`   Unique Subreddits: ${Object.keys(analysis.threads.bySubreddit).length}`);
    console.log(`   Competitor Companies: ${analysis.competitors.total}`);
    console.log(`   Company Mentions: ${analysis.threads.byCompanyMention.mentioned} (${(analysis.threads.byCompanyMention.mentioned/analysis.threads.total*100).toFixed(1)}%)`);

    // Top Subreddits
    console.log(`\n🏆 TOP SUBREDDITS BY THREAD COUNT:`);
    analysis.threads.topSubreddits.slice(0, 8).forEach((sub, index) => {
      console.log(`   ${index + 1}. r/${sub.subreddit} - ${sub.count} threads (${sub.percentage}%) [${sub.category}]`);
    });

    // AI Engines
    console.log(`\n🤖 AI ENGINE DISTRIBUTION:`);
    Object.entries(analysis.threads.byAnswerEngine)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([engine, count]) => {
        console.log(`   • ${engine}: ${count} citations`);
      });

    // Citations
    console.log(`\n📈 ENGAGEMENT METRICS:`);
    console.log(`   Average Citations: ${analysis.threads.citationStats.average.toFixed(1)}`);
    console.log(`   Median Citations: ${analysis.threads.citationStats.median}`);
    console.log(`   Max Citations: ${analysis.threads.citationStats.max}`);
    console.log(`   Total Citations: ${analysis.threads.citationStats.total}`);

    // Competitors
    console.log(`\n🏢 COMPETITOR LANDSCAPE:`);
    Object.entries(analysis.competitors.byCategory).forEach(([category, companies]) => {
      console.log(`   ${category}: ${companies.join(', ')}`);
    });

    // Key Insights
    console.log(`\n💡 KEY INSIGHTS:`);
    analysis.insights.forEach((insight, index) => {
      const priority = insight.priority.toUpperCase();
      console.log(`   ${index + 1}. [${priority}] ${insight.title}`);
      console.log(`      ${insight.description}`);
    });

    // Recommendations
    console.log(`\n🎯 STRATEGIC RECOMMENDATIONS:`);
    analysis.recommendations.forEach((rec, index) => {
      console.log(`\n   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`      ${rec.description}`);
      console.log(`      Actions:`);
      rec.actions.forEach(action => {
        console.log(`        • ${action}`);
      });
    });

    console.log(`\n🔍 NEXT STEPS FOR SENTIMENT ANALYSIS:`);
    console.log(`   1. Use Reddit API to scrape actual thread content from the ${analysis.threads.total} URLs`);
    console.log(`   2. Apply sentiment analysis to thread titles, posts, and comments`);
    console.log(`   3. Identify specific pain points and feature requests`);
    console.log(`   4. Track sentiment around Cato vs competitors`);
    console.log(`   5. Monitor brand perception and customer satisfaction`);
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new CatoRedditAnalyzer();
  analyzer.analyzeRedditData();
}

module.exports = CatoRedditAnalyzer; 