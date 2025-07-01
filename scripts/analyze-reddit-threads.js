const XLSX = require('xlsx');
const Sentiment = require('sentiment');
const natural = require('natural');
const nlp = require('compromise');
const fs = require('fs');
const path = require('path');

class RedditThreadAnalyzer {
  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
  }

  // Read and parse Excel file
  readExcelFile(filePath) {
    console.log('📊 Reading Excel file:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log('📋 Available sheets:', sheetNames);
    
    const allData = {};
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      allData[sheetName] = jsonData;
      console.log(`  • ${sheetName}: ${jsonData.length} rows`);
    });
    
    return allData;
  }

  // Analyze sentiment for text content
  analyzeSentiment(text) {
    if (!text || typeof text !== 'string') {
      return {
        score: 0,
        comparative: 0,
        label: 'neutral',
        confidence: 0,
        words: []
      };
    }

    const result = this.sentiment.analyze(text);
    const label = this.getSentimentLabel(result.score);
    const confidence = this.calculateConfidence(result);

    return {
      score: result.score,
      comparative: result.comparative,
      label: label,
      confidence: confidence,
      words: result.words,
      positive: result.positive,
      negative: result.negative
    };
  }

  // Enhanced topic analysis
  analyzeTopics(text) {
    if (!text) return { topics: [], entities: {}, keyPhrases: [] };

    const doc = nlp(text);
    
    return {
      topics: doc.topics().out('array'),
      entities: {
        people: doc.people().out('array'),
        places: doc.places().out('array'),
        organizations: doc.organizations().out('array')
      },
      keyPhrases: doc.chunks().out('array').slice(0, 10),
      nouns: doc.nouns().out('array'),
      adjectives: doc.adjectives().out('array')
    };
  }

  // Analyze thread engagement patterns
  analyzeEngagement(threadData) {
    const metrics = {
      totalThreads: threadData.length,
      averageLength: 0,
      sentimentDistribution: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      topKeywords: {},
      engagementIndicators: {
        questions: 0,
        exclamations: 0,
        mentions: 0
      }
    };

    let totalLength = 0;
    const allKeywords = [];

    threadData.forEach(thread => {
      // Extract text content (adjust field names based on actual Excel structure)
      const textFields = ['title', 'content', 'text', 'body', 'comment', 'post'];
      let threadText = '';
      
      textFields.forEach(field => {
        if (thread[field]) {
          threadText += ' ' + thread[field];
        }
      });

      if (threadText.trim()) {
        totalLength += threadText.length;
        
        // Sentiment analysis
        const sentiment = this.analyzeSentiment(threadText);
        metrics.sentimentDistribution[sentiment.label]++;

        // Topic extraction
        const topics = this.analyzeTopics(threadText);
        allKeywords.push(...topics.topics, ...topics.nouns);

        // Engagement indicators
        if (threadText.includes('?')) metrics.engagementIndicators.questions++;
        if (threadText.includes('!')) metrics.engagementIndicators.exclamations++;
        if (threadText.includes('@')) metrics.engagementIndicators.mentions++;
      }
    });

    metrics.averageLength = totalLength / threadData.length;

    // Calculate top keywords
    const keywordCounts = {};
    allKeywords.forEach(keyword => {
      if (keyword && keyword.length > 2) {
        keywordCounts[keyword.toLowerCase()] = (keywordCounts[keyword.toLowerCase()] || 0) + 1;
      }
    });

    metrics.topKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    return metrics;
  }

  // Detailed per-thread analysis
  analyzeThreadDetails(threadData) {
    return threadData.map((thread, index) => {
      // Extract text content
      const textFields = ['title', 'content', 'text', 'body', 'comment', 'post'];
      let threadText = '';
      let originalFields = {};
      
      textFields.forEach(field => {
        if (thread[field]) {
          threadText += ' ' + thread[field];
          originalFields[field] = thread[field];
        }
      });

      if (!threadText.trim()) {
        return {
          id: index + 1,
          originalData: thread,
          analysis: null,
          error: 'No text content found'
        };
      }

      const sentiment = this.analyzeSentiment(threadText);
      const topics = this.analyzeTopics(threadText);
      const readability = this.calculateReadability(threadText);

      return {
        id: index + 1,
        originalData: thread,
        extractedText: threadText.trim(),
        textFields: originalFields,
        sentiment: sentiment,
        topics: topics,
        readability: readability,
        metadata: {
          length: threadText.length,
          wordCount: this.tokenizer.tokenize(threadText).length,
          sentenceCount: threadText.split(/[.!?]+/).length
        }
      };
    });
  }

  // Calculate readability score
  calculateReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const words = this.tokenizer.tokenize(text).length;
    const avgWordsPerSentence = words / sentences;
    
    return {
      wordsPerSentence: avgWordsPerSentence,
      readabilityLevel: avgWordsPerSentence < 15 ? 'easy' : 
                      avgWordsPerSentence < 25 ? 'medium' : 'hard',
      totalWords: words,
      totalSentences: sentences
    };
  }

  // Generate comprehensive report
  generateReport(data, detailedAnalysis, overallMetrics) {
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        totalSheets: Object.keys(data).length,
        totalThreads: overallMetrics.totalThreads,
        analysisComplete: true
      },
      overallMetrics: overallMetrics,
      sentimentInsights: this.generateSentimentInsights(detailedAnalysis),
      topicInsights: this.generateTopicInsights(detailedAnalysis),
      recommendations: this.generateRecommendations(overallMetrics, detailedAnalysis),
      detailedResults: detailedAnalysis.slice(0, 10) // Top 10 for preview
    };

    return report;
  }

  // Generate sentiment insights
  generateSentimentInsights(detailedAnalysis) {
    const validAnalysis = detailedAnalysis.filter(thread => thread.analysis !== null);
    
    const sentiments = validAnalysis.map(thread => thread.sentiment.score);
    const avgSentiment = sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length;
    
    const positiveThreads = validAnalysis.filter(thread => thread.sentiment.label === 'positive');
    const negativeThreads = validAnalysis.filter(thread => thread.sentiment.label === 'negative');
    
    return {
      averageSentimentScore: avgSentiment,
      sentimentTrend: avgSentiment > 1 ? 'positive' : avgSentiment < -1 ? 'negative' : 'neutral',
      mostPositive: positiveThreads
        .sort((a, b) => b.sentiment.score - a.sentiment.score)
        .slice(0, 3)
        .map(thread => ({
          id: thread.id,
          score: thread.sentiment.score,
          text: thread.extractedText.substring(0, 100) + '...'
        })),
      mostNegative: negativeThreads
        .sort((a, b) => a.sentiment.score - b.sentiment.score)
        .slice(0, 3)
        .map(thread => ({
          id: thread.id,
          score: thread.sentiment.score,
          text: thread.extractedText.substring(0, 100) + '...'
        }))
    };
  }

  // Generate topic insights
  generateTopicInsights(detailedAnalysis) {
    const allTopics = detailedAnalysis
      .filter(thread => thread.analysis !== null)
      .flatMap(thread => thread.topics.topics);
    
    const topicCounts = {};
    allTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    const dominantTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    return {
      dominantTopics: dominantTopics,
      totalUniqueTopics: Object.keys(topicCounts).length,
      topicDiversity: Object.keys(topicCounts).length / detailedAnalysis.length
    };
  }

  // Generate recommendations
  generateRecommendations(metrics, detailedAnalysis) {
    const recommendations = [];

    // Sentiment recommendations
    const negativeRatio = metrics.sentimentDistribution.negative / metrics.totalThreads;
    if (negativeRatio > 0.3) {
      recommendations.push({
        type: 'sentiment_concern',
        priority: 'high',
        title: 'High Negative Sentiment Detected',
        description: `${(negativeRatio * 100).toFixed(1)}% of threads show negative sentiment`,
        action: 'Consider addressing common pain points and improving user experience'
      });
    }

    // Engagement recommendations
    if (metrics.engagementIndicators.questions > metrics.totalThreads * 0.5) {
      recommendations.push({
        type: 'engagement_opportunity',
        priority: 'medium',
        title: 'High Question Volume',
        description: 'Many threads contain questions that could be addressed',
        action: 'Create FAQ content or community guidelines to address common questions'
      });
    }

    // Content recommendations
    if (metrics.averageLength < 50) {
      recommendations.push({
        type: 'content_quality',
        priority: 'low',
        title: 'Short Thread Content',
        description: 'Average thread length is quite short',
        action: 'Encourage more detailed discussions and engagement'
      });
    }

    return recommendations;
  }

  // Helper methods
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
    
    const strength = Math.abs(result.comparative);
    return Math.min(strength * 100, 100);
  }
}

