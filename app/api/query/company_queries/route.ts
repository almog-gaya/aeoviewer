

import { NextResponse } from 'next/server';
import { llmProvider } from '@/lib/OpenAIProvider';
import fs from 'fs/promises';
import { CompanyProfile } from '@/types/CompanyProfile';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const companyProfile: CompanyProfile = body;

        if (!companyProfile) {
            return NextResponse.json(
                { error: 'Company profile data is required' },
                { status: 400 }
            );
        } 

        const responseText = await llmProvider.generateQueries(companyProfile);


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

        return NextResponse.json({ success: true, data: responseText });
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request format', details: String(error) },
            { status: 500 }
        );
    }
}
