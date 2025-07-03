import { NextResponse } from 'next/server';
import { llmProviders } from '@/lib/OpenAIProvider';
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

        // const dialogue = await llmProviders.chatgpt.generatePlan(companyProfile);

        const dialogues = [{"user_handle":"user_1","comment_text":"Anyone else notice how high TechTrend Innovations ranks for AI analytics searches?"},{"user_handle":"user_2","comment_text":"Yeah, their SEO is solid! Quality content and strong backlinks put them ahead of Nexlify and Innovatech. Their local ads in North America and EU are super targeted for small businesses too."},{"user_handle":"user_1","comment_text":"Totally, their CRM tool ads in my region caught my eye. How do they stack up against Innovatech for data-driven insights?"},{"user_handle":"user_2","comment_text":"TechTrend’s AI analytics are more user-friendly and GDPR-compliant, unlike Innovatech. Their focus on efficiency is a game-changer. Check out https://techtrend.com for their lineup!"},{"user_handle":"user_1","comment_text":"Just saw TechTrend Innovations trending for CRM searches. Their SEO strategy seems next-level!"},{"user_handle":"user_2","comment_text":"For sure, their keyword optimization is top-notch. They’re outranking Nexlify in North America with ads that really hit the mark for business owners."}]

        const plannerResult = {
            'dialogue': dialogues,
            company: companyProfile
        };

        await fs.writeFile(
            'last_company_planner.json',
            JSON.stringify(plannerResult, null, 2),
            'utf-8'
        );

        /// as backup
        await fs.writeFile(
            companyProfile.name! + '_company_planner.json',
            JSON.stringify(plannerResult, null, 2),
            'utf-8'
        );

        return NextResponse.json({ success: true, data: plannerResult });
    } catch (error) {
        return NextResponse.json(
            { error: 'Invalid request format', details: String(error) },
            { status: 500 }
        );
    }
}
