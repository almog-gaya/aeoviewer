import Anthropic from '@anthropic-ai/sdk';
import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import { BaseLLMProvider, LLMConfig, TaskType } from './base';
import { DialogueTurn } from '@/types/Planner';
import { RedditThread } from '@/types/RedditThread';

export class ClaudeProvider extends BaseLLMProvider {
    private anthropic: Anthropic;
    
    constructor(config: LLMConfig) {
        super(config);
        this.anthropic = new Anthropic({
            apiKey: config.apiKey,
        });
        console.log(`Claude Provider initialized with ${this.getModelInfo()}`);
    }

    private extractTextContent(content: any): string {
        if (Array.isArray(content)) {
            return content
                .filter(item => item.type === 'text')
                .map(item => item.text)
                .join('');
        }
        return content?.text || '';
    }

    async generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult> {
        try {
            console.log(`Claude: Generating response text using ${this.getModelInfo()}`);
            
            const systemPrompt = prompt.getResponseTextSystemPrompt(
                input.buying_journey_stage, 
                input.buyer_persona ?? 'null'
            );
            
            const message = await this.anthropic.messages.create({
                model: this.config.model || 'claude-3-5-sonnet-20241022',
                max_tokens: this.config.maxTokens || 2048,
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
                answer_engine: 'claude',
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
            console.log(`Claude: Generating company profile using ${this.getModelInfo()}`);
            
            const systemPrompt = prompt.generateCompanyProfilePrompt(companyName, companyWebsite);
            
            const message = await this.anthropic.messages.create({
                model: this.config.model || 'claude-3-5-sonnet-20241022',
                max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.3,
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
            console.log(`Claude: Generating queries using ${this.getModelInfo()}`);
            
            const systemPrompt = prompt.generateQueriesSystemPrompt(companyProfile);
            
            const message = await this.anthropic.messages.create({
                model: this.config.model || 'claude-3-5-sonnet-20241022',
                max_tokens: this.config.maxTokens || 2048,
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
            const systemPrompt = prompt.generatePlanSystemPrompt(companyProfile);
            
            const message = await this.anthropic.messages.create({
                model: this.config.model || 'claude-3-haiku-20240307',
                max_tokens: this.config.maxTokens || 1024,
                temperature: this.config.temperature || 0.7,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `Generate a plan for the company profile of ${companyProfile.name}`
                    }
                ]
            });
            
            const responseText = this.extractTextContent(message.content);
                
            const plan = this.parseJSONResponse(responseText, {
                userName: 'default_user',
                content: '',
                company: companyProfile,
            });
            
            return plan;
        } catch (error) {
            console.error('Error generating plan:', error);
            return [];
        }
    }

    async generateRedditThreads(companyProfile: CompanyProfile): Promise<RedditThread[]> {
        try {
            console.log(`Claude: Generating Reddit threads using ${this.getModelInfo()}`);
            
            const systemPrompt = prompt.generateRedditThreads(companyProfile);
            
            const message = await this.anthropic.messages.create({
                model: this.config.model || 'claude-3-5-sonnet-20241022',
                max_tokens: this.config.maxTokens || 2048,
                temperature: this.config.temperature || 0.7,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: `Generate Reddit threads for the company profile of ${companyProfile.name}`
                    }
                ]
            });
            
            const responseText = this.extractTextContent(message.content);
                
            const threads = this.parseJSONResponse(responseText, []);
            return threads as RedditThread[];
        } catch (error) {
            console.error('Error generating Reddit threads:', error);
            return [];
        }
    }
    
    async generateRawResponse(prompt: any): Promise<any> {
        try {
            console.log(`Claude: Generating Reddit threads using ${this.getModelInfo()}`);
         
            
            // const message = await this.anthropic.messages.create({
            //     model: this.config.model || 'claude-3-5-sonnet-20241022',
            //     max_tokens: this.config.maxTokens || 2048,
            //     temperature: this.config.temperature || 0.7,
            //     system: systemPrompt,
            //     messages: [
            //         {
            //             role: 'user',
            //             content: `Generate Reddit threads for the company profile of ${companyProfile.name}`
            //         }
            //     ]
            // });
            
         
        } catch (error) {
            console.error('Error generating Reddit threads:', error);
            return [];
        }
    }
} 