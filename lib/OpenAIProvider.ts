import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import OpenAI from 'openai';
interface LLMProvider {
    generateResponseText(input: InsightQuery): Promise<PromptResult>;
}

class OpenAIProvider implements LLMProvider {
    private openai: OpenAI;
    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    async generateResponseText(input: InsightQuery): Promise<PromptResult> {
        const systemPrompt = prompt.getResponseTextSystemPrompt(input.buying_journey_stage, input.buyer_persona ?? 'null')
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: input.query_text }
            ],
            max_tokens: 512,
        });

        const responseText = completion.choices?.[0]?.message?.content || '';

        return {
            query_text: input.query_text,
            response_text: responseText,
            buyer_persona: input.buyer_persona || undefined,
            buying_journey_stage: input.buying_journey_stage || undefined,
        };
    }

    async generateCompanyProfile(companyName: string, companyWebsite: string): Promise<CompanyProfile> {
        const systemPrompt = prompt.generateCompanyProfilePrompt(companyName, companyWebsite);
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a company profile for ${companyName} with website ${companyWebsite}` }
            ],
            max_tokens: 1024,
        });
        const responseText = completion.choices?.[0]?.message?.content || '';
        try {
            const profile = JSON.parse(responseText);
            return profile;
        }
        catch (error) {
            console.error('Error parsing company profile JSON:', error);
            return {
                name: companyName,
                companyWebsite: companyWebsite,
            }
        }
    }

    async generateQueries(companyProfile: CompanyProfile) {
        const systemPrompt = prompt.generateQueriesSystemPrompt(companyProfile);
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate queries for the company profile of ${companyProfile.name}` }
            ],
            max_tokens: 1024,
        });
        const responseText = completion.choices?.[0]?.message?.content || '';
        try {
            console.info(`Generated queries: ${responseText}`);
            const queries = JSON.parse(responseText);
            return queries as InsightQuery[];
        } catch (error) {
            console.error('Error parsing generated queries JSON:', error);
            return [];
        }
    }
}

const llmProvider = new OpenAIProvider(process.env.OPENAI_API_KEY!);

export { llmProvider };