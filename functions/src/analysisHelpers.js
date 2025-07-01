const natural = require('natural');
const Sentiment = require('sentiment');

class AnalysisHelpers {
  constructor() {
    this.sentiment = new Sentiment();
  }

  // Position analysis helpers
  getAveragePosition(response, term) {
    const positions = [];
    const lowerResponse = response.toLowerCase();
    const lowerTerm = term.toLowerCase();
    
    let index = lowerResponse.indexOf(lowerTerm);
    while (index !== -1) {
      positions.push(index);
      index = lowerResponse.indexOf(lowerTerm, index + 1);
    }
    
    if (positions.length === 0) return null;
    return positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
  }

  calculateBrandRanking(positions, brand) {
    const brandPositions = positions.filter(p => p.brand === brand);
    if (brandPositions.length === 0) return null;
    
    const firstBrandMention = Math.min(...brandPositions.map(p => p.position));
    const earlierMentions = positions.filter(p => p.position < firstBrandMention && p.brand !== brand);
    
    return earlierMentions.length + 1; // Ranking (1st, 2nd, etc.)
  }

  getFirstMentionPosition(positions, brand) {
    const brandPositions = positions.filter(p => p.brand === brand);
    if (brandPositions.length === 0) return null;
    
    return Math.min(...brandPositions.map(p => p.position));
  }

  calculateMentionDensity(response, positions) {
    const totalLength = response.length;
    const totalMentions = positions.length;
    
    return {
      mentionsPerCharacter: totalMentions / totalLength,
      mentionsPerWord: totalMentions / (response.split(' ').length),
      distribution: this.calculateMentionDistribution(response, positions)
    };
  }

  calculateMentionDistribution(response, positions) {
    const totalLength = response.length;
    const sections = 4; // Divide into quarters
    const sectionSize = totalLength / sections;
    const distribution = new Array(sections).fill(0);
    
    positions.forEach(pos => {
      const section = Math.min(Math.floor(pos.position / sectionSize), sections - 1);
      distribution[section]++;
    });
    
    return distribution.map((count, index) => ({
      section: `Q${index + 1}`,
      mentions: count,
      percentage: (count / positions.length) * 100
    }));
  }

  analyzeCompetitiveContext(positions, brand) {
    const brandMentions = positions.filter(p => p.brand === brand);
    const competitorMentions = positions.filter(p => p.brand !== brand);
    
    if (brandMentions.length === 0) {
      return {
        mentionedWithCompetitors: false,
        competitorProximity: null,
        comparisonContext: []
      };
    }

    const proximityAnalysis = brandMentions.map(brandPos => {
      const nearbyCompetitors = competitorMentions.filter(compPos => 
        Math.abs(compPos.position - brandPos.position) < 100 // Within 100 characters
      );
      
      return {
        brandContext: brandPos.context,
        nearbyCompetitors: nearbyCompetitors.map(comp => ({
          name: comp.brand,
          distance: Math.abs(comp.position - brandPos.position),
          context: comp.context
        }))
      };
    });

    return {
      mentionedWithCompetitors: proximityAnalysis.some(p => p.nearbyCompetitors.length > 0),
      competitorProximity: proximityAnalysis,
      comparisonContext: this.extractComparisonPhrases(positions, brand)
    };
  }

  extractComparisonPhrases(positions, brand) {
    const comparisonWords = ['vs', 'versus', 'compared to', 'better than', 'worse than', 'similar to', 'unlike', 'while'];
    const phrases = [];
    
    positions.forEach(pos => {
      comparisonWords.forEach(word => {
        if (pos.context.toLowerCase().includes(word)) {
          phrases.push({
            phrase: word,
            context: pos.context,
            brand: pos.brand,
            isMainBrand: pos.brand === brand
          });
        }
      });
    });
    
    return phrases;
  }

  // Competitor sentiment analysis
  getCompetitorSentiment(mentions) {
    if (mentions.length === 0) return 'neutral';
    
    const sentimentScores = mentions.map(mention => 
      this.sentiment.analyze(mention.context).score
    );
    
    const avgScore = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    return this.sentimentToLabel(avgScore);
  }

  findStrengthIndicators(mentions) {
    const strengthWords = [
      'best', 'excellent', 'outstanding', 'superior', 'leading', 'top',
      'innovative', 'advanced', 'powerful', 'robust', 'comprehensive',
      'user-friendly', 'intuitive', 'reliable', 'trusted', 'popular'
    ];
    
    const indicators = [];
    mentions.forEach(mention => {
      strengthWords.forEach(word => {
        if (mention.context.toLowerCase().includes(word)) {
          indicators.push({
            word: word,
            context: mention.context,
            sentence: mention.sentence
          });
        }
      });
    });
    
    return indicators;
  }

  findWeaknessIndicators(mentions) {
    const weaknessWords = [
      'expensive', 'costly', 'limited', 'lacking', 'poor', 'weak',
      'difficult', 'complex', 'slow', 'outdated', 'basic', 'simple',
      'however', 'but', 'unfortunately', 'disappointingly'
    ];
    
    const indicators = [];
    mentions.forEach(mention => {
      weaknessWords.forEach(word => {
        if (mention.context.toLowerCase().includes(word)) {
          indicators.push({
            word: word,
            context: mention.context,
            sentence: mention.sentence
          });
        }
      });
    });
    
    return indicators;
  }

  // Advanced sentiment helpers
  getBrandSpecificSentiment(response, brand) {
    const sentences = response.split(/[.!?]+/);
    const brandSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes(brand.toLowerCase())
    );
    
    if (brandSentences.length === 0) {
      return { score: 0, label: 'neutral', confidence: 0 };
    }

    const sentiments = brandSentences.map(sentence => this.sentiment.analyze(sentence));
    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    const confidence = this.calculateConfidence(sentiments);
    
