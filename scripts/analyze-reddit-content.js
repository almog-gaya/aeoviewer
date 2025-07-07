const fs = require('fs');
const { readRedditExcel } = require('./read-reddit-excel');

// Import sentiment analysis
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// Firecrawl-like scraping functionality
async function scrapeRedditThread(url) {
    try {
        console.log(`🔍 Scraping: ${url}`);
        
        // Import fetch dynamically for Node.js compatibility
        const { default: fetch } = await import('node-fetch');
        
        // Use fetch to get the Reddit thread content
        const response = await fetch(`${url}.json`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Extract post data
        const post = data[0]?.data?.children?.[0]?.data;
        const comments = data[1]?.data?.children || [];
        
        if (!post) {
            throw new Error('No post data found');
        }
        
        // Extract meaningful content
        const content = {
            title: post.title || '',
            selftext: post.selftext || '',
            subreddit: post.subreddit || '',
            score: post.ups || 0,
            numComments: post.num_comments || 0,
            created: new Date(post.created_utc * 1000),
            author: post.author || '[deleted]',
            url: post.url || url,
            comments: extractComments(comments).slice(0, 50) // Limit to 50 comments for analysis
        };
        
        // Calculate total word count
        const allText = [content.title, content.selftext, ...content.comments.map(c => c.body)].join(' ');
        content.wordCount = allText.split(/\s+/).filter(word => word.length > 0).length;
        
        return content;
        
    } catch (error) {
        console.error(`❌ Failed to scrape ${url}:`, error.message);
        return null;
    }
}

function extractComments(comments, depth = 0, maxDepth = 3) {
    const result = [];
    
    for (const comment of comments) {
        const commentData = comment.data;
        
        if (commentData && commentData.body && commentData.body !== '[deleted]' && commentData.body !== '[removed]') {
            result.push({
                body: commentData.body,
                author: commentData.author || '[deleted]',
                score: commentData.ups || 0,
                created: new Date(commentData.created_utc * 1000),
                depth: depth
            });
            
            // Recursively extract replies (limit depth)
            if (depth < maxDepth && commentData.replies && commentData.replies.data) {
                const replies = extractComments(commentData.replies.data.children, depth + 1, maxDepth);
                result.push(...replies);
            }
        }
    }
    
    return result;
}

function analyzeBrandMentions(text, brands) {
    const mentions = {};
    const contexts = {};
    
    brands.forEach(brand => {
        const regex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
            mentions[brand] = matches.length;
            
            // Extract context around mentions
            const contextRegex = new RegExp(`.{0,100}\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b.{0,100}`, 'gi');
            const contextMatches = text.match(contextRegex);
            if (contextMatches) {
                contexts[brand] = contextMatches.slice(0, 5); // Limit to 5 context snippets
            }
        }
    });
    
    return { mentions, contexts };
}

function analyzeCompetitorMentions(content) {
    const competitors = [
        'cato networks', 'cato',
        'fortinet', 'fortigate', 'fortinos',
        'palo alto', 'palo alto networks', 'pan', 'prisma',
        'zscaler', 'zia', 'zpa',
        'cisco', 'meraki', 'umbrella',
        'cloudflare', 'cloudflare access',
        'checkpoint', 'harmony',
        'netskope',
        'vmware', 'velocloud', 'sd-wan',
        'silver peak', 'unity',
        'aryaka',
        'nuage',
        'viptela'
    ];
    
    const allText = [
        content.title,
        content.selftext,
        ...content.comments.map(c => c.body)
    ].join(' ');
    
    return analyzeBrandMentions(allText, competitors);
}

function performSentimentAnalysis(text) {
    const result = sentiment.analyze(text);
    
    // Classify sentiment
    let label = 'neutral';
    if (result.score > 2) label = 'very_positive';
    else if (result.score > 0) label = 'positive';
    else if (result.score < -2) label = 'very_negative';
    else if (result.score < 0) label = 'negative';
    
    return {
        score: result.score,
        comparative: result.comparative,
        label: label,
        confidence: Math.abs(result.comparative) * 10,
        positive: result.positive,
        negative: result.negative,
        wordCount: result.tokens.length
    };
}

