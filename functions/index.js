const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ResponseAnalysisService = require('./src/analysisService');

admin.initializeApp();

const db = admin.firestore();
const analysisService = new ResponseAnalysisService();

// Process scan requests
exports.processScan = functions.https.onCall(async (data, context) => {
  // In a production environment, we would check authentication here
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  // }
  
  const { brand, competitors, keywords, persona, engines } = data;
  
  // Create scan record with a temporary user ID
  const userId = data.userId || 'anonymous-user';
  
  // Create scan record
  const scanRef = await db.collection('scans').add({
    userId: userId,
    prompt: `What are the best ${keywords} for a ${persona}?`,
    brand,
    competitors,
    keywords,
    persona,
    engines,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // For each engine, process the query
  const responsePromises = engines.map(async (engine) => {
    // Placeholder for actual AI API calls
    const aiResponse = await callAiEngine(engine, brand, competitors, keywords, persona);
    
    // Analyze response using advanced analysis
    const analysisResult = await analysisService.analyzeResponse(aiResponse, brand, competitors, keywords);
    
    // Store response with enhanced analysis
    return db.collection('responses').add({
      scanId: scanRef.id,
      engineName: engine,
      response: aiResponse,
      
      // Legacy format for compatibility
      brandMentions: {
        count: analysisResult.brandAnalysis.count,
        positions: analysisResult.brandAnalysis.mentions.map(m => m.position),
        sentiment: analysisResult.brandAnalysis.overallSentiment
      },
      competitors: analysisResult.competitorAnalysis.map(comp => ({
        name: comp.name,
        count: comp.count,
        sentiment: comp.sentiment
      })),
      
      // Advanced analysis data
      advancedAnalysis: {
        brandAnalysis: analysisResult.brandAnalysis,
        competitorAnalysis: analysisResult.competitorAnalysis,
        sentimentAnalysis: analysisResult.sentimentAnalysis,
        positionAnalysis: analysisResult.positionAnalysis,
        topicAnalysis: analysisResult.topicAnalysis,
        accuracyFlags: analysisResult.accuracyFlags,
        readabilityScore: analysisResult.readabilityScore,
        keyPhrases: analysisResult.keyPhrases,
        entityExtraction: analysisResult.entityExtraction
      },
      
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await Promise.all(responsePromises);
  
  // Update scan status
  await scanRef.update({
    status: 'complete',
    completedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Get the updated scan with all responses
  const responsesSnapshot = await db.collection('responses')
    .where('scanId', '==', scanRef.id)
    .get();
    
  const responses = [];
  responsesSnapshot.forEach(doc => {
    responses.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  // Get the scan data
  const scanSnapshot = await scanRef.get();
  const scanData = {
    id: scanSnapshot.id,
    ...scanSnapshot.data()
  };
  
  // Return the complete scan data with responses
  return {
    ...scanData,
    responses
  };
});

// Placeholder for AI engine call
async function callAiEngine(engine, brand, competitors, keywords, persona) {
  // This would be replaced with actual API calls to the AI engines
  // Return enhanced mock responses for now
  const responses = {
    gpt4: `When looking for ${keywords} solutions, ${persona}s have several excellent options to consider. ${brand} stands out as a leading provider with comprehensive features including advanced analytics, real-time monitoring, and seamless integrations. It offers robust automation workflows and A/B testing capabilities that many marketing professionals find valuable. However, it is priced at a premium compared to some alternatives like ${competitors[0]} and ${competitors[1]}. 

${competitors[0]} provides user-friendly templates and strong email deliverability, making it a popular choice for small to medium businesses. ${competitors[1]} excels in API integration and developer-friendly features, while ${competitors[2] || 'other solutions'} offer competitive pricing and solid customer support.

For ${persona}s evaluating these tools, key factors include feature completeness, ease of use, pricing structure, and integration capabilities. ${brand} consistently receives positive reviews for its intuitive interface and excellent customer support, though some users note that the learning curve can be steep for advanced features.`,
    
    claude: `For ${persona}s seeking ${keywords} tools, I recommend considering several factors when evaluating your options. Based on current market analysis, there are several strong contenders worth examining.

${competitors[0]} has established itself as a market leader with an intuitive interface and comprehensive feature set. It's particularly well-suited for teams that prioritize ease of use and quick implementation. ${competitors[1]} offers excellent deliverability rates and robust API integration, making it a favorite among developers and technical teams.

${brand} provides a comprehensive platform with advanced ${keywords} features including sophisticated automation, detailed analytics, and customizable workflows. Many ${persona}s appreciate its dashboard visualization and reporting capabilities. The platform excels in areas such as campaign management, lead scoring, and integration with CRM systems.

When comparing these solutions, consider your specific requirements for scalability, technical support, and budget constraints. Each platform has different pricing tiers to accommodate various business sizes and needs.`,
    
    gemini: `As a ${persona} looking for ${keywords} solutions, you should evaluate several key options in the current market. Here's my analysis of the top platforms:

${brand} offers a comprehensive suite of ${keywords} tools with particular strengths in automation and analytics. The platform includes features such as advanced segmentation, behavioral tracking, and multi-channel campaign management. Many users find its reporting dashboard particularly valuable for tracking ROI and campaign performance.

${competitors[0]} is known for its user-friendly approach and extensive template library. It's often recommended for teams that need quick setup and reliable performance. ${competitors[1]} stands out for its technical capabilities and integration options, particularly with popular CRM and e-commerce platforms.

Key considerations for ${persona}s include:
- Feature depth and customization options
- Integration capabilities with existing tools
- Pricing structure and scalability
- Customer support quality and response times
- Learning curve and team training requirements

The choice ultimately depends on your specific workflow needs, technical requirements, and budget parameters.`,
    
    perplexity: `Based on comprehensive market research, here are the top ${keywords} solutions for ${persona}s in 2024:

**Leading Platforms:**
1. ${competitors[0]} - Excellent for beginners and small teams, known for reliable delivery and extensive templates
2. ${competitors[1]} - Developer-friendly with strong API capabilities and advanced automation
3. ${competitors[2] || 'Alternative solutions'} - Good value proposition with solid customer support

**Emerging Options:**
${brand} has been gaining traction in the ${keywords} space, particularly among ${persona}s who value advanced analytics and customization. The platform offers comprehensive automation features, detailed performance tracking, and integration with popular business tools.

**Key Factors to Consider:**
- Ease of use vs. feature complexity
- Pricing models (per contact, monthly, or usage-based)
- Integration ecosystem
- Deliverability rates and reputation management
- Customer support and onboarding assistance

Current trends show that ${persona}s are increasingly prioritizing platforms that offer AI-powered optimization, advanced segmentation capabilities, and omnichannel marketing support. Consider running pilot campaigns with your top 2-3 choices to evaluate real-world performance.`
  };
  
  return responses[engine] || `${engine} provides various solutions for ${keywords}, catering to ${persona}s with different needs and preferences. Key factors to consider when selecting a tool include features, pricing, ease of use, and customer support.`;
}

// Create advanced analysis summary function
exports.generateAnalysisSummary = functions.https.onCall(async (data, context) => {
  const { scanId } = data;
  
  // Get all responses for this scan
  const responsesSnapshot = await db.collection('responses')
    .where('scanId', '==', scanId)
    .get();
  
  if (responsesSnapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'No responses found for this scan');
  }
  
  const responses = [];
  responsesSnapshot.forEach(doc => {
    responses.push({ id: doc.id, ...doc.data() });
  });
  
  // Generate cross-engine analysis summary
  const summary = generateCrossEngineAnalysis(responses);
  
  // Store the summary
  await db.collection('analysis_summaries').add({
    scanId: scanId,
    summary: summary,
    generatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return summary;
});

function generateCrossEngineAnalysis(responses) {
  const engines = responses.map(r => r.engineName);
  
  // Aggregate brand mentions across engines
  const totalBrandMentions = responses.reduce((sum, r) => sum + (r.brandMentions?.count || 0), 0);
  const averageSentiment = calculateAverageSentiment(responses);
  
  // Find most common accuracy flags
  const allFlags = responses.flatMap(r => r.advancedAnalysis?.accuracyFlags || []);
  const flagCounts = allFlags.reduce((acc, flag) => {
    acc[flag.type] = (acc[flag.type] || 0) + 1;
    return acc;
  }, {});
  
  // Identify competitive landscape patterns
  const competitorMentions = {};
  responses.forEach(response => {
    if (response.advancedAnalysis?.competitorAnalysis) {
      response.advancedAnalysis.competitorAnalysis.forEach(comp => {
        if (!competitorMentions[comp.name]) {
          competitorMentions[comp.name] = { total: 0, sentiments: [] };
        }
        competitorMentions[comp.name].total += comp.count;
        competitorMentions[comp.name].sentiments.push(comp.sentiment);
      });
    }
  });
  
  // Extract common topics across engines
  const allTopics = responses.flatMap(r => 
    r.advancedAnalysis?.topicAnalysis?.mainTopics || []
  );
  const topicCounts = allTopics.reduce((acc, topic) => {
    acc[topic.topic] = (acc[topic.topic] || 0) + topic.count;
    return acc;
  }, {});
  
  return {
    summary: {
      enginesAnalyzed: engines,
      totalBrandMentions: totalBrandMentions,
      averageSentiment: averageSentiment,
      brandVisibilityScore: (totalBrandMentions / responses.length) * 100,
      commonAccuracyFlags: flagCounts,
      competitiveLandscape: competitorMentions,
      dominantTopics: Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count })),
      analysisConfidence: calculateOverallConfidence(responses)
    },
    insights: generateInsights(responses),
    recommendations: generateRecommendations(responses)
  };
}

function calculateAverageSentiment(responses) {
  const sentiments = responses.map(r => r.brandMentions?.sentiment || 'neutral');
  const sentimentScores = { very_positive: 2, positive: 1, neutral: 0, negative: -1, very_negative: -2 };
  
  const avgScore = sentiments.reduce((sum, sentiment) => sum + (sentimentScores[sentiment] || 0), 0) / sentiments.length;
  
  return Object.keys(sentimentScores).find(key => sentimentScores[key] === Math.round(avgScore)) || 'neutral';
}

function calculateOverallConfidence(responses) {
  const confidences = responses
    .map(r => r.advancedAnalysis?.sentimentAnalysis?.confidence || 0)
    .filter(c => c > 0);
  
  if (confidences.length === 0) return 0;
  return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
}

function generateInsights(responses) {
  const insights = [];
  
  // Brand positioning insights
  const brandMentions = responses.filter(r => (r.brandMentions?.count || 0) > 0);
  if (brandMentions.length > 0) {
    insights.push({
      type: 'brand_positioning',
      title: 'Brand Mention Analysis',
      description: `Your brand was mentioned in ${brandMentions.length} out of ${responses.length} AI responses`,
      severity: brandMentions.length / responses.length > 0.5 ? 'positive' : 'warning'
    });
  }
  
  // Competitive insights
  const competitorAnalysis = responses.flatMap(r => r.advancedAnalysis?.competitorAnalysis || []);
  const topCompetitor = competitorAnalysis
    .reduce((acc, comp) => {
      acc[comp.name] = (acc[comp.name] || 0) + comp.count;
      return acc;
    }, {});
  
  const mostMentionedCompetitor = Object.keys(topCompetitor).reduce((a, b) => 
    topCompetitor[a] > topCompetitor[b] ? a : b
  );
  
  if (mostMentionedCompetitor) {
    insights.push({
      type: 'competitive_analysis',
      title: 'Competitive Landscape',
      description: `${mostMentionedCompetitor} appears most frequently as a competitor`,
      severity: 'info'
    });
  }
  
  return insights;
}

function generateRecommendations(responses) {
  const recommendations = [];
  
  // Check for accuracy flags
  const allFlags = responses.flatMap(r => r.advancedAnalysis?.accuracyFlags || []);
  if (allFlags.length > 0) {
    recommendations.push({
      type: 'accuracy',
      title: 'Verify Information Accuracy',
      description: `${allFlags.length} potential accuracy issues detected across responses`,
      action: 'Review flagged content and consider providing AI engines with updated information'
    });
  }
  
  // Sentiment recommendations
  const negativeSentiments = responses.filter(r => 
    ['negative', 'very_negative'].includes(r.brandMentions?.sentiment)
  );
  
  if (negativeSentiments.length > 0) {
    recommendations.push({
      type: 'sentiment_improvement',
      title: 'Address Negative Sentiment',
      description: `${negativeSentiments.length} responses show negative sentiment toward your brand`,
      action: 'Focus on improving brand perception through content marketing and thought leadership'
    });
  }
  
  return recommendations;
} 