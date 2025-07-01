/**
 * Firebase Initialization Script
 * 
 * This script sets up necessary Firestore indexes and initial data
 * Run with: node scripts/init-firebase.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account file
const serviceAccountPath = path.join(__dirname, '../service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account.json not found.');
  console.error('Please download your Firebase service account key and save it as service-account.json in the project root.');
  console.error('You can get it from Firebase Console > Project Settings > Service accounts > Generate new private key');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });

  console.log('Firebase Admin SDK initialized successfully');
  
  const db = admin.firestore();
  
  // Create initial data
  const initializeData = async () => {
    try {
      // Check if we already have some data
      const scanCount = await db.collection('scans').count().get();
      
      if (scanCount.data().count > 0) {
        console.log('Database already contains data. Skipping initialization.');
        return;
      }
      
      // Create a sample scan
      const scanRef = await db.collection('scans').add({
        userId: 'sample-user',
        prompt: 'What are the best email marketing tools for a Marketing Manager?',
        brand: 'AcmeMail',
        competitors: ['MailChimp', 'SendGrid', 'Constant Contact'],
        keywords: 'email marketing',
        persona: 'Marketing Manager',
        engines: ['gpt4', 'claude', 'gemini'],
        status: 'complete',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Created sample scan with ID: ${scanRef.id}`);
      
      // Create sample responses
      const responseData = [
        {
          engineName: 'gpt4',
          response: 'When looking for email marketing tools, Marketing Managers have several excellent options. MailChimp offers user-friendly templates and analytics. SendGrid provides robust delivery services. AcmeMail stands out for its automation workflows and A/B testing capabilities, though it\'s priced higher than some alternatives. Constant Contact is also worth considering for its event management features.',
          brandMentions: {
            count: 1,
            positions: [152],
            sentiment: 'positive'
          },
          competitors: [
            { name: 'MailChimp', count: 1, sentiment: 'neutral' },
            { name: 'SendGrid', count: 1, sentiment: 'neutral' },
            { name: 'Constant Contact', count: 1, sentiment: 'neutral' }
          ],
          scanId: scanRef.id,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          engineName: 'claude',
          response: 'For Marketing Managers seeking email marketing tools, I recommend considering several options based on your specific needs. MailChimp offers an intuitive interface with strong analytics. SendGrid excels in deliverability and API integration. Constant Contact provides excellent customer support and event management features. Each platform has different pricing tiers to accommodate various business sizes.',
          brandMentions: {
            count: 0,
            positions: [],
            sentiment: 'neutral'
          },
          competitors: [
            { name: 'MailChimp', count: 1, sentiment: 'positive' },
            { name: 'SendGrid', count: 1, sentiment: 'positive' },
            { name: 'Constant Contact', count: 1, sentiment: 'positive' }
          ],
          scanId: scanRef.id,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          engineName: 'gemini',
          response: 'As a Marketing Manager looking for email marketing tools, you should consider several options. MailChimp is popular for its ease of use and template variety. SendGrid offers excellent deliverability rates. AcmeMail provides comprehensive analytics and automation features that many marketing professionals find valuable. Constant Contact is known for its reliable customer support. Your choice should depend on your specific needs, team size, and budget constraints.',
          brandMentions: {
            count: 1,
            positions: [185],
            sentiment: 'positive'
          },
          competitors: [
            { name: 'MailChimp', count: 1, sentiment: 'positive' },
            { name: 'SendGrid', count: 1, sentiment: 'neutral' },
            { name: 'Constant Contact', count: 1, sentiment: 'neutral' }
          ],
          scanId: scanRef.id,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }
      ];
      
      // Add all responses
      const responsePromises = responseData.map(data => db.collection('responses').add(data));
      await Promise.all(responsePromises);
      
      console.log('Added sample responses');
      console.log('Database initialization complete!');
      
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };
  
  // Run initialization
  initializeData().then(() => {
    console.log('Initialization script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Initialization failed:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
} 