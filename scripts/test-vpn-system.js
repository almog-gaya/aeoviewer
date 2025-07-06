#!/usr/bin/env node

/**
 * VPN System Test Script
 * 
 * This script helps you understand and test the VPN configuration.
 * Run with: node scripts/test-vpn-system.js
 */

console.log('🔧 VPN System Configuration Test');
console.log('===============================\n');

// Check environment variables
function checkEnvVars() {
  console.log('🔍 Checking Environment Variables...\n');
  
  const requiredVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY', 
    'GEMINI_API_KEY',
    'PERPLEXITY_API_KEY'
  ];
  
  const vpnVars = [
    'ENABLE_VPN',
    'VPN_REGION_STRATEGY',
    'VPN_US_EAST_1_HOST',
    'VPN_US_EAST_1_PORT',
    'VPN_US_EAST_1_USERNAME',
    'VPN_US_EAST_1_PASSWORD'
  ];
  
  console.log('📋 AI API Keys:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`  ❌ ${varName}: Not set`);
    }
  });
  
  console.log('\n🌐 VPN Configuration:');
  vpnVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Hide passwords
      if (varName.includes('PASSWORD')) {
        console.log(`  ✅ ${varName}: ****`);
      } else {
        console.log(`  ✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`  ❌ ${varName}: Not set`);
    }
  });
  
  return {
    hasApiKeys: requiredVars.some(varName => process.env[varName]),
    vpnEnabled: process.env.ENABLE_VPN === 'true',
    hasVpnConfig: vpnVars.slice(2).every(varName => process.env[varName])
  };
}

// Show next steps
function showNextSteps(status) {
  console.log('\n📖 Next Steps:\n');
  
  console.log('🎉 GREAT NEWS! VPN system is now hardcoded with test mode!\n');
  
  if (!status.hasApiKeys) {
    console.log('1. ❗ Copy this to your .env file (minimum required):');
    console.log('   ENABLE_VPN=true');
    console.log('   VPN_REGION_STRATEGY=round_robin');
    console.log('   ');
    console.log('   # Add your AI API keys:');
    console.log('   OPENAI_API_KEY=sk-your-openai-key');
    console.log('   ANTHROPIC_API_KEY=sk-ant-your-claude-key');
    console.log('   GEMINI_API_KEY=your-gemini-key');
    console.log('   PERPLEXITY_API_KEY=pplx-your-perplexity-key\n');
  }
  
  if (!status.vpnEnabled) {
    console.log('2. 🌐 To enable VPN test mode, add to .env:');
    console.log('   ENABLE_VPN=true');
    console.log('   VPN_REGION_STRATEGY=round_robin\n');
  }
  
  console.log('3. 🧪 Test immediately:');
  console.log('   npm run dev');
  console.log('   Visit: http://localhost:3000/api/vpn/status\n');
  
  console.log('4. 📋 See vpn-test-config.txt for copy-paste config\n');
  
  console.log('5. 🔄 Test mode benefits:');
  console.log('   - No VPN credentials needed');
  console.log('   - All regions work in test mode');
  console.log('   - Uses direct connections but simulates VPN routing');
  console.log('   - Real VPN setup is optional\n');
  
  console.log('6. 📚 When ready for real VPNs, read:');
  console.log('   - ENV_SETUP_GUIDE.md (environment setup)');
  console.log('   - VPN_SETUP_GUIDE.md (VPN provider setup)');
}

// Test basic HTTP connectivity
async function testBasicConnectivity() {
  console.log('\n🌐 Testing Basic Connectivity...');
  
  try {
    const response = await fetch('https://httpbin.org/ip');
    const data = await response.json();
    console.log('✅ Internet connection working');
    console.log(`   Your current IP: ${data.origin}`);
    return true;
  } catch (error) {
    console.log('❌ Internet connection failed:', error.message);
    return false;
  }
}

// Show VPN provider suggestions
function showVPNProviders() {
  console.log('\n🏢 VPN/Proxy Provider Suggestions:\n');
  
  console.log('💰 Budget Options ($10-50/month):');
  console.log('   - ProxyMesh: https://proxymesh.com/');
  console.log('   - Storm Proxies: https://stormproxies.cn/');
  console.log('   - Your existing VPN (NordVPN, ExpressVPN, etc.)\n');
  
  console.log('🚀 Professional Options ($100+/month):');
  console.log('   - Bright Data: https://brightdata.com/');
  console.log('   - Oxylabs: https://oxylabs.io/');
  console.log('   - Smartproxy: https://smartproxy.com/\n');
  
  console.log('🛠️  DIY Options:');
  console.log('   - AWS/Google Cloud VPN');
  console.log('   - DigitalOcean + Squid proxy');
  console.log('   - Your own VPS setup');
}

// Example .env content
function showExampleEnv() {
  console.log('\n📝 Example .env File Content:\n');
  console.log('# AI API Keys (you probably already have these)');
  console.log('OPENAI_API_KEY=sk-proj-your-openai-key-here');
  console.log('ANTHROPIC_API_KEY=sk-ant-your-claude-key-here');
  console.log('GEMINI_API_KEY=your-gemini-key-here');
  console.log('PERPLEXITY_API_KEY=pplx-your-perplexity-key-here');
  console.log('');
  console.log('# Start with VPN disabled');
  console.log('enable_vpn=true');
  console.log('VPN_REGION_STRATEGY=round_robin');
  console.log('');
  console.log('# Add ONE VPN endpoint (example with ProxyMesh)');
  console.log('# VPN_US_EAST_1_HOST=us-il.proxymesh.com');
  console.log('# VPN_US_EAST_1_PORT=31280');
  console.log('# VPN_US_EAST_1_USERNAME=your-username');
  console.log('# VPN_US_EAST_1_PASSWORD=your-password');
  console.log('');
  console.log('# When ready, set ENABLE_VPN=true');
}

// Main function
async function main() {
  const status = checkEnvVars();
  
  console.log('\n📊 Status Summary:');
  console.log(`   API Keys: ${status.hasApiKeys ? '✅' : '❌'}`);
  console.log(`   VPN Enabled: ${status.vpnEnabled ? '✅' : '❌'}`);
  console.log(`   VPN Config: ${status.hasVpnConfig ? '✅' : '❌'}`);
  
  await testBasicConnectivity();
  
  if (status.hasApiKeys && status.vpnEnabled && status.hasVpnConfig) {
    console.log('\n🎉 Great! Your VPN system appears to be configured.');
    console.log('   Test it by visiting: http://localhost:3000/api/vpn/status');
  } else {
    showNextSteps(status);
    showVPNProviders();
    showExampleEnv();
  }
  
  console.log('\n📞 Need help?');
  console.log('   1. Read ENV_SETUP_GUIDE.md for step-by-step instructions');
  console.log('   2. Check the VPN_SETUP_GUIDE.md for detailed setup');
  console.log('   3. Start with VPN disabled and get your AI APIs working first');
}

main().catch(console.error); 