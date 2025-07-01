const XLSX = require('xlsx');
const Sentiment = require('sentiment');
const natural = require('natural');
const nlp = require('compromise');
const fs = require('fs');
const path = require('path');

// Note: This uses a method to scrape Reddit content without API keys
// For production, consider using Reddit API with proper authentication

class RedditContentAnalyzer {
  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.delay = 2000; // 2 second delay between requests
  }

  async analyzeRedditContent() {
    console.log('🔍 Starting Reddit Content Scraping & Sentiment Analysis...\n');
    
    // Read the URLs from Excel
    const filePath = path.join(__dirname, '..', 'Cato - Existing Reddit Threads.xlsx');
    const data = this.readExcelFile(filePath);
    const threads = data.Threads || [];
    
    console.log(`📊 Found ${threads.length} Reddit thread URLs to analyze`);
    
    // Analyze a subset first (to avoid being rate-limited)
    const sampleSize = Math.min(15, threads.length);
    console.log(`🎯 Analyzing first ${sampleSize} threads for actual content...\n`);
    
    const results = [];
    
    for (let i = 0; i < sampleSize; i++) {
      const thread = threads[i];
      console.log(`\n📄 Thread ${i + 1}/${sampleSize}:`);
      console.log(`   Subreddit: ${thread.Subreddit}`);
      console.log(`   URL: ${thread.URL}`);
      
      try {
        const content = await this.scrapeRedditThread(thread.URL);
        if (content && content.title) {
          const analysis = this.analyzeThreadContent(content, thread);
          results.push(analysis);
          console.log(`   ✅ "${content.title.substring(0, 60)}${content.title.length > 60 ? '...' : ''}"`);
          console.log(`   📊 Sentiment: ${analysis.analysis.sentiment.label} (${analysis.analysis.sentiment.score})`);
          
          // Show key findings
          const brandMentions = Object.keys(analysis.analysis.brandMentions);
          if (brandMentions.length > 0) {
            console.log(`   🏢 Brands mentioned: ${brandMentions.join(', ')}`);
          }
          
        } else {
          console.log(`   ⚠️ Could not extract content`);
          results.push(this.createEmptyAnalysis(thread, 'No content extracted'));
        }
        
        // Respectful delay
        await this.sleep(this.delay);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push(this.createEmptyAnalysis(thread, error.message));
      }
    }
    
    // Generate comprehensive analysis
    const report = this.generateContentReport(results, threads.length);
    
    // Save results
    this.saveResults(report, results);
    this.displayResults(report);
    
    return report;
  }

  readExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const data = {};
    workbook.SheetNames.forEach(sheetName => {
      data[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    });
    return data;
  }

  async scrapeRedditThread(url) {
    // Convert Reddit URL to JSON format for easier scraping
    const jsonUrl = url.endsWith('.json') ? url : url + '.json';
    
    try {
      const response = await fetch(jsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RedditAnalyzer/1.0)'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract post data
      const post = data[0]?.data?.children?.[0]?.data;
      const comments = data[1]?.data?.children || [];
      
      if (!post) {
        throw new Error('No post data found');
      }
      
      return {
        title: post.title || '',
        selftext: post.selftext || '',
        author: post.author || 'unknown',
        subreddit: post.subreddit || '',
        score: post.score || 0,
        num_comments: post.num_comments || 0,
        created_utc: post.created_utc || 0,
        url: post.url || '',
        comments: this.extractComments(comments).slice(0, 30) // Limit to top 30 comments
      };
      
    } catch (error) {
      throw new Error(`Scraping failed: ${error.message}`);
    }
  }

  extractComments(commentData, depth = 0) {
    const comments = [];
    const maxDepth = 2; // Limit comment depth
    
    for (const item of commentData) {
      if (!item.data) continue;
      const comment = item.data;
      
      if (comment.body && 
          comment.body !== '[deleted]' && 
          comment.body !== '[removed]' && 
          comment.body.length > 10) {
        comments.push({
          body: comment.body,
          author: comment.author || 'unknown',
          score: comment.score || 0,
          depth: depth,
          created_utc: comment.created_utc || 0
        });
        
        // Recursively get replies (limited depth)
        if (depth < maxDepth && comment.replies && comment.replies.data) {
          const replies = this.extractComments(comment.replies.data.children, depth + 1);
          comments.push(...replies.slice(0, 5)); // Limit replies per comment
        }
      }
    }
    
    return comments;
  }

  analyzeThreadContent(content, threadInfo) {
    // Combine title, post text, and comments for analysis
    const allText = [
      content.title || '',
      content.selftext || '',
      ...content.comments.map(c => c.body || '')
    ].filter(text => text.length > 0).join(' ');

    if (!allText || allText.length < 10) {
      return this.createEmptyAnalysis(threadInfo, 'Insufficient text content');
    }

    // Perform comprehensive analysis
    const sentimentAnalysis = this.analyzeSentiment(allText);
    const keywordAnalysis = this.analyzeKeywords(allText);
    const brandMentions = this.analyzeBrandMentions(allText);
    const competitorMentions = this.analyzeCompetitorMentions(allText);
    const topicAnalysis = this.analyzeTopics(allText);

    return {
      threadInfo: threadInfo,
      content: {
        title: content.title,
        selftext: content.selftext?.substring(0, 500) + (content.selftext?.length > 500 ? '...' : ''),
        commentCount: content.comments.length,
        totalScore: content.score,
        subreddit: content.subreddit,
        wordCount: this.tokenizer.tokenize(allText).length
      },
      analysis: {
        sentiment: sentimentAnalysis,
        keywords: keywordAnalysis,
        brandMentions: brandMentions,
        competitorMentions: competitorMentions,
        topics: topicAnalysis,
        textStats: {
          totalWords: this.tokenizer.tokenize(allText).length,
          totalCharacters: allText.length,
          averageCommentLength: content.comments.length > 0 
            ? Math.round(content.comments.reduce((sum, c) => sum + (c.body?.length || 0), 0) / content.comments.length)
            : 0
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  analyzeSentiment(text) {
    const result = this.sentiment.analyze(text);
    
    return {
      score: result.score,
      comparative: result.comparative,
      label: this.getSentimentLabel(result.score),
      confidence: this.calculateConfidence(result),
      positive: result.positive.slice(0, 10),
      negative: result.negative.slice(0, 10),
      wordCount: result.words.length
    };
  }

  analyzeKeywords(text) {
    const doc = nlp(text);
    
    // Extract various types of keywords
    const nouns = doc.nouns().out('array');
    const topics = doc.topics().out('array');
    
    // Technical terms related to networking/security
    const technicalTerms = this.extractTechnicalTerms(text);
    
    // Count frequency
    const allTerms = [...nouns, ...topics, ...technicalTerms];
    const termCounts = {};
    
    allTerms.forEach(term => {
      const lower = term.toLowerCase().trim();
      if (lower.length > 2 && !this.isStopWord(lower)) {
        termCounts[lower] = (termCounts[lower] || 0) + 1;
      }
    });
    
    return {
      topKeywords: Object.entries(termCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .map(([keyword, count]) => ({ keyword, count })),
      technicalTerms: [...new Set(technicalTerms)],
      totalUniqueTerms: Object.keys(termCounts).length
    };
  }

  analyzeBrandMentions(text) {
    const brands = {
      'cato': ['cato networks', 'cato'],
      'palo alto': ['palo alto networks', 'palo alto', 'pan'],
      'fortinet': ['fortinet', 'fortigate'],
      'cisco': ['cisco'],
      'zscaler': ['zscaler'],
      'netskope': ['netskope'],
      'checkpoint': ['checkpoint', 'check point'],
      'vmware': ['vmware'],
      'cloudflare': ['cloudflare']
    };
    
    const mentions = {};
    const lowerText = text.toLowerCase();
    
    Object.entries(brands).forEach(([brand, variations]) => {
      let totalMentions = 0;
      const contexts = [];
      
      variations.forEach(variation => {
        const regex = new RegExp(`\\b${variation.replace(/\s+/g, '\\s+')}\\b`, 'gi');
        const matches = [...text.matchAll(regex)];
        
        if (matches.length > 0) {
          totalMentions += matches.length;
          
          // Get context around mentions
          matches.slice(0, 3).forEach(match => {
            const start = Math.max(0, match.index - 80);
            const end = Math.min(text.length, match.index + variation.length + 80);
            contexts.push(text.substring(start, end).trim());
          });
        }
      });
      
      if (totalMentions > 0) {
        mentions[brand] = {
          count: totalMentions,
          contexts: contexts,
          sentiment: this.getContextualSentiment(contexts)
        };
      }
    });
    
    return mentions;
  }

  analyzeCompetitorMentions(text) {
    const comparisonWords = ['vs', 'versus', 'compared to', 'better than', 'worse than', 'alternative to'];
    
    const competitiveContext = [];
    const lowerText = text.toLowerCase();
    
    comparisonWords.forEach(word => {
      const regex = new RegExp(`.{0,100}${word}.{0,100}`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        competitiveContext.push(...matches.slice(0, 2));
      }
    });
    
    return {
      hasCompetitiveDiscussion: competitiveContext.length > 0,
      competitiveContexts: competitiveContext.slice(0, 3),
      sentiment: competitiveContext.length > 0 ? this.getContextualSentiment(competitiveContext) : 'neutral'
    };
  }

  analyzeTopics(text) {
    const topicCategories = {
      'security': ['security', 'firewall', 'threat', 'protection', 'vulnerability', 'breach', 'malware'],
      'networking': ['network', 'router', 'switch', 'vpn', 'wan', 'lan', 'bandwidth'],
      'cloud': ['cloud', 'aws', 'azure', 'gcp', 'saas', 'hybrid'],
      'performance': ['performance', 'speed', 'latency', 'bandwidth', 'throughput', 'slow'],
      'management': ['management', 'admin', 'dashboard', 'monitoring', 'logging', 'configuration'],
      'pricing': ['price', 'cost', 'expensive', 'cheap', 'budget', 'roi', 'license']
    };
    
    const categoryCounts = {};
    const lowerText = text.toLowerCase();
    
    Object.entries(topicCategories).forEach(([category, keywords]) => {
      let count = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}`, 'g');
        const matches = lowerText.match(regex);
        if (matches) count += matches.length;
      });
      if (count > 0) {
        categoryCounts[category] = count;
      }
    });
    
    const dominantCategory = Object.keys(categoryCounts).reduce((a, b) => 
      (categoryCounts[a] || 0) > (categoryCounts[b] || 0) ? a : b, 'general'
    );
    
    return {
      categories: categoryCounts,
      dominantCategory: categoryCounts[dominantCategory] > 0 ? dominantCategory : 'general'
    };
  }

  extractTechnicalTerms(text) {
    const technicalPatterns = [
      /\bSD-WAN\b/gi, /\bSASE\b/gi, /\bZTNA\b/gi, /\bSSE\b/gi, 
      /\bCASB\b/gi, /\bDLP\b/gi, /\bVPN\b/gi, /\bAPI\b/gi,
      /\bfirewall\b/gi, /\brouter\b/gi, /\bbandwidth\b/gi, 
      /\blatency\b/gi, /\bthroughput\b/gi, /\bSSL\b/gi
    ];
    
    const terms = [];
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) terms.push(...matches);
    });
    
    return [...new Set(terms.map(t => t.toUpperCase()))];
  }

  getContextualSentiment(contexts) {
    if (!contexts || contexts.length === 0) return 'neutral';
    
    const combinedText = contexts.join(' ');
    const result = this.sentiment.analyze(combinedText);
    return this.getSentimentLabel(result.score);
  }

  getSentimentLabel(score) {
    if (score > 2) return 'very_positive';
    if (score > 0) return 'positive';
    if (score < -2) return 'very_negative';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  calculateConfidence(result) {
    const totalWords = result.positive.length + result.negative.length;
    if (totalWords === 0) return 0;
    return Math.min(Math.abs(result.comparative) * 100, 100);
  }

  isStopWord(word) {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'];
    return stopWords.includes(word);
  }

  createEmptyAnalysis(threadInfo, error) {
    return {
      threadInfo: threadInfo,
      content: null,
      analysis: null,
      error: error,
      timestamp: new Date().toISOString()
    };
  }

  generateContentReport(results, totalThreads) {
    const validResults = results.filter(r => r.analysis !== null);
    const errorResults = results.filter(r => r.analysis === null);
    
    if (validResults.length === 0) {
      return {
        summary: {
          totalAnalyzed: results.length,
          successfulAnalyses: 0,
          errors: errorResults.length,
          message: 'No content could be analyzed'
        }
      };
    }
    
    // Aggregate sentiment
    const sentiments = validResults.map(r => r.analysis.sentiment.label);
    const sentimentCounts = sentiments.reduce((acc, sentiment) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});
    
    // Aggregate brand mentions
    const allBrandMentions = {};
    validResults.forEach(result => {
      Object.entries(result.analysis.brandMentions).forEach(([brand, data]) => {
        if (!allBrandMentions[brand]) {
          allBrandMentions[brand] = { 
            count: 0, 
            sentiment: [], 
            contexts: []
          };
        }
        allBrandMentions[brand].count += data.count;
        allBrandMentions[brand].sentiment.push(data.sentiment);
        allBrandMentions[brand].contexts.push(...data.contexts.slice(0, 2));
      });
    });
    
    // Top keywords across all threads
    const allKeywords = {};
    validResults.forEach(result => {
      result.analysis.keywords.topKeywords.forEach(kw => {
        allKeywords[kw.keyword] = (allKeywords[kw.keyword] || 0) + kw.count;
      });
    });
    
    const topKeywords = Object.entries(allKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));
    
    return {
      summary: {
        totalThreadsInDataset: totalThreads,
        threadsAnalyzed: results.length,
        successfulAnalyses: validResults.length,
        failedAnalyses: errorResults.length,
        timestamp: new Date().toISOString()
      },
      sentimentOverview: {
        distribution: sentimentCounts,
        averageScore: validResults.reduce((sum, r) => sum + r.analysis.sentiment.score, 0) / validResults.length
      },
      brandMentions: allBrandMentions,
      topKeywords: topKeywords,
      insights: this.generateContentInsights(validResults, allBrandMentions),
      recommendations: this.generateContentRecommendations(validResults, allBrandMentions)
    };
  }

  generateContentInsights(results, brandMentions) {
    const insights = [];
    
    // Brand visibility insight
    const catoMentions = brandMentions.cato ? brandMentions.cato.count : 0;
    const totalMentions = Object.values(brandMentions).reduce((sum, brand) => sum + brand.count, 0);
    
    insights.push({
      type: 'brand_visibility',
      title: 'Cato Brand Visibility in Actual Discussions',
      description: `Cato mentioned ${catoMentions} times out of ${totalMentions} total brand mentions (${totalMentions > 0 ? (catoMentions/totalMentions*100).toFixed(1) : 0}%)`,
      priority: catoMentions === 0 ? 'high' : catoMentions < totalMentions * 0.2 ? 'medium' : 'low'
    });
    
    // Sentiment insight
    const sentiments = results.map(r => r.analysis.sentiment.score);
    const avgSentiment = sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length;
    
    insights.push({
      type: 'sentiment_trend',
      title: 'Discussion Sentiment Analysis',
      description: `Average sentiment: ${avgSentiment.toFixed(2)} (${this.getSentimentLabel(avgSentiment)} overall)`,
      priority: avgSentiment < -1 ? 'high' : 'medium'
    });
    
    // Competitive landscape
    const competitors = Object.keys(brandMentions).filter(brand => brand !== 'cato');
    if (competitors.length > 0) {
      const topCompetitor = competitors.reduce((a, b) => 
        brandMentions[a].count > brandMentions[b].count ? a : b
      );
      
      insights.push({
        type: 'competitive_analysis',
        title: 'Competitive Landscape in Discussions',
        description: `Most mentioned competitor: ${topCompetitor} (${brandMentions[topCompetitor].count} mentions)`,
        priority: 'medium'
      });
    }
    
    return insights;
  }

  generateContentRecommendations(results, brandMentions) {
    const recommendations = [];
    
    const catoMentions = brandMentions.cato ? brandMentions.cato.count : 0;
    
    if (catoMentions === 0) {
      recommendations.push({
        type: 'brand_engagement',
        priority: 'high',
        title: 'CRITICAL: Zero Brand Visibility in Real Discussions',
        description: 'Cato is not being mentioned in actual Reddit conversations',
        actions: [
          'Actively engage in technical discussions with valuable insights',
          'Share real case studies and implementation experiences',
          'Answer networking/security questions to build thought leadership',
          'Participate in subreddit AMAs or technical discussions'
        ]
      });
    }
    
    // Competitor analysis
    const competitors = Object.keys(brandMentions).filter(brand => brand !== 'cato');
    if (competitors.length > 0) {
      const topCompetitor = competitors.reduce((a, b) => 
        brandMentions[a].count > brandMentions[b].count ? a : b
      );
      
      recommendations.push({
        type: 'competitive_positioning',
        priority: 'medium',
        title: 'Address Competitive Discussions',
        description: `${topCompetitor} leads mentions with ${brandMentions[topCompetitor].count} references`,
        actions: [
          'Monitor discussions where competitors are mentioned',
          'Provide alternative perspectives in competitive threads',
          'Share technical comparisons highlighting Cato advantages',
          'Build relationships in communities where competitors are active'
        ]
      });
    }
    
    return recommendations;
  }

  saveResults(report, detailedResults) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    // Save summary report
    const reportPath = path.join(__dirname, '..', `reddit-content-analysis-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save detailed results
    const detailsPath = path.join(__dirname, '..', `reddit-content-details-${timestamp}.json`);
    fs.writeFileSync(detailsPath, JSON.stringify(detailedResults, null, 2));
    
    console.log(`\n💾 Results saved:`);
    console.log(`   📊 Summary: reddit-content-analysis-${timestamp}.json`);
    console.log(`   📋 Details: reddit-content-details-${timestamp}.json`);
  }

  displayResults(report) {
    console.log('\n🎯 REDDIT CONTENT ANALYSIS RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`\n📊 ANALYSIS SUMMARY:`);
    console.log(`   Total Threads in Dataset: ${report.summary.totalThreadsInDataset}`);
    console.log(`   Threads Analyzed: ${report.summary.threadsAnalyzed}`);
    console.log(`   Successful Content Extractions: ${report.summary.successfulAnalyses}`);
    console.log(`   Failed Extractions: ${report.summary.failedAnalyses}`);
    
    if (report.sentimentOverview) {
      console.log(`\n😊 SENTIMENT ANALYSIS OF ACTUAL DISCUSSIONS:`);
      console.log(`   Average Sentiment Score: ${report.sentimentOverview.averageScore?.toFixed(2) || 'N/A'}`);
      console.log(`   Distribution:`);
      Object.entries(report.sentimentOverview.distribution || {}).forEach(([sentiment, count]) => {
        console.log(`     • ${sentiment}: ${count} threads`);
      });
    }
    
    if (report.brandMentions && Object.keys(report.brandMentions).length > 0) {
      console.log(`\n🏢 BRAND MENTIONS IN ACTUAL THREAD CONTENT:`);
      Object.entries(report.brandMentions).forEach(([brand, data]) => {
        const sentimentCounts = data.sentiment.reduce((acc, s) => {
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`   • ${brand.toUpperCase()}: ${data.count} mentions`);
        console.log(`     Sentiment breakdown: ${Object.entries(sentimentCounts).map(([s, c]) => `${s}: ${c}`).join(', ')}`);
        
        if (data.contexts.length > 0) {
          console.log(`     Context: "${data.contexts[0].substring(0, 100)}..."`);
        }
      });
    } else {
      console.log(`\n🏢 BRAND MENTIONS: None found in analyzed thread content`);
    }
    
    if (report.topKeywords && report.topKeywords.length > 0) {
      console.log(`\n🏷️ TOP KEYWORDS FROM ACTUAL DISCUSSIONS:`);
      report.topKeywords.slice(0, 10).forEach(kw => {
        console.log(`   • ${kw.keyword}: ${kw.count} occurrences`);
      });
    }
    
    if (report.insights) {
      console.log(`\n💡 KEY INSIGHTS FROM CONTENT ANALYSIS:`);
      report.insights.forEach((insight, index) => {
        console.log(`   ${index + 1}. [${insight.priority.toUpperCase()}] ${insight.title}`);
        console.log(`      ${insight.description}`);
      });
    }
    
    if (report.recommendations) {
      console.log(`\n🎯 CONTENT-BASED RECOMMENDATIONS:`);
      report.recommendations.forEach((rec, index) => {
        console.log(`\n   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`      ${rec.description}`);
        rec.actions.forEach(action => {
          console.log(`        • ${action}`);
        });
      });
    }
    
    console.log('\n' + '━'.repeat(60));
    console.log('📝 NOTE: This analysis is based on actual Reddit thread content,');
    console.log('   including post titles, descriptions, and user comments.');
    console.log('   This provides real sentiment and keyword insights.');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new RedditContentAnalyzer();
  analyzer.analyzeRedditContent().catch(console.error);
}

module.exports = RedditContentAnalyzer; 