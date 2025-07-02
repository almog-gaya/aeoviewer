import { GoogleGenerativeAI } from '@google/generative-ai';
import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';
import * as prompt from '@/lib/prompts';
import { BaseLLMProvider, LLMConfig } from './base';

export class GeminiProvider extends BaseLLMProvider {
    private genAI: GoogleGenerativeAI;
    
    constructor(config: LLMConfig) {
        super(config);
        this.genAI = new GoogleGenerativeAI(config.apiKey);
    }

    async generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult> {
        try {
            const model = this.genAI.getGenerativeModel({ 
                model: this.config.model || 'gemini-1.5-flash' 
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
            const model = this.genAI.getGenerativeModel({ 
                model: this.config.model || 'gemini-1.5-flash' 
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
            const model = this.genAI.getGenerativeModel({ 
                model: this.config.model || 'gemini-1.5-flash' 
            });
            
            const systemPrompt = prompt.generateQueriesSystemPrompt(companyProfile);
            const fullPrompt = `${systemPrompt}\n\nUser: Generate queries for the company profile of ${companyProfile.name}`;
            
            const result = await model.generateContent(fullPrompt);
            const responseText = result.response.text() || '';
                
            console.info(`Generated queries: ${responseText}`);
            
            const queries = this.parseJSONResponse(responseText, []);
            return queries as InsightQuery[];
        } catch (error) {
            console.error('Error parsing generated queries JSON:', error);
            return [];
        }
    }
} 