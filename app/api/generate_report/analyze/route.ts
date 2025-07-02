import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

export const MENTIONED_COMPANY = 'BATCH';
export const COMPETITORS = [
    'Cornbread Hemp',
    'CBDistillery',
    'Lazarus Naturals',
    'Joy Organics',
    'Medterra',
    'CBDfx',
    'Five CBD',
];

// Updated regex patterns
const YES_NO_REGEX = /^\s*(Yes|No)\s*$/i;
const RANKING_REGEX = /(?:#+|\*\*)?\s*Forced Ranking.*?\n+([\s\S]*?)(?=(?:\n{1,}(?:#+|\*\*|$)|\n{2,}|$))/i; // Flexible header and end condition
const RANK_ITEM_REGEX = /^\s*(?:\d+\.|##\s*\d+\.)\s*(?:\*\*(.*?)\*\*(?::|\s*-|\s|$)|(.+?)(?::|\s*-|\s|$))/gm; // Handle numbered or prose items
const PROSE_COMPANY_REGEX = new RegExp(`\\b(${COMPETITORS.concat(MENTIONED_COMPANY).map(c => c.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')})(?::|\\b)`, 'gi'); // Match company names in prose

export async function POST(req: Request) {
    try {
        // Parse the incoming JSON data
        const data: any[] = await req.json();

        // Process each item in the JSON array
        const results: PromptResult[] = data.map((item) => {
            const result: PromptResult = {
                query_text: item.query_text ?? '',
                response_text: item.response_text ?? '',
                buyer_persona: item.buyer_persona ?? null,
                buying_journey_stage: item.buying_journey_stage ?? null,
                sentiment_score: item.sentiment_score ?? null,
                recommended: item.recommended ?? false,
                company_mentioned: item.company_mentioned ?? false,
                mentioned_companies: item.mentioned_companies ?? [],
                rank_list: item.rank_list ?? '',
                ranking_position: item.ranking_position ?? null,
                solution_analysis: item.solution_analysis ?? null,
                competitors_list: COMPETITORS,
                answer_engine: 'searchgpt',
            };

            // Analyze response_text for Yes/No answers
            const yesNoMatch = result.response_text.match(YES_NO_REGEX);
            if (yesNoMatch) {
                result.solution_analysis = {
                    has_feature: yesNoMatch[1].toUpperCase(),
                };
                return result;
            }

            // Analyze response_text for ranking/comparison
            let rankItems: string[] = [];
            let mentionedCompanies: string[] = [];
            let rankingPosition: number | null = null;

            // Try explicit ranking section first
            const rankingMatch = result.response_text.match(RANKING_REGEX);
            if (rankingMatch) {
                const rankingText = rankingMatch[1].trim();
                let rankMatch;
                while ((rankMatch = RANK_ITEM_REGEX.exec(rankingText)) !== null) {
                    // Capture company name from bolded or plain text
                    const company = (rankMatch[1] || rankMatch[2]).trim();
                    if (company && !rankItems.includes(`${rankItems.length + 1}. ${company}`)) {
                        rankItems.push(`${rankItems.length + 1}. ${company}`);
                        if (!mentionedCompanies.includes(company)) {
                            mentionedCompanies.push(company);
                        }
                        if (company.toLowerCase() === MENTIONED_COMPANY.toLowerCase()) {
                            rankingPosition = rankItems.length;
                        }
                    }
                }
            }

            // Fallback: Extract companies from prose if no explicit ranking
            if (rankItems.length === 0) {
                const uniqueCompanies = new Set<string>();
                let companyMatch;
                while ((companyMatch = PROSE_COMPANY_REGEX.exec(result.response_text)) !== null) {
                    const company = companyMatch[1];
                    if (!uniqueCompanies.has(company)) {
                        uniqueCompanies.add(company);
                        rankItems.push(`${rankItems.length + 1}. ${company}`);
                        mentionedCompanies.push(company);
                        if (company.toLowerCase() === MENTIONED_COMPANY.toLowerCase()) {
                            rankingPosition = rankItems.length;
                        }
                    }
                }
            }

            // Update fields if any companies were found
            if (rankItems.length > 0) {
                result.rank_list = rankItems.join('\n');
                result.mentioned_companies = mentionedCompanies;
                result.company_mentioned = mentionedCompanies.some(
                    (c) => c.toLowerCase() === MENTIONED_COMPANY.toLowerCase()
                );
                result.ranking_position = rankingPosition;
            }

            return result;
        });

        // Write to json output file: finalized_output.json
        await fs.writeFile('finalized_output.json', JSON.stringify(results, null, 2), 'utf-8');

        // Return the processed results
        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}