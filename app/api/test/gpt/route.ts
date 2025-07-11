import { getResponseTextSystemPrompt } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";
import {  llmProviders } from '@/lib/OpenAIProvider';
export async function POST(request: NextRequest) {
    try {
        const query  =   {
            "query_text": "As a Network Administrator in Asia-Pacific, what are the best practices for implementing zero trust network access in a multi-cloud environment?",
            "buying_journey_stage": "solution_education",
            "buyer_persona": "Network Administrator (IT Networking)"
          };
        const prompt=   getResponseTextSystemPrompt(query.buying_journey_stage, query.buyer_persona)
 
      // Analyze with LLM
      const analysisPrompt = ''
      try {
      const reply =  await llmProviders.chatgpt.generateRawResponse(query.query_text, prompt);
       
        return NextResponse.json({
          success: true, 
          reply
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