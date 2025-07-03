import { GoogleGenerativeAI } from '@google/generative-ai';
import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import { BaseLLMProvider, LLMConfig, TaskType } from './base';
import { DialogueTurn } from '@/types/Planner';

export class GeminiProvider extends BaseLLMProvider {
    private genAI: GoogleGenerativeAI;
    
    constructor(config: LLMConfig) {
        super(config);
        this.genAI = new GoogleGenerativeAI(config.apiKey);
        console.log(`Gemini Provider initialized with ${this.getModelInfo()}`);
    }

    async generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult> {
        try {
            console.log(`Gemini: Generating response text using ${this.getModelInfo()}`);
            
            const model = this.genAI.getGenerativeModel({ 
                model: this.config.model || 'gemini-1.5-pro',
                generationConfig: {
                    maxOutputTokens: this.config.maxTokens || 2048,
                    temperature: this.config.temperature || 0.7,
                }
            });
            
            const systemPrompt = prompt.getResponseTextSystemPrompt(
                input.buying_journey_stage, 
                input.buyer_persona ?? 'null'
            );
            
            const fullPrompt = `${systemPrompt}\n\nUser: ${input.query_text}`;
            
            const result = await model.generateContent(fullPrompt);
            const responseText = result.response.text() || '';

            return {
                ...company,
                answer_engine: 'gemini',
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
            console.log(`Gemini: Generating company profile using ${this.getModelInfo()}`);
            
            const model = this.genAI.getGenerativeModel({ 
                model: this.config.model || 'gemini-1.5-pro',
                generationConfig: {
                    maxOutputTokens: this.config.maxTokens || 2048,
                    temperature: this.config.temperature || 0.3,
                }
            });
            
            const systemPrompt = prompt.generateCompanyProfilePrompt(companyName, companyWebsite);
            const fullPrompt = `${systemPrompt}\n\nUser: Generate a company profile for ${companyName} with website ${companyWebsite}`;
            
            const result = await model.generateContent(fullPrompt);
            const responseText = result.response.text() || '';
                
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
            console.log(`Gemini: Generating queries using ${this.getModelInfo()}`);
            
            const model = this.genAI.getGenerativeModel({ 
                model: this.config.model || 'gemini-1.5-flash',
                generationConfig: {
                    maxOutputTokens: this.config.maxTokens || 2048,
                    temperature: this.config.temperature || 0.7,
                }
            });
            
            const systemPrompt = prompt.generateQueriesSystemPrompt(companyProfile);
            const fullPrompt = `${systemPrompt}\n\nUser: Generate queries for the company profile of ${companyProfile.name}`;
            
            const result = await model.generateContent(fullPrompt);
            const responseText = result.response.text() || '';
                
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
            console.log(`Gemini: Generating plan using ${this.getModelInfo()}`);
            
            const model = this.genAI.getGenerativeModel({ 
                model: this.config.model || 'gemini-1.5-flash',
                generationConfig: {
                    maxOutputTokens: this.config.maxTokens || 2048,
                    temperature: this.config.temperature || 0.7,
                }
            });
            
            const systemPrompt = prompt.generatePlanSystemPrompt(companyProfile);
            const fullPrompt = `${systemPrompt}\n\nUser: Generate a plan for the company profile of ${companyProfile.name}`;
            
            const result = await model.generateContent(fullPrompt);
            const responseText = result.response.text() || '';
                
            console.info(`Generated plan using ${this.getModelInfo()}: ${responseText.substring(0, 200)}...`);
            
            const plan = this.parseJSONResponse(responseText, {});
            return plan;
        } catch (error) {
            console.error('Error parsing generated plan JSON:', error);
            return [];
        }
    }
} 