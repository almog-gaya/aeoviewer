import OpenAI from 'openai';
import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import { BaseLLMProvider, LLMConfig } from './base';

export class OpenAIProvider extends BaseLLMProvider {
    private openai: OpenAI;
    
    constructor(config: LLMConfig) {
        super(config);
        this.openai = new OpenAI({ 
            apiKey: config.apiKey 
        });
    }

    async generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult> {
        try {
            const systemPrompt = prompt.getResponseTextSystemPrompt(
                input.buying_journey_stage, 
                input.buyer_persona ?? 'null'
            );
            
            const completion = await this.openai.chat.completions.create({
                model: this.config.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: input.query_text }
                ],
                max_tokens: this.config.maxTokens || 512,
                temperature: this.config.temperature || 0.7,
            });

            const responseText = completion.choices?.[0]?.message?.content || '';

            return {
                ...company,
                answer_engine: 'chatgpt',
                company_name: company.name,
                query_text: input.query_text,
                response_text: responseText,
                buyer_persona: input.buyer_persona || undefined,
                buying_journey_stage: input.buying_journey_stage || undefined,
            };
        } catch (error) {
            this.handleError(error, 'generate response text');
        }
    }

    async generateCompanyProfile(companyName: string, companyWebsite: string): Promise<CompanyProfile> {
        try {
            const systemPrompt = prompt.generateCompanyProfilePrompt(companyName, companyWebsite);
            
            const completion = await this.openai.chat.completions.create({
                model: this.config.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate a company profile for ${companyName} with website ${companyWebsite}` }
                ],
                max_tokens: this.config.maxTokens || 1024,
                temperature: this.config.temperature || 0.7,
            });
            
            const responseText = completion.choices?.[0]?.message?.content || '';
            const profile = this.parseJSONResponse(responseText, {
                name: companyName,
                companyWebsite: companyWebsite,
            });
            
            return profile;
        } catch (error) {
            console.error('Error parsing company profile JSON:', error);
            return {
                name: companyName,
                companyWebsite: companyWebsite,
            };
        }
    }

    async generateQueries(companyProfile: CompanyProfile): Promise<InsightQuery[]> {
        try {
            const systemPrompt = prompt.generateQueriesSystemPrompt(companyProfile);
            
            const completion = await this.openai.chat.completions.create({
                model: this.config.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate queries for the company profile of ${companyProfile.name}` }
                ],
                max_tokens: this.config.maxTokens || 1024,
                temperature: this.config.temperature || 0.7,
            });
            
            const responseText = completion.choices?.[0]?.message?.content || '';
            console.info(`Generated queries: ${responseText}`);
            
            const queries = this.parseJSONResponse(responseText, []);
            return queries as InsightQuery[];
        } catch (error) {
            console.error('Error parsing generated queries JSON:', error);
            return [];
        }
    }
} 