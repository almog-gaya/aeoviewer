import Anthropic from '@anthropic-ai/sdk';
import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import { BaseLLMProvider, LLMConfig } from './base';

export class ClaudeProvider extends BaseLLMProvider {
    private anthropic: Anthropic;
    
    constructor(config: LLMConfig) {
        super(config);
        this.anthropic = new Anthropic({
            apiKey: config.apiKey,
        });
    }

    private extractTextContent(content: any[]): string {
        return content
            .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
            .map(block => block.text)
            .join('') || '';
    }

    async generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult> {
        try {
            const systemPrompt = prompt.getResponseTextSystemPrompt(
                input.buying_journey_stage, 
                input.buyer_persona ?? 'null'
            );
            
            const message = await this.anthropic.messages.create({
                model: this.config.model || 'claude-3-haiku-20240307',
                max_tokens: this.config.maxTokens || 512,
                temperature: this.config.temperature || 0.7,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: input.query_text
                    }
                ]
            });

            const responseText = this.extractTextContent(message.content);

            return {
                ...company,
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
            
            const message = await this.anthropic.messages.create({
                model: this.config.model || 'claude-3-haiku-20240307',
                max_tokens: this.config.maxTokens || 1024,
                temperature: this.config.temperature || 0.7,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `Generate a company profile for ${companyName} with website ${companyWebsite}`
                    }
                ]
            });
            
            const responseText = this.extractTextContent(message.content);
                
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
            
            const message = await this.anthropic.messages.create({
                model: this.config.model || 'claude-3-haiku-20240307',
                max_tokens: this.config.maxTokens || 1024,
                temperature: this.config.temperature || 0.7,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `Generate queries for the company profile of ${companyProfile.name}`
                    }
                ]
            });
            
            const responseText = this.extractTextContent(message.content);
                
            console.info(`Generated queries: ${responseText}`);
            
            const queries = this.parseJSONResponse(responseText, []);
            return queries as InsightQuery[];
        } catch (error) {
            console.error('Error parsing generated queries JSON:', error);
            return [];
        }
    }
} 