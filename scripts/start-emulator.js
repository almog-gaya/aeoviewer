/**
 * Firebase Emulator Start Script
 * 
 * This script starts Firebase emulators for local development
 * Run with: node scripts/start-emulator.js
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log('Starting Firebase emulators...');

// Check if firebase-tools is installed globally
const checkFirebaseTools = spawn('firebase', ['--version']);

checkFirebaseTools.on('error', (error) => {
  console.error('Error: Firebase CLI tools not found.');
  console.error('Please install firebase-tools globally:');
  console.error('  npm install -g firebase-tools');
  process.exit(1);
});

checkFirebaseTools.on('close', (code) => {
  if (code !== 0) {
    console.error('Failed to check Firebase CLI version.');
    process.exit(1);
  }
  
  // Check for firebase.json
  if (!fs.existsSync('./firebase.json')) {
    console.error('Error: firebase.json not found in the project root.');
    console.error('Make sure you have initialized your Firebase project:');
    console.error('  firebase init');
    process.exit(1);
  }
  
  // Start emulators
  const emulator = spawn('firebase', ['emulators:start', '--import=./emulator-data', '--export-on-exit=./emulator-data'], {
    stdio: 'inherit'
  });
  
  emulator.on('error', (error) => {
    console.error('Failed to start Firebase emulators:', error);
    process.exit(1);
  });
  
  emulator.on('close', (code) => {
    console.log(`Firebase emulators exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down emulators...');
    emulator.kill('SIGINT');
  });
});

// Create emulator data directory if it doesn't exist
if (!fs.existsSync('./emulator-data')) {
  fs.mkdirSync('./emulator-data', { recursive: true });
  console.log('Created emulator-data directory for persisting local data');
} 