function extractKeywords(text, minFreq = 2) {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
    
    const stopWords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'she', 'use', 'her', 'way', 'many', 'then', 'them', 'well', 'were', 'will', 'with', 'have', 'this', 'that', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'over', 'such', 'take', 'than', 'only', 'think', 'work', 'also', 'back', 'first', 'after', 'other', 'right', 'where', 'would', 'could', 'should', 'more', 'most', 'what', 'said', 'each', 'which', 'their', 'about', 'there', 'people', 'into', 'through', 'during', 'before', 'under', 'around', 'because', 'however', 'something', 'someone', 'different'
    ]);
    
    const wordCount = {};
    words.forEach(word => {
        if (!stopWords.has(word) && word.length > 2) {
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
    });
    
    return Object.entries(wordCount)
        .filter(([, count]) => count >= minFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([keyword, count]) => ({ keyword, count }));
}

function extractCatoSpecificInsights(content) {
    const allText = [
        content.title,
        content.selftext,
        ...content.comments.map(c => c.body)
    ].join(' ').toLowerCase();
    
    const catoMentions = [];
    const catoRegex = /\b(?:cato|cato networks)\b/gi;
    
    // Find all sentences mentioning Cato
    const sentences = allText.split(/[.!?]+/);
    sentences.forEach(sentence => {
        if (catoRegex.test(sentence)) {
            catoMentions.push({
                sentence: sentence.trim(),
                sentiment: performSentimentAnalysis(sentence),
                context: 'discussion'
            });
        }
    });
    
    // Look for specific comparison patterns
    const comparisonPatterns = [
        /cato.*(?:vs|versus|compared to|against).*?(fortinet|palo alto|zscaler|cisco)/gi,
        /(fortinet|palo alto|zscaler|cisco).*(?:vs|versus|compared to|against).*?cato/gi
    ];
    
    const comparisons = [];
    comparisonPatterns.forEach(pattern => {
        const matches = allText.match(pattern);
        if (matches) {
            matches.forEach(match => {
                comparisons.push({
                    text: match,
                    sentiment: performSentimentAnalysis(match)
                });
            });
        }
    });
    
    return {
        mentions: catoMentions,
        comparisons: comparisons,
        totalMentions: catoMentions.length
    };
}

