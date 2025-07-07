import { NextRequest, NextResponse } from "next/server";

interface WebsiteAnalysisRequest {
  websiteUrl: string;
  companyName?: string;
}

interface WebsiteAnalysisResult {
  companyName: string;
  industry: string;
  products: string[];
  keyFeatures: string[];
  targetMarket: string;
  competitors: string[];
  description: string;
  analysisScore: number; // 0-100 confidence score
}

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, companyName }: WebsiteAnalysisRequest = await request.json();

    if (!websiteUrl) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    console.log(`🌐 Analyzing website: ${websiteUrl}`);

    // Scrape the website content
    let websiteContent = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      websiteContent = await response.text();
      
      // Extract text content (basic HTML parsing)
      websiteContent = websiteContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .substring(0, 10000); // Limit to first 10k characters
        
    } catch (error) {
      console.error("Website scraping failed:", error);
      return NextResponse.json({ 
        error: "Unable to access the website. Please check the URL and try again." 
      }, { status: 400 });
    }

    // Analyze with LLM
    const analysisPrompt = `
Analyze this company website content and extract key information for Reddit sentiment analysis context.

Website URL: ${websiteUrl}
${companyName ? `Company Name Hint: ${companyName}` : ''}

Website Content:
${websiteContent}

Extract the following information as JSON:
{
  "companyName": "exact company name",
  "industry": "primary industry (e.g., cybersecurity, fintech, healthcare, etc.)",
  "products": ["main product 1", "main product 2", "main product 3"],
  "keyFeatures": ["key feature 1", "key feature 2", "key feature 3"],
  "targetMarket": "primary target market (e.g., enterprise, SMB, consumers, etc.)",
  "competitors": ["likely competitor 1", "likely competitor 2", "likely competitor 3"],
  "description": "2-sentence company description",
  "analysisScore": 85
}

Focus on:
- What the company does and sells
- Who their target customers are
- Key product features and benefits
- Market position and likely competitors
- Industry classification

Provide a confidence score (0-100) based on how much relevant information was extracted.
Return only valid JSON, no other text.
`;

    try {
      // Use OpenAI for analysis
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a business analyst expert at analyzing company websites and extracting structured information for market research. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      const analysisText = openaiData.choices[0]?.message?.content;

      if (!analysisText) {
        throw new Error("No analysis returned from LLM");
      }

      // Parse the JSON response
      let analysis: WebsiteAnalysisResult;
      try {
        analysis = JSON.parse(analysisText);
      } catch {
        throw new Error("Invalid JSON response from LLM");
      }

      console.log(`✅ Website analysis complete for ${analysis.companyName} (${analysis.industry})`);

      return NextResponse.json({
        success: true,
        analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          websiteUrl,
          contentLength: websiteContent.length
        }
      });

    } catch (error: any) {
      console.error("LLM analysis failed:", error);
      return NextResponse.json({ 
        error: "Failed to analyze website content. Please try again." 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Website analysis error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 