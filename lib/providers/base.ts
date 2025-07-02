import { CompanyProfile } from '@/types/CompanyProfile';
import { InsightQuery } from '@/types/InsightQuery';
import { PromptResult } from '@/types/PromptResult';

export interface LLMProvider {
    generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult>;
    generateCompanyProfile(companyName: string, companyWebsite: string): Promise<CompanyProfile>;
    generateQueries(companyProfile: CompanyProfile): Promise<InsightQuery[]>;
}

export interface LLMConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export enum LLMEngine {
    OPENAI = 'openai',
    CLAUDE = 'claude', 
    GEMINI = 'gemini',
    PERPLEXITY = 'perplexity',
    GROK = 'grok'
}

export interface LLMProviderFactory {
    getProvider(engine: LLMEngine, config?: LLMConfig): LLMProvider;
}

export abstract class BaseLLMProvider implements LLMProvider {
    protected config: LLMConfig;
    
    constructor(config: LLMConfig) {
        this.config = config;
    }

    abstract generateResponseText(input: InsightQuery, company: CompanyProfile): Promise<PromptResult>;
    abstract generateCompanyProfile(companyName: string, companyWebsite: string): Promise<CompanyProfile>;
    abstract generateQueries(companyProfile: CompanyProfile): Promise<InsightQuery[]>;

    protected handleError(error: any, operation: string): never {
        console.error(`Error in ${operation}:`, error);
        throw new Error(`Failed to ${operation}: ${error.message}`);
    }

    protected parseJSONResponse(response: string, fallback: any = null): any {
        try {
            return JSON.parse(response);
        } catch (error) {
            console.warn('Failed to parse JSON response:', error);
            return fallback;
        }
    }
} 