import { getResponseTextSystemPrompt } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const query  =   {
            "query_text": "As a Network Administrator in Asia-Pacific, what are the best practices for implementing zero trust network access in a multi-cloud environment?",
            "buying_journey_stage": "solution_education",
            "buyer_persona": "Network Administrator (IT Networking)"
          };
 
      // Analyze with LLM
      const analysisPrompt = ''
      try {
        // Use OpenAI for analysis
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-search-preview-2025-03-11',
            messages: [
              {
                role: 'system',
                content: getResponseTextSystemPrompt(query.buying_journey_stage, query.buyer_persona)
              },
              {
                role: 'user',
                content: query.query_text
              }
            ],  
          }),
        });
  
        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }
  
        const openaiData = await openaiResponse.json();
        const analysisText = openaiData.choices[0]?.message?.content;
  
 
        return NextResponse.json({
          success: true,
          openaiData
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