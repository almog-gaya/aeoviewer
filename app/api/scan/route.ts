import { NextResponse } from 'next/server';
import { functions, httpsCallable } from '@/lib/firebase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, competitors, keywords, persona, engines } = body;
    
    // Validate the request
    if (!brand || !keywords || !persona || !engines || engines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Use server-side Firebase functions
    const processScan = httpsCallable(functions, 'processScan');
    
    // Use a temporary user ID since we're not implementing auth
    const userId = 'temp-user-' + Math.random().toString(36).substring(2, 15);
    
    const result = await processScan({
      userId,
      brand,
      competitors,
      keywords,
      persona,
      engines
    });
    
    // Return the complete scan data
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error processing scan:', error);
    return NextResponse.json(
      { error: 'Failed to process scan' },
      { status: 500 }
    );
  }
}

// Helper functions
function getEngineName(engineId: string): string {
  const engineMap: Record<string, string> = {
    'gpt4': 'ChatGPT (GPT-4)',
    'claude': 'Claude',
    'gemini': 'Google Gemini',
    'perplexity': 'Perplexity AI'
  };

  return engineMap[engineId] || engineId;
}

function generateMockResponse(
  engine: string,
  brand: string,
  competitors: string[],
  keywords: string,
  persona: string
): string {
  // Very simplified mock response generation
  const introsByEngine: Record<string, string> = {
    'ChatGPT (GPT-4)': `For a ${persona} looking for ${keywords} solutions, here are the top options to consider:`,
    'Claude': `When evaluating ${keywords} tools for a ${persona}, it's important to consider several key factors:`,
    'Google Gemini': `# Best ${keywords} Tools for ${persona}s\n\nHere are the top recommendations based on industry research:`,
    'Perplexity AI': `I've analyzed the latest ${keywords} solutions for ${persona}s, and here are the standout options:`
  };

  const intro = introsByEngine[engine] || `Here are some ${keywords} tools for ${persona}s:`;
  let response = intro + '\n\n';

  // Add brand mention (80% chance)
  if (Math.random() > 0.2) {
    response += `1. **${brand}**: A leading solution with excellent ${keywords} features designed specifically for ${persona}s. `;
    response += `Their recent updates have made the platform more intuitive and powerful.\n\n`;
  }

  // Add competitors (with varying positions)
  competitors.forEach((competitor, index) => {
    if (Math.random() > 0.3) { // 70% chance to include each competitor
      response += `${index + 2}. **${competitor}**: Another option in the ${keywords} space. `;
      
      // Randomize sentiment
      const sentiments = [
        `It's particularly strong in data analytics but lacks some advanced features.`,
        `Many ${persona}s prefer it for its user-friendly interface and reasonable pricing.`,
        `While popular, it doesn't match ${brand}'s specialized capabilities for ${persona}s.`
      ];
      
      response += sentiments[Math.floor(Math.random() * sentiments.length)];
      response += '\n\n';
    }
  });

  // Add generic options
  const genericOptions = [
    'HubSpot', 'Salesforce', 'Monday.com', 'Asana', 'Mailchimp', 
    'Marketo', 'Adobe', 'Oracle', 'Zoho', 'Microsoft'
  ];
  
  const selectedGenerics = genericOptions
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
    
  selectedGenerics.forEach((option, index) => {
    response += `${index + competitors.length + 3}. **${option}**: ${option} offers a range of ${keywords} features that might be suitable for ${persona}s depending on their specific needs.\n\n`;
  });

  response += `\nWhen choosing a ${keywords} tool as a ${persona}, consider your specific requirements, team size, budget constraints, and integration needs.`;

  return response;
}

function analyzeBrandMentions(response: string, brand: string) {
  // Simple analysis of brand mentions
  const brandRegex = new RegExp(brand, 'gi');
  const matches = response.match(brandRegex);
  const count = matches ? matches.length : 0;
  
  // Find positions (just first 5 for simplicity)
  const positions: number[] = [];
  let position = -1;
  for (let i = 0; i < Math.min(count, 5); i++) {
    position = response.indexOf(brand, position + 1);
    if (position !== -1) positions.push(position);
  }

  // Determine sentiment (simplified)
  let sentiment: 'positive' | 'neutral' | 'negative';
  if (response.toLowerCase().includes('excellent') || 
      response.toLowerCase().includes('leading') ||
      response.toLowerCase().includes('top')) {
    sentiment = 'positive';
  } else if (response.toLowerCase().includes('problem') || 
            response.toLowerCase().includes('lack') ||
            response.toLowerCase().includes('expensive')) {
    sentiment = 'negative';  
  } else {
    sentiment = 'neutral';
  }

  return {
    count,
    positions,
    sentiment
  };
}

function analyzeCompetitors(response: string, competitors: string[]) {
  // Analyze each competitor
  return competitors.map(competitor => {
    const regex = new RegExp(competitor, 'gi');
    const matches = response.match(regex);
    const count = matches ? matches.length : 0;

    // Simple sentiment analysis
    let sentiment: 'positive' | 'neutral' | 'negative';
    const lowerResponse = response.toLowerCase();
    
    // Check for sentiment near competitor mentions (very simplified)
    if ((lowerResponse.includes(`${competitor.toLowerCase()} is great`) || 
         lowerResponse.includes(`prefer ${competitor.toLowerCase()}`))) {
      sentiment = 'positive';
    } else if (lowerResponse.includes(`${competitor.toLowerCase()} lacks`) || 
               lowerResponse.includes(`${competitor.toLowerCase()} is expensive`)) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }

    return {
      name: competitor,
      count,
      sentiment
    };
  });
} 