// Main execution
async function analyzeRedditThreads() {
  console.log('🚀 Starting Reddit Threads Sentiment Analysis...\n');
  
  const analyzer = new RedditThreadAnalyzer();
  const filePath = path.join(__dirname, '..', 'Cato - Existing Reddit Threads.xlsx');
  
  try {
    // Read Excel file
    const data = analyzer.readExcelFile(filePath);
    
    // Analyze each sheet
    let allThreads = [];
    const sheetAnalyses = {};
    
    for (const [sheetName, sheetData] of Object.entries(data)) {
      console.log(`\n📊 Analyzing sheet: ${sheetName}`);
      
      const detailedAnalysis = analyzer.analyzeThreadDetails(sheetData);
      const metrics = analyzer.analyzeEngagement(sheetData);
      
      sheetAnalyses[sheetName] = {
        metrics: metrics,
        detailedAnalysis: detailedAnalysis
      };
      
      allThreads = allThreads.concat(detailedAnalysis);
      
      console.log(`  ✅ Analyzed ${sheetData.length} threads`);
      console.log(`  📈 Sentiment: ${metrics.sentimentDistribution.positive} positive, ${metrics.sentimentDistribution.negative} negative, ${metrics.sentimentDistribution.neutral} neutral`);
    }
    
    // Generate overall analysis
    const overallMetrics = analyzer.analyzeEngagement(allThreads.map(t => t.originalData));
    const report = analyzer.generateReport(data, allThreads, overallMetrics);
    
    // Save results
    const resultsPath = path.join(__dirname, '..', 'reddit-analysis-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(report, null, 2));
    
    console.log('\n🎉 Analysis Complete!');
    console.log(`📄 Results saved to: ${resultsPath}`);
    
    // Print summary
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 Total Threads: ${report.overallMetrics.totalThreads}`);
    console.log(`📈 Sentiment Distribution:`);
    console.log(`   • Positive: ${report.overallMetrics.sentimentDistribution.positive} (${(report.overallMetrics.sentimentDistribution.positive/report.overallMetrics.totalThreads*100).toFixed(1)}%)`);
    console.log(`   • Neutral:  ${report.overallMetrics.sentimentDistribution.neutral} (${(report.overallMetrics.sentimentDistribution.neutral/report.overallMetrics.totalThreads*100).toFixed(1)}%)`);
    console.log(`   • Negative: ${report.overallMetrics.sentimentDistribution.negative} (${(report.overallMetrics.sentimentDistribution.negative/report.overallMetrics.totalThreads*100).toFixed(1)}%)`);
    console.log(`📊 Average Content Length: ${report.overallMetrics.averageLength.toFixed(0)} characters`);
    console.log(`💬 Engagement Indicators:`);
    console.log(`   • Questions: ${report.overallMetrics.engagementIndicators.questions}`);
    console.log(`   • Exclamations: ${report.overallMetrics.engagementIndicators.exclamations}`);
    console.log(`   • Mentions: ${report.overallMetrics.engagementIndicators.mentions}`);
    
    console.log(`\n🏷️ TOP KEYWORDS:`);
    Object.entries(report.overallMetrics.topKeywords).slice(0, 10).forEach(([keyword, count]) => {
      console.log(`   • ${keyword}: ${count}`);
    });
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      report.recommendations.forEach(rec => {
        console.log(`   🔸 [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`     ${rec.description}`);
        console.log(`     Action: ${rec.action}\n`);
      });
    }
    
    console.log(`\n🔗 For detailed analysis, check: reddit-analysis-results.json`);
    
  } catch (error) {
    console.error('❌ Error analyzing Reddit threads:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the analysis
if (require.main === module) {
  analyzeRedditThreads();
}

module.exports = RedditThreadAnalyzer; 