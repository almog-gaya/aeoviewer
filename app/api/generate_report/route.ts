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

        // Process all inputs with all providers
        const providerNames = Object.keys(llmProviders) as Array<keyof typeof llmProviders>;
        const allResults: PromptResult[] = [];

        for (const providerName of providerNames) {
            const provider = llmProviders[providerName];
            // Run all inputs for this provider concurrently, catching errors per input
            const providerResults = await Promise.all(
                inputs.map(async input => {
                    try {
                        const result = await provider.generateResponseText(input, company);
                        if (result) {
                            result.answer_engine = providerName;
                        }
                        return result;
                    } catch (err) {
                        // Return a result object with error info
                        return {
                            ...company,
                            answer_engine: providerName,
                            company_name: company.name,
                            query_text: input.query_text,
                            response_text: '',
                            buyer_persona: input.buyer_persona || undefined,
                            buying_journey_stage: input.buying_journey_stage || undefined,
                            error: String(err)
                        };
                    }
                })
            );
            providerResults.forEach((result: PromptResult) => {
                if (result) {
                    allResults.push(result);
                }
            });
        }

        // Write to output file 
        makeFinalizedBackup(allResults);

        return NextResponse.json({ success: true, results: allResults });
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request format', details: String(error) },
            { status: 500 }
        );
    }
}

const makeFinalizedBackup = async (results: PromptResult[]) => {
    try {
        const companyName = results[0].company_name;
        const dirPath = `./backups/${companyName}`;
        const fileName = `output_insight_query.json`;

        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Write the file
        await fs.writeFile(`${dirPath}/${fileName}`, JSON.stringify(results, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error creating backup:', error);
    }
};