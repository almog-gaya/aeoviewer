import { NextResponse } from 'next/server';
import { llmProviders } from '@/lib/OpenAIProvider';
import fs from 'fs/promises';
import { CompanyProfile } from '@/types/CompanyProfile';

export async function POST(req: Request) {
    try {
        const companyProfile: CompanyProfile = await req.json();

        if (!companyProfile.name) {
            return NextResponse.json(
                { error: 'Company name is required' },
                { status: 400 }
            );
        }

        console.log(`Generating queries for: ${companyProfile.name}`);
        
        const responseText = await llmProviders.searchgpt.generateQueries(companyProfile);

        await fs.writeFile(
            'last_company_queries.json',
            JSON.stringify(responseText, null, 2),
            'utf-8'
        );

        /// as backup
        await fs.writeFile(
            companyProfile.name! + '_company_queries.json',
            JSON.stringify(responseText, null, 2),
            'utf-8'
        );

        return NextResponse.json(responseText, { status: 200 });
    } catch (error) {
        console.error('Error generating queries:', error);
        return NextResponse.json(
            { error: 'Failed to generate queries' },
            { status: 500 }
        );
    }
}
