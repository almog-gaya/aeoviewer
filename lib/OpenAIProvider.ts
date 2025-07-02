import { getSystemPrompt } from '@/lib/prompts';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult'; 
import OpenAI from 'openai';
interface LLMProvider {
    generateCompletion(input: InsightQuery): Promise<PromptResult>;
}


class OpenAIProvider implements LLMProvider {
    private openai: OpenAI;
    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    async generateCompletion(input: InsightQuery): Promise<PromptResult> {
        const systemPrompt = getSystemPrompt(input.buying_journey_stage, input.buyer_persona ?? 'null')
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
}

export { OpenAIProvider };