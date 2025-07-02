/**
 * This file will generate a report for the input questions entered by the user.
 * It will send it to LLMs and fulfill the response_text.
 * 
 */
import { InsightQuery } from '@/types/InsightQuery';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
      const body = await req.json();
      const inputs: InsightQuery[] = body.inputs;
  
      if (!inputs || inputs.length === 0) {
        return NextResponse.json(
          { error: 'No Query inputs provided' },
          { status: 400 }
        );
      }

   
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 500 }
      );
    }
  }

//   Batch processing, sending to OPEN AI 
const generateReport = async (inputs: InsightQuery[]) => {
   
}