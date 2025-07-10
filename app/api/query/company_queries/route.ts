import { NextResponse } from 'next/server';
import { llmProviders } from '@/lib/OpenAIProvider';
import fs from 'fs/promises';
import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';

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
        
        const responseText = await llmProviders.chatgpt.generateQueries(companyProfile);

        await fs.writeFile(
            'last_company_queries.json',
            JSON.stringify(responseText, null, 2),
            'utf-8'
        );

        /// as backup
        makeFinalizedBackup(responseText, companyProfile);

        return NextResponse.json(responseText, { status: 200 });
    } catch (error) {
        console.error('Error generating queries:', error);
        return NextResponse.json(
            { error: 'Failed to generate queries' },
            { status: 500 }
        );
    }
}


const makeFinalizedBackup = async (queries: InsightQuery[], company: CompanyProfile) => {
    try {
        const companyName = company.name;
        const dirPath = `./backups/${companyName}`;
        const fileName = `queries.json`;

        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Write the company
        await fs.writeFile(`${dirPath}/${fileName}`, JSON.stringify(queries, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error creating backup:', error);
    }
};