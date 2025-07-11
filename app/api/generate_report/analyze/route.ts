import { PromptResult } from '@/types/PromptResult';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

import {
    YES_NO_REGEX,
    RANKING_REGEX,
    RANK_ITEM_REGEX,
    SENTIMENTS_REGEX,
    BUYER_JOURNEY_STAGES
} from '@/lib/constants';
import Sentiment from 'sentiment';
const sentiment = new Sentiment();

export async function POST(req: Request) {
    try {
        // Parse the incoming JSON data
        const data: any[] = await req.json();

        // Process each item in the JSON array
        const results: PromptResult[] = data.map((item) => {
            const result: PromptResult = {
                company_name: item.company_name ?? '',
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
                competitors_list: item.competitors_list ?? item.competitors ?? [],
                answer_engine: item.answer_engine!,
                citation: item.citation ?? [],
            };

            // Analyze sentiment score
            const sentimentMatch = result.response_text.match(SENTIMENTS_REGEX);
            if (sentimentMatch) {
                const sentimentScore = parseFloat(sentimentMatch[1]);
                if (!isNaN(sentimentScore) && sentimentScore >= 0 && sentimentScore <= 1) {
                    result.sentiment_score = sentimentScore;
                } else {
                    console.warn(`Invalid sentiment score found: ${sentimentMatch[1]}`);
                    result.sentiment_score = null; // Reset to null if invalid
                }
            } else {
                console.warn('No sentiment score found in response_text, using now sentiment library');
                /// use sentiment library 

                result.sentiment_score = calculateSentiment(result.response_text);
            }

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
                        if (company.toLowerCase() === result.company_name.toLowerCase()) {
                            rankingPosition = rankItems.length;
                        }
                    }
                }
            }

            // Fallback: Extract companies from prose if no explicit ranking
            if (rankItems.length === 0) {
                const uniqueCompanies = new Set<string>();
                let companyMatch;
                const proseCompanyReg = new RegExp(`\\b(${(result.competitors_list || []).concat(result.company_name).map(c => c.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).join('|')})(?::|\\b)`, 'gi');
                while ((companyMatch = proseCompanyReg.exec(result.response_text)) !== null) {
                    const company = companyMatch[1];
                    if (!uniqueCompanies.has(company)) {
                        uniqueCompanies.add(company);
                        rankItems.push(`${rankItems.length + 1}. ${company}`);
                        mentionedCompanies.push(company);
                        if (company.toLowerCase() === result.company_name.toLowerCase()) {
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
                    (c) => c.toLowerCase() === result.company_name.toLowerCase()
                );
                result.ranking_position = rankingPosition;
            }


            if (result.buying_journey_stage == "general") {
                /// check if company name is being mentioned in general question (xfunnel is doing same so)
                result.recommended = result.company_mentioned;
                }

            return result;
        });

        // Write to json output file: finalized_output.json
        await fs.writeFile('finalized_output.json', JSON.stringify(results, null, 2), 'utf-8');
        /// backup
        await fs.writeFile(`finalized_output_${results[0].company_name}.json`, JSON.stringify(results, null, 2), 'utf-8');
        makeFinalizedBackup(results);
        // Return the processed results
        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

const makeFinalizedBackup = async (results: PromptResult[]) => {
    try {
        const companyName = results[0].company_name;
        const dirPath = `./backups/${companyName}`;
        const fileName = `finalized_output.json`;

        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Write the file
        await fs.writeFile(`${dirPath}/${fileName}`, JSON.stringify(results, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error creating backup:', error);
    }
};


const calculateSentiment = (text: string): number | null | undefined => {
    try {
        if (!text || typeof text !== 'string') return 0;
        const result = sentiment.analyze(text);
        // Normalize score to [-1, 1]
        return Math.max(-1, Math.min(1, result.score / 10));
    } catch (_) {
        return null;
    }

};