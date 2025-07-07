// Main async function to handle imports
async function initializeFetch() {
  // Use built-in fetch if available (Node.js 18+), otherwise use node-fetch
  if (typeof globalThis.fetch !== 'undefined') {
    return globalThis.fetch;
  } else {
    const { default: nodeFetch } = await import('node-fetch');
    return nodeFetch;
  }
}

// Test different search strategies
const searchStrategies = {
  basic: (company) => company,
  withContext: (company) => `${company} cybersecurity security software`,
  quoted: (company) => `"${company}"`,
  quotedWithContext: (company) => `"${company}" cybersecurity OR security OR software OR technology`,
  domainFocus: (company, website) => website ? `${company} OR ${website}` : `${company} software technology`,
  businessContext: (company) => `${company} (cybersecurity OR security OR software OR technology OR business OR enterprise)`
};

// Relevant subreddits for cybersecurity/tech companies
const relevantSubreddits = [
  'cybersecurity', 'netsec', 'SecurityCareerAdvice', 'AskNetsec', 'networking',
  'sysadmin', 'ITCareerQuestions', 'technology', 'programming', 'startup',
  'entrepreneur', 'business', 'SecurityBlueprint', 'InfoSec', 'blueteamsec'
];

// Keywords that indicate business/tech relevance
const relevantKeywords = [
  'security', 'cybersecurity', 'software', 'platform', 'technology', 'tech',
  'startup', 'company', 'business', 'enterprise', 'solution', 'product',
  'service', 'vendor', 'tool', 'SaaS', 'cloud', 'API', 'integration',
  'compliance', 'threat', 'vulnerability', 'SIEM', 'SOC', 'incident',
  'response', 'detection', 'prevention', 'monitoring', 'analytics'
];

// Test function to search Reddit with different strategies
async function testRedditSearch(company, website = null) {
  console.log(`\n🔍 Testing Reddit search for: "${company}"`);
  console.log(`Website: ${website || 'Not provided'}\n`);
  
  const results = {};
  
  for (const [strategyName, strategyFn] of Object.entries(searchStrategies)) {
    try {
      console.log(`📊 Testing strategy: ${strategyName}`);
      const query = strategyFn(company, website);
      console.log(`   Query: "${query}"`);
      
      const searchResult = await searchRedditWithStrategy(query, strategyName);
      results[strategyName] = searchResult;
      
      console.log(`   Results: ${searchResult.totalFound} found, ${searchResult.relevant} relevant (${searchResult.relevanceScore}% relevance)`);
      console.log(`   Top subreddits: ${searchResult.topSubreddits.slice(0, 3).join(', ')}`);
      
      if (searchResult.sampleTitles.length > 0) {
        console.log(`   Sample relevant: "${searchResult.sampleTitles[0]}"`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results[strategyName] = { error: error.message };
    }
  }
  
  return results;
}

async function searchRedditWithStrategy(query, strategyName) {
  const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=month&limit=25&type=link`;
  
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'RedditSearchTest/1.0 (Testing search relevance)'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Reddit API returned ${response.status}`);
  }
  
  const data = await response.json();
  const posts = data.data.children || [];
  
  // Analyze relevance
  const analysis = analyzePosts(posts, query);
  
  return {
    totalFound: posts.length,
    relevant: analysis.relevant,
    relevanceScore: posts.length > 0 ? Math.round((analysis.relevant / posts.length) * 100) : 0,
    topSubreddits: analysis.topSubreddits,
    sampleTitles: analysis.relevantTitles,
    irrelevantTitles: analysis.irrelevantTitles,
    strategy: strategyName,
    query: query
  };
}

function analyzePosts(posts, originalQuery) {
  const subredditCounts = {};
  const relevantTitles = [];
  const irrelevantTitles = [];
  let relevantCount = 0;
  
  for (const post of posts) {
    const postData = post.data;
    const title = postData.title.toLowerCase();
    const subreddit = postData.subreddit;
    const selftext = (postData.selftext || '').toLowerCase();
    const combinedText = `${title} ${selftext}`;
    
    // Count subreddits
    subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1;
    
    // Check relevance
    const isRelevant = isPostRelevant(combinedText, subreddit, originalQuery);
    
    if (isRelevant) {
      relevantCount++;
      relevantTitles.push(postData.title);
    } else {
      irrelevantTitles.push(postData.title);
    }
  }
  
  const topSubreddits = Object.entries(subredditCounts)
    .sort(([,a], [,b]) => b - a)
    .map(([sub]) => sub);
  
  return {
    relevant: relevantCount,
    topSubreddits,
    relevantTitles: relevantTitles.slice(0, 3),
    irrelevantTitles: irrelevantTitles.slice(0, 3)
  };
}

