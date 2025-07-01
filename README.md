# AEO Viewer - AI Engine Optimization Viewer

AEO Viewer helps you analyze how your brand appears in AI engine results, comparing different AI engines and tracking mentions, sentiment, and competitor analysis.

## Features

- **Main Dashboard**: Overview of key metrics across all scans
- **Real-time Insights**: Live monitoring of AI response patterns
- **Topic Analysis**: Analysis of how your brand is represented across topics
- **Buying Journey**: Understand how AI responds to buyer personas
- **Scan Management**: Create, view, and export scan results
- **Word Analysis**: Detailed lexical analysis of AI responses
- **Competitor Analysis**: Compare your brand's position against competitors

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aeoviewer.git
   cd aeoviewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Go to Project Settings > General > Your Apps > Web App
   - Register a new web app and copy the Firebase configuration

4. Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

5. Deploy Firebase Functions:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only functions
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Firebase Structure

### Firestore Collections

- **scans**: Stores all scan requests
  - `userId`: User ID (anonymous for now)
  - `prompt`: Generated prompt from template
  - `brand`: Brand name to analyze
  - `competitors`: Array of competitor brands
  - `keywords`: Keywords used in the scan
  - `persona`: Target buyer persona
  - `engines`: Array of AI engines to query
  - `status`: Status of the scan (pending, complete)
  - `createdAt`: Timestamp of creation
  - `completedAt`: Timestamp of completion

- **responses**: Stores AI responses for each scan
  - `scanId`: Reference to the parent scan
  - `engineName`: Name of the AI engine
  - `response`: Full text response
  - `brandMentions`: Object containing brand mention analysis
    - `count`: Number of times brand was mentioned
    - `positions`: Array of positions where brand was mentioned
    - `sentiment`: Sentiment analysis (positive, neutral, negative)
  - `competitors`: Array of competitor mention analyses
    - `name`: Competitor name
    - `count`: Number of mentions
    - `sentiment`: Sentiment analysis
  - `timestamp`: When the response was received

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Project Overview

AEO Viewer enables marketing teams to:

- Set up brand monitoring across multiple AI models
- Track brand mentions in AI search results
- Compare with competitors
- Analyze sentiment and accuracy
- Monitor trends over time

## Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API (or Redux for more complex state)
- **API Integration**: Custom API clients for various AI models

## Project Structure

```
aeoviewer/
│
├── app/                  # Next.js app directory
│   ├── dashboard/        # Dashboard page
│   ├── scans/            # Scan management pages
│   ├── reports/          # Reporting pages
│   ├── engines/          # AI engine configuration
│   ├── prompt-builder/   # Prompt creation interface
│   └── settings/         # Application settings
│
├── components/           # Reusable React components
│   ├── AIResponseCard.tsx
│   └── ...
│
├── public/               # Static assets
│   └── scope.md          # Project scope document
│
└── ...                   # Config files
```

## License

[MIT License](LICENSE)

## Acknowledgments

- This project was bootstrapped with [Next.js](https://nextjs.org/)
- Created based on the specifications in [scope.md](public/scope.md)
