const fs = require('fs');

async function checkAnalysisProgress() {
    try {
        console.log('📊 Checking Reddit analysis progress...\n');
        
        // Read the comprehensive analysis file
        const data = fs.readFileSync('cato-reddit-comprehensive-analysis-2025-07-07.json', 'utf8');
        const analysis = JSON.parse(data);
        
        console.log('🎯 CURRENT PROGRESS:');
        console.log(`   Total Threads: ${analysis.totalThreads}`);
        console.log(`   Successfully Analyzed: ${analysis.successfullyAnalyzed}`);
        console.log(`   Failed Analyses: ${analysis.failedAnalyses}`);
        console.log(`   Success Rate: ${((analysis.successfullyAnalyzed / analysis.totalThreads) * 100).toFixed(1)}%`);
        
        console.log('\n🏢 CATO NETWORKS INSIGHTS:');
        console.log(`   Total Mentions: ${analysis.catoInsights.totalMentions}`);
        console.log(`   Positive Sentiment: ${analysis.catoInsights.sentimentDistribution.positive}`);
        console.log(`   Neutral Sentiment: ${analysis.catoInsights.sentimentDistribution.neutral}`);
        console.log(`   Negative Sentiment: ${analysis.catoInsights.sentimentDistribution.negative}`);
        
        if (analysis.catoInsights.competitorComparisons && analysis.catoInsights.competitorComparisons.length > 0) {
            console.log(`   Competitor Comparisons Found: ${analysis.catoInsights.competitorComparisons.length}`);
        }
        
        if (analysis.analysisStats) {
            console.log('\n📈 STATISTICS:');
            console.log(`   Success Rate: ${analysis.analysisStats.successRate}`);
            console.log(`   Average Sentiment: ${analysis.analysisStats.averageSentiment}`);
        }
        
        if (analysis.analysisStats && analysis.analysisStats.topSubreddits) {
            console.log('\n🏆 TOP SUBREDDITS:');
            analysis.analysisStats.topSubreddits.slice(0, 5).forEach((sub, index) => {
                console.log(`   ${index + 1}. r/${sub.subreddit}: ${sub.count} threads`);
            });
        }
        
        // Show recent Cato mentions
        if (analysis.catoInsights.keyContexts && analysis.catoInsights.keyContexts.length > 0) {
            console.log('\n💬 RECENT CATO MENTIONS:');
            analysis.catoInsights.keyContexts.slice(-3).forEach((context, index) => {
                const sentiment = context.sentiment === 'positive' ? '😊' : 
                                context.sentiment === 'negative' ? '😞' : '😐';
                console.log(`   ${sentiment} [r/${context.subreddit}] "${context.context.substring(0, 80)}..."`);
            });
        }
        
        console.log(`\n⏰ Analysis Date: ${new Date(analysis.analysisDate).toLocaleString()}`);
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('❌ No analysis file found. The analysis may still be starting up.');
        } else {
            console.error('❌ Error reading analysis:', error.message);
        }
    }
}

checkAnalysisProgress(); 