    return {
      score: avgScore,
      label: this.sentimentToLabel(avgScore),
      confidence: confidence,
      sentences: brandSentences.length
    };
  }

  analyzeEmotionalTone(response) {
    const emotionWords = {
      excitement: ['amazing', 'fantastic', 'incredible', 'awesome', 'brilliant'],
      concern: ['worried', 'concerned', 'problematic', 'issue', 'trouble'],
      confidence: ['confident', 'sure', 'certain', 'definitely', 'absolutely'],
      uncertainty: ['maybe', 'perhaps', 'might', 'could', 'possibly']
    };
    
    const tones = {};
    Object.keys(emotionWords).forEach(emotion => {
      const count = emotionWords[emotion].filter(word => 
        response.toLowerCase().includes(word)
      ).length;
      tones[emotion] = count;
    });
    
    return tones;
  }

  calculateSentimentConfidence(response, brand) {
    const sentences = response.split(/[.!?]+/);
    const brandSentences = sentences.filter(s => 
      s.toLowerCase().includes(brand.toLowerCase())
    );
    
    if (brandSentences.length === 0) return 0;
    
    const sentiments = brandSentences.map(s => this.sentiment.analyze(s));
    const consistency = this.calculateSentimentConsistency(sentiments);
    const strength = this.calculateSentimentStrength(sentiments);
    
    return (consistency + strength) / 2;
  }

  calculateConfidence(sentiments) {
    if (sentiments.length === 0) return 0;
    
    const scores = sentiments.map(s => Math.abs(s.score));
    const avgStrength = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const consistency = this.calculateSentimentConsistency(sentiments);
    
    return Math.min((avgStrength * 0.6 + consistency * 0.4) * 100, 100);
  }

  calculateSentimentConsistency(sentiments) {
    if (sentiments.length <= 1) return 1;
    
    const labels = sentiments.map(s => this.sentimentToLabel(s.score));
    const uniqueLabels = [...new Set(labels)];
    
    return 1 - (uniqueLabels.length - 1) / (sentiments.length - 1);
  }

  calculateSentimentStrength(sentiments) {
    if (sentiments.length === 0) return 0;
    
    const avgAbsScore = sentiments.reduce((sum, s) => sum + Math.abs(s.score), 0) / sentiments.length;
    return Math.min(avgAbsScore / 5, 1); // Normalize to 0-1
  }

  // Topic analysis helpers
  extractMainTopics(doc) {
    const topics = doc.topics().out('array');
    const nouns = doc.nouns().out('array');
    
    // Combine and rank by frequency
    const allTopics = [...topics, ...nouns];
    const topicCounts = {};
    
    allTopics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
  }

  analyzeKeywordRelevance(response, keywords) {
    const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase());
    const lowerResponse = response.toLowerCase();
    
    return keywordArray.map(keyword => {
      const mentions = (lowerResponse.match(new RegExp(keyword, 'g')) || []).length;
      const relevanceScore = mentions / response.split(' ').length * 1000; // Per 1000 words
      
      return {
        keyword: keyword,
        mentions: mentions,
        relevanceScore: relevanceScore,
        contextual: this.getKeywordContext(response, keyword)
      };
    });
  }

  getKeywordContext(response, keyword) {
    const contexts = [];
    const regex = new RegExp(`.{0,30}${keyword}.{0,30}`, 'gi');
    const matches = response.match(regex);
    
    if (matches) {
      contexts.push(...matches.slice(0, 3)); // Max 3 contexts
    }
    
    return contexts;
  }

  categorizeTopics(doc) {
    const categories = {
      technology: ['software', 'platform', 'tool', 'app', 'system', 'technology'],
      business: ['business', 'company', 'enterprise', 'organization', 'corporate'],
      features: ['feature', 'functionality', 'capability', 'option', 'integration'],
      pricing: ['price', 'cost', 'pricing', 'plan', 'subscription', 'free'],
      performance: ['performance', 'speed', 'fast', 'efficient', 'scalable']
    };
    
    const text = doc.out('text').toLowerCase();
    const categoryCounts = {};
    
    Object.keys(categories).forEach(category => {
      const count = categories[category].filter(word => text.includes(word)).length;
      categoryCounts[category] = count;
    });
    
    return categoryCounts;
  }

  extractTechnicalTerms(doc) {
    const technicalPatterns = [
      /API/gi, /SDK/gi, /REST/gi, /JSON/gi, /XML/gi,
      /cloud/gi, /SaaS/gi, /database/gi, /analytics/gi,
      /integration/gi, /automation/gi, /dashboard/gi
    ];
    
    const text = doc.out('text');
    const terms = [];
    
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        terms.push(...matches);
      }
    });
    
    return [...new Set(terms)]; // Remove duplicates
  }

  extractFeatures(doc) {
    const featureKeywords = [
      'includes', 'features', 'offers', 'provides', 'supports',
      'enables', 'allows', 'comes with', 'built-in'
    ];
    
    const sentences = doc.sentences().out('array');
    const features = [];
    
    sentences.forEach(sentence => {
      featureKeywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) {
          // Extract what comes after the feature keyword
          const parts = sentence.split(new RegExp(keyword, 'i'));
          if (parts.length > 1) {
            features.push({
              keyword: keyword,
              description: parts[1].trim().substring(0, 100), // First 100 chars
              fullSentence: sentence
            });
          }
        }
      });
    });
    
    return features;
  }

  sentimentToLabel(score) {
    if (score > 2) return 'very_positive';
    if (score > 0.5) return 'positive';
    if (score < -2) return 'very_negative';
    if (score < -0.5) return 'negative';
    return 'neutral';
  }
}

module.exports = AnalysisHelpers; 