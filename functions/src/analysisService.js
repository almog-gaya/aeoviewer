const natural = require('natural');
const Sentiment = require('sentiment');
const nlp = require('compromise');
const AnalysisHelpers = require('./analysisHelpers');

class ResponseAnalysisService {
  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.helpers = new AnalysisHelpers();
  }

  // Main analysis function
  async analyzeResponse(response, brand, competitors, keywords) {
    const analysis = {
      brandAnalysis: this.analyzeBrandMentions(response, brand),
      competitorAnalysis: this.analyzeCompetitors(response, competitors),
      sentimentAnalysis: this.analyzeSentiment(response, brand),
      positionAnalysis: this.analyzePositions(response, brand, competitors),
      topicAnalysis: this.analyzeTopics(response, keywords),
      accuracyFlags: this.flagPotentialInaccuracies(response, brand),
      readabilityScore: this.calculateReadability(response),
      keyPhrases: this.extractKeyPhrases(response),
      entityExtraction: this.extractEntities(response)
    };

    return analysis;
  }

  // Enhanced brand mention analysis
  analyzeBrandMentions(response, brand) {
    const mentions = [];
    const lowerResponse = response.toLowerCase();
    const lowerBrand = brand.toLowerCase();
    
    // Find all mentions with context
    let index = lowerResponse.indexOf(lowerBrand);
    while (index !== -1) {
      const contextStart = Math.max(0, index - 50);
      const contextEnd = Math.min(response.length, index + brand.length + 50);
      const context = response.substring(contextStart, contextEnd);
      
      mentions.push({
        position: index,
        context: context,
        sentence: this.getSentenceContaining(response, index),
        sentiment: this.getContextualSentiment(context, brand)
      });
      
      index = lowerResponse.indexOf(lowerBrand, index + 1);
    }

    return {
      count: mentions.length,
      mentions: mentions,
      overallSentiment: this.calculateOverallBrandSentiment(mentions),
      prominence: this.calculateProminence(response, mentions)
    };
  }

  // Competitor analysis with relative positioning
  analyzeCompetitors(response, competitors) {
    return competitors.map(competitor => {
      const mentions = this.findMentionsWithContext(response, competitor);
      const brandPosition = this.helpers.getAveragePosition(response, competitor);
      
      return {
        name: competitor,
        mentions: mentions,
        count: mentions.length,
        averagePosition: brandPosition,
        sentiment: this.helpers.getCompetitorSentiment(mentions),
        strengthIndicators: this.helpers.findStrengthIndicators(mentions),
        weaknessIndicators: this.helpers.findWeaknessIndicators(mentions)
      };
    });
  }

  // Advanced sentiment analysis
  analyzeSentiment(response, brand) {
    const overallSentiment = this.sentiment.analyze(response);
    const brandSpecificSentiment = this.helpers.getBrandSpecificSentiment(response, brand);
    
    return {
      overall: {
        score: overallSentiment.score,
        comparative: overallSentiment.comparative,
        label: this.sentimentToLabel(overallSentiment.score)
      },
      brandSpecific: brandSpecificSentiment,
      emotionalTone: this.helpers.analyzeEmotionalTone(response),
      confidence: this.helpers.calculateSentimentConfidence(response, brand)
    };
  }

  // Position and ranking analysis
  analyzePositions(response, brand, competitors) {
    const allBrands = [brand, ...competitors];
    const positions = [];
    
    allBrands.forEach(brandName => {
      const mentions = this.findMentionsWithContext(response, brandName);
      mentions.forEach(mention => {
        positions.push({
          brand: brandName,
          position: mention.position,
          context: mention.context,
          isMainBrand: brandName === brand
        });
      });
    });

    // Sort by position
    positions.sort((a, b) => a.position - b.position);
    
    return {
      brandRanking: this.helpers.calculateBrandRanking(positions, brand),
      firstMentionPosition: this.helpers.getFirstMentionPosition(positions, brand),
      mentionDensity: this.helpers.calculateMentionDensity(response, positions),
      competitiveContext: this.helpers.analyzeCompetitiveContext(positions, brand)
    };
  }

  // Topic extraction and categorization
  analyzeTopics(response, keywords) {
    const doc = nlp(response);
    
    return {
      mainTopics: this.helpers.extractMainTopics(doc),
      keywordRelevance: this.helpers.analyzeKeywordRelevance(response, keywords),
      topicCategories: this.helpers.categorizeTopics(doc),
      technicalTerms: this.helpers.extractTechnicalTerms(doc),
      featuresMentioned: this.helpers.extractFeatures(doc)
    };
  }

  // Accuracy flag detection
  flagPotentialInaccuracies(response, brand) {
    const flags = [];
    
    // Look for absolute statements that might be inaccurate
    const absoluteWords = ['always', 'never', 'best', 'worst', 'only', 'all', 'none'];
    absoluteWords.forEach(word => {
      if (response.toLowerCase().includes(word)) {
        flags.push({
          type: 'absolute_statement',
          word: word,
          context: this.getContextAround(response, word),
          severity: 'medium'
        });
      }
    });

    // Look for pricing claims without dates
    const pricingRegex = /\$[\d,]+|\bcheap\b|\bexpensive\b|\bfree\b/gi;
    const pricingMatches = response.match(pricingRegex);
    if (pricingMatches) {
      flags.push({
        type: 'pricing_claim',
        claims: pricingMatches,
        severity: 'high',
        reason: 'Pricing information may be outdated'
      });
    }

    // Look for feature claims
    const featureWords = ['features', 'includes', 'offers', 'provides', 'supports'];
    featureWords.forEach(word => {
      if (response.toLowerCase().includes(word)) {
        const context = this.getContextAround(response, word);
        if (context.includes(brand.toLowerCase())) {
          flags.push({
            type: 'feature_claim',
            context: context,
            severity: 'medium',
            reason: 'Feature claims should be verified'
          });
        }
      }
    });

    return flags;
  }

  // Helper methods
  getSentenceContaining(text, position) {
    const sentences = text.split(/[.!?]+/);
    let currentPos = 0;
    
    for (let sentence of sentences) {
      if (currentPos + sentence.length >= position) {
        return sentence.trim();
      }
      currentPos += sentence.length + 1;
    }
    return '';
  }

  getContextualSentiment(context, brand) {
    const brandSentences = context.split(/[.!?]+/).filter(s => 
      s.toLowerCase().includes(brand.toLowerCase())
    );
    
    if (brandSentences.length === 0) return 'neutral';
    
    const sentimentScore = brandSentences.reduce((sum, sentence) => {
      return sum + this.sentiment.analyze(sentence).score;
    }, 0) / brandSentences.length;
    
    return this.sentimentToLabel(sentimentScore);
  }

  sentimentToLabel(score) {
    if (score > 1) return 'very_positive';
    if (score > 0) return 'positive';
    if (score < -1) return 'very_negative';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  calculateOverallBrandSentiment(mentions) {
    if (mentions.length === 0) return 'neutral';
    
    const sentimentCounts = mentions.reduce((acc, mention) => {
      acc[mention.sentiment] = (acc[mention.sentiment] || 0) + 1;
      return acc;
    }, {});

    // Return the most common sentiment
    return Object.keys(sentimentCounts).reduce((a, b) => 
      sentimentCounts[a] > sentimentCounts[b] ? a : b
    );
  }

  calculateProminence(response, mentions) {
    if (mentions.length === 0) return 0;
    
    const totalLength = response.length;
    const firstMentionPosition = mentions[0]?.position || totalLength;
    
    // Prominence score based on position and frequency
    const positionScore = 1 - (firstMentionPosition / totalLength);
    const frequencyScore = Math.min(mentions.length / 5, 1); // Cap at 5 mentions
    
    return (positionScore * 0.6 + frequencyScore * 0.4);
  }

  findMentionsWithContext(response, term) {
    const mentions = [];
    const lowerResponse = response.toLowerCase();
    const lowerTerm = term.toLowerCase();
    
    let index = lowerResponse.indexOf(lowerTerm);
    while (index !== -1) {
      mentions.push({
        position: index,
        context: this.getContextAround(response, term, index),
        sentence: this.getSentenceContaining(response, index)
      });
      index = lowerResponse.indexOf(lowerTerm, index + 1);
    }
    
    return mentions;
  }

  getContextAround(text, term, startIndex = 0) {
    const index = startIndex || text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + term.length + 30);
    return text.substring(start, end);
  }

  calculateReadability(response) {
    const sentences = response.split(/[.!?]+/).length;
    const words = this.tokenizer.tokenize(response).length;
    const avgWordsPerSentence = words / sentences;
    
    // Simple readability score
    return {
      wordsPerSentence: avgWordsPerSentence,
      readabilityLevel: avgWordsPerSentence < 15 ? 'easy' : 
                      avgWordsPerSentence < 25 ? 'medium' : 'hard'
    };
  }

  extractKeyPhrases(response) {
    const doc = nlp(response);
    return doc.chunks().out('array').slice(0, 10); // Top 10 phrases
  }

  extractEntities(response) {
    const doc = nlp(response);
    return {
      organizations: doc.organizations().out('array'),
      people: doc.people().out('array'),
      places: doc.places().out('array'),
      dates: doc.dates().out('array')
    };
  }
}

module.exports = ResponseAnalysisService; 