function isPostRelevant(text, subreddit, originalQuery) {
  // If it's in a relevant subreddit, give it higher chance
  const isRelevantSubreddit = relevantSubreddits.some(rel => 
    subreddit.toLowerCase().includes(rel.toLowerCase())
  );
  
  // Check for relevant keywords
  const hasRelevantKeywords = relevantKeywords.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  // Check for animal/nature keywords that would indicate irrelevance for tech companies
  const animalKeywords = ['whale', 'ocean', 'marine', 'animal', 'species', 'wildlife', 'sea', 'mammal', 'pod', 'killer whale'];
  const hasAnimalKeywords = animalKeywords.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  // If it has animal keywords and no tech keywords, probably irrelevant
  if (hasAnimalKeywords && !hasRelevantKeywords) {
    return false;
  }
  
  // If it's in a relevant subreddit, probably relevant
  if (isRelevantSubreddit) {
    return true;
  }
  
  // If it has relevant keywords, probably relevant
  if (hasRelevantKeywords) {
    return true;
  }
  
  // Default: probably irrelevant
  return false;
}

// Test specific companies
async function runTests() {
  console.log('🧪 Reddit Search Quality Analysis');
  console.log('=====================================');
  
  const testCases = [
    { company: 'Orca Security', website: 'orca.security' },
    { company: 'Palo Alto Networks', website: 'paloaltonetworks.com' },
    { company: 'Crowdstrike', website: 'crowdstrike.com' },
    { company: 'Zscaler', website: 'zscaler.com' }
  ];
  
  const allResults = {};
  
  for (const testCase of testCases) {
    const results = await testRedditSearch(testCase.company, testCase.website);
    allResults[testCase.company] = results;
    
    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary analysis
  console.log('\n📊 SUMMARY ANALYSIS');
  console.log('===================');
  
  for (const [company, strategies] of Object.entries(allResults)) {
    console.log(`\n${company}:`);
    const sortedStrategies = Object.entries(strategies)
      .filter(([_, result]) => !result.error)
      .sort(([_, a], [__, b]) => b.relevanceScore - a.relevanceScore);
    
    console.log('  Best strategies:');
    sortedStrategies.slice(0, 3).forEach(([name, result], index) => {
      console.log(`    ${index + 1}. ${name}: ${result.relevanceScore}% relevant (${result.relevant}/${result.totalFound})`);
    });
    
    if (sortedStrategies.length > 0) {
      const best = sortedStrategies[0][1];
      console.log(`  Best query: "${best.query}"`);
      if (best.irrelevantTitles.length > 0) {
        console.log(`  Example irrelevant: "${best.irrelevantTitles[0]}"`);
      }
    }
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  const bestOverallStrategy = findBestOverallStrategy(allResults);
  console.log(`Best overall strategy: ${bestOverallStrategy.name}`);
  console.log(`Average relevance: ${bestOverallStrategy.avgRelevance}%`);
  console.log(`Strategy function: ${searchStrategies[bestOverallStrategy.name].toString()}`);
}

function findBestOverallStrategy(allResults) {
  const strategyScores = {};
  
  for (const [company, strategies] of Object.entries(allResults)) {
    for (const [strategyName, result] of Object.entries(strategies)) {
      if (!result.error) {
        if (!strategyScores[strategyName]) {
          strategyScores[strategyName] = [];
        }
        strategyScores[strategyName].push(result.relevanceScore);
      }
    }
  }
  
  const averages = Object.entries(strategyScores).map(([name, scores]) => ({
    name,
    avgRelevance: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    count: scores.length
  }));
  
  return averages.sort((a, b) => b.avgRelevance - a.avgRelevance)[0];
}

// Run if called directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ Analysis complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { testRedditSearch, searchStrategies }; 