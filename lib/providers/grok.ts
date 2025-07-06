import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import { BaseLLMProvider, LLMConfig, TaskType } from './base';
import { DialogueTurn } from '@/types/Planner';
import { RedditThread } from '@/types/RedditThread';

export class GrokProvider extends BaseLLMProvider {
    private readonly baseURL = 'https://api.x.ai/v1/chat/completions';
    
    constructor(config: LLMConfig) {
        super(config);
        console.log(`Grok Provider initialized with ${this.getModelInfo()}`);
    }

    private async makeRequest(messages: Array<{ role: string; content: string }>): Promise<string> {
        const data = await this.makeVPNRequest(
            this.baseURL,
            'POST',
            {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            JSON.stringify({
                model: this.config.model || 'grok-beta',
                messages,
                max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
            })
        );

        return data.choices?.[0]?.message?.content || '';
    }

    async generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult> {
        try {
            console.log(`Grok: Generating response text using ${this.getModelInfo()}`);
            
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
                answer_engine: 'grok',
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
            console.log(`Grok: Generating company profile using ${this.getModelInfo()}`);
            
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
            console.log(`Grok: Generating queries using ${this.getModelInfo()}`);
            
            const systemPrompt = prompt.generateQueriesSystemPrompt(companyProfile);
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate queries for the company profile of ${companyProfile.name}` }
            ];
            
            const responseText = await this.makeRequest(messages);
                
            console.info(`Generated queries using ${this.getModelInfo()}: ${responseText.substring(0, 200)}...`);
            
            const queries = this.parseJSONResponse(responseText, []);
            return queries as InsightQuery[];
        } catch (error) {
            console.error('Error parsing generated queries JSON:', error);
            return [];
        }
    }

    async generatePlan(companyProfile: CompanyProfile): Promise<DialogueTurn[]> {
        try {
            console.log(`Grok: Generating plan using ${this.getModelInfo()}`);
            
            const systemPrompt = prompt.generatePlanSystemPrompt(companyProfile);
            
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a plan for the company profile of ${companyProfile.name}` }
            ];
            
            const responseText = await this.makeRequest(messages);
                
            console.info(`Generated plan using ${this.getModelInfo()}: ${responseText.substring(0, 200)}...`);
            
            const plan = this.parseJSONResponse(responseText, {});
            return plan;
        } catch (error) {
            console.error('Error parsing generated plan JSON:', error);
            return [];
        }
    }

    generateRedditThreads(companyProfile: CompanyProfile): Promise<RedditThread[]> {
        throw new Error('Grok does not support Reddit thread generation yet.');
    }
} 