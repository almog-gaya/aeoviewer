#!/usr/bin/env node

/**
 * Test script for multi-engine AI functionality
 * 
 * This script demonstrates how to use the new multi-engine system
 * and tests that all available engines are working correctly.
 */

const { getAvailableEngines, getProvider, mapEngineIdToEnum, getEngineDisplayName } = require('../lib/providers/factory');
const { LLMEngine } = require('../lib/providers/base');

async function testEngine(engine) {
  console.log(`\n🧠 Testing ${getEngineDisplayName(engine)}...`);
  
  try {
    const provider = getProvider(engine);
    
    // Test company profile generation
    console.log('  → Testing company profile generation...');
    const companyProfile = await provider.generateCompanyProfile(
      'TestCorp',
      'https://testcorp.com'
    );
    console.log(`  ✅ Company profile: ${companyProfile.name}`);
    
    // Test response generation
    console.log('  → Testing response generation...');
    const query = {
      query_text: 'What are the best project management tools?',
      buyer_persona: 'project manager',
      buying_journey_stage: 'evaluation'
    };
    
    const result = await provider.generateResponseText(query, companyProfile);
    console.log(`  ✅ Generated response (${result.response_text.length} chars)`);
    console.log(`  📝 Preview: ${result.response_text.substring(0, 100)}...`);
    
    return true;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Multi-Engine AI Test Script');
  console.log('================================');
  
  const availableEngines = getAvailableEngines();
  
  if (availableEngines.length === 0) {
    console.log('❌ No engines available! Please check your API keys in .env');
    console.log('Required environment variables:');
    console.log('  - OPENAI_API_KEY');
    console.log('  - ANTHROPIC_API_KEY');
    console.log('  - GEMINI_API_KEY');
    console.log('  - PERPLEXITY_API_KEY');
    console.log('  - GROK_API_KEY');
    process.exit(1);
  }
  
  console.log(`\n📊 Found ${availableEngines.length} available engines:`);
  availableEngines.forEach(engine => {
    console.log(`  • ${getEngineDisplayName(engine)}`);
  });
  
  const results = [];
  
  for (const engine of availableEngines) {
    const success = await testEngine(engine);
    results.push({ engine, success });
  }
  
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  
  results.forEach(({ engine, success }) => {
    const status = success ? '✅' : '❌';
    console.log(`${status} ${getEngineDisplayName(engine)}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 ${successCount}/${results.length} engines working correctly`);
  
  if (successCount === results.length) {
    console.log('🎉 All engines are working! Your multi-engine setup is ready.');
  } else {
    console.log('⚠️  Some engines have issues. Check API keys and network connectivity.');
  }
}

// Run the test
main().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
}); 