import {  llmProviders } from '@/lib/OpenAIProvider';
import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const inputs: InsightQuery[] = body.inputs;
        const company: CompanyProfile = body.companyProfile;

        if (!inputs || inputs.length === 0) {
            return NextResponse.json(
                { error: 'No Query inputs provided' },
                { status: 400 }
            );
        }

        // Process inputs concurrently using Promise.all
        const results: PromptResult[] = await Promise.all(
            inputs.map(input => llmProviders.searchgpt.generateResponseText(input, company))
        );
    

        // Write to output file
        await fs.writeFile(
            'output_insight_query.json',
            JSON.stringify(results, null, 2),
            'utf-8'
        );

        return NextResponse.json({ success: true, results });
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request format', details: String(error) },
            { status: 500 }
        );
    }
}