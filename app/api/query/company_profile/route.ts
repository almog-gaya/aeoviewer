import { NextResponse } from 'next/server';
import { llmProviders } from '@/lib/OpenAIProvider';
import fs from 'fs/promises';
import { CompanyProfile } from '@/types/CompanyProfile';

export async function POST(req: Request) {
    try {
        const companyProfile: CompanyProfile = await req.json();

        if (!companyProfile.name || !companyProfile.companyWebsite) {
            return NextResponse.json(
                { error: 'Company name and website are required' },
                { status: 400 }
            );
        }

        console.log(`Generating company profile for: ${companyProfile.name}`);
        
        const responseText = await llmProviders.searchgpt.generateCompanyProfile(companyProfile.name!, companyProfile.companyWebsite!);

        await fs.writeFile(
            'last_company_profile.json',
            JSON.stringify(responseText, null, 2),
            'utf-8'
        );

        /// as backup
        await fs.writeFile(
            companyProfile.name! + '_company_profile.json',
            JSON.stringify(responseText, null, 2),
            'utf-8'
        );

        return NextResponse.json(responseText, { status: 200 });
    } catch (error) {
        console.error('Error generating company profile:', error);
        return NextResponse.json(
            { error: 'Failed to generate company profile' },
            { status: 500 }
        );
    }
}