async function analyzeAllThreads() {
    try {
        console.log('🚀 Starting comprehensive Reddit analysis...');
        
        // Load extracted thread data
        let threadData;
        try {
            const data = await fs.promises.readFile('extracted-reddit-threads.json', 'utf8');
            threadData = JSON.parse(data);
        } catch (error) {
            console.log('📊 No extracted data found, reading Excel first...');
            threadData = await readRedditExcel();
        }
        
        console.log(`📊 Analyzing ${threadData.totalThreads} Reddit threads...`);
        
        const results = {
            analysisDate: new Date().toISOString(),
            totalThreads: threadData.totalThreads,
            successfullyAnalyzed: 0,
            failedAnalyses: 0,
            catoInsights: {
                totalMentions: 0,
                sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
                competitorComparisons: [],
                keyContexts: []
            },
            competitorAnalysis: {},
            threadDetails: []
        };
        
        const batchSize = 10;
        // For testing, limit to first 5 threads if TEST_MODE environment variable is set
        const threads = process.env.TEST_MODE ? threadData.threads.slice(0, 5) : threadData.threads;
        
        for (let i = 0; i < threads.length; i += batchSize) {
            const batch = threads.slice(i, i + batchSize);
            console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(threads.length/batchSize)} (${batch.length} threads)`);
            
            const batchPromises = batch.map(async (thread, batchIndex) => {
                const globalIndex = i + batchIndex + 1;
                console.log(`  [${globalIndex}/${threads.length}] ${thread.url}`);
                
                try {
                    const content = await scrapeRedditThread(thread.url);
                    
                    if (!content) {
                        results.failedAnalyses++;
                        return null;
                    }
                    
                    // Perform comprehensive analysis
                    const allText = [content.title, content.selftext, ...content.comments.map(c => c.body)].join(' ');
                    
                    const analysis = {
                        threadInfo: {
                            url: thread.url,
                            subreddit: content.subreddit,
                            title: content.title,
                            score: content.score,
                            commentCount: content.numComments,
                            wordCount: content.wordCount
                        },
                        sentiment: performSentimentAnalysis(allText),
                        competitorMentions: analyzeCompetitorMentions(content),
                        keywords: extractKeywords(allText),
                        catoSpecific: extractCatoSpecificInsights(content),
                        content: content
                    };
                    
                    // Update Cato insights
                    if (analysis.catoSpecific.totalMentions > 0) {
                        results.catoInsights.totalMentions += analysis.catoSpecific.totalMentions;
                        
                        analysis.catoSpecific.mentions.forEach(mention => {
                            const sentiment = mention.sentiment.label;
                            if (sentiment.includes('positive')) {
                                results.catoInsights.sentimentDistribution.positive++;
                            } else if (sentiment.includes('negative')) {
                                results.catoInsights.sentimentDistribution.negative++;
                            } else {
                                results.catoInsights.sentimentDistribution.neutral++;
                            }
                            
                            results.catoInsights.keyContexts.push({
                                context: mention.sentence,
                                sentiment: sentiment,
                                subreddit: content.subreddit,
                                url: thread.url
                            });
                        });
                        
                        results.catoInsights.competitorComparisons.push(...analysis.catoSpecific.comparisons);
                    }
                    
                    results.successfullyAnalyzed++;
                    return analysis;
                    
                } catch (error) {
                    console.error(`    ❌ Error analyzing thread: ${error.message}`);
                    results.failedAnalyses++;
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.threadDetails.push(...batchResults.filter(r => r !== null));
            
            // Small delay to be respectful to Reddit's servers
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Calculate final statistics
        results.analysisStats = {
            successRate: `${((results.successfullyAnalyzed / threadData.totalThreads) * 100).toFixed(1)}%`,
            averageSentiment: results.threadDetails.length > 0 
                ? (results.threadDetails.reduce((sum, thread) => sum + thread.sentiment.score, 0) / results.threadDetails.length).toFixed(2)
                : 0,
            topSubreddits: Object.entries(threadData.subredditCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([sub, count]) => ({ subreddit: sub.replace('https://www.reddit.com/r/', ''), count }))
        };
        
        // Save detailed results
        await fs.promises.writeFile(
            `cato-reddit-comprehensive-analysis-${new Date().toISOString().split('T')[0]}.json`,
            JSON.stringify(results, null, 2)
        );
        
        console.log('\n✅ Analysis completed!');
        console.log(`📊 Successfully analyzed: ${results.successfullyAnalyzed}/${threadData.totalThreads} threads`);
        console.log(`🎯 Cato mentions found: ${results.catoInsights.totalMentions}`);
        console.log(`😊 Positive sentiment: ${results.catoInsights.sentimentDistribution.positive}`);
        console.log(`😐 Neutral sentiment: ${results.catoInsights.sentimentDistribution.neutral}`);
        console.log(`😞 Negative sentiment: ${results.catoInsights.sentimentDistribution.negative}`);
        
        return results;
        
    } catch (error) {
        console.error('💥 Analysis failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    analyzeAllThreads()
        .then(results => {
            console.log('\n🎉 Comprehensive Reddit analysis completed!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Analysis failed:', error);
            process.exit(1);
        });
}

module.exports = { analyzeAllThreads, scrapeRedditThread, performSentimentAnalysis }; 