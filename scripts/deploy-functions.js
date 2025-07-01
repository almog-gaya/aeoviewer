/**
 * Deploy Firebase Functions Script
 * 
 * This script installs dependencies and deploys Firebase functions
 * Run with: node scripts/deploy-functions.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Firebase Functions deployment...\n');

// Check if functions directory exists
if (!fs.existsSync('./functions')) {
  console.error('❌ Functions directory not found');
  process.exit(1);
}

// Install dependencies in functions directory
console.log('📦 Installing function dependencies...');
const installDeps = spawn('npm', ['install'], {
  cwd: './functions',
  stdio: 'inherit'
});

installDeps.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
  
  console.log('✅ Dependencies installed successfully\n');
  
  // Deploy functions
  console.log('🚀 Deploying functions to Firebase...');
  const deploy = spawn('firebase', ['deploy', '--only', 'functions'], {
    stdio: 'inherit'
  });
  
  deploy.on('close', (deployCode) => {
    if (deployCode !== 0) {
      console.error('❌ Failed to deploy functions');
      process.exit(1);
    }
    
    console.log('\n✅ Functions deployed successfully!');
    console.log('\n📋 Available functions:');
    console.log('  • processScan - Main scan processing with advanced analysis');
    console.log('  • generateAnalysisSummary - Cross-engine analysis summary');
    
    console.log('\n🔗 Next steps:');
    console.log('  1. Test the functions using the Firebase emulator');
    console.log('  2. Update your .env.local with Firebase configuration');
    console.log('  3. Run the frontend: npm run dev');
  });
  
  deploy.on('error', (error) => {
    console.error('❌ Error deploying functions:', error.message);
    process.exit(1);
  });
});

installDeps.on('error', (error) => {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}); 