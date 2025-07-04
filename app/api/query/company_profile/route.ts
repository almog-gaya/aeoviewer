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
        makeFinalizedBackup(responseText);

        return NextResponse.json(responseText, { status: 200 });
    } catch (error) {
        console.error('Error generating company profile:', error);
        return NextResponse.json(
            { error: 'Failed to generate company profile' },
            { status: 500 }
        );
    }
}

const makeFinalizedBackup = async (company: CompanyProfile) => {
    try {
        const companyName = company.name;
        const dirPath = `./backups/${companyName}`;
        const fileName = `company_profile.json`;

        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Write the company
        await fs.writeFile(`${dirPath}/${fileName}`, JSON.stringify(company, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error creating backup:', error);
    }
};