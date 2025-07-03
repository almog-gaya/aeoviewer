import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import { BaseLLMProvider, LLMConfig } from './base';

export class PerplexityProvider extends BaseLLMProvider {
    private readonly baseURL = 'https://api.perplexity.ai/chat/completions';
    
    constructor(config: LLMConfig) {
        super(config);
    }

    private async makeRequest(messages: Array<{ role: string; content: string }>): Promise<string> {
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model || 'llama-3.1-sonar-small-128k-online',
                messages,
                max_tokens: this.config.maxTokens || 512,
                temperature: this.config.temperature || 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    async generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult> {
        try {
            const systemPrompt = prompt.getResponseTextSystemPrompt(
                input.buying_journey_stage, 
                input.buyer_persona ?? 'null'
            );
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: input.query_text }
            ];
            
            const responseText = await this.makeRequest(messages);

            return {
                ...company,
                answer_engine: 'perplexity',
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
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a company profile for ${companyName} with website ${companyWebsite}` }
            ];
            
            const responseText = await this.makeRequest(messages);
                
            const profile = this.parseJSONResponse(responseText, {
                name: companyName,
                companyWebsite: companyWebsite,
            });
            
            return profile;
        } catch (error) {
            console.error('Error generating company profile:', error);
            return {
                name: companyName,
                companyWebsite: companyWebsite,
            };
        }
    }

    async generateQueries(companyProfile: CompanyProfile): Promise<InsightQuery[]> {
        try {
            const systemPrompt = prompt.generateQueriesSystemPrompt(companyProfile);
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate queries for the company profile of ${companyProfile.name}` }
            ];
            
            const responseText = await this.makeRequest(messages);
                
            console.info(`Generated queries: ${responseText}`);
            
            const queries = this.parseJSONResponse(responseText, []);
            return queries as InsightQuery[];
        } catch (error) {
            console.error('Error parsing generated queries JSON:', error);
            return [];
        }
    }
} 